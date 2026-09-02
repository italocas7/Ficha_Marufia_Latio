#Requires -Version 7.4

[CmdletBinding()]
param(
    [string]$NodePath = "",

    [ValidateRange(2, 8)]
    [int]$PlayerCount = 5,

    [switch]$IncludeOutage,

    [string]$Confirmation = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "health-common.ps1")

function Resolve-MarufiaAcceptanceNode {
    param([string]$RequestedPath)

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        $resolved = Resolve-Path -LiteralPath $RequestedPath -ErrorAction Stop
        if (-not (Test-Path -LiteralPath $resolved.Path -PathType Leaf)) { throw "O Node.js informado não existe." }
        return $resolved.Path
    }
    $command = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    foreach ($candidate in @(
        (Join-Path $env:ProgramFiles "nodejs\node.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\nodejs\node.exe")
    )) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    throw "Node.js não foi encontrado. Informe -NodePath."
}

function Invoke-MarufiaAdminCreateUser {
    param(
        [Parameter(Mandatory = $true)][string]$BaseUrl,
        [Parameter(Mandatory = $true)][string]$ServiceKey,
        [Parameter(Mandatory = $true)][string]$Email,
        [Parameter(Mandatory = $true)][string]$Password,
        [Parameter(Mandatory = $true)][string]$DisplayName
    )

    try {
        return Invoke-RestMethod -Method Post -Uri "$BaseUrl/auth/v1/admin/users" -Headers @{
            apikey = $ServiceKey
            Authorization = "Bearer $ServiceKey"
        } -ContentType "application/json" -Body (@{
            email = $Email
            password = $Password
            email_confirm = $true
            user_metadata = @{ display_name = $DisplayName }
        } | ConvertTo-Json -Depth 5 -Compress) -TimeoutSec 20
    } catch {
        $status = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        throw "A preparação local de uma conta descartável falhou (HTTP $status)."
    }
}

function Invoke-MarufiaAcceptanceMode {
    param(
        [Parameter(Mandatory = $true)][string]$NodeCommand,
        [Parameter(Mandatory = $true)][string]$HelperPath,
        [Parameter(Mandatory = $true)][ValidateSet("Initial", "Recovery", "Resume")][string]$Mode
    )

    [Environment]::SetEnvironmentVariable("MARUFIA_ACCEPTANCE_MODE", $Mode, "Process")
    & $NodeCommand $HelperPath
    if ($LASTEXITCODE -ne 0) { throw "O fluxo público $Mode terminou com código $LASTEXITCODE." }
}

function Test-MarufiaPublicEndpointUnavailable {
    param(
        [Parameter(Mandatory = $true)][uri]$Uri,
        [Parameter(Mandatory = $true)][string]$PublicKey
    )

    try {
        $response = Invoke-WebRequest -Uri $Uri -Headers @{ apikey = $PublicKey } -TimeoutSec 15 -SkipHttpErrorCheck
        if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300) {
            throw "O endpoint público continuou respondendo como online durante a queda controlada."
        }
    } catch {
        if ($_.Exception.Message -like "O endpoint público continuou*") { throw }
    }
}

$temporaryVariables = @(
    "MARUFIA_ACCEPTANCE_URL", "MARUFIA_ACCEPTANCE_PUBLIC_KEY", "MARUFIA_ACCEPTANCE_PASSWORD",
    "MARUFIA_ACCEPTANCE_RUN_ID", "MARUFIA_ACCEPTANCE_GM_EMAIL", "MARUFIA_ACCEPTANCE_PLAYER_EMAILS",
    "MARUFIA_ACCEPTANCE_OUTSIDER_EMAIL", "MARUFIA_ACCEPTANCE_STATE_PATH", "MARUFIA_ACCEPTANCE_MODE"
)
$previousVariables = @{}
$createdEmails = [System.Collections.Generic.List[string]]::new()
$statePath = ""
$serverStopped = $false
$environment = $null

