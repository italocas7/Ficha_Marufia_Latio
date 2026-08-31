Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:MarufiaServerRoot = Split-Path -Parent $PSScriptRoot
$script:MarufiaEnvPath = Join-Path $script:MarufiaServerRoot ".env"
$script:MarufiaBaseComposePath = Join-Path $script:MarufiaServerRoot "supabase\docker\docker-compose.yml"
$script:MarufiaOverrideComposePath = Join-Path $script:MarufiaServerRoot "docker-compose.marufia.yml"
$script:MarufiaComposeProject = "marufia-server"
$script:MinimumComposeVersion = [version]"2.24.4"

function Write-MarufiaMessage {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet("INFO", "WARNING", "ERROR")]
        [string]$Level,

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    Write-Host "[$Level] $Message"
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

function Invoke-MarufiaCompose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$ComposeArguments
    )

    $baseArguments = @(
        "compose",
        "--env-file", $script:MarufiaEnvPath,
        "--project-name", $script:MarufiaComposeProject,
        "--file", $script:MarufiaBaseComposePath,
        "--file", $script:MarufiaOverrideComposePath
    )

    $dockerCommand = Resolve-DockerCommand
    & $dockerCommand @baseArguments @ComposeArguments
    if ($LASTEXITCODE -ne 0) {
        throw "O Docker Compose terminou com código $LASTEXITCODE."
    }
}
