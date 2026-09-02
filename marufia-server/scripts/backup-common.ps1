#Requires -Version 7.4

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:MarufiaBackupFormatVersion = 2
$script:MarufiaBackupPrefix = "marufia-postgres"
$script:MarufiaPreRestorePrefix = "marufia-pre-restore"
$script:MarufiaRestoreTestPrefix = "marufia_restore_test_"
$script:MarufiaPgsodiumKeyPath = "/etc/postgresql-custom/pgsodium_root.key"
$script:MarufiaBackupKdfIterations = 600000

function Get-MarufiaBackupSetPaths {
    param([Parameter(Mandatory = $true)][string]$DumpPath)

    $fullDumpPath = [System.IO.Path]::GetFullPath($DumpPath)
    if ([System.IO.Path]::GetExtension($fullDumpPath) -ne ".dump") {
        throw "O backup deve usar a extensão .dump."
    }
    $directory = Split-Path -Parent $fullDumpPath
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($fullDumpPath)
    return [pscustomobject]@{
        Dump = $fullDumpPath
        Metadata = Join-Path $directory "$stem.metadata.json"
        Checksum = Join-Path $directory "$stem.sha256"
        EncryptionKey = Join-Path $directory "$stem.pgsodium-key.enc"
    }
}

function Get-MarufiaRandomBytes {
    param([Parameter(Mandatory = $true)][ValidateRange(1, 4096)][int]$Count)

    $bytes = [byte[]]::new($Count)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return $bytes
}

function Get-MarufiaPgsodiumKeyBytes {
    $dockerCommand = Resolve-DockerCommand
    $encoded = (@(& $dockerCommand exec supabase-db base64 $script:MarufiaPgsodiumKeyPath 2>&1) -join "").Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($encoded)) {
        throw "Não foi possível ler a chave de criptografia persistente do PostgreSQL."
    }
    try {
        $bytes = [Convert]::FromBase64String($encoded)
    } catch {
        throw "A chave de criptografia persistente do PostgreSQL é inválida."
    }
    if ($bytes.Length -lt 16 -or $bytes.Length -gt 4096) {
        throw "A chave de criptografia persistente do PostgreSQL tem tamanho inesperado."
    }
    return $bytes
}

function Protect-MarufiaPgsodiumKey {
    param(
        [Parameter(Mandatory = $true)][byte[]]$Plaintext,
        [Parameter(Mandatory = $true)][string]$Password,
        [Parameter(Mandatory = $true)][string]$DestinationPath
    )

    if ([string]::IsNullOrWhiteSpace($Password) -or $Password.Length -lt 32) {
        throw "A senha do PostgreSQL não é adequada para proteger a chave do backup."
    }
    $salt = Get-MarufiaRandomBytes -Count 16
    $nonce = Get-MarufiaRandomBytes -Count 12
    $tag = [byte[]]::new(16)
    $ciphertext = [byte[]]::new($Plaintext.Length)
    $passwordBytes = [System.Text.Encoding]::UTF8.GetBytes($Password)
    $associatedData = [System.Text.Encoding]::UTF8.GetBytes("marufia-pgsodium-key-v1")
    $derivedKey = [System.Security.Cryptography.Rfc2898DeriveBytes]::Pbkdf2(
        $passwordBytes,
        $salt,
        $script:MarufiaBackupKdfIterations,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        32
    )
    $aes = [System.Security.Cryptography.AesGcm]::new($derivedKey, 16)
    try {
        $aes.Encrypt($nonce, $Plaintext, $ciphertext, $tag, $associatedData)
        $payload = [ordered]@{
            formatVersion = 1
            algorithm = "AES-256-GCM"
            kdf = "PBKDF2-SHA256"
            iterations = $script:MarufiaBackupKdfIterations
            salt = [Convert]::ToBase64String($salt)
            nonce = [Convert]::ToBase64String($nonce)
            tag = [Convert]::ToBase64String($tag)
            ciphertext = [Convert]::ToBase64String($ciphertext)
        } | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($DestinationPath, $payload, [System.Text.UTF8Encoding]::new($false))
    } finally {
        $aes.Dispose()
        [System.Array]::Clear($derivedKey)
        [System.Array]::Clear($passwordBytes)
    }
}

