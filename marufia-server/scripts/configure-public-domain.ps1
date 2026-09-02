#Requires -Version 7.4

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$Hostname,
    [string]$SiteUrl = "",
    [string]$AdditionalRedirectUrls = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Restore-MarufiaEnvironmentFile {
    param([Parameter(Mandatory = $true)][byte[]]$Bytes)
    $temporaryPath = "$($script:MarufiaEnvPath).rollback.$PID.tmp"
    try {
        [System.IO.File]::WriteAllBytes($temporaryPath, $Bytes)
        Move-Item -LiteralPath $temporaryPath -Destination $script:MarufiaEnvPath -Force
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -LiteralPath $temporaryPath -Force }
    }
}

function Test-MarufiaCoreIsRunning {
    $dockerCommand = Resolve-DockerCommand
    $name = (& $dockerCommand ps --filter "name=^/supabase-auth$" --format "{{.Names}}" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível consultar o estado atual do Auth." }
    return $name -eq "supabase-auth"
}

$originalBytes = $null
$configurationChanged = $false
$wasRunning = $false
try {
    $environment = Get-MarufiaEnvironmentMap
    Assert-MarufiaSmtpSafety -Environment $environment
    $publicHostname = ConvertTo-MarufiaPublicHostname -Value $Hostname
    $publicUrl = "https://$publicHostname"
    $selectedSiteUrl = if ([string]::IsNullOrWhiteSpace($SiteUrl)) { $environment["SITE_URL"] } else { $SiteUrl }
    if (Test-MarufiaLoopbackUrl -Value $selectedSiteUrl -Label "SiteUrl") {
        throw "O site usado em confirmação de conta deve ser um endereço HTTPS público."
    }
    $selectedSiteUrl = ([System.Uri]::new($selectedSiteUrl)).GetLeftPart([System.UriPartial]::Authority).TrimEnd("/")

    $redirects = [System.Collections.Generic.List[string]]::new()
    $redirects.Add($selectedSiteUrl)
    foreach ($rawRedirect in $AdditionalRedirectUrls.Split(",", [System.StringSplitOptions]::RemoveEmptyEntries)) {
        $redirect = $rawRedirect.Trim()
        $null = Test-MarufiaLoopbackUrl -Value $redirect -Label "AdditionalRedirectUrls"
        if (-not $redirects.Contains($redirect)) { $redirects.Add($redirect) }
    }
    $corsOrigins = [System.Collections.Generic.List[string]]::new()
    $corsOrigins.Add($selectedSiteUrl)
    $corsOrigins.Add("http://tauri.localhost")
    foreach ($redirect in $redirects) {
        $origin = ([System.Uri]::new($redirect)).GetLeftPart([System.UriPartial]::Authority).TrimEnd("/")
        if (-not $corsOrigins.Contains($origin)) { $corsOrigins.Add($origin) }
    }

    $updates = @{
        CLOUDFLARE_TUNNEL_HOSTNAME = $publicHostname
        MARUFIA_PUBLIC_URL = $publicUrl
        SUPABASE_PUBLIC_URL = $publicUrl
        API_EXTERNAL_URL = "$publicUrl/auth/v1"
        SITE_URL = $selectedSiteUrl
        ADDITIONAL_REDIRECT_URLS = ($redirects -join ",")
        MARUFIA_CORS_ALLOWED_ORIGINS = ($corsOrigins -join ",")
        AUTH_MAILER_EXTERNAL_HOSTS = $publicHostname
        ENABLE_EMAIL_AUTOCONFIRM = "false"
    }
    $candidate = $environment.Clone()
    foreach ($entry in $updates.GetEnumerator()) { $candidate[$entry.Key] = $entry.Value }
    Assert-MarufiaAuthSafety -Environment $candidate

    Assert-DockerReady
    $wasRunning = Test-MarufiaCoreIsRunning
    Remove-MarufiaTunnelContainers -Names @(
        "marufia-cloudflared", "marufia-cloudflared-quick", "marufia-public-gateway", "marufia-tunnel-smoke-gateway"
    )
    $originalBytes = [System.IO.File]::ReadAllBytes($script:MarufiaEnvPath)
    Set-MarufiaEnvironmentValues -Values $updates
    $configurationChanged = $true
    Assert-MarufiaEnvironment
    & (Join-Path $PSScriptRoot "render-public-gateway.ps1")
    if ($LASTEXITCODE -ne 0) { throw "O gateway público não pôde ser gerado." }
    if ($wasRunning) {
        Write-MarufiaMessage -Level INFO -Message "Aplicando URLs públicas aos serviços sem remover dados..."
        Invoke-MarufiaCompose -ComposeArguments @("up", "--detach", "--wait", "--wait-timeout", "120")
    }
    Write-MarufiaMessage -Level INFO -Message "Domínio configurado em $publicUrl; o Tunnel permanece parado."
    Write-MarufiaMessage -Level WARNING -Message "Selecione o backend self-hosted e inicie o Tunnel somente após configurar o hostname no painel Cloudflare."
} catch {
    $failure = $_.Exception.Message
    if ($configurationChanged -and $null -ne $originalBytes) {
        try {
            Restore-MarufiaEnvironmentFile -Bytes $originalBytes
            if ($wasRunning) { Invoke-MarufiaCompose -ComposeArguments @("up", "--detach", "--wait", "--wait-timeout", "120") }
            Write-MarufiaMessage -Level WARNING -Message "A configuração anterior foi restaurada automaticamente."
        } catch {
            Write-MarufiaMessage -Level ERROR -Message "O rollback automático falhou. Não inicie o Tunnel antes de revisar o .env privado."
        }
    }
    Write-MarufiaMessage -Level ERROR -Message $failure
    exit 1
} finally {
    $originalBytes = $null
}
