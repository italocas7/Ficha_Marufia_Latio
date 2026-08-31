#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $serverRoot = Split-Path -Parent $PSScriptRoot
    $repositoryRoot = Split-Path -Parent $serverRoot
    $testPath = Join-Path $repositoryRoot "supabase\tests\rls_security.test.sql"
    $testSql = [System.IO.File]::ReadAllText($testPath)
    $result = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql $testSql

    if ($result -notmatch "(?m)^1\.\.35\s*$" -or
        $result -match "(?m)^not ok\b" -or
        $result -notmatch "(?m)^ok 35 -") {
        throw "A suíte transacional de RLS não aprovou os 35 cenários."
    }

    & (Join-Path $PSScriptRoot "verify-schema.ps1") -RequireEmptyData
    if ($LASTEXITCODE -ne 0) {
        throw "O rollback da suíte de RLS deixou dados no banco."
    }
    Write-MarufiaMessage -Level INFO -Message "35 testes transacionais de RLS aprovados com rollback integral."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
