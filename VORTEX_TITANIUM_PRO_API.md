# VORTEX SPEED — TITANIUM PRO v8.0
## REST & SERVER-SENT EVENTS (SSE) API SPECIFICATION
**Host:** `127.0.0.1`  
**Port:** `49876`  
**Protocol:** HTTP/1.1  
**Default Content-Type:** `application/json; charset=utf-8`

---

### 1. CORE TELEMETRY & HARDWARE APIS

#### `GET /api/events`
* **Description:** Continuous real-time Server-Sent Events (SSE) telemetry stream published at 1 Hz.
* **Headers:** `Content-Type: text/event-stream`, `Cache-Control: no-cache`
* **Response Payload (Per Tick):** Complete snapshot object identical to `/api/telemetry`.

#### `GET /api/telemetry`
* **Description:** Retrieves the latest physical adapter throughput, byte counters, and network identity.
* **Response Example:**
```json
{
  "liveMbps": 33.3,
  "liveMBps": 4.16,
  "liveUpMbps": 32.1,
  "liveUpMBps": 4.01,
  "planMbps": 30.0,
  "scaleMax": 40.0,
  "usage": { "todayGB": "33.31", "sessionMB": "120.4" },
  "network": {
    "ip": "192.168.29.129",
    "gateway": "192.168.29.1",
    "adapterName": "WiFi",
    "adapterDescription": "TP-Link Wireless USB Adapter",
    "signal": "100%",
    "rssi": -42,
    "channel": "6",
    "band": "2.4 GHz",
    "linkSpeed": "144.4 Mbps"
  }
}
```

---

### 2. NETWORK DNA APIS (PHASE 1)

#### `GET /api/dna` or `GET /api/dna/status`
* **Description:** Retrieves the current statistical baseline, live Z-score anomaly evaluation, and recurring congestion windows.
* **Response Example:**
```json
{
  "status": "ACTIVE",
  "hasSufficientData": true,
  "hourOfDay": 22,
  "dayType": "weekday",
  "sampleCount": 42,
  "totalTelemetrySamples": 311,
  "baseline": {
    "meanDownMbps": 16.01,
    "stdDevDown": 10.55,
    "meanUpMbps": 14.88,
    "stdDevUp": 9.42,
    "meanPingMs": 16.0,
    "stdDevPing": 2.1
  },
  "anomaly": {
    "isAnomaly": false,
    "deviationPct": 109.5,
    "zScore": 1.66,
    "severity": "ELEVATED",
    "explanation": "Nominal network behavior: Active throughput (33.55 Mbps) aligns within expected statistical distribution (16.01 ±10.55 Mbps) for 22:00 on weekdays."
  },
  "recurringPatterns": {
    "slowestHour": 20,
    "peakHour": 3
  }
}
```

#### `GET /api/dna/curve?dayType=weekday`
* **Query Parameters:** `dayType` (`weekday` or `weekend`)
* **Description:** Returns the complete 24-hour baseline curve array containing historical mean, standard deviation, and sample count for every hour of the day (00:00 to 23:00).

#### `POST /api/dna/recalculate`
* **Description:** Forces an immediate recalculation of all hourly variance baselines from genuine SQLite historical records.

---

### 3. BUFFERBLOAT AUTOPSY APIS (PHASE 2)

#### `POST /api/bufferbloat/start`
* **Description:** Initiates a controlled 3-phase bufferbloat evaluation.
* **Request Body:**
```json
{ "mode": "standard" } // Options: "quick" (3s), "standard" (8s), "thorough" (15s)
```
* **Response:** `{ "success": true, "message": "Bufferbloat diagnostic initiated (STANDARD mode)." }`

#### `GET /api/bufferbloat/status`
* **Description:** Polls the active progress and live measurements of the bufferbloat diagnostic.
* **Response Example:**
```json
{
  "isRunning": false,
  "phase": "complete",
  "progress": 1.0,
  "idlePing": 16,
  "downPing": 16,
  "upPing": 16,
  "downDelta": 0,
  "upDelta": 0,
  "maxDelta": 0,
  "grade": "A+",
  "evaluation": "Grade A+ (Optimal). Zero measurable latency inflation under full line saturation.",
  "sqmRecommendation": {
    "downSqmBandwidthMbps": 25.5,
    "upSqmBandwidthMbps": 25.5,
    "recommendedAlgorithm": "CAKE",
    "explanation": "Configure SQM on router at 25.5 Mbps Down and 25.5 Mbps Up (85% of 30.0 Mbps line)."
  }
}
```

#### `POST /api/bufferbloat/cancel`
* **Description:** Immediately terminates running active test sockets and restores the system to idle state.

#### `GET /api/bufferbloat/history?limit=10`
* **Description:** Retrieves historical bufferbloat test records from SQLite.

---

### 4. INTERNET ROUTE VISION APIS (PHASE 3)

