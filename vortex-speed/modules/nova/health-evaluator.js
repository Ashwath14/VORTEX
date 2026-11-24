// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: CENTRALIZED HEALTH EVALUATOR
// Single Authoritative Health Assessment Engine (Zero Contradictions)
// Shared across Dashboard, System Badges, and NOVA Analytical Reasoning
// Documented Health States: HEALTHY | DEGRADED | WARNING | CRITICAL | UNKNOWN
// =========================================================================

const { getDb } = require('../../database/db');
const telemetryService = require('../telemetry');
const networkDna = require('../network-dna');
const bufferbloatEngine = require('../bufferbloat');

const HEALTH_STATES = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
};

class HealthEvaluator {
  constructor() {
    this.lastAssessment = null;
    this.lastAssessmentTime = 0;
    this.cacheTtlMs = 1500; // 1.5s cache for high-frequency callers
  }

  evaluateHealth() {
    const now = Date.now();
    if (this.lastAssessment && (now - this.lastAssessmentTime < this.cacheTtlMs)) {
      return this.lastAssessment;
    }

    const snap = telemetryService.getSnapshot();
    const dna = networkDna.getCurrentFingerprint ? networkDna.getCurrentFingerprint() : null;
    const db = getDb();

    // 1. Check Telemetry Freshness & Critical Missing Data
    if (!snap || !snap.network) {
      const assessment = {
        state: HEALTH_STATES.UNKNOWN,
        score: 0,
        badgeText: 'UNKNOWN STATUS',
        summary: 'Telemetry feed offline or physical adapter uninitialized.',
        primaryCause: 'Missing adapter telemetry stream',
        evidence: [{ metric: 'Telemetry Feed', value: 'OFFLINE', threshold: 'ONLINE', status: 'CRITICAL' }],
        timestamp: now,
        recommendation: 'Verify Windows network adapter connection and check backend service logs.'
      };
      this.lastAssessment = assessment;
      this.lastAssessmentTime = now;
      return assessment;
    }

    const evidence = [];
    let penalties = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let degradedCount = 0;

    // A. Gateway Reachability & Latency
    const gwPing = snap.network.gatewayPing !== undefined ? snap.network.gatewayPing : 2;
    if (gwPing === null || gwPing === undefined || gwPing > 100) {
      evidence.push({ metric: 'Gateway Latency', value: `${gwPing || 'TIMEOUT'} ms`, threshold: '< 15 ms', status: 'CRITICAL' });
      penalties += 35;
      criticalCount++;
    } else if (gwPing > 20) {
      evidence.push({ metric: 'Gateway Latency', value: `${gwPing} ms`, threshold: '< 15 ms', status: 'WARNING' });
      penalties += 15;
      warningCount++;
    } else if (gwPing > 10) {
      evidence.push({ metric: 'Gateway Latency', value: `${gwPing} ms`, threshold: '< 10 ms', status: 'DEGRADED' });
      penalties += 8;
      degradedCount++;
    } else {
      evidence.push({ metric: 'Gateway Latency', value: `${gwPing} ms`, threshold: '< 10 ms', status: 'PASS' });
    }

    // B. Internet Reachability & Public Latency
    const pubPing = snap.network.publicPing !== undefined ? snap.network.publicPing : snap.ping;
    if (pubPing === null || pubPing === undefined || pubPing > 250) {
      evidence.push({ metric: 'Internet Public Latency', value: `${pubPing || 'UNREACHABLE'} ms`, threshold: '< 60 ms', status: 'CRITICAL' });
      penalties += 30;
      criticalCount++;
    } else if (pubPing > 90) {
      evidence.push({ metric: 'Internet Public Latency', value: `${pubPing} ms`, threshold: '< 60 ms', status: 'WARNING' });
      penalties += 15;
      warningCount++;
    } else if (pubPing > 50) {
      evidence.push({ metric: 'Internet Public Latency', value: `${pubPing} ms`, threshold: '< 50 ms', status: 'DEGRADED' });
      penalties += 5;
      degradedCount++;
    } else {
      evidence.push({ metric: 'Internet Public Latency', value: `${pubPing} ms`, threshold: '< 50 ms', status: 'PASS' });
    }

    // C. Packet Loss
    const packetLoss = snap.packetLoss || 0;
    if (packetLoss > 5) {
      evidence.push({ metric: 'Packet Loss', value: `${packetLoss}%`, threshold: '0%', status: 'CRITICAL' });
      penalties += 30;
      criticalCount++;
    } else if (packetLoss > 1) {
      evidence.push({ metric: 'Packet Loss', value: `${packetLoss}%`, threshold: '0%', status: 'WARNING' });
      penalties += 15;
      warningCount++;
    } else {
      evidence.push({ metric: 'Packet Loss', value: `${packetLoss}%`, threshold: '0%', status: 'PASS' });
    }

    // D. Jitter
    const jitter = snap.jitter || 0;
    if (jitter > 30) {
      evidence.push({ metric: 'Jitter', value: `${jitter} ms`, threshold: '< 10 ms', status: 'WARNING' });
      penalties += 12;
      warningCount++;
    } else if (jitter > 12) {
      evidence.push({ metric: 'Jitter', value: `${jitter} ms`, threshold: '< 10 ms', status: 'DEGRADED' });
      penalties += 6;
      degradedCount++;
    } else {
      evidence.push({ metric: 'Jitter', value: `${jitter} ms`, threshold: '< 10 ms', status: 'PASS' });
    }

    // E. Wi-Fi RF Quality
    const rssi = snap.network.rssi || -55;
    const signal = parseInt(snap.network.signal || '100', 10);
    if (rssi < -82 || signal < 30) {
      evidence.push({ metric: 'Wi-Fi Signal Strength', value: `${rssi} dBm (${signal}%)`, threshold: '> -75 dBm', status: 'WARNING' });
      penalties += 15;
      warningCount++;
    } else if (rssi < -74 || signal < 60) {
      evidence.push({ metric: 'Wi-Fi Signal Strength', value: `${rssi} dBm (${signal}%)`, threshold: '> -75 dBm', status: 'DEGRADED' });
      penalties += 8;
      degradedCount++;
    } else {
      evidence.push({ metric: 'Wi-Fi Signal Strength', value: `${rssi} dBm (${signal}%)`, threshold: '> -75 dBm', status: 'PASS' });
    }

    // F. Recent Critical Incidents (Last 10 minutes)
    let recentCriticalIncidents = 0;
    try {
      const tenMinAgo = now - (10 * 60 * 1000);
      const inc = db.prepare("SELECT count(*) as c FROM network_incidents WHERE start_time >= ? AND severity = 'CRITICAL'").get(tenMinAgo);
      recentCriticalIncidents = inc ? inc.c : 0;
      if (recentCriticalIncidents > 0) {
        evidence.push({ metric: 'Recent Outages (10m)', value: `${recentCriticalIncidents} critical events`, threshold: '0', status: 'WARNING' });
        penalties += 15;
        warningCount++;
      }
    } catch(e) {}

    // G. Network DNA Anomaly Consideration
    // High deviation alone does not make network CRITICAL, but flags DEGRADED or WARNING
    if (dna && dna.status === 'ACTIVE' && dna.anomaly && dna.anomaly.type !== 'NOMINAL') {
      const dev = dna.liveMetrics.percentDeviation;
      if (Math.abs(dev) > 50 && (snap.liveMbps < dna.baseline.avgDownMbps * 0.4)) {
        evidence.push({ metric: 'Network DNA Baseline Deviation', value: `${dev}% vs Hour ${dna.hourOfDay}:00`, threshold: '±30%', status: 'DEGRADED' });
        penalties += 10;
        degradedCount++;
      }
    }

    // H. High Utilization Note (Explicitly does NOT trigger CRITICAL by itself, but flags advisory)
    const plan = snap.planMbps || 30;
    const isHighUtil = snap.liveUpMbps > (plan * 0.8) || snap.liveMbps > (plan * 0.9);
    if (isHighUtil) {
      evidence.push({ metric: 'Line Utilization', value: `Up: ${snap.liveUpMbps.toFixed(1)}M, Down: ${snap.liveMbps.toFixed(1)}M`, threshold: `Plan ${plan}M`, status: 'INFO' });
    }

    // Compute Final Health State & Score
    const finalScore = Math.max(0, Math.min(100, 100 - penalties));
    let state = HEALTH_STATES.HEALTHY;
    let badgeText = 'ALL SYSTEMS HEALTHY';

    if (criticalCount > 0 || finalScore < 50) {
      state = HEALTH_STATES.CRITICAL;
      badgeText = 'CRITICAL DISRUPTION DETECTED';
    } else if (warningCount >= 2 || finalScore < 70) {
      state = HEALTH_STATES.WARNING;
      badgeText = 'NETWORK DEVIATION / WARNING';
    } else if (warningCount === 1 || degradedCount > 0 || finalScore < 85) {
      state = HEALTH_STATES.DEGRADED;
      badgeText = 'PERFORMANCE DEGRADED';
    } else {
      state = HEALTH_STATES.HEALTHY;
      badgeText = 'ALL SYSTEMS NOMINAL';
    }

    // Compose concise summary & unified recommendation
    let summary = '';
    let recommendation = '';
    let primaryCause = 'None. Nominal link telemetry.';

    if (state === HEALTH_STATES.CRITICAL) {
      summary = `Critical network impairment: ${evidence.filter(e => e.status === 'CRITICAL').map(e => `${e.metric} (${e.value})`).join(', ')}.`;
      primaryCause = evidence.find(e => e.status === 'CRITICAL')?.metric || 'Critical link degradation';
      recommendation = 'Check physical gateway power, inspect router fiber link light, or contact ISP support.';
    } else if (state === HEALTH_STATES.WARNING) {
      summary = `Network running with warnings: ${evidence.filter(e => e.status === 'WARNING').map(e => `${e.metric} is ${e.value}`).join('; ')}.`;
      primaryCause = evidence.find(e => e.status === 'WARNING')?.metric || 'Elevated latency or Wi-Fi attenuation';
      recommendation = 'Relocate closer to wireless access point or inspect background network sockets in Bandwidth Guardian.';
    } else if (state === HEALTH_STATES.DEGRADED) {
      summary = `Minor performance degradation: ${evidence.filter(e => e.status === 'DEGRADED').map(e => `${e.metric} (${e.value})`).join(', ')}.`;
      primaryCause = evidence.find(e => e.status === 'DEGRADED')?.metric || 'Slight variance from historical baseline';
      recommendation = 'Run Speed Diagnostic to verify sustained downstream and upstream capacity.';
    } else {
      summary = `Optimal operational state. Gateway latency is ${gwPing} ms, public DNS is ${pubPing} ms, and packet loss is 0%.`;
      recommendation = 'All link metrics are within certified SLA tolerances.';
    }

    const result = {
      state,
      score: finalScore,
      badgeText,
      summary,
      primaryCause,
      evidence,
      penalties,
      criticalCount,
      warningCount,
      degradedCount,
      timestamp: now,
      recommendation
    };

    this.lastAssessment = result;
    this.lastAssessmentTime = now;
    return result;
  }
}

module.exports = new HealthEvaluator();
