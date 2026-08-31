[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    Write-MarufiaMessage -Level INFO -Message "Recriando os serviços sem remover dados persistentes..."
    Invoke-MarufiaCompose -ComposeArguments @("up", "--detach", "--wait", "--force-recreate")
    Write-MarufiaMessage -Level INFO -Message "Marufia Server reiniciado e saudável."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