try {
    if ($IncludeOutage -and $Confirmation -ne "TESTAR-QUEDA-MARUFIA") {
        throw "A queda controlada exige -Confirmation TESTAR-QUEDA-MARUFIA."
    }
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $publicUri = [uri]$environment["MARUFIA_PUBLIC_URL"]
    if ($publicUri.Scheme -ne "https" -or $publicUri.Host -ne $environment["CLOUDFLARE_TUNNEL_HOSTNAME"]) {
        throw "O teste exige o domínio HTTPS configurado no Tunnel nomeado."
    }
    if ($environment["ENABLE_EMAIL_AUTOCONFIRM"].Trim().ToLowerInvariant() -ne "false") {
        throw "O teste público exige confirmação automática desativada."
    }
    $health = Get-MarufiaHealthReport
    if (-not $health.AllOk) { throw "O servidor deve estar totalmente saudável antes do ensaio público." }

    $nodeCommand = Resolve-MarufiaAcceptanceNode -RequestedPath $NodePath
    $repositoryRoot = Split-Path -Parent $script:MarufiaServerRoot
    $helperPath = Join-Path $repositoryRoot "tools\test_marufia_server_public.cjs"
    if (-not (Test-Path -LiteralPath $helperPath -PathType Leaf)) { throw "O executor público da Fase 13 está ausente." }

    $runId = [guid]::NewGuid().ToString("N")
    $statePath = Join-Path ([System.IO.Path]::GetTempPath()) "marufia-phase13-$runId.json"
    $password = "Mrf!" + [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(30))
    $gmEmail = "phase13-gm-$runId@example.invalid"
    $outsiderEmail = "phase13-outsider-$runId@example.invalid"
    $playerEmails = @(1..$PlayerCount | ForEach-Object { "phase13-player$_-$runId@example.invalid" })
    $localUrl = "http://127.0.0.1:$($environment['API_GW_HTTP_PORT'])"
    $serviceKey = $environment["SERVICE_ROLE_KEY"]

    $null = Invoke-MarufiaAdminCreateUser -BaseUrl $localUrl -ServiceKey $serviceKey -Email $gmEmail -Password $password -DisplayName "Mestre Fase 13"
    $createdEmails.Add($gmEmail)
    foreach ($index in 0..($playerEmails.Count - 1)) {
        $null = Invoke-MarufiaAdminCreateUser -BaseUrl $localUrl -ServiceKey $serviceKey -Email $playerEmails[$index] -Password $password -DisplayName "Jogador Fase 13 $($index + 1)"
        $createdEmails.Add($playerEmails[$index])
    }
    $null = Invoke-MarufiaAdminCreateUser -BaseUrl $localUrl -ServiceKey $serviceKey -Email $outsiderEmail -Password $password -DisplayName "Externo Fase 13"
    $createdEmails.Add($outsiderEmail)

    foreach ($name in $temporaryVariables) {
        $previousVariables[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
    }
    $values = @{
        MARUFIA_ACCEPTANCE_URL = $environment["MARUFIA_PUBLIC_URL"]
        MARUFIA_ACCEPTANCE_PUBLIC_KEY = $environment["SUPABASE_PUBLISHABLE_KEY"]
        MARUFIA_ACCEPTANCE_PASSWORD = $password
        MARUFIA_ACCEPTANCE_RUN_ID = $runId
        MARUFIA_ACCEPTANCE_GM_EMAIL = $gmEmail
        MARUFIA_ACCEPTANCE_PLAYER_EMAILS = ($playerEmails | ConvertTo-Json -Compress)
        MARUFIA_ACCEPTANCE_OUTSIDER_EMAIL = $outsiderEmail
        MARUFIA_ACCEPTANCE_STATE_PATH = $statePath
    }
    foreach ($entry in $values.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
    }

    Invoke-MarufiaAcceptanceMode -NodeCommand $nodeCommand -HelperPath $helperPath -Mode Initial
    $afterInitial = Get-MarufiaHealthReport
    if (-not $afterInitial.AllOk -or $afterInitial.ConnectedPlayers -lt $PlayerCount) {
        throw "O health check não reconheceu todos os jogadores ativos após o fluxo inicial."
    }
    Write-MarufiaMessage -Level INFO -Message "Fluxo público inicial aprovado com $PlayerCount jogadores simultâneos."

    if ($IncludeOutage) {
        & (Join-Path $PSScriptRoot "stop-server.ps1")
        if ($LASTEXITCODE -ne 0) { throw "O servidor não parou para a queda controlada." }
        $serverStopped = $true
        Test-MarufiaPublicEndpointUnavailable -Uri ([uri]"$($environment['MARUFIA_PUBLIC_URL'])/auth/v1/health") -PublicKey $environment["SUPABASE_PUBLISHABLE_KEY"]

        & $nodeCommand --test `
            (Join-Path $repositoryRoot "tests\js\character_sync.test.cjs") `
            (Join-Path $repositoryRoot "tests\js\online_rolls.test.cjs")
        if ($LASTEXITCODE -ne 0) { throw "A preservação offline falhou durante a indisponibilidade real." }

        & (Join-Path $PSScriptRoot "start-server.ps1")
        if ($LASTEXITCODE -ne 0) { throw "O servidor não retornou após a queda controlada." }
        $serverStopped = $false
        & (Join-Path $PSScriptRoot "start-tunnel.ps1")
        if ($LASTEXITCODE -ne 0) { throw "O Tunnel não retornou após a queda controlada." }
        $afterReturn = Get-MarufiaHealthReport
        if (-not $afterReturn.AllOk) { throw "O health check falhou após o retorno do servidor." }
        $realtimeReady = $false
        foreach ($attempt in 1..6) {
            try {
                Invoke-MarufiaAcceptanceMode -NodeCommand $nodeCommand -HelperPath $helperPath -Mode Recovery
                $realtimeReady = $true
                break
            } catch {
                if ($attempt -lt 6) {
                    Write-MarufiaMessage -Level WARNING -Message "Realtime ainda está retomando; nova verificação em 10 segundos."
                    Start-Sleep -Seconds 10
                }
            }
        }
        if (-not $realtimeReady) { throw "O Realtime não retomou eventos em até 150 segundos." }
        Write-MarufiaMessage -Level INFO -Message "Queda controlada aprovada: cliente local preservado e serviços recuperados."
    }

    Invoke-MarufiaAcceptanceMode -NodeCommand $nodeCommand -HelperPath $helperPath -Mode Resume
    Write-MarufiaMessage -Level INFO -Message "Persistência, reconexão, concorrência e Realtime público aprovados."
} catch {
    Write-MarufiaMessage -Level ERROR -Message "A aceitação pública falhou: $($_.Exception.Message)"
    exit 1
} finally {
    if ($serverStopped) {
        try {
            & (Join-Path $PSScriptRoot "start-server.ps1")
            & (Join-Path $PSScriptRoot "start-tunnel.ps1")
        } catch {
            Write-MarufiaMessage -Level ERROR -Message "O servidor precisa ser iniciado manualmente após a falha do ensaio."
        }
    }
    foreach ($name in $temporaryVariables) {
        [Environment]::SetEnvironmentVariable($name, $previousVariables[$name], "Process")
    }
    if ($createdEmails.Count -gt 0) {
        try {
            $safeEmails = @($createdEmails | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ","
            $null = Invoke-MarufiaDatabaseSql -Sql "delete from auth.users where email in ($safeEmails);"
            $remaining = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select count(*) from auth.users where email in ($safeEmails);"
            if ($remaining -ne "0") { throw "As contas descartáveis não foram removidas." }
            Write-MarufiaMessage -Level INFO -Message "Contas e dados descartáveis da Fase 13 removidos."
        } catch {
            Write-MarufiaMessage -Level ERROR -Message "A limpeza da Fase 13 precisa de revisão manual."
        }
    }
    if ($statePath -and (Test-Path -LiteralPath $statePath -PathType Leaf)) {
        Remove-Item -LiteralPath $statePath -Force
    }
}
