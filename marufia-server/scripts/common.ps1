Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:MarufiaServerRoot = Split-Path -Parent $PSScriptRoot
$script:MarufiaEnvPath = Join-Path $script:MarufiaServerRoot ".env"
$script:MarufiaBaseComposePath = Join-Path $script:MarufiaServerRoot "supabase\docker\docker-compose.yml"
$script:MarufiaOverrideComposePath = Join-Path $script:MarufiaServerRoot "docker-compose.marufia.yml"
$script:MarufiaTunnelComposePath = Join-Path $script:MarufiaServerRoot "cloudflare\docker-compose.tunnel.yml"
$script:MarufiaTunnelTokenPath = Join-Path $script:MarufiaServerRoot "cloudflare\tunnel-token.token"
$script:MarufiaBackupDirectory = Join-Path $script:MarufiaServerRoot "backups"
$script:MarufiaLogDirectory = Join-Path $script:MarufiaServerRoot "logs"
$script:MarufiaComposeProject = "marufia-server"
$script:MinimumComposeVersion = [version]"2.24.4"

function Protect-MarufiaLogMessage {
    param([Parameter(Mandatory = $true)][string]$Message)

    $safe = $Message -replace "[\r\n]+", " "
    $rules = @(
        @{ Pattern = '(?i)(authorization\s*:\s*bearer\s+)\S+'; Replacement = '$1[REDACTED]' },
        @{ Pattern = '(?i)((?:password|secret|token|service_role|smtp_pass|jwt_secret)\s*[=:]\s*)\S+'; Replacement = '$1[REDACTED]' },
        @{ Pattern = '(?<![A-Za-z0-9_])re_[A-Za-z0-9]{20,}(?![A-Za-z0-9_])'; Replacement = '[REDACTED]' },
        @{ Pattern = 'sb_secret_[A-Za-z0-9_-]{16,}'; Replacement = '[REDACTED]' },
        @{ Pattern = 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'; Replacement = '[REDACTED]' }
    )
    foreach ($rule in $rules) {
        $safe = [regex]::Replace($safe, $rule.Pattern, $rule.Replacement)
    }
    if ($safe.Length -gt 1500) { $safe = $safe.Substring(0, 1500) + "…" }
    return $safe
}

function Write-MarufiaOperationalLog {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("INFO", "WARNING", "ERROR")][string]$Level,
        [Parameter(Mandatory = $true)][string]$Message
    )

    try {
        if (-not (Test-Path -LiteralPath $script:MarufiaLogDirectory -PathType Container)) {
            $null = New-Item -ItemType Directory -Path $script:MarufiaLogDirectory
        }
        $safe = Protect-MarufiaLogMessage -Message $Message
        $logPath = Join-Path $script:MarufiaLogDirectory "operations-$((Get-Date).ToString('yyyy-MM')).log"
        $line = "$([DateTimeOffset]::Now.ToString('o')) [$Level] $safe`n"
        [System.IO.File]::AppendAllText($logPath, $line, [System.Text.UTF8Encoding]::new($false))

        $cutoff = [DateTimeOffset]::UtcNow.AddDays(-90)
        $logRoot = [System.IO.Path]::GetFullPath($script:MarufiaLogDirectory).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
        foreach ($oldLog in @(Get-ChildItem -LiteralPath $script:MarufiaLogDirectory -File -Filter "operations-*.log" | Where-Object LastWriteTimeUtc -LT $cutoff.UtcDateTime)) {
            $candidate = [System.IO.Path]::GetFullPath($oldLog.FullName)
            if ($candidate.StartsWith($logRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
                Remove-Item -LiteralPath $candidate -Force
            }
        }
    } catch {
        # Logs auxiliares nunca interrompem a operação principal.
    }
}

function Write-MarufiaMessage {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("INFO", "WARNING", "ERROR")]
        [string]$Level,

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[$Level] $Message"
    Write-MarufiaOperationalLog -Level $Level -Message $Message
}

