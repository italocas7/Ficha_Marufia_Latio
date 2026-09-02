#Requires -Version 7.4

[CmdletBinding()]
param(
    [string]$BackupPath,

    [ValidateSet("Test", "Production")]
    [string]$Mode = "Test",

    [string]$Confirmation = "",

    [switch]$KeepTestDatabase,

    [switch]$ThrowOnError
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "backup-common.ps1")

function Resolve-MarufiaRestoreBackupPath {
    param([string]$RequestedPath)

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        if (-not (Test-Path -LiteralPath $RequestedPath -PathType Leaf)) { throw "O arquivo de backup informado não existe." }
        return (Resolve-Path -LiteralPath $RequestedPath).Path
    }
    $latest = Get-ChildItem -LiteralPath $script:MarufiaBackupDirectory -File -Filter "$($script:MarufiaBackupPrefix)-*.dump" |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1
    if (-not $latest) { throw "Nenhum backup regular foi encontrado na pasta privada." }
    return $latest.FullName
}

function Assert-MarufiaBackupEncryptionKeyMatchesServer {
    param(
        [Parameter(Mandatory = $true)][string]$EncryptedKeyPath,
        [Parameter(Mandatory = $true)][string]$Password
    )

    [byte[]]$backupKey = @(Unprotect-MarufiaPgsodiumKey -SourcePath $EncryptedKeyPath -Password $Password)
    [byte[]]$currentKey = @(Get-MarufiaPgsodiumKeyBytes)
    try {
        if (-not [System.Security.Cryptography.CryptographicOperations]::FixedTimeEquals($backupKey, $currentKey)) {
            throw "A chave de criptografia deste servidor não corresponde ao backup. A restauração foi recusada antes de alterar o banco."
        }
    } finally {
        [System.Array]::Clear($backupKey)
        [System.Array]::Clear($currentKey)
    }
}

function Invoke-MarufiaTestRestore {
    param(
        [Parameter(Mandatory = $true)][string]$ContainerPath,
        [switch]$KeepDatabase
    )

    $testDatabase = New-MarufiaRestoreTestDatabase
    $completed = $false
    try {
        Restore-MarufiaArchiveToDatabase -ContainerPath $ContainerPath -Database $testDatabase
        $inventory = Get-MarufiaRestoredDatabaseInventory -Database $testDatabase
        $completed = $true
        Write-MarufiaMessage -Level INFO -Message "Restauração isolada aprovada: schema, dados, Auth, RLS, RPCs e Realtime foram reconstruídos."
        return [pscustomobject]@{ Database = $testDatabase; Inventory = $inventory }
    } finally {
        if (-not $KeepDatabase -or -not $completed) {
            Remove-MarufiaRestoreTestDatabase -Database $testDatabase
        }
    }
}

function Get-MarufiaRunningServiceContainers {
    $dockerCommand = Resolve-DockerCommand
    $lines = @(& $dockerCommand ps --filter "label=com.docker.compose.project=$($script:MarufiaComposeProject)" --format '{{.Names}}|{{.Label "com.docker.compose.service"}}' 2>&1)
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível identificar os serviços ativos antes da restauração." }
    $containers = [System.Collections.Generic.List[string]]::new()
    foreach ($line in $lines) {
        $parts = ([string]$line).Split("|", 2)
        if ($parts.Count -ne 2 -or [string]::IsNullOrWhiteSpace($parts[0])) { continue }
        if ($parts[1] -ne "db" -and $parts[0] -ne "supabase-db") { $containers.Add($parts[0]) }
    }
    return $containers.ToArray()
}

function Stop-MarufiaServiceContainers {
    param([Parameter(Mandatory = $true)][string[]]$Names)

    if ($Names.Count -eq 0) { return }
    $dockerCommand = Resolve-DockerCommand
    $null = & $dockerCommand stop @Names 2>&1
    if ($LASTEXITCODE -ne 0) {
        $null = & $dockerCommand start @Names 2>&1
        throw "Não foi possível entrar no modo de manutenção; o banco não foi alterado."
    }
}

function Start-MarufiaServiceContainers {
    param([Parameter(Mandatory = $true)][string[]]$Names)

    if ($Names.Count -eq 0) { return }
    $dockerCommand = Resolve-DockerCommand
    $null = & $dockerCommand start @Names 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Os serviços não puderam ser reiniciados após a restauração." }

    $deadline = [DateTimeOffset]::UtcNow.AddMinutes(3)
    do {
        $waiting = [System.Collections.Generic.List[string]]::new()
        foreach ($name in $Names) {
            $state = (& $dockerCommand inspect $name --format '{{if not .State.Running}}stopped{{else if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' 2>&1 | Out-String).Trim()
            if ($LASTEXITCODE -ne 0 -or $state -notin @("healthy", "running")) { $waiting.Add($name) }
        }
        if ($waiting.Count -eq 0) { return }
        Start-Sleep -Seconds 2
    } while ([DateTimeOffset]::UtcNow -lt $deadline)
    throw "Nem todos os serviços ficaram saudáveis após a restauração."
}

function Reset-MarufiaProductionDatabase {
    param([Parameter(Mandatory = $true)][string]$ContainerPath)

    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand exec supabase-db dropdb --if-exists --force --username=postgres --maintenance-db=template1 postgres
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível substituir o banco postgres durante a manutenção." }
    & $dockerCommand exec supabase-db createdb --username=postgres --maintenance-db=template1 --template=template0 postgres
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível recriar o banco postgres durante a manutenção." }
    Restore-MarufiaArchiveToDatabase -ContainerPath $ContainerPath -Database "postgres"
}

