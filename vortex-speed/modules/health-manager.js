// =========================================================================
// VORTEX SPEED TITANIUM PRO — CENTRALIZED APPLICATION HEALTH & RECOVERY MANAGER
// =========================================================================

const os = require('os');
const { getDb } = require('../database/db');

class HealthManager {
  constructor() {
    this.startTime = Date.now();
    this.services = {
      backend: { status: 'HEALTHY', lastCheck: Date.now(), errorCount: 0, recoveries: 0 },
      database: { status: 'HEALTHY', lastCheck: Date.now(), errorCount: 0, recoveries: 0 },
      telemetry: { status: 'HEALTHY', lastCheck: Date.now(), errorCount: 0, recoveries: 0 },
      speedEngine: { status: 'HEALTHY', lastCheck: Date.now(), errorCount: 0, recoveries: 0 }
    };

    this.errorLog = [];
    this.recoveryLog = [];
    this.recoveryAttempts = {}; // Keyed by service: array of timestamps
    this.maxRecoveriesPerWindow = 3;
    this.recoveryWindowMs = 10 * 60 * 1000; // 10 minutes

    // Start background health monitor loop (every 5 seconds)
    this.monitorInterval = setInterval(() => this.runHealthSweep(), 5000);
  }

  // Record an application-level error
  recordError(service, message, details = null) {
    const errorEntry = {
      id: `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: Date.now(),
      service,
      message,
      details,
      recovered: false
    };

    this.errorLog.unshift(errorEntry);
    if (this.errorLog.length > 50) this.errorLog.pop();

    if (this.services[service]) {
      this.services[service].errorCount++;
    }

    console.warn(`[HealthManager] Warning recorded for [${service}]: ${message}`);
    return errorEntry;
  }

  // Can service attempt recovery without entering a loop?
  canAttemptRecovery(service) {
    const now = Date.now();
    if (!this.recoveryAttempts[service]) {
      this.recoveryAttempts[service] = [];
    }
    // Filter attempts within the recovery window
    this.recoveryAttempts[service] = this.recoveryAttempts[service].filter(t => now - t < this.recoveryWindowMs);

    if (this.recoveryAttempts[service].length >= this.maxRecoveriesPerWindow) {
      console.error(`[HealthManager] Recovery limit reached for [${service}] (${this.maxRecoveriesPerWindow} in 10m). Halting auto-restart to prevent restart loop.`);
      return false;
    }
    return true;
  }

  // Record recovery attempt
  logRecovery(service, action, success, notes = '') {
    const entry = {
      id: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: Date.now(),
      service,
      action,
      success,
      notes
    };

    this.recoveryLog.unshift(entry);
    if (this.recoveryLog.length > 30) this.recoveryLog.pop();

    if (!this.recoveryAttempts[service]) this.recoveryAttempts[service] = [];
    this.recoveryAttempts[service].push(Date.now());

    if (this.services[service]) {
      this.services[service].recoveries++;
      if (success) {
        this.services[service].status = 'HEALTHY';
      } else {
        this.services[service].status = 'DEGRADED';
      }
    }

    console.log(`[HealthManager] Recovery [${service}] -> Action: ${action} | Success: ${success}`);
    return entry;
  }

  // Check database health
  checkDatabase() {
    try {
      const db = getDb();
      const row = db.prepare('SELECT 1 as alive').get();
      if (row && row.alive === 1) {
        this.services.database.status = 'HEALTHY';
        this.services.database.lastCheck = Date.now();
        return true;
      }
      throw new Error('Database query returned unexpected result.');
    } catch (e) {
      this.services.database.status = 'UNHEALTHY';
      this.recordError('database', e.message);
      this.attemptDatabaseRecovery(e.message);
      return false;
    }
  }

  attemptDatabaseRecovery(reason) {
    if (!this.canAttemptRecovery('database')) return;
    try {
      console.log(`[HealthManager] Attempting safe SQLite recovery due to: ${reason}`);
      const db = getDb();
      db.exec('PRAGMA wal_checkpoint(RESTART);');
      const verify = db.prepare('PRAGMA quick_check;').get();
      const ok = verify && (verify.quick_check === 'ok' || Object.values(verify)[0] === 'ok');
      this.logRecovery('database', 'WAL Checkpoint & PRAGMA quick_check', ok, ok ? 'Verified ok' : 'Integrity check failed');
    } catch (err) {
      this.logRecovery('database', 'SQLite Reconnect', false, err.message);
    }
  }

  // Check speed engine health
  checkSpeedEngine(speedEngine) {
    if (!speedEngine) return;
    try {
      const status = speedEngine.getStatus();
      const now = Date.now();

      // If test has been running for > 45 seconds without finishing, it is stuck
      if (speedEngine.isRunning && speedEngine.testStartTime && (now - speedEngine.testStartTime > 45000)) {
        this.recordError('speedEngine', 'Speed test exceeded 45s maximum duration. Stuck socket detected.');
        if (this.canAttemptRecovery('speedEngine')) {
          speedEngine.cancelTest();
          speedEngine.cleanup();
          this.logRecovery('speedEngine', 'Orphaned Test Force-Reset', true, 'Terminated hung sockets and restored IDLE');
        }
      } else {
        this.services.speedEngine.status = 'HEALTHY';
        this.services.speedEngine.lastCheck = now;
      }
    } catch (err) {
      this.services.speedEngine.status = 'DEGRADED';
      this.recordError('speedEngine', err.message);
    }
  }

  // Periodic health sweep
  runHealthSweep() {
    this.services.backend.status = 'HEALTHY';
    this.services.backend.lastCheck = Date.now();

    // Check Database
    this.checkDatabase();

    // Check Speed Engine if available
    try {
      const speedEngine = require('./speed-engine');
      this.checkSpeedEngine(speedEngine);
    } catch (e) {}

    // Check Telemetry
    try {
      const telemetry = require('./telemetry');
      const snap = telemetry.getSnapshot();
      if (snap && snap.timestamp) {
        const ageMs = Date.now() - snap.timestamp;
        if (ageMs > 10000) {
          this.services.telemetry.status = 'DEGRADED';
          this.recordError('telemetry', `Telemetry snapshot is stale (${Math.round(ageMs/1000)}s old).`);
        } else {
          this.services.telemetry.status = 'HEALTHY';
          this.services.telemetry.lastCheck = Date.now();
        }
      }
    } catch (e) {}
  }

  // Get diagnostic snapshot for UI & APIs
  getDiagnosticReport() {
    const mem = process.memoryUsage();
    const uptimeSec = Math.round((Date.now() - this.startTime) / 1000);

    const overallHealthy = Object.values(this.services).every(s => s.status === 'HEALTHY');

    return {
      status: overallHealthy ? 'HEALTHY' : 'ATTENTION_REQUIRED',
      uptimeSec,
      timestamp: Date.now(),
      services: this.services,
      systemMetrics: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        processMemory: {
          rssMb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
          heapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
          heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
          externalMb: Math.round((mem.external / (1024 * 1024)) * 100) / 100
        },
        systemMemory: {
          totalGb: Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 10) / 10,
          freeGb: Math.round((os.freemem() / (1024 * 1024 * 1024)) * 10) / 10
        },
        cpuLoad: os.loadavg ? os.loadavg() : [0, 0, 0]
      },
      recoveryLog: this.recoveryLog.slice(0, 10),
      recentErrors: this.errorLog.slice(0, 10)
    };
  }
}

const healthManager = new HealthManager();
module.exports = healthManager;
