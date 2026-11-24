// =========================================================================
// VORTEX SPEED TITANIUM PRO // NOVA 2.0: INTENT & ENTITY UNDERSTANDING
// Semantic Pattern Recognition, Anaphora Resolution & Entity Extraction
// Robust Natural Language Parsing with Zero Hallucination
// =========================================================================

const INTENTS = {
  SPEED_TEST_ANALYSIS_HISTORICAL: 'SPEED_TEST_ANALYSIS_HISTORICAL',
  SPEED_SLOWNESS_DIAGNOSIS: 'SPEED_SLOWNESS_DIAGNOSIS',
  RECURRING_CONGESTION: 'RECURRING_CONGESTION',
  NETWORK_DNA_BASELINE: 'NETWORK_DNA_BASELINE',
  WIFI_ANALYSIS: 'WIFI_ANALYSIS',
  BOTTLENECK_ISOLATION: 'BOTTLENECK_ISOLATION',
  DEVICE_RADAR_AUDIT: 'DEVICE_RADAR_AUDIT',
  BUFFERBLOAT_ANALYSIS: 'BUFFERBLOAT_ANALYSIS',
  GAMING_DIAGNOSIS: 'GAMING_DIAGNOSIS',
  STREAMING_4K: 'STREAMING_4K',
  ISP_SLA_AUDIT: 'ISP_SLA_AUDIT',
  ROUTE_VISION: 'ROUTE_VISION',
  HEALTH_OVERALL: 'HEALTH_OVERALL',
  BANDWIDTH_HOGS: 'BANDWIDTH_HOGS',
  FOLLOW_UP_ACTION_RECOMMENDATION: 'FOLLOW_UP_ACTION_RECOMMENDATION',
  ACTION_TRIGGER: 'ACTION_TRIGGER',
  GENERAL_QUERY: 'GENERAL_QUERY'
};

class IntentEngine {
  constructor() {}