function Get-MarufiaEnvironmentMap {
    if (-not (Test-Path -LiteralPath $script:MarufiaEnvPath -PathType Leaf)) {
        throw "Configuração ausente. Execute .\marufia-server\scripts\setup-environment.ps1 primeiro."
    }

    $values = @{}
    foreach ($line in [System.IO.File]::ReadAllLines($script:MarufiaEnvPath)) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
        $separator = $line.IndexOf("=")
        if ($separator -le 0) { continue }
        $key = $line.Substring(0, $separator).Trim()
        $values[$key] = $line.Substring($separator + 1)
    }
    return $values
}

function Test-MarufiaLoopbackUrl {
    param(
        [Parameter(Mandatory = $true)][string]$Value,
        [Parameter(Mandatory = $true)][string]$Label
    )

    try {
        $uri = [System.Uri]::new($Value)
    } catch {
        throw "$Label contém um endereço inválido."
    }
    if (-not $uri.IsAbsoluteUri -or $uri.Scheme -notin @("http", "https")) {
        throw "$Label deve usar HTTP ou HTTPS."
    }
    $loopback = $uri.Host -in @("localhost", "127.0.0.1", "::1", "[::1]")
    if (-not $loopback -and $uri.Scheme -ne "https") {
        throw "$Label externo deve usar HTTPS."
    }
    return $loopback
}

function ConvertTo-MarufiaPublicHostname {
    param([Parameter(Mandatory = $true)][string]$Value)

    $hostname = $Value.Trim().TrimEnd(".").ToLowerInvariant()
    if ($hostname -notmatch "^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$" -or
        $hostname -match "(?:^|\.)(?:localhost|example|invalid|test)$" -or
        $hostname.EndsWith(".trycloudflare.com")) {
        throw "O hostname público deve ser um domínio HTTPS real controlado pelo Mestre."
    }
    return $hostname
}

