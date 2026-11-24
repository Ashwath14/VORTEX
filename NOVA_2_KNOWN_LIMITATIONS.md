# VORTEX SPEED TITANIUM PRO — NOVA 2.0 KNOWN LIMITATIONS

**Technical Boundaries & Operational Caveats**  
**Classification:** Diagnostic Engineering Transparency  
**Report Date:** November 19, 2026  
**Document Version:** 2.0

---

## 1. Local Endpoint Perspective vs. ISP Internal Topology

### Diagnostic Scope Boundary
- NOVA executes as an unprivileged or standard desktop application on the user's Windows PC.
- It observes network telemetry strictly from the perspective of the local client host endpoint.

### Technical Implications
1. **Upstream Peering Inferences:** When NOVA determines that an issue is an *Upstream ISP Transit Bottleneck*, this conclusion is derived by corroborating a low, stable gateway RTT (2–3 ms) against an elevated external public DNS or edge sink RTT (>50 ms). NOVA cannot directly inspect internal ISP router configuration logs, BGP routing policies, or fiber link utilization within the ISP's core backbone.
2. **Hop Identification:** In Internet Route Vision, certain intermediate transit routers may drop ICMP TTL-expired packets or have ICMP rate-limiting enabled, appearing as `* * *`. NOVA correctly treats these as non-responding transit nodes rather than total line drops.

---

## 2. Wireless RF Telemetry vs. Dedicated Spectrum Analyzers

### Software Beacon Telemetry Limitations
- NOVA Wi-Fi diagnostics utilize the Windows Native WLAN API (`netsh wlan`).
- Measurements reflect 802.11 beacon frame announcements and receiver RSSI / SNR reported by the host Wi-Fi adapter.

### Technical Implications
1. **Non-Wi-Fi Interference:** The host Wi-Fi adapter can only report 802.11 Wi-Fi frames. Non-802.11 RF noise sources (such as microwave ovens, Bluetooth transmitters, analog wireless cameras, or baby monitors operating on 2.4 GHz) cause physical packet collisions and retry rates, but do not appear as named BSSIDs. NOVA infers such interference via elevated gateway RTT and packet jitter rather than direct spectrum visualization.
2. **Dual-Band vs. Single-Band Adapters:** If the host PC is equipped with an older single-band 2.4 GHz adapter (802.11n), NOVA cannot scan or report 5 GHz or 6 GHz (Wi-Fi 6E) channel distribution.

---

## 3. Local Subnet Device Discovery Boundaries

### Active Station Sweep Scope
- Device Radar relies on Windows ARP cache entries, `Get-NetNeighbor`, and safe ICMP echo sweeps across the local `/24` subnet.

### Technical Implications
1. **Stealth Firewalls:** Devices configured with strict local firewalls (e.g. Windows Defender set to Public Network, or certain hardened iOS/Android privacy modes) may decline to respond to ICMP ping probes. While their MAC address may still appear in the ARP table if they communicate with the PC, their instantaneous latency cannot be measured.
2. **Sleeping / Low-Power Stations:** Smart IoT devices and smartphones in deep sleep states disconnect their wireless radios periodically. A sweep conducted during their sleep cycle will reflect their `last_seen` timestamp rather than a real-time online status.
3. **MAC Randomization:** Modern mobile operating systems (iOS Private Wi-Fi Address, Android MAC Randomization) rotate MAC addresses periodically. When enabled on client devices, a single physical smartphone may occasionally register under more than one alias over several weeks.

---

## 4. Network DNA Statistical Sample Depth Thresholds

### Mathematical Validity Requirements
- Network DNA calculates hourly baseline distributions (mean, median, standard deviation, IQR, percentiles) across 24 hour buckets.

### Technical Implications
1. **Minimum Sample Size:** At least **5 genuine historical samples** are required within an individual hour bucket before the baseline transitions from `LEARNING` to `ACTIVE`.
2. **High Variance Caveats:** In hour buckets where sample standard deviation exceeds the sample mean ($s > \bar{x}$, CV $> 1.0$), NOVA explicitly flags the baseline as preliminary with elevated variance, rather than presenting it as a settled baseline.
3. **Sleep / Standby Gaps:** If the host PC is powered off overnight, telemetry sampling is paused. Hours during which the PC was asleep accumulate samples only when the PC is subsequently operational during those hours.

---

## 5. Bufferbloat Measurement Pre-Conditions

### Line Saturation Requirement
- Bufferbloat (loaded latency increase) can only be measured by deliberately saturating the download and upload queues.
- As a consequence:
  - Bufferbloat cannot be continuously evaluated on idle background telemetry without generating synthetic line traffic.
  - Running a live Bufferbloat Autopsy is categorized as a **Disruptive Action** requiring explicit user approval to prevent interrupting live video conferences or gaming sessions.

---

## 6. Security Boundaries & Action Allowlisting

### Absolute Command Execution Restrictions
- NOVA will **never** execute arbitrary shell commands (`cmd.exe`, `powershell.exe`) or dynamic JavaScript `eval()` strings parsed from conversation text.
- System actions are restricted to a hardcoded allowlist in `modules/nova/action-manager.js`.
- All disruptive actions require a cryptographically generated, 5-minute time-limited approval token (`ACT_...`) that must be explicitly confirmed by user click in the interface.
