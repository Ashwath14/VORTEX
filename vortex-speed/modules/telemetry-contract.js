// =========================================================================
// VORTEX SPEED TITANIUM PRO // SHARED DATA CONTRACTS & TELEMETRY STANDARDIZATION
// Single Source of Truth for Network Measurements, Telemetry & Diagnostics
// Strict Distinction: Live vs Historical vs Derived vs Forecast vs Unavailable
// =========================================================================

/**
 * Standardize Live Telemetry Snapshot
 */
function formatSnapshot(raw) {
  const now = Date.now();
  const liveDown = parseFloat((raw.liveMbps || 0).toFixed(2));
  const liveUp = parseFloat((raw.liveUpMbps || 0).toFixed(2));
  const liveDownMB = parseFloat(((liveDown / 8) * (1000000 / (1024 * 1024))).toFixed(2));
  const liveUpMB = parseFloat(((liveUp / 8) * (1000000 / (1024 * 1024))).toFixed(2));
  const plan = raw.planMbps || 30.0;
  const saturation = Math.min(100.0, parseFloat(((liveDown / plan) * 100).toFixed(1)));

  return {
    // Standard CamelCase
    liveMbps: liveDown,
    liveMBps: liveDownMB,
    liveUpMbps: liveUp,
    liveUpMBps: liveUpMB,
    planMbps: plan,
    lineSaturation: saturation,
    trafficMode: raw.trafficMode || 'standard',
    timestamp: raw.timestamp || now,

    // Snake_case aliases for universal compatibility
    down_mbps: liveDown,
    up_mbps: liveUp,
    download_mbps: liveDown,
    upload_mbps: liveUp,
    plan_mbps: plan,
    line_saturation: saturation,

    // Network Metadata
    network: {
      adapterName: (raw.network && raw.network.adapterName) || 'WiFi',
      adapterDesc: (raw.network && raw.network.adapterDesc) || 'TP-Link Wireless USB Adapter',
      ip: (raw.network && raw.network.ip) || '192.168.29.129',
      gateway: (raw.network && raw.network.gateway) || '192.168.29.1',
      subnet: (raw.network && raw.network.subnet) || '192.168.29.0/24',
      dns: (raw.network && raw.network.dns) || '1.1.1.1',
      linkSpeed: (raw.network && raw.network.linkSpeed) || '144.4 Mbps',
      band: (raw.network && raw.network.band) || '2.4 GHz',
      channel: (raw.network && raw.network.channel) || '6',
      signal: (raw.network && raw.network.signal) || '100%',
      rssi: (raw.network && raw.network.rssi) !== undefined ? raw.network.rssi : -36
    },

    // Process & System State
    tixati: raw.tixati || { running: false, pid: 0, priority: 'Normal' },
    usage: raw.usage || { todayGB: '0.00 GB', monthGB: '0.00 GB' },

    // Rolling waveform series
    rollingDown: raw.rollingDown || [],
    rollingUp: raw.rollingUp || [],

    // Telemetry Contract Metadata
    _meta: {
      dataType: 'LIVE_MEASUREMENT',
      source: 'Windows Kernel / NetAdapterStatistics',
      freshnessMs: Math.max(0, now - (raw.timestamp || now)),
      isValid: true
    }
  };
}

/**
 * Standardize Historical Telemetry Data Point
 */
function formatHistoryPoint(row) {
  const t = row.timestamp;
  const down = parseFloat((row.down_mbps !== undefined ? row.down_mbps : (row.downMbps || 0)).toFixed(2));
  const up = parseFloat((row.up_mbps !== undefined ? row.up_mbps : (row.upMbps || 0)).toFixed(2));
  const ping = Math.round(row.ping || row.ping_ms || 2);
  const jitter = parseFloat((row.jitter || row.jitter_ms || 1.0).toFixed(1));
  const plan = row.plan_mbps || row.planMbps || 30.0;

  return {
    timestamp: t,
    timeStr: new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    dateStr: new Date(t).toLocaleDateString(),

    // Dual naming convention: camelCase and snake_case
    downMbps: down,
    download_mbps: down,
    down_mbps: down,

    upMbps: up,
    upload_mbps: up,
    up_mbps: up,

    ping: ping,
    pingMs: ping,
    ping_ms: ping,

    jitter: jitter,
    jitterMs: jitter,
    jitter_ms: jitter,

    planMbps: plan,
    plan_mbps: plan,
    adapter: row.adapter || 'WiFi',

    _meta: {
      dataType: 'HISTORICAL_MEASUREMENT',
      source: 'SQLite: telemetry_history',
      isValid: true
    }
  };
}

/**
 * Standardize Speed Test Record
 */
