[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    Write-MarufiaMessage -Level INFO -Message "Iniciando o Marufia Server sem alterar o Supabase Cloud..."
    Invoke-MarufiaCompose -ComposeArguments @("up", "--detach", "--wait")
    Write-MarufiaMessage -Level INFO -Message "Serviços essenciais iniciados e saudáveis."
    Write-MarufiaMessage -Level INFO -Message "Acesso local: http://127.0.0.1:8000"
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
