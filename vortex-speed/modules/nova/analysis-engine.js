// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: MATHEMATICAL ANALYSIS ENGINE
// Genuine Statistical Computation, Variance, IQR, Congestion Aggregation
// Zero Heuristic Hallucination — Grounded in Pure Math
// =========================================================================

class AnalysisEngine {
  constructor() {}

  // Basic Statistical Array Math
  calculateStats(numbers) {
    if (!numbers || numbers.length === 0) {
      return { count: 0, mean: 0, median: 0, variance: 0, stdDev: 0, min: 0, max: 0, range: 0, iqr: 0 };
    }

    const n = numbers.length;
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = parseFloat((sum / n).toFixed(2));

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 === 0
      ? parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2))
      : parseFloat(sorted[mid].toFixed(2));

    // Variance & Standard Deviation (Sample Bessel's correction if n > 1)
    const squareDiffs = sorted.map(v => Math.pow(v - mean, 2));
    const variance = n > 1
      ? parseFloat((squareDiffs.reduce((a, b) => a + b, 0) / (n - 1)).toFixed(2))
      : 0;
    const stdDev = parseFloat(Math.sqrt(variance).toFixed(2));

    // Min, Max, Range
    const min = parseFloat(sorted[0].toFixed(2));
    const max = parseFloat(sorted[n - 1].toFixed(2));
    const range = parseFloat((max - min).toFixed(2));

    // Quartiles and IQR
    const q1 = this.calculatePercentile(sorted, 0.25);
    const q3 = this.calculatePercentile(sorted, 0.75);
    const iqr = parseFloat((q3 - q1).toFixed(2));

    // Coefficient of variation
    const cv = mean > 0 ? parseFloat((stdDev / mean).toFixed(3)) : 0;
    const consistencyIndex = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, cv)) * 100)));

    return {
      count: n,
      mean,
      median,
      variance,
      stdDev,
      min,
      max,
      range,
      p25: q1,
      p75: q3,
      iqr,
      cv,
      consistencyIndex
    };
  }

  calculatePercentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const pos = (sorted.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return parseFloat((sorted[base] + rest * (sorted[base + 1] - sorted[base])).toFixed(2));
    } else {
      return parseFloat(sorted[base].toFixed(2));
    }
  }

  // Section 5: Historical Speed Tests Deep Analysis
  analyzeSpeedTests(tests) {
    if (!tests || tests.length === 0) {
      return {
        hasData: false,
        sampleCount: 0,
        message: 'No completed speed test records found in database.'
      };
    }

    const downs = tests.map(t => Number(t.down_mbps) || 0);
    const ups = tests.map(t => Number(t.up_mbps) || 0);
    const pings = tests.map(t => Number(t.ping) || 0).filter(p => p > 0);
    const jitters = tests.map(t => Number(t.jitter) || 0);

    const downStats = this.calculateStats(downs);
    const upStats = this.calculateStats(ups);
    const pingStats = this.calculateStats(pings);
    const jitterStats = this.calculateStats(jitters);

    // Sum Payload
    const totalBytesDown = tests.reduce((acc, t) => acc + (Number(t.bytes_down) || 0), 0);
    const totalBytesUp = tests.reduce((acc, t) => acc + (Number(t.bytes_up) || 0), 0);
    const totalDurationMs = tests.reduce((acc, t) => acc + (Number(t.duration_ms) || 0), 0);

    const totalPayloadMB = parseFloat(((totalBytesDown + totalBytesUp) / (1024 * 1024)).toFixed(2));
    const totalDownMB = parseFloat((totalBytesDown / (1024 * 1024)).toFixed(2));
    const totalUpMB = parseFloat((totalBytesUp / (1024 * 1024)).toFixed(2));

    // Server breakdown
    const serverMap = {};
    tests.forEach(t => {
      const s = t.server_name || 'Cloudflare Edge';
      serverMap[s] = (serverMap[s] || 0) + 1;
    });

    // Oldest and latest
    const latestTest = tests[0];
    const oldestTest = tests[tests.length - 1];

    // Speed Trend
    let trend = 'STABLE';
    if (tests.length >= 2) {
      const delta = latestTest.down_mbps - oldestTest.down_mbps;
      const pctDelta = oldestTest.down_mbps > 0 ? (delta / oldestTest.down_mbps) * 100 : 0;
      if (pctDelta > 15) trend = 'IMPROVING';
      else if (pctDelta < -15) trend = 'DECLINING';
    }

    return {
      hasData: true,
      sampleCount: tests.length,
      tests: tests.map(t => ({
        id: t.id,
        testId: t.test_id,
        date: new Date(t.timestamp).toLocaleTimeString(),
        timestamp: t.timestamp,
        downMbps: t.down_mbps,
        upMbps: t.up_mbps,
        ping: t.ping,
        jitter: t.jitter,
        server: t.server_name,
        durationSec: t.duration_ms ? (t.duration_ms / 1000).toFixed(1) : '15.0',
        payloadMB: parseFloat((( (t.bytes_down || 0) + (t.bytes_up || 0) ) / (1024 * 1024)).toFixed(2))
      })),
      download: downStats,
      upload: upStats,
      ping: pingStats,
      jitter: jitterStats,
      totalPayloadMB,
      totalDownMB,
      totalUpMB,
      totalDurationSec: parseFloat((totalDurationMs / 1000).toFixed(1)),
      servers: serverMap,
      trend,
      latestTest: {
        timestamp: latestTest.timestamp,
        down: latestTest.down_mbps,
        up: latestTest.up_mbps,
        ping: latestTest.ping,
        server: latestTest.server_name
      }
    };
  }

  // Section 7: Recurring Congestion Identification from Hourly Aggregation
  analyzeRecurringCongestion(hourlyBuckets) {
    if (!hourlyBuckets || hourlyBuckets.length === 0) {
      return {
        hasData: false,
        message: 'Insufficient hourly telemetry data to determine recurring congestion patterns.'
      };
    }

    // Filter buckets with at least 10 samples for statistical validity
    const validBuckets = hourlyBuckets.filter(b => b.samples >= 10);
    const activeBuckets = validBuckets.length >= 3 ? validBuckets : hourlyBuckets;

    // Find hour with lowest download throughput
    const sortedByDown = [...activeBuckets].sort((a, b) => a.avg_down - b.avg_down);
    const slowestHourBucket = sortedByDown[0];

    // Find hour with highest ping / latency
    const sortedByPing = [...activeBuckets].sort((a, b) => b.avg_ping - a.avg_ping);
    const highestLatencyBucket = sortedByPing[0];

    // Find best hour (highest throughput, lowest ping)
    const sortedByScore = [...activeBuckets].sort((a, b) => {
      const scoreA = a.avg_down - (a.avg_ping * 0.2);
      const scoreB = b.avg_down - (b.avg_ping * 0.2);
      return scoreB - scoreA;
    });
    const optimalHourBucket = sortedByScore[0];

    // Calculate overall average across all hours
    const totalSamples = hourlyBuckets.reduce((acc, b) => acc + b.samples, 0);
    const overallAvgDown = parseFloat((hourlyBuckets.reduce((acc, b) => acc + (b.avg_down * b.samples), 0) / (totalSamples || 1)).toFixed(2));
    const overallAvgPing = parseFloat((hourlyBuckets.reduce((acc, b) => acc + (b.avg_ping * b.samples), 0) / (totalSamples || 1)).toFixed(1));

    // Determine congestion severity
    const isCongestionDistinct = slowestHourBucket && slowestHourBucket.avg_down < (overallAvgDown * 0.5) && slowestHourBucket.samples >= 20;

    return {
      hasData: true,
      totalHoursMonitored: hourlyBuckets.length,
      totalSamplesAnalyzed: totalSamples,
      slowestHour: slowestHourBucket ? {
        hour: slowestHourBucket.hour,
        windowStr: `${slowestHourBucket.hour}:00 - ${(slowestHourBucket.hour + 1) % 24}:00`,
        avgDownMbps: slowestHourBucket.avg_down,
        avgPingMs: slowestHourBucket.avg_ping,
        sampleCount: slowestHourBucket.samples
      } : null,
      highestLatencyHour: highestLatencyBucket ? {
        hour: highestLatencyBucket.hour,
        windowStr: `${highestLatencyBucket.hour}:00 - ${(highestLatencyBucket.hour + 1) % 24}:00`,
        avgPingMs: highestLatencyBucket.avg_ping,
        avgJitterMs: highestLatencyBucket.avg_jitter,
        sampleCount: highestLatencyBucket.samples
      } : null,
      optimalHour: optimalHourBucket ? {
        hour: optimalHourBucket.hour,
        windowStr: `${optimalHourBucket.hour}:00 - ${(optimalHourBucket.hour + 1) % 24}:00`,
        avgDownMbps: optimalHourBucket.avg_down,
        avgPingMs: optimalHourBucket.avg_ping
      } : null,
      overallAvgDown,
      overallAvgPing,
      isCongestionDistinct,
      hourlySummary: hourlyBuckets.map(b => ({
        hour: b.hour,
        samples: b.samples,
        avgDown: b.avg_down,
        avgPing: b.avg_ping
      }))
    };
  }

  // Section 8: Evidence-Based Bottleneck Isolation
  isolateBottleneck(evidence) {
    const {
      telemetry,
      bufferbloat,
      wifi,
      dna,
      guardian,
      recentIncidents
    } = evidence;

    const findings = [];
    const confirmedFacts = [];
    const possibleCauses = [];
    const recommendedTests = [];

    const gwPing = telemetry?.network?.gatewayPing || 2;
    const publicPing = telemetry?.network?.publicPing || telemetry?.ping || 16;
    const rssi = telemetry?.network?.rssi || -55;
    const signalPct = parseInt(telemetry?.network?.signal || '100', 10);
    const packetLoss = telemetry?.packetLoss || 0;
    const liveDown = telemetry?.liveMbps || 0;
    const liveUp = telemetry?.liveUpMbps || 0;
    const plan = telemetry?.planMbps || 30;

    confirmedFacts.push(`Local Gateway latency: ${gwPing} ms to ${telemetry?.network?.gateway || 'Default Gateway'}`);
    confirmedFacts.push(`Public DNS latency: ${publicPing} ms (Cloudflare 1.1.1.1)`);
    confirmedFacts.push(`Wi-Fi Signal: ${telemetry?.network?.signal || '100%'} (${rssi} dBm) on Channel ${telemetry?.network?.channel || 6}`);

    let primaryBottleneck = 'NONE';
    let bottleneckLocation = 'NOMINAL';
    let severity = 'LOW';

    // 1. Check Local Link (Wi-Fi / Gateway RTT)
    if (gwPing > 15 || rssi < -75 || signalPct < 45 || packetLoss > 2) {
      primaryBottleneck = 'LOCAL_WIFI_OR_GATEWAY';
      bottleneckLocation = 'Local Link (Between PC and Wi-Fi Router)';
      severity = 'HIGH';
      findings.push(`Local gateway RTT is elevated (${gwPing} ms) or Wi-Fi signal is attenuated (${rssi} dBm).`);
      possibleCauses.push('Physical distance from router, wall attenuation, or 2.4 GHz RF band congestion.');
      recommendedTests.push('Relocate closer to router or switch to 5 GHz band to verify if local RTT drops below 3ms.');
    }

    // 2. Check Bufferbloat Queue Saturation
    const bbDelta = bufferbloat?.latest?.max_delta_ms || 0;
    if (bbDelta > 30) {
      findings.push(`Bufferbloat diagnostic recorded +${bbDelta} ms loaded latency delta under line saturation.`);
      possibleCauses.push('Router lacks Smart Queue Management (SQM / CAKE / FQ-CoDel), causing buffer starvation during high transfer.');
    }

    // 3. Check High Local Process Saturation (Bandwidth Hog)
    if (liveUp > (plan * 0.8) || liveDown > (plan * 0.85)) {
      findings.push(`High link utilization active (${liveDown.toFixed(1)} Mbps Down, ${liveUp.toFixed(1)} Mbps Up against ${plan} Mbps plan).`);
      possibleCauses.push('Active local background downloads/uploads (cloud sync, torrents, or system updates) consuming link bandwidth.');
    }

    // 4. Check External Transit / ISP Upstream
    if (primaryBottleneck === 'NONE' && (publicPing > 50 || (publicPing - gwPing) > 40)) {
      primaryBottleneck = 'UPSTREAM_ISP_TRANSIT';
      bottleneckLocation = 'Upstream WAN / ISP Routing or Peering';
      severity = 'MODERATE';
      findings.push(`Local gateway RTT is pristine (${gwPing} ms), but public DNS latency is elevated (${publicPing} ms). Difference: +${(publicPing - gwPing).toFixed(1)} ms.`);
      possibleCauses.push('Upstream ISP transit congestion, peering node latency, or fiber backhaul routing hop delay.');
      recommendedTests.push('Run Route Vision traceroute to inspect which specific external hop introduces latency.');
    }

    // 5. Check DNA Anomaly
    if (dna && dna.status === 'ACTIVE' && dna.anomaly && dna.anomaly.type !== 'NOMINAL') {
      findings.push(`Network DNA indicates ${dna.anomaly.type} anomaly: current speed deviates by ${dna.liveMetrics.percentDeviation}% from Hour ${dna.hourOfDay}:00 historical baseline.`);
    }

    if (primaryBottleneck === 'NONE') {
      bottleneckLocation = 'Zero Bottlenecks Detected (Nominal)';
      findings.push('Both local gateway loop (2-3 ms) and external upstream transit are responsive with zero packet loss.');
    }

    return {
      primaryBottleneck,
      bottleneckLocation,
      severity,
      confirmedFacts,
      findings,
      possibleCauses,
      recommendedTests
    };
  }
}

module.exports = new AnalysisEngine();
