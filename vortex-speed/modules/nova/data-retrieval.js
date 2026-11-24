// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: DATA RETRIEVAL LAYER
// Genuine SQLite Query Engine & Telemetry Aggregator
// Zero Synthetic Data — Defensive Handling of Sparse Samples
// =========================================================================

const { getDb } = require('../../database/db');
const telemetryService = require('../telemetry');

class DataRetrievalLayer {
  constructor() {}

  // 1. Retrieve N Latest Completed Speed Tests
  getRecentSpeedTests(limit = 5) {
    const db = getDb();
    const safeLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 5));

    try {
      const tests = db.prepare(`
        SELECT id, timestamp, down_mbps, up_mbps, ping, jitter, min_ping, avg_ping, max_ping,
               packet_loss, bytes_down, bytes_up, duration_ms, server_name, server_location, status
        FROM speed_tests
        WHERE status = 'COMPLETE'
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(safeLimit);

      const totalCompletedRow = db.prepare("SELECT count(*) as c FROM speed_tests WHERE status = 'COMPLETE'").get();
      const totalAllRow = db.prepare("SELECT count(*) as c FROM speed_tests").get();

      return {
        hasData: tests.length > 0,
        sampleCount: tests.length,
        totalCompletedInDb: totalCompletedRow ? totalCompletedRow.c : 0,
        totalAttemptsInDb: totalAllRow ? totalAllRow.c : 0,
        tests
      };
    } catch (err) {
      return {
        hasData: false,
        sampleCount: 0,
        error: err.message,
        tests: []
      };
    }
  }

  // 2. Hourly Telemetry Aggregation for Congestion Detection (00:00 to 23:00)
  getHourlyTelemetryAggregation(days = 7) {
    const db = getDb();
    const cutoff = Date.now() - (days * 86400 * 1000);

    try {
      const rows = db.prepare(`
        SELECT 
          CAST(strftime('%H', timestamp / 1000, 'unixepoch', 'localtime') AS INTEGER) as hour,
          count(*) as samples,
          round(avg(down_mbps), 2) as avg_down,
          round(avg(up_mbps), 2) as avg_up,
          round(avg(ping), 2) as avg_ping,
          round(min(ping), 2) as min_ping,
          round(max(ping), 2) as max_ping,
          round(avg(jitter), 2) as avg_jitter
        FROM telemetry_history
        WHERE timestamp >= ?
        GROUP BY hour
        ORDER BY hour ASC
      `).all(cutoff);

      const totalRows = db.prepare("SELECT count(*) as c FROM telemetry_history WHERE timestamp >= ?").get(cutoff);

      return {
        hasData: rows.length > 0,
        windowDays: days,
        totalSamples: totalRows ? totalRows.c : 0,
        hourlyBuckets: rows
      };
    } catch (err) {
      return {
        hasData: false,
        totalSamples: 0,
        error: err.message,
        hourlyBuckets: []
      };
    }
  }

  // 3. Network DNA Baseline Extraction
  getDnaBaselines() {
    const db = getDb();
    try {
      const baselines = db.prepare(`
        SELECT hour_of_day, day_type, sample_count, avg_down_mbps, std_down_mbps,
               min_down_mbps, max_down_mbps, median_down_mbps, avg_up_mbps,
               avg_ping_ms, std_ping_ms, avg_jitter_ms, iqr_down_mbps
        FROM network_dna_baselines
        ORDER BY hour_of_day ASC
      `).all();

      return {
        hasData: baselines.length > 0,
        count: baselines.length,
        baselines
      };
    } catch (err) {
      return { hasData: false, count: 0, error: err.message, baselines: [] };
    }
  }

  // 4. Live Telemetry & Network Adapter Snapshot
  getLiveSnapshot() {
    try {
      return telemetryService.getSnapshot();
    } catch (e) {
      return null;
    }
  }

  // 5. Active LAN Devices
  getDiscoveredDevices() {
    const db = getDb();
    try {
      const devices = db.prepare(`
        SELECT mac, ip, hostname, vendor, category, first_seen, last_seen, ping,
               is_trusted, custom_name, connection_state, confidence, trust_label
        FROM device_records
        ORDER BY last_seen DESC
      `).all();

      return {
        hasData: devices.length > 0,
        count: devices.length,
        devices
      };
    } catch (err) {
      return { hasData: false, count: 0, error: err.message, devices: [] };
    }
  }

  // 6. Network Incidents & Black Box Events
  getRecentIncidents(limit = 10) {
    const db = getDb();
    try {
      const incidents = db.prepare(`
        SELECT id, start_time, end_time, duration, severity, classification, evidence, status
        FROM network_incidents
        ORDER BY start_time DESC
        LIMIT ?
      `).all(limit);

      const count = db.prepare("SELECT count(*) as c FROM network_incidents").get();

      return {
        hasData: incidents.length > 0,
        count: incidents.length,
        totalInDb: count ? count.c : 0,
        incidents
      };
    } catch (err) {
      return { hasData: false, count: 0, error: err.message, incidents: [] };
    }
  }

  // 7. Bufferbloat Records
  getBufferbloatRecords(limit = 3) {
    const db = getDb();
    try {
      const records = db.prepare(`
        SELECT id, timestamp, test_mode, idle_ping_ms, down_ping_ms, up_ping_ms,
               delta_down_ms, delta_up_ms, max_delta_ms, jitter_ms, packet_loss_pct,
               down_mbps, up_mbps, grade, sqm_down_mbps, sqm_up_mbps, recommendation, status
        FROM bufferbloat_records
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);

      return {
        hasData: records.length > 0,
        latest: records[0] || null,
        records
      };
    } catch (err) {
      return { hasData: false, latest: null, records: [] };
    }
  }

  // 8. Gaming Sessions
  getGamingSessions(limit = 5) {
    const db = getDb();
    try {
      const sessions = db.prepare(`
        SELECT id, game_name, start_time, end_time, avg_ping, max_ping, min_ping, jitter, packet_loss, status
        FROM gaming_sessions
        ORDER BY start_time DESC
        LIMIT ?
      `).all(limit);

      return {
        hasData: sessions.length > 0,
        sessions
      };
    } catch (err) {
      return { hasData: false, sessions: [] };
    }
  }

  // 9. Route History
  getRouteHistory(limit = 3) {
    const db = getDb();
    try {
      const routes = db.prepare(`
        SELECT id, timestamp, destination, target_ip, hop_count, hops_json, total_rtt_ms, route_fingerprint, has_changed, status
        FROM route_history
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);

      return {
        hasData: routes.length > 0,
        routes
      };
    } catch (err) {
      return { hasData: false, routes: [] };
    }
  }
}

module.exports = new DataRetrievalLayer();
