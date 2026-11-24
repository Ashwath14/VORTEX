# VORTEX SPEED TITANIUM PRO v8.0 — ARCHITECTURAL IMPLEMENTATION PLAN
**Document ID:** `VORTEX_V8_IMPLEMENTATION_PLAN.md`  
**Date:** November 18, 2026  
**Target Architecture:** Modular Windows Autonomous Network Intelligence Platform  
**Target Release:** Titanium Pro v8.0  

---

## 1. System Vision & Architecture

Vortex Speed Titanium Pro v8.0 transforms the software from a speed utility into an **Autonomous Network Intelligence Platform** built around five core identities:
- **MONITOR:** Continuous hardware telemetry, dynamic subnet adaptation, and per-process socket attribution.
- **ANALYZE:** Root-cause incident classification via the Internet Black Box and Wi-Fi spectrum analytics.
- **PREDICT:** 7-day usage forecasting, game download ETA modeling, and peak activity profiling.
- **OPTIMIZE:** High-resolution multimedia timer synchronization (1.0 ms), kernel process priority tuning, and DNS cache purging.
- **CONTROL:** QoS profile switching, bandwidth freezing, and natural-language command execution.

NOVA serves as the unifying intelligence layer connecting all five identities.

---

## 2. Directory Structure & Modular Breakdown

The application will be refactored into a clean, decoupled modular hierarchy inside `vortex-speed`:

```text
vortex-speed/
├── server.js                          # HTTP & Server-Sent Events (SSE) router
├── config/
│   └── settings.js                    # Dynamic network settings, threshold rules & plan state
├── database/
│   ├── db.js                          # Built-in Node.js v24 SQLite engine (node:sqlite)
│   └── migrations.js                  # Schema initialization & JSON-to-SQLite auto-migration
├── modules/
│   ├── telemetry.js                   # Hardware throughput & dynamic gateway/adapter detector
│   ├── nova.js                        # Autonomous rule-based telemetry & alert engine
│   ├── blackbox.js                    # Incident recorder, evidence collector & report generator
│   ├── time-machine.js                # 24h historical replay & timeline scrubber
│   ├── bandwidth-guardian.js          # Per-process socket attribution & gaming bandwidth freeze
│   ├── wifi-intelligence.js           # 2.4/5GHz spectrum overlap & interference analyzer
│   ├── digital-twin.js                # Interactive node-link network topology map
│   ├── gaming.js                      # Game session tracker, jitter monitor & profiles
│   ├── prediction.js                  # Bandwidth forecast & trend projection engine
│   ├── isp-intelligence.js            # 0–100 Weighted ISP Performance Score
│   └── command-centre.js              # Natural-language command parser & voice processor
└── public/
    ├── index.html                     # Obsidian Cyber 12-module sidebar workspace
    ├── style.css                      # Luxury Obsidian Glassmorphism (Outfit & Space Grotesk)
    ├── app.js                         # Client engine, SSE consumer & UI controller
    └── components/
        ├── hud.js                     # Floating Desktop Mini HUD controller
        └── twin-canvas.js             # 360° Digital Twin interactive topology renderer
```

---

## 3. Database Architecture (Zero-Dependency SQLite)

Using Node.js v24’s native `node:sqlite` (`DatabaseSync`), we introduce a robust local database (`vortex_v8.db`) with zero external npm packages:

### Schema Overview:
1. `telemetry_history`: `(timestamp INTEGER, down_mbps REAL, up_mbps REAL, ping REAL, jitter REAL, adapter TEXT)`
2. `network_incidents`: `(id TEXT PRIMARY KEY, start_time INTEGER, end_time INTEGER, duration REAL, severity TEXT, classification TEXT, evidence TEXT)`
3. `speed_tests`: `(id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, down_mbps REAL, up_mbps REAL, ping REAL, jitter REAL, plan_mbps REAL)`
4. `device_records`: `(mac TEXT PRIMARY KEY, ip TEXT, hostname TEXT, vendor TEXT, category TEXT, first_seen INTEGER, last_seen INTEGER, ping REAL, is_trusted INTEGER)`
5. `gaming_sessions`: `(id TEXT PRIMARY KEY, game_name TEXT, start_time INTEGER, end_time INTEGER, avg_ping REAL, max_ping REAL, min_ping REAL, jitter REAL, packet_loss REAL)`
6. `process_traffic`: `(timestamp INTEGER, pid INTEGER, name TEXT, connections INTEGER, est_mbps REAL)`
7. `nova_events`: `(id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER, level TEXT, title TEXT, message TEXT, action_taken TEXT)`

### JSON Migration Strategy:
On first run, `migrations.js` checks for `data_usage.json` and `test_history.json`. It securely copies existing usage bytes and past speed test records into `vortex_v8.db` without altering the original JSON files.

---

## 4. Technical Strategy for All 10 Required Feature Modules

