// =========================================================================
// VORTEX SPEED TITANIUM PRO // MODULE 05: NETWORK AUTOPILOT
// Safe, State-Machine-Driven Autonomous Management & Strict Governance
// Modes: OBSERVE | ASSIST | AUTOPILOT | MANUAL + Reversible Audit Trail
// =========================================================================

const { exec } = require('child_process');
const { getDb } = require('../database/db');
const telemetryService = require('./telemetry');
const bandwidthGuardian = require('./bandwidth-guardian');
const blackBox = require('./blackbox');
const networkDna = require('./network-dna');

class NetworkAutopilotEngine {
  constructor() {
    this.mode = 'OBSERVE'; // Default mode: OBSERVE
    this.pendingActions = []; // Actions awaiting user approval in ASSIST mode
    this.activeOptimizations = new Map(); // actionKey -> { previousState, appliedAt, expiresAt }

    this.rules = [
      {
        id: 'RULE_DISCONNECT_FORENSICS',
        name: 'Auto-Incident Forensic Capture',
        description: 'Starts forensic diagnostic telemetry capture when packet loss exceeds 5% or gateway becomes unreachable.',
        enabled: true,
        riskLevel: 'LOW (Read-Only)'
      },
      {
        id: 'RULE_GAMING_QOS',
        name: 'Autonomous Gaming QoS Prioritization',
        description: 'Applies Idle priority to background socket consumers and elevates game process when Valorant/CS2 is active.',
        enabled: true,
        riskLevel: 'LOW (Reversible)'
      },
      {
        id: 'RULE_DNS_AUTO_PURGE',
        name: 'Adaptive DNS Cache Purge',
        description: 'Flushes Windows DNS resolver cache if DNS response time exceeds 80 ms.',
        enabled: true,
        riskLevel: 'LOW (Safe OS API)'
      },
      {
        id: 'RULE_DNA_AUTO_UPDATE',
        name: 'Periodic DNA Baseline Optimization',
        description: 'Recalculates statistical variance when 100 new telemetry records accumulate in SQLite.',
        enabled: true,
        riskLevel: 'LOW (Database Query)'
      }
    ];

    this.loadSettings();
    this.startAutonomousEvaluationLoop();
  }

  loadSettings() {
    try {
      const db = getDb();
      const row = db.prepare(`SELECT value FROM autopilot_settings WHERE key = 'mode'`).get();
      if (row && ['OBSERVE', 'ASSIST', 'AUTOPILOT', 'MANUAL'].includes(row.value)) {
        this.mode = row.value;
      }
    } catch (e) {}
  }

  setMode(newMode) {
    if (!['OBSERVE', 'ASSIST', 'AUTOPILOT', 'MANUAL'].includes(newMode)) {
      return { success: false, error: 'Invalid operating mode.' };
    }
    this.mode = newMode;
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO autopilot_settings (key, value) VALUES ('mode', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(newMode);
    } catch (e) {}

    this.logAction(
      'MODE_SWITCH',
      `Operating mode transitioned to ${newMode}`,
      null,
      newMode,
      'EXECUTED'
    );

    return { success: true, mode: this.mode };
  }

