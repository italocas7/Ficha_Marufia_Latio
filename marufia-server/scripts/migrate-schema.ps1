#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Get-MigrationManifest {
    param([Parameter(Mandatory = $true)][string]$ManifestPath)

    $entries = [ordered]@{}
    foreach ($line in [System.IO.File]::ReadAllLines($ManifestPath)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        if ($line -notmatch "^(?<hash>[0-9a-f]{64})  (?<file>[0-9]{14}_[A-Za-z0-9_]+\.sql)$") {
            throw "Linha inválida no manifesto de migrations."
        }
        if ($entries.Contains($Matches.file)) {
            throw "Migration duplicada no manifesto: $($Matches.file)"
        }
        $entries[$Matches.file] = $Matches.hash
    }
    return $entries
}

function New-SchemaBaselineBackup {
    param([Parameter(Mandatory = $true)][string]$BackupDirectory)

    $dockerCommand = Resolve-DockerCommand
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $fileName = "phase4-pre-schema-$stamp.dump"
    $containerPath = "/tmp/$fileName"
    $hostPath = Join-Path $BackupDirectory $fileName

    & $dockerCommand exec supabase-db pg_dump --format=custom --no-owner --username=postgres --dbname=postgres --file=$containerPath
    if ($LASTEXITCODE -ne 0) {
        throw "Não foi possível criar o dump anterior à migração."
    }
    & $dockerCommand exec supabase-db pg_restore --list $containerPath *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "O dump anterior à migração não passou na verificação do pg_restore."
    }
    & $dockerCommand cp "supabase-db:$containerPath" $hostPath
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $hostPath -PathType Leaf)) {
        throw "Não foi possível copiar o dump verificado para a pasta privada de backups."
    }
    $backup = Get-Item -LiteralPath $hostPath
    if ($backup.Length -lt 1024) {
        throw "O dump anterior à migração é inesperadamente pequeno."
    }

    $hash = (Get-FileHash -LiteralPath $hostPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $checksumPath = "$hostPath.sha256"
    [System.IO.File]::WriteAllText(
        $checksumPath,
        "$hash  $fileName`n",
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-MarufiaMessage -Level INFO -Message "Rollback criado e verificado: backups/$fileName"
    return $hostPath
}

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady

    $serverRoot = Split-Path -Parent $PSScriptRoot
    $repositoryRoot = Split-Path -Parent $serverRoot
    $migrationDirectory = Join-Path $repositoryRoot "supabase\migrations"
    $manifestPath = Join-Path $serverRoot "schema\MIGRATIONS.sha256"
    $backupDirectory = Join-Path $serverRoot "backups"
    $manifest = Get-MigrationManifest -ManifestPath $manifestPath
    $migrationFiles = @(Get-ChildItem -LiteralPath $migrationDirectory -Filter "*.sql" | Sort-Object Name)

    if ($migrationFiles.Count -ne $manifest.Count) {
        throw "O conjunto de migrations difere do manifesto revisado."
    }
    foreach ($migration in $migrationFiles) {
        if (-not $manifest.Contains($migration.Name)) {
            throw "Migration não registrada no manifesto: $($migration.Name)"
        }
        $actualHash = (Get-FileHash -LiteralPath $migration.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($actualHash -ne $manifest[$migration.Name]) {
            throw "A migration $($migration.Name) mudou após a revisão. Atualize o manifesto conscientemente."
        }
    }

    $historyExists = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql @"
select case when to_regclass('supabase_migrations.schema_migrations') is null then '0' else '1' end;
"@
    $appliedVersions = @()
    if ($historyExists -eq "1") {
        $historyOutput = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql @"
select version from supabase_migrations.schema_migrations order by version;
"@
        if (-not [string]::IsNullOrWhiteSpace($historyOutput)) {
            $appliedVersions = @($historyOutput -split "`r?`n")
        }
    } else {
        $preflight = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql @"
select (select count(*) from auth.users)::text || '|' ||
       (select count(*) from pg_catalog.pg_tables where schemaname = 'public')::text;
"@
        $parts = $preflight -split "\|"
        if ($parts.Count -ne 2 -or $parts[0] -ne "0" -or $parts[1] -ne "0") {
            throw "Primeira migração recusada: o banco local já contém usuários ou tabelas públicas."
        }
    }

    $pending = @($migrationFiles | Where-Object {
        $version = $_.BaseName.Substring(0, 14)
        $version -notin $appliedVersions
    })
    if ($pending.Count -eq 0) {
        Write-MarufiaMessage -Level INFO -Message "Nenhuma migration pendente; o schema já está atualizado."
        & (Join-Path $PSScriptRoot "verify-schema.ps1")
        exit $LASTEXITCODE
    }

    $null = New-SchemaBaselineBackup -BackupDirectory $backupDirectory
    $null = Invoke-MarufiaDatabaseSql -Sql @"
begin;
create schema if not exists supabase_migrations;
revoke all on schema supabase_migrations from public;
create table if not exists supabase_migrations.schema_migrations (
  version text primary key,
  statements text[] not null default array[]::text[],
  name text
);
commit;
"@

    foreach ($migration in $pending) {
        if ($migration.BaseName -notmatch "^(?<version>[0-9]{14})_(?<name>[A-Za-z0-9_]+)$") {
            throw "Nome de migration inválido: $($migration.Name)"
        }
        $version = $Matches.version
        $name = $Matches.name
        $content = [System.IO.File]::ReadAllText($migration.FullName)
        $transaction = [regex]::Match(
            $content,
            "\A\s*begin\s*;\s*(?<body>[\s\S]*)\s*commit\s*;\s*\z",
            [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
        )
        if (-not $transaction.Success) {
            throw "A migration $($migration.Name) não possui uma única transação externa reconhecível."
        }
        $safeVersion = $version.Replace("'", "''")
        $safeName = $name.Replace("'", "''")
        $wrappedSql = @"
begin;
$($transaction.Groups['body'].Value)
insert into supabase_migrations.schema_migrations (version, statements, name)
values ('$safeVersion', array[]::text[], '$safeName');
commit;
"@
        $null = Invoke-MarufiaDatabaseSql -Sql $wrappedSql
        Write-MarufiaMessage -Level INFO -Message "Aplicada: $($migration.Name)"
    }

    & (Join-Path $PSScriptRoot "verify-schema.ps1") -RequireEmptyData
    if ($LASTEXITCODE -ne 0) {
        throw "A verificação estrutural posterior à migração falhou."
    }
    Write-MarufiaMessage -Level INFO -Message "Schema migrado sem copiar dados ou contas do Supabase Cloud."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
