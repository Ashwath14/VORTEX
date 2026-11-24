const { exec, execFile } = require('child_process');
const path = require('path');
const dns = require('dns');
const { getDb } = require('../database/db');
const telemetryService = require('./telemetry');
const { formatDeviceRecord } = require('./telemetry-contract');
const SETTINGS = require('../config/settings');

// Common MAC OUI Database
const OUI_MAP = {
  'AC:10:07': { vendor: 'Jio Platforms Ltd', category: 'router' },
  '18:E8:29': { vendor: 'Jio Platforms Ltd', category: 'router' },
  '70:28:8B': { vendor: 'Jio Platforms Ltd', category: 'router' },
  '8C:86:DD': { vendor: 'TP-Link Technologies', category: 'pc' },
  '50:3E:AA': { vendor: 'TP-Link Technologies', category: 'station' },
  'E8:48:B8': { vendor: 'TP-Link Technologies', category: 'station' },
  'C0:06:C3': { vendor: 'TP-Link Technologies', category: 'station' },
  '00:12:FB': { vendor: 'Samsung Electronics', category: 'phone' },
  '0C:9A:42': { vendor: 'Samsung Electronics', category: 'phone' },
  '34:23:87': { vendor: 'Samsung Electronics', category: 'phone' },
  '88:75:56': { vendor: 'Samsung Electronics', category: 'phone' },
  '98:0C:A5': { vendor: 'Samsung Electronics', category: 'phone' },
  '00:03:93': { vendor: 'Apple Inc.', category: 'phone' },
  '00:05:02': { vendor: 'Apple Inc.', category: 'pc' },
  '14:7D:DA': { vendor: 'Apple Inc.', category: 'phone' },
  'F0:18:98': { vendor: 'Apple Inc.', category: 'phone' },
  'F4:34:F0': { vendor: 'Apple Inc.', category: 'phone' },
  'AC:BC:32': { vendor: 'Apple Inc.', category: 'phone' },
  'D8:96:95': { vendor: 'Apple Inc.', category: 'phone' },
  '00:1A:11': { vendor: 'Google / Nest', category: 'hub' },
  '48:D7:05': { vendor: 'Google / Nest', category: 'hub' },
  'F8:8F:C3': { vendor: 'Google LLC', category: 'phone' },
  '00:02:B3': { vendor: 'Intel Corporation', category: 'pc' },
  '00:03:47': { vendor: 'Intel Corporation', category: 'pc' },
  '34:DE:1A': { vendor: 'Intel Corporation', category: 'pc' },
  '80:86:F2': { vendor: 'Intel Corporation', category: 'pc' },
  'B8:27:EB': { vendor: 'Raspberry Pi Foundation', category: 'hub' },
  'DC:A6:32': { vendor: 'Raspberry Pi Foundation', category: 'hub' }
};

class NetworkDigitalTwin {
  constructor() {
    this.devices = [];
    this.lastSweepTime = 0;
    this.isScanning = false;
    this.loadFromDb();
    this.startSweepLoop();
  }

  loadFromDb() {
    try {
      const db = getDb();
      const rows = db.prepare('SELECT * FROM device_records ORDER BY last_seen DESC').all();
      if (rows && rows.length > 0) {
        const snap = telemetryService.getSnapshot();
        const localIp = snap.network.ip || '192.168.29.129';
        const gwIp = snap.network.gateway || '192.168.29.1';

        this.devices = rows.map(r => formatDeviceRecord({
          mac: r.mac,
          ip: r.ip,
          hostname: r.hostname,
          vendor: r.vendor,
          category: r.category,
          firstSeen: r.first_seen,
          lastSeen: r.last_seen,
          ping: r.ping || 'N/A',
          isTrusted: r.is_trusted === 1,
          trustLabel: r.trust_label || (r.is_trusted === 1 ? 'Trusted' : 'Unknown'),
          connectionState: r.connection_state || 'Reachable',
          confidence: r.confidence || 'MEDIUM',
          customName: r.custom_name
        }, localIp, gwIp));
      }
    } catch (e) {
      console.error('[DigitalTwin] Error loading from DB:', e.message);
    }
  }

  // Lookup vendor and device category based on MAC prefix or randomized address bit
  resolveMacDetails(mac) {
    if (!mac || mac.length < 8) return { vendor: 'Unknown Station', category: 'station' };
    const prefix = mac.substring(0, 8).toUpperCase();

    if (OUI_MAP[prefix]) {
      return OUI_MAP[prefix];
    }

    // Check IEEE 802 Local / Randomized MAC Address bit (bit 1 of 1st octet is 1)
    const firstByte = parseInt(mac.substring(0, 2), 16);
    if (!isNaN(firstByte) && (firstByte & 0x02) !== 0) {
      return {
        vendor: 'Mobile Device (Private/Randomized MAC)',
        category: 'phone'
      };
    }

    return {
      vendor: 'Ethernet / Wi-Fi Device',
      category: 'station'
    };
  }

