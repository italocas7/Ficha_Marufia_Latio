[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    Write-MarufiaMessage -Level INFO -Message "Parando os containers sem remover banco ou Storage..."
    Invoke-MarufiaCompose -ComposeArguments @("down")
    Write-MarufiaMessage -Level INFO -Message "Marufia Server parado; os dados persistentes foram preservados."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
