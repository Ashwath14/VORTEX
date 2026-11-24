# VORTEX SPEED TITANIUM PRO — USER MANUAL & OPERATIONS GUIDE
## AUTONOMOUS NETWORK MANAGEMENT PLATFORM

---

## 1. INTRODUCTION & PHILOSOPHY

**Vortex Speed Titanium Pro v8.0** is an autonomous network intelligence and management platform designed specifically for Windows power users.

Unlike conventional speed test tools that only report single numbers at isolated moments, Vortex Speed continuously monitors physical network adapters, diagnoses bottlenecks, profiles statistical habits via Network DNA, logs transient outages in a Black Box, tracks active devices with radar, and provides automated optimizations.

---

## 2. MODULE NAVIGATION & QUICK START

Vortex Speed features a streamlined sidebar with 16 dedicated modules grouped into three main categories:

### CORE MONITORING
1. **Speed Diagnostics**: On-demand multi-stream TCP throughput benchmark with real-time speedometer, jitter, loaded ping, and connection health metrics.
2. **Device Radar & Digital Twin**: Visual topology map displaying your gateway router, local PC, and all client devices on your subnet with latency badges and trust controls.
3. **Bandwidth Guardian**: Process socket monitor showing which Windows applications hold active network connections, with one-click **Bandwidth Freeze** to prioritize gaming or critical streams.
4. **Internet Black Box**: Flight recorder that pings your gateway and public DNS continuously, logging outages with duration, classification, and probable cause.

### INTELLIGENCE & DIAGNOSTICS
5. **NOVA Autonomous Intelligence**: Conversational AI network engineer providing evidence-backed answers for everyday problems (e.g., "Why is my ping high?"), with automated action triggers.
6. **Network Time Machine**: Historical telemetry scrubber allowing you to replay network throughput, ping, and incident markers over the past 1, 6, 12, 24 hours or 7 days.
7. **Network DNA Engine**: Statistical profiling that learns your normal hourly performance from genuine telemetry, automatically flagging anomalies and identifying recurring peak/slow periods.
8. **Bufferbloat Autopsy**: Evaluates router queue delays under upload/download load to determine whether queue congestion is degrading interactive performance.
9. **Internet Route Vision**: Hop-by-hop traceroute inspector that detects upstream ISP routing shifts and flags packet loss across intermediate nodes.

### AUTONOMOUS & SPECIALIZED
10. **Network Autopilot**: Three-tier governance (Autonomous, Assisted, Observe) for background optimizations with a transparent, reversible audit log.
11. **Adaptive Gaming Intelligence**: Benchmark sessions tracking real-time latency, jitter, and packet stability against major gaming Anycast relays (Valorant, CS2, Roblox).
12. **Wi-Fi Intelligence Lab**: Wi-Fi channel spectrum analyzer that inspects nearby access points and recommends the cleanest non-overlapping channel (1, 6, or 11).
13. **Bandwidth Prediction**: File download time estimator and monthly data consumption forecaster based on your actual 24-hour transfer rates.
14. **ISP Intelligence**: Comprehensive ISP scorecard grading Reliance JioFiber across download consistency, latency quality, jitter stability, and incident freedom.
15. **Command Centre**: Quick-action administrative toolbox for executing DNS flush, multimedia timer sync, DHCP renewal, and socket resets.
16. **Settings & Vault**: Database management, tracker library manager (52 verified public BitTorrent trackers), and theme mode toggle (Dark, Light, System Default).

---

## 3. HOW TO SOLVE COMMON NETWORK PROBLEMS

### A. "Why is my internet suddenly slow?"
1. Open **NOVA Intelligence** and type `"Why is my internet slow?"` or click the quick prompt chip.
2. NOVA will inspect your live adapter throughput, Wi-Fi signal quality, and gateway ping:
   - If gateway latency is low (2-3 ms) and signal is strong (-36 dBm), the bottleneck is external (ISP transit or server cap).
   - If gateway latency is high (> 40 ms), the slowdown is inside your local home Wi-Fi.
3. Open **Bandwidth Guardian** to check if a background process (cloud sync, Windows Update) is consuming bandwidth. Click **Freeze Bandwidth** to temporarily lower their scheduling priority.

### B. "Why am I experiencing gaming lag or high ping?"
1. Navigate to **Bufferbloat Autopsy** and click **Run Bufferbloat Test**.
2. If your loaded latency increase is significant (> +30 ms), active downloads or background torrents are saturating your router's queue.
3. In **Bandwidth Guardian**, ensure BitTorrent upload slots are throttled during competitive matches, or enable **Gaming Intelligence** mode.

### C. "How can I check who is connected to my Wi-Fi?"
1. Go to **Device Radar & Digital Twin**.
2. The radar sweep displays all active stations on your subnet (`192.168.29.0/24`).
3. Click **Edit Alias** on any card to name a family member's phone or laptop.
4. Click the **UNVERIFIED / TRUSTED** badge to mark approved devices.

### D. "How can I see if my network had an outage while I was away?"
1. Open **Network Time Machine**.
2. Select the **24 Hours** or **7 Days** pill.
3. Scrub through the timeline slider to view past throughput and ping.
4. Check **Internet Black Box** for exact timestamps, durations, and root-cause classifications of any recorded dropouts.

---

## 4. KEYBOARD SHORTCUTS & SYSTEM TRAY INTEGRATION

- **F11**: Toggle Fullscreen Mode.
- **Ctrl + R**: Refresh current module data.
- **Escape**: Close modals or cancel ongoing traceroute.
- **System Tray**:
  - Double-click the tray icon to restore or minimize the window.
  - Right-click for quick actions: **Run Speed Test**, **Freeze Bandwidth**, **Flush DNS**, **Exit**.
- **Themes**: Switch effortlessly between **Obsidian Dark** and **Clean Light** mode via the top navigation bar or Settings panel.
