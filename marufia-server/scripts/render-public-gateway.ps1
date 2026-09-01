#Requires -Version 7.4

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "common.ps1")

try {
    $environment = Get-MarufiaEnvironmentMap
    $origins = @(Get-MarufiaCorsOrigins -Environment $environment)
    $templatePath = Join-Path $script:MarufiaServerRoot "cloudflare\public-gateway-envoy.yaml"
    $outputPath = Join-Path $script:MarufiaServerRoot "cloudflare\public-gateway-envoy.generated.yaml"
    if (-not (Test-Path -LiteralPath $templatePath -PathType Leaf)) {
        throw "O modelo do gateway público não foi encontrado."
    }
    $template = [System.IO.File]::ReadAllText($templatePath)
    $marker = "__MARUFIA_CORS_ORIGIN_MATCHERS__"
    if (($template.Split($marker).Count - 1) -ne 1) {
        throw "O marcador CORS do gateway público está inválido."
    }
    $originMatchers = @($origins | ForEach-Object {
        "                            - exact: $($_ | ConvertTo-Json -Compress)"
    }) -join [Environment]::NewLine
    $rendered = $template.Replace($marker, $originMatchers)
    if ($rendered.Contains("__MARUFIA_")) { throw "O gateway público ainda contém um marcador não resolvido." }

    $temporaryPath = "$outputPath.$PID.$([guid]::NewGuid().ToString('N')).tmp"
    try {
        [System.IO.File]::WriteAllText($temporaryPath, $rendered, [System.Text.UTF8Encoding]::new($false))
        Move-Item -LiteralPath $temporaryPath -Destination $outputPath -Force
    } finally {
        if (Test-Path -LiteralPath $temporaryPath) { Remove-Item -LiteralPath $temporaryPath -Force }
    }
    Write-MarufiaMessage -Level INFO -Message "Gateway público gerado para $($origins.Count) origens CORS exatas."
} catch {
    Write-MarufiaMessage -Level ERROR -Message $_.Exception.Message
    exit 1
}
