#Requires -Version 7.4

[CmdletBinding()]
param(
    [ValidatePattern("^(?:[01][0-9]|2[0-3]):[0-5][0-9]$")]
    [string]$At = "18:00"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$taskName = "Marufia Server Daily Backup"

try {
    $pwsh = (Get-Command pwsh.exe -CommandType Application -ErrorAction Stop).Source
    $runner = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "run-scheduled-backup.ps1")).Path
    $action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoLogo -NoProfile -NonInteractive -File `"$runner`""
    $trigger = New-ScheduledTaskTrigger -Daily -At ([DateTime]::ParseExact($At, "HH:mm", [System.Globalization.CultureInfo]::InvariantCulture))
    $settings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
    $null = Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Cria e valida o backup diário do PostgreSQL do Marufia Server." `
        -Force
    $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
    if ($task.State -eq "Disabled") { throw "A tarefa foi criada, mas ficou desabilitada." }
    Write-MarufiaMessage -Level INFO -Message "Backup diário configurado para $At no horário local do Windows."
    Write-MarufiaMessage -Level INFO -Message "Se o PC estiver desligado, o Windows tentará executar a tarefa quando ela voltar a ficar disponível."
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Não foi possível configurar o backup automático: $($_.Exception.Message)"
    exit 1
}