$lockStream = $null
$lockPath = ""
$containerPath = ""
$rollbackContainerPath = ""
$testDatabaseToKeep = ""
$runningContainers = @()
$servicesStopped = $false
$productionChanged = $false

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $resolvedBackupPath = Resolve-MarufiaRestoreBackupPath -RequestedPath $BackupPath

    if ($Mode -eq "Production") {
        if ($Confirmation -cne "RESTAURAR-MARUFIA") {
            throw "A restauração real exige -Confirmation RESTAURAR-MARUFIA. Use o modo Test primeiro."
        }
        if ($KeepTestDatabase) { throw "KeepTestDatabase só pode ser usado no modo Test." }
        Write-MarufiaMessage -Level WARNING -Message "Modo de produção solicitado: os jogadores devem estar desconectados durante a janela de manutenção."
        $rollbackBackup = & (Join-Path $PSScriptRoot "backup.ps1") -Purpose PreRestore -SkipRetention -PassThru -ThrowOnError
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($rollbackBackup)) {
            throw "A restauração foi recusada porque o backup preventivo não pôde ser criado."
        }
    }

    $lockPath = Join-Path $script:MarufiaBackupDirectory ".backup.lock"
    try {
        $lockStream = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    } catch {
        throw "Outro backup ou restore já está em execução. Aguarde a conclusão."
    }

    $backupSet = Assert-MarufiaBackupSet -DumpPath $resolvedBackupPath -Password $environment["POSTGRES_PASSWORD"]
    $currentImage = Get-MarufiaDatabaseImage
    if ($backupSet.Metadata.postgresImage -ne $currentImage) {
        throw "O backup foi criado com outra imagem PostgreSQL. Use primeiro o procedimento documentado de compatibilidade entre versões."
    }
    Assert-MarufiaBackupEncryptionKeyMatchesServer -EncryptedKeyPath $backupSet.Paths.EncryptionKey -Password $environment["POSTGRES_PASSWORD"]
    $containerPath = Copy-MarufiaDumpToContainer -DumpPath $backupSet.Paths.Dump
    $testResult = Invoke-MarufiaTestRestore -ContainerPath $containerPath -KeepDatabase:$KeepTestDatabase
    if ($KeepTestDatabase) {
        $testDatabaseToKeep = $testResult.Database
        Write-MarufiaMessage -Level WARNING -Message "Banco de teste preservado por solicitação explícita: $testDatabaseToKeep"
    }

    if ($Mode -eq "Test") {
        Write-MarufiaMessage -Level INFO -Message "Teste de restauração concluído sem alterar o banco em uso."
        return
    }

    $rollbackSet = Assert-MarufiaBackupSet -DumpPath $rollbackBackup -Password $environment["POSTGRES_PASSWORD"]
    if ($rollbackSet.Metadata.postgresImage -ne $currentImage) { throw "O backup preventivo não corresponde à versão atual do PostgreSQL." }
    $rollbackContainerPath = Copy-MarufiaDumpToContainer -DumpPath $rollbackSet.Paths.Dump
    $runningContainers = @(Get-MarufiaRunningServiceContainers)
    Stop-MarufiaServiceContainers -Names $runningContainers
    $servicesStopped = $true

    $restoreFailure = $null
    try {
        $productionChanged = $true
        Reset-MarufiaProductionDatabase -ContainerPath $containerPath
        $null = Get-MarufiaRestoredDatabaseInventory -Database "postgres"
        Start-MarufiaServiceContainers -Names $runningContainers
        $servicesStopped = $false
        & (Join-Path $PSScriptRoot "verify-schema.ps1")
        if ($LASTEXITCODE -ne 0) { throw "A verificação completa posterior à restauração falhou." }
    } catch {
        $restoreFailure = $_.Exception.Message
    }

    if ($restoreFailure) {
        $rollbackFailure = $null
        try {
            if (-not $servicesStopped) {
                Stop-MarufiaServiceContainers -Names $runningContainers
                $servicesStopped = $true
            }
            Reset-MarufiaProductionDatabase -ContainerPath $rollbackContainerPath
            $null = Get-MarufiaRestoredDatabaseInventory -Database "postgres"
            Start-MarufiaServiceContainers -Names $runningContainers
            $servicesStopped = $false
        } catch {
            $rollbackFailure = $_.Exception.Message
        }
        if ($rollbackFailure) {
            throw "Falha crítica na restauração e no rollback. Os serviços permaneceram parados. Motivo do rollback: $rollbackFailure"
        }
        throw "A restauração não passou nos checks e foi revertida automaticamente. Motivo original: $restoreFailure"
    }

    Write-MarufiaMessage -Level INFO -Message "Restauração de produção concluída e validada. O Tunnel voltou somente porque estava ativo antes da manutenção."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    if ($ThrowOnError) { throw }
    exit 1
} finally {
    if ($containerPath) {
        try { Remove-MarufiaContainerTemporaryFile -ContainerPath $containerPath } catch { }
    }
    if ($rollbackContainerPath) {
        try { Remove-MarufiaContainerTemporaryFile -ContainerPath $rollbackContainerPath } catch { }
    }
    if ($servicesStopped -and -not $productionChanged -and $runningContainers.Count -gt 0) {
        try { Start-MarufiaServiceContainers -Names $runningContainers } catch { }
    }
    if ($lockStream) { $lockStream.Dispose() }
    if ($lockPath -and (Test-Path -LiteralPath $lockPath -PathType Leaf)) {
        try { Remove-Item -LiteralPath $lockPath -Force } catch { }
    }
}
