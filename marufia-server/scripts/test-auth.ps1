#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function ConvertFrom-MarufiaJwtPart {
    param([Parameter(Mandatory = $true)][string]$Value)

    $normalized = $Value.Replace("-", "+").Replace("_", "/")
    $normalized = $normalized.PadRight([Math]::Ceiling($normalized.Length / 4) * 4, "=")
    $json = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($normalized))
    return $json | ConvertFrom-Json
}

function Assert-MarufiaSession {
    param(
        [Parameter(Mandatory = $true)]$Session,
        [Parameter(Mandatory = $true)][guid]$UserId
    )

    if ([string]::IsNullOrWhiteSpace($Session.access_token) -or [string]::IsNullOrWhiteSpace($Session.refresh_token)) {
        throw "O Auth não devolveu o par de tokens da sessão."
    }
    $parts = $Session.access_token.Split(".")
    if ($parts.Count -ne 3) { throw "O access token não possui o formato JWT esperado." }
    $header = ConvertFrom-MarufiaJwtPart -Value $parts[0]
    $claims = ConvertFrom-MarufiaJwtPart -Value $parts[1]
    if ($header.alg -ne "ES256") { throw "O Auth local não assinou a sessão com ES256." }
    if ($claims.role -ne "authenticated" -or $claims.aud -ne "authenticated") {
        throw "A sessão não recebeu o papel autenticado esperado."
    }
    if ([guid]$claims.sub -ne $UserId -or [guid]$claims.session_id -eq [guid]::Empty) {
        throw "A sessão não está vinculada ao usuário e ao session_id esperados."
    }
    if ([long]$claims.exp -le [long]$claims.iat) { throw "A validade do access token é inválida." }
}

