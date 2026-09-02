#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$taskName = "Marufia Server Startup"

try {
    $pwsh = (Get-Command pwsh.exe -CommandType Application -ErrorAction Stop).Source
    $runner = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "run-startup.ps1")).Path
    $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $action = New-ScheduledTaskAction -Execute $pwsh -Argument "-NoLogo -NoProfile -NonInteractive -File `"$runner`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $user
    $settings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
        -RestartCount 2 `
        -RestartInterval (New-TimeSpan -Minutes 1)
    $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
    $null = Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Inicia Docker, Marufia Server e Tunnel após o login do Mestre." `
        -Force
    Write-MarufiaMessage -Level INFO -Message "Inicialização automática configurada para o login do Mestre."
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Não foi possível configurar a inicialização automática: $($_.Exception.Message)"
    exit 1
}
