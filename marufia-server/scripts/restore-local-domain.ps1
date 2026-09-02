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
    $localSiteUrl = "http://127.0.0.1:4173"
    $clientSiteUrl = if ($environment.ContainsKey("MARUFIA_CLIENT_SITE_URL") -and
        -not [string]::IsNullOrWhiteSpace($environment["MARUFIA_CLIENT_SITE_URL"])) {
        $environment["MARUFIA_CLIENT_SITE_URL"]
    } else { $environment["SITE_URL"] }
    Remove-MarufiaTunnelContainers -Names @(
        "marufia-cloudflared", "marufia-cloudflared-quick", "marufia-public-gateway", "marufia-tunnel-smoke-gateway"
    )
    Set-MarufiaEnvironmentValues -Values @{
        CLOUDFLARE_TUNNEL_HOSTNAME = ""
        MARUFIA_PUBLIC_URL = $localUrl
        SUPABASE_PUBLIC_URL = $localUrl
        API_EXTERNAL_URL = "$localUrl/auth/v1"
        MARUFIA_CLIENT_SITE_URL = $clientSiteUrl
        SITE_URL = $localSiteUrl
        AUTH_REDIRECT_URL = $localSiteUrl
        ADDITIONAL_REDIRECT_URLS = "$localSiteUrl,http://localhost:4173"
        MARUFIA_CORS_ALLOWED_ORIGINS = "$clientSiteUrl,http://tauri.localhost,$localSiteUrl,http://localhost:4173"
        AUTH_MAILER_EXTERNAL_HOSTS = ""
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
