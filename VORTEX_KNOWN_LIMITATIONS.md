# VORTEX SPEED TITANIUM PRO v8.0 // KNOWN LIMITATIONS & OPERATIONAL BOUNDARIES
## Technical Transparency & System Architecture Boundaries

**Document ID**: `VORTEX_KNOWN_LIMITATIONS.md`  
**Application**: Vortex Speed Titanium Pro v8.0.0  
**Target Environment**: Microsoft Windows 10 / 11 (x64)  
**Date**: 2026-11-19  

---

### Purpose

To maintain complete engineering integrity, this document explicitly records the physical, architectural, and operating system boundaries of Vortex Speed Titanium Pro. Vortex Speed operates strictly within sanctioned user-mode Windows APIs and standard TCP/IP networking protocols without injecting unstable kernel-mode drivers or spoofing measurements.

---

### 1. Local Network Discovery & Device Radar

| Boundary Condition | Underlying Technical Cause | Behavioral Manifestation | System Mitigation |
| :--- | :--- | :--- | :--- |
| **Sleeping & Deep Standby Devices** | Mobile phones (iOS/Android with screen off) and battery-powered IoT devices enter 802.11 power-save mode (DTIM polling) and do not broadcast ARP. | A mobile device may temporarily vanish from the active radar table until user interaction wakes its transceiver. | Devices remain preserved in SQLite `device_records` marked with `State: Stale` rather than being erased. |
| **Windows Defender ICMP Filtering** | Standard Windows client firewall profiles block unsolicited incoming ICMP Echo requests by default. | LAN Windows PCs report `Ping: N/A` even though their IP and MAC are verified active in the ARP/Neighbor cache. | System displays `Reachable` state and explains firewall ICMP filtering in discovery notes. |
| **IEEE Randomized / Private MACs** | Modern mobile OSes rotate randomized MAC addresses for privacy (bit 1 of 1st octet is `1`). | Vendor cannot be resolved to a fixed hardware manufacturer (Apple/Samsung) via standard IEEE OUI prefix. | Rated honestly as `MEDIUM` confidence and categorized as `Mobile Device (Private/Randomized MAC)`. |
| **802.11 AP Client Isolation** | Wireless routers with AP Isolation or Guest Wi-Fi prevent lateral station-to-station packet traversal. | Direct peer-to-peer ICMP probing fails across isolated clients. | Stations communicating with external internet servers remain discoverable via router-forwarded ARP announcements. |

---

### 2. Process Bandwidth Management & Scheduling

| Boundary Condition | Underlying Technical Cause | Behavioral Manifestation | System Mitigation |
| :--- | :--- | :--- | :--- |
| **Per-Process Packet Throttling** | True kernel-level packet rate capping (e.g., hard-limiting a specific PID to exactly 2.0 Mbps) requires an NDIS 6.0 filter driver or WFP callout driver. | Vortex Speed does not install uncertified kernel drivers that could trigger Windows Blue Screens (BSOD). | Uses Windows API `ProcessPriorityClass.Idle` to de-prioritize background process CPU scheduling, freeing socket queues for games and streams. Fully reversible. |
| **Per-Process Byte Accounting** | Windows `Get-NetTCPConnection` provides socket ownership, remote IP/port endpoints, and connection state, but not real-time byte counters per PID without Event Tracing for Windows (ETW). | Application Monitor displays active TCP socket density and flow share rather than claiming exact per-second byte counters. | Disclosed transparently as `ESTABLISHED_TCP_SOCKETS` ownership rather than simulated byte rates. |

---

### 3. Wi-Fi RF Spectrum vs Beacon Telemetry

| Boundary Condition | Underlying Technical Cause | Behavioral Manifestation | System Mitigation |
| :--- | :--- | :--- | :--- |
| **RF Physical Spectrum Analysis** | Raw radio-frequency spectrum analysis (e.g. measuring non-Wi-Fi RF energy from microwave ovens or analog video transmitters) requires dedicated SDR hardware (HackRF, Wi-Spy). | Vortex Speed utilizes the standard Windows Native Wi-Fi API (`netsh wlan`). | Telemetry is explicitly documented as 802.11 Beacon Frame parsing and receiver RSSI metrics, not dedicated RF hardware spectrum capture. |

---

### 4. Internet Transit & Routing (Tracert)

| Boundary Condition | Underlying Technical Cause | Behavioral Manifestation | System Mitigation |
| :--- | :--- | :--- | :--- |
| **Intermediate Backbone ICMP Rate-Limiting** | Major tier-1 telecom backbones (Tata, Airtel, Jio, Level3) rate-limit or silently discard ICMP TTL-exceeded packets to protect router control planes. | Hops 3–6 in Route Vision may display `* * * (Request timed out)` even while the destination responds with low latency. | Route Vision correctly identifies these as rate-limited transit nodes and verifies end-to-end delivery rather than falsely reporting an internet outage. |

---

### 5. Browser Audio & Edge App Mode Policies

| Boundary Condition | Underlying Technical Cause | Behavioral Manifestation | System Mitigation |
| :--- | :--- | :--- | :--- |
| **Chromium Autoplay Audio Gate** | Chromium and Microsoft Edge enforce a user-gesture requirement before allowing Web Audio playback. | Interactive bubble click sound effects (`playBubbleClick`) do not play until the user performs their first click on the UI. | Audio initializes gracefully on first interaction without throwing unhandled exceptions. |

---

### Summary Checklist of Operational Realism

- [x] **Zero Synthetic Datasets**: All displayed values originate in live Windows APIs or SQLite history.
- [x] **Zero Simulated AI Models**: Machine learning is not falsely claimed; statistical variance algorithms and empirical baselines are used.
- [x] **Zero Fake Kernel Drivers**: System stability is preserved by adhering to sanctioned Windows Win32 APIs.
