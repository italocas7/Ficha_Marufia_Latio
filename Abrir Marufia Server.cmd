@echo off
setlocal
title Marufia Server

set "MARUFIA_ROOT=%~dp0"
set "MARUFIA_MANAGER=%MARUFIA_ROOT%marufia-server\scripts\server-manager.ps1"
set "MARUFIA_PWSH=%LOCALAPPDATA%\Programs\PowerShell\7\pwsh.exe"

if not exist "%MARUFIA_PWSH%" set "MARUFIA_PWSH=%ProgramFiles%\PowerShell\7\pwsh.exe"

if not exist "%MARUFIA_MANAGER%" (
  echo O gerenciador do Marufia Server nao foi encontrado.
  echo Mantenha este arquivo dentro da pasta principal do projeto.
  pause
  exit /b 1
)

if not exist "%MARUFIA_PWSH%" (
  echo A versao local do PowerShell 7 nao foi encontrada.
  echo Execute novamente a instalacao do Marufia Server e tente de novo.
  pause
  exit /b 1
)

if "%~1"=="" (
  "%MARUFIA_PWSH%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%MARUFIA_MANAGER%"
) else (
  "%MARUFIA_PWSH%" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%MARUFIA_MANAGER%" -Action "%~1"
)
set "MARUFIA_EXIT=%ERRORLEVEL%"

if not "%MARUFIA_EXIT%"=="0" (
  echo.
  echo O gerenciador terminou com erro. A mensagem acima indica o motivo.
  pause
)

endlocal & exit /b %MARUFIA_EXIT%