### Module 01: NOVA Autonomous Intelligence Engine
- **Mechanism:** Continuous analytical loop running every 2.5 seconds evaluating real-time telemetry against dynamic thresholds.
- **Rule Matrix:**
  - *Sudden Throughput Drop:* Throughput drops > 65% while Wi-Fi RSSI remains stable -> evaluates gateway ping.
  - *Bufferbloat / Upload Saturation:* Uplink > 95% concurrent with ping elevation -> recommends QoS throttling.
  - *DNS Anomaly:* DNS resolution fails while gateway responds -> recommends DNS cache purge.
  - *Wi-Fi Degrade:* RSSI drops below -75 dBm -> alerts user of RF signal degradation.
- **Safety:** Read-only advisory by default; any tuning operation requires explicit user confirmation.

### Module 02: Internet Black Box
- **Mechanism:** Continuous health heartbeats to Gateway (`192.168.29.1`), Local DNS, and Cloudflare (`1.1.1.1`).
- **Incident Capture:** Automatically logs incidents when ping exceeds threshold or packet loss occurs, tagging root-cause classification (Local LAN, ISP WAN, or DNS).
- **Report Exporter:** Generates a structured diagnostic report (formatted for printable PDF / text export) containing incident timelines and performance graphs.

### Module 03: Network Time Machine
- **Mechanism:** Stores 1-second rolling metrics (down, up, ping, jitter) in SQLite with 1-hour, 6-hour, 12-hour, 24-hour, and 7-day query rollups.
- **Ghost Replay:** A timeline scrubber with Play, Pause, Fast-Forward controls animating the historical speed gauge and wave to show exact conditions at any past timestamp.

### Module 04: Smart Bandwidth Guardian (Per-Process Attribution)
- **Mechanism:** Inspects Windows TCP socket tables via `Get-NetTCPConnection` mapped to `Get-Process`.
- **Attribution:** Identifies which applications (Tixati, Chrome, Edge, Steam, Roblox) hold active connections.
- **Bandwidth Freeze (Gaming Mode):** 1-click profile that deprioritizes non-essential background processes and locks high-priority scheduling for the active game.

### Module 05: Wi-Fi Intelligence Lab
- **Mechanism:** Parses `netsh wlan show networks mode=bssid` and `netsh wlan show interfaces`.
- **Spectrum Visualization:** Renders 2.4 GHz channels (1, 6, 11) and 5 GHz bands, showing channel overlap, signal strength (RSSI dBm), station load, and recommends the least congested channel.

### Module 06: Network Digital Twin
- **Mechanism:** Dynamic subnet discovery (`Get-NetIPConfiguration` to detect the actual gateway and subnet).
- **Topology:** Interactive node-link graph with central router node, connected device cards (PC, Smartphone, Smart Hub), custom naming, trust tagging, and ping latency indicators.

### Module 07: Adaptive Gaming Intelligence
- **Mechanism:** Monitors latency, packet jitter, and background network load during gaming.
- **Game Profiles:** Valorant, Counter-Strike 2, Roblox, and custom user games.
- **Session Recorder:** Summarizes average ping, jitter spikes, and packet stability upon session completion.

### Module 08: Bandwidth Prediction Engine
- **Mechanism:** Statistical trend modeling based on 7-day rolling usage.
- **Forecasting:** Calculates projected month-end GB consumption, peak daily usage hours, and dynamic torrent completion ETAs.

### Module 09: ISP Performance Intelligence
- **Mechanism:** Calculates a weighted 0–100 ISP Performance Score based on actual measured telemetry:
  - Download Consistency (25%)
  - Upload Consistency (20%)
  - Ping Latency (20%)
  - Jitter Stability (15%)
  - Packet Loss (15%)
  - Uptime Reliability (5%)

### Module 10: Vortex Command Centre
- **Mechanism:** Natural-language rule-based command interpreter mapping English text queries (e.g. "show devices", "why is internet slow", "activate gaming mode", "calculate download time for 90 GB") directly to internal module APIs.
- **Voice Support:** Web Speech API integration (`SpeechRecognition` & `SpeechSynthesis`) with microphone permission toggle and voice feedback.

---

## 5. Implementation Sequence & Staging

| Phase | Modules Included | Core Deliverables | Testing & Verification |
|---|---|---|---|
| **Phase 1** | Architecture & Database | Modular backend refactoring, `node:sqlite` database, JSON migration | Verify server starts, database tables created, telemetry preserved |
| **Phase 2** | Intelligence & History | NOVA Intelligence Engine, Internet Black Box, Network Time Machine | Verify rule-based alerts trigger, incidents logged, scrubber replays history |
| **Phase 3** | Diagnostics & Topology | Wi-Fi Intelligence Lab, Network Digital Twin, Bandwidth Guardian | Verify BSSID spectrum draws, devices graph renders, sockets attribute |
| **Phase 4** | Gaming & Automation | Adaptive Gaming Tracker, Bandwidth Prediction, Command Centre | Verify gaming sessions record, predictions calculate, text commands execute |
| **Phase 5** | Desktop Mini HUD & UI | Desktop Mini HUD, UI polish, report generation | Verify always-on-top HUD, 12 navigation modules, PDF/text report export |

---

## 6. Zero-Regression Guarantee
All 16 existing features (live telemetry, SVG speed dial, dynamic plan capacity scaling, Tixati priority boosting, 1.0ms timer sync, 52 trackers injector, 60 GB ETA calculator, audio synthesizer) will remain 100% operational throughout and after this upgrade.
