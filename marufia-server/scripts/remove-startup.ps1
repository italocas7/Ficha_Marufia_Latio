#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$taskName = "Marufia Server Startup"

try {
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-MarufiaMessage -Level INFO -Message "Inicialização automática removida. Servidor, banco e backups foram preservados."
    } else {
        Write-MarufiaMessage -Level INFO -Message "A inicialização do Marufia já está no modo manual."
    }
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Não foi possível remover a inicialização automática: $($_.Exception.Message)"
    exit 1
}
