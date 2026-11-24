# VORTEX SPEED TITANIUM PRO v8.0 // WINDOWS DESKTOP INTEGRATION REPORT
## NATIVE WINDOWS IDENTITY (`VortexSpeed.TitaniumPro`), SHELL JUMP LIST & APPUSERMODELID

**Author**: Senior Windows Systems Engineer  
**Platform**: Windows 11 64-bit  
**Identity**: `VortexSpeed.TitaniumPro`  
**Launcher**: `VortexSpeed.exe` (Native .NET 4.0 / Win32 GUI Host)  
**Status**: 100% Implemented & Verified  

---

### 1. The Windows Identity Problem Explained

In previous versions, launching the desktop application initiated `msedge.exe --app="http://127.0.0.1:49876"` via a simple launcher script. Because `msedge.exe` was the parent process owner of the window, the Windows Shell Taskbar behavior was problematic:
1. **Generic Identity**: The taskbar identified the window as **"Microsoft Edge"** rather than "Vortex Speed".
2. **Context Menu Hijacking**: Right-clicking the taskbar icon displayed Edge's browser tasks (*New Window*, *New InPrivate Window*) instead of network diagnostic tools.
3. **Icon Replacement**: The window inherited Edge's standard icon.
4. **Window Grouping**: Launching other Edge windows grouped the network diagnostics tool into the user's personal web browser cluster.

---

### 2. The Architectural Solution

To achieve 100% native desktop behavior on Windows 11, the launcher architecture was redesigned using four interlocking Windows Shell APIs:

```
                  VORTEX SPEED DESKTOP INTEGRATION
                  
  [Process Level]
  SetCurrentProcessExplicitAppUserModelID("VortexSpeed.TitaniumPro")
                             │
                             ▼
  [Windows Shell Shortcuts]
  IShellLinkW + IPropertyStore (PKEY_AppUserModel_ID)
  ├── %APPDATA%\...\Start Menu\Programs\Vortex Speed.lnk
  └── %USERPROFILE%\Desktop\Vortex Speed.lnk
                             │
                             ▼
  [Windows Shell Jump List]
  System.Windows.Shell.JumpList (PresentationFramework.dll)
  ├── 🚀 Run Speed Test            (--action=speedtest)
  ├── ⚡ Bufferbloat Diagnostic    (--action=bufferbloat)
  ├── 🩺 Check Internet Connection (--action=checknet)
  ├── 🧠 NOVA Intelligence        (--tab=nova)
  └── 🛡️ Network Autopilot         (--tab=autopilot)
                             │
                             ▼
  [Runtime Window Hooking (Win32)]
  EnumWindows() -> Find Edge App HWND
  ├── SHGetPropertyStoreForWindow(HWND) -> Set PKEY_AppUserModel_ID
  ├── SendMessage(HWND, WM_SETICON)     -> Set 32x32 & 16x16 vortex_icon.ico
  └── SetWindowText(HWND)               -> "Vortex Speed — Titanium Pro v8.0"
```

---

### 3. Core Technical Implementations

#### A. Explicit Process AppUserModelID

At the entry point of `launcher.cs`, the process explicitly registers its identity before creating any windows or processes:
```csharp
[DllImport("shell32.dll", SetLastError = true)]
public static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

SetCurrentProcessExplicitAppUserModelID("VortexSpeed.TitaniumPro");
```

#### B. COM Shell Shortcut with `PKEY_AppUserModel_ID`

Windows 11 matches running windows to pinned taskbar items using the shortcut's `AppUserModelID`. If a window's AUMID matches a `.lnk` file in the Start Menu, Windows automatically replaces generic browser chrome with the shortcut's title and icon.

`launcher.cs` implements COM interop with `IShellLinkW`, `IPersistFile`, and `IPropertyStore`:
```csharp
IPropertyStore store = (IPropertyStore)link;
PROPERTYKEY key = new PROPERTYKEY {
    fmtid = new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),
    pid = 5 // PKEY_AppUserModel_ID
};
PROPVARIANT pv = new PROPVARIANT {
    vt = 31, // VT_LPWSTR
    pwszVal = Marshal.StringToCoTaskMemUni("VortexSpeed.TitaniumPro")
};
store.SetValue(ref key, ref pv);
store.Commit();
((IPersistFile)link).Save(lnkPath, true);
```
Both `C:\Users\krish\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Vortex Speed.lnk` and `C:\Users\krish\OneDrive\Desktop\Vortex Speed.lnk` are verified on disk.

#### C. Windows Custom Jump List

Using managed WPF JumpList APIs compiled directly into the executable, right-clicking the taskbar icon displays genuine network diagnostic actions:

1. **`🚀 Run Speed Test`**: Invokes `VortexSpeed.exe --action=speedtest`.
2. **`⚡ Bufferbloat Diagnostic`**: Invokes `VortexSpeed.exe --action=bufferbloat`.
3. **`🩺 Check Internet Connection`**: Invokes `VortexSpeed.exe --action=checknet`.
4. **`🧠 NOVA Intelligence`**: Invokes `VortexSpeed.exe --tab=nova`.
5. **`🛡️ Network Autopilot`**: Invokes `VortexSpeed.exe --tab=autopilot`.

#### D. Dynamic Window Handle (HWND) Hooking

To ensure the Chromium app window is decoupled from Edge's identity:
1. Edge is launched with `--user-data-dir="<baseDir>\vortex_profile"` and `--class="VortexSpeed"`, isolating it into a standalone process group.
2. A background thread enumerates top-level windows via `EnumWindows()`.
3. Once the app window appears:
   - `SHGetPropertyStoreForWindow(hwnd)` writes `PKEY_AppUserModel_ID = "VortexSpeed.TitaniumPro"`.
   - `SendMessage(hwnd, WM_SETICON, ...)` injects the cyan "V" icon for both the titlebar (16×16) and Alt-Tab switcher (32×32).
   - `SetWindowText(hwnd, "Vortex Speed — Titanium Pro v8.0")` brands the window caption.

#### E. Single-Instance Mutex & Argument Forwarding

Using a named Windows mutex (`VortexSpeedTitaniumProSingleInstanceMutex`), if the user clicks a Jump List task while the app is already open, the secondary instance:
1. Dispatches the action via HTTP (`http://127.0.0.1:49876/api/speed/start` or `/api/quick-check`).
2. Calls `ShowWindow(hwnd, SW_RESTORE)` and `SetForegroundWindow(hwnd)` to focus the main interface.
3. Exits immediately, ensuring only one instance runs in memory.
