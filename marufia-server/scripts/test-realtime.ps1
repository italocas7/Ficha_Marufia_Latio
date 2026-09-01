#Requires -Version 7.4

[CmdletBinding()]
param(
    [string]$NodePath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Resolve-MarufiaNodeCommand {
    param([string]$RequestedPath)

    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        $resolved = Resolve-Path -LiteralPath $RequestedPath -ErrorAction Stop
        if (-not (Test-Path -LiteralPath $resolved.Path -PathType Leaf)) {
            throw "O executável Node.js informado não existe."
        }
        return $resolved.Path
    }
    $pathCommand = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue
    if ($pathCommand) { return $pathCommand.Source }
    foreach ($candidate in @(
        (Join-Path $env:ProgramFiles "nodejs\node.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\nodejs\node.exe")
    )) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) { return $candidate }
    }
    throw "Node.js não foi encontrado. Informe -NodePath para executar o teste técnico de Realtime."
}

function Get-MarufiaRealtimeDataCount {
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
        throw "O teste descartável de Realtime só pode ser executado no servidor local."
    }
    if ($environment["ENABLE_EMAIL_AUTOCONFIRM"].Trim().ToLowerInvariant() -ne "true") {
        throw "O teste local exige a confirmação automática do ambiente experimental."
    }
    if ((Get-MarufiaRealtimeDataCount) -ne 0) {
        throw "O teste de Realtime exige o banco experimental vazio para não tocar em dados existentes."
    }

    $nodeCommand = Resolve-MarufiaNodeCommand -RequestedPath $NodePath
    $helperPath = Join-Path (Split-Path -Parent $script:MarufiaServerRoot) "tools\test_marufia_server_realtime.cjs"
    if (-not (Test-Path -LiteralPath $helperPath -PathType Leaf)) {
        throw "O executor técnico do teste Realtime está ausente."
    }
    $runId = [guid]::NewGuid().ToString("N")
    $gmEmail = "phase7-gm-$runId@example.invalid"
    $playerEmail = "phase7-player-$runId@example.invalid"
    $outsiderEmail = "phase7-outsider-$runId@example.invalid"
    $createdEmails = @($gmEmail, $playerEmail, $outsiderEmail)
    $password = "Mrf!" + [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24))
    $temporaryEnvironment = @{
        MARUFIA_REALTIME_URL = $baseUrl
        MARUFIA_REALTIME_PUBLIC_KEY = $environment["SUPABASE_PUBLISHABLE_KEY"]
        MARUFIA_REALTIME_TEST_PASSWORD = $password
        MARUFIA_REALTIME_RUN_ID = $runId
        MARUFIA_REALTIME_GM_EMAIL = $gmEmail
        MARUFIA_REALTIME_PLAYER_EMAIL = $playerEmail
        MARUFIA_REALTIME_OUTSIDER_EMAIL = $outsiderEmail
    }
    $previousEnvironment = @{}

    try {
        foreach ($entry in $temporaryEnvironment.GetEnumerator()) {
            $previousEnvironment[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, "Process")
            [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
        }
        & $nodeCommand $helperPath
        if ($LASTEXITCODE -ne 0) { throw "O teste técnico de Realtime terminou com código $LASTEXITCODE." }
    } finally {
        foreach ($entry in $temporaryEnvironment.GetEnumerator()) {
            [Environment]::SetEnvironmentVariable($entry.Key, $previousEnvironment[$entry.Key], "Process")
        }
        $safeEmails = @($createdEmails | ForEach-Object { "'" + $_.Replace("'", "''") + "'" }) -join ","
        $null = Invoke-MarufiaDatabaseSql -Sql "delete from auth.users where email in ($safeEmails);"
        if ((Get-MarufiaRealtimeDataCount) -ne 0) {
            throw "A limpeza do teste Realtime falhou; o banco experimental não voltou ao estado vazio."
        }
        Write-MarufiaMessage -Level INFO -Message "Canais, contas e dados descartáveis de Realtime removidos."
    }
} catch {
    $line = $_.InvocationInfo.ScriptLineNumber
    $details = if ($line) { "linha ${line}: $($_.Exception.Message)" } else { $_.Exception.Message }
    Write-MarufiaMessage -Level ERROR -Message $details
    exit 1
}