function Assert-MarufiaSmtpSafety {
    param([Parameter(Mandatory = $true)][hashtable]$Environment)

    foreach ($key in @("SMTP_ADMIN_EMAIL", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS")) {
        if (-not $Environment.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($Environment[$key])) {
            throw "O servidor externo exige configuração SMTP completa; $key está ausente."
        }
    }
    try {
        $senderAddress = [System.Net.Mail.MailAddress]::new($Environment["SMTP_ADMIN_EMAIL"])
    } catch {
        throw "SMTP_ADMIN_EMAIL deve conter um remetente válido."
    }
    $reservedSuffixes = @(".invalid", ".test", ".example", ".localhost")
    $smtpHostIsReserved = $Environment["SMTP_HOST"] -in @("localhost", "127.0.0.1", "::1")
    $senderIsReserved = $false
    foreach ($suffix in $reservedSuffixes) {
        $smtpHostIsReserved = $smtpHostIsReserved -or $Environment["SMTP_HOST"].EndsWith($suffix, [System.StringComparison]::OrdinalIgnoreCase)
        $senderIsReserved = $senderIsReserved -or $senderAddress.Host.EndsWith($suffix, [System.StringComparison]::OrdinalIgnoreCase)
    }
    if ($smtpHostIsReserved -or $senderIsReserved) {
        throw "O servidor externo exige um SMTP real e um remetente válido."
    }
    $smtpPort = 0
    if (-not [int]::TryParse($Environment["SMTP_PORT"], [ref]$smtpPort) -or $smtpPort -lt 1 -or $smtpPort -gt 65535) {
        throw "SMTP_PORT deve ser uma porta válida entre 1 e 65535."
    }
}

function Get-MarufiaCorsOrigins {
    param([Parameter(Mandatory = $true)][hashtable]$Environment)

    if (-not $Environment.ContainsKey("SITE_URL") -or [string]::IsNullOrWhiteSpace($Environment["SITE_URL"])) {
        throw "SITE_URL é obrigatória para configurar CORS."
    }
    try {
        $siteUri = [System.Uri]::new($Environment["SITE_URL"])
    } catch {
        throw "SITE_URL contém um endereço inválido."
    }
    if (-not $siteUri.IsAbsoluteUri -or $siteUri.UserInfo -or $siteUri.Query -or $siteUri.Fragment) {
        throw "SITE_URL deve ser um endereço absoluto sem credenciais, consulta ou fragmento."
    }
    $siteOrigin = $siteUri.GetLeftPart([System.UriPartial]::Authority).TrimEnd("/")
    $rawOrigins = @($siteOrigin, "http://tauri.localhost")
    if ($Environment.ContainsKey("MARUFIA_CORS_ALLOWED_ORIGINS") -and
        -not [string]::IsNullOrWhiteSpace($Environment["MARUFIA_CORS_ALLOWED_ORIGINS"])) {
        $rawOrigins += $Environment["MARUFIA_CORS_ALLOWED_ORIGINS"].Split(",", [System.StringSplitOptions]::RemoveEmptyEntries)
    } elseif ($Environment.ContainsKey("ADDITIONAL_REDIRECT_URLS")) {
        $rawOrigins += $Environment["ADDITIONAL_REDIRECT_URLS"].Split(",", [System.StringSplitOptions]::RemoveEmptyEntries)
    }

    $origins = [System.Collections.Generic.List[string]]::new()
    foreach ($rawOrigin in $rawOrigins) {
        try {
            $uri = [System.Uri]::new($rawOrigin.Trim())
        } catch {
            throw "A lista CORS contém uma origem inválida."
        }
        if (-not $uri.IsAbsoluteUri -or $uri.UserInfo -or $uri.Query -or $uri.Fragment -or
            $uri.AbsolutePath -notin @("", "/")) {
            throw "Cada origem CORS deve conter somente protocolo, hostname e porta opcional."
        }
        $origin = $uri.GetLeftPart([System.UriPartial]::Authority).TrimEnd("/")
        $loopback = $uri.Host -in @("localhost", "127.0.0.1", "::1", "[::1]")
        $tauriOrigin = $origin -eq "http://tauri.localhost"
        if ($uri.Scheme -ne "https" -and -not $loopback -and -not $tauriOrigin) {
            throw "Origem CORS externa deve usar HTTPS."
        }
        if (-not $origins.Contains($origin)) { $origins.Add($origin) }
    }
    if ($origins.Count -gt 12) { throw "A lista CORS aceita no máximo 12 origens exatas." }
    if (-not $origins.Contains($siteOrigin)) { throw "A origem do SITE_URL deve estar permitida no CORS." }
    return $origins.ToArray()
}

function Set-MarufiaEnvironmentValues {
    param([Parameter(Mandatory = $true)][hashtable]$Values)

    foreach ($entry in $Values.GetEnumerator()) {
        if ($entry.Key -notmatch "^[A-Z][A-Z0-9_]*$" -or [string]$entry.Value -match "[\r\n]") {
            throw "Uma alteração inválida de configuração foi recusada."
        }
    }
    $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    $lines = foreach ($line in [System.IO.File]::ReadAllLines($script:MarufiaEnvPath)) {
        $separator = $line.IndexOf("=")
        if ($separator -gt 0) {
            $key = $line.Substring(0, $separator).Trim()
            if ($Values.ContainsKey($key)) {
                $null = $seen.Add($key)
                "$key=$($Values[$key])"
                continue
            }
        }
        $line
    }
    foreach ($key in @($Values.Keys | Sort-Object)) {
        if (-not $seen.Contains($key)) { $lines += "$key=$($Values[$key])" }
    }
    $temporaryPath = "$($script:MarufiaEnvPath).$PID.$([guid]::NewGuid().ToString('N')).tmp"
    try {
        [System.IO.File]::WriteAllLines($temporaryPath, $lines, [System.Text.UTF8Encoding]::new($false))
        Move-Item -LiteralPath $temporaryPath -Destination $script:MarufiaEnvPath -Force
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -LiteralPath $temporaryPath -Force }
    }
}

