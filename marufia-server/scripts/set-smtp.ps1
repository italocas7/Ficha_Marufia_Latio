#Requires -Version 7.4

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$AdminEmail,
    [Parameter(Mandatory = $true)][string]$HostName,
    [ValidateRange(1, 65535)][int]$Port = 587,
    [Parameter(Mandatory = $true)][string]$User,
    [string]$PasswordFile = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

function Read-MarufiaSmtpPassword {
    param([string]$SourcePath)
    if (-not [string]::IsNullOrWhiteSpace($SourcePath)) {
        $resolved = Resolve-Path -LiteralPath $SourcePath -ErrorAction Stop
        return [System.IO.File]::ReadAllText($resolved.Path).Trim()
    }
    Write-MarufiaMessage -Level INFO -Message "Digite a senha ou chave SMTP. Ela não será exibida."
    $securePassword = Read-Host -AsSecureString
    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    } finally {
        if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
        $securePassword.Dispose()
    }
}

$password = $null
try {
    $password = Read-MarufiaSmtpPassword -SourcePath $PasswordFile
    if ([string]::IsNullOrWhiteSpace($password) -or $password -match "[\r\n]") {
        throw "A senha SMTP está vazia ou contém caracteres inválidos."
    }
    $candidate = Get-MarufiaEnvironmentMap
    $updates = @{
        SMTP_ADMIN_EMAIL = $AdminEmail.Trim()
        SMTP_HOST = $HostName.Trim().ToLowerInvariant()
        SMTP_PORT = [string]$Port
        SMTP_USER = $User.Trim()
        SMTP_PASS = $password
    }
    foreach ($entry in $updates.GetEnumerator()) { $candidate[$entry.Key] = $entry.Value }
    Assert-MarufiaSmtpSafety -Environment $candidate
    Set-MarufiaEnvironmentValues -Values $updates
    Assert-MarufiaSmtpSafety -Environment (Get-MarufiaEnvironmentMap)
    Write-MarufiaMessage -Level INFO -Message "SMTP real configurado sem exibir usuário, senha ou chave."
    Write-MarufiaMessage -Level WARNING -Message "A configuração será aplicada aos containers quando o domínio público for configurado."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
} finally {
    $password = $null
}
