#Requires -Version 7.4

[CmdletBinding()]
param(
    [ValidatePattern("^https?://")]
    [string]$PublicUrl = "http://127.0.0.1:8000",

    [ValidatePattern("^https?://")]
    [string]$SiteUrl = "https://ficha-marufia-latio.italocas7.chatgpt.site",

    [string]$AdditionalRedirectUrls = "http://127.0.0.1:4173,http://localhost:4173",

    [ValidatePattern("^[A-Za-z0-9._-]{3,64}$")]
    [string]$DashboardUsername = "marufia"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function ConvertTo-Base64Url {
    param([Parameter(Mandatory = $true)][byte[]]$Bytes)
    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Get-RandomBytes {
    param([Parameter(Mandatory = $true)][int]$Count)
    $bytes = [byte[]]::new($Count)
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return $bytes
}

function Get-RandomHex {
    param([Parameter(Mandatory = $true)][int]$Count)
    return ([Convert]::ToHexString((Get-RandomBytes -Count $Count))).ToLowerInvariant()
}

function Get-RandomBase64 {
    param([Parameter(Mandatory = $true)][int]$Count)
    return [Convert]::ToBase64String((Get-RandomBytes -Count $Count))
}

function New-Hs256Jwt {
    param(
        [Parameter(Mandatory = $true)][string]$Role,
        [Parameter(Mandatory = $true)][string]$Secret,
        [Parameter(Mandatory = $true)][long]$IssuedAt,
        [Parameter(Mandatory = $true)][long]$ExpiresAt
    )

    $utf8 = [System.Text.Encoding]::UTF8
    $header = ConvertTo-Base64Url -Bytes $utf8.GetBytes('{"alg":"HS256","typ":"JWT"}')
    $payloadJson = [ordered]@{ role = $Role; iss = "supabase"; iat = $IssuedAt; exp = $ExpiresAt } |
        ConvertTo-Json -Compress
    $payload = ConvertTo-Base64Url -Bytes $utf8.GetBytes($payloadJson)
    $unsigned = "$header.$payload"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new($utf8.GetBytes($Secret))
    try {
        $signature = ConvertTo-Base64Url -Bytes $hmac.ComputeHash($utf8.GetBytes($unsigned))
    } finally {
        $hmac.Dispose()
    }
    return "$unsigned.$signature"
}

function New-Es256Jwt {
    param(
        [Parameter(Mandatory = $true)][string]$Role,
        [Parameter(Mandatory = $true)][string]$KeyId,
        [Parameter(Mandatory = $true)]$SigningKey,
        [Parameter(Mandatory = $true)][long]$IssuedAt,
        [Parameter(Mandatory = $true)][long]$ExpiresAt
    )

    $utf8 = [System.Text.Encoding]::UTF8
    $headerJson = [ordered]@{ alg = "ES256"; typ = "JWT"; kid = $KeyId } | ConvertTo-Json -Compress
    $payloadJson = [ordered]@{ role = $Role; iss = "supabase"; iat = $IssuedAt; exp = $ExpiresAt } |
        ConvertTo-Json -Compress
    $unsigned = "$(ConvertTo-Base64Url -Bytes $utf8.GetBytes($headerJson)).$(ConvertTo-Base64Url -Bytes $utf8.GetBytes($payloadJson))"
    $signature = $SigningKey.SignData(
        $utf8.GetBytes($unsigned),
        [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        [System.Security.Cryptography.DSASignatureFormat]::IeeeP1363FixedFieldConcatenation
    )
    return "$unsigned.$(ConvertTo-Base64Url -Bytes $signature)"
}

function New-OpaqueApiKey {
    param([Parameter(Mandatory = $true)][string]$Prefix)
    $random = (ConvertTo-Base64Url -Bytes (Get-RandomBytes -Count 17)).Substring(0, 22)
    $intermediate = "$Prefix$random"
    $checksumInput = "supabase-self-hosted|$intermediate"
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $checksum = (ConvertTo-Base64Url -Bytes $sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($checksumInput))).Substring(0, 8)
    } finally {
        $sha.Dispose()
    }
    return "${intermediate}_$checksum"
}

if (Test-Path -LiteralPath $script:MarufiaEnvPath) {
    throw "O arquivo marufia-server\.env já existe. Ele não foi sobrescrito para proteger as chaves atuais."
}

$templatePath = Join-Path $script:MarufiaServerRoot ".env.example"
if (-not (Test-Path -LiteralPath $templatePath -PathType Leaf)) {
    throw "Modelo .env.example não encontrado."
}

$issuedAt = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$expiresAt = $issuedAt + (5L * 365L * 24L * 60L * 60L)
$jwtSecret = Get-RandomBase64 -Count 30
$curve = [System.Security.Cryptography.ECCurve+NamedCurves]::nistP256
$ec = [System.Security.Cryptography.ECDsa]::Create($curve)

try {
    $parameters = $ec.ExportParameters($true)
    $keyId = [guid]::NewGuid().ToString()
    $symmetricKey = [ordered]@{
        kty = "oct"
        k = ConvertTo-Base64Url -Bytes ([System.Text.Encoding]::UTF8.GetBytes($jwtSecret))
        alg = "HS256"
    }
    $privateKey = [ordered]@{
        kty = "EC"; kid = $keyId; use = "sig"; key_ops = @("sign", "verify"); alg = "ES256"; ext = $true
        crv = "P-256"; x = ConvertTo-Base64Url -Bytes $parameters.Q.X; y = ConvertTo-Base64Url -Bytes $parameters.Q.Y
        d = ConvertTo-Base64Url -Bytes $parameters.D
    }
    $publicKey = [ordered]@{
        kty = "EC"; kid = $keyId; use = "sig"; key_ops = @("verify"); alg = "ES256"; ext = $true
        crv = "P-256"; x = ConvertTo-Base64Url -Bytes $parameters.Q.X; y = ConvertTo-Base64Url -Bytes $parameters.Q.Y
    }

    $values = @{
        "MARUFIA_PUBLIC_URL" = $PublicUrl.TrimEnd("/")
        "MARUFIA_STUDIO_URL" = $PublicUrl.TrimEnd("/")
        "POSTGRES_PASSWORD" = Get-RandomHex -Count 32
        "JWT_SECRET" = $jwtSecret
        "ANON_KEY" = New-Hs256Jwt -Role "anon" -Secret $jwtSecret -IssuedAt $issuedAt -ExpiresAt $expiresAt
        "SERVICE_ROLE_KEY" = New-Hs256Jwt -Role "service_role" -Secret $jwtSecret -IssuedAt $issuedAt -ExpiresAt $expiresAt
        "SUPABASE_PUBLISHABLE_KEY" = New-OpaqueApiKey -Prefix "sb_publishable_"
        "SUPABASE_SECRET_KEY" = New-OpaqueApiKey -Prefix "sb_secret_"
        "ANON_KEY_ASYMMETRIC" = New-Es256Jwt -Role "anon" -KeyId $keyId -SigningKey $ec -IssuedAt $issuedAt -ExpiresAt $expiresAt
        "SERVICE_ROLE_KEY_ASYMMETRIC" = New-Es256Jwt -Role "service_role" -KeyId $keyId -SigningKey $ec -IssuedAt $issuedAt -ExpiresAt $expiresAt
        "JWT_KEYS" = @($privateKey, $symmetricKey) | ConvertTo-Json -Compress -Depth 8
        "JWT_JWKS" = [ordered]@{ keys = @($publicKey, $symmetricKey) } | ConvertTo-Json -Compress -Depth 8
        "DASHBOARD_USERNAME" = $DashboardUsername
        "DASHBOARD_PASSWORD" = Get-RandomHex -Count 24
        "SECRET_KEY_BASE" = Get-RandomBase64 -Count 48
        "REALTIME_DB_ENC_KEY" = Get-RandomHex -Count 8
        "VAULT_ENC_KEY" = Get-RandomHex -Count 16
        "PG_META_CRYPTO_KEY" = Get-RandomBase64 -Count 24
        "LOGFLARE_PUBLIC_ACCESS_TOKEN" = Get-RandomBase64 -Count 24
        "LOGFLARE_PRIVATE_ACCESS_TOKEN" = Get-RandomBase64 -Count 24
        "S3_PROTOCOL_ACCESS_KEY_ID" = Get-RandomHex -Count 16
        "S3_PROTOCOL_ACCESS_KEY_SECRET" = Get-RandomHex -Count 32
        "MINIO_ROOT_PASSWORD" = Get-RandomHex -Count 16
        "POOLER_TENANT_ID" = "marufia-$(Get-RandomHex -Count 8)"
        "SUPABASE_PUBLIC_URL" = $PublicUrl.TrimEnd("/")
        "API_EXTERNAL_URL" = "$($PublicUrl.TrimEnd('/'))/auth/v1"
        "SITE_URL" = $SiteUrl.TrimEnd("/")
        "ADDITIONAL_REDIRECT_URLS" = $AdditionalRedirectUrls
    }

    $outputLines = foreach ($line in [System.IO.File]::ReadAllLines($templatePath)) {
        $separator = $line.IndexOf("=")
        if ($separator -gt 0) {
            $key = $line.Substring(0, $separator).Trim()
            if ($values.ContainsKey($key)) {
                "$key=$($values[$key])"
                continue
            }
        }
        $line
    }

    if ($outputLines -match "__GENERATE_ON_SETUP__") {
        throw "Nem todos os segredos do modelo foram gerados."
    }

    $temporaryPath = "$($script:MarufiaEnvPath).$PID.tmp"
    [System.IO.File]::WriteAllLines($temporaryPath, $outputLines, [System.Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporaryPath -Destination $script:MarufiaEnvPath
} finally {
    $ec.Dispose()
}

Assert-MarufiaEnvironment
Write-MarufiaMessage -Level INFO -Message "Configuração privada criada em marufia-server\.env. Nenhum segredo foi exibido."
Write-MarufiaMessage -Level WARNING -Message "Confirmação automática de email está habilitada apenas para o ambiente experimental da Fase 3."
