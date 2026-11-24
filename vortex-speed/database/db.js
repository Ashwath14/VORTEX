const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const SETTINGS = require('../config/settings');

let db = null;

function initDatabase() {
  if (db) return db;

  db = new DatabaseSync(SETTINGS.DB_PATH);

  // Enable WAL mode & foreign keys for high performance
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');

  // Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS telemetry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      down_mbps REAL NOT NULL,
      up_mbps REAL NOT NULL,
      ping REAL,
      jitter REAL,
      plan_mbps REAL,
      adapter TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry_history(timestamp);

    CREATE TABLE IF NOT EXISTS network_incidents (
      id TEXT PRIMARY KEY,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration REAL,
      severity TEXT NOT NULL,
      classification TEXT NOT NULL,
      evidence TEXT NOT NULL,
      status TEXT DEFAULT 'RESOLVED'
    );
    CREATE INDEX IF NOT EXISTS idx_incident_start ON network_incidents(start_time);

    CREATE TABLE IF NOT EXISTS speed_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      down_mbps REAL NOT NULL,
      up_mbps REAL NOT NULL,
      ping REAL NOT NULL,
      jitter REAL NOT NULL,
      plan_mbps REAL NOT NULL,
      date_str TEXT,
      test_id TEXT,
      server_name TEXT,
      server_location TEXT,
      min_ping REAL,
      avg_ping REAL,
      max_ping REAL,
      packet_loss REAL DEFAULT 0,
      bytes_down INTEGER DEFAULT 0,
      bytes_up INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'COMPLETE',
      warning TEXT,
      peak_down_mbps REAL DEFAULT 0,
      sustained_down_mbps REAL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_tests_time ON speed_tests(timestamp);

    CREATE TABLE IF NOT EXISTS device_records (
      mac TEXT PRIMARY KEY,
      ip TEXT NOT NULL,
      hostname TEXT,
      vendor TEXT,
      category TEXT,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      ping TEXT,
      is_trusted INTEGER DEFAULT 1,
      custom_name TEXT
    );

    CREATE TABLE IF NOT EXISTS gaming_sessions (
      id TEXT PRIMARY KEY,
      game_name TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      avg_ping REAL,
      max_ping REAL,
      min_ping REAL,
      jitter REAL,
      packet_loss REAL,
      status TEXT DEFAULT 'ACTIVE'
    );

    CREATE TABLE IF NOT EXISTS process_traffic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      pid INTEGER NOT NULL,
      name TEXT NOT NULL,
      connections INTEGER NOT NULL,
      est_mbps REAL
    );
    CREATE INDEX IF NOT EXISTS idx_proc_time ON process_traffic(timestamp);

    CREATE TABLE IF NOT EXISTS nova_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      level TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_taken TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_nova_time ON nova_events(timestamp);

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS network_dna_baselines (
      hour_of_day INTEGER NOT NULL,
      day_type TEXT NOT NULL,
      sample_count INTEGER DEFAULT 0,
      avg_down_mbps REAL DEFAULT 0,
      std_down_mbps REAL DEFAULT 0,
      min_down_mbps REAL DEFAULT 0,
      max_down_mbps REAL DEFAULT 0,
      median_down_mbps REAL DEFAULT 0,
      avg_up_mbps REAL DEFAULT 0,
      std_up_mbps REAL DEFAULT 0,
      avg_ping_ms REAL DEFAULT 0,
      std_ping_ms REAL DEFAULT 0,
      avg_jitter_ms REAL DEFAULT 0,
      last_updated INTEGER,
      PRIMARY KEY (hour_of_day, day_type)
    );

    CREATE TABLE IF NOT EXISTS bufferbloat_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      test_mode TEXT NOT NULL,
      idle_ping_ms REAL NOT NULL,
      down_ping_ms REAL NOT NULL,
      up_ping_ms REAL NOT NULL,
      delta_down_ms REAL NOT NULL,
      delta_up_ms REAL NOT NULL,
      max_delta_ms REAL NOT NULL,
      jitter_ms REAL NOT NULL,
      packet_loss_pct REAL NOT NULL,
      down_mbps REAL NOT NULL,
      up_mbps REAL NOT NULL,
      grade TEXT NOT NULL,
      sqm_down_mbps REAL NOT NULL,
      sqm_up_mbps REAL NOT NULL,
      recommendation TEXT NOT NULL,
      status TEXT DEFAULT 'COMPLETED'
    );
    CREATE INDEX IF NOT EXISTS idx_bb_time ON bufferbloat_records(timestamp);

    CREATE TABLE IF NOT EXISTS route_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      destination TEXT NOT NULL,
      target_ip TEXT NOT NULL,
      hop_count INTEGER NOT NULL,
      hops_json TEXT NOT NULL,
      total_rtt_ms REAL NOT NULL,
      route_fingerprint TEXT NOT NULL,
      has_changed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'COMPLETED'
    );
    CREATE INDEX IF NOT EXISTS idx_route_dest ON route_history(destination, timestamp);

    CREATE TABLE IF NOT EXISTS autopilot_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      mode TEXT NOT NULL,
      action_key TEXT NOT NULL,
      trigger_reason TEXT NOT NULL,
      previous_state TEXT,
      new_state TEXT,
      status TEXT NOT NULL,
      auto_rollback_time INTEGER,
      rolled_back_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_audit_time ON autopilot_audit_log(timestamp);

    CREATE TABLE IF NOT EXISTS autopilot_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_health_summaries (
      date_str TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      uptime_pct REAL DEFAULT 100.0,
      avg_down_mbps REAL,
      avg_up_mbps REAL,
      avg_ping_ms REAL,
      peak_ping_ms REAL,
      total_incidents INTEGER DEFAULT 0,
      bufferbloat_grade TEXT,
      health_score INTEGER,
      summary_text TEXT
    );

    CREATE TABLE IF NOT EXISTS weekly_health_summaries (
      week_str TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      avg_health_score INTEGER,
      uptime_pct REAL,
      repeated_incidents INTEGER,
      summary_text TEXT
    );
  `);

  // Safe schema migrations for existing speed_tests table
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN test_id TEXT;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN server_name TEXT;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN server_location TEXT;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN min_ping REAL;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN avg_ping REAL;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN max_ping REAL;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN packet_loss REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN bytes_down INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN bytes_up INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN duration_ms INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN status TEXT DEFAULT "COMPLETE";'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN warning TEXT;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN peak_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE speed_tests ADD COLUMN sustained_down_mbps REAL DEFAULT 0;'); } catch(e) {}

  // Safe schema migrations for telemetry_history table
  try { db.exec('ALTER TABLE telemetry_history ADD COLUMN signal_pct REAL;'); } catch(e) {}
  try { db.exec('ALTER TABLE telemetry_history ADD COLUMN link_speed_mbps REAL;'); } catch(e) {}
  try { db.exec('ALTER TABLE telemetry_history ADD COLUMN public_ping REAL;'); } catch(e) {}
  try { db.exec('ALTER TABLE telemetry_history ADD COLUMN packet_loss REAL DEFAULT 0;'); } catch(e) {}

  // Safe schema migrations for network_dna_baselines table
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN var_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN iqr_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN p25_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN p75_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN p90_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN p95_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN p99_down_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN median_up_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN var_up_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN iqr_up_mbps REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN median_ping_ms REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN var_ping_ms REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN iqr_ping_ms REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN p90_ping_ms REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN avg_signal_pct REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN median_signal_pct REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN std_signal_pct REAL DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN sample_count_down INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN sample_count_up INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN sample_count_ping INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN sample_count_jitter INTEGER DEFAULT 0;'); } catch(e) {}
  try { db.exec('ALTER TABLE network_dna_baselines ADD COLUMN sample_count_signal INTEGER DEFAULT 0;'); } catch(e) {}

  // Safe schema migrations for device_records table
  try { db.exec("ALTER TABLE device_records ADD COLUMN connection_state TEXT DEFAULT 'Reachable';"); } catch(e) {}
  try { db.exec("ALTER TABLE device_records ADD COLUMN confidence TEXT DEFAULT 'MEDIUM';"); } catch(e) {}
  try { db.exec("ALTER TABLE device_records ADD COLUMN trust_label TEXT DEFAULT 'Unknown';"); } catch(e) {}

  // Migrate existing test_history.json if present
  try {
    if (fs.existsSync(SETTINGS.HISTORY_FILE)) {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM speed_tests');
      const row = countStmt.get();
      if (row.count === 0) {
        const rawHistory = JSON.parse(fs.readFileSync(SETTINGS.HISTORY_FILE, 'utf8'));
        if (Array.isArray(rawHistory)) {
          const insertStmt = db.prepare(`
            INSERT INTO speed_tests (timestamp, down_mbps, up_mbps, ping, jitter, plan_mbps, date_str)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const item of rawHistory) {
            insertStmt.run(
              item.timestamp || Date.now(),
              item.downMbps || 33.3,
              item.upMbps || 9.2,
              item.ping || 16,
              item.jitter || 1.2,
              30.0,
              item.dateStr || new Date().toLocaleTimeString()
            );
          }
          console.log(`[DB] Migrated ${rawHistory.length} historical speed test records to SQLite.`);
        }
      }
    }
  } catch (err) {
    console.error('[DB] Migration error for history:', err.message);
  }

  return db;
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

function closeDatabase() {
  if (db) {
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      db.close();
      db = null;
      console.log('[DB] SQLite database checkpointed and closed cleanly.');
    } catch (e) {
      console.error('[DB] Close error:', e.message);
    }
  }
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase
};
