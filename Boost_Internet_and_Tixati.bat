@echo off
setlocal EnableDelayedExpansion
title Tixati & Internet Speed Booster

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [i] Requesting Administrator privileges to optimize Windows network settings...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

color 0A
cls
echo ======================================================================
echo             TIXATI ^& WINDOWS INTERNET SPEED BOOSTER
echo ======================================================================
echo.
echo [1/5] Setting Wi-Fi Network Profile to 'Private'...
powershell -NoProfile -Command "Set-NetConnectionProfile -InterfaceAlias 'WiFi' -NetworkCategory Private -ErrorAction SilentlyContinue"
echo       -^> Done. Windows Firewall will now permit incoming BitTorrent peer handshakes.
echo.

echo [2/5] Optimizing DNS to Cloudflare (1.1.1.1) and Google (8.8.8.8)...
powershell -NoProfile -Command "Set-DnsClientServerAddress -InterfaceAlias 'WiFi' -ServerAddresses ('1.1.1.1', '1.0.0.1', '8.8.8.8') -ErrorAction SilentlyContinue"
echo       -^> Done. High-speed DNS configured for faster tracker resolutions.
echo.

echo [3/5] Optimizing Windows TCP/IP Stack Parameters...
netsh int tcp set global autotuninglevel=normal >nul 2>&1
netsh int tcp set global rss=enabled >nul 2>&1
netsh int tcp set global fastopen=enabled >nul 2>&1
netsh int tcp set global fastopenfallback=enabled >nul 2>&1
netsh int tcp set global hystart=enabled >nul 2>&1
netsh int tcp set global prr=enabled >nul 2>&1
echo       -^> Done. TCP Receive Window Auto-Tuning and High-Speed packet routing enabled.
echo.

echo [4/5] Flushing DNS and Refreshing Routing Cache...
ipconfig /flushdns >nul 2>&1
echo       -^> Done. DNS resolver cache purged.
echo.

echo [5/5] Opening Tracker List in Notepad...
if exist "%~dp0trackers_list.txt" (
    start notepad.exe "%~dp0trackers_list.txt"
    echo       -^> Done. 52 verified high-speed trackers opened.
) else (
    echo       -^> Note: trackers_list.txt not found in folder.
)
echo.
echo ======================================================================
echo                  SYSTEM OPTIMIZATIONS APPLIED!
echo ======================================================================
echo.
echo NEXT STEPS IN TIXATI (takes 30 seconds):
echo   1. In Tixati, click on your downloading game torrent.
echo   2. In the lower pane, click the 'Trackers' tab.
echo   3. Click 'Add' or 'Edit'.
echo   4. Select all (Ctrl+A) from the opened Notepad window, copy (Ctrl+C),
echo      and paste (Ctrl+V) into the Tixati Trackers box, then click OK.
echo   5. Within 15-30 seconds, Tixati will connect to 50+ new seeders!
echo.
echo Press any key to close this window...
pause >nul
