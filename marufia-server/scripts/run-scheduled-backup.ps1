#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

$logDirectory = Join-Path $script:MarufiaServerRoot "logs"
$logPath = Join-Path $logDirectory "backup-$((Get-Date).ToString('yyyy-MM')).log"

function Write-ScheduledBackupLog {
    param(
        [Parameter(Mandatory = $true)][ValidateSet("INFO", "ERROR")][string]$Level,
        [Parameter(Mandatory = $true)][string]$Message
    )

    if (-not (Test-Path -LiteralPath $logDirectory -PathType Container)) {
        $null = New-Item -ItemType Directory -Path $logDirectory
    }
    $safeMessage = $Message -replace "[\r\n]+", " "
    $line = "$([DateTimeOffset]::Now.ToString('o')) [$Level] $safeMessage`n"
    [System.IO.File]::AppendAllText($logPath, $line, [System.Text.UTF8Encoding]::new($false))
}

try {
    & (Join-Path $PSScriptRoot "backup.ps1") -ThrowOnError
    Write-ScheduledBackupLog -Level INFO -Message "Backup diário criado e validado."
} catch {
    Write-ScheduledBackupLog -Level ERROR -Message "Backup diário falhou: $($_.Exception.Message)"
    exit 1
}
