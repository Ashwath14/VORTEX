# VORTEX SPEED TITANIUM PRO // NETWORK DATA INTEGRITY REPORT

**Standard Version**: 8.1.0  
**Data Integrity Authority**: `modules/telemetry-contract.js`  
**Storage Architecture**: SQLite 3 (WAL Mode, `PRAGMA synchronous = NORMAL;`, `PRAGMA busy_timeout = 5000;`)

---

## 1. Single Source of Truth Architecture

To permanently resolve inconsistencies where different modules reported conflicting values or failed to render due to property mismatches, Vortex Speed Titanium Pro establishes a **Single Source of Truth** architecture.

```
                    +------------------------------------+
                    |        Windows Networking Kernel   |
                    | (NetAdapterStatistics / ICMP / ARP)|
                    +-----------------+------------------+
                                      |
                                      v
                    +------------------------------------+
                    |       telemetry.js Service         |
                    |   Continuous 2.5s Snapshot Poller  |
                    +-----------------+------------------+
                                      |
                         +------------+------------+
                         |                         |
                         v                         v
               +-------------------+     +-------------------+
               |  SQLite Database  |     | telemetry-contract|
               | telemetry_history |     | Standardization   |
               +---------+---------+     +---------+---------+
                         |                         |
       +-----------------+-------------------------+-----------------+
       |                 |                         |                 |
       v                 v                         v                 v
+--------------+  +--------------+          +--------------+  +--------------+
| Time Machine |  | Network DNA  |          | Digital Twin |  |     NOVA     |
| (Historical) |  | (Statistical)|          | (Discovery)  |  | (Diagnostic) |
+--------------+  +--------------+          +--------------+  +--------------+
```

---

## 2. Classification of Data Types

Every measurement delivered by the backend now carries explicit classification metadata:

1. **`LIVE_MEASUREMENT`**:
   - Fresh byte counters read directly from Windows network adapter counters (`Get-NetAdapterStatistics`).
   - Latency to gateway measured via live ICMP socket.
   - Freshness: < 2.5 seconds.
2. **`HISTORICAL_MEASUREMENT`**:
   - Immutable records retrieved from SQLite table `telemetry_history`.
   - Never modified or replaced by synthetic values.
3. **`CONTROLLED_BENCHMARK`**:
   - High-load multi-stream TCP throughput records from `speed_tests` or `bufferbloat_records`.
   - Separate from passive background adapter monitoring.
4. **`LOCAL_DISCOVERY`**:
   - Discovered devices on the `/24` subnet verified via ARP cache and ICMP reachability checks.
   - Categorized as `VERIFIED_GATEWAY`, `VERIFIED_LOCAL_HOST`, or `ACTIVE_RESPONDING_STATION`.
5. **`STATISTICAL_BASELINE`**:
   - Derived hourly distributions (Mean, StdDev, Median, IQR, Z-Score) computed across genuine SQLite records.
   - Labeled `LEARNING` until at least 5 genuine samples exist in the hourly bucket.
6. **`UNAVAILABLE_DATA`**:
   - Returned when historical records do not exist for a requested time range.
   - Never filled with sinusoidal or fabricated data. Displayed with an honest empty state and date bounds.

---

## 3. Data Contract Properties & Dual-Naming Standard

To eliminate frontend discrepancies (e.g. `p.download_mbps` vs `p.downMbps`), every measurement object provides normalized dual-naming:

| Metric | Primary (CamelCase) | Compatible Alias (Snake_Case) | Unit | Precision |
| :--- | :--- | :--- | :--- | :--- |
| **Download Speed** | `downMbps` | `download_mbps`, `down_mbps` | Mbps | 2 decimal places |
| **Download Bytes** | `liveMBps` | `download_mb_s` | MB/s | 2 decimal places |
| **Upload Speed** | `upMbps` | `upload_mbps`, `up_mbps` | Mbps | 2 decimal places |
| **Latency / Ping** | `ping` | `pingMs`, `ping_ms` | ms | Integer (rounded) |
| **Jitter** | `jitter` | `jitterMs`, `jitter_ms` | ms | 1 decimal place |
| **Plan Ceiling** | `planMbps` | `plan_mbps` | Mbps | 1 decimal place |
| **Timestamp** | `timestamp` | `timestamp` | Epoch ms | Integer |
| **Time Label** | `timeStr` | `time_str` | Local Time | `HH:MM:SS` |

---

## 4. Verification

The data contract was verified against live SQLite queries and frontend consumers, confirming zero property omissions and complete compatibility across all 16 modules.