function Assert-MarufiaAuthSafety {
    param([Parameter(Mandatory = $true)][hashtable]$Environment)

    foreach ($key in @("SUPABASE_PUBLIC_URL", "API_EXTERNAL_URL", "SITE_URL", "AUTH_REDIRECT_URL", "MARUFIA_CLIENT_SITE_URL", "ADDITIONAL_REDIRECT_URLS", "ENABLE_EMAIL_AUTOCONFIRM")) {
        if (-not $Environment.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($Environment[$key])) {
            throw "A variável $key é obrigatória para a segurança do Auth."
        }
    }

    $apiIsLoopback = Test-MarufiaLoopbackUrl -Value $Environment["SUPABASE_PUBLIC_URL"] -Label "SUPABASE_PUBLIC_URL"
    $authIsLoopback = Test-MarufiaLoopbackUrl -Value $Environment["API_EXTERNAL_URL"] -Label "API_EXTERNAL_URL"
    $null = Test-MarufiaLoopbackUrl -Value $Environment["SITE_URL"] -Label "SITE_URL"
    $null = Test-MarufiaLoopbackUrl -Value $Environment["AUTH_REDIRECT_URL"] -Label "AUTH_REDIRECT_URL"
    $null = Test-MarufiaLoopbackUrl -Value $Environment["MARUFIA_CLIENT_SITE_URL"] -Label "MARUFIA_CLIENT_SITE_URL"
    foreach ($redirect in $Environment["ADDITIONAL_REDIRECT_URLS"].Split(",", [System.StringSplitOptions]::RemoveEmptyEntries)) {
        $null = Test-MarufiaLoopbackUrl -Value $redirect.Trim() -Label "ADDITIONAL_REDIRECT_URLS"
    }

    $publicUri = [System.Uri]::new($Environment["SUPABASE_PUBLIC_URL"])
    $authUri = [System.Uri]::new($Environment["API_EXTERNAL_URL"])
    $publicPath = $publicUri.AbsolutePath.TrimEnd("/")
    $expectedAuthPath = "$publicPath/auth/v1"
    if ($publicUri.Scheme -ne $authUri.Scheme -or $publicUri.Host -ne $authUri.Host -or
        $publicUri.Port -ne $authUri.Port -or $authUri.AbsolutePath.TrimEnd("/") -ne $expectedAuthPath -or
        $apiIsLoopback -ne $authIsLoopback) {
        throw "API_EXTERNAL_URL deve corresponder a SUPABASE_PUBLIC_URL seguida de /auth/v1."
    }
    if ($Environment["SITE_URL"].TrimEnd("/") -ne $Environment["AUTH_REDIRECT_URL"].TrimEnd("/")) {
        throw "SITE_URL e AUTH_REDIRECT_URL devem apontar para a mesma página segura de confirmação."
    }
    $allowedRedirects = @($Environment["ADDITIONAL_REDIRECT_URLS"].Split(",", [System.StringSplitOptions]::RemoveEmptyEntries) |
        ForEach-Object { $_.Trim().TrimEnd("/") })
    if ($Environment["AUTH_REDIRECT_URL"].TrimEnd("/") -notin $allowedRedirects) {
        throw "AUTH_REDIRECT_URL deve constar em ADDITIONAL_REDIRECT_URLS."
    }

    $autoconfirmText = $Environment["ENABLE_EMAIL_AUTOCONFIRM"].Trim().ToLowerInvariant()
    if ($autoconfirmText -notin @("true", "false")) {
        throw "ENABLE_EMAIL_AUTOCONFIRM deve ser true ou false."
    }
    if (-not $Environment.ContainsKey("AUTH_MAX_REQUEST_DURATION") -or
        $Environment["AUTH_MAX_REQUEST_DURATION"] -notmatch "^(?:[1-5][0-9]|60)s$") {
        throw "AUTH_MAX_REQUEST_DURATION deve ficar entre 10s e 60s."
    }
    if (-not $apiIsLoopback -and $autoconfirmText -eq "true") {
        throw "Confirmação automática de email é permitida somente no servidor experimental local."
    }

    if (-not $apiIsLoopback) {
        Assert-MarufiaSmtpSafety -Environment $Environment
        if (-not $Environment.ContainsKey("AUTH_MAILER_EXTERNAL_HOSTS") -or
            [string]::IsNullOrWhiteSpace($Environment["AUTH_MAILER_EXTERNAL_HOSTS"])) {
            throw "O hostname público do Auth deve constar em AUTH_MAILER_EXTERNAL_HOSTS."
        }
        $mailerHosts = [System.Collections.Generic.List[string]]::new()
        foreach ($rawHost in $Environment["AUTH_MAILER_EXTERNAL_HOSTS"].Split(",", [System.StringSplitOptions]::RemoveEmptyEntries)) {
            $hostName = ConvertTo-MarufiaPublicHostname -Value $rawHost
            if (-not $mailerHosts.Contains($hostName)) { $mailerHosts.Add($hostName) }
        }
        if ($mailerHosts.Count -gt 8 -or -not $mailerHosts.Contains($publicUri.Host.ToLowerInvariant())) {
            throw "AUTH_MAILER_EXTERNAL_HOSTS deve conter o hostname público exato do Auth."
        }
    }
    $null = Get-MarufiaCorsOrigins -Environment $Environment
}

