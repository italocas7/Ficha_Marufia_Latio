#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Assert-MarufiaTunnelHostname {
    param([Parameter(Mandatory = $true)][hashtable]$Environment)

    if (-not $Environment.ContainsKey("CLOUDFLARE_TUNNEL_HOSTNAME") -or
        [string]::IsNullOrWhiteSpace($Environment["CLOUDFLARE_TUNNEL_HOSTNAME"])) {
        throw "CLOUDFLARE_TUNNEL_HOSTNAME ainda não foi configurado no .env."
    }
    $hostname = $Environment["CLOUDFLARE_TUNNEL_HOSTNAME"].Trim().TrimEnd(".").ToLowerInvariant()
    if ($hostname -notmatch "^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$" -or
        $hostname -match "(?:^|\.)(?:localhost|example|invalid|test)$" -or
        $hostname.EndsWith(".trycloudflare.com")) {
        throw "CLOUDFLARE_TUNNEL_HOSTNAME deve ser um domínio HTTPS real controlado pelo Mestre."
    }
    $expectedUrl = "https://$hostname"
    foreach ($key in @("MARUFIA_PUBLIC_URL", "SUPABASE_PUBLIC_URL")) {
        if (-not $Environment.ContainsKey($key) -or $Environment[$key].TrimEnd("/") -ne $expectedUrl) {
            throw "$key deve ser exatamente $expectedUrl antes de publicar o servidor."
        }
    }
    return $hostname
}

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    Assert-MarufiaTunnelTokenFile
    $environment = Get-MarufiaEnvironmentMap
    $hostname = Assert-MarufiaTunnelHostname -Environment $environment

    Remove-MarufiaTunnelContainers -Names @("marufia-cloudflared-quick", "marufia-tunnel-smoke-gateway")
    Write-MarufiaMessage -Level INFO -Message "Iniciando o caminho público protegido do Marufia Server..."
    Invoke-MarufiaTunnelCompose -ComposeArguments @(
        "--profile", "named-tunnel", "up", "--detach", "--wait", "--wait-timeout", "120", "cloudflared"
    )
    Write-MarufiaMessage -Level INFO -Message "Tunnel saudável em https://$hostname. PostgreSQL e Studio permanecem privados."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
