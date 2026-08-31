[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    Write-MarufiaMessage -Level INFO -Message "Estado atual dos serviços do Marufia Server:"
    Invoke-MarufiaCompose -ComposeArguments @("ps", "--all")
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