function Unprotect-MarufiaPgsodiumKey {
    param(
        [Parameter(Mandatory = $true)][string]$SourcePath,
        [Parameter(Mandatory = $true)][string]$Password
    )

    try {
        $payload = [System.IO.File]::ReadAllText($SourcePath) | ConvertFrom-Json
        if ($payload.formatVersion -ne 1 -or $payload.algorithm -ne "AES-256-GCM" -or
            $payload.kdf -ne "PBKDF2-SHA256" -or
            [int]$payload.iterations -ne $script:MarufiaBackupKdfIterations) {
            throw "Formato incompatível."
        }
        $salt = [Convert]::FromBase64String([string]$payload.salt)
        $nonce = [Convert]::FromBase64String([string]$payload.nonce)
        $tag = [Convert]::FromBase64String([string]$payload.tag)
        $ciphertext = [Convert]::FromBase64String([string]$payload.ciphertext)
    } catch {
        throw "A cópia protegida da chave de criptografia é inválida."
    }
    if ($salt.Length -ne 16 -or $nonce.Length -ne 12 -or $tag.Length -ne 16 -or $ciphertext.Length -lt 16) {
        throw "A cópia protegida da chave de criptografia tem tamanho inválido."
    }
    $passwordBytes = [System.Text.Encoding]::UTF8.GetBytes($Password)
    $associatedData = [System.Text.Encoding]::UTF8.GetBytes("marufia-pgsodium-key-v1")
    $derivedKey = [System.Security.Cryptography.Rfc2898DeriveBytes]::Pbkdf2(
        $passwordBytes,
        $salt,
        $script:MarufiaBackupKdfIterations,
        [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        32
    )
    $plaintext = [byte[]]::new($ciphertext.Length)
    $aes = [System.Security.Cryptography.AesGcm]::new($derivedKey, 16)
    try {
        $aes.Decrypt($nonce, $ciphertext, $tag, $plaintext, $associatedData)
        return $plaintext
    } catch {
        [System.Array]::Clear($plaintext)
        throw "A chave protegida não pôde ser aberta. Preserve o arquivo .env correspondente ao backup."
    } finally {
        $aes.Dispose()
        [System.Array]::Clear($derivedKey)
        [System.Array]::Clear($passwordBytes)
    }
}

function Get-MarufiaDatabaseImage {
    $dockerCommand = Resolve-DockerCommand
    $image = (& $dockerCommand inspect supabase-db --format "{{.Config.Image}}" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($image)) {
        throw "Não foi possível identificar a versão do PostgreSQL em execução."
    }
    return $image
}

function Copy-MarufiaDumpToContainer {
    param([Parameter(Mandatory = $true)][string]$DumpPath)

    $dockerCommand = Resolve-DockerCommand
    $containerPath = "/tmp/marufia-restore-$PID-$([guid]::NewGuid().ToString('N')).dump"
    & $dockerCommand cp $DumpPath "supabase-db:$containerPath"
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível copiar o backup para a área temporária de restauração."
    }
    return $containerPath
}

function Remove-MarufiaContainerTemporaryFile {
    param([Parameter(Mandatory = $true)][string]$ContainerPath)

    if ($ContainerPath -notmatch "^/tmp/marufia-(?:backup|restore)-[A-Za-z0-9-]+\.dump$") {
        throw "A remoção de um arquivo temporário fora do escopo foi recusada."
    }
    $dockerCommand = Resolve-DockerCommand
    $null = & $dockerCommand exec supabase-db rm --force $ContainerPath 2>&1
}

