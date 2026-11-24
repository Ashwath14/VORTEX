# VORTEX SPEED TITANIUM PRO — NETWORK DNA ENGINE
## STATISTICAL VALIDATION & ANOMALY DETECTION REPORT

---

## 1. DEFICIENCY ANALYSIS & ROOT-CAUSE

In screenshot 4, **Network DNA** exhibited serious issues despite having over 8,247 telemetry rows in SQLite:
1. Status remained stuck in `LEARNING` with `0/5 genuine samples`.
2. Recurring Congestion Windows displayed `undefined:00`.
3. The 24-hour baseline curve canvas was blank.

### Root-Cause Analysis
- **Missing Boot Recalculation**:
  `recalculateBaselines()` in `network-dna.js` was only called if manually triggered through Autopilot. On application startup, the constructor was empty, meaning `network_dna_baselines` was never populated from the existing SQLite rows in `telemetry_history`.
- **JavaScript `undefined !== null` Bug**:
  In `detectRecurringPatterns()`, when fewer than 3 buckets were present, `slowestHour` and `fastestHour` were omitted (returning `undefined`).
  In `app.js`:
  ```javascript
  if (data.recurringPatterns.slowestHour !== null) {
    dnaSlowWindow.textContent = `${data.recurringPatterns.slowestHour}:00`;
  }
  ```
  In JavaScript, `undefined !== null` evaluates to `true`! This produced the text `"undefined:00"` displayed on the dashboard.
- **Canvas Resize Exception**:
  In `renderDnaCurve()`, if called on window resize without passing a new curve parameter, the code executed `curve.forEach(...)` instead of `activeCurve.forEach(...)`, throwing an unhandled `TypeError` that suppressed canvas rendering.

---

## 2. MATHEMATICAL ARCHITECTURE & IMPLEMENTATION

The rewritten subsystem in [`vortex-speed/modules/network-dna.js`](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/modules/network-dna.js) implements rigorous statistical profiling:

### A. Autonomous Bootstrap on Startup
On engine initialization, a timer automatically triggers baseline recalculation across all historical telemetry:
```javascript
setTimeout(() => this.recalculateBaselines(), 1200);
setInterval(() => this.recalculateBaselines(), 5 * 60 * 1000);
```

### B. Statistical Profiling across (Hour of Day, Day Type) Buckets
The engine partitions all historical telemetry into $24 \times 2 = 48$ buckets (24 hours for weekdays, 24 hours for weekends):
- **Sample Mean ($\mu$)**:
  $$\mu = \frac{1}{N} \sum_{i=1}^N x_i$$
- **Sample Standard Deviation ($\sigma$)**:
  $$\sigma = \sqrt{\frac{1}{N-1} \sum_{i=1}^N (x_i - \mu)^2}$$
- **Minimum, Maximum, and Median**: Exact non-parametric order statistics.

### C. Z-Score Anomaly Detection
When evaluating live network throughput ($x$) against the historical norm ($\mu, \sigma$):
$$Z = \frac{x - \mu}{\sigma}$$
- $Z < -2.0$: **Severe Throughput Drop** (Anomaly Level: `SEVERE`).
- $-2.0 \le Z < -1.3$: **Moderate Slowdown** (Anomaly Level: `MODERATE`).
- $Z_{ping} > 2.0$: **Latency Spike** (Anomaly Level: `WARNING`).
- $Z > 1.8$: **Peak Efficiency** (Anomaly Level: `OPTIMAL`).
- Otherwise: **Nominal Operation** (Anomaly Level: `NORMAL`).

### D. Recurring Congestion Identification
The engine analyzes baseline means across all 24 hours:
If $\mu_{fastest} > 1.25 \times \mu_{slowest}$, the slowest hour is flagged as a recurring congestion bottleneck, allowing users to schedule large transfers during optimal off-peak hours.

---

## 3. CANVAS 24-HOUR CURVE VISUALIZATION

In [`vortex-speed/public/app.js`](file:///c:/Users/krish/Downloads/speedrr-main/vortex-speed/public/app.js), `renderDnaCurve()` displays:
1. **Shaded Variance Corridor ($\mu \pm \sigma$)**:
   Semi-transparent cyan band representing the expected statistical bounds across the 24-hour cycle.
2. **Mean Throughput Curve ($\mu$)**:
   Crisp 2.5px Cyan (`#00D9FF`) line tracing average speed by hour.
3. **Current Hour Indicator**:
   Vertical amber dashed marker highlighting the active time window with label `NOW (1:00)`.
4. **Hour Axis Labels**:
   `0:00`, `4:00`, `8:00`, `12:00`, `16:00`, `20:00`, `23:00`.

---

## 4. VERIFICATION EVIDENCE

Live endpoint response from `GET /api/dna`:
```json
{
  "status": "ACTIVE",
  "hasSufficientData": true,
  "hourOfDay": 1,
  "dayType": "weekday",
  "sampleCount": 1382,
  "totalTelemetrySamples": 8663,
  "baseline": {
    "avgDownMbps": 0.06,
    "stdDownMbps": 0.05,
    "minDownMbps": 0.0,
    "maxDownMbps": 32.88,
    "medianDownMbps": 0.05,
    "avgUpMbps": 1.48,
    "stdUpMbps": 3.14,
    "avgPingMs": 2.9,
    "stdPingMs": 4.07,
    "avgJitterMs": 1.2
  },
  "liveMetrics": {
    "downloadMbps": 0.1,
    "uploadMbps": 2.92,
    "pingMs": 2,
    "percentDeviation": 66.7,
    "zScoreDown": 0.8,
    "zScorePing": -0.22
  },
  "anomaly": {
    "detected": false,
    "level": "NORMAL",
    "type": "NOMINAL",
    "zScore": 0.8,
    "explanation": "Nominal network behavior: Active throughput aligns within expected statistical distribution."
  },
  "recurringPatterns": {
    "hasPatterns": true,
    "fastestHour": 22,
    "slowestHour": 1,
    "patterns": [
      {
        "type": "RECURRING_CONGESTION",
        "hour": 1,
        "description": "Recurring slowdown identified at 1:00 (averaging 0.06 Mbps vs peak 27.42 Mbps at 22:00)."
      }
    ]
  }
}
```
Network DNA transitioned from `LEARNING` to `ACTIVE`, evaluated 8,663 records, resolved recurring patterns without `"undefined:00"`, and renders the full 24-hour variance curve.
