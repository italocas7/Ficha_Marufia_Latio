#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Invoke-MarufiaRlsRequest {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("Get", "Post", "Patch")][string]$Method,
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
        $parameters.Body = $Body | ConvertTo-Json -Depth 10 -Compress
    }
    return Invoke-RestMethod @parameters
}

function Assert-MarufiaRlsDenied {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Action,
        [Parameter(Mandatory = $true)][string]$Label
    )

    try {
        $null = & $Action
    } catch {
        if ($null -eq $_.Exception.Response) { throw }
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -in @(401, 403)) { return }
        throw "$Label retornou HTTP $statusCode em vez de negar com 401/403."
    }
    throw "$Label foi permitido indevidamente."
}

function Assert-MarufiaRows {
    param(
        $Response,
        [Parameter(Mandatory = $true)][int]$ExpectedCount,
        [Parameter(Mandatory = $true)][string]$Label
    )

    [object[]]$rows = @($Response)
    if ($rows.Count -ne $ExpectedCount) {
        throw "$Label retornou $($rows.Count) linha(s); esperado: $ExpectedCount."
    }
    return $rows
}

function Assert-MarufiaIds {
    param(
        $Response,
        [Parameter(Mandatory = $true)][string[]]$ExpectedIds,
        [Parameter(Mandatory = $true)][string]$Label
    )

    $rows = @(Assert-MarufiaRows -Response $Response -ExpectedCount $ExpectedIds.Count -Label $Label)
    $actualIds = @($rows | ForEach-Object { [string]$_.id })
    foreach ($expectedId in $ExpectedIds) {
        if ($expectedId -notin $actualIds) { throw "$Label não retornou o conjunto autorizado esperado." }
    }
    return $rows
}

