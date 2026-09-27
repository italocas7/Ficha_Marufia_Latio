param(
    [string]$KeyPath = "$env:USERPROFILE\.tauri\marufia-online-updater.key"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

function Show-Message {
    param(
        [string]$Text,
        [string]$Title,
        [System.Windows.Forms.MessageBoxIcon]$Icon
    )

    [void][System.Windows.Forms.MessageBox]::Show(
        $Text,
        $Title,
        [System.Windows.Forms.MessageBoxButtons]::OK,
        $Icon
    )
}

if (-not (Test-Path -LiteralPath $KeyPath -PathType Leaf)) {
    Show-Message "A chave protegida do atualizador não foi encontrada." "Build interrompido" ([System.Windows.Forms.MessageBoxIcon]::Error)
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseVersion = (Get-Content -Raw (Join-Path $projectRoot "package.json") | ConvertFrom-Json).version

$form = New-Object System.Windows.Forms.Form
$form.Text = "Assinar Marufia Online $releaseVersion"
$form.StartPosition = "CenterScreen"
$form.ClientSize = New-Object System.Drawing.Size(470, 185)
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.Font = New-Object System.Drawing.Font("Segoe UI", 10)

$intro = New-Object System.Windows.Forms.Label
$intro.Location = New-Object System.Drawing.Point(24, 18)
$intro.Size = New-Object System.Drawing.Size(420, 48)
$intro.Text = "Digite a senha da chave para gerar o instalador e sua assinatura. A senha permanecerá somente na memória durante este build."
$form.Controls.Add($intro)

$passwordLabel = New-Object System.Windows.Forms.Label
$passwordLabel.Location = New-Object System.Drawing.Point(24, 73)
$passwordLabel.Size = New-Object System.Drawing.Size(420, 22)
$passwordLabel.Text = "Senha da chave"
$form.Controls.Add($passwordLabel)

$passwordBox = New-Object System.Windows.Forms.TextBox
$passwordBox.Location = New-Object System.Drawing.Point(24, 97)
$passwordBox.Size = New-Object System.Drawing.Size(420, 25)
$passwordBox.UseSystemPasswordChar = $true
$form.Controls.Add($passwordBox)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(264, 137)
$cancelButton.Size = New-Object System.Drawing.Size(86, 32)
$cancelButton.Text = "Cancelar"
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($cancelButton)

$buildButton = New-Object System.Windows.Forms.Button
$buildButton.Location = New-Object System.Drawing.Point(358, 137)
$buildButton.Size = New-Object System.Drawing.Size(86, 32)
$buildButton.Text = "Gerar"
$buildButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$buildButton.Enabled = $false
$form.Controls.Add($buildButton)

$passwordBox.Add_TextChanged({
    $buildButton.Enabled = $passwordBox.Text.Length -ge 12
})
$form.CancelButton = $cancelButton
$form.AcceptButton = $buildButton

$result = $form.ShowDialog()
if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    exit 2
}

$password = $passwordBox.Text
$passwordBox.Clear()
$form.Dispose()

try {
    $nodeCandidates = @()
    if (-not [string]::IsNullOrWhiteSpace($env:LATIO_NODE)) {
        $nodeCandidates += $env:LATIO_NODE
    }
    $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $nodeCandidates += $nodeCommand.Source
    }
    $nodeCandidates += (Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe")
    $nodePath = $nodeCandidates |
        Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) } |
        Select-Object -First 1
    if ([string]::IsNullOrWhiteSpace($nodePath)) {
        throw "Node.js não foi encontrado. Instale o Node.js ou configure LATIO_NODE com o caminho completo de node.exe."
    }
    $env:TAURI_SIGNING_PRIVATE_KEY = $KeyPath
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $password
    $password = $null
    $logDirectory = Join-Path $projectRoot "tmp"
    $logPath = Join-Path $logDirectory "windows-signing-build.log"
    $null = New-Item -ItemType Directory -Path $logDirectory -Force
    Push-Location $projectRoot
    try {
        & $nodePath "tools\build_windows.cjs" *> $logPath
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($exitCode -ne 0) {
        $details = (Get-Content -LiteralPath $logPath -Tail 18 -ErrorAction SilentlyContinue | Out-String).Trim()
        if ([string]::IsNullOrWhiteSpace($details)) { $details = "Nenhum detalhe foi retornado pelo build." }
        if ($details -match "(?i)password|secret|token|private.?key") {
            $details = "O build retornou um diagnóstico relacionado à assinatura. Consulte o arquivo tmp/windows-signing-build.log sem compartilhar a senha."
        }
        throw "O build assinado retornou o código $exitCode.`n$details"
    }
    Write-Output "Os executáveis e a assinatura da versão $releaseVersion foram gerados com sucesso."
    exit 0
}
catch {
    $message = $_.Exception.Message
    if ($message.Length -gt 1800) { $message = $message.Substring(0, 1800) + "..." }
    Show-Message "O build assinado não foi concluído:`n`n$message" "Build interrompido" ([System.Windows.Forms.MessageBoxIcon]::Error)
    exit 1
}
finally {
    $password = $null
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
}