function Test-MarufiaArchiveInContainer {
    param([Parameter(Mandatory = $true)][string]$ContainerPath)

    $dockerCommand = Resolve-DockerCommand
    $listing = & $dockerCommand exec supabase-db pg_restore --list $ContainerPath 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "O dump não passou na leitura estrutural do pg_restore."
    }
    $entries = @($listing | Where-Object { $_ -and -not ([string]$_).StartsWith(";") }).Count
    if ($entries -lt 1) {
        throw "O dump não contém objetos restauráveis."
    }
    return $entries
}

function Write-MarufiaChecksumManifest {
    param(
        [Parameter(Mandatory = $true)][string]$DumpPath,
        [Parameter(Mandatory = $true)][string]$EncryptionKeyPath,
        [Parameter(Mandatory = $true)][string]$DestinationPath
    )

    $dumpHash = (Get-FileHash -LiteralPath $DumpPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $keyHash = (Get-FileHash -LiteralPath $EncryptionKeyPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $content = "$dumpHash  $([System.IO.Path]::GetFileName($DumpPath))`n$keyHash  $([System.IO.Path]::GetFileName($EncryptionKeyPath))`n"
    [System.IO.File]::WriteAllText($DestinationPath, $content, [System.Text.UTF8Encoding]::new($false))
    return [pscustomobject]@{ DumpHash = $dumpHash; EncryptionKeyHash = $keyHash }
}

function Assert-MarufiaBackupSet {
    param(
        [Parameter(Mandatory = $true)][string]$DumpPath,
        [Parameter(Mandatory = $true)][string]$Password,
        [switch]$SkipKeyDecryption,
        [switch]$SkipArchiveRead
    )

    $paths = Get-MarufiaBackupSetPaths -DumpPath $DumpPath
    foreach ($path in @($paths.Dump, $paths.Metadata, $paths.Checksum, $paths.EncryptionKey)) {
        if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
            throw "O conjunto de backup está incompleto: $([System.IO.Path]::GetFileName($path))"
        }
    }
    $checksumLines = @([System.IO.File]::ReadAllLines($paths.Checksum) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($checksumLines.Count -ne 2) { throw "O manifesto SHA-256 do backup é inválido." }
    $expected = @{}
    foreach ($line in $checksumLines) {
        if ($line -notmatch "^(?<hash>[0-9a-f]{64})  (?<file>[A-Za-z0-9._-]+)$") {
            throw "O manifesto SHA-256 do backup é inválido."
        }
        $expected[$Matches.file] = $Matches.hash
    }
    foreach ($path in @($paths.Dump, $paths.EncryptionKey)) {
        $name = [System.IO.Path]::GetFileName($path)
        if (-not $expected.ContainsKey($name)) { throw "O manifesto não cobre todos os arquivos do backup." }
        $actualHash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actualHash -ne $expected[$name]) { throw "A integridade SHA-256 do backup falhou." }
    }
    try {
        $metadata = [System.IO.File]::ReadAllText($paths.Metadata) | ConvertFrom-Json
        if ($metadata.createdAt -is [DateTime]) {
            $createdAt = [DateTimeOffset]::new(([DateTime]$metadata.createdAt).ToUniversalTime())
        } elseif ($metadata.createdAt -is [DateTimeOffset]) {
            $createdAt = [DateTimeOffset]$metadata.createdAt
        } else {
            $createdAt = [DateTimeOffset]::Parse(
                [string]$metadata.createdAt,
                [System.Globalization.CultureInfo]::InvariantCulture,
                [System.Globalization.DateTimeStyles]::RoundtripKind
            )
        }
    } catch {
        throw "Os metadados do backup são inválidos."
    }
    if ($metadata.formatVersion -ne $script:MarufiaBackupFormatVersion -or
        $metadata.kind -ne "marufia-postgres-logical" -or
        $metadata.database -ne "postgres" -or
        $metadata.dump.fileName -ne [System.IO.Path]::GetFileName($paths.Dump) -or
        $metadata.encryptionKey.fileName -ne [System.IO.Path]::GetFileName($paths.EncryptionKey) -or
        [long]$metadata.dump.sizeBytes -ne (Get-Item -LiteralPath $paths.Dump).Length -or
        [long]$metadata.encryptionKey.sizeBytes -ne (Get-Item -LiteralPath $paths.EncryptionKey).Length -or
        $metadata.dump.sha256 -ne $expected[[System.IO.Path]::GetFileName($paths.Dump)] -or
        $metadata.encryptionKey.sha256 -ne $expected[[System.IO.Path]::GetFileName($paths.EncryptionKey)]) {
        throw "Os metadados não correspondem aos arquivos do backup."
    }
    if (-not $SkipKeyDecryption) {
        $restoredKey = Unprotect-MarufiaPgsodiumKey -SourcePath $paths.EncryptionKey -Password $Password
        try {
            if ($restoredKey.Length -lt 16) { throw "A chave protegida do backup é inválida." }
        } finally {
            [System.Array]::Clear($restoredKey)
        }
    }
    $archiveEntries = [int]$metadata.dump.archiveEntries
    if (-not $SkipArchiveRead) {
        $containerPath = Copy-MarufiaDumpToContainer -DumpPath $paths.Dump
        try {
            $actualEntries = Test-MarufiaArchiveInContainer -ContainerPath $containerPath
            if ($actualEntries -ne $archiveEntries) {
                throw "O catálogo do dump difere dos metadados verificados."
            }
        } finally {
            Remove-MarufiaContainerTemporaryFile -ContainerPath $containerPath
        }
    }
    return [pscustomobject]@{ Paths = $paths; Metadata = $metadata; CreatedAt = $createdAt }
}

function New-MarufiaRestoreTestDatabase {
    $database = "$($script:MarufiaRestoreTestPrefix)$((Get-Date).ToUniversalTime().ToString('yyyyMMddHHmmss'))_${PID}_$([guid]::NewGuid().ToString('N').Substring(0, 6))"
    if ($database.Length -gt 63 -or $database -notmatch "^marufia_restore_test_[a-z0-9_]+$") {
        throw "Não foi possível gerar um nome seguro para o banco de teste."
    }
    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand exec supabase-db createdb --username=postgres --maintenance-db=template1 --template=template0 $database
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível criar o banco isolado de restauração." }
    return $database
}

function Remove-MarufiaRestoreTestDatabase {
    param([Parameter(Mandatory = $true)][string]$Database)

    if ($Database -notmatch "^marufia_restore_test_[a-z0-9_]+$") {
        throw "A remoção de um banco fora do escopo de teste foi recusada."
    }
    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand exec supabase-db dropdb --if-exists --force --username=postgres --maintenance-db=template1 $Database
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível remover o banco isolado de restauração." }
}

function Restore-MarufiaArchiveToDatabase {
    param(
        [Parameter(Mandatory = $true)][string]$ContainerPath,
        [Parameter(Mandatory = $true)][ValidatePattern("^[a-z][a-z0-9_]{0,62}$")][string]$Database
    )

    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand exec supabase-db pg_restore --exit-on-error --single-transaction --username=supabase_admin --dbname=$Database $ContainerPath
    if ($LASTEXITCODE -ne 0) { throw "O pg_restore falhou; a restauração não foi considerada válida." }
}

function Get-MarufiaRestoredDatabaseInventory {
    param([Parameter(Mandatory = $true)][ValidatePattern("^[a-z][a-z0-9_]{0,62}$")][string]$Database)

    $sql = @"
with expected(name) as (
  values ('profiles'), ('campaigns'), ('campaign_members'), ('characters'),
         ('rolls'), ('campaign_events'), ('campaign_presence'), ('campaign_sessions')
), public_tables as (
  select c.relname as name, c.relrowsecurity as rls
  from pg_catalog.pg_class c
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
), publication_tables as (
  select count(*)::int as count
  from pg_catalog.pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename in (select name from expected)
)
select json_build_object(
  'database', current_database(),
  'serverVersion', current_setting('server_version'),
  'missingTables', coalesce((select json_agg(e.name order by e.name) from expected e left join public_tables p using (name) where p.name is null), '[]'::json),
  'rlsDisabled', coalesce((select json_agg(e.name order by e.name) from expected e join public_tables p using (name) where not p.rls), '[]'::json),
  'migrationCount', (select count(*)::int from supabase_migrations.schema_migrations),
  'realtimeTableCount', (select count from publication_tables),
  'authUsers', (select count(*)::bigint from auth.users),
  'rowCounts', json_build_object(
    'profiles', (select count(*)::bigint from public.profiles),
    'campaigns', (select count(*)::bigint from public.campaigns),
    'campaign_members', (select count(*)::bigint from public.campaign_members),
    'characters', (select count(*)::bigint from public.characters),
    'rolls', (select count(*)::bigint from public.rolls),
    'campaign_events', (select count(*)::bigint from public.campaign_events),
    'campaign_presence', (select count(*)::bigint from public.campaign_presence),
    'campaign_sessions', (select count(*)::bigint from public.campaign_sessions)
  ),
  'requiredRpcs', json_build_object(
    'save_character_state', to_regprocedure('public.save_character_state(uuid,jsonb,bigint)') is not null,
    'record_roll', exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='record_roll')
  )
)::text;
"@
    $raw = Invoke-MarufiaDatabaseSql -Database $Database -TuplesOnly -Sql $sql
    try {
        $inventory = $raw | ConvertFrom-Json
    } catch {
        throw "O banco restaurado não produziu um inventário válido."
    }
    if (@($inventory.missingTables).Count -ne 0 -or @($inventory.rlsDisabled).Count -ne 0 -or
        [int]$inventory.migrationCount -lt 1 -or [int]$inventory.realtimeTableCount -ne 6 -or
        -not [bool]$inventory.requiredRpcs.save_character_state -or -not [bool]$inventory.requiredRpcs.record_roll) {
        throw "O banco restaurado não preservou schema, RLS, RPCs, migrations e Realtime esperados."
    }
    return $inventory
}

