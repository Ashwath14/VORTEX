// =========================================================================
// VORTEX SPEED TITANIUM PRO // MODULE 03: INTERNET ROUTE VISION ENGINE
// Hop-by-Hop Route Tracing, ICMP Rate-Limit Filtering & Historical Route Diffs
// Native Windows tracert integration with zero command injection vulnerability
// =========================================================================

const { spawn } = require('child_process');
const { getDb } = require('../database/db');

class InternetRouteVisionEngine {
  constructor() {
    this.activeProcess = null;
    this.isRunning = false;
    this.isCancelled = false;
    this.currentTarget = null;
    this.destinationKey = 'cloudflare';

    this.defaultTargets = {
      'cloudflare': { name: 'Cloudflare Edge Anycast', host: '1.1.1.1' },
      'google': { name: 'Google Core DNS', host: '8.8.8.8' },
      'gateway': { name: 'JioFiber Gateway Router', host: '192.168.29.1' },
      'valorant': { name: 'Riot Games Mumbai Server (Valorant)', host: '151.106.248.1' }
    };

    this.liveState = {
      traceId: null,
      destination: '',
      targetHost: '',
      status: 'IDLE', // IDLE, TRACING, COMPLETED, CANCELLED, FAILED
      progressHop: 0,
      maxHops: 16,
      hops: [], // array of { hop, ip, rtts, avgRtt, status, isRateLimited }
      totalRttMs: 0,
      destinationReached: false,
      routeFingerprint: '',
      routeChanged: false,
      previousFingerprint: null,
      explanation: ''
    };
  }

  // Strict host validation to prevent command injection
  validateHost(host) {
    if (!host || typeof host !== 'string') return false;
    const trimmed = host.trim();
    if (trimmed.length > 255) return false;
    if (/[;&|`$<>'"\\]/.test(trimmed)) return false;

    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return ipv4Regex.test(trimmed) || domainRegex.test(trimmed);
  }

  // Resolve target host
  resolveTarget(key, customHost) {
    if (key === 'custom') {
      if (!this.validateHost(customHost)) return null;
      return { name: `Custom (${customHost.trim()})`, host: customHost.trim() };
    }
    return this.defaultTargets[key] || this.defaultTargets.cloudflare;
  }

  // Parse a single tracert output line
  parseHopLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // Match hop line: starts with hop number
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (!match) return null;

    const hopNum = parseInt(match[1], 10);
    const rest = match[2];

    // Check for "Request timed out."
    if (rest.includes('Request timed out')) {
      return {
        hop: hopNum,
        ip: '* (No Response)',
        rtts: ['*', '*', '*'],
        avgRtt: 0,
        status: 'TIMEOUT',
        isRateLimited: true, // Will be determined based on downstream responses
        isDestination: false
      };
    }

    // Extract RTT values: e.g. "10 ms", "<1 ms", "*"
    const rttMatches = rest.match(/(<1\s*ms|\d+\s*ms|\*)/gi) || [];
    const rttParsed = rttMatches.map(r => {
      if (r === '*') return null;
      if (r.includes('<1')) return 0.5;
      const num = parseInt(r, 10);
      return isNaN(num) ? null : num;
    });

    const validNumbers = rttParsed.filter(n => n !== null);
    const avgRtt = validNumbers.length > 0
      ? parseFloat((validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length).toFixed(1))
      : 0;

    // Extract IP (last token in line)
    const tokens = rest.trim().split(/\s+/);
    const lastToken = tokens[tokens.length - 1].replace(/[\[\]]/g, '');

    return {
      hop: hopNum,
      ip: lastToken,
      rtts: rttMatches.slice(0, 3),
      avgRtt,
      status: avgRtt > 120 ? 'HIGH_LATENCY' : (avgRtt > 60 ? 'ELEVATED' : 'CLEAN'),
      isRateLimited: false,
      isDestination: false
    };
  }

  // Start route trace
  startTrace(targetKey = 'cloudflare', customHost = '') {
    if (this.isRunning) {
      return { success: false, error: 'A route trace is already in progress.', currentTarget: this.currentTarget };
    }

    const target = this.resolveTarget(targetKey, customHost);
    if (!target) {
      return { success: false, error: 'Invalid destination hostname or IP address format.' };
    }

    this.isRunning = true;
    this.isCancelled = false;
    this.currentTarget = target.host;
    this.destinationKey = targetKey;

    const traceId = 'RT-' + Date.now();
    this.liveState = {
      traceId,
      destination: target.name,
      targetHost: target.host,
      status: 'TRACING',
      progressHop: 0,
      maxHops: 16,
      hops: [],
      totalRttMs: 0,
      destinationReached: false,
      routeFingerprint: '',
      routeChanged: false,
      previousFingerprint: null,
      explanation: 'Initializing Windows traceroute engine...'
    };

    // Fetch previous fingerprint from SQLite for route diff comparison
    try {
      const db = getDb();
      const prev = db.prepare(`
        SELECT route_fingerprint FROM route_history
        WHERE destination = ? AND status = 'COMPLETED'
        ORDER BY timestamp DESC LIMIT 1
      `).get(target.host);
      if (prev) {
        this.liveState.previousFingerprint = prev.route_fingerprint;
      }
    } catch (e) {}

    // Spawn native tracert asynchronously
    // Flags: -d (do not resolve IP to hostnames for maximum speed), -w 350 (ms timeout), -h 16 (max hops)
    const args = ['-d', '-w', '350', '-h', '16', target.host];
    this.activeProcess = spawn('tracert', args);

    let stdoutBuffer = '';

    this.activeProcess.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop(); // keep last incomplete line

      for (const line of lines) {
        const hopObj = this.parseHopLine(line);
        if (hopObj) {
          this.liveState.progressHop = hopObj.hop;
          // Check if hop is destination
          if (hopObj.ip === target.host) {
            hopObj.isDestination = true;
            this.liveState.destinationReached = true;
          }
          this.liveState.hops.push(hopObj);
        }
      }
    });

    this.activeProcess.on('close', (code) => {
      this.isRunning = false;
      this.activeProcess = null;

      if (this.isCancelled) {
        this.liveState.status = 'CANCELLED';
        this.liveState.explanation = 'Route trace was cancelled by user.';
        return;
      }

      this.liveState.status = 'COMPLETED';

      // Distinguish ICMP Rate Limiting from actual packet loss (Prompt Requirement 4.3)
      // If hop X timed out, but hop X+1 or destination responded, hop X was merely ICMP rate-limited
      const destinationReached = this.liveState.hops.some(h => h.ip === target.host);
      this.liveState.destinationReached = destinationReached;

      this.liveState.hops.forEach((h, idx) => {
        if (h.status === 'TIMEOUT') {
          const hasLaterResponse = this.liveState.hops.slice(idx + 1).some(next => next.status !== 'TIMEOUT');
          if (hasLaterResponse || destinationReached) {
            h.status = 'ICMP_RATE_LIMITED';
            h.isRateLimited = true;
            h.note = 'Intermediate router deprioritized ICMP response (Normal transit behavior; not packet loss).';
          } else {
            h.status = 'UNREACHABLE';
            h.isRateLimited = false;
            h.note = 'Hop unresponsive. Subsequent hops failed to reply.';
          }
        }
      });

      // Compute total RTT (last responding hop's latency)
      const respondingHops = this.liveState.hops.filter(h => h.avgRtt > 0);
      const lastResponding = respondingHops[respondingHops.length - 1];
      this.liveState.totalRttMs = lastResponding ? lastResponding.avgRtt : 0;

      // Build Route Fingerprint: Sequence of responding IP hops
      const fp = this.liveState.hops
        .filter(h => h.ip !== '* (No Response)')
        .map(h => h.ip)
        .join(' -> ');
      this.liveState.routeFingerprint = fp;

      // Compare with previous route
      if (this.liveState.previousFingerprint && this.liveState.previousFingerprint !== fp) {
        this.liveState.routeChanged = true;
        this.liveState.explanation = `Route path diverged from previous baseline! Traffic routing shifted across transit nodes. Previous: [${this.liveState.previousFingerprint}] -> Current: [${fp}]. End-to-end latency: ${this.liveState.totalRttMs} ms.`;
      } else {
        this.liveState.routeChanged = false;
        this.liveState.explanation = destinationReached
          ? `Route verified cleanly in ${this.liveState.hops.length} hops. Total end-to-end latency: ${this.liveState.totalRttMs} ms. Gateway (Hop 1) latency is ${this.liveState.hops[0] ? this.liveState.hops[0].avgRtt : 2} ms.`
          : `Route completed to Hop ${this.liveState.hops.length}. Destination did not return ICMP echo reply within timeout.`;
      }

      // Persist into SQLite
      try {
        const db = getDb();
        db.prepare(`
          INSERT INTO route_history (
            timestamp, destination, target_ip, hop_count, hops_json,
            total_rtt_ms, route_fingerprint, has_changed, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          Date.now(),
          target.name,
          target.host,
          this.liveState.hops.length,
          JSON.stringify(this.liveState.hops),
          this.liveState.totalRttMs,
          this.liveState.routeFingerprint,
          this.liveState.routeChanged ? 1 : 0,
          'COMPLETED'
        );
      } catch (dbErr) {
        console.error('[RouteVision] SQLite save error:', dbErr.message);
      }
    });

