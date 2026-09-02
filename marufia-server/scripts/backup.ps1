#Requires -Version 7.4

[CmdletBinding()]
param(
    [ValidateSet("Regular", "PreRestore")]
    [string]$Purpose = "Regular",

    [switch]$SkipRetention,

    [switch]$PassThru,

    [switch]$ThrowOnError
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "backup-common.ps1")

$lockStream = $null
$lockPath = ""
$containerPath = ""
$paths = $null
$temporaryPaths = [System.Collections.Generic.List[string]]::new()
$createdPaths = [System.Collections.Generic.List[string]]::new()
$plainKey = $null

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    if (-not (Test-Path -LiteralPath $script:MarufiaBackupDirectory -PathType Container)) {
        $null = New-Item -ItemType Directory -Path $script:MarufiaBackupDirectory
    }
    $lockPath = Join-Path $script:MarufiaBackupDirectory ".backup.lock"
    try {
        $lockStream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    } catch {
        throw "Outro backup ou restore já está usando a pasta privada. Aguarde a conclusão."
    }

    $environment = Get-MarufiaEnvironmentMap
    $prefix = if ($Purpose -eq "PreRestore") { $script:MarufiaPreRestorePrefix } else { $script:MarufiaBackupPrefix }
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $dumpPath = Join-Path $script:MarufiaBackupDirectory "$prefix-$stamp.dump"
    $paths = Get-MarufiaBackupSetPaths -DumpPath $dumpPath
    foreach ($path in @($paths.Dump, $paths.Metadata, $paths.Checksum, $paths.EncryptionKey)) {
        if (Test-Path -LiteralPath $path) { throw "Já existe um arquivo de backup com o mesmo horário; tente novamente em alguns segundos." }
    }

    $dockerCommand = Resolve-DockerCommand
    $ready = (& $dockerCommand exec supabase-db pg_isready --username=postgres --dbname=postgres 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw "O PostgreSQL não está pronto para criar o backup: $ready" }

    $containerPath = "/tmp/marufia-backup-$PID-$([guid]::NewGuid().ToString('N')).dump"
    & $dockerCommand exec supabase-db pg_dump --format=custom --compress=gzip:9 --no-password --username=supabase_admin --dbname=postgres --file=$containerPath
    if ($LASTEXITCODE -ne 0) { throw "O pg_dump falhou; nenhum backup foi declarado como concluído." }
    $archiveEntries = Test-MarufiaArchiveInContainer -ContainerPath $containerPath

    $temporaryDump = "$($paths.Dump).$PID.partial"
    $temporaryKey = "$($paths.EncryptionKey).$PID.partial"
    $temporaryChecksum = "$($paths.Checksum).$PID.partial"
    $temporaryMetadata = "$($paths.Metadata).$PID.partial"
    foreach ($temporary in @($temporaryDump, $temporaryKey, $temporaryChecksum, $temporaryMetadata)) {
        $temporaryPaths.Add($temporary)
    }

    & $dockerCommand cp "supabase-db:$containerPath" $temporaryDump
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $temporaryDump -PathType Leaf)) {
        throw "Não foi possível copiar o dump para a pasta privada de backups."
    }
    if ((Get-Item -LiteralPath $temporaryDump).Length -lt 1024) {
        throw "O dump criado é inesperadamente pequeno."
    }

    [byte[]]$plainKey = @(Get-MarufiaPgsodiumKeyBytes)
    Protect-MarufiaPgsodiumKey -Plaintext $plainKey -Password $environment["POSTGRES_PASSWORD"] -DestinationPath $temporaryKey
    [byte[]]$verificationKey = @(Unprotect-MarufiaPgsodiumKey -SourcePath $temporaryKey -Password $environment["POSTGRES_PASSWORD"])
    try {
        if (-not [System.Security.Cryptography.CryptographicOperations]::FixedTimeEquals($plainKey, $verificationKey)) {
            throw "A cópia protegida da chave de criptografia falhou na verificação."
        }
    } finally {
        [System.Array]::Clear($verificationKey)
    }

    Move-Item -LiteralPath $temporaryDump -Destination $paths.Dump
    $createdPaths.Add($paths.Dump)
    Move-Item -LiteralPath $temporaryKey -Destination $paths.EncryptionKey
    $createdPaths.Add($paths.EncryptionKey)
    $hashes = Write-MarufiaChecksumManifest -DumpPath $paths.Dump -EncryptionKeyPath $paths.EncryptionKey -DestinationPath $temporaryChecksum

    $pgDumpVersion = (& $dockerCommand exec supabase-db pg_dump --version 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pgDumpVersion)) {
        throw "Não foi possível registrar a versão do pg_dump."
    }
    $metadata = [ordered]@{
        formatVersion = $script:MarufiaBackupFormatVersion
        kind = "marufia-postgres-logical"
        purpose = $Purpose.ToLowerInvariant()
        createdAt = [DateTimeOffset]::UtcNow.ToString("o", [System.Globalization.CultureInfo]::InvariantCulture)
        database = "postgres"
        postgresImage = Get-MarufiaDatabaseImage
        pgDumpVersion = $pgDumpVersion
        dump = [ordered]@{
            fileName = [System.IO.Path]::GetFileName($paths.Dump)
            format = "custom"
            archiveEntries = $archiveEntries
            sizeBytes = (Get-Item -LiteralPath $paths.Dump).Length
            sha256 = $hashes.DumpHash
        }
        encryptionKey = [ordered]@{
            fileName = [System.IO.Path]::GetFileName($paths.EncryptionKey)
            protection = "AES-256-GCM/PBKDF2-SHA256"
            sizeBytes = (Get-Item -LiteralPath $paths.EncryptionKey).Length
            sha256 = $hashes.EncryptionKeyHash
        }
        exclusions = @("storage object files", "environment secrets", "Cloudflare credentials", "Docker logs")
    }
    [System.IO.File]::WriteAllText(
        $temporaryMetadata,
        ($metadata | ConvertTo-Json -Depth 8),
        [System.Text.UTF8Encoding]::new($false)
    )
    Move-Item -LiteralPath $temporaryChecksum -Destination $paths.Checksum
    $createdPaths.Add($paths.Checksum)
    Move-Item -LiteralPath $temporaryMetadata -Destination $paths.Metadata
    $createdPaths.Add($paths.Metadata)

    $null = Assert-MarufiaBackupSet -DumpPath $paths.Dump -Password $environment["POSTGRES_PASSWORD"]

    if ($Purpose -eq "Regular" -and -not $SkipRetention) {
        Invoke-MarufiaBackupRetention -Environment $environment -CurrentDumpPath $paths.Dump
    } elseif ($Purpose -eq "PreRestore") {
        Write-MarufiaMessage -Level INFO -Message "Ponto pré-restauração preservado fora da limpeza automática."
    }
    Write-MarufiaMessage -Level INFO -Message "Backup criado, copiado e verificado: backups/$([System.IO.Path]::GetFileName($paths.Dump))"
    if ($PassThru) { Write-Output $paths.Dump }
} catch {
    if ($createdPaths.Count -gt 0) {
        foreach ($createdPath in $createdPaths) {
            if (Test-Path -LiteralPath $createdPath -PathType Leaf) { Remove-Item -LiteralPath $createdPath -Force }
        }
    }
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    if ($ThrowOnError) { throw }
    exit 1
} finally {
    if ($plainKey) { [System.Array]::Clear($plainKey) }
    if ($containerPath) {
        try { Remove-MarufiaContainerTemporaryFile -ContainerPath $containerPath } catch { }
    }
    foreach ($temporaryPath in $temporaryPaths) {
        if (Test-Path -LiteralPath $temporaryPath -PathType Leaf) { Remove-Item -LiteralPath $temporaryPath -Force }
    }
    if ($lockStream) { $lockStream.Dispose() }
    if ($lockPath -and (Test-Path -LiteralPath $lockPath -PathType Leaf)) {
        try { Remove-Item -LiteralPath $lockPath -Force } catch { }
    }
}
