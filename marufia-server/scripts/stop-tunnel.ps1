[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    Remove-MarufiaTunnelContainers -Names @(
        "marufia-cloudflared",
        "marufia-cloudflared-quick",
        "marufia-public-gateway",
        "marufia-tunnel-smoke-gateway"
    )
    Write-MarufiaMessage -Level INFO -Message "Tunnel parado. Banco, Storage e volumes do Marufia Server foram preservados."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
