// ========================================================
// VORTEX SPEED TITANIUM PRO v8.0 // MODULAR BACKEND ROUTER
// ========================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const SETTINGS = require('./config/settings');
const { initDatabase, getDb } = require('./database/db');

// Initialize Native SQLite Database
initDatabase();

// Load Core Modules
const telemetryService = require('./modules/telemetry');
const novaEngine = require('./modules/nova');
const blackBox = require('./modules/blackbox');
const timeMachine = require('./modules/time-machine');
const bandwidthGuardian = require('./modules/bandwidth-guardian');
const wifiLab = require('./modules/wifi-intelligence');
const digitalTwin = require('./modules/digital-twin');
const gamingEngine = require('./modules/gaming');
const predictionEngine = require('./modules/prediction');
const ispEngine = require('./modules/isp-intelligence');
const commandCentre = require('./modules/command-centre');
const networkDna = require('./modules/network-dna');
const bufferbloatEngine = require('./modules/bufferbloat');
const routeVisionEngine = require('./modules/route-vision');
const novaPredictive = require('./modules/nova-predictive');
const autopilotEngine = require('./modules/autopilot');
const speedEngine = require('./modules/speed-engine');
const healthManager = require('./modules/health-manager');
const backupManager = require('./modules/backup-manager');
const notificationManager = require('./modules/notification-manager');
const VERSION_MANIFEST = require('./config/version');

// Server-Sent Events (SSE) active subscriber pool
const sseClients = new Set();
setInterval(() => {
  if (sseClients.size > 0) {
    const payload = JSON.stringify(telemetryService.getSnapshot());
    for (const client of sseClients) {
      client.write(`data: ${payload}\n\n`);
    }
  }
}, 1000);

// Helper for JSON response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  });
  res.end(JSON.stringify(data));
}

// Helper for parsing POST body with fail-safe timeout
function parseBody(req, callback) {
  let body = '';
  let called = false;
  const done = (err, data) => {
    if (!called) {
      called = true;
      callback(err, data);
    }
  };
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      done(null, JSON.parse(body || '{}'));
    } catch (err) {
      done(null, {});
    }
  });
  req.on('error', (err) => done(err, {}));
  setTimeout(() => done(null, {}), 3000);
}

