#Requires -Version 7.4

[CmdletBinding()]
param(
    [switch]$PassThru
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "health-common.ps1")

try {
    $report = Get-MarufiaHealthReport
    Write-Host ""
    Write-Host "Marufia Server Health Check"
    Write-Host ""
    foreach ($component in $report.Components.Values) {
        $dots = "." * [Math]::Max(2, 18 - $component.Name.Length)
        Write-Host "$($component.Name) $dots $($component.Status)"
    }
    Write-Host ""
    Write-Host "Jogadores conectados: $($report.ConnectedPlayers)"
    if ($report.LatestBackup) {
        Write-Host "Último backup: $($report.LatestBackup.CreatedAt.ToLocalTime().ToString('dd/MM/yyyy HH:mm'))"
    } else {
        Write-Host "Último backup: nenhum backup válido encontrado"
    }
    if ($report.AllOk) {
        Write-MarufiaMessage -Level INFO -Message "Health check concluído: todos os componentes estão disponíveis."
    } else {
        foreach ($component in @($report.Components.Values | Where-Object { -not $_.Ok })) {
            Write-MarufiaMessage -Level ERROR -Message "$($component.Name): $($component.Detail)"
        }
    }
    if ($PassThru) { Write-Output $report }
    if (-not $report.AllOk) { exit 1 }
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Health check não pôde ser concluído: $($_.Exception.Message)"
    exit 1
}
