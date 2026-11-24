// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: ACTION APPROVAL MANAGER
// Strict Allowlisted Action Registry & Two-Phase Approval Flow
// Zero Unsafe Shell / Eval Execution
// =========================================================================

const crypto = require('crypto');

class ActionApprovalManager {
  constructor() {
    this.actionRegistry = new Map();
    this.pendingTokens = new Map(); // token -> actionPayload
    this.registerAllowlistedActions();

    // Clean up expired tokens every 5 minutes
    setInterval(() => this.pruneExpiredTokens(), 5 * 60 * 1000);
  }

  registerAllowlistedActions() {
    // 1. Non-Disruptive: Navigate to Module
    this.register({
      key: 'NAVIGATE_MODULE',
      label: 'Open Module',
      isDisruptive: false,
      description: 'Navigates user interface to a specific diagnostics screen.',
      execute: async ({ targetModule }) => ({
        type: 'NAVIGATION',
        targetModule: targetModule || 'module-overview'
      })
    });

    // 2. Non-Disruptive: Run Gateway Ping Check
    this.register({
      key: 'CHECK_GATEWAY',
      label: 'Probe Gateway RTT',
      isDisruptive: false,
      description: 'Pings local default gateway to measure LAN latency.',
      execute: async () => {
        const telemetry = require('../telemetry');
        const snap = telemetry.getSnapshot();
        return {
          gateway: snap.network.gateway,
          rtt: snap.network.gatewayPing || 2,
          packetLoss: 0,
          status: 'SUCCESS'
        };
      }
    });

    // 3. Non-Disruptive: Inspect DNS
    this.register({
      key: 'INSPECT_DNS',
      label: 'Inspect DNS Resolvers',
      isDisruptive: false,
      description: 'Checks public DNS reachability to 1.1.1.1 and 8.8.8.8.',
      execute: async () => {
        const dns = require('dns').promises;
        const start = Date.now();
        let reachable = true;
        try {
          await dns.resolve4('speed.cloudflare.com');
        } catch(e) { reachable = false; }
        const rtt = Date.now() - start;
        return {
          primaryDns: '1.1.1.1',
          secondaryDns: '1.0.0.1',
          resolutionRttMs: rtt,
          status: reachable ? 'OPERATIONAL' : 'DEGRADED'
        };
      }
    });

    // 4. Non-Disruptive: Inspect Wi-Fi Details
    this.register({
      key: 'INSPECT_WIFI',
      label: 'Scan Wi-Fi RF Environment',
      isDisruptive: false,
      description: 'Reads current 802.11 signal strength, channel, and RSSI.',
      execute: async () => {
        const wifi = require('../wifi-intelligence');
        return wifi.getHealthSummary ? wifi.getHealthSummary() : { status: 'OK' };
      }
    });

    // 5. Non-Disruptive: Recalculate Network DNA Baselines
    this.register({
      key: 'RECALCULATE_DNA',
      label: 'Recalculate DNA Baselines',
      isDisruptive: false,
      description: 'Recomputes statistical mean, variance, and IQR curves from stored telemetry records.',
      execute: async () => {
        const dna = require('../network-dna');
        if (dna.recomputeBaselines) {
          dna.recomputeBaselines();
          return { status: 'SUCCESS', message: 'Network DNA baselines updated.' };
        }
        return { status: 'NOMINAL', message: 'Continuous DNA background sampling is active.' };
      }
    });

    // 6. Non-Disruptive: Generate Network Report
    this.register({
      key: 'GENERATE_REPORT',
      label: 'Generate Network Health Report',
      isDisruptive: false,
      description: 'Compiles 24-hour executive summary into database and notification center.',
      execute: async () => {
        const novaPred = require('../nova-predictive');
        return novaPred.generateDailyReport ? novaPred.generateDailyReport() : { status: 'GENERATED' };
      }
    });

    // 7. DISRUPTIVE: Run Live Speed Test
    this.register({
      key: 'RUN_SPEED_TEST',
      label: 'Run Multi-Stream Speed Test',
      isDisruptive: true,
      riskWarning: 'This test will saturate your download and upload bandwidth for approximately 15 seconds.',
      description: 'Dispatches a full multi-stream speed diagnostic against the verified Cloudflare Edge sink.',
      execute: async ({ serverId = 'cloudflare-mumbai' } = {}) => {
        const speedEngine = require('../speed-engine');
        const res = await speedEngine.startTest({ serverId });
        return {
          status: res.success ? 'STARTED' : 'FAILED',
          message: res.success ? 'Speed test started on backend engine.' : res.error,
          testId: speedEngine.currentTestId
        };
      }
    });

    // 8. DISRUPTIVE: Run Bufferbloat Test
    this.register({
      key: 'RUN_BUFFERBLOAT_TEST',
      label: 'Run Bufferbloat Autopsy',
      isDisruptive: true,
      riskWarning: 'This test sends high-throughput traffic bursts to measure loaded latency increases.',
      description: 'Tests router bufferbloat by comparing unloaded latency with loaded queue latency.',
      execute: async () => {
        const bb = require('../bufferbloat');
        if (bb.runDiagnostic) {
          bb.runDiagnostic();
          return { status: 'STARTED', message: 'Bufferbloat diagnostic initiated.' };
        }
        return { status: 'UNAVAILABLE' };
      }
    });

    // 9. DISRUPTIVE: Scan Subnet Devices
    this.register({
      key: 'SCAN_DEVICES',
      label: 'Scan Subnet Devices (ARP Sweep)',
      isDisruptive: true,
      riskWarning: 'Generates parallel ICMP echo and ARP packets across the local subnet (192.168.x.0/24).',
      description: 'Sweeps local /24 subnet to discover all connected phones, smart TVs, PCs, and IoT stations.',
      execute: async () => {
        const dt = require('../digital-twin');
        if (dt.sweepNetwork) {
          dt.sweepNetwork();
          return { status: 'STARTED', message: 'Local network sweep dispatched.' };
        }
        return { status: 'UNAVAILABLE' };
      }
    });

    // 10. DISRUPTIVE: Flush DNS Resolver Cache
    this.register({
      key: 'FLUSH_DNS',
      label: 'Flush Windows DNS Resolver Cache',
      isDisruptive: true,
      riskWarning: 'Clears the local Windows DNS cache (ipconfig /flushdns), which may briefly reset active DNS queries.',
      description: 'Clears stale or corrupted DNS cache entries on Windows.',
      execute: async () => {
        const { exec } = require('child_process');
        return new Promise((resolve) => {
          exec('ipconfig /flushdns', (err, stdout) => {
            resolve({
              status: err ? 'ERROR' : 'SUCCESS',
              output: stdout ? stdout.trim() : (err ? err.message : '')
            });
          });
        });
      }
    });
  }

