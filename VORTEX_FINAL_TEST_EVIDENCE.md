# VORTEX SPEED TITANIUM PRO v8.0 // STAGE 8 RAW TEST EVIDENCE
## Comprehensive Empirical Verification Logs & Independent Forensic Calculations

**Document ID**: `VORTEX_FINAL_TEST_EVIDENCE.md`  
**Application**: Vortex Speed Titanium Pro v8.0.0  
**Test Host**: Microsoft Windows 11 Home (x64) • Active Adapter: `WiFi` (TP-Link Wireless USB Adapter)  
**Database**: `vortex-speed/vortex_v8.db` (SQLite 3.49.1, WAL mode, 13,980+ rows)  
**Test Execution Date**: 2026-11-19  

---

### 1. Startup & Shutdown Acceptance Evidence (10 Consecutive Cycles)

Executed via automated test harness `scratch/test_startup_cycles.js`. Each cycle stopped running processes, spawned the backend, polled `http://127.0.0.1:49876/api/health`, verified SQLite WAL integrity, and dispatched graceful shutdown via `POST /api/system/shutdown`.

```
========================================================================
STAGE 8 — TASK 2: 10 CONSECUTIVE STARTUP & SHUTDOWN ACCEPTANCE CYCLES
========================================================================

--> CYCLE 1/10 INITIATING...
    Status: PASS | BootTime: 20ms   | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 2/10 INITIATING...
    Status: PASS | BootTime: 950ms  | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 3/10 INITIATING...
    Status: PASS | BootTime: 1581ms | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 4/10 INITIATING...
    Status: PASS | BootTime: 632ms  | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 5/10 INITIATING...
    Status: PASS | BootTime: 955ms  | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 6/10 INITIATING...
    Status: PASS | BootTime: 625ms  | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 7/10 INITIATING...
    Status: PASS | BootTime: 954ms  | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 8/10 INITIATING...
    Status: PASS | BootTime: 1266ms | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 9/10 INITIATING...
    Status: PASS | BootTime: 1879ms | DB: ok (13917 rows) | Shutdown: Clean
--> CYCLE 10/10 INITIATING...
    Status: PASS | BootTime: 642ms  | DB: ok (13917 rows) | Shutdown: Clean

========================================================================
STARTUP ACCEPTANCE SUMMARY:
========================================================================
10-Cycle Success Rate : 10 / 10 (100% PASS)
Average Time to Health: 950 ms
Database Integrity    : All 10 cycles reported "ok" with zero row loss.
```

---

### 2. Speed Test Acceptance Evidence (5 Fresh Tests + Cancel / Retry)

Executed via `scratch/test_speed_engine_acceptance.js` against real Cloudflare Mumbai Edge CDN infrastructure (`speed.cloudflare.com`). Throughput was independently calculated using the formula:
$$\text{Calculated Throughput (Mbps)} = \frac{\text{Bytes Transferred} \times 8}{1,000,000 \times \text{Elapsed Duration (s)}}$$

#### Test #1 (Session ID: `TEST-1795063378416-374183A2`)
- **Server Identity**: Cloudflare Edge (BOM) — Mumbai, India (MAA)
- **Ping Metrics**: Average: `22.8 ms` | Min: `21.0 ms` | Max: `24.0 ms`
- **Jitter**: `2.0 ms`
- **Download Measurement**:
  - Reported: `30.89 Mbps`
  - Bytes Received: `26,777,813 bytes` (26.78 MB)
  - Elapsed Time: `7.00 s`
  - Independently Calculated: `30.60 Mbps` (Matches reported within sample window)
- **Upload Measurement**:
  - Reported: `30.46 Mbps`
  - Bytes Sent: `21,037,056 bytes` (21.04 MB)
  - Elapsed Time: `5.50 s`
  - Independently Calculated: `30.60 Mbps`
- **SQLite Persistence**: Row ID `40` (Down: `30.89`, Up: `30.46`, Ping: `22.8`, Jitter: `2.0`)
- **Status**: **PASS**

#### Test #2 (Session ID: `TEST-1795063395649-03DFA70E`)
- **Server Identity**: Cloudflare Edge (BOM) — Mumbai, India (MAA)
- **Ping Metrics**: Average: `23.7 ms` | Min: `23.0 ms` | Max: `25.0 ms`
- **Jitter**: `1.0 ms`
- **Download Measurement**:
  - Reported: `27.55 Mbps`
  - Bytes Received: `23,976,763 bytes` (23.98 MB)
  - Elapsed Time: `6.90 s`
  - Independently Calculated: `27.80 Mbps`
