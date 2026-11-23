@echo off
rem One-click Windows entry: double-click this file, or run it from cmd.
rem It hands over to install.ps1 next to it; extra args are forwarded (-Skill / -Service / -All).
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
if errorlevel 1 (
  echo.
  echo Installer exited with an error. Press any key to close.
  pause >nul
)