function Assert-MarufiaEnvironment {
    $environment = Get-MarufiaEnvironmentMap
    $required = @(
        "POSTGRES_PASSWORD",
        "JWT_SECRET",
        "ANON_KEY",
        "SERVICE_ROLE_KEY",
        "SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_SECRET_KEY",
        "JWT_KEYS",
        "JWT_JWKS",
        "DASHBOARD_PASSWORD",
        "SECRET_KEY_BASE",
        "REALTIME_DB_ENC_KEY",
        "VAULT_ENC_KEY",
        "PG_META_CRYPTO_KEY",
        "S3_PROTOCOL_ACCESS_KEY_ID",
        "S3_PROTOCOL_ACCESS_KEY_SECRET",
        "POOLER_TENANT_ID"
    )

    foreach ($key in $required) {
        if (-not $environment.ContainsKey($key) -or
            [string]::IsNullOrWhiteSpace($environment[$key]) -or
            $environment[$key] -like "__*__") {
            throw "A variável $key não foi configurada com segurança. Execute setup-environment.ps1."
        }
    }

    if ($environment["JWT_SECRET"].Length -lt 32) {
        throw "JWT_SECRET precisa ter pelo menos 32 caracteres."
    }
    if ($environment["REALTIME_DB_ENC_KEY"].Length -ne 16) {
        throw "REALTIME_DB_ENC_KEY precisa ter exatamente 16 caracteres."
    }
    if ($environment["VAULT_ENC_KEY"].Length -ne 32) {
        throw "VAULT_ENC_KEY precisa ter exatamente 32 caracteres."
    }

    try {
        $null = $environment["JWT_KEYS"] | ConvertFrom-Json
        $jwks = $environment["JWT_JWKS"] | ConvertFrom-Json
        if (-not $jwks.keys -or $jwks.keys.Count -lt 2) {
            throw "JWKS incompleto."
        }
    } catch {
        throw "As chaves JWT assimétricas do .env são inválidas. Gere a configuração novamente."
    }

    Assert-MarufiaAuthSafety -Environment $environment
}

function Resolve-DockerCommand {
    $pathCommand = Get-Command docker.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($pathCommand) {
        return $pathCommand.Source
    }

    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin\docker.exe"),
        (Join-Path $env:ProgramFiles "Docker\Docker\resources\bin\docker.exe")
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return $candidate
        }
    }

    throw "Docker Desktop não foi encontrado. Instale e inicie o Docker Desktop para Windows."
}

function Get-DockerComposeVersion {
    $dockerCommand = Resolve-DockerCommand
    $rawVersion = (& $dockerCommand compose version --short 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose v2 não está disponível: $rawVersion"
    }

    $match = [regex]::Match($rawVersion, "v?(\d+\.\d+\.\d+)")
    if (-not $match.Success) {
        throw "Não foi possível interpretar a versão do Docker Compose: $rawVersion"
    }

    $version = [version]$match.Groups[1].Value
    if ($version -lt $script:MinimumComposeVersion) {
        throw "Docker Compose $version é antigo. Use $script:MinimumComposeVersion ou superior."
    }
    return $version
}