#### `POST /api/route/trace`
* **Description:** Starts an asynchronous transit hop trace.
* **Request Body:**
```json
{ "destination": "cloudflare", "customTarget": "" }
```
* **Destination Presets:** `cloudflare` (1.1.1.1), `google` (8.8.8.8), `gateway` (192.168.29.1), `valorant` (151.106.248.1), `custom`.

#### `GET /api/route/status`
* **Description:** Polls active hop trace resolution, intermediate hop classifications, and route fingerprints.
* **Response Example:**
```json
{
  "isTracing": false,
  "destination": "1.1.1.1",
  "hops": [
    { "hop": 1, "ip": "192.168.29.1", "avgRtt": 2, "bestRtt": 2, "lossPercent": 0, "classification": "SUCCESS" },
    { "hop": 2, "ip": "10.12.160.1", "avgRtt": 15, "bestRtt": 14, "lossPercent": 0, "classification": "SUCCESS" },
    { "hop": 8, "ip": "*", "avgRtt": null, "bestRtt": null, "lossPercent": 100, "classification": "ICMP_RATE_LIMITED" },
    { "hop": 12, "ip": "1.1.1.1", "avgRtt": 16, "bestRtt": 16, "lossPercent": 0, "classification": "SUCCESS" }
  ],
  "fingerprint": "7c1f885e3a9b9a1e0b5712ad0fbc491a",
  "routeChangeDetected": false
}
```

#### `POST /api/route/cancel`
* **Description:** Terminates active asynchronous `tracert` process.

#### `GET /api/route/history?limit=10`
* **Description:** Retrieves past route traces and reroute detection audits from SQLite.

---

### 5. NOVA PREDICTIVE INTELLIGENCE APIS (PHASE 4)

#### `GET /api/nova/report/daily`
* **Description:** Generates daily health briefing separating `[FACT]` from `[PREDICTION]`.
* **Response Example:**
```json
{
  "dateStr": "2026-11-18",
  "healthScore": 95,
  "uptimePct": 100,
  "summaryText": "Daily Network Health: Score 95/100. Connection demonstrated 100% uptime across monitored window.",
  "facts": [
    "Local Gateway (192.168.29.1) latency currently measures 2 ms with 0% packet loss.",
    "Wi-Fi adapter link speed is verified at 144.4 Mbps with 100% signal quality (-42 dBm).",
    "Today's accumulated data transfer is 33.31 GB across physical adapter 'WiFi'."
  ],
  "predictions": [
    "Expected throughput next hour (23:00): 16.01 Mbps (Confidence: 90%).",
    "Month-end projected bandwidth consumption: 732.8 GB based on active burn rate."
  ],
  "trends": { "sampleCount": 311, "avgDownMbps": 28.5, "avgPingMs": 16.0, "uptimePct": 100 }
}
```

#### `GET /api/nova/report/weekly`
* **Description:** Generates 7-day multi-day behavioral trend and stability index summary.

#### `POST /api/nova/troubleshoot`
* **Description:** Conversational Q&A engine resolving everyday network queries.
* **Request Body:** `{ "question": "Why is my ping suddenly high?" }`
* **Response Example:**
```json
{
  "question": "Why is my ping suddenly high?",
  "measuredFacts": [
    "Gateway ping: 2 ms.",
    "DNS ping (1.1.1.1): 16 ms.",
    "Current loaded latency increase: +0 ms."
  ],
  "evidenceAnalysis": "Gateway response time is normal. Latency jump is located in external ISP transit hops.",
  "likelyCause": "Upstream ISP routing peering",
  "recommendedAction": "Check Bufferbloat Autopsy and apply SQM rate shaping limits.",
  "confidenceScore": 88
}
```

---

### 6. NETWORK AUTOPILOT APIS (PHASE 5)

#### `GET /api/autopilot/state`
* **Description:** Retrieves operating mode, safety rules, pending approvals, and active optimizations.

#### `POST /api/autopilot/mode`
* **Request Body:** `{ "mode": "ASSIST" }` // Options: "OBSERVE", "ASSIST", "AUTOPILOT", "MANUAL"
* **Response:** `{ "success": true, "mode": "ASSIST" }`

#### `POST /api/autopilot/approve`
* **Request Body:** `{ "actionId": "ACT-1731945600000", "approve": true }`
* **Description:** Submits user approval or rejection for a proposed action in ASSIST mode.

#### `POST /api/autopilot/rollback`
* **Request Body:** `{ "actionKey": "ENGAGE_GAMING_PRIORITY" }`
* **Description:** Reverts an applied optimization immediately.

#### `POST /api/autopilot/execute`
* **Request Body:** `{ "actionKey": "PURGE_DNS_CACHE", "triggerReason": "User manual overdrive" }`

#### `GET /api/autopilot/logs?limit=25`
* **Description:** Retrieves immutable SQLite audit records (`autopilot_audit_log`).
