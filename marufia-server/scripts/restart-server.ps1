[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-MarufiaEnvironment
    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "start-docker-safe.ps1")
    if ($LASTEXITCODE -ne 0) { throw "O Docker Desktop não iniciou com segurança." }
    Assert-DockerReady
    Write-MarufiaMessage -Level INFO -Message "Recriando os serviços sem remover dados persistentes..."
    Invoke-MarufiaCompose -ComposeArguments @("up", "--detach", "--wait", "--force-recreate")
    Write-MarufiaMessage -Level INFO -Message "Marufia Server reiniciado e saudável."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