function Assert-DockerReady {
    $version = Get-DockerComposeVersion
    $dockerCommand = Resolve-DockerCommand
    $dockerInfo = (& $dockerCommand info --format "{{.ServerVersion}}" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($dockerInfo)) {
        throw "Docker Desktop está instalado, mas o mecanismo de containers não está em execução."
    }
    Write-MarufiaMessage -Level INFO -Message "Docker Compose $version e Docker Engine $dockerInfo disponíveis."
}

function Get-MarufiaComposeArguments {
    param([switch]$IncludeTunnel)

    $arguments = @(
        "compose",
        "--env-file", $script:MarufiaEnvPath,
        "--project-name", $script:MarufiaComposeProject,
        "--file", $script:MarufiaBaseComposePath,
        "--file", $script:MarufiaOverrideComposePath
    )
    if ($IncludeTunnel) {
        if (-not (Test-Path -LiteralPath $script:MarufiaTunnelComposePath -PathType Leaf)) {
            throw "Configuração do Cloudflare Tunnel não encontrada."
        }
        $arguments += @("--file", $script:MarufiaTunnelComposePath)
    }
    return $arguments
}

function Invoke-MarufiaCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ComposeArguments
    )

    $baseArguments = @(Get-MarufiaComposeArguments)
    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand @baseArguments @ComposeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "O Docker Compose terminou com código $LASTEXITCODE."
    }
}

function Invoke-MarufiaTunnelCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ComposeArguments
    )

    $baseArguments = @(Get-MarufiaComposeArguments -IncludeTunnel)
    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand @baseArguments @ComposeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "O Docker Compose do Tunnel terminou com código $LASTEXITCODE."
    }
}

function Assert-MarufiaTunnelTokenFile {
    if (-not (Test-Path -LiteralPath $script:MarufiaTunnelTokenPath -PathType Leaf)) {
        throw "Token do Tunnel ausente. Execute .\marufia-server\scripts\set-tunnel-token.ps1."
    }
    $token = [System.IO.File]::ReadAllText($script:MarufiaTunnelTokenPath).Trim()
    if ($token.Length -lt 80 -or $token.Length -gt 4096 -or $token -match "\s") {
        throw "O arquivo privado do Tunnel não contém um token válido."
    }
}

function Remove-MarufiaTunnelContainers {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("marufia-cloudflared", "marufia-cloudflared-quick", "marufia-public-gateway", "marufia-tunnel-smoke-gateway")]
        [string[]]$Names
    )

    $dockerCommand = Resolve-DockerCommand
    foreach ($name in $Names) {
        $existing = (& $dockerCommand ps --all --filter "name=^/${name}$" --format "{{.Names}}" 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Não foi possível consultar o container $name." }
        if ($existing -eq $name) {
            $null = & $dockerCommand rm --force $name 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Não foi possível remover o container temporário $name." }
        }
    }
}

function Invoke-MarufiaDatabaseSql {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Sql,

        [switch]$TuplesOnly,

        [ValidatePattern("^[a-z][a-z0-9_]{0,62}$")]
        [string]$Database = "postgres"
    )

    $dockerCommand = Resolve-DockerCommand
    $arguments = @(
        "exec", "--interactive", "supabase-db",
        "psql", "--no-psqlrc", "--set", "ON_ERROR_STOP=1",
        "--username", "postgres", "--dbname", $Database
    )
    if ($TuplesOnly) {
        $arguments += @("--tuples-only", "--no-align", "--quiet")
    }

    $output = $Sql | & $dockerCommand @arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        $details = ($output | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($details)) {
            $details = "psql terminou com código $LASTEXITCODE."
        }
        throw "Falha ao executar SQL no banco local '$Database': $details"
    }
    return ($output | Out-String).Trim()
}
