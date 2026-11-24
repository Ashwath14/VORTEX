# VORTEX SPEED TITANIUM PRO — REMAINING PLATFORM BOUNDARIES & TECHNICAL ASSESSMENT
**Document ID:** `VORTEX-REP-REMAINING-006`  
**Date:** November 19, 2026  
**Audience:** Technical Management & Quality Engineering  
**Application:** Vortex Speed Titanium Pro v8.1.0-PRO  

---

## 1. PURPOSE & PRINCIPLES

Following the comprehensive repair of all 5 pillars, the resolution of all runtime canvas and JavaScript errors, and the successful execution of the 5-test speed battery, this document records the remaining **operating system boundaries, hardware dependencies, and platform constraints** inherent to running network diagnostics on Windows 10/11.

---

## 2. HONEST TECHNICAL BOUNDARY ASSESSMENT

### 2.1 Wi-Fi RF Radio Telemetry Dependencies
- **Boundary:** Wi-Fi RF telemetry (BSSID, RSSI dBm, physical link PHY rate, channel frequency) relies on the Windows Native Wifi API via `netsh wlan show interfaces`.
- **Behavior When on Ethernet:** When the host machine connects to the network exclusively via a physical RJ-45 Ethernet cable or docking station, `netsh wlan` reports that the wireless interface is disconnected or absent. The Wi-Fi Lab subtab accurately displays *"Ethernet Bound: No 802.11 Wi-Fi Radio Detected"*.
- **Remediation:** Expected operational behavior; not a bug.

### 2.2 Device Radar & Smartphone Power-Save States
- **Boundary:** Device Radar discovers stations on the local subnet (`192.168.29.0/24`) using the Windows Neighbor Discovery Cache (`Get-NetNeighbor` / `arp -a`) combined with ICMP ping sweeps.
- **Behavior with Mobile Devices:** Modern iOS and Android smartphones implement aggressive Wi-Fi power saving when screen-locked. A device may remain in the router's DHCP lease table and Windows ARP cache with `ping: "N/A"` because it ignores unprompted ICMP echo requests until the device wakes.
- **Design Safeguard:** Device Radar labels these stations as *"Reachable via ARP (Sleeping / Power-Save)"* rather than falsely declaring them offline or fabricating response times.

### 2.3 Router Reboot & Gateway Remote Configuration
- **Boundary:** Users may ask NOVA to *"Reboot my JioFiber gateway"* or *"Change router Wi-Fi password"*.
- **Platform Reality:** Proprietary residential gateways (Reliance Jio, Airtel, Comcast, Spectrum) do not expose open, unauthenticated REST APIs for administrative reboot. Attempting to brute-force web admin portals would violate security protocols and trigger router firewall lockouts.
- **Enforced Safety Policy:** NOVA explicitly informs the user that gateway power cycling requires physical access or authentication through the ISP's official mobile portal (e.g. MyJio app), avoiding unfeasible or dangerous actuation.

### 2.4 High-DPI Windows Display Scaling
- **Boundary:** When a user drags the desktop application between monitors with differing DPI scaling (e.g. 100% 1080p display to 150% 4K display), Chromium's backing canvas surface requires re-synchronization with `devicePixelRatio`.
- **Implemented Fix:** `fitCanvasToContainer()` now listens to window resize and orientation events, automatically recomputing `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` so that text and vector curves remain sharp without blurriness.

### 2.5 Windows Non-Elevated Socket Permissions
- **Boundary:** Running raw ICMP sockets (`RawSocket`) in Windows requires Administrator privilege.
- **Handled Implementation:** Vortex Speed utilizes the standard Win32 `IcmpSendEcho` API via Node C++ interop and system PowerShell fallbacks. This allows full microsecond ping and RFC 3550 jitter calculation without requiring the user to run the application with elevated Administrator rights.

---

## 3. SUMMARY OF CURRENT STATUS

Every core feature in the five-pillar architecture is backed by genuine data and real actions:
1. **Overview:** Real-time 1-second physical adapter telemetry and 1-click test triggers.
2. **Speed & Diagnostics:** Multi-stream TCP/TLS 1.3 parallel speed engine tested against live Cloudflare Mumbai, Delhi, and Anycast CDN endpoints.
3. **NOVA Intelligence:** Grounded evidence engine querying live telemetry and SQLite tables with defensible confidence scores.
4. **Network Explorer:** ARP-backed device topology, real 802.11 RF signal analysis, and active TCP socket process mapping.
5. **Settings & Reports:** Atomic SQLite snapshot creation, PRAGMA verification, and 24-hour diurnal Network DNA baselines.
