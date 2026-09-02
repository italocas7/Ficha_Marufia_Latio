#Requires -Version 7.4

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-MarufiaContainerHealth {
    param([Parameter(Mandatory = $true)][string]$Name)

    $dockerCommand = Resolve-DockerCommand
    $raw = (& $dockerCommand inspect $Name --format '{{json .State}}' 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($raw)) { throw "Container ausente ou inacessível." }
    $state = $raw | ConvertFrom-Json
    if (-not [bool]$state.Running) { throw "Container parado." }
    if ($state.Health -and [string]$state.Health.Status -ne "healthy") {
        throw "Container $($state.Health.Status)."
    }
    return $true
}

function Test-MarufiaHttpStatus {
    param(
        [Parameter(Mandatory = $true)][uri]$Uri,
        [hashtable]$Headers = @{},
        [ValidateRange(1, 30)][int]$TimeoutSeconds = 10
    )

    $response = Invoke-WebRequest -Uri $Uri -Headers $Headers -Method Get -TimeoutSec $TimeoutSeconds -SkipHttpErrorCheck
    if ([int]$response.StatusCode -lt 200 -or [int]$response.StatusCode -ge 300) {
        throw "HTTP $([int]$response.StatusCode)."
    }
    return $true
}

function Invoke-MarufiaHealthProbe {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Probe
    )

    try {
        $null = & $Probe
        return [pscustomobject]@{ Name = $Name; Ok = $true; Status = "OK"; Detail = "" }
    } catch {
        return [pscustomobject]@{
            Name = $Name
            Ok = $false
            Status = "FALHA"
            Detail = Protect-MarufiaLogMessage -Message $_.Exception.Message
        }
    }
}

function Get-MarufiaLatestValidBackup {
    param([Parameter(Mandatory = $true)][hashtable]$Environment)

    if (-not (Get-Command Assert-MarufiaBackupSet -ErrorAction SilentlyContinue)) {
        . (Join-Path $PSScriptRoot "backup-common.ps1")
    }
    $candidates = @(Get-ChildItem -LiteralPath $script:MarufiaBackupDirectory -File -Filter "$($script:MarufiaBackupPrefix)-*.dump" | Sort-Object LastWriteTimeUtc -Descending)
    foreach ($candidate in $candidates) {
        try {
            $set = Assert-MarufiaBackupSet -DumpPath $candidate.FullName -Password $Environment["POSTGRES_PASSWORD"] -SkipKeyDecryption -SkipArchiveRead
            return [pscustomobject]@{
                Path = $candidate.FullName
                Name = $candidate.Name
                CreatedAt = $set.CreatedAt
                SizeBytes = $candidate.Length
            }
        } catch {
            continue
        }
    }
    return $null
}

function Get-MarufiaHealthReport {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $publicKey = $environment["SUPABASE_PUBLISHABLE_KEY"]
    $gatewayPort = 0
    if (-not [int]::TryParse($environment["API_GW_HTTP_PORT"], [ref]$gatewayPort) -or $gatewayPort -lt 1 -or $gatewayPort -gt 65535) {
        throw "API_GW_HTTP_PORT é inválida."
    }
    $localAuthUri = [uri]"http://127.0.0.1:$gatewayPort/auth/v1/health"
    $headers = @{ apikey = $publicKey }

    $components = [ordered]@{}
    $components.Database = Invoke-MarufiaHealthProbe -Name "Database" -Probe {
        $null = Get-MarufiaContainerHealth -Name "supabase-db"
        $answer = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select 1;"
        if ($answer -ne "1") { throw "Consulta de verificação não respondeu corretamente." }
    }
    $components.Auth = Invoke-MarufiaHealthProbe -Name "Auth" -Probe {
        $null = Get-MarufiaContainerHealth -Name "supabase-auth"
        $null = Test-MarufiaHttpStatus -Uri $localAuthUri -Headers $headers
    }
    $components.Rest = Invoke-MarufiaHealthProbe -Name "REST API" -Probe {
        $null = Get-MarufiaContainerHealth -Name "supabase-rest"
        $null = Get-MarufiaContainerHealth -Name "supabase-envoy"
    }
    $components.Realtime = Invoke-MarufiaHealthProbe -Name "Realtime" -Probe {
        $null = Get-MarufiaContainerHealth -Name "realtime-dev.supabase-realtime"
    }
    $components.Storage = Invoke-MarufiaHealthProbe -Name "Storage" -Probe {
        $null = Get-MarufiaContainerHealth -Name "supabase-storage"
    }
    $components.Tunnel = Invoke-MarufiaHealthProbe -Name "Tunnel" -Probe {
        if (-not $environment.ContainsKey("CLOUDFLARE_TUNNEL_HOSTNAME") -or
            [string]::IsNullOrWhiteSpace($environment["CLOUDFLARE_TUNNEL_HOSTNAME"])) {
            throw "Tunnel não configurado."
        }
        $hostname = ConvertTo-MarufiaPublicHostname -Value $environment["CLOUDFLARE_TUNNEL_HOSTNAME"]
        $null = Get-MarufiaContainerHealth -Name "marufia-public-gateway"
        $null = Get-MarufiaContainerHealth -Name "marufia-cloudflared"
        $null = Test-MarufiaHttpStatus -Uri ([uri]"https://$hostname/auth/v1/health") -Headers $headers -TimeoutSeconds 15
    }

    $players = 0
    try {
        $presence = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select count(distinct user_id) from public.campaign_presence where seen_at > now() - interval '90 seconds';"
        $players = [int]$presence
    } catch {
        $players = 0
    }
    $latestBackup = Get-MarufiaLatestValidBackup -Environment $environment
    $allOk = -not @($components.Values | Where-Object { -not $_.Ok }).Count
    return [pscustomobject]@{
        CheckedAt = [DateTimeOffset]::Now
        Components = $components
        AllOk = $allOk
        ConnectedPlayers = $players
        LatestBackup = $latestBackup
    }
}