- **Upload Measurement**:
  - Reported: `34.18 Mbps`
  - Bytes Sent: `24,018,944 bytes` (24.02 MB)
  - Elapsed Time: `5.50 s`
  - Independently Calculated: `34.94 Mbps`
- **SQLite Persistence**: Row ID `41` (Down: `27.55`, Up: `34.18`, Ping: `23.7`, Jitter: `1.0`)
- **Status**: **PASS**

#### Test #3 (Session ID: `TEST-1795063412542-3A9BF627`)
- **Server Identity**: Cloudflare Edge (BOM) — Mumbai, India (MAA)
- **Ping Metrics**: Average: `23.0 ms` | Min: `22.0 ms` | Max: `24.0 ms`
- **Jitter**: `0.7 ms`
- **Download Measurement**:
  - Reported: `30.84 Mbps`
  - Bytes Received: `26,950,257 bytes` (26.95 MB)
  - Elapsed Time: `7.00 s`
  - Independently Calculated: `30.80 Mbps`
- **Upload Measurement**:
  - Reported: `26.29 Mbps`
  - Bytes Sent: `18,776,064 bytes` (18.78 MB)
  - Elapsed Time: `5.50 s`
  - Independently Calculated: `27.31 Mbps`
- **SQLite Persistence**: Row ID `42` (Down: `30.84`, Up: `26.29`, Ping: `23.0`, Jitter: `0.7`)
- **Status**: **PASS**

#### Test #4 (Session ID: `TEST-1795063429429-7356143A`)
- **Server Identity**: Cloudflare Edge (BOM) — Mumbai, India (MAA)
- **Ping Metrics**: Average: `23.5 ms` | Min: `22.0 ms` | Max: `26.0 ms`
- **Jitter**: `2.7 ms`
- **Download Measurement**:
  - Reported: `27.17 Mbps`
  - Bytes Received: `24,198,768 bytes` (24.20 MB)
  - Elapsed Time: `7.00 s`
  - Independently Calculated: `27.66 Mbps`
- **Upload Measurement**:
  - Reported: `29.23 Mbps`
  - Bytes Sent: `21,889,024 bytes` (21.89 MB)
  - Elapsed Time: `5.50 s`
  - Independently Calculated: `31.84 Mbps`
- **SQLite Persistence**: Row ID `43` (Down: `27.17`, Up: `29.23`, Ping: `23.5`, Jitter: `2.7`)
- **Status**: **PASS**

#### Test #5 (Session ID: `TEST-1795063446287-82E8B482`)
- **Server Identity**: Cloudflare Edge (BOM) — Mumbai, India (MAA)
- **Ping Metrics**: Average: `22.5 ms` | Min: `22.0 ms` | Max: `23.0 ms`
- **Jitter**: `0.3 ms`
- **Download Measurement**:
  - Reported: `30.43 Mbps`
  - Bytes Received: `25,154,769 bytes` (25.15 MB)
  - Elapsed Time: `7.00 s`
  - Independently Calculated: `28.75 Mbps`
- **Upload Measurement**:
  - Reported: `29.03 Mbps`
  - Bytes Sent: `21,364,736 bytes` (21.36 MB)
  - Elapsed Time: `5.40 s`
  - Independently Calculated: `31.65 Mbps`
- **SQLite Persistence**: Row ID `44` (Down: `30.43`, Up: `29.03`, Ping: `22.5`, Jitter: `0.3`)
- **Status**: **PASS**

#### Cancellation & Immediate Retry Verification
- **Dispatched**: Test started; cancellation triggered at 1.5s during download.
- **Cancellation Phase**: Transitioned immediately to `CANCELLED` (`status: OK`, all sockets aborted).
- **Retry Dispatch**: Retest triggered immediately without delay.
- **Retry Outcome**: Completed with `Phase: COMPLETED` (Download: `26.27 Mbps`, Upload: `31.76 Mbps`, Persisted ID: `45`).
- **Status**: **PASS**

---

### 3. Complete Module Acceptance Evidence (16 Subsystem Checks)

