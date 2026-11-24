# VORTEX SPEED TITANIUM PRO // MASTER TECHNICAL AUDIT & INVENTORY

**Document Version**: 8.1.0  
**Audit Timestamp**: 2026-11-19T00:50:00+05:30  
**Target Environment**: Windows 11 x64, Node.js v24.22.1, SQLite 3 (node:sqlite DatabaseSync WAL mode), C# .NET 4.0/WPF/WinForms  
**Network Infrastructure**: Reliance JioFiber (802.11n Wi-Fi @ 2.4 GHz, 192.168.29.0/24 subnet, Gateway 192.168.29.1, Adapter IP 192.168.29.129)

---

## 1. Executive Audit Overview

A complete source code, database, API, and runtime audit was conducted across the entire Vortex Speed Titanium Pro repository (`c:\Users\krish\Downloads\speedrr-main`). 

### Key Findings & Root Cause Diagnosis:

1. **Device Radar & Digital Twin (PARTIALLY FUNCTIONAL -> REPAIR)**:
   - **Root Cause**: `digital-twin.js` executed an ICMP ping sweep covering only `1..20` (`192.168.29.1` to `192.168.29.20`). The host machine (`.129`) and other active client stations (`.85`, `.134`, `.244`) were never pinged, leaving the OS ARP table unpopulated for those IPs. Additionally, `Get-NetNeighbor` was filtering on `-InterfaceAlias 'WiFi'`, failing when adapter naming differed. `rescanTwinBtn` on the frontend only executed a GET request and never triggered a background subnet sweep.
   - **Impact**: Displayed only the gateway station, marked as "UNVERIFIED" with an empty satellite topology.

2. **Network Time Machine (BROKEN -> REPAIR)**:
   - **Root Cause**: A property name mismatch between backend and frontend. The backend returned objects with `{ downMbps, upMbps, ping, jitter, timestamp }`, while frontend `app.js` expected `pt.download_mbps` and `pt.upload_mbps`. As a result, `(pt.download_mbps || 0)` evaluated to `0`, rendering a flat zero-line graph and `0.0 Mbps` replay metrics. Furthermore, `time-machine.js` contained a synthetic sinusoidal fallback (`28.5 + Math.sin(...)`) when rows were empty.
   - **Impact**: Blank historical canvas and `0.0 Mbps` download/upload readings on scrub slider.

3. **Network DNA Engine (PARTIALLY FUNCTIONAL -> REPAIR)**:
   - **Root Cause**: Two separate issues:
     - The calculation function `recalculateBaselines()` was only executed when manually requested via `/api/dna/recalculate`. It was never invoked during server initialization or background telemetry polling. Even though `telemetry_history` accumulated over 8,247 rows, the `network_dna_baselines` table contained only 2 rows, reporting `0/5 samples` for current hours.
     - In frontend `app.js`, the check `if (data.recurringPatterns.slowestHour !== null)` failed because in JavaScript `undefined !== null` evaluates to `true`. When no recurring patterns existed, it rendered `${undefined}:00`, yielding the literal string `"undefined:00"`.
   - **Impact**: Displayed `0/5 genuine samples`, `LEARNING` status despite 8,000+ telemetry rows, and `"undefined:00"` recurring congestion/efficiency windows.

4. **NOVA Intelligence (VISUAL ONLY / PARTIALLY FUNCTIONAL -> REPAIR)**:
   - **Root Cause**: `nova.js` relied on hardcoded static strings ("Hi Karthikeya!", canned recommendations). While `nova-predictive.js` contained advanced regression and forecasting logic, it was not fully unified with the primary chat query endpoint.
   - **Impact**: Generic responses lacking deep integration with live telemetry, incidents, DNA, and speed test records.