    this.activeProcess.on('error', (err) => {
      this.isRunning = false;
      this.activeProcess = null;
      this.liveState.status = 'FAILED';
      this.liveState.explanation = `Execution failure: ${err.message}`;
    });

    return {
      success: true,
      traceId,
      destination: target.name,
      targetHost: target.host,
      status: 'TRACING'
    };
  }

  // Cancel trace
  cancelTrace() {
    if (this.activeProcess) {
      this.isCancelled = true;
      this.isRunning = false;
      this.activeProcess.kill();
      this.activeProcess = null;
      this.liveState.status = 'CANCELLED';
      this.liveState.explanation = 'Route trace cancelled.';
      return { success: true, message: 'Route trace cancelled.' };
    }
    return { success: false, message: 'No trace active to cancel.' };
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      ...this.liveState
    };
  }

  getHistory(destination = null, limit = 10) {
    try {
      const db = getDb();
      let rows;
      if (destination) {
        rows = db.prepare(`
          SELECT * FROM route_history
          WHERE target_ip = ? OR destination LIKE ?
          ORDER BY timestamp DESC LIMIT ?
        `).all(destination, `%${destination}%`, limit);
      } else {
        rows = db.prepare(`
          SELECT * FROM route_history
          ORDER BY timestamp DESC LIMIT ?
        `).all(limit);
      }

      return rows.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        dateStr: new Date(r.timestamp).toLocaleString(),
        destination: r.destination,
        targetIp: r.target_ip,
        hopCount: r.hop_count,
        totalRttMs: r.total_rtt_ms,
        routeFingerprint: r.route_fingerprint,
        hasChanged: r.has_changed === 1,
        status: r.status,
        hops: JSON.parse(r.hops_json || '[]')
      }));
    } catch (e) {
      return [];
    }
  }
}

const routeVisionEngine = new InternetRouteVisionEngine();
module.exports = routeVisionEngine;