  parse(queryText, sessionContext = {}) {
    const raw = (queryText || '').trim();
    const q = raw.toLowerCase();

    const entities = this.extractEntities(q);

    // 1. Check for Direct Action Triggers (e.g., "run a speed test", "retest", "flush dns")
    const actionIntent = this.matchActionTrigger(q);
    if (actionIntent) {
      return {
        intent: INTENTS.ACTION_TRIGGER,
        actionKey: actionIntent.actionKey,
        confidence: 0.95,
        entities,
        raw
      };
    }

    // 2. Check for Contextual Follow-up Questions
    // e.g., "Is it because of Wi-Fi?", "Is that my router?", "What should I do?"
    if (this.isFollowUp(q, sessionContext)) {
      if (q.includes('what should i do') || q.includes('how do i fix') || q.includes('next steps') || q.includes('recommendation') || q.includes('how to solve')) {
        return {
          intent: INTENTS.FOLLOW_UP_ACTION_RECOMMENDATION,
          targetContext: sessionContext.lastDiagnosis || sessionContext.lastTopic || 'GENERAL',
          confidence: 0.95,
          entities,
          raw
        };
      }
      if (q.includes('wifi') || q.includes('wi-fi') || q.includes('wireless') || q.includes('signal') || q.includes('router')) {
        return {
          intent: INTENTS.WIFI_ANALYSIS,
          isFollowUpToSlowness: sessionContext.lastTopic === 'SLOWNESS' || sessionContext.lastTopic === 'BOTTLENECK',
          confidence: 0.92,
          entities,
          raw
        };
      }
      if (q.includes('isp') || q.includes('provider') || q.includes('jio')) {
        return {
          intent: INTENTS.ISP_SLA_AUDIT,
          isFollowUp: true,
          confidence: 0.90,
          entities,
          raw
        };
      }
    }

    // 3. Historical Speed Test Comparison
    // Matches: "compare my last five speed tests", "how fast have my speed tests been?", "show last 5 tests",
    // "has my internet speed changed recently?", "am i getting the same speed every time?", "show how my download performance has changed"
    if (
      (q.includes('speed test') || q.includes('tests') || q.includes('tested')) &&
      (q.includes('last') || q.includes('compare') || q.includes('history') || q.includes('recent') || q.includes('change') || q.includes('five') || q.includes('5') || q.includes('previous') || q.includes('same speed') || q.includes('trend'))
    ) {
      return {
        intent: INTENTS.SPEED_TEST_ANALYSIS_HISTORICAL,
        limit: entities.sampleCount || 5,
        confidence: 0.95,
        entities,
        raw
      };
    }
    if (q.includes('compare') && (q.includes('speed') || q.includes('download') || q.includes('test'))) {
      return {
        intent: INTENTS.SPEED_TEST_ANALYSIS_HISTORICAL,
        limit: entities.sampleCount || 5,
        confidence: 0.90,
        entities,
        raw
      };
    }
    if (q.includes('has my internet speed changed') || q.includes('am i getting the same speed') || q.includes('download performance has changed')) {
      return {
        intent: INTENTS.SPEED_TEST_ANALYSIS_HISTORICAL,
        limit: 5,
        confidence: 0.92,
        entities,
        raw
      };
    }

    // 4. Recurring Congestion / Peak Hours
    // Matches: "recurring congestion", "when is my internet slowest?", "busiest hours", "peak hours", "slowest time of day"
    if (
      q.includes('recurring') ||
      (q.includes('slowest') && (q.includes('hour') || q.includes('time') || q.includes('day') || q.includes('when'))) ||
      (q.includes('busiest') || q.includes('peak hour') || q.includes('congestion pattern') || q.includes('traffic pattern')) ||
      q.includes('highest latency') ||
      (q.includes('time of day') && (q.includes('latency') || q.includes('ping') || q.includes('slow')))
    ) {
      return {
        intent: INTENTS.RECURRING_CONGESTION,
        confidence: 0.94,
        entities,
        raw
      };
    }

    // 5. Bottleneck Isolation & Root Cause Identification
    // Matches: "where is the bottleneck?", "is it my router or my isp?", "find the bottleneck", "is the issue on my end or external"
    if (
      q.includes('bottleneck') ||
      (q.includes('router or') && (q.includes('isp') || q.includes('external'))) ||
      q.includes('where is the lag coming from') ||
      q.includes('who is at fault') ||
      q.includes('local or external')
    ) {
      return {
        intent: INTENTS.BOTTLENECK_ISOLATION,
        confidence: 0.94,
        entities,
        raw
      };
    }

    // 6. Network DNA & Baselines
    // Matches: "network dna", "statistical baseline", "am i deviating from normal?", "is this speed normal", "fingerprint"
    if (
      q.includes('dna') ||
      q.includes('baseline') ||
      q.includes('fingerprint') ||
      q.includes('deviating from normal') ||
      q.includes('normal for this time') ||
      (q.includes('normal') && (q.includes('speed') || q.includes('rate') || q.includes('this time') || q.includes('is this')))
    ) {
      return {
        intent: INTENTS.NETWORK_DNA_BASELINE,
        confidence: 0.92,
        entities,
        raw
      };
    }

    // 7. Device Radar / Connected Clients
    // Matches: "who is on my wifi?", "devices connected", "scan network", "unknown devices", "device radar"
    if (
      q.includes('device') ||
      (q.includes('who') && (q.includes('wifi') || q.includes('network') || q.includes('connected'))) ||
      q.includes('connected to my') ||
      q.includes('radar') ||
      q.includes('intruder') ||
      q.includes('stations')
    ) {
      return {
        intent: INTENTS.DEVICE_RADAR_AUDIT,
        confidence: 0.93,
        entities,
        raw
      };
    }

    // 8. Bufferbloat & Loaded Latency
    // Matches: "bufferbloat", "loaded latency", "sqm", "ping spike while downloading", "bufferbloat autopsy"
    if (
      q.includes('bufferbloat') ||
      q.includes('loaded latency') ||
      q.includes('bloat') ||
      q.includes('sqm') ||
      (q.includes('ping spike') && q.includes('download'))
    ) {
      return {
        intent: INTENTS.BUFFERBLOAT_ANALYSIS,
        confidence: 0.95,
        entities,
        raw
      };
    }

    // 9. Gaming & Competitive Ping
    // Matches: "can i play valorant?", "gaming latency", "is my connection good for gaming?", "csgo ping", "lag in games"
    if (
      q.includes('game') ||
      q.includes('gaming') ||
      q.includes('valorant') ||
      q.includes('csgo') ||
      q.includes('fortnite') ||
      q.includes('packet loss in games')
    ) {
      return {
        intent: INTENTS.GAMING_DIAGNOSIS,
        confidence: 0.92,
        entities,
        raw
      };
    }

    // 10. Streaming & 4K Capability
    // Matches: "can i stream 4k?", "netflix 4k", "buffering on youtube", "bitrate for 4k"
    if (
      q.includes('4k') ||
      q.includes('stream') ||
      q.includes('netflix') ||
      q.includes('buffering')
    ) {
      return {
        intent: INTENTS.STREAMING_4K,
        confidence: 0.91,
        entities,
        raw
      };
    }

    // 11. ISP SLA & Contract Compliance
    // Matches: "is my isp cheating me?", "am i getting what i paid for?", "jiofiber plan", "sla compliance", "advertised speed"
    if (
      q.includes('isp') ||
      q.includes('jio') ||
      q.includes('cheating') ||
      q.includes('plan compliance') ||
      q.includes('getting what i paid for') ||
      q.includes('sla')
    ) {
      return {
        intent: INTENTS.ISP_SLA_AUDIT,
        confidence: 0.93,
        entities,
        raw
      };
    }

    // 12. Wi-Fi RF Lab
    // Matches: "is something wrong with my wifi?", "wifi signal", "wifi channel", "wireless interference", "rssi"
    if (
      q.includes('wifi') ||
      q.includes('wi-fi') ||
      q.includes('signal strength') ||
      q.includes('channel') ||
      q.includes('rssi') ||
      q.includes('wireless')
    ) {
      return {
        intent: INTENTS.WIFI_ANALYSIS,
        confidence: 0.90,
        entities,
        raw
      };
    }

    // 13. Route Vision / Traceroute
    // Matches: "check route", "traceroute", "hop count", "transit route", "route vision"
    if (
      q.includes('route') ||
      q.includes('traceroute') ||
      q.includes('hops') ||
      q.includes('transit')
    ) {
      return {
        intent: INTENTS.ROUTE_VISION,
        confidence: 0.91,
        entities,
        raw
      };
    }

    // 14. Bandwidth Hogs / Process Traffic
    // Matches: "what is using my bandwidth?", "process traffic", "bandwidth guardian", "data hogs"
    if (
      (q.includes('what') || q.includes('which app') || q.includes('process')) &&
      (q.includes('using') || q.includes('consuming') || q.includes('hogging')) &&
      (q.includes('bandwidth') || q.includes('data') || q.includes('internet'))
    ) {
      return {
        intent: INTENTS.BANDWIDTH_HOGS,
        confidence: 0.92,
        entities,
        raw
      };
    }

    // 15. General Slowness / Comprehensive Connection Investigation
    // Matches: "why is my internet slow?", "my connection feels slow. can you investigate?",
    // "what is affecting my network performance?", "diagnose my connection", "investigate my connection"
    if (
      q.includes('slow') ||
      q.includes('speed') ||
      q.includes('lag') ||
      q.includes('diagnose') ||
      q.includes('investigate') ||
      q.includes('performance') ||
      q.includes('affecting') ||
      q.includes('why is my internet')
    ) {
      return {
        intent: INTENTS.SPEED_SLOWNESS_DIAGNOSIS,
        confidence: 0.90,
        entities,
        raw
      };
    }

    // 16. Overall Network Health Assessment
    // Matches: "network health", "overall status", "is everything ok?", "system status"
    if (
      q.includes('health') ||
      q.includes('status') ||
      q.includes('everything ok') ||
      q.includes('all systems') ||
      q.includes('how is the network')
    ) {
      return {
        intent: INTENTS.HEALTH_OVERALL,
        confidence: 0.90,
        entities,
        raw
      };
    }

    // Default Fallback: General Diagnostic Overview
    return {
      intent: INTENTS.GENERAL_QUERY,
      confidence: 0.50,
      entities,
      raw
    };
  }

