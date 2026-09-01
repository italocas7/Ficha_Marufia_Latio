[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    $dockerCommand = Resolve-DockerCommand
    $names = @(
        "marufia-cloudflared",
        "marufia-cloudflared-quick",
        "marufia-public-gateway",
        "marufia-tunnel-smoke-gateway"
    )
    $found = $false
    foreach ($name in $names) {
        $line = (& $dockerCommand ps --all --filter "name=^/${name}$" --format "{{.Names}}|{{.Status}}" 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Não foi possível consultar o estado do Tunnel." }
        if ($line) {
            $found = $true
            Write-MarufiaMessage -Level INFO -Message $line.Replace("|", " — ")
        }
    }
    if (-not $found) {
        Write-MarufiaMessage -Level INFO -Message "Tunnel parado."
    }
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