function Get-MarufiaRetentionSetting {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Environment,
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][ValidateRange(1, 366)][int]$Maximum
    )

    $value = 0
    if (-not $Environment.ContainsKey($Name) -or
        -not [int]::TryParse($Environment[$Name], [ref]$value) -or $value -lt 1 -or $value -gt $Maximum) {
        throw "$Name deve ser um inteiro entre 1 e $Maximum."
    }
    return $value
}

function Assert-MarufiaPathInsideBackupDirectory {
    param([Parameter(Mandatory = $true)][string]$Path)

    $backupRoot = [System.IO.Path]::GetFullPath($script:MarufiaBackupDirectory).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $candidate = [System.IO.Path]::GetFullPath($Path)
    if (-not $candidate.StartsWith($backupRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Uma remoção fora da pasta privada de backups foi recusada."
    }
}

function Select-MarufiaRetentionPoints {
    param(
        [Parameter(Mandatory = $true)][object[]]$Descriptors,
        [Parameter(Mandatory = $true)][ValidateRange(1, 366)][int]$DailyLimit,
        [Parameter(Mandatory = $true)][ValidateRange(1, 52)][int]$WeeklyLimit,
        [Parameter(Mandatory = $true)][string]$CurrentDumpPath
    )

    if ($Descriptors.Count -lt 1) { throw "A retenção exige ao menos um backup válido." }
    $ordered = @($Descriptors | Sort-Object CreatedAt -Descending)
    $protected = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
    $dailyKeys = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($descriptor in $ordered) {
        if ($dailyKeys.Count -ge $DailyLimit) { break }
        $dateKey = $descriptor.CreatedAt.LocalDateTime.ToString("yyyy-MM-dd", [System.Globalization.CultureInfo]::InvariantCulture)
        if ($dailyKeys.Add($dateKey)) { $null = $protected.Add([System.IO.Path]::GetFullPath($descriptor.DumpPath)) }
    }
    $weeklyKeys = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($descriptor in $ordered) {
        if ($weeklyKeys.Count -ge $WeeklyLimit) { break }
        $date = $descriptor.CreatedAt.LocalDateTime.Date
        $weekKey = "$([System.Globalization.ISOWeek]::GetYear($date))-$([System.Globalization.ISOWeek]::GetWeekOfYear($date).ToString('00'))"
        if ($weeklyKeys.Add($weekKey)) { $null = $protected.Add([System.IO.Path]::GetFullPath($descriptor.DumpPath)) }
    }
    $null = $protected.Add([System.IO.Path]::GetFullPath($CurrentDumpPath))
    return [pscustomobject]@{ Paths = $protected; Ordered = $ordered }
}

function Invoke-MarufiaBackupRetention {
    param(
        [Parameter(Mandatory = $true)][hashtable]$Environment,
        [Parameter(Mandatory = $true)][string]$CurrentDumpPath
    )

    $dailyLimit = Get-MarufiaRetentionSetting -Environment $Environment -Name "MARUFIA_BACKUP_RETENTION_DAYS" -Maximum 366
    $weeklyLimit = Get-MarufiaRetentionSetting -Environment $Environment -Name "MARUFIA_BACKUP_RETENTION_WEEKS" -Maximum 52
    $descriptors = [System.Collections.Generic.List[object]]::new()
    $candidates = @(Get-ChildItem -LiteralPath $script:MarufiaBackupDirectory -File -Filter "$($script:MarufiaBackupPrefix)-*.dump")
    foreach ($candidate in $candidates) {
        if ($candidate.BaseName -notmatch "^$([regex]::Escape($script:MarufiaBackupPrefix))-[0-9]{8}-[0-9]{6}$") { continue }
        try {
            $set = Assert-MarufiaBackupSet -DumpPath $candidate.FullName -Password $Environment["POSTGRES_PASSWORD"] -SkipKeyDecryption -SkipArchiveRead
            $descriptors.Add([pscustomobject]@{ DumpPath = $candidate.FullName; Set = $set; CreatedAt = $set.CreatedAt })
        } catch {
            Write-MarufiaMessage -Level WARNING -Message "Backup incompleto ou inválido preservado para revisão manual: $($candidate.Name)"
        }
    }
    if ($descriptors.Count -lt 1) {
        throw "A retenção foi recusada porque não existe backup regular válido."
    }
    $selection = Select-MarufiaRetentionPoints -Descriptors $descriptors.ToArray() -DailyLimit $dailyLimit -WeeklyLimit $weeklyLimit -CurrentDumpPath $CurrentDumpPath
    $protected = $selection.Paths
    $ordered = $selection.Ordered
    if ($protected.Count -lt 1) { throw "A retenção não encontrou um ponto válido para preservar." }

    $removed = 0
    foreach ($descriptor in $ordered) {
        if ($protected.Contains($descriptor.DumpPath)) { continue }
        if (($descriptors.Count - $removed) -le 1) {
            throw "A retenção se recusou a remover o último backup válido."
        }
        $paths = $descriptor.Set.Paths
        foreach ($path in @($paths.Metadata, $paths.Checksum, $paths.EncryptionKey, $paths.Dump)) {
            Assert-MarufiaPathInsideBackupDirectory -Path $path
            if (Test-Path -LiteralPath $path -PathType Leaf) { Remove-Item -LiteralPath $path -Force }
        }
        $removed += 1
        Write-MarufiaMessage -Level INFO -Message "Retenção removeu um ponto antigo validado: $([System.IO.Path]::GetFileName($descriptor.DumpPath))"
    }
    Write-MarufiaMessage -Level INFO -Message "Retenção concluída: $($protected.Count) ponto(s) diário/semanal preservado(s); $removed removido(s)."
}