  isFollowUp(q, sessionContext) {
    if (!sessionContext || !sessionContext.lastTopic) return false;
    const followUpMarkers = [
      'is it because',
      'is that',
      'could it be',
      'what should i do',
      'how do i fix',
      'what now',
      'what are the next steps',
      'and my wifi',
      'what about wifi',
      'which one',
      'tell me more'
    ];
    return followUpMarkers.some(m => q.includes(m)) || q.startsWith('is it') || q.startsWith('what about');
  }

  matchActionTrigger(q) {
    if (q.includes('run a speed test') || q.includes('start speed test') || q.includes('retest') || q.includes('test my speed')) {
      return { actionKey: 'RUN_SPEED_TEST' };
    }
    if (q.includes('flush dns') || q.includes('clear dns')) {
      return { actionKey: 'FLUSH_DNS' };
    }
    if (q.includes('scan devices') || q.includes('sweep network') || q.includes('discover devices')) {
      return { actionKey: 'SCAN_DEVICES' };
    }
    if (q.includes('check gateway') || q.includes('probe gateway')) {
      return { actionKey: 'CHECK_GATEWAY' };
    }
    if (q.includes('run bufferbloat test') || q.includes('test bufferbloat')) {
      return { actionKey: 'RUN_BUFFERBLOAT_TEST' };
    }
    if (q.includes('recalculate dna') || q.includes('recompute baselines')) {
      return { actionKey: 'RECALCULATE_DNA' };
    }
    if (q.includes('generate report') || q.includes('create network report')) {
      return { actionKey: 'GENERATE_REPORT' };
    }
    return null;
  }

  extractEntities(q) {
    const entities = {};

    // 1. Number of samples (e.g. "5", "five", "last 3", "10")
    const numWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    for (const [w, n] of Object.entries(numWords)) {
      if (q.includes(` ${w} `) || q.endsWith(` ${w}`)) {
        entities.sampleCount = n;
        break;
      }
    }
    const digitMatch = q.match(/\b([1-9]|[1-4][0-9]|50)\b/);
    if (digitMatch && !entities.sampleCount) {
      entities.sampleCount = parseInt(digitMatch[1], 10);
    }

    // 2. Targets
    if (q.includes('wifi') || q.includes('wireless')) entities.target = 'WIFI';
    if (q.includes('gateway') || q.includes('router')) entities.target = 'GATEWAY';
    if (q.includes('isp') || q.includes('jio')) entities.target = 'ISP';
    if (q.includes('cloudflare')) entities.target = 'CLOUDFLARE';

    return entities;
  }
}

module.exports = {
  IntentEngine: new IntentEngine(),
  INTENTS
};
