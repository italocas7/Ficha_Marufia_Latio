#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Write-MarufiaMessage -Level INFO -Message "Inicialização automática do Marufia Server iniciada."
    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "start-server.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Os serviços locais não iniciaram." }
    if (Test-Path -LiteralPath $script:MarufiaTunnelTokenPath -PathType Leaf) {
        $global:LASTEXITCODE = 0
        & (Join-Path $PSScriptRoot "start-tunnel.ps1")
        if ($LASTEXITCODE -ne 0) { throw "O Tunnel não iniciou." }
    }
    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "health-check.ps1")
    if ($LASTEXITCODE -ne 0) { throw "O health check falhou após a inicialização automática." }
    Write-MarufiaMessage -Level INFO -Message "Inicialização automática concluída."
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Inicialização automática falhou: $($_.Exception.Message)"
    exit 1
}