function Invoke-MarufiaJsonRequest {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("Get", "Post")][string]$Method,
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][string]$ApiKey,
        [string]$AccessToken = "",
        $Body,
        [hashtable]$ExtraHeaders = @{}
    )

    $headers = @{ apikey = $ApiKey }
    if ($AccessToken) { $headers.Authorization = "Bearer $AccessToken" }
    foreach ($entry in $ExtraHeaders.GetEnumerator()) { $headers[$entry.Key] = $entry.Value }
    $parameters = @{
        Method = $Method
        Uri = $Uri
        Headers = $headers
        TimeoutSec = 20
    }
    if ($null -ne $Body) {
        $parameters.ContentType = "application/json"
        $parameters.Body = $Body | ConvertTo-Json -Depth 8 -Compress
    }
    return Invoke-RestMethod @parameters
}

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $baseUrl = $environment["MARUFIA_PUBLIC_URL"].TrimEnd("/")
    $baseUri = [System.Uri]::new($baseUrl)
    if ($baseUri.Host -notin @("localhost", "127.0.0.1", "::1", "[::1]")) {
        throw "O teste descartável de Auth só pode ser executado no servidor local."
    }
    if ($environment["ENABLE_EMAIL_AUTOCONFIRM"].Trim().ToLowerInvariant() -ne "true") {
        throw "O teste local exige confirmação automática; não altere a configuração de produção."
    }

    $publicKey = $environment["SUPABASE_PUBLISHABLE_KEY"]
    $runId = [guid]::NewGuid().ToString("N")
    $gmEmail = "phase5-gm-$runId@example.invalid"
    $playerEmail = "phase5-player-$runId@example.invalid"
    $password = "Mrf!" + [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $createdEmails = @($gmEmail, $playerEmail)
    $gmUserId = [guid]::Empty
    $playerUserId = [guid]::Empty

    try {
        $signupUri = "$baseUrl/auth/v1/signup"
        $gmSignup = Invoke-MarufiaJsonRequest -Method Post -Uri $signupUri -ApiKey $publicKey -Body @{
            email = $gmEmail
            password = $password
            data = @{ display_name = "Mestre Fase 5" }
        }
        $gmUserId = [guid]$gmSignup.user.id
        Assert-MarufiaSession -Session $gmSignup -UserId $gmUserId

        $playerSignup = Invoke-MarufiaJsonRequest -Method Post -Uri $signupUri -ApiKey $publicKey -Body @{
            email = $playerEmail
            password = $password
            data = @{ display_name = "Jogador Fase 5" }
        }
        $playerUserId = [guid]$playerSignup.user.id
        Assert-MarufiaSession -Session $playerSignup -UserId $playerUserId

        $gmProfile = @(Invoke-MarufiaJsonRequest -Method Get -Uri "$baseUrl/rest/v1/profiles?select=id%2Cdisplay_name&id=eq.$gmUserId" -ApiKey $publicKey -AccessToken $gmSignup.access_token)
        $playerProfile = @(Invoke-MarufiaJsonRequest -Method Get -Uri "$baseUrl/rest/v1/profiles?select=id%2Cdisplay_name&id=eq.$playerUserId" -ApiKey $publicKey -AccessToken $playerSignup.access_token)
        if ($gmProfile.Count -ne 1 -or $gmProfile[0].display_name -ne "Mestre Fase 5") { throw "O perfil automático do Mestre não foi criado corretamente." }
        if ($playerProfile.Count -ne 1 -or $playerProfile[0].display_name -ne "Jogador Fase 5") { throw "O perfil automático do Jogador não foi criado corretamente." }

        $foreignProfile = Invoke-MarufiaJsonRequest -Method Get -Uri "$baseUrl/rest/v1/profiles?select=id&id=eq.$playerUserId" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $foreignProfileCount = if ($null -eq $foreignProfile) { 0 } else { @($foreignProfile).Count }
        if ($foreignProfileCount -ne 0) { throw "Um usuário autenticado conseguiu consultar o perfil de outra conta." }

        $campaign = @(Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/rest/v1/campaigns?select=id%2Cname%2Cjoin_code" -ApiKey $publicKey -AccessToken $gmSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{
            name = "Campanha Auth Fase 5"
            description = "Teste descartável"
        })
        if ($campaign.Count -ne 1 -or [string]::IsNullOrWhiteSpace($campaign[0].join_code)) { throw "O Mestre não conseguiu criar a campanha de teste." }

        $joined = @(Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/join_campaign" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
            p_join_code = $campaign[0].join_code
        })
        if ($joined.Count -ne 1 -or $joined[0].member_role -ne "player") { throw "A conta Jogador não recebeu o papel player." }

        $gmMembership = @(Invoke-MarufiaJsonRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_members?select=user_id%2Crole&campaign_id=eq.$($campaign[0].id)&user_id=eq.$gmUserId" -ApiKey $publicKey -AccessToken $gmSignup.access_token)
        $playerMembership = @(Invoke-MarufiaJsonRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_members?select=user_id%2Crole&campaign_id=eq.$($campaign[0].id)&user_id=eq.$playerUserId" -ApiKey $publicKey -AccessToken $gmSignup.access_token)
        if ($gmMembership.Count -ne 1 -or $gmMembership[0].role -ne "gm" -or
            $playerMembership.Count -ne 1 -or $playerMembership[0].role -ne "player") {
            throw "Os papéis Mestre/Jogador não foram derivados da campanha corretamente."
        }

        $refreshed = Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/auth/v1/token?grant_type=refresh_token" -ApiKey $publicKey -Body @{
            refresh_token = $gmSignup.refresh_token
        }
        Assert-MarufiaSession -Session $refreshed -UserId $gmUserId

        $null = Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/auth/v1/logout" -ApiKey $publicKey -AccessToken $refreshed.access_token -Body @{}
        $signedIn = Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/auth/v1/token?grant_type=password" -ApiKey $publicKey -Body @{
            email = $gmEmail
            password = $password
        }
        Assert-MarufiaSession -Session $signedIn -UserId $gmUserId
        $null = Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/auth/v1/logout" -ApiKey $publicKey -AccessToken $signedIn.access_token -Body @{}

        $wrongPasswordDenied = $false
        try {
            $null = Invoke-MarufiaJsonRequest -Method Post -Uri "$baseUrl/auth/v1/token?grant_type=password" -ApiKey $publicKey -Body @{
                email = $gmEmail
                password = "senha-incorreta"
            }
        } catch {
            $wrongPasswordDenied = $_.Exception.Response.StatusCode -in @(400, 401)
        }
        if (-not $wrongPasswordDenied) { throw "Uma senha incorreta não foi recusada como esperado." }

        Write-MarufiaMessage -Level INFO -Message "Auth aprovado: cadastro, perfis, login, logout, refresh, ES256 e papéis Mestre/Jogador."
    } finally {
        $safeEmails = @($createdEmails | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ","
        $null = Invoke-MarufiaDatabaseSql -Sql "delete from auth.users where email in ($safeEmails);"
        $remaining = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select count(*) from auth.users where email in ($safeEmails);"
        if ($remaining -ne "0") { throw "A limpeza das contas descartáveis de Auth falhou." }
        Write-MarufiaMessage -Level INFO -Message "Contas e dados descartáveis removidos por cascade."
    }
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