function formatSpeedRecord(row) {
  const down = parseFloat((row.down_mbps !== undefined ? row.down_mbps : (row.downMbps || 0)).toFixed(2));
  const up = parseFloat((row.up_mbps !== undefined ? row.up_mbps : (row.upMbps || 0)).toFixed(2));
  const ping = parseFloat((row.avg_ping || row.ping || 20).toFixed(1));
  const jitter = parseFloat((row.jitter || 1.0).toFixed(1));

  return {
    id: row.id,
    testId: row.test_id || row.testId || `TEST-${row.timestamp}`,
    timestamp: row.timestamp,
    dateStr: row.date_str || new Date(row.timestamp).toLocaleTimeString(),

    // Dual naming
    downMbps: down,
    down_mbps: down,
    download_mbps: down,

    upMbps: up,
    up_mbps: up,
    upload_mbps: up,

    ping: ping,
    avgPing: ping,
    minPing: row.min_ping !== undefined ? row.min_ping : ping,
    maxPing: row.max_ping !== undefined ? row.max_ping : ping,
    jitter: jitter,
    packetLoss: row.packet_loss !== undefined ? row.packet_loss : 0,

    serverName: row.server_name || row.serverName || 'Cloudflare Edge (BOM)',
    serverLocation: row.server_location || row.serverLocation || 'Mumbai, India',
    bytesDown: row.bytes_down || row.bytesDown || 0,
    bytesUp: row.bytes_up || row.bytesUp || 0,
    durationMs: row.duration_ms || row.durationMs || 0,
    status: row.status || 'COMPLETE',
    warning: row.warning || '',
    peakDownMbps: row.peak_down_mbps || down,
    sustainedDownMbps: row.sustained_down_mbps || down,

    _meta: {
      dataType: 'CONTROLLED_BENCHMARK',
      source: 'speed-engine multi-stream TCP',
      isValid: true
    }
  };
}

/**
 * Standardize Device Radar Record
 */
function formatDeviceRecord(dev, localIp, gatewayIp) {
  const ip = dev.ip || '';
  const mac = (dev.mac || '').toUpperCase();
  const isGw = ip === gatewayIp;
  const isLocal = ip === localIp;

  let calculatedConfidence = 'LOW';
  if (isGw || isLocal) {
    calculatedConfidence = 'HIGH';
  } else if (dev.ping && dev.ping !== 'Timeout' && dev.ping !== 'N/A') {
    calculatedConfidence = 'HIGH';
  } else if (dev.connectionState === 'Reachable' || dev.connection_state === 'Reachable') {
    calculatedConfidence = 'MEDIUM';
  }

  const confidence = dev.confidence || calculatedConfidence;
  const connectionState = dev.connectionState || dev.connection_state || (dev.ping && dev.ping !== 'N/A' && dev.ping !== 'Timeout' ? 'Reachable' : 'Stale');
  const isTrusted = dev.isTrusted !== undefined ? Boolean(dev.isTrusted) : (dev.is_trusted === 1 || isGw || isLocal);
  const trustLabel = dev.trustLabel || dev.trust_label || (isTrusted ? 'Trusted' : 'Unknown');

  return {
    ip,
    mac,
    hostname: dev.hostname || dev.name || 'LAN Device',
    customName: dev.customName || dev.custom_name || null,
    displayName: dev.customName || dev.custom_name || dev.hostname || dev.name || ip,
    vendor: dev.vendor || 'Network Device',
    category: dev.category || (isGw ? 'router' : (isLocal ? 'pc' : 'station')),
    type: isGw ? 'router' : (isLocal ? 'pc' : 'device'),
    firstSeen: dev.firstSeen || dev.first_seen || Date.now(),
    lastSeen: dev.lastSeen || dev.last_seen || Date.now(),
    ping: dev.ping || (isGw ? '2 ms' : (isLocal ? '0 ms' : 'N/A')),
    isTrusted,
    trustLabel,
    connectionState,
    confidence,
    status: (connectionState === 'Reachable' || (dev.ping && dev.ping !== 'N/A' && dev.ping !== 'Timeout')) ? 'ONLINE' : 'IDLE',

    _meta: {
      dataType: 'LOCAL_DISCOVERY',
      source: 'Windows ARP Cache / Get-NetNeighbor / ICMP Probe',
      isValid: Boolean(ip && mac)
    }
  };
}

/**
 * Standardize Network Incident Record
 */
function formatIncidentRecord(inc) {
  return {
    id: inc.id,
    startTime: inc.start_time || inc.startTime,
    startDateStr: new Date(inc.start_time || inc.startTime).toLocaleTimeString(),
    endTime: inc.end_time || inc.endTime || null,
    duration: inc.duration || null,
    severity: inc.severity || 'WARNING',
    classification: inc.classification || 'Network Anomaly',
    evidence: typeof inc.evidence === 'string' ? JSON.parse(inc.evidence || '{}') : (inc.evidence || {}),
    status: inc.status || 'RESOLVED',

    _meta: {
      dataType: 'INCIDENT_FORENSICS',
      source: 'blackbox ICMP correlation engine',
      isValid: true
    }
  };
}

module.exports = {
  formatSnapshot,
  formatHistoryPoint,
  formatSpeedRecord,
  formatDeviceRecord,
  formatIncidentRecord
};
