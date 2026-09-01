#Requires -Version 7.4

[CmdletBinding()]
param(
    [string]$TokenFile = "",
    [switch]$Replace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Read-MarufiaTunnelToken {
    param([string]$SourcePath)

    if (-not [string]::IsNullOrWhiteSpace($SourcePath)) {
        $resolved = Resolve-Path -LiteralPath $SourcePath -ErrorAction Stop
        return [System.IO.File]::ReadAllText($resolved.Path).Trim()
    }

    Write-MarufiaMessage -Level INFO -Message "Cole o token do Tunnel. Ele não será exibido."
    $secureToken = Read-Host -AsSecureString
    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer).Trim()
    } finally {
        if ($pointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        }
        $secureToken.Dispose()
    }
}

try {
    if ((Test-Path -LiteralPath $script:MarufiaTunnelTokenPath -PathType Leaf) -and -not $Replace) {
        throw "Já existe um token privado. Use -Replace somente após gerar um novo token no painel da Cloudflare."
    }

    $token = Read-MarufiaTunnelToken -SourcePath $TokenFile
    if ($token.Length -lt 80 -or $token.Length -gt 4096 -or $token -match "\s") {
        throw "O token informado não tem o formato esperado. Nenhum arquivo foi alterado."
    }

    $targetDirectory = Split-Path -Parent $script:MarufiaTunnelTokenPath
    $temporaryPath = Join-Path $targetDirectory (".tunnel-token-" + [guid]::NewGuid().ToString("N") + ".tmp")
    try {
        [System.IO.File]::WriteAllText(
            $temporaryPath,
            $token,
            [System.Text.UTF8Encoding]::new($false)
        )
        Move-Item -LiteralPath $temporaryPath -Destination $script:MarufiaTunnelTokenPath -Force:$Replace
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }
        $token = $null
    }

    Assert-MarufiaTunnelTokenFile
    Write-MarufiaMessage -Level INFO -Message "Token privado do Tunnel salvo sem ser exibido."
    Write-MarufiaMessage -Level WARNING -Message "Nunca envie esse token por conversa nem o adicione ao Git."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
