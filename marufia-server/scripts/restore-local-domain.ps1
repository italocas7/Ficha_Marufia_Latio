#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $port = if ($environment.ContainsKey("API_GW_HTTP_PORT") -and $environment["API_GW_HTTP_PORT"]) {
        $environment["API_GW_HTTP_PORT"]
    } else { "8000" }
    $localUrl = "http://127.0.0.1:$port"
    Remove-MarufiaTunnelContainers -Names @(
        "marufia-cloudflared", "marufia-cloudflared-quick", "marufia-public-gateway", "marufia-tunnel-smoke-gateway"
    )
    Set-MarufiaEnvironmentValues -Values @{
        CLOUDFLARE_TUNNEL_HOSTNAME = ""
        MARUFIA_PUBLIC_URL = $localUrl
        SUPABASE_PUBLIC_URL = $localUrl
        API_EXTERNAL_URL = "$localUrl/auth/v1"
        ADDITIONAL_REDIRECT_URLS = "http://127.0.0.1:4173,http://localhost:4173"
        MARUFIA_CORS_ALLOWED_ORIGINS = "$($environment['SITE_URL']),http://tauri.localhost,http://127.0.0.1:4173,http://localhost:4173"
        ENABLE_EMAIL_AUTOCONFIRM = "true"
    }
    Assert-MarufiaEnvironment
    Invoke-MarufiaCompose -ComposeArguments @("up", "--detach", "--wait", "--wait-timeout", "120")
    & (Join-Path $PSScriptRoot "select-client-backend.ps1") -Mode Cloud
    if ($LASTEXITCODE -ne 0) { throw "O cliente não pôde voltar automaticamente ao fallback Cloud." }
    Write-MarufiaMessage -Level INFO -Message "Servidor restaurado ao loopback e cliente devolvido ao fallback Cloud; dados foram preservados."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
