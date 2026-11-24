# VORTEX SPEED TITANIUM PRO v8.0 // TASKBAR & SYSTEM TRAY REPORT
## NATIVE NOTIFYICON ARCHITECTURE, TRAY MENU ACTIONS & BACKGROUND LIFECYCLE

**Author**: Senior Systems & Windows Integration Engineer  
**Platform**: Windows 11 64-bit  
**Module**: `launcher.cs` -> `VortexSpeed.exe`  
**Status**: 100% Implemented & Verified  

---

### 1. Executive Summary

To make Vortex Speed Titanium Pro practical for 24/7 autonomous network monitoring without cluttering the user's workspace, full native **Windows System Tray (`NotifyIcon`)** support has been integrated into `VortexSpeed.exe`. 

The application now runs as a persistent background daemon, offering rapid access to diagnostic functions through a custom system tray context menu, real-time balloon notifications for connection events, double-click window restore, and graceful lifecycle management.

---

### 2. Architecture of the System Tray Engine

```
                   VORTEX SYSTEM TRAY ARCHITECTURE
                   
          [Windows 11 Notification Area / System Tray]
                               │
                               ▼
                    NotifyIcon (vortex_icon.ico)
                    Tooltip: "Vortex Speed — Titanium Pro v8.0"
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
     [Double-Click]                        [Right-Click]
   BringExistingWindowToFront()          ContextMenuStrip
   - Restore minimized window            ├── ⚡ Open Vortex Speed
   - Focus to foreground                 ├── 🚀 Run Speed Test
                                         ├── 🩺 Check Internet Connection
                                         ├── 📊 Live Network Status
                                         ├── 🛡️ Toggle Network Autopilot
                                         ├── ⚙️ Settings & Vault
                                         ├── ── (Separator)
                                         └── ❌ Exit Vortex Speed
```

---

### 3. Context Menu Actions & Capabilities

Right-clicking the cyan "V" emblem in the Windows taskbar tray provides immediate, one-click access to the core platform subsystems:

| Menu Item | Action / Endpoint | Behavior |
| :--- | :--- | :--- |
| **`⚡ Open Vortex Speed`** | `BringExistingWindowToFront()` | Un-minimizes and brings the full GUI command center to the front. |
| **`🚀 Run Speed Test`** | `POST http://127.0.0.1:49876/api/speed/start` | Triggers a full genuine speed test in the background; shows notification. |
| **`🩺 Check Internet Connection`** | `GET http://127.0.0.1:49876/api/quick-check` | Tests Gateway, DNS, WAN, and CDN within 1.5 seconds; reports health. |
| **`📊 Live Network Status`** | `GET http://127.0.0.1:49876/api/network-status` | Displays active Wi-Fi channel, local IP, gateway, and live throughput. |
| **`🛡️ Toggle Network Autopilot`** | `POST http://127.0.0.1:49876/api/autopilot/toggle` | Enables or disables autonomous line stabilization and QoS balancing. |
| **`⚙️ Settings & Vault`** | Focus + Navigate | Restores window and opens the Personalization Centre. |
| **`❌ Exit Vortex Speed`** | `ExitApplication()` | Cleanly terminates Edge, Node.js backend daemon, and removes tray icon. |

---

### 4. Background Notifications & Balloon Tips

The system tray engine utilizes Windows Shell balloon tips to communicate critical network events without interrupting full-screen applications or games:

1. **Startup Notification**:  
   - *Title*: `Vortex Speed v8.0 Active`  
   - *Body*: `Titanium Pro is running autonomously in the system tray.`
2. **Speed Test Initiated**:  
   - *Title*: `Vortex Speed`  
   - *Body*: `Speed Test Started`
3. **Network Status Summary**:  
   - *Title*: `📊 Network Status`  
   - *Body*: `Active: Wi-Fi 802.11n (Ch 6) | IP: 192.168.29.129 | Gateway: 192.168.29.1 | Backbone: Cloudflare BOM`
4. **Autonomous Outage Alerts**:  
   Triggered if gateway or WAN ping drops packets, warning the user before streaming or video calls disconnect.

---

### 5. Graceful Lifecycle & Process Management

When the user selects **`❌ Exit Vortex Speed`** from the system tray menu:
1. `trayIcon.Visible = false` and `trayIcon.Dispose()` are called immediately to prevent "ghost" icons from remaining in the notification area.
2. The running Edge app instance (`edgeProcess`) is closed.
3. The background Node.js server (`nodeProcess`) is terminated gracefully.
4. Multimedia timer resolution is released.
5. All open database handles in SQLite are closed without corruption.
