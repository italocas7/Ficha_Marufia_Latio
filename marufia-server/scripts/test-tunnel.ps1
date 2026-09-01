#Requires -Version 7.4

[CmdletBinding()]
param(
    [ValidateSet("Quick", "Named")]
    [string]$Mode = "Quick",
    [string]$NodePath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Resolve-MarufiaNodeCommand {
    param([string]$RequestedPath)
    if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
        $resolved = Resolve-Path -LiteralPath $RequestedPath -ErrorAction Stop
        if (-not (Test-Path -LiteralPath $resolved.Path -PathType Leaf)) { throw "O executável Node.js informado não existe." }
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
    throw "Node.js não foi encontrado. Informe -NodePath para executar o ensaio do Tunnel."
}

function Get-MarufiaContainerLine {
    param([Parameter(Mandatory = $true)][string]$Name)
    $dockerCommand = Resolve-DockerCommand
    $line = (& $dockerCommand ps --all --filter "name=^/${Name}$" --format "{{.Names}}|{{.Status}}" 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw "Não foi possível consultar o container $Name." }
    return $line
}

function Assert-MarufiaNoPublishedPorts {
    param([Parameter(Mandatory = $true)][string[]]$Names)
    $dockerCommand = Resolve-DockerCommand
    foreach ($name in $Names) {
        $published = (& $dockerCommand port $name 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Não foi possível verificar as portas de $name." }
        if ($published) { throw "$name publicou uma porta no computador e o ensaio foi interrompido." }
    }
}

function Assert-MarufiaDatabaseIsPrivate {
    $dockerCommand = Resolve-DockerCommand
    foreach ($name in @("supabase-db", "supabase-pooler")) {
        $raw = (& $dockerCommand inspect --format "{{json .HostConfig.PortBindings}}" $name 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Não foi possível verificar a privacidade de $name." }
        if (-not $raw -or $raw -eq "null" -or $raw -eq "{}") { continue }
        $bindings = $raw | ConvertFrom-Json -AsHashtable
        foreach ($port in $bindings.Keys) {
            foreach ($binding in @($bindings[$port])) {
                if ($null -ne $binding -and $binding.HostIp -notin @("127.0.0.1", "::1")) {
                    throw "$name expôs $port fora do loopback; o Tunnel não será testado."
                }
            }
        }
    }
}

function Get-MarufiaQuickTunnelUrl {
    $dockerCommand = Resolve-DockerCommand
    $composeArguments = @(Get-MarufiaComposeArguments -IncludeTunnel)
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        $logs = (& $dockerCommand @composeArguments logs --no-color cloudflared-quick 2>&1 | Out-String)
        if ($LASTEXITCODE -ne 0) { throw "Não foi possível ler o endereço temporário do Tunnel." }
        $matches = [regex]::Matches($logs, "https://[a-z0-9-]+\.trycloudflare\.com")
        if ($matches.Count -gt 0) { return $matches[$matches.Count - 1].Value }
        Start-Sleep -Milliseconds 500
    }
    throw "A Cloudflare não forneceu o endereço temporário do ensaio."
}

$quickContainers = @("marufia-cloudflared-quick", "marufia-tunnel-smoke-gateway")
$temporaryEnvironment = @{}
$previousEnvironment = @{}

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap
    $nodeCommand = Resolve-MarufiaNodeCommand -RequestedPath $NodePath
    $helperPath = Join-Path (Split-Path -Parent $script:MarufiaServerRoot) "tools\test_marufia_tunnel.cjs"
    if (-not (Test-Path -LiteralPath $helperPath -PathType Leaf)) { throw "O executor técnico do Tunnel está ausente." }
    Assert-MarufiaDatabaseIsPrivate

    if ($Mode -eq "Quick") {
        if (Get-MarufiaContainerLine -Name "marufia-cloudflared") {
            throw "O Tunnel permanente está presente. Pare-o antes do ensaio temporário."
        }
        Remove-MarufiaTunnelContainers -Names $quickContainers
        Write-MarufiaMessage -Level INFO -Message "Iniciando ensaio HTTPS temporário com rotas sem dados privados..."
        Invoke-MarufiaTunnelCompose -ComposeArguments @(
            "--profile", "quick-tunnel", "up", "--detach", "--wait", "--wait-timeout", "120", "cloudflared-quick"
        )
        $testUrl = Get-MarufiaQuickTunnelUrl
        Assert-MarufiaNoPublishedPorts -Names $quickContainers
    } else {
        $line = Get-MarufiaContainerLine -Name "marufia-cloudflared"
        if ($line -notmatch "Up.*healthy") { throw "O Tunnel permanente não está saudável." }
        $testUrl = $environment["MARUFIA_PUBLIC_URL"].TrimEnd("/")
    }

    $temporaryEnvironment = @{
        MARUFIA_TUNNEL_URL = $testUrl
        MARUFIA_TUNNEL_PUBLIC_KEY = $environment["SUPABASE_PUBLISHABLE_KEY"]
        MARUFIA_TUNNEL_MODE = $Mode
    }
    foreach ($entry in $temporaryEnvironment.GetEnumerator()) {
        $previousEnvironment[$entry.Key] = [Environment]::GetEnvironmentVariable($entry.Key, "Process")
        [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
    }
    & $nodeCommand $helperPath
    if ($LASTEXITCODE -ne 0) { throw "O ensaio HTTPS/WebSocket terminou com código $LASTEXITCODE." }
    Write-MarufiaMessage -Level INFO -Message "Tunnel validado por HTTPS e WebSocket; nenhuma porta de entrada foi aberta."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
} finally {
    foreach ($entry in $temporaryEnvironment.GetEnumerator()) {
        [Environment]::SetEnvironmentVariable($entry.Key, $previousEnvironment[$entry.Key], "Process")
    }
    if ($Mode -eq "Quick") {
        try {
            Remove-MarufiaTunnelContainers -Names $quickContainers
            Write-MarufiaMessage -Level INFO -Message "Ensaio temporário removido."
        } catch {
            Write-MarufiaMessage -Level WARNING -Message "A limpeza automática do ensaio falhou; execute stop-tunnel.ps1."
        }
    }
}
