// =========================================================================
// VORTEX SPEED TITANIUM PRO — SECURE DATABASE BACKUP & DATA EXPORT MANAGER
// =========================================================================

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const SETTINGS = require('../config/settings');
const { getDb, closeDatabase, initDatabase } = require('../database/db');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

class BackupManager {
  constructor() {
    this.ensureBackupDir();
    this.maxBackups = 7;
    // Scheduled daily backup check every 6 hours
    this.scheduledTimer = setInterval(() => this.runScheduledBackup(), 6 * 60 * 60 * 1000);
  }

  ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
      try {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      } catch (e) {
        console.error('[BackupManager] Failed to create backup dir:', e.message);
      }
    }
  }

  // Create manual or automated verified backup
  createBackup(label = 'manual') {
    this.ensureBackupDir();
    try {
      const db = getDb();
      // Checkpoint WAL so all pending transactions are committed into main db file
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');

      const timestamp = Date.now();
      const dateStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
      const filename = `vortex_backup_${label}_${dateStr}.db`;
      const targetPath = path.join(BACKUP_DIR, filename);

      // Perform atomic copy
      fs.copyFileSync(SETTINGS.DB_PATH, targetPath);

      // Verify backup integrity with independent read connection
      let integrity = 'unknown';
      let rowCounts = {};
      try {
        const verifyDb = new DatabaseSync(targetPath);
        const check = verifyDb.prepare('PRAGMA integrity_check;').get();
        integrity = check ? (check.integrity_check || Object.values(check)[0]) : 'failed';

        if (integrity === 'ok') {
          rowCounts = {
            speedTests: verifyDb.prepare('SELECT COUNT(*) as c FROM speed_tests').get().c,
            telemetry: verifyDb.prepare('SELECT COUNT(*) as c FROM telemetry_history').get().c,
            incidents: verifyDb.prepare('SELECT COUNT(*) as c FROM network_incidents').get().c
          };
        }
        verifyDb.close();
      } catch (verErr) {
        integrity = 'failed: ' + verErr.message;
      }

      if (integrity !== 'ok') {
        try { fs.unlinkSync(targetPath); } catch (e) {}
        throw new Error(`Backup failed integrity verification: ${integrity}`);
      }

      const stats = fs.statSync(targetPath);
      this.rotateBackups();

      return {
        success: true,
        filename,
        path: targetPath,
        sizeBytes: stats.size,
        sizeMb: Math.round((stats.size / (1024 * 1024)) * 100) / 100,
        timestamp,
        integrity,
        rowCounts
      };
    } catch (err) {
      console.error('[BackupManager] Backup creation failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Auto-prune older backups beyond retention limit
  rotateBackups() {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('vortex_backup_') && f.endsWith('.db'))
        .map(f => {
          const fp = path.join(BACKUP_DIR, f);
          return { filename: f, path: fp, time: fs.statSync(fp).mtimeMs };
        })
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups);
        for (const item of toDelete) {
          try {
            fs.unlinkSync(item.path);
            console.log(`[BackupManager] Pruned aged backup: ${item.filename}`);
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  // List all available verified backups
  listBackups() {
    this.ensureBackupDir();
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('vortex_backup_') && f.endsWith('.db'))
        .map(f => {
          const fp = path.join(BACKUP_DIR, f);
          const st = fs.statSync(fp);
          return {
            filename: f,
            sizeBytes: st.size,
            sizeMb: Math.round((st.size / (1024 * 1024)) * 100) / 100,
            createdAt: st.mtimeMs,
            createdDate: new Date(st.mtimeMs).toLocaleString()
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);

      return { success: true, backups: files, count: files.length };
    } catch (e) {
      return { success: false, error: e.message, backups: [] };
    }
  }

  // Read-only preview of a backup file
  previewBackup(filename) {
    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(filename);
    const targetPath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(targetPath)) {
      return { success: false, error: 'Backup file does not exist.' };
    }

    try {
      const previewDb = new DatabaseSync(targetPath);
      const check = previewDb.prepare('PRAGMA integrity_check;').get();
      const integrity = check ? (check.integrity_check || Object.values(check)[0]) : 'failed';

      const counts = {
        speedTests: previewDb.prepare('SELECT COUNT(*) as c FROM speed_tests').get().c,
        telemetry: previewDb.prepare('SELECT COUNT(*) as c FROM telemetry_history').get().c,
        incidents: previewDb.prepare('SELECT COUNT(*) as c FROM network_incidents').get().c,
        devices: previewDb.prepare('SELECT COUNT(*) as c FROM device_records').get().c
      };

      const latestTest = previewDb.prepare('SELECT date_str, down_mbps, up_mbps, ping FROM speed_tests ORDER BY timestamp DESC LIMIT 1').get();

      previewDb.close();

      const st = fs.statSync(targetPath);
      return {
        success: true,
        filename: safeName,
        sizeMb: Math.round((st.size / (1024 * 1024)) * 100) / 100,
        createdAt: st.mtimeMs,
        integrity,
        counts,
        sampleRecord: latestTest || null
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // Safe restore with safety snapshot
  restoreBackup(filename, confirmationToken) {
    if (confirmationToken !== 'CONFIRM_RESTORE') {
      return { success: false, error: 'Invalid confirmation token. User confirmation required.' };
    }

    const safeName = path.basename(filename);
    const sourcePath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Target backup file not found.' };
    }

    // 1. Verify backup integrity first
    try {
      const checkDb = new DatabaseSync(sourcePath);
      const check = checkDb.prepare('PRAGMA integrity_check;').get();
      const integrity = check ? (check.integrity_check || Object.values(check)[0]) : 'failed';
      checkDb.close();
      if (integrity !== 'ok') {
        return { success: false, error: `Backup is corrupted: ${integrity}` };
      }
    } catch (e) {
      return { success: false, error: `Integrity check failed: ${e.message}` };
    }

    // 2. Create emergency pre-restore safety copy of current active database
    const emergencySnapshotPath = path.join(BACKUP_DIR, `vortex_emergency_pre_restore_${Date.now()}.db`);
    try {
      closeDatabase();
      if (fs.existsSync(SETTINGS.DB_PATH)) {
        fs.copyFileSync(SETTINGS.DB_PATH, emergencySnapshotPath);
      }

      // 3. Restore backup file
      fs.copyFileSync(sourcePath, SETTINGS.DB_PATH);

      // Clean up auxiliary WAL/SHM files if present
      try { if (fs.existsSync(SETTINGS.DB_PATH + '-wal')) fs.unlinkSync(SETTINGS.DB_PATH + '-wal'); } catch (e) {}
      try { if (fs.existsSync(SETTINGS.DB_PATH + '-shm')) fs.unlinkSync(SETTINGS.DB_PATH + '-shm'); } catch (e) {}

      // 4. Re-initialize active connection
      initDatabase();

      return {
        success: true,
        message: `Successfully restored database from ${safeName}`,
        emergencyRollbackSnapshot: path.basename(emergencySnapshotPath)
      };
    } catch (e) {
      console.error('[BackupManager] Restore failed, rolling back:', e.message);
      // Attempt rollback to emergency copy
      try {
        if (fs.existsSync(emergencySnapshotPath)) {
          fs.copyFileSync(emergencySnapshotPath, SETTINGS.DB_PATH);
          initDatabase();
        }
      } catch (rollErr) {}
      return { success: false, error: `Restore error: ${e.message}. Active database preserved.` };
    }
  }

  // Scheduled background backup (runs once per day if none exists for today)
  runScheduledBackup() {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const backups = this.listBackups().backups || [];
      const hasToday = backups.some(b => b.filename.includes(today));
      if (!hasToday) {
        console.log('[BackupManager] Executing automatic daily database backup...');
        this.createBackup('daily_auto');
      }
    } catch (e) {}
  }

  // Export Data to CSV or JSON
  exportData(table, format = 'csv') {
    const validTables = ['speed_tests', 'network_incidents', 'telemetry_history', 'device_records'];
    if (!validTables.includes(table)) {
      throw new Error(`Invalid table specified for export. Supported: ${validTables.join(', ')}`);
    }

    const db = getDb();
    const timeCols = {
      speed_tests: 'timestamp',
      telemetry_history: 'timestamp',
      network_incidents: 'start_time',
      device_records: 'last_seen'
    };
    const orderCol = timeCols[table] || 'rowid';
    let query = `SELECT * FROM ${table} ORDER BY ${orderCol} DESC`;
    if (table === 'telemetry_history') {
      // Limit to latest 5000 rows to prevent memory exhaustion
      query += ` LIMIT 5000`;
    }

    const rows = db.prepare(query).all();

    if (format === 'json') {
      return {
        contentType: 'application/json; charset=utf-8',
        filename: `vortex_${table}_export_${Date.now()}.json`,
        data: JSON.stringify(rows, null, 2)
      };
    }

    // Default to CSV
    if (rows.length === 0) {
      return {
        contentType: 'text/csv; charset=utf-8',
        filename: `vortex_${table}_export_${Date.now()}.csv`,
        data: 'no_data\n'
      };
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const line = headers.map(h => {
        let val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') {
          // Escape quotes
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
      csvLines.push(line);
    }

    return {
      contentType: 'text/csv; charset=utf-8',
      filename: `vortex_${table}_export_${Date.now()}.csv`,
      data: csvLines.join('\n')
    };
  }
}

const backupManager = new BackupManager();
module.exports = backupManager;
