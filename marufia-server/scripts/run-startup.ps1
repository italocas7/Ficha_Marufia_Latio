#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Start-DockerDesktopIfNeeded {
    try {
        $null = Resolve-DockerCommand
    } catch {
        throw
    }
    $dockerCommand = Resolve-DockerCommand
    $null = & $dockerCommand info --format "{{.ServerVersion}}" 2>&1
    if ($LASTEXITCODE -eq 0) { return }

    $candidates = @(
        (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe")
    )
    $desktop = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    if (-not $desktop) { throw "Docker Desktop não foi encontrado para a inicialização automática." }
    Start-Process -FilePath $desktop -WindowStyle Hidden
}

try {
    Write-MarufiaMessage -Level INFO -Message "Inicialização automática do Marufia Server iniciada."
    Start-DockerDesktopIfNeeded
    $deadline = [DateTimeOffset]::UtcNow.AddMinutes(5)
    do {
        try {
            Assert-DockerReady
            $ready = $true
        } catch {
            $ready = $false
            Start-Sleep -Seconds 5
        }
    } while (-not $ready -and [DateTimeOffset]::UtcNow -lt $deadline)
    if (-not $ready) { throw "Docker não ficou disponível em cinco minutos." }

    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "start-server.ps1")
    if ($LASTEXITCODE -ne 0) { throw "Os serviços locais não iniciaram." }
    if (Test-Path -LiteralPath $script:MarufiaTunnelTokenPath -PathType Leaf) {
        $global:LASTEXITCODE = 0
        & (Join-Path $PSScriptRoot "start-tunnel.ps1")
        if ($LASTEXITCODE -ne 0) { throw "O Tunnel não iniciou." }
    }
    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "health-check.ps1")
    if ($LASTEXITCODE -ne 0) { throw "O health check falhou após a inicialização automática." }
    Write-MarufiaMessage -Level INFO -Message "Inicialização automática concluída."
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Inicialização automática falhou: $($_.Exception.Message)"
    exit 1
}