  // Subnet Sweep using fast asynchronous ping broadcast + direct ARP reading
  sweepNetwork(callback = null) {
    if (this.isScanning) {
      if (callback) callback({ status: 'BUSY', message: 'Scan already in progress' });
      return;
    }

    this.isScanning = true;
    const snap = telemetryService.getSnapshot();
    const gw = snap.network.gateway || '192.168.29.1';
    const localIp = snap.network.ip || '192.168.29.129';
    const prefix = gw.substring(0, gw.lastIndexOf('.'));

    // Asynchronous ping sweep of all 254 hosts on the /24 subnet
    const psSweep = `powershell -NoProfile -Command "1..254 | ForEach-Object { (New-Object System.Net.NetworkInformation.Ping).SendPingAsync('${prefix}.' + $_, 120) } | Out-Null; Start-Sleep -Milliseconds 800"`;

    exec(psSweep, { timeout: 4500 }, () => {
      // Read active ARP table entries from OS
      exec('arp -a', (arpErr, stdout) => {
        const rawDevices = new Map(); // ip -> { ip, mac, type }

        if (!arpErr && stdout) {
          const lines = stdout.split('\n');
          lines.forEach(line => {
            const match = line.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F-]+)\s+(\w+)/);
            if (match) {
              const ip = match[1];
              const mac = match[2].toUpperCase().replace(/-/g, ':');
              const type = match[3];

              if (ip.startsWith(prefix) && !ip.endsWith('.255') && !ip.endsWith('.0') && mac !== 'FF:FF:FF:FF:FF:FF') {
                rawDevices.set(ip, { ip, mac, type });
              }
            }
          });
        }

        // Always ensure Gateway and Local Host exist
        if (!rawDevices.has(gw)) {
          rawDevices.set(gw, { ip: gw, mac: 'AC:10:07:9E:0C:0F', type: 'gateway' });
        }
        if (!rawDevices.has(localIp)) {
          rawDevices.set(localIp, { ip: localIp, mac: '8C:86:DD:5D:22:1E', type: 'host' });
        }

        // Perform fast parallel ICMP ping & hostname resolution on discovered IPs
        const ipList = Array.from(rawDevices.keys());
        const db = getDb();
        const now = Date.now();

        if (ipList.length === 0) {
          this.isScanning = false;
          if (callback) callback({ status: 'COMPLETED', count: 0 });
          return;
        }

        const scriptPath = path.join(__dirname, 'probe-devices.ps1');
        execFile('powershell.exe', [
          '-NoProfile',
          '-ExecutionPolicy', 'Bypass',
          '-File', scriptPath,
          '-ipList', ipList.join(',')
        ], { timeout: 6000 }, (pErr, pOut) => {
          const probeMap = new Map();
          if (!pErr && pOut && pOut.trim()) {
            try {
              const parsed = JSON.parse(pOut.trim());
              const arr = Array.isArray(parsed) ? parsed : [parsed];
              arr.forEach(item => {
                if (item && item.ip) probeMap.set(item.ip, item);
              });
            } catch (e) {}
          }

          ipList.forEach(ip => {
            const dev = rawDevices.get(ip);
            const isGw = ip === gw;
            const isLocal = ip === localIp;
            const probeInfo = probeMap.get(ip);

            let pingMs = (probeInfo && probeInfo.rtt >= 0) ? `${probeInfo.rtt} ms` : 'N/A';
            if (isGw && pingMs === 'N/A') pingMs = '2 ms';
            if (isLocal && pingMs === 'N/A') pingMs = '0 ms';

            // Connection state from probe or default
            let connState = (probeInfo && probeInfo.connectionState) ? probeInfo.connectionState : ((pingMs !== 'N/A' || isGw || isLocal) ? 'Reachable' : 'Stale');

            // Vendor & Category
            let { vendor, category } = this.resolveMacDetails(dev.mac);
            let hostname = (probeInfo && probeInfo.hostname) ? probeInfo.hostname : `Station (${ip})`;

            if (isGw) {
              hostname = 'JioFiber Gateway (reliance.reliance)';
              vendor = 'Reliance Jio / Foxconn';
              category = 'router';
            } else if (isLocal) {
              hostname = (probeInfo && probeInfo.hostname) ? `${probeInfo.hostname} (This PC)` : 'This PC (Ashwath_Karthi)';
              vendor = 'TP-Link Wireless Adapter';
              category = 'pc';
            }

            // Identification Confidence Rating
            let confidence = 'LOW';
            if (isGw || isLocal) {
              confidence = 'HIGH';
            } else if (pingMs !== 'N/A' && !vendor.includes('Unknown') && !vendor.includes('Private')) {
              confidence = 'HIGH';
            } else if (pingMs !== 'N/A' || connState === 'Reachable') {
              confidence = 'MEDIUM';
            }

            // Upsert into SQLite
            try {
              db.prepare(`
                INSERT INTO device_records (mac, ip, hostname, vendor, category, first_seen, last_seen, ping, is_trusted, connection_state, confidence, trust_label)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(mac) DO UPDATE SET
                  ip = excluded.ip,
                  last_seen = excluded.last_seen,
                  ping = excluded.ping,
                  connection_state = excluded.connection_state,
                  confidence = excluded.confidence,
                  hostname = CASE WHEN excluded.hostname != '' AND excluded.hostname NOT LIKE 'Station (%' THEN excluded.hostname ELSE device_records.hostname END
              `).run(dev.mac, ip, hostname, vendor, category, now, now, pingMs, (isGw || isLocal) ? 1 : 0, connState, confidence, (isGw || isLocal) ? 'Trusted' : 'Unknown');
            } catch (dbErr) {
              console.error('[DigitalTwin] DB Upsert error:', dbErr.message);
            }
          });

          this.loadFromDb();
          this.lastSweepTime = Date.now();
          this.isScanning = false;
          if (callback) callback({ status: 'COMPLETED', count: this.devices.length });
        });
      });
    });
  }

  setDeviceCustomName(identifier, customName) {
    try {
      const db = getDb();
      db.prepare('UPDATE device_records SET custom_name = ? WHERE mac = ? OR ip = ?').run(customName, identifier, identifier);
      this.loadFromDb();
      return { success: true, identifier, customName };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  toggleTrust(identifier) {
    try {
      const db = getDb();
      const current = db.prepare('SELECT is_trusted FROM device_records WHERE mac = ? OR ip = ?').get(identifier, identifier);
      const newStatus = (current && current.is_trusted === 1) ? 0 : 1;
      const newLabel = newStatus === 1 ? 'Trusted' : 'Unknown';
      db.prepare('UPDATE device_records SET is_trusted = ?, trust_label = ? WHERE mac = ? OR ip = ?').run(newStatus, newLabel, identifier, identifier);
      this.loadFromDb();
      return { success: true, identifier, isTrusted: newStatus === 1, trustLabel: newLabel };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  setTrustLabel(identifier, trustLabel) {
    try {
      const db = getDb();
      const isTrusted = trustLabel === 'Trusted' ? 1 : 0;
      db.prepare('UPDATE device_records SET trust_label = ?, is_trusted = ? WHERE mac = ? OR ip = ?').run(trustLabel, isTrusted, identifier, identifier);
      this.loadFromDb();
      return { success: true, identifier, trustLabel, isTrusted: isTrusted === 1 };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  startSweepLoop() {
    this.sweepNetwork();
    setInterval(() => this.sweepNetwork(), SETTINGS.DEVICE_SWEEP_INTERVAL_MS || 45000);
  }

  getTopology() {
    const snap = telemetryService.getSnapshot();
    const gw = snap.network.gateway || '192.168.29.1';
    const localIp = snap.network.ip || '192.168.29.129';

    // Format graph: Central Router node + radiating Client nodes
    const nodes = [
      {
        id: 'router',
        name: 'JioFiber Gateway',
        ip: gw,
        type: 'router',
        status: 'ONLINE',
        connectionState: 'Reachable',
        confidence: 'HIGH',
        trustLabel: 'Trusted',
        ping: '3 ms',
        isTrusted: true,
        vendor: 'Reliance Jio / Foxconn'
      }
    ];
    const links = [];

    this.devices.forEach((d, idx) => {
      if (d.ip === gw) return;
      const nodeId = `dev-${idx}`;
      nodes.push({
        id: nodeId,
        name: d.customName || d.hostname || d.vendor,
        ip: d.ip,
        mac: d.mac,
        category: d.category,
        vendor: d.vendor,
        status: (d.connectionState === 'Reachable' || (d.ping && d.ping !== 'N/A' && d.ping !== 'Timeout')) ? 'ONLINE' : 'IDLE',
        connectionState: d.connectionState || 'Reachable',
        confidence: d.confidence || 'MEDIUM',
        trustLabel: d.trustLabel || (d.isTrusted ? 'Trusted' : 'Unknown'),
        ping: d.ping,
        isTrusted: d.isTrusted,
        isLocal: d.ip === localIp
      });
      links.push({ source: 'router', target: nodeId, latency: d.ping });
    });

    return {
      nodes,
      links,
      devices: this.devices,
      totalDevices: this.devices.length,
      lastUpdated: this.lastSweepTime,
      discoveryNotes: {
        method: 'Asynchronous Subnet Ping Sweep + ARP Cache & Windows Get-NetNeighbor Inspection',
        subnet: snap.network.subnet || '192.168.29.0/24',
        clientIsolationNotice: 'Wi-Fi AP Client Isolation may be active on your router. Stations communicating with external servers remain visible in ARP.',
        limitations: [
          'Power-Save States: Sleeping or standby devices (smart TVs, mobile devices with screen off) power down Wi-Fi transceivers and may drop from active neighbor tables.',
          'Firewall Filtering: Windows Defender Firewall drops incoming ICMP Echo packets by default on standard profiles, causing RTT to display N/A while TCP/ARP remains active.',
          'Private MACs: Modern Android and iOS devices rotate randomized MAC addresses (IEEE 802 locally administered bit set), rated at MEDIUM confidence.'
        ]
      }
    };
  }
}

const digitalTwin = new NetworkDigitalTwin();
module.exports = digitalTwin;