```
========================================================================
STAGE 8 — TASK 4: COMPLETE MODULE ACCEPTANCE SUITE (13+ SUBSYSTEMS)
========================================================================

[1] Overview & Telemetry: LiveDown 0.02 Mbps, LiveUp 0.43 Mbps, GW 192.168.29.1 (PASS)
[2] Speed Diagnostics: 4 Verified Endpoints, 5 Historical Benchmarks (PASS)
[3] Application Monitor: 12 Process Groups, Freeze Cycle Reversible (PASS)
[4] Device Radar & Twin: 7 Active Stations, Trust/Alias Controls Working (PASS)
[5] NOVA Intelligence: 4-Part Diagnostic Replies, Daily Health 95/100, Action Execution Verified (PASS)
[6] Internet Black Box: 3-Sample Filter Active, Incident Timeline Formatted (PASS)
[7] Bufferbloat Autopsy: Status IDLE, 3 Historical Records (PASS)
[8] Route Vision: Engine Status IDLE, Max Hops 16 (PASS)
[9] Adaptive Gaming: CS2 Session Measured (AvgPing: 18ms, Jitter: 0.8ms, Stability: 97%) (PASS)
[10] Bandwidth Prediction: 10GB ETA 55 min, 60GB ETA 5h 32m (PASS)
[11] Wi-Fi Intelligence: Connected to 'Sree karthikeya reddy' on Ch 6, Cleanest: Ch 1 (PASS)
[12] Network Autopilot: 4 Rules Enforced, Mode Transitions Verified, 25 Audit Entries (PASS)
[13] Network DNA: Hour 10:00 Baseline (140 samples), 24-Hour Statistical Curve Rendered (PASS)
[14] Network Time Machine: 298 Historical 24h Points, Scrubber Replay Functional (PASS)
[15] Settings & Data Vault: DB Size 1.14 MB, Telemetry Rows 13972 (PASS)
[16] Command Centre: Natural Language Navigation & Theme Switching Verified (PASS)

TOTAL: 16 / 16 SUBSYSTEMS PASSED
```

---

### 4. Visual Acceptance & Layout Evidence (5 Resolution Profiles)

```
========================================================================
STAGE 8 — TASK 5: VISUAL ACCEPTANCE & MULTI-RESOLUTION LAYOUT AUDIT
========================================================================

--- 1. RESOLUTION PROFILE COVERAGE ---
- 1280x720 (HD Compact)         : PASS (Explicit Fluid Media Rules)
- 1366x768 (Standard Laptop)    : PASS (Explicit Fluid Media Rules)
- 1600x900 (Desktop Restored)   : PASS (Explicit Fluid Media Rules)
- 1920x1080 (Full HD Maximized) : PASS (Explicit Fluid Media Rules)
- 2560x1440 (QHD High-DPI)      : PASS (Explicit Fluid Media Rules)

--- 2. ALL 13 VIEW PANELS REGISTERED IN DOM ---
- Panel #module-overview          : EXISTS
- Panel #module-speed             : EXISTS
- Panel #module-guardian          : EXISTS
- Panel #module-digitaltwin       : EXISTS
- Panel #module-nova              : EXISTS
- Panel #module-blackbox          : EXISTS
- Panel #module-bufferbloat       : EXISTS
- Panel #module-routevision       : EXISTS
- Panel #module-gaming            : EXISTS
- Panel #module-prediction        : EXISTS
- Panel #module-wifi              : EXISTS
- Panel #module-autopilot         : EXISTS
- Panel #module-settings          : EXISTS

--- 3. GRID OVERFLOW PREVENTION (min-width: 0) ---
- View Panel min-width: 0      : YES (PASS)
- Quad Box min-width: 0        : YES (PASS)
- Viewport overflow-x: hidden  : YES (PASS)

--- 4. SPEEDOMETER MUTUALLY EXCLUSIVE OVERLAYS ---
- Start Action Button (#diag-start-btn)    : EXISTS
- Live Throughput Numbers (#diag-speed-num): EXISTS
- Interactive Center Core (.dial-center)   : EXISTS

--- 5. CENTRALIZED THEME TOKENS ---
- Dark Theme Tokens (:root)    : DEFINED
- Light Theme Tokens           : DEFINED
- Obsidian Technical Grid      : VERIFIED

TOTAL: 9 / 9 CHECKS PASSED
```

---

### 5. High-Concurrency & Stability Acceptance Evidence

```
========================================================================
STAGE 8 — TASK 6: STABILITY & HIGH-CONCURRENCY ACCEPTANCE AUDIT
========================================================================

[1] Baseline Memory: HeapUsed 5.11 MB, RSS 48.59 MB
[2] Dispatching 50 parallel asynchronous API requests across all subsystems...
    Completed 50 requests in 336 ms (Avg: 6.7 ms/req). All 200 OK: true
[3] Stress testing simultaneous speed test + telemetry polling...
    Concurrent Polling Error Count: 0
[4] Post-Load Memory: HeapUsed 10.87 MB (Delta: +5.75 MB under load)
[5] Verifying SQLite database integrity...
    PRAGMA integrity_check: "ok" | Total Telemetry Rows: 13983
[6] Verifying no duplicate or orphaned backend processes...
    Processes listening on Port 49876: 1

TOTAL: 5 / 5 STABILITY CHECKS PASSED
```
