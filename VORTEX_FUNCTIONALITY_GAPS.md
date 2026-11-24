# VORTEX SPEED TITANIUM PRO — FUNCTIONALITY GAPS & METRIC AUDIT
**Scope:** Technical Limitations, Scoring Formulas, Sample Requirements & Honest Disclosures  
**Date:** November 19, 2026  
**Status:** AUDITED & STANDARDIZED

---

## 1. Executive Summary

A critical directive of the product refinement is eliminating misleading indicators, unverified performance scores, and unachievable claims. 

This document establishes the exact mathematical formulas, input requirements, sample sizes, and technical boundaries for every metric displayed across Vortex Speed. Where insufficient data exists, the application displays `INSUFFICIENT DATA` rather than fabricating an arbitrary score.

---

## 2. Mathematical Standards for Calculated Scores

### 1. System Health Score (NOVA Neural Core)
- **Displayed Value:** Numerical score $0 - 100$ (e.g. `Score: 88/100`).
- **Calculation Formula:**
  $$\text{Score} = 100 - P_{\text{loss}} - P_{\text{rtt}} - P_{\text{jitter}} - P_{\text{incidents}}$$
  - **Packet Loss Penalty ($P_{\text{loss}}$):** $\text{Loss \%} \times 2.0$ (Max penalty: $30\text{ pts}$).
  - **Gateway RTT Penalty ($P_{\text{rtt}}$):** $\max(0, (\text{Gateway RTT} - 5\text{ ms}) \times 1.5)$ (Max penalty: $25\text{ pts}$).
  - **Jitter Penalty ($P_{\text{jitter}}$):** $\max(0, (\text{Jitter} - 3\text{ ms}) \times 2.0)$ (Max penalty: $25\text{ pts}$).
  - **Active Incident Penalty ($P_{\text{incidents}}$):** $20\text{ pts}$ if an active incident is unrecovered in Black Box.
- **Input Measurements:** Live gateway ping, WAN ping, RFC 3550 jitter, Black Box active status.
- **Minimum Sample Requirement:** At least 4 consecutive ICMP samples and active physical adapter link rate $> 0$.
- **Insufficient Data State:** If the physical adapter is disconnected or ping returns 100% timeout, the UI displays:  
  `STATUS: UNKNOWN (INSUFFICIENT TELEMETRY DATA)`.
- **Known Limitations:** Evaluates local-to-edge health; cannot diagnose remote server downtime on third-party websites.

---

### 2. ISP SLA Compliance Grade
- **Displayed Value:** Letter Grade (`A+`, `A`, `B`, `C`, `F`) and Compliance Percentage (e.g. `91.4%`).
- **Calculation Formula:**
  $$\text{SLA Compliance \%} = \left(\frac{\sum_{i=1}^{N} \min\left(1.0, \frac{\text{Measured Mbps}_i}{\text{Plan Mbps}}\right)}{N}\right) \times 100$$
  - `A+` ($\ge 95\%$): Full line rate sustained across all tests.
  - `A` ($85 - 94\%$): Minor peak-hour deviation ($< 15\%$).
  - `B` ($70 - 84\%$): Noticeable ISP congestion or line degradation.
  - `C` ($50 - 69\%$): Severe bandwidth throttling.
  - `F` ($< 50\%$): Critical non-compliance with contracted plan.
- **Input Measurements:** Sustained multi-stream download throughput from `speed_tests` table; contracted plan ceiling setting.
- **Minimum Sample Requirement:** Minimum of 3 historical speed tests within the active retention window.
- **Insufficient Data State:** If fewer than 3 tests exist in SQLite, displays:  
  `ISP COMPLIANCE: INSUFFICIENT DATA (Run at least 3 tests to calculate compliance)`.

---

### 3. Bufferbloat Autopsy Score
- **Displayed Value:** Latency Grade (`A+` to `F`) and Delta Latency ($+\Delta\text{ ms}$).
- **Calculation Formula:**
  $$\Delta \text{Bufferbloat} = \max(\text{Loaded Down Ping} - \text{Unloaded Ping}, \text{Loaded Up Ping} - \text{Unloaded Ping})$$
  - `A+` ($\Delta < 5\text{ ms}$): Exceptional router queuing (Active Queue Management / SQM active).
  - `A` ($\Delta < 15\text{ ms}$): Minimal buffer delay; negligible gaming impact.
  - `B` ($\Delta < 40\text{ ms}$): Moderate buffer expansion under heavy saturation.
  - `C` ($\Delta < 100\text{ ms}$): Noticeable lag during concurrent household downloads.
  - `F` ($\Delta \ge 100\text{ ms}$): Severe bufferbloat; packet queueing causes severe gaming freezes.
- **Input Measurements:** 4 unloaded ping samples, 8 loaded ping samples during 100% TCP download saturation, 8 loaded ping samples during 100% TCP upload saturation.
- **Minimum Sample Requirement:** Complete execution of all 3 load phases.
- **Insufficient Data State:** If a test is cancelled early or download streams fail to saturate the line, displays:  
  `BUFFERBLOAT: TEST INCOMPLETE (Insufficient load samples)`.

---

### 4. Device Identification Confidence
- **Displayed Value:** Confidence Percentage (e.g. `High (90%)`, `Medium (65%)`, `Low (30%)`).
- **Calculation Formula:**
  - Base: $30\%$ (IP address responded to ARP probe).
  - $+35\%$ if MAC address resolved to a verified IEEE OUI manufacturer prefix (e.g. Apple, Samsung, Intel).
  - $+25\%$ if Hostname resolved via NetBIOS / mDNS / reverse DNS.
  - $+10\%$ if device has been seen consistently across multiple scans over $> 24\text{ hours}$.
- **Known Limitations:** Random MAC addressing (private MAC feature on iOS/Android) prevents reliable multi-day tracking and hides device manufacturer name.

---

## 3. Windows Desktop Technical Boundaries & Unsupported Capabilities

To ensure user trust, the application explicitly documents what is **supported** versus **unsupported** within the Windows user-space architecture:

| Capability | Status | Implementation Mechanism | Technical Limitations |
|---|---|---|---|
| **Live Adapter Monitoring** | **SUPPORTED** | Windows NDIS adapter byte counters (`Get-NetAdapterStatistics`). | Measures all traffic on adapter; cannot isolate WAN vs LAN without socket correlation. |
| **Multi-Stream Speed Testing** | **SUPPORTED** | 4 parallel native Node.js TCP sockets (`net` / `tls` / `https`). | Dependent on CDN routing and ISP port 443 policies. |
| **Local Device Discovery** | **SUPPORTED** | Windows ARP table (`Get-NetNeighbor`) + safe ICMP echo. | Sleeping devices and firewalled clients will not respond. |
| **Wi-Fi RF Spectrum & BSSID** | **SUPPORTED** | Windows native `netsh wlan` diagnostic parser. | Refresh rate limited by Windows WLAN service polling cooldown. |
| **Black Box Incident Recording** | **SUPPORTED** | Continuous circular buffer written to SQLite WAL journal. | Does not record while the host PC is in Sleep/Hibernate mode. |
| **Kernel-Level Packet Throttling** | **UNSUPPORTED** | User-space Windows application limitation. | Throttling or shaping third-party processes requires specialized NDIS/WFP filter drivers with Administrator privileges. Replaced with Process Bandwidth Monitor. |
| **Hardware Router QoS Overrides** | **UNSUPPORTED** | Consumer Wi-Fi routers do not allow WAN packet re-prioritization from client PCs. | Standalone "Hardware QoS Autopilot" refactored into NOVA's Rule-Based Policy & Recommendation Advisor. |
