@echo off
echo [VORTEX SPEED] Compiling launcher.cs into VortexSpeed.exe...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:winexe /win32icon:vortex_icon.ico /out:VortexSpeed.exe /reference:System.Windows.Forms.dll,System.Drawing.dll,System.Xaml.dll,"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\WindowsBase.dll","C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\PresentationCore.dll","C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF\PresentationFramework.dll" launcher.cs
if %ERRORLEVEL% EQU 0 (
    echo [VORTEX SPEED] Build succeeded: VortexSpeed.exe generated successfully.
) else (
    echo [VORTEX SPEED] Build failed with error code %ERRORLEVEL%.
)