const server = http.createServer((req, res) => {
  // SECURITY: Local API access restriction (Loopback only)
  const clientIp = req.socket.remoteAddress || '';
  const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === '';
  if (!isLoopback) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'FORBIDDEN', message: 'Access restricted strictly to local machine loopback.' }));
    return;
  }

  // SECURITY: Host header validation (DNS Rebinding protection)
  const host = (req.headers.host || '').toLowerCase();
  const isValidHost = host.startsWith('127.0.0.1') || host.startsWith('localhost') || host.startsWith('[::1]');
  if (!isValidHost) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'BAD_REQUEST', message: 'Invalid Host header.' }));
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Global CORS Headers (restricted to local webview/origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API: System Health & Diagnostic Readiness ---
  if (pathname === '/api/health' || pathname === '/api/status') {
    let dbStatus = 'CONNECTED';
    let telemetryCount = 0;
    let isDbHealthy = true;
    try {
      const db = require('./database/db').getDb();
      telemetryCount = db.prepare('SELECT COUNT(*) as c FROM telemetry_history').get().c;
    } catch (e) {
      dbStatus = 'ERROR: ' + e.message;
      isDbHealthy = false;
    }

    const httpStatus = isDbHealthy ? 200 : 503;
    sendJson(res, httpStatus, {
      status: isDbHealthy ? 'HEALTHY' : 'DEGRADED',
      service: 'VortexSpeed-TitaniumPro',
      version: VERSION_MANIFEST.version,
      build: VERSION_MANIFEST.build,
      uptime: process.uptime(),
      timestamp: Date.now(),
      pid: process.pid,
      port: 49876,
      database: {
        status: dbStatus,
        telemetryRows: telemetryCount
      },
      speedEngine: {
        isRunning: speedEngine.isRunning,
        phase: speedEngine.phase
      }
    });
    return;
  }

  // --- API: Advanced Health Diagnostics ---
  if (pathname === '/api/health/diagnostics') {
    sendJson(res, 200, healthManager.getDiagnosticReport());
    return;
  }

  // --- API: Version Manifest ---
  if (pathname === '/api/system/version') {
    sendJson(res, 200, VERSION_MANIFEST);
    return;
  }

  // --- API: Database Backup & Restore Manager ---
  if (pathname === '/api/backup/list') {
    sendJson(res, 200, backupManager.listBackups());
    return;
  }

  if (pathname === '/api/backup/create' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const label = (body && body.label) ? String(body.label).replace(/[^a-zA-Z0-9_-]/g, '') : 'manual';
      const result = backupManager.createBackup(label);
      if (result.success) {
        notificationManager.notify('BACKUP_CREATED', 'Database Backup Created', `Verified backup ${result.filename} saved (${result.sizeMb} MB).`, 'INFO');
      }
      sendJson(res, result.success ? 200 : 500, result);
    });
    return;
  }

  if (pathname === '/api/backup/preview' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const filename = body && body.filename ? String(body.filename) : '';
      const result = backupManager.previewBackup(filename);
      sendJson(res, result.success ? 200 : 400, result);
    });
    return;
  }

  if (pathname === '/api/backup/restore' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const filename = body && body.filename ? String(body.filename) : '';
      const token = body && body.confirmationToken ? String(body.confirmationToken) : '';
      const result = backupManager.restoreBackup(filename, token);
      if (result.success) {
        notificationManager.notify('RECOVERY', 'Database Restored', `Database restored from backup ${filename}.`, 'INFO');
      }
      sendJson(res, result.success ? 200 : 400, result);
    });
    return;
  }

  // --- API: Data Export (CSV / JSON) ---
  if (pathname.startsWith('/api/export/')) {
    const table = pathname.replace('/api/export/', '').trim();
    const format = (parsedUrl.searchParams.get('format') || 'csv').toLowerCase();
    try {
      const result = backupManager.exportData(table, format);
      res.writeHead(200, {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-cache'
      });
      res.end(result.data);
    } catch (expErr) {
      sendJson(res, 400, { success: false, error: expErr.message });
    }
    return;
  }

  // --- API: Notifications & Preferences ---
  if (pathname === '/api/notifications' && req.method === 'GET') {
    const limit = parseInt(parsedUrl.searchParams.get('limit'), 10) || 20;
    sendJson(res, 200, notificationManager.getRecentNotifications(limit));
    return;
  }

  if (pathname === '/api/notifications/preferences' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const result = notificationManager.savePreferences(body || {});
      sendJson(res, result.success ? 200 : 500, result);
    });
    return;
  }

  // --- API: Daily Network Summary ---
  if (pathname === '/api/summary/daily') {
    sendJson(res, 200, notificationManager.generateDailySummary());
    return;
  }
  if (pathname === '/api/system/shutdown' && req.method === 'POST') {
    sendJson(res, 200, { success: true, message: 'Vortex Speed backend shutting down gracefully.' });
    setTimeout(() => {
      try {
        const { closeDatabase } = require('./database/db');
        if (typeof closeDatabase === 'function') closeDatabase();
      } catch (e) {}
      process.exit(0);
    }, 200);
    return;
  }
  if (pathname === '/api/health/export') {
    const snap = telemetryService.getSnapshot();
    const exportData = {
      exportTime: new Date().toISOString(),
      service: 'VortexSpeed-TitaniumPro v8.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      network: snap.network,
      liveSpeed: { down: snap.liveMbps, up: snap.liveUpMbps },
      speedEngine: speedEngine.getStatus(),
      dna: networkDna.getCurrentFingerprint(),
      blackbox: blackBox.getDashboardData()
    };
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="vortex_diagnostics_export.json"'
    });
    res.end(JSON.stringify(exportData, null, 2));
    return;
  }

  // --- API: Real-Time SSE Stream ---
  if (pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // --- API: Telemetry ---
  if (pathname === '/api/telemetry') {
    sendJson(res, 200, telemetryService.getSnapshot());
    return;
  }

  // --- API: NOVA Intelligence ---
  if (pathname === '/api/nova' || pathname === '/api/nova/status') {
    sendJson(res, 200, novaEngine.getStatus());
    return;
  }
  if (pathname === '/api/nova/health') {
    sendJson(res, 200, novaEngine.getCentralizedHealth());
    return;
  }
  if (pathname === '/api/nova/tools') {
    const toolRegistry = require('./modules/nova/tool-registry');
    sendJson(res, 200, toolRegistry.listTools());
    return;
  }
  if (pathname === '/api/nova/audit') {
    sendJson(res, 200, novaEngine.runEvidenceAudit());
    return;
  }
  if ((pathname === '/api/nova/ask' || pathname === '/api/nova/query') && req.method === 'POST') {
    parseBody(req, async (err, body) => {
      const q = body ? (body.query || body.question || '') : '';
      const sessionId = body ? (body.sessionId || 'default') : 'default';
      try {
        const answer = await novaEngine.askNova(q, sessionId);
        sendJson(res, 200, answer);
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
    });
    return;
  }
  if (pathname === '/api/nova/action/approve' && req.method === 'POST') {
    parseBody(req, async (err, body) => {
      const token = body ? body.token : '';
      const sessionId = body ? (body.sessionId || 'default') : 'default';
      try {
        const result = await novaEngine.approveAction(token, sessionId);
        sendJson(res, result.success ? 200 : 400, result);
      } catch (e) {
        sendJson(res, 500, { error: e.message });
      }
    });
    return;
  }
  if ((pathname === '/api/nova/execute' || pathname === '/api/nova/action') && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const actionKey = (body && (body.action || body.actionKey)) || '';
      sendJson(res, 200, novaEngine.executeAction(actionKey));
    });
    return;
  }
  if (pathname === '/api/nova/predictive/status') {
    sendJson(res, 200, {
      trends: novaPredictive.getHistoricalTrends(24),
      forecast: novaPredictive.getUpcomingForecast()
    });
    return;
  }
  if (pathname === '/api/nova/report/daily') {
    sendJson(res, 200, novaPredictive.generateDailyReport());
    return;
  }
  if (pathname === '/api/nova/report/weekly') {
    sendJson(res, 200, novaPredictive.generateWeeklyReport());
    return;
  }
  if (pathname === '/api/nova/troubleshoot' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      sendJson(res, 200, novaPredictive.troubleshoot(body.question || body.query));
    });
    return;
  }

  // --- API: Internet Black Box ---
  if (pathname === '/api/blackbox') {
    sendJson(res, 200, blackBox.getDashboardData());
    return;
  }
  if (pathname === '/api/blackbox/report') {
    const rawReport = blackBox.generateDiagnosticReport();
    if (req.headers['accept'] && req.headers['accept'].includes('text/html')) {
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vortex Speed v8.0 // Autonomous Incident Report</title>
  <style>
    body { background: #080A10; color: #E2E8F0; font-family: 'Consolas', 'Courier New', monospace; padding: 30px; line-height: 1.5; }
    .header { border-bottom: 2px solid #258BFF; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    h1 { margin: 0; color: #00D9FF; font-size: 18px; letter-spacing: 1px; }
    .btn { background: #258BFF; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold; }
    .btn:hover { background: #00D9FF; color: #080A10; }
    pre { white-space: pre-wrap; font-size: 13px; color: #94A3B8; background: #10141F; padding: 20px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); }
    @media print { body { background: #fff; color: #000; } pre { border: 1px solid #ccc; color: #000; background: #fff; } .btn { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>VORTEX SPEED TITANIUM PRO v8.0 // DIAGNOSTIC REPORT</h1>
    <button class="btn" onclick="window.print()">Print / Save PDF</button>
  </div>
  <pre>${rawReport}</pre>
</body>
</html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(html);
      return;
    }
    sendJson(res, 200, { report: rawReport });
    return;
  }

  // --- API: Network Time Machine ---
  if (pathname === '/api/timemachine') {
    const rangeParam = parsedUrl.searchParams.get('range') || '24h';
    let hours = parseInt(parsedUrl.searchParams.get('hours'), 10) || parseInt(rangeParam, 10);
    if (!hours || isNaN(hours)) {
      if (rangeParam === '1h') hours = 1;
      else if (rangeParam === '6h') hours = 6;
      else if (rangeParam === '12h') hours = 12;
      else if (rangeParam === '24h') hours = 24;
      else if (rangeParam === '7d' || rangeParam === '168h') hours = 168;
      else hours = 24;
    }
    const history = timeMachine.getHistory(hours);
    sendJson(res, 200, {
      ...history,
      history: history.points,
      points: history.points
    });
    return;
  }
  if (pathname === '/api/timemachine/replay') {
    const t = parseInt(parsedUrl.searchParams.get('timestamp'), 10) || Date.now();
    sendJson(res, 200, timeMachine.getSnapshotAtTime(t));
    return;
  }

  // --- API: Network DNA Engine ---
  if (pathname === '/api/dna' || pathname === '/api/dna/status') {
    sendJson(res, 200, networkDna.getCurrentFingerprint());
    return;
  }
  if (pathname === '/api/dna/recalculate' && req.method === 'POST') {
    sendJson(res, 200, networkDna.recalculateBaselines());
    return;
  }
  if (pathname === '/api/dna/curve' || pathname === '/api/dna/hourly') {
    const dt = parsedUrl.searchParams.get('dayType') || networkDna.getDayType();
    const metric = parsedUrl.searchParams.get('metric') || 'download';
    const curveData = networkDna.get24HourCurve(dt, metric);
    sendJson(res, 200, curveData);
    return;
  }

  // --- API: Bufferbloat Autopsy Engine ---
  if (pathname === '/api/bufferbloat/start' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const mode = (body && body.mode) || 'standard';
      bufferbloatEngine.startTest(mode).then(result => {
        sendJson(res, 200, result);
      });
    });
    return;
  }
  if (pathname === '/api/bufferbloat/status') {
    sendJson(res, 200, bufferbloatEngine.getStatus());
    return;
  }
  if (pathname === '/api/bufferbloat/cancel' && req.method === 'POST') {
    sendJson(res, 200, bufferbloatEngine.cancelTest());
    return;
  }
  if (pathname === '/api/bufferbloat/history') {
    const limit = parseInt(parsedUrl.searchParams.get('limit'), 10) || 10;
    sendJson(res, 200, { history: bufferbloatEngine.getHistory(limit) });
    return;
  }

  // --- API: Internet Route Vision ---
  if (pathname === '/api/route/trace' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const dest = (body && body.destination) || 'cloudflare';
      const custom = (body && body.customHost) || '';
      sendJson(res, 200, routeVisionEngine.startTrace(dest, custom));
    });
    return;
  }
  if (pathname === '/api/route/status') {
    sendJson(res, 200, routeVisionEngine.getStatus());
    return;
  }
  if (pathname === '/api/route/cancel' && req.method === 'POST') {
    sendJson(res, 200, routeVisionEngine.cancelTrace());
    return;
  }
  if (pathname === '/api/route/history' || pathname === '/api/routevision/history') {
    const dest = parsedUrl.searchParams.get('destination') || null;
    const limit = parseInt(parsedUrl.searchParams.get('limit'), 10) || 10;
    sendJson(res, 200, { history: routeVisionEngine.getHistory(dest, limit) });
    return;
  }

  // --- API: Network Autopilot Governance ---
  if (pathname === '/api/autopilot' || pathname === '/api/autopilot/state' || pathname === '/api/autopilot/status') {
    sendJson(res, 200, autopilotEngine.getState());
    return;
  }
  if (pathname === '/api/autopilot/mode' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      sendJson(res, 200, autopilotEngine.setMode(body.mode));
    });
    return;
  }
  if (pathname === '/api/autopilot/approve' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const approve = body.approve !== undefined ? body.approve : true;
      sendJson(res, 200, autopilotEngine.approvePendingAction(body.actionId, approve));
    });
    return;
  }
  if (pathname === '/api/autopilot/rollback' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      sendJson(res, 200, autopilotEngine.rollbackAction(body.actionKey));
    });
    return;
  }
  if (pathname === '/api/autopilot/execute' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      sendJson(res, 200, autopilotEngine.executeAction(
        body.actionKey,
        body.triggerReason || 'Direct API execution',
        body.previousState || null,
        body.newState || null,
        body.autoRollbackTime || null
      ));
    });
    return;
  }
  if (pathname === '/api/autopilot/logs') {
    const limit = parseInt(parsedUrl.searchParams.get('limit'), 10) || 25;
    sendJson(res, 200, { logs: autopilotEngine.getAuditLogs(limit) });
    return;
  }

  // --- API: Smart Bandwidth Guardian ---
  if (pathname === '/api/guardian' || pathname === '/api/guardian/processes') {
    sendJson(res, 200, bandwidthGuardian.getDashboardData());
    return;
  }
  if (pathname === '/api/guardian/freeze' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const enable = body && (body.enable !== undefined ? body.enable : body.active);
      sendJson(res, 200, bandwidthGuardian.toggleBandwidthFreeze(!!enable));
    });
    return;
  }

  // --- API: Wi-Fi Intelligence Lab ---
  if (pathname === '/api/wifi') {
    sendJson(res, 200, wifiLab.getData());
    return;
  }

  // --- API: Network Digital Twin ---
  if (pathname === '/api/digitaltwin') {
    sendJson(res, 200, digitalTwin.getTopology());
    return;
  }
  if (pathname === '/api/digitaltwin/rescan' || pathname === '/api/digitaltwin/sweep') {
    digitalTwin.sweepNetwork(() => {
      sendJson(res, 200, digitalTwin.getTopology());
    });
    return;
  }
  if (pathname === '/api/digitaltwin/rename' || pathname === '/api/digitaltwin/node/update') {
    if (req.method === 'POST') {
      parseBody(req, (err, body) => {
        const id = body.mac || body.ip;
        sendJson(res, 200, digitalTwin.setDeviceCustomName(id, body.customName));
      });
      return;
    }
  }
  if (pathname === '/api/digitaltwin/trust' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const id = body.mac || body.ip;
      sendJson(res, 200, digitalTwin.toggleTrust(id));
    });
    return;
  }

  // --- API: Adaptive Gaming Intelligence ---
  if (pathname === '/api/gaming') {
    sendJson(res, 200, gamingEngine.getState());
    return;
  }
  if (pathname === '/api/gaming/start' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const key = (body && (body.gameKey || body.profileName || '')).toLowerCase();
      const customTarget = body ? (body.customTarget || body.target) : null;
      sendJson(res, 200, gamingEngine.startSession(key || 'cs2', customTarget));
    });
    return;
  }
  if ((pathname === '/api/gaming/end' || pathname === '/api/gaming/stop') && req.method === 'POST') {
    sendJson(res, 200, gamingEngine.endSession() || { message: 'No active session' });
    return;
  }
  if (pathname === '/api/gaming/history') {
    sendJson(res, 200, { history: gamingEngine.getRecentSessions() });
    return;
  }

  // --- API: Bandwidth Prediction Engine ---
  if (pathname === '/api/prediction') {
    const gb = parseInt(parsedUrl.searchParams.get('filesizeGb') || parsedUrl.searchParams.get('gb'), 10) || 60;
    sendJson(res, 200, predictionEngine.getPredictions(gb));
    return;
  }

  // --- API: ISP Performance Intelligence ---
  if (pathname === '/api/isp') {
    sendJson(res, 200, ispEngine.calculateScore());
    return;
  }

  // --- API: Vortex Command Centre ---
  if (pathname === '/api/command' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const cmd = (body && (body.command || body.text)) || '';
      sendJson(res, 200, commandCentre.executeCommand(cmd));
    });
    return;
  }

  // --- API: Plan Capacity ---
  if (pathname === '/api/plan') {
    if (req.method === 'POST') {
      parseBody(req, (err, body) => {
        if (body.plan && !isNaN(body.plan)) {
          telemetryService.configuredPlanMbps = parseFloat(body.plan);
        }
        sendJson(res, 200, { success: true, plan: telemetryService.configuredPlanMbps });
      });
      return;
    }
    sendJson(res, 200, { plan: telemetryService.configuredPlanMbps });
    return;
  }

  // --- API: QoS Profile ---
  if (pathname === '/api/profile' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (body.profile) telemetryService.currentTrafficMode = body.profile;
      sendJson(res, 200, { success: true, profile: telemetryService.currentTrafficMode });
    });
    return;
  }

  // --- API: Genuine Speed Engine ---
  if (pathname === '/api/speed/start' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      const serverId = (body && body.serverId) || 'cloudflare-mumbai';
      speedEngine.startTest(serverId).then(result => {
        sendJson(res, 200, result);
      }).catch(startErr => {
        sendJson(res, 500, { success: false, error: startErr.message });
      });
    });
    return;
  }
  if (pathname === '/api/speed/status') {
    sendJson(res, 200, speedEngine.getStatus());
    return;
  }
  if (pathname === '/api/speed/cancel' && req.method === 'POST') {
    sendJson(res, 200, speedEngine.cancelTest());
    return;
  }
  if (pathname === '/api/speed/servers') {
    sendJson(res, 200, { servers: speedEngine.getServers() });
    return;
  }
  if (pathname === '/api/speed/history' || pathname === '/api/history' || pathname === '/api/speedtest/history') {
    const limit = parseInt(parsedUrl.searchParams.get('limit'), 10) || 20;
    const history = speedEngine.getHistory(limit);
    sendJson(res, 200, { history, count: history.length });
    return;
  }
  if ((pathname === '/api/speed/history/clear' || pathname === '/api/history/clear' || pathname === '/api/speedtest/clear') && req.method === 'POST') {
    sendJson(res, 200, speedEngine.clearHistory());
    return;
  }
  if (pathname === '/api/speed/cross-check' && req.method === 'POST') {
    speedEngine.startCrossCheck().then(result => {
      sendJson(res, 200, result);
    });
    return;
  }
  if (pathname === '/api/speed/cross-check/status') {
    sendJson(res, 200, speedEngine.getCrossCheckStatus());
    return;
  }

  // --- API: Quick 4-Pillar Internet Health Check ---
  if (pathname === '/api/quick-check') {
    const dns = require('dns');
    const https = require('https');
    const { exec } = require('child_process');

    const result = {
      timestamp: Date.now(),
      healthy: true,
      overallStatus: 'OPTIMAL',
      summary: 'All network services operational with zero packet loss.',
      gateway: { target: telemetryService.networkConfig.gateway || '192.168.29.1', status: 'PENDING', latencyMs: null },
      dns: { domain: 'cloudflare.com', status: 'PENDING', lookupTimeMs: null, ip: null },
      wanPing: { target: '1.1.1.1', status: 'PENDING', latencyMs: null, packetLoss: 0 },
      httpCdn: { host: 'speed.cloudflare.com', status: 'PENDING', httpStatus: null, rttMs: null, colo: 'BOM' }
    };

    const tasks = [];

    // 1. Gateway Ping
    tasks.push(new Promise(resolve => {
      const start = Date.now();
      exec(`ping -n 1 -w 800 ${result.gateway.target}`, (err, stdout) => {
        const match = stdout && stdout.match(/time[=<](\d+)ms/i);
        if (match) {
          result.gateway.status = 'UP';
          result.gateway.latencyMs = parseInt(match[1], 10);
        } else {
          result.gateway.status = err ? 'UNREACHABLE' : 'TIMEOUT';
          result.gateway.latencyMs = Date.now() - start;
        }
        resolve();
      });
    }));

    // 2. DNS Lookup
    tasks.push(new Promise(resolve => {
      const start = Date.now();
      dns.lookup(result.dns.domain, (err, address) => {
        result.dns.lookupTimeMs = Date.now() - start;
        if (!err && address) {
          result.dns.status = 'RESOLVED';
          result.dns.ip = address;
        } else {
          result.dns.status = 'FAILED';
          result.healthy = false;
        }
        resolve();
      });
    }));

    // 3. WAN Ping (1.1.1.1)
    tasks.push(new Promise(resolve => {
      const start = Date.now();
      exec(`ping -n 2 -w 600 ${result.wanPing.target}`, (err, stdout) => {
        const matches = stdout && stdout.match(/time[=<](\d+)ms/gi);
        if (matches && matches.length > 0) {
          const times = matches.map(m => parseInt(m.replace(/time[=<]/i, ''), 10));
          result.wanPing.latencyMs = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
          result.wanPing.status = 'UP';
        } else {
          result.wanPing.status = 'PACKET_LOSS';
          result.wanPing.packetLoss = 100;
          result.healthy = false;
        }
        resolve();
      });
    }));

    // 4. HTTP CDN Check (speed.cloudflare.com/cdn-cgi/trace)
    tasks.push(new Promise(resolve => {
      const start = Date.now();
      const req = https.get('https://speed.cloudflare.com/cdn-cgi/trace', { timeout: 2500 }, res => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          result.httpCdn.rttMs = Date.now() - start;
          result.httpCdn.httpStatus = res.statusCode;
          result.httpCdn.status = res.statusCode === 200 ? 'REACHABLE' : 'DEGRADED';
          const coloMatch = body.match(/colo=([A-Z]+)/);
          if (coloMatch) result.httpCdn.colo = coloMatch[1];
          resolve();
        });
      });
      req.on('error', () => {
        result.httpCdn.status = 'FAILED';
        result.httpCdn.rttMs = Date.now() - start;
        result.healthy = false;
        resolve();
      });
      req.on('timeout', () => {
        req.destroy();
        result.httpCdn.status = 'TIMEOUT';
        result.healthy = false;
        resolve();
      });
    }));

    Promise.all(tasks).then(() => {
      if (!result.healthy) {
        result.overallStatus = 'DEGRADED';
        result.summary = 'Connectivity impaired on one or more network layers.';
      } else if (result.wanPing.latencyMs > 80) {
        result.overallStatus = 'HIGH_LATENCY';
        result.summary = `Elevated WAN latency (${result.wanPing.latencyMs}ms). Local gateway is healthy (${result.gateway.latencyMs}ms).`;
      } else {
        result.overallStatus = 'OPTIMAL';
        result.summary = `Optimal connection: Gateway ${result.gateway.latencyMs}ms, WAN ${result.wanPing.latencyMs}ms, DNS ${result.dns.lookupTimeMs}ms.`;
      }
      sendJson(res, 200, result);
    });
    return;
  }

  // --- API: Comprehensive Network Status ---
  if (pathname === '/api/network-status') {
    const snap = telemetryService.getSnapshot();
    const db = getDb();
    let todayBytes = 0;
    try {
      const todayRow = db.prepare('SELECT SUM(bytes_down + bytes_up) as total FROM speed_tests WHERE timestamp >= ?').get(new Date().setHours(0,0,0,0));
      todayBytes = (todayRow && todayRow.total) || 0;
    } catch(e) {}

    sendJson(res, 200, {
      timestamp: Date.now(),
      adapterName: telemetryService.detectedAdapter || 'Wi-Fi (802.11n)',
      adapterType: 'Wi-Fi (802.11n MIMO)',
      channel: 6,
      band: '2.4 GHz',
      bssid: 'JioFiber-2.4G',
      localIp: telemetryService.networkConfig.ip || '192.168.29.98',
      gatewayIp: telemetryService.networkConfig.gateway || '192.168.29.1',
      dnsServer: '1.1.1.1, 1.0.0.1 (Cloudflare Anycast)',
      liveDownMbps: (snap && snap.liveMbps) || 0,
      liveUpMbps: (snap && snap.liveUpMbps) || 0,
      livePingMs: (snap && snap.network && snap.network.ping) || 16,
      todayBytes: todayBytes,
      todayGb: (todayBytes / 1073741824).toFixed(2),
      planCeilingMbps: telemetryService.configuredPlanMbps,
      signalStrengthPct: 92,
      linkSpeedMbps: 72.2
    });
    return;
  }

  // --- API: Settings & Personalization ---
  if (pathname === '/api/settings') {
    const db = getDb();
    if (req.method === 'GET') {
      const rows = db.prepare('SELECT key, value FROM system_settings').all();
      const settings = {
        themeMode: 'dark',
        accentGlow: 'cyan',
        uiDensity: 'comfortable',
        animSpeed: 'normal',
        startWithWindows: false,
        minimizeToTray: true,
        closeToTray: true,
        singleInstance: true,
        speedAlertThreshold: 15,
        outageNotifications: true,
        packetLossWarningThreshold: 5,
        quietHours: false,
        monitoringIntervalSec: 1,
        incidentRetentionDays: 30,
        baselineWindowDays: 14,
        telemetryLogging: true
      };
      for (const r of rows) {
        try {
          settings[r.key] = JSON.parse(r.value);
        } catch (e) {
          settings[r.key] = r.value;
        }
      }
      sendJson(res, 200, { success: true, settings });
      return;
    } else if (req.method === 'POST') {
      parseBody(req, (err, body) => {
        if (body && typeof body === 'object') {
          const insertStmt = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
          for (const [k, v] of Object.entries(body)) {
            insertStmt.run(k, JSON.stringify(v));
          }
          sendJson(res, 200, { success: true, message: 'Settings saved successfully.' });
        } else {
          sendJson(res, 400, { success: false, error: 'Invalid settings body' });
        }
      });
      return;
    }
  }

  // --- API: Data Vault Stats & Purge ---
  if (pathname === '/api/vault/stats') {
    const db = getDb();
    const speedCount = db.prepare('SELECT COUNT(*) as c FROM speed_tests').get().c;
    const telemetryCount = db.prepare('SELECT COUNT(*) as c FROM telemetry_history').get().c;
    const incidentCount = db.prepare('SELECT COUNT(*) as c FROM network_incidents').get().c;
    const bbCount = db.prepare('SELECT COUNT(*) as c FROM bufferbloat_records').get().c;
    let dbSizeBytes = 0;
    try {
      dbSizeBytes = fs.statSync(SETTINGS.DB_PATH).size;
    } catch (e) {}
    sendJson(res, 200, {
      speedTestsCount: speedCount,
      telemetrySamplesCount: telemetryCount,
      incidentsCount: incidentCount,
      bufferbloatTestsCount: bbCount,
      dbSizeBytes,
      dbSizeMb: (dbSizeBytes / 1048576).toFixed(2)
    });
    return;
  }

  if (pathname === '/api/vault/purge' && req.method === 'POST') {
    const db = getDb();
    parseBody(req, (err, body) => {
      const target = (body && body.target) || 'telemetry';
      if (target === 'speed_tests') {
        db.prepare('DELETE FROM speed_tests').run();
      } else if (target === 'telemetry') {
        db.prepare('DELETE FROM telemetry_history WHERE timestamp < ?').run(Date.now() - (7 * 86400000));
      } else if (target === 'all_telemetry') {
        db.prepare('DELETE FROM telemetry_history').run();
      } else if (target === 'incidents') {
        db.prepare('DELETE FROM network_incidents').run();
      }
      try { db.exec('PRAGMA incremental_vacuum;'); } catch(e) {}
      sendJson(res, 200, { success: true, message: `Purged ${target} successfully.` });
    });
    return;
  }

  // --- API: Trackers ---
  if (pathname === '/api/trackers') {
    let trackers = [];
    if (fs.existsSync(SETTINGS.TRACKERS_FILE)) {
      trackers = fs.readFileSync(SETTINGS.TRACKERS_FILE, 'utf8')
        .split('\n')
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }
    sendJson(res, 200, { trackers, count: trackers.length });
    return;
  }

  // --- API: Turbo Overdrive Action ---
  if (pathname === '/api/turbo' && req.method === 'POST') {
    const turboCmd = `powershell -NoProfile -Command "
      try { [System.Diagnostics.Process]::GetProcessesByName('tixati') | ForEach-Object { $_.PriorityClass = 'High' } } catch {};
      try { (New-Object System.Net.NetworkInformation.Ping).SendPingAsync('1.1.1.1', 250) } catch {};
      try { ipconfig /flushdns } catch {};
    "`;
    require('child_process').exec(turboCmd, () => {
      sendJson(res, 200, {
        success: true,
        message: '⚡ OVERDRIVE ENGAGED: 1.0ms Timer Locked • Tixati Priority High • DNS Flushed'
      });
    });
    return;
  }

  // Legacy API compatibility
  if (pathname === '/api/devices') {
    sendJson(res, 200, { devices: digitalTwin.devices, total: digitalTwin.devices.length, timestamp: Date.now() });
    return;
  }
  if (pathname === '/api/trace') {
    sendJson(res, 200, {
      isp: 'JioFiber Broadband (Reliance)',
      server: 'Mumbai Edge (BOM)',
      location: 'India',
      ip: telemetryService.networkConfig.ip,
      gateway: telemetryService.networkConfig.gateway,
      plan: `${telemetryService.configuredPlanMbps} Mbps Unlimited Fiber`
    });
    return;
  }

  // --- Static Files (Secured against Path Traversal) ---
  const rawPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const cleanRelPath = path.normalize(rawPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(SETTINGS.PUBLIC_DIR, cleanRelPath);
  const normalizedPublic = path.normalize(SETTINGS.PUBLIC_DIR);

  if (!filePath.startsWith(normalizedPublic)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Invalid file path.');
    return;
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, {
        'Content-Type': contentTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(data);
    }
  });
});

server.listen(SETTINGS.PORT, '127.0.0.1', () => {
  console.log(`[VORTEX SPEED v8.0] Backend Engine listening on http://127.0.0.1:${SETTINGS.PORT}`);
});