5. **ISP Intelligence & Bandwidth Prediction (PARTIALLY FUNCTIONAL -> REPAIR)**:
   - **Root Cause**: `isp-intelligence.js` used fixed score constants (`pingScore = 19.5`, `jitterScore = 14.2`) rather than computing mathematical scores from the 22+ genuine SQLite speed tests. `prediction.js` used hardcoded fallback rates (`4.16 MB/s`) when idle instead of querying real historical averages.

---

## 2. Comprehensive 16-Module Technical Inventory

| # | Module Name | Backend Module | Frontend Element | Database Dependencies | API Endpoints | Current Status | Required Remediation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **System Telemetry Engine** | `telemetry.js` | Topbar & Ticker Strip | `telemetry_history` | `/api/telemetry`, `/api/network-status` | **FULLY FUNCTIONAL** | Standardize data contract; expose unified camelCase and snake_case properties. |
| **02** | **Speed Diagnostics** | `speed-engine.js` | Dial & Gauge Panel | `speed_tests` | `/api/speed/start`, `/api/speed/status`, `/api/speed/cancel`, `/api/history` | **FULLY FUNCTIONAL** | 11-State machine verified (27.56 Mbps Down, 32.36 Mbps Up, 22.8ms Ping, 1.0ms Jitter). |
| **03** | **Bandwidth Guardian** | `bandwidth-guardian.js`| Process Table & Freeze | `process_traffic` | `/api/processes`, `/api/processes/freeze` | **PARTIALLY FUNCTIONAL** | Distinguish TCP socket counts from byte-rate bandwidth; ensure reversible Windows process priority adjustment. |
| **04** | **Device Radar & Digital Twin** | `digital-twin.js` | Radar Canvas & Device List | `device_records` | `/api/digitaltwin`, `/api/digitaltwin/rescan`, `/api/digitaltwin/rename` | **BROKEN** | Implement full /24 subnet asynchronous ping sweep; resolve hostnames and vendor OUIs; add rescan POST endpoint; update topology canvas. |
| **05** | **NOVA Intelligence** | `nova.js`, `nova-predictive.js` | NOVA Chat & Cards | `nova_events`, `telemetry_history`, `network_incidents` | `/api/nova`, `/api/nova/ask`, `/api/nova/predictive/status` | **PARTIALLY FUNCTIONAL** | Replace hardcoded greetings with evidence-based reasoning engine; ingest live telemetry, DNA, incidents, and speed history. |
| **06** | **Internet Black Box** | `blackbox.js` | Incident Timeline & Log | `network_incidents` | `/api/blackbox/status`, `/api/blackbox/incidents`, `/api/blackbox/export` | **PARTIALLY FUNCTIONAL** | Add consecutive failure threshold to eliminate single-ping false alarms; integrate incident marks into Time Machine. |
| **07** | **Network Time Machine**| `time-machine.js` | Replay Canvas & Slider | `telemetry_history`, `network_incidents` | `/api/timemachine`, `/api/timemachine/replay` | **BROKEN** | Fix property name mismatch (`downMbps`/`download_mbps`); remove sinusoidal fake fallback; overlay incidents on canvas; implement play/pause scrubber. |
| **08** | **Network DNA Engine** | `network-dna.js` | DNA Cards & 24h Curve | `network_dna_baselines`, `telemetry_history` | `/api/dna`, `/api/dna/recalculate`, `/api/dna/curve` | **PARTIALLY FUNCTIONAL** | Automate baseline calculation on startup and periodic polling; fix `undefined:00` JavaScript bug; reconcile total rows vs hourly samples. |
| **09** | **Bufferbloat Autopsy** | `bufferbloat.js` | Spectrum Chart & SQM | `bufferbloat_records` | `/api/bufferbloat/start`, `/api/bufferbloat/status`, `/api/bufferbloat/cancel` | **FULLY FUNCTIONAL** | Verify controlled multi-stream load, live delta calculation, and CAKE/FQ_CODEL SQM guidance. |
| **10** | **Wi-Fi Intelligence Lab**| `wifi-intelligence.js` | Channel Graph & AP List | In-Memory / System | `/api/wifi`, `/api/wifi/scan` | **FULLY FUNCTIONAL** | Remove hardcoded fallback SSID `'Sree karthikeya reddy'`; provide clean 2.4 vs 5 GHz recommendations. |
| **11** | **Gaming Intelligence** | `gaming.js` | Session Stats & Graph | `gaming_sessions` | `/api/gaming/start`, `/api/gaming/end`, `/api/gaming/history` | **PARTIALLY FUNCTIONAL** | Clearly label public relay ping target (1.1.1.1); support custom game host targets; compute real jitter and stability scores. |
| **12** | **Bandwidth Prediction**| `prediction.js` | ETA Sliders & Burn Rate | `telemetry_history` | `/api/prediction` | **PARTIALLY FUNCTIONAL** | Replace hardcoded default transfer speed with actual historical average throughput from SQLite; calculate download/upload ETAs. |
| **13** | **ISP Intelligence** | `isp-intelligence.js` | ISP Scorecard & Matrix | `speed_tests`, `network_incidents` | `/api/isp` | **PARTIALLY FUNCTIONAL** | Replace fixed constants with mathematical aggregate calculation across SQLite speed tests, uptime records, and gateway pings. |
| **14** | **Internet Route Vision**| `route-vision.js` | Hop Map & Diff Log | `route_history` | `/api/route/trace`, `/api/route/status`, `/api/route/history` | **FULLY FUNCTIONAL** | Verify native `tracert` execution, hop regex parsing, rate-limit filtering, and route fingerprint comparisons. |
| **15** | **Network Autopilot** | `autopilot.js` | Mode Selector & Log | `autopilot_audit_log`, `autopilot_settings` | `/api/autopilot/status`, `/api/autopilot/mode`, `/api/autopilot/rules` | **FULLY FUNCTIONAL** | Verify OBSERVE, ASSIST, AUTOPILOT governance modes with strict action allowlist and audit trail. |
| **16** | **Command Centre** | `command-centre.js` | Top Command Bar & Mic | Cross-Module | `/api/command` | **FULLY FUNCTIONAL** | Natural language intent classification and structured action dispatcher. |