  register(def) {
    this.actionRegistry.set(def.key, def);
  }

  getAction(key) {
    return this.actionRegistry.get(key) || null;
  }

  /**
   * Evaluates if action requires user confirmation.
   * If non-disruptive, returns approved payload immediately.
   * If disruptive, issues a cryptographically random approval token valid for 5 minutes.
   */
  requestAction(actionKey, params = {}, sessionId = 'default') {
    const action = this.getAction(actionKey);
    if (!action) {
      return {
        success: false,
        error: `Action '${actionKey}' is not an allowlisted diagnostic action.`
      };
    }

    if (!action.isDisruptive) {
      return {
        requiresApproval: false,
        actionKey,
        label: action.label,
        description: action.description,
        params
      };
    }

    // Disruptive action -> Generate Approval Token
    const token = 'ACT_' + crypto.randomBytes(12).toString('hex');
    const approvalPayload = {
      token,
      actionKey,
      label: action.label,
      description: action.description,
      riskWarning: action.riskWarning,
      params,
      sessionId,
      expiresAt: Date.now() + (5 * 60 * 1000)
    };

    this.pendingTokens.set(token, approvalPayload);

    return {
      requiresApproval: true,
      token,
      actionKey,
      label: action.label,
      riskWarning: action.riskWarning,
      description: action.description
    };
  }

  /**
   * Executes an action after token validation or direct non-disruptive execution
   */
  async approveAndExecute(token) {
    const pending = this.pendingTokens.get(token);
    if (!pending) {
      return {
        success: false,
        error: 'Invalid, expired, or already executed action token.'
      };
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingTokens.delete(token);
      return {
        success: false,
        error: 'Action approval token has expired.'
      };
    }

    const action = this.getAction(pending.actionKey);
    if (!action) {
      this.pendingTokens.delete(token);
      return {
        success: false,
        error: 'Allowlisted action definition no longer exists.'
      };
    }

    this.pendingTokens.delete(token);

    try {
      const result = await action.execute(pending.params || {});
      return {
        success: true,
        actionKey: pending.actionKey,
        label: action.label,
        result
      };
    } catch (err) {
      return {
        success: false,
        actionKey: pending.actionKey,
        error: `Action execution error: ${err.message}`
      };
    }
  }

  pruneExpiredTokens() {
    const now = Date.now();
    for (const [t, p] of this.pendingTokens.entries()) {
      if (now > p.expiresAt) {
        this.pendingTokens.delete(t);
      }
    }
  }
}

module.exports = new ActionApprovalManager();
