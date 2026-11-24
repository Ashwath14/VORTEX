@echo off
title Vortex Speed - Quantum Network Accelerator

:: 1. Start Node.js Engine Silently
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% neq 0 (
    start /b "" "C:\Program Files\nodejs\node.exe" "%~dp0vortex-speed\server.js"
    timeout /t 1 /nobreak >nul
)

:: 2. Launch Futuristic Desktop Application Window
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://127.0.0.1:49876" --window-size=1260,840
exit