function Get-MarufiaTestDataCount {
    $sql = @"
select
  (select count(*) from auth.users)
  + (select count(*) from public.profiles)
  + (select count(*) from public.campaigns)
  + (select count(*) from public.campaign_members)
  + (select count(*) from public.characters)
  + (select count(*) from public.rolls)
  + (select count(*) from public.campaign_events)
  + (select count(*) from public.campaign_presence)
  + (select count(*) from public.campaign_sessions);
"@
    return [long](Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $sql)
}

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $baseUrl = $environment["MARUFIA_PUBLIC_URL"].TrimEnd("/")
    $baseUri = [System.Uri]::new($baseUrl)
    if ($baseUri.Host -notin @("localhost", "127.0.0.1", "::1", "[::1]")) {
        throw "O teste descartável de RLS só pode ser executado no servidor local."
    }
    if ($environment["ENABLE_EMAIL_AUTOCONFIRM"].Trim().ToLowerInvariant() -ne "true") {
        throw "O teste local exige a confirmação automática do ambiente experimental."
    }
    if ((Get-MarufiaTestDataCount) -ne 0) {
        throw "O teste de RLS exige o banco experimental vazio para não tocar em dados existentes."
    }

    $publicKey = $environment["SUPABASE_PUBLISHABLE_KEY"]
    $runId = [guid]::NewGuid().ToString("N")
    $gmEmail = "phase6-gm-$runId@example.invalid"
    $playerEmail = "phase6-player-$runId@example.invalid"
    $outsiderEmail = "phase6-outsider-$runId@example.invalid"
    $createdEmails = @($gmEmail, $playerEmail, $outsiderEmail)
    $password = "Mrf!" + [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))

    try {
        foreach ($table in @(
            "profiles", "campaigns", "campaign_members", "characters", "rolls",
            "campaign_events", "campaign_presence", "campaign_sessions"
        )) {
            Assert-MarufiaRlsDenied -Label "Acesso anônimo a $table" -Action {
                Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/$table`?select=*&limit=1" -ApiKey $publicKey
            }
        }
        Assert-MarufiaRlsDenied -Label "RPC anônima join_campaign" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/join_campaign" -ApiKey $publicKey -Body @{
                p_join_code = "MRF-TEST-XX"
            }
        }

        $signupUri = "$baseUrl/auth/v1/signup"
        $gmSignup = Invoke-MarufiaRlsRequest -Method Post -Uri $signupUri -ApiKey $publicKey -Body @{
            email = $gmEmail
            password = $password
            data = @{ display_name = "Mestre RLS" }
        }
        $playerSignup = Invoke-MarufiaRlsRequest -Method Post -Uri $signupUri -ApiKey $publicKey -Body @{
            email = $playerEmail
            password = $password
            data = @{ display_name = "Jogador A RLS" }
        }
        $outsiderSignup = Invoke-MarufiaRlsRequest -Method Post -Uri $signupUri -ApiKey $publicKey -Body @{
            email = $outsiderEmail
            password = $password
            data = @{ display_name = "Usuário Externo RLS" }
        }
        $gmId = [guid]$gmSignup.user.id
        $playerId = [guid]$playerSignup.user.id
        $outsiderId = [guid]$outsiderSignup.user.id

        $gmOwnProfile = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/profiles?select=id&id=eq.$gmId" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $gmForeignProfile = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/profiles?select=id&id=eq.$playerId" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $null = Assert-MarufiaRows -Response $gmOwnProfile -ExpectedCount 1 -Label "Perfil próprio do Mestre"
        $null = Assert-MarufiaRows -Response $gmForeignProfile -ExpectedCount 0 -Label "Perfil alheio visto pelo Mestre"

        $campaignA = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Criação da campanha A" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/campaigns?select=id%2Cjoin_code" -ApiKey $publicKey -AccessToken $gmSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{
                name = "Campanha A RLS"
                description = "Teste descartável de isolamento"
            }
        ))
        $campaignB = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Criação da campanha B" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/campaigns?select=id%2Cjoin_code" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{
                name = "Campanha B RLS"
                description = "Campanha externa descartável"
            }
        ))
        $campaignAId = [guid]$campaignA[0].id
        $campaignBId = [guid]$campaignB[0].id

        $joinResult = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Entrada do Jogador A" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/join_campaign" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                p_join_code = $campaignA[0].join_code
            }
        ))
        if ($joinResult[0].member_role -ne "player") { throw "O convite concedeu um papel diferente de player." }

        $gmCampaigns = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaigns?select=id" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $playerCampaigns = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaigns?select=id" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $outsiderCampaigns = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaigns?select=id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $null = Assert-MarufiaIds -Response $gmCampaigns -ExpectedIds @([string]$campaignAId) -Label "Campanhas visíveis ao Mestre A"
        $null = Assert-MarufiaIds -Response $playerCampaigns -ExpectedIds @([string]$campaignAId) -Label "Campanhas visíveis ao Jogador A"
        $null = Assert-MarufiaIds -Response $outsiderCampaigns -ExpectedIds @([string]$campaignBId) -Label "Campanhas visíveis ao usuário externo"

        $gmMembers = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_members?select=user_id%2Crole&campaign_id=eq.$campaignAId" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $playerMembers = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_members?select=user_id%2Crole&campaign_id=eq.$campaignAId" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $outsiderMembers = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_members?select=user_id%2Crole" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $gmMemberRows = @(Assert-MarufiaRows -Response $gmMembers -ExpectedCount 2 -Label "Membros visíveis ao Mestre A")
        $playerMemberRows = @(Assert-MarufiaRows -Response $playerMembers -ExpectedCount 1 -Label "Membros visíveis ao Jogador A")
        $outsiderMemberRows = @(Assert-MarufiaRows -Response $outsiderMembers -ExpectedCount 1 -Label "Membros visíveis ao usuário externo")
        if ($playerMemberRows[0].user_id -ne [string]$playerId -or $playerMemberRows[0].role -ne "player") {
            throw "O Jogador A conseguiu enumerar outro membro ou recebeu um papel indevido."
        }
        if (@($gmMemberRows | Where-Object role -eq "gm").Count -ne 1 -or
            @($gmMemberRows | Where-Object role -eq "player").Count -ne 1 -or
            $outsiderMemberRows[0].user_id -ne [string]$outsiderId) {
            throw "O isolamento dos membros de campanha divergiu do esperado."
        }

        Assert-MarufiaRlsDenied -Label "Autoelevação de papel do Jogador A" -Action {
            Invoke-MarufiaRlsRequest -Method Patch -Uri "$baseUrl/rest/v1/campaign_members?campaign_id=eq.$campaignAId&user_id=eq.$playerId" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{ role = "gm" }
        }
        Assert-MarufiaRlsDenied -Label "Criação direta de vínculo gm" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/campaign_members" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                campaign_id = $campaignBId
                user_id = $playerId
                role = "gm"
            }
        }

        $playerState = @{
            meta = @{ appId = "marufia-latio"; schemaVersion = 5 }
            character = @{ name = "Personagem A RLS" }
            resources = @{ hpCurrent = 20; pmCurrent = 10 }
            effects = @()
            inventory = @{ weapons = @(); equipment = @() }
        }
        $outsiderState = @{
            meta = @{ appId = "marufia-latio"; schemaVersion = 5 }
            character = @{ name = "Personagem B RLS" }
            resources = @{ hpCurrent = 18; pmCurrent = 9 }
            effects = @()
            inventory = @{ weapons = @(); equipment = @() }
        }
        $playerCharacter = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Criação do personagem A" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/characters?select=id%2Crevision" -ApiKey $publicKey -AccessToken $playerSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{ state = $playerState }
        ))
        $outsiderCharacter = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Criação do personagem B" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/characters?select=id%2Crevision" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{ state = $outsiderState }
        ))
        $playerCharacterId = [guid]$playerCharacter[0].id
        $outsiderCharacterId = [guid]$outsiderCharacter[0].id

        $playerCharacter = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Vínculo do personagem A" -Response (
            Invoke-MarufiaRlsRequest -Method Patch -Uri "$baseUrl/rest/v1/characters?id=eq.$playerCharacterId&select=id%2Crevision%2Ccampaign_id" -ApiKey $publicKey -AccessToken $playerSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{ campaign_id = $campaignAId }
        ))
        $outsiderCharacter = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Vínculo do personagem B" -Response (
            Invoke-MarufiaRlsRequest -Method Patch -Uri "$baseUrl/rest/v1/characters?id=eq.$outsiderCharacterId&select=id%2Crevision%2Ccampaign_id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{ campaign_id = $campaignBId }
        ))
        if ($playerCharacter[0].revision -ne 2 -or $outsiderCharacter[0].revision -ne 2) {
            throw "A revisão inicial dos personagens não foi controlada pelo servidor."
        }

        $gmCharacters = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/characters?select=id" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $playerCharacters = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/characters?select=id" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $outsiderCharacters = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/characters?select=id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $null = Assert-MarufiaIds -Response $gmCharacters -ExpectedIds @([string]$playerCharacterId) -Label "Personagens visíveis ao Mestre A"
        $null = Assert-MarufiaIds -Response $playerCharacters -ExpectedIds @([string]$playerCharacterId) -Label "Personagens visíveis ao Jogador A"
        $null = Assert-MarufiaIds -Response $outsiderCharacters -ExpectedIds @([string]$outsiderCharacterId) -Label "Personagens visíveis ao usuário externo"

        $gmDirectWrite = Invoke-MarufiaRlsRequest -Method Patch -Uri "$baseUrl/rest/v1/characters?id=eq.$playerCharacterId&select=id" -ApiKey $publicKey -AccessToken $gmSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{ campaign_id = $null }
        $outsiderDirectWrite = Invoke-MarufiaRlsRequest -Method Patch -Uri "$baseUrl/rest/v1/characters?id=eq.$playerCharacterId&select=id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token -ExtraHeaders @{ Prefer = "return=representation" } -Body @{ campaign_id = $campaignBId }
        $null = Assert-MarufiaRows -Response $gmDirectWrite -ExpectedCount 0 -Label "Escrita direta do Mestre em personagem alheio"
        $null = Assert-MarufiaRows -Response $outsiderDirectWrite -ExpectedCount 0 -Label "Escrita direta externa em personagem alheio"

        Assert-MarufiaRlsDenied -Label "Salvamento do personagem B pelo Jogador A" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/save_character_state" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                p_character_id = $outsiderCharacterId
                p_state = $playerState
                p_expected_revision = 2
            }
        }
        Assert-MarufiaRlsDenied -Label "Operação de Mestre chamada pelo Jogador A" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/gm_set_character_hp" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                p_character_id = $playerCharacterId
                p_hp_current = 5
                p_expected_revision = 2
            }
        }
        Assert-MarufiaRlsDenied -Label "Operação do Mestre A em campanha externa" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/gm_set_character_hp" -ApiKey $publicKey -AccessToken $gmSignup.access_token -Body @{
                p_character_id = $outsiderCharacterId
                p_hp_current = 5
                p_expected_revision = 2
            }
        }

        $gmWriteRows = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Alteração autorizada de PV pelo Mestre" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/gm_set_character_hp" -ApiKey $publicKey -AccessToken $gmSignup.access_token -Body @{
                p_character_id = $playerCharacterId
                p_hp_current = 7
                p_expected_revision = 2
            }
        ))
        $gmWrite = $gmWriteRows[0]
        if ($gmWrite.revision -ne 3 -or $gmWrite.last_change_origin -ne "gm" -or $gmWrite.state.resources.hpCurrent -ne 7) {
            throw "A operação granular autorizada do Mestre não preservou revisão, origem e PV."
        }
        $playerState.resources.hpCurrent = 8
        $playerWriteRows = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Salvamento autorizado pelo proprietário" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/save_character_state" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                p_character_id = $playerCharacterId
                p_state = $playerState
                p_expected_revision = 3
            }
        ))
        $playerWrite = $playerWriteRows[0]
        if ($playerWrite.revision -ne 4 -or $playerWrite.last_change_origin -ne "player") {
            throw "O proprietário não conseguiu salvar a ficha pela operação autorizada."
        }

        Assert-MarufiaRlsDenied -Label "Edição de campanha pelo Jogador A" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/update_campaign" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                p_campaign_id = $campaignAId
                p_name = "Ataque"
                p_description = ""
            }
        }
        Assert-MarufiaRlsDenied -Label "Início de sessão pelo Jogador A" -Action {
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/start_campaign_session" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
                p_campaign_id = $campaignAId
                p_name = "Ataque"
            }
        }
        $sessionRows = @(Assert-MarufiaRows -ExpectedCount 1 -Label "Sessão iniciada pelo Mestre" -Response (
            Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/start_campaign_session" -ApiKey $publicKey -AccessToken $gmSignup.access_token -Body @{
                p_campaign_id = $campaignAId
                p_name = "Sessão RLS"
            }
        ))
        $session = $sessionRows[0]
        if ($session.status -ne "active") { throw "O Mestre não conseguiu iniciar a sessão autorizada." }

        $null = Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/touch_campaign_presence" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
            p_campaign_id = $campaignAId
            p_active = $true
        }
        $rollId = [guid]::NewGuid()
        $roll = Invoke-MarufiaRlsRequest -Method Post -Uri "$baseUrl/rest/v1/rpc/record_roll" -ApiKey $publicKey -AccessToken $playerSignup.access_token -Body @{
            p_roll_id = $rollId
            p_character_id = $playerCharacterId
            p_roll_type = "skill"
            p_skill_name = "Atletismo"
            p_mode = "normal"
            p_formula = "1d100"
            p_raw_roll = @(20)
            p_modifier = 0
            p_target = 50
            p_total = 20
            p_outcome = "Normal"
            p_visibility = "secret"
        }
        if ($roll.visibility -ne "secret") { throw "A visibilidade da rolagem do Jogador foi alterada indevidamente." }

        $playerRolls = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/rolls?select=id" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $gmRolls = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/rolls?select=id" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $outsiderRolls = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/rolls?select=id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $null = Assert-MarufiaIds -Response $playerRolls -ExpectedIds @([string]$rollId) -Label "Rolagens visíveis ao autor"
        $null = Assert-MarufiaIds -Response $gmRolls -ExpectedIds @([string]$rollId) -Label "Rolagens visíveis ao Mestre A"
        $null = Assert-MarufiaRows -Response $outsiderRolls -ExpectedCount 0 -Label "Rolagens visíveis ao usuário externo"

        $playerEvents = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_events?select=id" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $gmEvents = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_events?select=id" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $outsiderEvents = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_events?select=id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $null = Assert-MarufiaRows -Response $playerEvents -ExpectedCount 0 -Label "Histórico visível ao Jogador A"
        [object[]]$gmEventRows = @($gmEvents)
        if ($gmEventRows.Count -lt 2) { throw "O Mestre não recebeu o histórico autorizado da própria campanha." }
        $null = Assert-MarufiaRows -Response $outsiderEvents -ExpectedCount 0 -Label "Histórico visível ao usuário externo"

        $playerPresence = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_presence?select=user_id" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $gmPresence = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_presence?select=user_id" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $outsiderPresence = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_presence?select=user_id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $null = Assert-MarufiaRows -Response $playerPresence -ExpectedCount 0 -Label "Presença visível ao Jogador A"
        $null = Assert-MarufiaRows -Response $gmPresence -ExpectedCount 1 -Label "Presença visível ao Mestre A"
        $null = Assert-MarufiaRows -Response $outsiderPresence -ExpectedCount 0 -Label "Presença visível ao usuário externo"

        $playerSessions = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_sessions?select=id" -ApiKey $publicKey -AccessToken $playerSignup.access_token
        $gmSessions = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_sessions?select=id" -ApiKey $publicKey -AccessToken $gmSignup.access_token
        $outsiderSessions = Invoke-MarufiaRlsRequest -Method Get -Uri "$baseUrl/rest/v1/campaign_sessions?select=id" -ApiKey $publicKey -AccessToken $outsiderSignup.access_token
        $null = Assert-MarufiaRows -Response $playerSessions -ExpectedCount 0 -Label "Sessões visíveis ao Jogador A"
        $null = Assert-MarufiaRows -Response $gmSessions -ExpectedCount 1 -Label "Sessões visíveis ao Mestre A"
        $null = Assert-MarufiaRows -Response $outsiderSessions -ExpectedCount 0 -Label "Sessões visíveis ao usuário externo"

        Write-MarufiaMessage -Level INFO -Message "RLS pela API aprovado: anônimo negado, campanhas isoladas e privilégios Mestre/Jogador limitados."
    } finally {
        $safeEmails = @($createdEmails | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ","
        $null = Invoke-MarufiaDatabaseSql -Sql "delete from auth.users where email in ($safeEmails);"
        if ((Get-MarufiaTestDataCount) -ne 0) {
            throw "A limpeza do teste RLS falhou; o banco experimental não voltou ao estado vazio."
        }
        Write-MarufiaMessage -Level INFO -Message "Contas e dados descartáveis de RLS removidos por cascade."
    }
} catch {
    $line = $_.InvocationInfo.ScriptLineNumber
    $details = if ($line) { "linha ${line}: $($_.Exception.Message)" } else { $_.Exception.Message }
    Write-MarufiaMessage -Level ERROR -Message $details
    exit 1
}
