# VORTEX SPEED TITANIUM PRO — PRODUCT STRUCTURE BLUEPRINT
**Design Direction:** Titanium & Ember (v8.0 Precision Engineering)  
**Core Framework:** 5 Focused Functional Pillars  
**Target Platform:** Windows 10/11 Desktop  
**Date:** November 19, 2026

---

## 1. Product Vision & Architectural Transformation

Vortex Speed is transformed from an unwieldy collection of 16 fragmented sidebar items into a **unified, cohesive network operating center** structured around five intuitive pillars.

Every feature is placed where a user logically expects to find it. Advanced diagnostics are grouped into accessible sub-tabs rather than crowding the main navigation. 

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VORTEX SPEED TITANIUM PRO                         │
│                                                                             │
│   [ 1. OVERVIEW ]     [ 2. SPEED & DIAGNOSTICS ]    [ 3. NOVA INTELLIGENCE ]│
│                                                                             │
│             [ 4. NETWORK EXPLORER ]       [ 5. SETTINGS & REPORTS ]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Structure of the 5 Pillars

### Pillar 1: Overview (Executive Network Dashboard)
**Purpose:** Immediate situational awareness within 2 seconds of application launch.
- **Top Metrics Strip:**
  - Active Physical Adapter (`Wi-Fi` / `Ethernet`) + Gateway RTT (e.g. `2 ms`).
  - Public IP, ISP Name, and Geographic Region.
  - Overall Connection Stability Beacon (`OPTIMAL` / `WARNING` / `CRITICAL`).
- **Core Center Stage:**
  - Real-Time Live Bandwidth Gauge (Instantaneous Download & Upload Mbps).
  - One-Click Primary Action: **`[ 🚀 Run Speed Test ]`** (Instantly launches test).
  - Last Successful Baseline Badge (`30.8 Mbps Down / 29.5 Mbps Up`).
- **Secondary Alert Card:**
  - Active Black Box Incident Monitor (Displays ongoing packet loss or confirms `0 Incidents in Last 24 Hours`).
- **Quick-Jump Anchors:** One-click shortcuts to NOVA Assistant, Device Radar, and Wi-Fi Lab.

---

### Pillar 2: Speed & Diagnostics (Precision Measurement & Lab)
**Purpose:** Multi-stream throughput benchmarking and specialized network health diagnostics.
- **Sub-Tab 1: Flagship Speed Test (Default View)**
  - Precision Titanium Tachometer (0–40 / 0–100 / 0–1000 Mbps dynamic scale).
  - Verified Edge Server Dropdown (strictly bounded to 170px width):
    - `Cloudflare BOM • Mumbai`
    - `Cloudflare DEL • Delhi`
    - `Cloudflare Anycast`
  - Real-Time Live Counters: Ping (ICMP RTT), Jitter (RFC 3550 Standard), Download Mbps, Upload Mbps.
  - Actions Cluster: `[ 🔄 Start / Retest ]`, `[ 🛑 Cancel ]`, `[ ⚖️ Cross-Server Check ]`, `[ 📋 Trace Details ]`.
  - Historical Speed Test Log Table (Last 10 tests with timestamps, MB transferred, and SQLite record IDs).
  - **Integrated Bandwidth Prediction Card:** Download time estimator (calculate hours/minutes for 10GB, 50GB, 100GB at current line rate).
  - **Integrated ISP SLA Compliance Card:** Visual gauge showing whether measured speeds meet contracted plan bandwidth ($30\text{ Mbps}$).
- **Sub-Tab 2: Advanced Diagnostic Labs**
  - **Bufferbloat Autopsy:** Unloaded vs loaded ping measurement; bufferbloat grading (A+ to F); advice on router smart queue management (SQM / CAKE).
  - **Route Vision Traceroute:** Multi-hop visual traceroute showing hop latency and Autonomous System numbers across regional transit.
  - **Gaming Intelligence:** Ping and jitter monitor to regional gaming datacenter clusters (Mumbai, Singapore, Frankfurt, Bahrain).

---

### Pillar 3: NOVA Intelligence (Central Neural Assistant)
**Purpose:** Conversational network intelligence and autonomous diagnostics coordinator.
- **Header:** Neural Core Status (`ACTIVE`), System Health Score (`70–95/100`), Monitored Adapter Name.
- **Evidence-Based Conversational Pane:**
  - Chat stream with technical syntax formatting (Markdown, badges, alerts).
  - Suggested Quick-Query Pills:
    - *"How much data have I downloaded today?"*
    - *"Can I stream 4K video right now?"*
    - *"Why did my speed test drop earlier?"*
    - *"Are there any packet loss incidents in the blackbox log?"*
    - *"Explain the difference between adapter throughput and internet speed."*
- **Live Evidence Inspector:**
  - Displays the exact SQLite tables and Windows APIs consulted for every answer.
- **Autonomous Diagnostics Actions:**
  - Safe one-click troubleshooting triggers (Flush Windows DNS Cache, Re-scan ARP Subnet, Export Diagnostic Report).
  - Always asks explicit user confirmation before modifying local settings.

---

### Pillar 4: Network Explorer (Local Environment & Devices)
**Purpose:** Complete visibility into the local physical network, wireless RF spectrum, and host applications.
- **Sub-Tab 1: Device Radar (Local Subnet Discovery)**
  - Consolidated device discovery engine (combining Device Radar and Digital Twin).
  - Interactive Subnet Topology Node Graph.
  - Discovered Device Table:
    - IP Address, MAC Address (when available), Hostname, Vendor (IEEE OUI).
    - Connection State (`Online` / `Idle`), Identification Confidence score.
    - User Alias Editor & Trust Toggle (`Trusted` / `Untrusted`).
    - Explicit disclosure of sleeping devices and Wi-Fi AP isolation limits.
