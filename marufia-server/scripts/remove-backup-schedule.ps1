#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$taskName = "Marufia Server Daily Backup"

try {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-MarufiaMessage -Level INFO -Message "Agendamento diário removido. Os backups existentes foram preservados."
    } else {
        Write-MarufiaMessage -Level INFO -Message "Nenhum agendamento diário do Marufia estava instalado."
    }
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Não foi possível remover o agendamento diário: $($_.Exception.Message)"
    exit 1
}