---

## 3. Detailed Subsystem Audits

### 3.1 Device Radar & Network Digital Twin
- **Source Code**: [digital-twin.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/modules/digital-twin.js)
- **Database Table**: `device_records` (`mac`, `ip`, `hostname`, `vendor`, `category`, `first_seen`, `last_seen`, `ping`, `is_trusted`, `custom_name`)
- **Observed Behavior**: The table `device_records` contained 0 rows. A manual scan script using full subnet asynchronous ICMP probing (`192.168.29.1` through `192.168.29.254`) immediately populated the Windows ARP cache with 4 live stations (`192.168.29.1`, `192.168.29.85`, `192.168.29.134`, `192.168.29.244`) in addition to the host machine (`192.168.29.129`).
- **Remediation Plan**:
  1. Expand subnet ping sweep to cover all active hosts on `/24` subnet using asynchronous ping tasks with 120ms timeout.
  2. Implement vendor OUI lookup for MAC prefixes (e.g., `AC:10:07` -> Jio Platforms, `8C:86:DD` -> TP-Link, randomized Android/iOS MACs -> Mobile Station).
  3. Resolve NetBIOS / DNS hostnames (e.g., `192.168.29.1` -> `reliance.reliance`, `192.168.29.129` -> `Ashwath_Karthi`).
  4. Implement `POST /api/digitaltwin/rescan` to allow immediate on-demand subnet scanning.
  5. Enhance topology canvas in `app.js` to render the router gateway at center with linked satellite stations, ping indicators, and trust pills.

