#Requires -Version 7.4

[CmdletBinding()]
param(
    [ValidateRange(30, 300)]
    [int]$WaitSeconds = 120
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Test-MarufiaDockerEngine {
    param([Parameter(Mandatory = $true)][string]$DockerCommand)

    $rawVersion = (& $DockerCommand info --format "{{.ServerVersion}}" 2>$null | Out-String).Trim()
    return $LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($rawVersion)
}

function Resolve-MarufiaDockerDesktopExecutable {
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\Docker Desktop.exe"),
        (Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe")
    )
    $desktop = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    if (-not $desktop) { throw "Docker Desktop não foi encontrado para inicialização." }
    return [System.IO.Path]::GetFullPath($desktop)
}

function Repair-MarufiaDockerDesktopRegistration {
    param([Parameter(Mandatory = $true)][string]$DesktopPath)

    $expectedInstallPath = [System.IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop"))
    $actualInstallPath = [System.IO.Path]::GetFullPath((Split-Path -Parent $DesktopPath))
    if (-not $actualInstallPath.Equals($expectedInstallPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $false
    }

    $installerPath = Join-Path $expectedInstallPath "Docker Desktop Installer.exe"
    $backendPath = Join-Path $expectedInstallPath "resources\com.docker.backend.exe"
    foreach ($requiredPath in @($DesktopPath, $installerPath, $backendPath)) {
        if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
            throw "A instalação do Docker Desktop está incompleta; a correção automática foi recusada."
        }
    }

    $uninstallRegistryPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Docker Desktop"
    $uninstallInfo = Get-ItemProperty -LiteralPath $uninstallRegistryPath -ErrorAction SilentlyContinue
    $registeredLocationProperty = if ($uninstallInfo) { $uninstallInfo.PSObject.Properties["InstallLocation"] } else { $null }
    $registeredLocation = if ($registeredLocationProperty) { [string]$registeredLocationProperty.Value } else { "" }
    $uninstallNeedsRepair = [string]::IsNullOrWhiteSpace($registeredLocation)
    if (-not $uninstallNeedsRepair) {
        $registeredInstallPath = [System.IO.Path]::GetFullPath($registeredLocation)
        if (-not $registeredInstallPath.Equals($expectedInstallPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "O caminho cadastrado do Docker não corresponde à instalação encontrada; a correção automática foi recusada."
        }
    }

    $dockerRegistryPath = "HKCU:\SOFTWARE\Docker Inc.\Docker Desktop"
    $currentRegistration = Get-ItemProperty -LiteralPath $dockerRegistryPath -Name "InstallPath" -ErrorAction SilentlyContinue
    $currentPathProperty = if ($currentRegistration) { $currentRegistration.PSObject.Properties["InstallPath"] } else { $null }
    $currentPath = if ($currentPathProperty) { [string]$currentPathProperty.Value } else { "" }
    $dockerRegistrationIsValid = -not [string]::IsNullOrWhiteSpace($currentPath) -and
        ([System.IO.Path]::GetFullPath($currentPath)).Equals($expectedInstallPath, [System.StringComparison]::OrdinalIgnoreCase)
    if (-not $uninstallNeedsRepair -and $dockerRegistrationIsValid) {
        return $false
    }

    foreach ($signedPath in @($DesktopPath, $installerPath)) {
        $signature = Get-AuthenticodeSignature -LiteralPath $signedPath
        if ($signature.Status -ne [System.Management.Automation.SignatureStatus]::Valid -or
            -not $signature.SignerCertificate -or
            $signature.SignerCertificate.Subject -notmatch "(?:^|, )O=Docker Inc(?:,|$)") {
            throw "A assinatura do Docker Desktop não pôde ser validada; a correção automática foi recusada."
        }
    }

    $desktopVersion = (Get-Item -LiteralPath $DesktopPath).VersionInfo.ProductVersion
    $installerVersion = (Get-Item -LiteralPath $installerPath).VersionInfo.ProductVersion
    $versionMatch = [regex]::Match($desktopVersion, "^(?<display>\d+\.\d+\.\d+)\.(?<build>\d+)$")
    if (-not $versionMatch.Success -or $installerVersion -ne $desktopVersion) {
        throw "As versões dos componentes do Docker não correspondem; a correção automática foi recusada."
    }

    if ($uninstallNeedsRepair) {
        $null = New-Item -Path $uninstallRegistryPath -Force
        $stringValues = [ordered]@{
            DisplayIcon = $installerPath
            DisplayName = "Docker Desktop"
            DisplayVersion = $versionMatch.Groups["display"].Value
            Version = $versionMatch.Groups["build"].Value
            InstallLocation = $expectedInstallPath
            InstallType = "exe"
            Publisher = "Docker Inc."
            UninstallString = "`"$installerPath`" `"uninstall`""
        }
        foreach ($entry in $stringValues.GetEnumerator()) {
            $null = New-ItemProperty -LiteralPath $uninstallRegistryPath -Name $entry.Key -PropertyType String -Value $entry.Value -Force
        }
        foreach ($entry in ([ordered]@{ NoModify = 1; NoRepair = 1 }).GetEnumerator()) {
            $null = New-ItemProperty -LiteralPath $uninstallRegistryPath -Name $entry.Key -PropertyType DWord -Value $entry.Value -Force
        }
    }

    $null = New-Item -Path $dockerRegistryPath -Force
    $null = New-ItemProperty -LiteralPath $dockerRegistryPath -Name "InstallPath" -PropertyType String -Value $expectedInstallPath -Force
    return $true
}

function Get-MarufiaDockerLogLength {
    param([Parameter(Mandatory = $true)][string]$LogPath)

    if (-not (Test-Path -LiteralPath $LogPath -PathType Leaf)) { return [long]0 }
    return [long](Get-Item -LiteralPath $LogPath).Length
}

function Get-MarufiaDockerLogDelta {
    param(
        [Parameter(Mandatory = $true)][string]$LogPath,
        [Parameter(Mandatory = $true)][long]$Offset
    )

    if (-not (Test-Path -LiteralPath $LogPath -PathType Leaf)) { return "" }
    $share = [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete
    $stream = [System.IO.File]::Open($LogPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, $share)
    try {
        if ($stream.Length -lt $Offset) { $Offset = 0 }
        $null = $stream.Seek($Offset, [System.IO.SeekOrigin]::Begin)
        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8, $true, 4096, $true)
        try {
            return $reader.ReadToEnd()
        } finally {
            $reader.Dispose()
        }
    } finally {
        $stream.Dispose()
    }
}

function Test-MarufiaDockerSocketCrash {
    param(
        [Parameter(Mandatory = $true)][string]$LogPath,
        [Parameter(Mandatory = $true)][long]$Offset
    )

    $delta = Get-MarufiaDockerLogDelta -LogPath $LogPath -Offset $Offset
    $marker = "backend cancelling with error:"
    $markerIndex = $delta.LastIndexOf($marker, [System.StringComparison]::OrdinalIgnoreCase)
    if ($markerIndex -lt 0) { return $false }
    $lastError = $delta.Substring($markerIndex)
    $componentMatches = $lastError -match "initializing (Ingest server|Secrets Engine)"
    $socketMatches = $lastError -match "(sailor-ingest\.sock|docker-secrets-engine[/\\]engine\.sock)"
    $accessMatches = $lastError -match "(Não é possível o acesso ao arquivo pelo sistema|The file cannot be accessed by the system)"
    return $componentMatches -and $socketMatches -and $accessMatches
}

function Wait-MarufiaDockerEngine {
    param(
        [Parameter(Mandatory = $true)][string]$DockerCommand,
        [Parameter(Mandatory = $true)][string]$LogPath,
        [Parameter(Mandatory = $true)][long]$LogOffset,
        [Parameter(Mandatory = $true)][int]$Seconds
    )

    $deadline = [DateTimeOffset]::UtcNow.AddSeconds($Seconds)
    do {
        if (Test-MarufiaDockerEngine -DockerCommand $DockerCommand) { return "Ready" }
        if (Test-MarufiaDockerSocketCrash -LogPath $LogPath -Offset $LogOffset) { return "StaleSocket" }
        Start-Sleep -Seconds 2
    } while ([DateTimeOffset]::UtcNow -lt $deadline)
    return "Timeout"
}

function Stop-MarufiaBrokenDockerDesktop {
    $processes = @(Get-Process | Where-Object { $_.ProcessName -match "^(Docker Desktop|com\.docker\.backend)$" })
    if ($processes.Count -gt 0) {
        Stop-Process -Id @($processes | ForEach-Object Id) -Force
    }
    & wsl.exe --shutdown
    if ($LASTEXITCODE -ne 0) { throw "O WSL não encerrou durante a recuperação do Docker." }

    $deadline = [DateTimeOffset]::UtcNow.AddSeconds(10)
    do {
        $remaining = @(Get-Process | Where-Object { $_.ProcessName -match "^(Docker Desktop|com\.docker\.backend)$" })
        if ($remaining.Count -eq 0) { return }
        Start-Sleep -Milliseconds 250
    } while ([DateTimeOffset]::UtcNow -lt $deadline)
    throw "Os processos defeituosos do Docker não encerraram durante a recuperação."
}

function Move-MarufiaDockerRuntimeDirectories {
    $stamp = "$(Get-Date -Format 'yyyyMMdd-HHmmss')-$([guid]::NewGuid().ToString('N').Substring(0, 8))"
    $locations = @(
        [pscustomobject]@{
            Parent = [System.IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA "Docker"))
            Name = "run"
            PreservedName = "run.stale-$stamp"
        },
        [pscustomobject]@{
            Parent = [System.IO.Path]::GetFullPath($env:LOCALAPPDATA)
            Name = "docker-secrets-engine"
            PreservedName = "docker-secrets-engine.stale-$stamp"
        }
    )

    $preservedCount = 0
    foreach ($location in $locations) {
        $source = [System.IO.Path]::GetFullPath((Join-Path $location.Parent $location.Name))
        $destination = [System.IO.Path]::GetFullPath((Join-Path $location.Parent $location.PreservedName))
        $allowedPrefix = $location.Parent.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
        if (-not $source.StartsWith($allowedPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
            -not $destination.StartsWith($allowedPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "A recuperação recusou um caminho fora da pasta temporária do Docker."
        }
        if (-not (Test-Path -LiteralPath $source -PathType Container)) { continue }
        if (Test-Path -LiteralPath $destination) { throw "O destino de preservação do Docker já existe." }
        Move-Item -LiteralPath $source -Destination $destination
        $preservedCount += 1
    }
    Write-MarufiaMessage -Level WARNING -Message "Recuperação do Docker preservou $preservedCount pasta(s) temporária(s) travada(s); volumes e dados não foram alterados."
}

function Start-MarufiaDockerDesktop {
    param([Parameter(Mandatory = $true)][string]$DesktopPath)
    Start-Process -FilePath $DesktopPath -WindowStyle Hidden
}

try {
    if ($PSHOME -match "[\\/]WindowsApps[\\/]") {
        throw "Esta edição isolada do PowerShell não pode reparar o cadastro do Docker. Abra pelo atalho Marufia Server da Área de Trabalho."
    }

    $dockerCommand = Resolve-DockerCommand
    $desktopPath = Resolve-MarufiaDockerDesktopExecutable
    $registrationRepaired = Repair-MarufiaDockerDesktopRegistration -DesktopPath $desktopPath
    if ($registrationRepaired) {
        Write-MarufiaMessage -Level WARNING -Message "Cadastro do Docker Desktop no Windows foi reparado com segurança."
    }

    if (Test-MarufiaDockerEngine -DockerCommand $dockerCommand) {
        Write-MarufiaMessage -Level INFO -Message "Docker Desktop já está disponível."
        exit 0
    }

    $productVersionText = (Get-Item -LiteralPath $desktopPath).VersionInfo.ProductVersion
    $productVersionMatch = [regex]::Match($productVersionText, "\d+\.\d+\.\d+")
    if ($productVersionMatch.Success -and [version]$productVersionMatch.Value -lt [version]"4.89.0") {
        throw "Docker Desktop $($productVersionMatch.Value) contém a falha conhecida de sockets do Windows. Atualize para 4.89.0 ou superior."
    }

    $logPath = Join-Path $env:LOCALAPPDATA "Docker\log\host\com.docker.backend.exe.log"
    $runningProcesses = @(Get-Process | Where-Object { $_.ProcessName -match "^(Docker Desktop|com\.docker\.backend)$" })
    $alreadyCrashed = $runningProcesses.Count -gt 0 -and (Test-MarufiaDockerSocketCrash -LogPath $logPath -Offset 0)

    if (-not $alreadyCrashed) {
        $logOffset = Get-MarufiaDockerLogLength -LogPath $logPath
        if ($runningProcesses.Count -eq 0) {
            Write-MarufiaMessage -Level INFO -Message "Iniciando o Docker Desktop..."
            Start-MarufiaDockerDesktop -DesktopPath $desktopPath
        }
        $result = Wait-MarufiaDockerEngine -DockerCommand $dockerCommand -LogPath $logPath -LogOffset $logOffset -Seconds $WaitSeconds
        if ($result -eq "Ready") {
            Write-MarufiaMessage -Level INFO -Message "Docker Desktop iniciado com segurança."
            exit 0
        }
        if ($result -ne "StaleSocket") {
            throw "Docker Desktop não ficou disponível em $WaitSeconds segundos e não apresentou a falha conhecida de sockets."
        }
    }

    Write-MarufiaMessage -Level WARNING -Message "Sockets temporários inacessíveis detectados; iniciando recuperação específica sem reset de fábrica."
    Stop-MarufiaBrokenDockerDesktop
    Move-MarufiaDockerRuntimeDirectories

    $logOffset = Get-MarufiaDockerLogLength -LogPath $logPath
    Start-MarufiaDockerDesktop -DesktopPath $desktopPath
    $result = Wait-MarufiaDockerEngine -DockerCommand $dockerCommand -LogPath $logPath -LogOffset $logOffset -Seconds $WaitSeconds
    if ($result -ne "Ready") {
        throw "A recuperação dos sockets terminou, mas o Docker Desktop não iniciou corretamente ($result)."
    }
    Write-MarufiaMessage -Level INFO -Message "Docker Desktop recuperado e iniciado; volumes e dados do Marufia foram preservados."
} catch {
    Write-MarufiaMessage -Level ERROR -Message "Inicialização segura do Docker falhou: $($_.Exception.Message)"
    exit 1
}
