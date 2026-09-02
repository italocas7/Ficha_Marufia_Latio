#Requires -Version 7.4

[CmdletBinding()]
param(
    [ValidateSet("Menu", "Status", "Start", "Stop", "Restart", "Backup", "Studio", "Logs")]
    [string]$Action = "Menu"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "health-common.ps1")

function Test-MarufiaContainerRunning {
    param([Parameter(Mandatory = $true)][string]$Name)
    try {
        $dockerCommand = Resolve-DockerCommand
        $running = (& $dockerCommand inspect $Name --format '{{.State.Running}}' 2>$null | Out-String).Trim()
        return $LASTEXITCODE -eq 0 -and $running -eq "true"
    } catch {
        return $false
    }
}

function Test-MarufiaStartupConfigured {
    try {
        return $null -ne (Get-ScheduledTask -TaskName "Marufia Server Startup" -ErrorAction SilentlyContinue)
    } catch {
        return $false
    }
}

function Show-MarufiaManagerDashboard {
    Clear-Host
    Write-Host "MARUFIA SERVER"
    Write-Host "────────────────────────────────"
    try {
        $report = Get-MarufiaHealthReport
        $serverOk = $report.Components.Database.Ok -and $report.Components.Auth.Ok -and
            $report.Components.Rest.Ok -and $report.Components.Realtime.Ok -and $report.Components.Storage.Ok
        Write-Host "Servidor:              $(if ($serverOk) { 'ONLINE' } else { 'COM FALHA' })"
        Write-Host "Banco:                 $(if ($report.Components.Database.Ok) { 'ONLINE' } else { 'OFFLINE' })"
        Write-Host "Realtime:              $(if ($report.Components.Realtime.Ok) { 'ONLINE' } else { 'OFFLINE' })"
        Write-Host "Tunnel:                $(if ($report.Components.Tunnel.Ok) { 'ONLINE' } else { 'OFFLINE' })"
        Write-Host "Jogadores conectados: $($report.ConnectedPlayers)"
        if ($report.LatestBackup) {
            Write-Host "Último backup:         $($report.LatestBackup.CreatedAt.ToLocalTime().ToString('dd/MM/yyyy HH:mm'))"
        } else {
            Write-Host "Último backup:         NÃO ENCONTRADO"
        }
    } catch {
        Write-Host "Servidor:              OFFLINE"
        Write-Host "Banco:                 OFFLINE"
        Write-Host "Realtime:              OFFLINE"
        Write-Host "Tunnel:                OFFLINE"
        Write-Host "Jogadores conectados:  0"
        Write-Host "Último backup:         verifique a pasta de backups"
    }
    Write-Host "Inicialização Windows: $(if (Test-MarufiaStartupConfigured) { 'AUTOMÁTICA' } else { 'MANUAL' })"
    Write-Host "────────────────────────────────"
}

function Invoke-MarufiaScriptChecked {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [hashtable]$Parameters = @{}
    )

    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot $Name) @Parameters
    if ($LASTEXITCODE -ne 0) { throw "$Name não foi concluído." }
}

function Invoke-MarufiaManagerAction {
    param([Parameter(Mandatory = $true)][string]$SelectedAction)

    switch ($SelectedAction) {
        "Status" {
            Invoke-MarufiaScriptChecked -Name "health-check.ps1"
        }
        "Start" {
            Invoke-MarufiaScriptChecked -Name "start-server.ps1"
            if ((Test-Path -LiteralPath $script:MarufiaTunnelTokenPath -PathType Leaf)) {
                Invoke-MarufiaScriptChecked -Name "start-tunnel.ps1"
            } else {
                Write-MarufiaMessage -Level WARNING -Message "Servidor local iniciado; Tunnel ainda não está configurado."
            }
            Invoke-MarufiaScriptChecked -Name "health-check.ps1"
        }
        "Stop" {
            Invoke-MarufiaScriptChecked -Name "stop-server.ps1"
        }
        "Restart" {
            $tunnelWasRunning = Test-MarufiaContainerRunning -Name "marufia-cloudflared"
            if ($tunnelWasRunning) { Invoke-MarufiaScriptChecked -Name "stop-tunnel.ps1" }
            Invoke-MarufiaScriptChecked -Name "restart-server.ps1"
            if ($tunnelWasRunning) { Invoke-MarufiaScriptChecked -Name "start-tunnel.ps1" }
            Invoke-MarufiaScriptChecked -Name "health-check.ps1"
        }
        "Backup" {
            Invoke-MarufiaScriptChecked -Name "backup.ps1"
        }
        "Studio" {
            $environment = Get-MarufiaEnvironmentMap
            $port = [int]$environment["API_GW_HTTP_PORT"]
            Start-Process -FilePath "http://127.0.0.1:$port"
            Write-MarufiaMessage -Level INFO -Message "Supabase Studio aberto localmente no navegador."
        }
        "Logs" {
            if (-not (Test-Path -LiteralPath $script:MarufiaLogDirectory -PathType Container)) {
                $null = New-Item -ItemType Directory -Path $script:MarufiaLogDirectory
            }
            Start-Process -FilePath "explorer.exe" -ArgumentList @($script:MarufiaLogDirectory)
            Write-MarufiaMessage -Level INFO -Message "Pasta de logs aberta."
        }
        default { throw "Ação desconhecida do gerenciador." }
    }
}

try {
    if ($Action -ne "Menu") {
        Invoke-MarufiaManagerAction -SelectedAction $Action
        exit 0
    }

    $exitRequested = $false
    while (-not $exitRequested) {
        Show-MarufiaManagerDashboard
        Write-Host ""
        Write-Host "[1] Verificar saúde"
        Write-Host "[2] Iniciar servidor"
        Write-Host "[3] Parar servidor"
        Write-Host "[4] Reiniciar servidor"
        Write-Host "[5] Fazer backup"
        Write-Host "[6] Abrir Supabase Studio"
        Write-Host "[7] Abrir logs"
        Write-Host "[0] Sair"
        Write-Host ""
        $choice = Read-Host "Escolha uma opção"
        $selected = switch ($choice) {
            "1" { "Status" }
            "2" { "Start" }
            "3" { "Stop" }
            "4" { "Restart" }
            "5" { "Backup" }
            "6" { "Studio" }
            "7" { "Logs" }
            "0" { $exitRequested = $true; $null }
            default { Write-MarufiaMessage -Level WARNING -Message "Opção inválida."; $null }
        }
        if ($selected) {
            try { Invoke-MarufiaManagerAction -SelectedAction $selected } catch { Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message }
        }
        if (-not $exitRequested) { $null = Read-Host "Pressione Enter para continuar" }
    }
} catch {
    Write-MarufiaMessage -Level ERROR -Message "O gerenciador não concluiu a operação: $($_.Exception.Message)"
    exit 1
}