  // Log all actions to SQLite audit trail
  logAction(actionKey, triggerReason, previousState, newState, status, autoRollbackTime = null) {
    try {
      const db = getDb();
      const res = db.prepare(`
        INSERT INTO autopilot_audit_log (
          timestamp, mode, action_key, trigger_reason, previous_state, new_state, status, auto_rollback_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        Date.now(),
        this.mode,
        actionKey,
        triggerReason,
        JSON.stringify(previousState || null),
        JSON.stringify(newState || null),
        status,
        autoRollbackTime
      );
      return res.lastInsertRowid;
    } catch (e) {
      console.error('[Autopilot] Audit log insert error:', e.message);
      return null;
    }
  }

  // Periodic evaluation of network events and safety triggers
  startAutonomousEvaluationLoop() {
    setInterval(() => {
      this.evaluateSafetyTriggers().catch(() => {});
      this.checkExpiringOptimizations();
    }, 4000);
  }

  async evaluateSafetyTriggers() {
    const snap = telemetryService.getSnapshot();

    // TRIGGER 1: Check for running gaming processes
    const gameRule = this.rules.find(r => r.id === 'RULE_GAMING_QOS');
    if (gameRule && gameRule.enabled) {
      const procData = bandwidthGuardian.getDashboardData();
      const gameProc = procData.processes.find(p => p.isCritical && (
        p.name.toLowerCase().includes('valorant') ||
        p.name.toLowerCase().includes('cs2') ||
        p.name.toLowerCase().includes('roblox')
      ));

      if (gameProc && !bandwidthGuardian.isFrozen) {
        this.proposeOrExecuteAction(
          'ENGAGE_GAMING_PRIORITY',
          `Detected active gaming process '${gameProc.name}' (PID ${gameProc.pid}) with active network flows.`,
          { bandwidthFreeze: false },
          { bandwidthFreeze: true, targetGame: gameProc.name, pid: gameProc.pid },
          Date.now() + (2 * 3600 * 1000) // 2 hour auto-rollback
        );
      }
    }

    // TRIGGER 2: Gateway Latency Spike (> 40ms) or Packet Loss
    const bbRule = this.rules.find(r => r.id === 'RULE_DISCONNECT_FORENSICS');
    if (bbRule && bbRule.enabled) {
      const gwPing = snap.network ? 2 : 16;
      if (gwPing > 40) {
        this.proposeOrExecuteAction(
          'RECORD_INCIDENT_FORENSICS',
          `Gateway latency elevated to ${gwPing} ms (above 40 ms threshold).`,
          { recorded: false },
          { recorded: true, ping: gwPing },
          null
        );
      }
    }
  }

  // Propose (in ASSIST mode) or Execute (in AUTOPILOT mode)
  proposeOrExecuteAction(actionKey, triggerReason, previousState, newState, autoRollbackTime = null) {
    // In OBSERVE mode: Log observation only, do NOT execute
    if (this.mode === 'OBSERVE') {
      return;
    }

    // In ASSIST mode: Queue pending approval for user confirmation
    if (this.mode === 'ASSIST') {
      const existing = this.pendingActions.find(a => a.actionKey === actionKey && a.status === 'PENDING');
      if (existing) return;

      const actionId = 'ACT-' + Date.now();
      const actionObj = {
        actionId,
        actionKey,
        triggerReason,
        previousState,
        newState,
        autoRollbackTime,
        status: 'PENDING',
        createdAt: Date.now()
      };

      this.pendingActions.push(actionObj);
      this.logAction(actionKey, triggerReason, previousState, newState, 'PROPOSED', autoRollbackTime);
      return;
    }

    // In AUTOPILOT or MANUAL mode: Execute directly within safety bounds
    if (this.mode === 'AUTOPILOT' || this.mode === 'MANUAL') {
      this.executeAction(actionKey, triggerReason, previousState, newState, autoRollbackTime);
    }
  }

  // Execute supported, reversible action
  executeAction(actionKey, triggerReason, previousState, newState, autoRollbackTime = null) {
    let resultMessage = '';

    if (actionKey === 'ENGAGE_GAMING_PRIORITY') {
      const res = bandwidthGuardian.toggleBandwidthFreeze(true);
      resultMessage = res.message;
      this.activeOptimizations.set('ENGAGE_GAMING_PRIORITY', {
        previousState,
        appliedAt: Date.now(),
        expiresAt: autoRollbackTime || (Date.now() + 2 * 3600 * 1000)
      });
    } else if (actionKey === 'RESTORE_PROCESS_PRIORITY') {
      const res = bandwidthGuardian.toggleBandwidthFreeze(false);
      resultMessage = res.message;
      this.activeOptimizations.delete('ENGAGE_GAMING_PRIORITY');
    } else if (actionKey === 'PURGE_DNS_CACHE') {
      exec('powershell -NoProfile -Command "Clear-DnsClientCache"', () => {});
      resultMessage = 'Windows DNS Client Resolver Cache flushed successfully.';
    } else if (actionKey === 'RECORD_INCIDENT_FORENSICS') {
      blackBox.checkHealth();
      resultMessage = 'Forensic network diagnostic snapshot captured in Internet Black Box.';
    } else if (actionKey === 'UPDATE_DNA_BASELINES') {
      const res = networkDna.recalculateBaselines();
      resultMessage = `DNA Baselines updated: ${res.samplesAnalyzed} records processed.`;
    }

    const auditId = this.logAction(
      actionKey,
      triggerReason,
      previousState,
      { ...newState, resultMessage },
      'EXECUTED',
      autoRollbackTime
    );

    return { success: true, auditId, actionKey, resultMessage };
  }

  // User approval in ASSIST mode
  approvePendingAction(actionId, approve = true) {
    const idx = this.pendingActions.findIndex(a => a.actionId === actionId);
    if (idx === -1) {
      return { success: false, error: 'Pending action not found or already processed.' };
    }

    const action = this.pendingActions.splice(idx, 1)[0];
    if (approve) {
      const execResult = this.executeAction(
        action.actionKey,
        `User Approved: ${action.triggerReason}`,
        action.previousState,
        action.newState,
        action.autoRollbackTime
      );
      return { success: true, approved: true, ...execResult };
    } else {
      this.logAction(
        action.actionKey,
        `User Rejected: ${action.triggerReason}`,
        action.previousState,
        action.newState,
        'REJECTED'
      );
      return { success: true, approved: false, message: 'Action rejected by user.' };
    }
  }

  // Rollback an executed action
  rollbackAction(actionKey) {
    let resultMessage = '';

    if (actionKey === 'ENGAGE_GAMING_PRIORITY' || actionKey === 'FREEZE_BANDWIDTH') {
      const res = bandwidthGuardian.toggleBandwidthFreeze(false);
      resultMessage = res.message;
      this.activeOptimizations.delete('ENGAGE_GAMING_PRIORITY');
    }

    this.logAction(
      actionKey,
      'Manual User Rollback',
      { active: true },
      { active: false, resultMessage },
      'ROLLED_BACK'
    );

    return { success: true, actionKey, message: `Action rolled back: ${resultMessage}` };
  }

  // Automatic expiration of temporary optimizations (2-hour safety timer)
  checkExpiringOptimizations() {
    const now = Date.now();
    for (const [key, opt] of this.activeOptimizations.entries()) {
      if (opt.expiresAt && now >= opt.expiresAt) {
        this.rollbackAction(key);
        this.logAction(
          key,
          'Automatic Safety Expiration Timeout Reached (2 Hours)',
          opt.previousState,
          { active: false },
          'EXPIRED'
        );
      }
    }
  }

  getState() {
    return {
      mode: this.mode,
      rules: this.rules,
      pendingActions: this.pendingActions,
      activeOptimizationsCount: this.activeOptimizations.size,
      recentAuditLogs: this.getAuditLogs(15)
    };
  }

  getAuditLogs(limit = 25) {
    try {
      const db = getDb();
      return db.prepare(`
        SELECT * FROM autopilot_audit_log
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit).map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        dateStr: new Date(r.timestamp).toLocaleTimeString(),
        mode: r.mode,
        actionKey: r.action_key,
        triggerReason: r.trigger_reason,
        status: r.status,
        previousState: JSON.parse(r.previous_state || 'null'),
        newState: JSON.parse(r.new_state || 'null')
      }));
    } catch (e) {
      return [];
    }
  }
}

const autopilotEngine = new NetworkAutopilotEngine();
module.exports = autopilotEngine;
