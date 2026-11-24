const { exec } = require('child_process');
const telemetryService = require('./telemetry');
const { getDb } = require('../database/db');
const SETTINGS = require('../config/settings');

class SmartBandwidthGuardian {
  constructor() {
    this.processList = [];
    this.isFrozen = false;
    this.frozenPids = [];
    this.previousPriorities = new Map(); // pid -> original PriorityClass
    this.lastInspectTime = 0;

    this.startInspectionLoop();
  }

  inspectProcesses() {
    const psCmd = `powershell -NoProfile -Command "$conns = Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Group-Object OwningProcess; $res = @(); foreach ($c in $conns) { $p = Get-Process -Id $c.Name -ErrorAction SilentlyContinue; if ($p -and $p.ProcessName -notmatch 'svchost|System|Idle') { $res += [PSCustomObject]@{ pid = [int]$c.Name; name = $p.ProcessName; count = [int]$c.Count } } }; if ($res.Count -gt 0) { $res | Sort-Object count -Descending | Select-Object -First 12 | ConvertTo-Json -Compress } else { '[]' }"`;

    exec(psCmd, { timeout: 3000 }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout);
          const raw = Array.isArray(parsed) ? parsed : [parsed];
          const totalSockets = raw.reduce((a, b) => a + (b.count || 1), 0) || 1;

          this.processList = raw.map(item => {
            const socketSharePct = parseFloat(((item.count / totalSockets) * 100).toFixed(1));

            let category = 'System / Utility';
            let icon = '⚙️';
            let isCritical = false;
            const n = (item.name || '').toLowerCase();

            if (n.includes('tixati') || n.includes('torrent') || n.includes('transmission')) {
              category = 'BitTorrent P2P Client';
              icon = '🚀';
            } else if (n.includes('edge') || n.includes('chrome') || n.includes('firefox')) {
              category = 'Web Browser';
              icon = '🌐';
              isCritical = true;
            } else if (n.includes('steam') || n.includes('roblox') || n.includes('game') || n.includes('riot') || n.includes('valorant') || n.includes('cs2')) {
              category = 'Gaming Client';
              icon = '🎮';
              isCritical = true;
            } else if (n.includes('onedrive') || n.includes('dropbox') || n.includes('google') || n.includes('drive')) {
              category = 'Cloud Storage Sync';
              icon = '☁️';
            } else if (n.includes('discord') || n.includes('slack') || n.includes('teams')) {
              category = 'Voice / Messaging';
              icon = '💬';
              isCritical = true;
            }

            return {
              pid: item.pid,
              name: item.name,
              category,
              icon,
              connections: item.count,
              socketSharePct,
              isCritical,
              // Explicitly document technical reality: socket flow ownership
              measurementType: 'ESTABLISHED_TCP_SOCKETS',
              measurementNote: 'Socket connection ownership (kernel ETW per-byte packet interception requires admin filter driver)',
              isFrozen: this.frozenPids.includes(item.pid)
            };
          });

          this.lastInspectTime = Date.now();
        } catch (e) {}
      }
    });
  }

  // Bandwidth Freeze: Uses real Windows Process Priority adjustment to Idle on background socket owners
  toggleBandwidthFreeze(enable) {
    this.isFrozen = enable;

    if (enable) {
      // Target non-critical background socket owners (cloud sync, background updaters, non-interactive processes)
      const targetProcesses = this.processList.filter(p => !p.isCritical);
      const targetPids = targetProcesses.map(p => p.pid);
      this.frozenPids = targetPids;

      if (targetPids.length > 0) {
        // Apply Idle priority to target PIDs via Windows API
        const pidListStr = targetPids.join(',');
        const psCmd = `powershell -NoProfile -Command "$pids = @(${pidListStr}); foreach ($id in $pids) { try { $p = Get-Process -Id $id -ErrorAction SilentlyContinue; if ($p) { $p.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::Idle } } catch {} }"`;
        exec(psCmd, () => {});
      }

      return {
        frozen: true,
        action: 'DE_PRIORITIZED_IDLE',
        message: `Bandwidth Freeze active. Windows ProcessPriorityClass.Idle applied to ${targetPids.length} background socket owners.`,
        frozenPids: targetPids,
        protectedPids: this.processList.filter(p => p.isCritical).map(p => p.pid)
      };
    } else {
      // Restore standard priority
      if (this.frozenPids.length > 0) {
        const pidListStr = this.frozenPids.join(',');
        const psCmd = `powershell -NoProfile -Command "$pids = @(${pidListStr}); foreach ($id in $pids) { try { $p = Get-Process -Id $id -ErrorAction SilentlyContinue; if ($p) { $p.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::Normal } } catch {} }"`;
        exec(psCmd, () => {});
      }

      this.frozenPids = [];
      return {
        frozen: false,
        action: 'RESTORED_NORMAL',
        message: 'Bandwidth Freeze released. Standard process scheduling restored.',
        frozenPids: []
      };
    }
  }

  startInspectionLoop() {
    this.inspectProcesses();
    setInterval(() => this.inspectProcesses(), SETTINGS.SOCKET_INSPECT_INTERVAL_MS);
  }

  resetPriority(pid) {
    if (!pid) return { success: false, error: 'PID required' };
    const psCmd = `powershell -NoProfile -Command "try { $p = Get-Process -Id ${pid} -ErrorAction SilentlyContinue; if ($p) { $p.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::Normal } } catch {}"`;
    exec(psCmd, () => {});
    this.frozenPids = this.frozenPids.filter(p => p !== pid);
    return { success: true, pid, restored: 'Normal' };
  }

  getDashboardData() {
    return {
      processes: this.processList,
      totalActive: this.processList.length,
      isFrozen: this.isFrozen,
      frozenPids: this.frozenPids,
      lastUpdated: this.lastInspectTime,
      technicalNotice: {
        mechanism: 'TCP Socket Flow Ownership via Windows NetTCPConnection',
        explanation: 'Windows tracks established TCP connection endpoints per PID. CPU scheduling priority de-prioritization (Idle) reduces background processing overhead; kernel-level byte rate capping requires an NDIS packet filter driver.'
      }
    };
  }
}

const bandwidthGuardian = new SmartBandwidthGuardian();
module.exports = bandwidthGuardian;
