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

$form = New-Object System.Windows.Forms.Form
$form.Text = "Assinar Marufia Online 0.2.4"
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
    $projectRoot = Split-Path -Parent $PSScriptRoot
    $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
    $env:TAURI_SIGNING_PRIVATE_KEY = $KeyPath
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = $password
    $password = $null
    Push-Location $projectRoot
    try {
        & $nodePath "tools\build_windows.cjs"
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($exitCode -ne 0) {
        throw "O build assinado retornou o código $exitCode."
    }
    Write-Output "Os executáveis e a assinatura da versão 0.2.4 foram gerados com sucesso."
    exit 0
}
catch {
    Show-Message "O build assinado não foi concluído. Volte ao Codex para verificarmos a causa sem expor sua senha." "Build interrompido" ([System.Windows.Forms.MessageBoxIcon]::Error)
    exit 1
}
finally {
    $password = $null
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
}
