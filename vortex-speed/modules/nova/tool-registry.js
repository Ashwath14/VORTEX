// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: TOOL REGISTRY
// Explicit Integration Registry of all 16 Network Diagnostics Modules
// Strict Data Schema, Error Handling & Availability Tracking
// =========================================================================

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerAllTools();
  }

  registerTool(toolDef) {
    if (!toolDef.id || !toolDef.name || !toolDef.execute) {
      throw new Error(`Invalid tool definition: missing id, name or execute handler.`);
    }
    this.tools.set(toolDef.id, {
      id: toolDef.id,
      name: toolDef.name,
      category: toolDef.category || 'DIAGNOSTICS',
      description: toolDef.description || '',
      supportedInputs: toolDef.supportedInputs || [],
      dataSource: toolDef.dataSource || 'SQLITE_OR_MEMORY',
      returnSchema: toolDef.returnSchema || {},
      isAvailable: toolDef.isAvailable || (() => true),
      execute: toolDef.execute
    });
  }

  getTool(id) {
    return this.tools.get(id) || null;
  }

  listTools() {
    const list = [];
    for (const [id, tool] of this.tools.entries()) {
      let available = false;
      let error = null;
      try {
        available = Boolean(tool.isAvailable());
      } catch (e) {
        error = e.message;
      }
      list.push({
        id,
        name: tool.name,
        category: tool.category,
        description: tool.description,
        supportedInputs: tool.supportedInputs,
        dataSource: tool.dataSource,
        available,
        error
      });
    }
    return list;
  }

  async invoke(id, params = {}) {
    const tool = this.getTool(id);
    if (!tool) {
      return {
        success: false,
        available: false,
        error: `Tool '${id}' is not registered in the NOVA Tool Registry.`,
        data: null
      };
    }

    try {
      const isAvail = tool.isAvailable();
      if (!isAvail) {
        return {
          success: false,
          available: false,
          error: `Tool '${tool.name}' is currently unavailable (prerequisites or hardware missing).`,
          data: null
        };
      }

      const result = await tool.execute(params);
      return {
        success: true,
        available: true,
        data: result,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        available: true,
        error: `Execution error in tool '${tool.name}': ${err.message}`,
        data: null
      };
    }
  }

  registerAllTools() {
    // Lazy module references to prevent circular require
    const getTelemetry = () => require('../telemetry');
    const getDb = () => require('../../database/db').getDb();
    const getSpeedEngine = () => require('../speed-engine');
    const getNetworkDna = () => require('../network-dna');
    const getTimeMachine = () => require('../time-machine');
    const getBlackbox = () => require('../blackbox');
    const getWifi = () => require('../wifi-intelligence');
    const getDigitalTwin = () => require('../digital-twin');
    const getGuardian = () => require('../bandwidth-guardian');
    const getGaming = () => require('../gaming');
    const getBufferbloat = () => require('../bufferbloat');
    const getRouteVision = () => require('../route-vision');
    const getPrediction = () => require('../prediction');
    const getIsp = () => require('../isp-intelligence');
    const getAutopilot = () => require('../autopilot');
    const getHealthManager = () => require('../health-manager');
    const getBackupManager = () => require('../backup-manager');

    // 1. Live Telemetry
    this.registerTool({
      id: 'live_telemetry',
      name: 'Live Telemetry Engine',
      category: 'MONITORING',
      description: 'Retrieves instantaneous adapter throughput, gateway RTT, public DNS RTT, link rate, and Wi-Fi signal.',
      supportedInputs: [],
      dataSource: 'telemetryService.getSnapshot() & Windows NetAdapter counters',
      returnSchema: { liveMbps: 'number', liveUpMbps: 'number', ping: 'number', network: 'object' },
      isAvailable: () => Boolean(getTelemetry().getSnapshot),
      execute: async () => getTelemetry().getSnapshot()
    });

    // 2. Speed Diagnostics (Active Engine)
    this.registerTool({
      id: 'speed_diagnostics_active',
      name: 'Speed Test Engine Status',
      category: 'DIAGNOSTICS',
      description: 'Checks current multi-stream speed test engine state (phase, progress, live speeds, error watchdogs).',
      supportedInputs: [],
      dataSource: 'SpeedEngine instance in memory',
      returnSchema: { isRunning: 'boolean', phase: 'string', progress: 'number', liveMbps: 'number' },
      isAvailable: () => Boolean(getSpeedEngine().getStatus),
      execute: async () => getSpeedEngine().getStatus()
    });

    // 3. Speed Test History (SQLite speed_tests)
    this.registerTool({
      id: 'speed_test_history',
      name: 'Historical Speed Tests Archive',
      category: 'DATABASE',
      description: 'Queries verified completed speed tests from SQLite with duration, payload bytes, ping, and server location.',
      supportedInputs: [{ name: 'limit', type: 'number', default: 5 }, { name: 'status', type: 'string', default: 'COMPLETE' }],
      dataSource: 'SQLite table speed_tests',
      returnSchema: { tests: 'array', totalCompleted: 'number' },
      isAvailable: () => {
        try {
          const db = getDb();
          return Boolean(db.prepare("SELECT count(*) as c FROM speed_tests").get());
        } catch(e) { return false; }
      },
      execute: async ({ limit = 5, status = 'COMPLETE' } = {}) => {
        const db = getDb();
        const safeLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 5));
        const tests = db.prepare(`
          SELECT id, timestamp, down_mbps, up_mbps, ping, jitter, min_ping, avg_ping, max_ping,
                 packet_loss, bytes_down, bytes_up, duration_ms, server_name, server_location, status
          FROM speed_tests
          WHERE status = ?
          ORDER BY timestamp DESC
          LIMIT ?
        `).all(status, safeLimit);
        const countRow = db.prepare("SELECT count(*) as c FROM speed_tests WHERE status = ?").get(status);
        return { tests, totalCompleted: countRow ? countRow.c : 0, limit: safeLimit };
      }
    });

    // 4. Network DNA (Statistical Baselines)
    this.registerTool({
      id: 'network_dna',
      name: 'Network DNA Statistical Fingerprint',
      category: 'MACHINE_LEARNING',
      description: 'Provides 24-hour hour-by-hour baseline distributions (mean, stdDev, IQR, percentiles) and live anomaly detection.',
      supportedInputs: [{ name: 'hour', type: 'number', optional: true }],
      dataSource: 'SQLite table network_dna_baselines & NetworkDNA engine',
      returnSchema: { status: 'string', baseline: 'object', anomaly: 'object', recurringPatterns: 'object' },
      isAvailable: () => Boolean(getNetworkDna().getCurrentFingerprint),
      execute: async ({ hour } = {}) => {
        const dna = getNetworkDna();
        const fingerprint = dna.getCurrentFingerprint();
        if (hour !== undefined && hour !== null) {
          const db = getDb();
          const targetHour = parseInt(hour, 10);
          const row = db.prepare("SELECT * FROM network_dna_baselines WHERE hour_of_day = ? ORDER BY sample_count DESC LIMIT 1").get(targetHour);
          return { fingerprint, specificHourBaseline: row || null };
        }
        return fingerprint;
      }
    });

    // 5. Network Time Machine (Historical Telemetry & Incident Scrubbing)
    this.registerTool({
      id: 'time_machine',
      name: 'Network Time Machine',
      category: 'HISTORICAL',
      description: 'Queries telemetry_history across rolling time windows (hours or days) and extracts min/max/avg trends.',
      supportedInputs: [{ name: 'hours', type: 'number', default: 24 }],
      dataSource: 'SQLite table telemetry_history',
      returnSchema: { sampleCount: 'number', avgDown: 'number', avgUp: 'number', avgPing: 'number', avgJitter: 'number' },
      isAvailable: () => {
        try {
          return Boolean(getDb().prepare("SELECT count(*) as c FROM telemetry_history").get());
        } catch(e) { return false; }
      },
      execute: async ({ hours = 24 } = {}) => {
        const db = getDb();
        const cutoff = Date.now() - (hours * 3600 * 1000);
        const stats = db.prepare(`
          SELECT 
            count(*) as sampleCount,
            round(avg(down_mbps), 2) as avgDown,
            round(avg(up_mbps), 2) as avgUp,
            round(avg(ping), 2) as avgPing,
            round(max(ping), 2) as peakPing,
            round(min(ping), 2) as minPing,
            round(avg(jitter), 2) as avgJitter,
            round(max(down_mbps), 2) as peakDown
          FROM telemetry_history
          WHERE timestamp >= ?
        `).get(cutoff);
        return { windowHours: hours, ...stats };
      }
    });

    // 6. Internet Black Box (Incident Recorder)
    this.registerTool({
      id: 'blackbox',
      name: 'Internet Black Box Flight Recorder',
      category: 'INCIDENTS',
      description: 'Records network disruptions, drops, packet loss events, and critical outages with duration and root cause classification.',
      supportedInputs: [{ name: 'limit', type: 'number', default: 10 }],
      dataSource: 'SQLite table network_incidents',
      returnSchema: { incidents: 'array', totalIncidents: 'number' },
      isAvailable: () => {
        try {
          return Boolean(getDb().prepare("SELECT count(*) as c FROM network_incidents").get());
        } catch(e) { return false; }
      },
      execute: async ({ limit = 10 } = {}) => {
        const db = getDb();
        const rows = db.prepare(`
          SELECT id, start_time, end_time, duration, severity, classification, evidence, status
          FROM network_incidents
          ORDER BY start_time DESC
          LIMIT ?
        `).all(limit);
        const total = db.prepare("SELECT count(*) as c FROM network_incidents").get().c;
        return { incidents: rows, totalIncidents: total };
      }
    });

    // 7. Wi-Fi Intelligence (Spectrum & Signal Audit)
    this.registerTool({
      id: 'wifi_intelligence',
      name: 'Wi-Fi Intelligence Lab',
      category: 'WIRELESS',
      description: 'Performs WLAN scan of nearby BSSIDs, channel overlaps, co-channel interference score, and RF signal strength.',
      supportedInputs: [],
      dataSource: 'Windows netsh wlan & WiFiIntelligenceEngine',
      returnSchema: { current: 'object', nearby: 'array', spectrum: 'object' },
      isAvailable: () => {
        try {
          const w = getWifi();
          return Boolean(w && (w.getData || w.currentInterface));
        } catch(e) { return false; }
      },
      execute: async () => {
        const wifi = getWifi();
        return wifi.getData ? wifi.getData() : { current: wifi.currentInterface, spectrum: wifi.spectrumAnalysis };
      }
    });

    // 8. Device Radar (Digital Twin / LAN Topology)
    this.registerTool({
      id: 'device_radar',
      name: 'Device Radar & Digital Twin',
      category: 'LOCAL_NETWORK',
      description: 'Discovers active stations on the local subnet via ARP and Get-NetNeighbor with MAC vendor resolution and confidence.',
      supportedInputs: [],
      dataSource: 'SQLite table device_records & DigitalTwin engine',
      returnSchema: { devices: 'array', count: 'number', trustedCount: 'number' },
      isAvailable: () => Boolean(getDigitalTwin().getTopology),
      execute: async () => {
        const topo = getDigitalTwin().getTopology();
        const db = getDb();
        const records = db.prepare("SELECT * FROM device_records ORDER BY last_seen DESC").all();
        return {
          topology: topo,
          devices: records,
          count: records.length,
          trustedCount: records.filter(d => d.is_trusted === 1 || d.trust_label === 'TRUSTED').length
        };
      }
    });

    // 9. Bandwidth Guardian (Process Monitor)
    this.registerTool({
      id: 'bandwidth_guardian',
      name: 'Bandwidth Guardian & Process Hogs',
      category: 'PROCESS_INSPECTION',
      description: 'Inspects Windows running processes and active network sockets to isolate high-throughput background applications.',
      supportedInputs: [],
      dataSource: 'BandwidthGuardian engine (netstat / process sampling)',
      returnSchema: { topProcesses: 'array', totalEstimatedMbps: 'number' },
      isAvailable: () => Boolean(getGuardian().getDashboardData),
      execute: async () => getGuardian().getDashboardData()
    });

    // 10. Gaming Intelligence
    this.registerTool({
      id: 'gaming_intelligence',
      name: 'Gaming Latency & Jitter Engine',
      category: 'GAMING',
      description: 'Audits latency, jitter, and packet loss for gaming servers with competitive gameplay grading.',
      supportedInputs: [],
      dataSource: 'SQLite table gaming_sessions & GamingEngine',
      returnSchema: { state: 'object', recentSessions: 'array' },
      isAvailable: () => Boolean(getGaming().getState),
      execute: async () => {
        const g = getGaming();
        const state = g.getState ? g.getState() : {};
        const sessions = g.getRecentSessions ? g.getRecentSessions() : [];
        return { state, recentSessions: sessions };
      }
    });

    // 11. Bufferbloat Autopsy
    this.registerTool({
      id: 'bufferbloat_autopsy',
      name: 'Bufferbloat Loaded Latency Diagnostic',
      category: 'DIAGNOSTICS',
      description: 'Analyzes bufferbloat test records comparing unloaded base RTT with loaded download/upload RTT deltas.',
      supportedInputs: [{ name: 'limit', type: 'number', default: 3 }],
      dataSource: 'SQLite table bufferbloat_records & BufferbloatEngine',
      returnSchema: { latest: 'object', history: 'array' },
      isAvailable: () => {
        try {
          return Boolean(getDb().prepare("SELECT count(*) as c FROM bufferbloat_records").get());
        } catch(e) { return false; }
      },
      execute: async ({ limit = 3 } = {}) => {
        const db = getDb();
        const rows = db.prepare(`
          SELECT id, timestamp, test_mode, idle_ping_ms, down_ping_ms, up_ping_ms,
                 delta_down_ms, delta_up_ms, max_delta_ms, jitter_ms, packet_loss_pct,
                 down_mbps, up_mbps, grade, recommendation, status
          FROM bufferbloat_records
          ORDER BY timestamp DESC
          LIMIT ?
        `).all(limit);
        return { latest: rows[0] || null, history: rows };
      }
    });

    // 12. Internet Route Vision (Hop Tracer)
    this.registerTool({
      id: 'route_vision',
      name: 'Internet Route Vision',
      category: 'TRANSIT',
      description: 'Audits multi-hop network paths, external routing changes, and hop-by-hop latency spikes to cloud sinks.',
      supportedInputs: [],
      dataSource: 'SQLite table route_history & RouteVisionEngine',
      returnSchema: { status: 'object', history: 'array' },
      isAvailable: () => Boolean(getRouteVision().getStatus),
      execute: async () => {
        const rv = getRouteVision();
        const status = rv.getStatus ? rv.getStatus() : {};
        const history = rv.getHistory ? rv.getHistory(3) : [];
        return { status, history };
      }
    });

    // 13. Bandwidth Prediction
    this.registerTool({
      id: 'bandwidth_prediction',
      name: 'Bandwidth Prediction & Forecasting',
      category: 'PREDICTION',
      description: 'Predicts throughput patterns and data consumption trends for upcoming hours based on statistical history.',
      supportedInputs: [],
      dataSource: 'PredictionEngine & daily_health_summaries',
      returnSchema: { predictions: 'object' },
      isAvailable: () => {
        try {
          const p = getPrediction();
          return Boolean(p && (p.getPredictions || typeof p === 'object'));
        } catch(e) { return false; }
      },
      execute: async () => {
        const p = getPrediction();
        return p.getPredictions ? p.getPredictions(60) : {};
      }
    });

    // 14. ISP Intelligence (SLA Compliance)
    this.registerTool({
      id: 'isp_intelligence',
      name: 'ISP SLA Auditor',
      category: 'AUDIT',
      description: 'Compares advertised subscription plan bandwidth against actual delivered speeds and baseline fulfillment ratios.',
      supportedInputs: [],
      dataSource: 'IspIntelligenceEngine & Telemetry Snapshot',
      returnSchema: { score: 'object', compliance: 'boolean' },
      isAvailable: () => Boolean(getIsp().calculateScore),
      execute: async () => {
        const isp = getIsp();
        return isp.calculateScore ? isp.calculateScore() : null;
      }
    });

    // 15. Network Autopilot
    this.registerTool({
      id: 'autopilot',
      name: 'Network Autopilot Optimization',
      category: 'AUTOMATION',
      description: 'Audits autonomous TCP/IP stack tuning, DNS auto-switch, and multimedia timer optimizations with rollback capability.',
      supportedInputs: [],
      dataSource: 'SQLite table autopilot_audit_log & AutopilotEngine',
      returnSchema: { state: 'object', auditLogs: 'array' },
      isAvailable: () => Boolean(getAutopilot().getState),
      execute: async () => {
        const ap = getAutopilot();
        const state = ap.getState ? ap.getState() : {};
        const logs = ap.getAuditLogs ? ap.getAuditLogs(5) : [];
        return { state, recentLogs: logs };
      }
    });

    // 16. Application Health Manager
    this.registerTool({
      id: 'health_manager',
      name: 'Application Self-Healing & Health Manager',
      category: 'SYSTEM',
      description: 'Monitors backend services, process RSS memory, SQLite WAL integrity, and automated recovery actions.',
      supportedInputs: [],
      dataSource: 'HealthManager engine & SQLite PRAGMA quick_check',
      returnSchema: { report: 'object', isHealthy: 'boolean' },
      isAvailable: () => Boolean(getHealthManager().getDiagnosticReport),
      execute: async () => {
        const hm = getHealthManager();
        return hm.getDiagnosticReport ? hm.getDiagnosticReport() : { healthy: true };
      }
    });
  }
}

module.exports = new ToolRegistry();