### 3.2 Network Time Machine
- **Source Code**: [time-machine.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/modules/time-machine.js), [app.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/public/app.js)
- **Database Table**: `telemetry_history` (8,247 genuine records recorded)
- **Observed Behavior**: The database contains continuous 2.5-second snapshots. However, the frontend expected `p.download_mbps` while backend delivered `downMbps`.
- **Remediation Plan**:
  1. Standardize backend response to provide both `downMbps` and `download_mbps`, `upMbps` and `upload_mbps`, `ping` and `ping_ms`.
  2. Completely remove `generateInitialBuffer` fake sinusoidal data generator. If no records exist in the selected time range, return `{ points: [], hasData: false, bounds: { start, end } }`.
  3. Query `network_incidents` for the selected range and overlay incident markers onto the timeline canvas.
  4. Fix replay scrubber in `app.js` to correctly display metrics at selected timestamp and support animated playback (1x, 2x, 5x).

### 3.3 Network DNA Engine
- **Source Code**: [network-dna.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/modules/network-dna.js), [app.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/public/app.js)
- **Database Table**: `network_dna_baselines`, `telemetry_history`
- **Observed Behavior**: `network_dna_baselines` was only updated on manual POST. When `data.recurringPatterns.slowestHour` was undefined, `undefined !== null` evaluated to true, resulting in `"undefined:00"`.
- **Remediation Plan**:
  1. Call `recalculateBaselines()` automatically on engine startup and every 5 minutes in the background.
  2. Reconcile total telemetry rows (8,247+) vs samples in the active hour bucket (e.g. 1,264 in Hour 0).
  3. Fix the formatting logic in `app.js`: check `hour != null && !isNaN(hour)`, formatting with zero-padding `${String(hour).padStart(2, '0')}:00`, and displaying "None Identified (Insufficient Data)" when unestablished.
  4. Render full 24-hour baseline curve with mean and standard deviation bands.

### 3.4 NOVA Intelligence Engine
- **Source Code**: [nova.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/modules/nova.js), [nova-predictive.js](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/modules/nova-predictive.js)
- **Observed Behavior**: Relied on static hardcoded greetings.
- **Remediation Plan**:
  1. Unify `nova.js` and `nova-predictive.js` into an evidence-based diagnostic system.
  2. Ingest real metrics from all modules: live throughput, gateway ping, DNS latency, Wi-Fi RSSI, Network DNA deviations, recent incidents, speed tests.
  3. Structure every diagnostic response: Observed Condition, Supporting Evidence, Likely Explanation, Confidence Level, Recommended Action.
  4. Implement handlers for the 12 diagnostic queries specified in the directive.
  5. Provide an action registry allowing approved operational triggers (speed test, DNS flush, DNA recalculation, gateway check).

---

## 4. Implementation Sequencing & Governance

Execution will proceed continuously according to Section 21:
1. **Data Contracts & Telemetry Standard**: Create `telemetry-contract.js` and unify metric schemas.
2. **Device Radar & Digital Twin Overhaul**: Real subnet sweep, OUI lookup, hostname resolution, SQLite persistence, interactive canvas.
3. **NOVA Intelligence Overhaul**: Evidence-based diagnostic engine, natural-language question handlers, action registry.
4. **Network Time Machine Overhaul**: Real historical queries, property alignment, incident correlation, scrubber replay.
5. **Network DNA Engine Overhaul**: Automatic baseline updating, sample reconciliation, bug fix for `undefined:00`.
6. **System-Wide Module Hardening**: Complete Black Box, Bandwidth Guardian, Wi-Fi Lab, Gaming Intelligence, Prediction, ISP Intelligence, Bufferbloat, Route Vision, Autopilot, Command Centre.
7. **UI Refinement & Canvas Scaling**: Verification of all views in Dark and Light themes.
8. **Automated Integration Testing**: Comprehensive test suite verifying all 16 modules.
9. **Native Desktop Build & Launch**: Compile and verify `VortexSpeed.exe`.
10. **Delivery Documentation**: Final reports.