- **Sub-Tab 2: Wi-Fi Intelligence Lab**
  - Connected Wi-Fi Interface Details (SSID, BSSID, RSSI %, Link Rate, 802.11 Protocol).
  - 2.4GHz & 5GHz Channel Spectrum Scanner with channel congestion ranking.
- **Sub-Tab 3: Process Bandwidth Monitor**
  - Real Windows active socket table (`Get-NetTCPConnection`).
  - Ranks running applications (Chrome, Discord, Steam, Spotify) by active TCP/UDP connection count and socket activity.

---

### Pillar 5: Settings & Reports (History, Incidents, & Vault)
**Purpose:** Long-term historical performance analysis, proof of ISP SLA violations, and data protection.
- **Sub-Tab 1: Historical Intelligence (Time Machine & Network DNA)**
  - Combines Time Machine and Network DNA into one unified timeline.
  - Interactive Time Scrubber (Last 1 hour, 6 hours, 24 hours, 7 days).
  - 24-Hour Diurnal DNA Baseline Curve (Morning vs Afternoon vs Evening baseline throughput and 95th-percentile latency).
- **Sub-Tab 2: Black Box Flight Recorder**
  - Complete historical log of network incidents (disconnects, latency spikes $> 150\text{ ms}$, packet loss events).
  - Root-cause tagging (e.g. `ISP Transit Congestion`, `Local Gateway Jitter`).
  - Export tools: Download complete incident audit log as JSON or CSV for ISP dispute resolution.
- **Sub-Tab 3: Settings & Encrypted Vault**
  - Theme Selection (Dark / Light / System Mode).
  - UI Density (Comfortable / Compact) & Animation Speed.
  - Physical Adapter Binding (Auto / Force Wi-Fi / Force Ethernet).
  - Sampling Frequency (1.0s Precision / 2.0s Balanced).
  - Black Box Incident Retention (7 / 30 / 90 Days).
  - Database Backup & Restore Manager:
    - Instant database snapshot creation (`/api/backup/create`).
    - SQLite PRAGMA integrity verification (`ok`).
    - Database row counter (17,985+ telemetry rows safely stored).

---

## 3. Sidebar Navigation Structure Comparison

| Before (16 Fragmented Modules) | After (5 Focused Pillars) | Placement & Rationale |
|---|---|---|
| 1. Overview | **1. Overview** | Core everyday dashboard; cleaned of cluttered cards. |
| 2. Speed Diagnostics | **2. Speed & Diagnostics** | Core speed test + tabbed Advanced Labs. |
| 3. Application Monitor | Included in **4. Network Explorer** | Sub-tab: Process Bandwidth Monitor. |
| 4. Device Radar & Twin | Included in **4. Network Explorer** | Sub-tab: Device Radar (unified subnet scanner). |
| 5. NOVA Intelligence | **3. NOVA Intelligence** | Central autonomous diagnostic coordinator. |
| 6. Internet Black Box | Included in **5. Settings & Reports** | Sub-tab: Black Box Incident History. |
| 7. Network Time Machine | Included in **5. Settings & Reports** | Sub-tab: Historical Intelligence. |
| 8. Network DNA | Included in **5. Settings & Reports** | Sub-tab: Historical Intelligence (diurnal curve). |
| 9. Bufferbloat Autopsy | Included in **2. Speed & Diagnostics** | Sub-tab: Advanced Labs -> Bufferbloat. |
| 10. Route Vision | Included in **2. Speed & Diagnostics** | Sub-tab: Advanced Labs -> Route Vision. |
| 11. Network Autopilot | Integrated into **3. NOVA Intelligence** | Refactored into NOVA's Rule-Based Advisory Engine. |
| 12. Gaming Intelligence | Included in **2. Speed & Diagnostics** | Sub-tab: Advanced Labs -> Gaming Ping. |
| 13. Wi-Fi Intelligence Lab | Included in **4. Network Explorer** | Sub-tab: Wi-Fi Intelligence Lab. |
| 14. Bandwidth Prediction | Included in **2. Speed & Diagnostics** | Integrated utility card in Speed Diagnostics. |
| 15. ISP Intelligence | Included in **2. Speed & Diagnostics** & **5** | Integrated SLA compliance card & report summaries. |
| 16. Settings & Vault | Included in **5. Settings & Reports** | Sub-tab: Settings & Database Vault. |

---

## 4. Key UX User Journeys (1–2 Click Access)

1. **"I want to test my internet speed right now":**
   - *From Launch:* Overview -> Click `[ 🚀 Run Speed Test ]` (1 Click). Test starts immediately.
2. **"Why is my internet slow or dropping?":**
   - *From Launch:* Click `[ ⬡ NOVA Intelligence ]` -> Click query pill *"Why is my internet slow?"* (2 Clicks). NOVA inspects live telemetry, recent speed tests, and blackbox logs, outputting a clear root-cause explanation.
3. **"Who is using my Wi-Fi?":**
   - *From Launch:* Click `[ 🌐 Network Explorer ]` (1 Click). Device Radar automatically displays all active ARP neighbors with vendor badges.
4. **"Is my Wi-Fi channel crowded by my neighbors?":**
   - *From Launch:* Click `[ 🌐 Network Explorer ]` -> Click `[ Wi-Fi Lab ]` tab (2 Clicks). Full 2.4/5GHz RF spectrum is visualized with channel congestion ranking.
5. **"I need evidence of ISP downtime for a bill dispute":**
   - *From Launch:* Click `[ ⚙️ Settings & Reports ]` -> Click `[ Black Box ]` tab (2 Clicks). Complete table of timestamped downtime incidents with CSV export ready.
