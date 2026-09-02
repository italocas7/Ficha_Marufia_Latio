#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "backup-common.ps1")

function Assert-MarufiaTest {
    param(
        [Parameter(Mandatory = $true)][bool]$Condition,
        [Parameter(Mandatory = $true)][string]$Message
    )
    if (-not $Condition) { throw $Message }
}

$temporaryDirectory = ""

try {
    Assert-MarufiaEnvironment
    Assert-DockerReady
    $environment = Get-MarufiaEnvironmentMap

    $descriptors = [System.Collections.Generic.List[object]]::new()
    $origin = [DateTimeOffset]::new(2026, 9, 2, 18, 0, 0, [TimeSpan]::Zero)
    for ($index = 0; $index -lt 40; $index += 1) {
        $descriptors.Add([pscustomobject]@{
            DumpPath = Join-Path $script:MarufiaBackupDirectory "retention-test-$index.dump"
            CreatedAt = $origin.AddDays(-$index)
        })
    }
    $selection = Select-MarufiaRetentionPoints -Descriptors $descriptors.ToArray() -DailyLimit 7 -WeeklyLimit 4 -CurrentDumpPath $descriptors[0].DumpPath
    for ($index = 0; $index -lt 7; $index += 1) {
        Assert-MarufiaTest -Condition $selection.Paths.Contains([System.IO.Path]::GetFullPath($descriptors[$index].DumpPath)) -Message "A retenção diária não preservou um dos sete pontos esperados."
    }
    $weeklyKeys = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)
    foreach ($descriptor in $selection.Ordered) {
        if ($weeklyKeys.Count -ge 4) { break }
        $date = $descriptor.CreatedAt.UtcDateTime.Date
        $week = "$([System.Globalization.ISOWeek]::GetYear($date))-$([System.Globalization.ISOWeek]::GetWeekOfYear($date).ToString('00'))"
        if ($weeklyKeys.Add($week)) {
            Assert-MarufiaTest -Condition $selection.Paths.Contains([System.IO.Path]::GetFullPath($descriptor.DumpPath)) -Message "A retenção semanal não preservou um ponto esperado."
        }
    }
    Assert-MarufiaTest -Condition (-not $selection.Paths.Contains([System.IO.Path]::GetFullPath($descriptors[39].DumpPath))) -Message "A retenção protegeu um ponto antigo fora das janelas configuradas."
    Write-MarufiaMessage -Level INFO -Message "Política de 7 pontos diários e 4 semanais aprovada sem remover arquivos reais."

    $beforeTestDatabases = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select count(*) from pg_database where datname like 'marufia_restore_test_%';"
    $backupPath = & (Join-Path $PSScriptRoot "backup.ps1") -PassThru -ThrowOnError
    if ([string]::IsNullOrWhiteSpace($backupPath) -or -not (Test-Path -LiteralPath $backupPath -PathType Leaf)) {
        throw "O teste não conseguiu criar um backup real."
    }
    $backupSet = Assert-MarufiaBackupSet -DumpPath $backupPath -Password $environment["POSTGRES_PASSWORD"]

    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
    $temporaryDirectory = Join-Path $tempRoot "marufia-backup-test-$([guid]::NewGuid().ToString('N'))"
    $resolvedTemporaryDirectory = [System.IO.Path]::GetFullPath($temporaryDirectory)
    if (-not $resolvedTemporaryDirectory.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "O diretório temporário do teste ficou fora do local permitido."
    }
    $null = New-Item -ItemType Directory -Path $resolvedTemporaryDirectory
    foreach ($source in @($backupSet.Paths.Dump, $backupSet.Paths.Metadata, $backupSet.Paths.Checksum, $backupSet.Paths.EncryptionKey)) {
        Copy-Item -LiteralPath $source -Destination $resolvedTemporaryDirectory
    }
    $tamperedDump = Join-Path $resolvedTemporaryDirectory ([System.IO.Path]::GetFileName($backupSet.Paths.Dump))
    $stream = [System.IO.File]::Open($tamperedDump, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    try {
        $first = $stream.ReadByte()
        if ($first -lt 0) { throw "O dump de teste está vazio." }
        $null = $stream.Seek(0, [System.IO.SeekOrigin]::Begin)
        $stream.WriteByte($first -bxor 0x01)
    } finally {
        $stream.Dispose()
    }
    $tamperRejected = $false
    try {
        $null = Assert-MarufiaBackupSet -DumpPath $tamperedDump -Password $environment["POSTGRES_PASSWORD"] -SkipArchiveRead
    } catch {
        $tamperRejected = $true
    }
    Assert-MarufiaTest -Condition $tamperRejected -Message "Um dump adulterado não foi recusado pelo SHA-256."
    Write-MarufiaMessage -Level INFO -Message "Corrupção simulada recusada antes da restauração."

    & (Join-Path $PSScriptRoot "restore.ps1") -BackupPath $backupPath -Mode Test -ThrowOnError
    $afterTestDatabases = Invoke-MarufiaDatabaseSql -TuplesOnly -Sql "select count(*) from pg_database where datname like 'marufia_restore_test_%';"
    Assert-MarufiaTest -Condition ($beforeTestDatabases -eq $afterTestDatabases) -Message "O teste deixou um banco temporário para trás."

    $global:LASTEXITCODE = 0
    & (Join-Path $PSScriptRoot "verify-schema.ps1")
    if ($LASTEXITCODE -ne 0) { throw "O banco em uso mudou durante o teste isolado de restauração." }
    Write-MarufiaMessage -Level INFO -Message "Backup e restauração aprovados; o banco em uso permaneceu intacto."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
} finally {
    if ($temporaryDirectory) {
        $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
        $resolvedTemporaryDirectory = [System.IO.Path]::GetFullPath($temporaryDirectory)
        if ($resolvedTemporaryDirectory.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
            (Test-Path -LiteralPath $resolvedTemporaryDirectory -PathType Container)) {
            Remove-Item -LiteralPath $resolvedTemporaryDirectory -Recurse -Force
        }
    }
}
