#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    $hostname = ConvertTo-MarufiaPublicHostname -Value "api.marufia.dev"
    if ($hostname -ne "api.marufia.dev") { throw "A normalização do hostname falhou." }
    foreach ($unsafeHostname in @("localhost", "api.marufia.example", "teste.trycloudflare.com")) {
        try {
            $null = ConvertTo-MarufiaPublicHostname -Value $unsafeHostname
            throw "Hostname inseguro foi aceito: $unsafeHostname"
        } catch {
            if ($_.Exception.Message -like "Hostname inseguro*") { throw }
        }
    }

    $sample = @{
        SUPABASE_PUBLIC_URL = "https://api.marufia.dev"
        API_EXTERNAL_URL = "https://api.marufia.dev/auth/v1"
        SITE_URL = "https://app.marufia.dev"
        ADDITIONAL_REDIRECT_URLS = "https://app.marufia.dev"
        MARUFIA_CORS_ALLOWED_ORIGINS = "https://app.marufia.dev,http://tauri.localhost"
        ENABLE_EMAIL_AUTOCONFIRM = "false"
        AUTH_MAX_REQUEST_DURATION = "30s"
        AUTH_MAILER_EXTERNAL_HOSTS = "api.marufia.dev"
        SMTP_ADMIN_EMAIL = "servidor@marufia.dev"
        SMTP_HOST = "smtp.marufia.dev"
        SMTP_PORT = "587"
        SMTP_USER = "marufia"
        SMTP_PASS = "senha-descartável-de-validação"
    }
    Assert-MarufiaAuthSafety -Environment $sample
    $origins = @(Get-MarufiaCorsOrigins -Environment $sample)
    if ($origins.Count -ne 2 -or "https://app.marufia.dev" -notin $origins -or "http://tauri.localhost" -notin $origins) {
        throw "As origens CORS exatas não foram preservadas."
    }

    $unsafeSample = $sample.Clone()
    $unsafeSample["ENABLE_EMAIL_AUTOCONFIRM"] = "true"
    try {
        Assert-MarufiaAuthSafety -Environment $unsafeSample
        throw "A confirmação automática externa foi aceita."
    } catch {
        if ($_.Exception.Message -eq "A confirmação automática externa foi aceita.") { throw }
    }

    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "render-public-gateway.ps1")
    if ($LASTEXITCODE -ne 0) { throw "A renderização real do gateway falhou." }
    $renderedPath = Join-Path $script:MarufiaServerRoot "cloudflare\public-gateway-envoy.generated.yaml"
    $rendered = [System.IO.File]::ReadAllText($renderedPath)
    if ($rendered.Contains("__MARUFIA_") -or $rendered -notmatch "http://tauri\.localhost") {
        throw "O gateway renderizado não contém a lista CORS final."
    }
    Write-MarufiaMessage -Level INFO -Message "Domínio, Auth, SMTP, CORS e renderização pública aprovados sem alterar o .env."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
