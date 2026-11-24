// =========================================================================
// VORTEX SPEED TITANIUM PRO v8.0 // CLIENT RUNTIME LOGIC ENGINE
// Autonomous Network Intelligence Platform for Windows 11
// Designed for Obsidian Cyber Glassmorphism UI
// =========================================================================

// --- AUDIO SYNTHESIZER ENGINE (Web Audio API) ---
let audioCtx = null;
let soundEnabled = true;

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBubbleClick(freq = 650) {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, audioCtx.currentTime + 0.03);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.09);
  } catch (e) {}
}

function playVictoryChime() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.07 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.07);
      osc.stop(audioCtx.currentTime + idx * 0.07 + 0.36);
    });
  } catch (e) {}
}

function playWarpSound() {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.24);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
}

// --- TOAST NOTIFICATION SYSTEM ---
const toastContainer = document.getElementById('toast-container');
function showToast(msg, duration = 3200) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'vortex-toast';
  toast.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// --- GLOBAL APPLICATION STATE ---
const state = {
  currentView: 'module-overview',
  currentPlanMbps: 30.0,
  maxGaugeScale: 40.0,
  isAutoScaling: false,
  isTesting: false,
  bandwidthFreezeActive: false,
  activeGameSession: null,
  gameTimerInterval: null,
  activeGameSeconds: 0,
  latestTelemetry: null,
  timeMachineRange: '1h',
  timeMachineData: [],
  speechRecognition: null,
  isListening: false
};

// =========================================================================
// 1. SIDEBAR NAVIGATION CONTROLLER
// =========================================================================
const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
const viewPanels = document.querySelectorAll('.view-panel');

const ALIAS_MAP = {
  'module-bufferbloat': { module: 'module-speed', subtab: 'speed-tab-bufferbloat' },
  'module-routevision': { module: 'module-speed', subtab: 'speed-tab-routevision' },
  'module-gaming': { module: 'module-speed', subtab: 'speed-tab-gaming' },
  'module-prediction': { module: 'module-speed', subtab: 'speed-tab-main' },
  'module-isp': { module: 'module-speed', subtab: 'speed-tab-main' },
  'module-digitaltwin': { module: 'module-explorer', subtab: 'explorer-tab-radar' },
  'module-wifi': { module: 'module-explorer', subtab: 'explorer-tab-wifi' },
  'module-guardian': { module: 'module-explorer', subtab: 'explorer-tab-processes' },
  'module-timemachine': { module: 'module-settings', subtab: 'settings-tab-history' },
  'module-dna': { module: 'module-settings', subtab: 'settings-tab-history' },
  'module-blackbox': { module: 'module-settings', subtab: 'settings-tab-blackbox' },
  'module-autopilot': { module: 'module-nova', subtab: null }
};

function switchView(targetModuleId, targetSubtabId = null) {
  let actualModule = targetModuleId;
  let actualSubtab = targetSubtabId;

  if (ALIAS_MAP[targetModuleId]) {
    actualModule = ALIAS_MAP[targetModuleId].module;
    if (!actualSubtab) actualSubtab = ALIAS_MAP[targetModuleId].subtab;
  }

  const currentNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const currentViewPanels = document.querySelectorAll('.view-panel');

  currentNavItems.forEach(item => {
    if (item.dataset.target === actualModule) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  currentViewPanels.forEach(panel => {
    if (panel.id === actualModule) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (actualSubtab) {
    const btn = document.querySelector(`[data-subtab="${actualSubtab}"]`);
    if (btn) btn.click();
  }

  state.currentView = actualModule;
  playBubbleClick(700);

  // Trigger lazy refresh for active capabilities
  if (actualModule === 'module-explorer') {
    if (typeof fetchDigitalTwin === 'function') fetchDigitalTwin();
    if (typeof fetchWifiData === 'function') fetchWifiData();
    if (typeof fetchProcesses === 'function') fetchProcesses();
  }
  if (actualModule === 'module-speed') {
    if (typeof fetchBufferbloatData === 'function') fetchBufferbloatData();
    if (typeof fetchRouteVisionHistory === 'function') fetchRouteVisionHistory();
    if (typeof fetchGamingHistory === 'function') fetchGamingHistory();
    if (typeof updatePrediction === 'function' && typeof predFileSlider !== 'undefined' && predFileSlider) updatePrediction(predFileSlider.value);
    if (typeof fetchIspScore === 'function') fetchIspScore();
  }
  if (actualModule === 'module-settings') {
    if (typeof loadTrackers === 'function') loadTrackers();
    if (typeof fetchVaultUsage === 'function') fetchVaultUsage();
    if (typeof fetchTimeMachine === 'function') fetchTimeMachine(state.timeMachineRange || '24h');
    if (typeof fetchDnaData === 'function') fetchDnaData();
    if (typeof fetchDnaCurve === 'function') fetchDnaCurve(activeDnaDayType || 'weekday');
    if (typeof fetchBlackBox === 'function') fetchBlackBox();
  }
  if (actualModule === 'module-nova') {
    if (typeof fetchNovaStatus === 'function') fetchNovaStatus();
    if (typeof fetchAutopilotState === 'function') fetchAutopilotState();
  }

  // Trigger immediate Hi-DPI re-fitting for canvases
  requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'));
  });
}

// Pillar Subtab Controller Initialization
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pillar-subtabs').forEach(bar => {
    bar.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetSubtab = btn.dataset.subtab;
        if (!targetSubtab) return;
        bar.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const container = bar.closest('.view-panel');
        if (container) {
          container.querySelectorAll('.subtab-content').forEach(content => {
            if (content.id === targetSubtab) {
              content.classList.add('active');
            } else {
              content.classList.remove('active');
            }
          });
        }
        playBubbleClick(600);
        requestAnimationFrame(() => {
          window.dispatchEvent(new Event('resize'));
        });
      });
    });
  });
});

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.target;
    if (target) {
      switchView(target);
      window.location.hash = target;
    }
  });
});

// URL hash & query parameter navigation support
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  if (themeParam) applyTheme(themeParam);
  const viewParam = urlParams.get('view') || (window.location.hash ? window.location.hash.replace('#', '') : null);
  if (viewParam) switchView(viewParam);
});
window.addEventListener('hashchange', () => {
  if (window.location.hash) switchView(window.location.hash.replace('#', ''));
});

// Overview quick-action buttons
document.getElementById('ov-btn-game')?.addEventListener('click', () => switchView('module-gaming'));
document.getElementById('ov-btn-test')?.addEventListener('click', () => {
  switchView('module-speed');
  setTimeout(runSpeedTest, 250);
});
document.getElementById('ov-btn-report')?.addEventListener('click', generateBlackBoxReport);

// =========================================================================
// 2. PLAN CAPACITY & MATHEMATICAL SCALE CONTROLLER
// =========================================================================
const planSelect = document.getElementById('plan-select');
const diagScaleLabel = document.getElementById('diag-scale-label');
const ovCapTag = document.getElementById('ov-cap-tag');

function applyPlanScale(val) {
  if (val === 'auto') {
    state.isAutoScaling = true;
    diagScaleLabel.textContent = 'SCALE: AUTO-DETECTING';
    ovCapTag.textContent = 'Dynamic Cap';
    showToast('⚡ Dynamic Plan Auto-Scaling Enabled');
    return;
  }

  state.isAutoScaling = false;
  state.currentPlanMbps = parseFloat(val);

  if (state.currentPlanMbps <= 35) state.maxGaugeScale = 40.0;
  else if (state.currentPlanMbps <= 110) state.maxGaugeScale = 120.0;
  else if (state.currentPlanMbps <= 160) state.maxGaugeScale = 180.0;
  else if (state.currentPlanMbps <= 320) state.maxGaugeScale = 360.0;
  else state.maxGaugeScale = 1100.0;

  diagScaleLabel.textContent = `SCALE: 0 - ${state.maxGaugeScale} Mbps`;
  ovCapTag.textContent = `${state.currentPlanMbps}M Cap`;

  // Inform backend
  fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planMbps: state.currentPlanMbps })
  }).catch(() => {});
}

planSelect?.addEventListener('change', () => {
  applyPlanScale(planSelect.value);
  playBubbleClick(800);
});

// =========================================================================
// 3. SVG SPEED GAUGE CONTROLLER
// =========================================================================
const dialArc = document.getElementById('dialArc');
const diagSpeedNum = document.getElementById('diag-speed-num');
const diagMbNum = document.getElementById('diag-mb-num');
const ARC_TOTAL = 565.48; // 270 degrees on r=120

function setGaugeSpeed(speedMbps) {
  if (!dialArc) return;
  if (state.isAutoScaling && speedMbps > state.maxGaugeScale * 0.9) {
    state.maxGaugeScale = Math.ceil(speedMbps * 1.35);
    diagScaleLabel.textContent = `SCALE: 0 - ${state.maxGaugeScale} Mbps (AUTO)`;
  }
  const fraction = Math.min(1.0, Math.max(0, speedMbps / state.maxGaugeScale));
  const offset = ARC_TOTAL * (1.0 - fraction);
  dialArc.style.strokeDashoffset = offset;
}
setGaugeSpeed(0);

// =========================================================================
// 4. SPEED DIAGNOSTICS ENGINE
// =========================================================================
const diagStartBtn = document.getElementById('diag-start-btn');
const diagHud = document.getElementById('diag-hud');
const diagPhaseChip = document.getElementById('diag-phase-chip');
const diagHudStatus = document.getElementById('diag-hud-status');
const diagRetestBtn = document.getElementById('diag-retest-btn');
const clearSpeedHistBtn = document.getElementById('clear-speed-hist-btn');
const diagHistoryTbody = document.getElementById('diag-history-tbody');

const diagPing = document.getElementById('diag-ping');
const diagPingSub = document.getElementById('diag-ping-sub');
const diagJitter = document.getElementById('diag-jitter');
const diagJitterSub = document.getElementById('diag-jitter-sub');
const diagDown = document.getElementById('diag-down');
const diagDownMb = document.getElementById('diag-down-mb');
const diagUp = document.getElementById('diag-up');
const diagUpMb = document.getElementById('diag-up-mb');
const diagActiveTestTag = document.getElementById('diag-active-test-tag');
const diagLastTestData = document.getElementById('diag-last-test-data');

// Universal High-DPI Canvas Auto-Scaling System (Razor sharp vector rendering across FHD, QHD, 4K and resized windows)
function fitCanvasToContainer(canvas, ctx) {
  if (!canvas || !ctx) return { w: 0, h: 0 };
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.floor(rect.width) || canvas.clientWidth || 300;
  const cssHeight = Math.floor(rect.height) || canvas.clientHeight || 120;

  const targetWidth = Math.floor(cssWidth * dpr);
  const targetHeight = Math.floor(cssHeight * dpr);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: cssWidth, h: cssHeight };
}

// Speed Diagnostics Controllers & Canvas
const speedTrendCanvas = document.getElementById('speedTrendCanvas');
const speedTrendCtx = speedTrendCanvas?.getContext('2d');
const speedServerName = document.getElementById('speed-server-name');
const speedTestCount = document.getElementById('speed-test-count');
const diagEmptyState = document.getElementById('diag-empty-state');
const diagHistoryTable = document.getElementById('diag-history-table');

let lastSpeedHistory = [];
function drawSpeedTrendChart(history) {
  if (history !== undefined) lastSpeedHistory = history;
  if (!speedTrendCtx || !speedTrendCanvas) return;
  const { w, h } = fitCanvasToContainer(speedTrendCanvas, speedTrendCtx);
  if (w <= 0 || h <= 0) return;
  speedTrendCtx.clearRect(0, 0, w, h);

  // Subtle gridlines
  speedTrendCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  speedTrendCtx.lineWidth = 1;
  for (let y = 15; y < h; y += 25) {
    speedTrendCtx.beginPath();
    speedTrendCtx.moveTo(0, y);
    speedTrendCtx.lineTo(w, y);
    speedTrendCtx.stroke();
  }

  const activeHistory = history !== undefined ? history : lastSpeedHistory;
  if (!activeHistory || activeHistory.length === 0) {
    speedTrendCtx.fillStyle = '#64748B';
    speedTrendCtx.font = '11px Space Grotesk';
    speedTrendCtx.textAlign = 'center';
    speedTrendCtx.fillText('Awaiting speed test records from SQLite...', w / 2, h / 2 + 4);
    return;
  }

  // Reverse to chronological order (oldest to newest, max 10 points)
  const pts = [...activeHistory].reverse().slice(-10);
  const values = pts.map(p => {
    const d = parseFloat(p.downMbps !== undefined ? p.downMbps : p.down_mbps) || 0;
    const u = parseFloat(p.upMbps !== undefined ? p.upMbps : p.up_mbps) || 0;
    return Math.max(d, u);
  });
  const maxVal = values.length > 0 ? Math.max(...values) : 40;
  const maxMbps = Math.max(40, maxVal * 1.15);
  const step = pts.length > 1 ? (w - 30) / (pts.length - 1) : (w - 30);
  const startX = 15;

  // Download curve (Titanium Silver)
  speedTrendCtx.beginPath();
  pts.forEach((pt, idx) => {
    const val = parseFloat(pt.downMbps !== undefined ? pt.downMbps : pt.down_mbps) || 0;
    const x = startX + idx * step;
    const y = h - (val / maxMbps) * (h - 26) - 12;
    if (idx === 0) speedTrendCtx.moveTo(x, y);
    else speedTrendCtx.lineTo(x, y);
  });
  speedTrendCtx.strokeStyle = '#B9BEC4';
  speedTrendCtx.lineWidth = 2.5;
  speedTrendCtx.shadowColor = 'rgba(185, 190, 196, 0.3)';
  speedTrendCtx.shadowBlur = 4;
  speedTrendCtx.stroke();
  speedTrendCtx.shadowBlur = 0;

  // Upload curve (Ember Orange)
  speedTrendCtx.beginPath();
  pts.forEach((pt, idx) => {
    const val = parseFloat(pt.upMbps !== undefined ? pt.upMbps : pt.up_mbps) || 0;
    const x = startX + idx * step;
    const y = h - (val / maxMbps) * (h - 26) - 12;
    if (idx === 0) speedTrendCtx.moveTo(x, y);
    else speedTrendCtx.lineTo(x, y);
  });
  speedTrendCtx.strokeStyle = '#E58A48';
  speedTrendCtx.lineWidth = 2;
  speedTrendCtx.shadowColor = 'rgba(229, 138, 72, 0.3)';
  speedTrendCtx.shadowBlur = 4;
  speedTrendCtx.stroke();
  speedTrendCtx.shadowBlur = 0;

  // Draw Points
  pts.forEach((pt, idx) => {
    const dVal = parseFloat(pt.downMbps !== undefined ? pt.downMbps : pt.down_mbps) || 0;
    const uVal = parseFloat(pt.upMbps !== undefined ? pt.upMbps : pt.up_mbps) || 0;
    const x = startX + idx * step;
    const dY = h - (dVal / maxMbps) * (h - 26) - 12;
    const uY = h - (uVal / maxMbps) * (h - 26) - 12;
    
    // Download point (Titanium Silver)
    speedTrendCtx.fillStyle = '#B9BEC4';
    speedTrendCtx.beginPath();
    speedTrendCtx.arc(x, dY, 3, 0, Math.PI * 2);
    speedTrendCtx.fill();

    // Upload point (Ember Orange)
    speedTrendCtx.fillStyle = '#E58A48';
    speedTrendCtx.beginPath();
    speedTrendCtx.arc(x, uY, 2.5, 0, Math.PI * 2);
    speedTrendCtx.fill();
  });
}

const speedServerSelect = document.getElementById('speed-server-select');
const diagCrossBtn = document.getElementById('diag-cross-btn');
const diagDetailsBtn = document.getElementById('diag-details-btn');
const closeDetailsBtn = document.getElementById('close-details-btn');
const closeCrossBtn = document.getElementById('close-cross-btn');
const startCrossTestBtn = document.getElementById('start-cross-test-btn');
const diagDetailsDrawer = document.getElementById('diag-details-drawer');
const diagCrossDrawer = document.getElementById('diag-cross-drawer');

const dtId = document.getElementById('dt-id');
const dtTime = document.getElementById('dt-time');
const dtServer = document.getElementById('dt-server');
const dtLoc = document.getElementById('dt-loc');
const dtSustainedDown = document.getElementById('dt-sustained-down');
const dtPeakDown = document.getElementById('dt-peak-down');
const dtBytesDown = document.getElementById('dt-bytes-down');
const dtBytesUp = document.getElementById('dt-bytes-up');
const dtPingSpread = document.getElementById('dt-ping-spread');
const dtPacketLoss = document.getElementById('dt-packet-loss');

const csADown = document.getElementById('cs-a-down');
const csAUp = document.getElementById('cs-a-up');
const csAPing = document.getElementById('cs-a-ping');
const csBDown = document.getElementById('cs-b-down');
const csBUp = document.getElementById('cs-b-up');
const csBPing = document.getElementById('cs-b-ping');
const crossExplanation = document.getElementById('cross-explanation');
const crossStatusBanner = document.getElementById('cross-status-banner');

const diagCancelBtn = document.getElementById('diag-cancel-btn');

async function cancelSpeedTest() {
  state.isTesting = false;
  try {
    const res = await fetch('/api/speed/cancel', { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Speed test cancelled.');
  } catch (e) {
    showToast('Speed test cancelled.');
  }
  
  if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: CANCELLED';
  if (diagPhaseChip) {
    diagPhaseChip.className = 'diag-phase phase-cancelled';
    diagPhaseChip.textContent = '🛑 TEST CANCELLED';
  }
  if (diagHudStatus) diagHudStatus.textContent = 'Speed test was cancelled by user. Click Retest to start fresh.';
  diagCancelBtn?.classList.add('hidden');
  if (diagRetestBtn) diagRetestBtn.disabled = false;

  // Center HUD displays single clear cancellation status without overlapping rocket button
  diagStartBtn?.classList.add('hidden');
  diagHud?.classList.remove('hidden');
  setGaugeSpeed(0);
  if (diagSpeedNum) diagSpeedNum.textContent = '0.0';
  if (diagMbNum) diagMbNum.textContent = '0.00 MB/s';
}

async function runSpeedTest() {
  try {
    if (state.isTesting) {
      try { await fetch('/api/speed/cancel', { method: 'POST' }); } catch(e) {}
    }
    state.isTesting = true;

    playWarpSound();
    diagStartBtn?.classList.add('hidden');
    diagHud?.classList.remove('hidden');
    diagCancelBtn?.classList.remove('hidden');
    if (diagRetestBtn) diagRetestBtn.disabled = true;

    // Immediately clear current active test values
    if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: INITIALIZING';
    if (diagSpeedNum) diagSpeedNum.textContent = '0.0';
    if (diagMbNum) diagMbNum.textContent = '0.00 MB/s';
    setGaugeSpeed(0);

    const selectedServerId = speedServerSelect ? speedServerSelect.value : 'cloudflare-mumbai';
    if (speedServerName) {
      const sName = speedServerSelect && speedServerSelect.selectedIndex >= 0 ? speedServerSelect.options[speedServerSelect.selectedIndex].text : 'Cloudflare Edge (BOM)';
      speedServerName.textContent = `${sName} • CONNECTING...`;
    }

    if (diagPhaseChip) {
      diagPhaseChip.className = 'diag-phase';
      diagPhaseChip.textContent = 'CONNECTING TO CDN SINK...';
    }
    if (diagHudStatus) diagHudStatus.textContent = 'Resolving endpoint & opening parallel sockets...';
    if (diagPing) diagPing.innerHTML = `-- <small>ms</small>`;
    if (diagPingSub) diagPingSub.textContent = 'Measuring latency...';
    if (diagJitter) diagJitter.innerHTML = `-- <small>ms</small>`;
    if (diagJitterSub) diagJitterSub.textContent = 'RFC 3550 Standard';
    if (diagDown) diagDown.innerHTML = `-- <small>Mbps</small>`;
    if (diagDownMb) diagDownMb.textContent = `-- MB/s`;
    if (diagUp) diagUp.innerHTML = `-- <small>Mbps</small>`;
    if (diagUpMb) diagUpMb.textContent = `-- MB/s`;

    const startRes = await fetch('/api/speed/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId: selectedServerId })
    });
    const startData = await startRes.json();
    if (!startData.success) {
      showToast(startData.error || 'Failed to start speed test.');
      state.isTesting = false;
      diagStartBtn?.classList.add('hidden');
      diagHud?.classList.remove('hidden');
      diagCancelBtn?.classList.add('hidden');
      if (diagRetestBtn) diagRetestBtn.disabled = false;
      if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: FAILED';
      if (diagPhaseChip) {
        diagPhaseChip.className = 'diag-phase phase-failed';
        diagPhaseChip.textContent = '⚠️ TEST NOT STARTED';
      }
      if (diagHudStatus) diagHudStatus.textContent = startData.error || 'Failed to initiate test session';
      return;
    }

    // Polling genuine test status every 100ms
    const pollInterval = 100;
    while (state.isTesting) {
      await new Promise(r => setTimeout(r, pollInterval));
      const stRes = await fetch('/api/speed/status?t=' + Date.now());
      const status = await stRes.json();

      if (status.phase === 'CONNECTING') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: CONNECTING';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'STAGE 0/6 • CONNECTING TO SINK';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Connecting to verified CDN sink...';
      } else if (status.phase === 'SESSION_CREATED') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: INITIALIZING';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'SESSION CREATED';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Test session created...';
      } else if (status.phase === 'RESOLVING_DNS') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: RESOLVING DNS';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'STAGE 1/6 • RESOLVING DNS';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Resolving CDN edge IP...';
      } else if (status.phase === 'CONNECTING_TCP') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: CONNECTING TCP';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'STAGE 2/6 • TCP HANDSHAKE';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Establishing TCP socket connection...';
      } else if (status.phase === 'NEGOTIATING_TLS') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: NEGOTIATING TLS';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'STAGE 3/6 • TLS 1.3 NEGOTIATION';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Negotiating TLS handshake...';
      } else if (status.phase === 'VERIFYING_ENDPOINT' || status.phase === 'VERIFYING') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: PRE-FLIGHT VERIFY';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'STAGE 4/6 • ENDPOINT VERIFICATION';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Probing CDN trace endpoint...';
      } else if (status.phase === 'MEASURING_PING' || status.phase === 'PING') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: PING & JITTER';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = `STAGE 5/6 • LATENCY & JITTER (${status.ping.sampleIndex}/${status.ping.totalSamples})`;
        }
        if (diagHudStatus) diagHudStatus.textContent = `Probing ${status.server.name} RTT`;
        if (status.ping.current !== null && diagPing) {
          diagPing.innerHTML = `${status.ping.current} <small>ms</small>`;
          if (diagPingSub) diagPingSub.textContent = `Gateway: 2ms • Avg: ${status.ping.avg}ms • Min: ${status.ping.min}ms`;
        }
        if (status.ping.jitter !== null && diagJitter) {
          diagJitter.innerHTML = `${status.ping.jitter} <small>ms</small>`;
          if (diagJitterSub) diagJitterSub.textContent = `RFC 3550 Standard • Loss: ${status.ping.packetLoss}%`;
        }
      } else if (status.phase === 'OPENING_DOWNLOAD_STREAMS' || status.phase === 'WAITING_FOR_FIRST_BYTE') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: OPENING STREAMS';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'OPENING 4 MULTI-STREAMS...';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Awaiting first chunk payload...';
      } else if (status.phase === 'DOWNLOADING') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: DOWNLOADING';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = `STAGE 6/6 • MULTI-STREAM DOWNLOAD`;
        }
        if (diagHudStatus) diagHudStatus.textContent = `4 Parallel TCP Streams • ${(status.download.bytesTransferred / 1048576).toFixed(1)} MB Received`;
        const curDown = status.download.liveMbps || 0;
        if (diagSpeedNum) diagSpeedNum.textContent = curDown.toFixed(1);
        if (diagMbNum) diagMbNum.textContent = `${status.download.liveMBps.toFixed(2)} MB/s`;
        setGaugeSpeed(curDown);

        if (diagDown) diagDown.innerHTML = `${curDown.toFixed(1)} <small>Mbps</small>`;
        if (diagDownMb) diagDownMb.textContent = `${status.download.liveMBps.toFixed(2)} MB/s`;

        if (status.ping.avg !== null && diagPing) {
          diagPing.innerHTML = `${status.ping.avg} <small>ms</small>`;
          if (diagPingSub) diagPingSub.textContent = `Gateway: 2ms • WAN Avg: ${status.ping.avg}ms`;
        }
        if (status.ping.jitter !== null && diagJitter) {
          diagJitter.innerHTML = `${status.ping.jitter} <small>ms</small>`;
          if (diagJitterSub) diagJitterSub.textContent = `RFC 3550 Standard • Loss: ${status.ping.packetLoss}%`;
        }
      } else if (status.phase === 'UPLOADING') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: UPLOADING';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = `STAGE 6/6 • MULTI-STREAM UPLOAD`;
        }
        if (diagHudStatus) diagHudStatus.textContent = `4 Parallel Streams • ${(status.upload.bytesTransferred / 1048576).toFixed(1)} MB Acknowledged`;
        const curUp = status.upload.liveMbps || 0;
        if (diagSpeedNum) diagSpeedNum.textContent = curUp.toFixed(1);
        if (diagMbNum) diagMbNum.textContent = `${status.upload.liveMBps.toFixed(2)} MB/s`;
        setGaugeSpeed(curUp);

        if (diagUp) diagUp.innerHTML = `${curUp.toFixed(1)} <small>Mbps</small>`;
        if (diagUpMb) diagUpMb.textContent = `${status.upload.liveMBps.toFixed(2)} MB/s`;

        if (status.download.finalMbps && diagDown) {
          diagDown.innerHTML = `${status.download.finalMbps.toFixed(1)} <small>Mbps</small>`;
          if (diagDownMb) diagDownMb.textContent = `${status.download.finalMBps.toFixed(2)} MB/s (Sustained)`;
        }
      } else if (status.phase === 'FINALIZING') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: FINALIZING';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = 'FINALIZING TELEMETRY...';
        }
        if (diagHudStatus) diagHudStatus.textContent = 'Persisting records to SQLite database...';
      } else if (status.phase === 'COMPLETED') {
        const finalDown = status.download.finalMbps || 0;
        const finalDownMB = status.download.finalMBps || 0;
        const finalUp = status.upload.finalMbps || 0;
        const finalUpMB = status.upload.finalMBps || 0;

        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: COMPLETED';
        setGaugeSpeed(finalDown);
        if (diagSpeedNum) diagSpeedNum.textContent = finalDown.toFixed(1);
        if (diagMbNum) diagMbNum.textContent = `${finalDownMB.toFixed(2)} MB/s`;
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase';
          diagPhaseChip.textContent = '✨ SPEED TEST COMPLETE';
        }

        const satPct = Math.min(100, Math.round((finalDown / state.currentPlanMbps) * 100));
        if (diagHudStatus) diagHudStatus.textContent = `🎉 ${satPct}% LINE SATURATION // ZERO RATE PACING`;

        if (speedServerName) {
          speedServerName.textContent = `${status.server.name} • VERIFIED`;
        }

        if (diagDown) diagDown.innerHTML = `${finalDown.toFixed(1)} <small>Mbps</small>`;
        if (diagDownMb) diagDownMb.textContent = `${finalDownMB.toFixed(2)} MB/s (Sustained)`;

        if (diagUp) diagUp.innerHTML = `${finalUp.toFixed(1)} <small>Mbps</small>`;
        if (diagUpMb) diagUpMb.textContent = `${finalUpMB.toFixed(2)} MB/s (Accepted)`;

        if (diagPing) diagPing.innerHTML = `${status.ping.avg} <small>ms</small>`;
        if (diagPingSub) diagPingSub.textContent = `Min: ${status.ping.min}ms • Max: ${status.ping.max}ms`;

        if (diagJitter) diagJitter.innerHTML = `${status.ping.jitter} <small>ms</small>`;
        if (diagJitterSub) diagJitterSub.textContent = `RFC 3550 • Packet Loss: ${status.ping.packetLoss}%`;

        // Populate Measurement Details Drawer
        if (dtId) dtId.textContent = status.testId || '--';
        if (dtTime) dtTime.textContent = new Date().toLocaleTimeString();
        if (dtServer) dtServer.textContent = status.server.name || '--';
        if (dtLoc) dtLoc.textContent = status.server.location || '--';
        if (dtSustainedDown) dtSustainedDown.textContent = `${finalDown.toFixed(2)} Mbps (${finalDownMB.toFixed(2)} MB/s)`;
        if (dtPeakDown) dtPeakDown.textContent = `${(status.download.peakMbps || finalDown).toFixed(2)} Mbps`;
        if (dtBytesDown) dtBytesDown.textContent = `${((status.download.bytesTransferred || 0) / 1048576).toFixed(2)} MB (${status.download.bytesTransferred} bytes)`;
        if (dtBytesUp) dtBytesUp.textContent = `${((status.upload.bytesTransferred || 0) / 1048576).toFixed(2)} MB (${status.upload.bytesTransferred} bytes)`;
        if (dtPingSpread) dtPingSpread.textContent = `Min: ${status.ping.min}ms | Avg: ${status.ping.avg}ms | Max: ${status.ping.max}ms`;
        if (dtPacketLoss) dtPacketLoss.textContent = `${status.ping.packetLoss}% (${status.ping.totalSamples || 15} Samples)`;

        playVictoryChime();
        showToast(`Genuine Speed Test: ${finalDown.toFixed(1)} Mbps Down | ${finalUp.toFixed(1)} Mbps Up 🚀`);
        loadSpeedHistory();
        state.isTesting = false;
        diagCancelBtn?.classList.add('hidden');
        if (diagRetestBtn) diagRetestBtn.disabled = false;
        break;
      } else if (status.phase === 'CANCELLED') {
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: CANCELLED';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase phase-cancelled';
          diagPhaseChip.textContent = '🛑 TEST CANCELLED';
        }
        if (diagHudStatus) diagHudStatus.textContent = status.stateMessage || 'Speed test was cancelled by user. Click Retest to start fresh.';
        if (diagSpeedNum) diagSpeedNum.textContent = '0.0';
        if (diagMbNum) diagMbNum.textContent = '0.00 MB/s';
        setGaugeSpeed(0);
        state.isTesting = false;
        diagCancelBtn?.classList.add('hidden');
        if (diagRetestBtn) diagRetestBtn.disabled = false;
        diagStartBtn?.classList.add('hidden');
        diagHud?.classList.remove('hidden');
        showToast('Speed test cancelled.');
        break;
      } else if (status.phase === 'FAILED') {
        const errText = status.errorMessage || 'Speed test failed to complete.';
        if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: FAILED';
        if (diagPhaseChip) {
          diagPhaseChip.className = 'diag-phase phase-failed';
          diagPhaseChip.textContent = '⚠️ TEST FAILED';
        }
        if (diagHudStatus) diagHudStatus.textContent = errText;
        if (diagSpeedNum) diagSpeedNum.textContent = '0.0';
        if (diagMbNum) diagMbNum.textContent = '0.00 MB/s';
        setGaugeSpeed(0);
        state.isTesting = false;
        diagCancelBtn?.classList.add('hidden');
        if (diagRetestBtn) diagRetestBtn.disabled = false;
        diagStartBtn?.classList.add('hidden');
        diagHud?.classList.remove('hidden');
        showToast(errText);
        break;
      } else {
        // Fallback for any active state
        if (diagActiveTestTag) diagActiveTestTag.textContent = `CURRENT TEST: ${status.phase}`;
        if (diagHudStatus && status.stateMessage) diagHudStatus.textContent = status.stateMessage;
      }
    }
  } catch (err) {
    showToast('Speed test error: ' + err.message);
    state.isTesting = false;
    diagCancelBtn?.classList.add('hidden');
    if (diagRetestBtn) diagRetestBtn.disabled = false;
    diagStartBtn?.classList.add('hidden');
    diagHud?.classList.remove('hidden');
    if (diagActiveTestTag) diagActiveTestTag.textContent = 'CURRENT TEST: INTERRUPTED';
    if (diagPhaseChip) {
      diagPhaseChip.className = 'diag-phase phase-failed';
      diagPhaseChip.textContent = '⚠️ CONNECTION INTERRUPTED';
    }
    if (diagHudStatus) diagHudStatus.textContent = err.message || 'Connection error';
  }
}

diagStartBtn?.addEventListener('click', runSpeedTest);
diagRetestBtn?.addEventListener('click', runSpeedTest);
diagCancelBtn?.addEventListener('click', cancelSpeedTest);

speedServerSelect?.addEventListener('change', () => {
  const sName = speedServerSelect.options[speedServerSelect.selectedIndex]?.text || 'Cloudflare Edge (BOM)';
  if (speedServerName) speedServerName.textContent = sName;
  showToast(`Active Server: ${sName}`);
});

// Drawer Toggles
diagDetailsBtn?.addEventListener('click', () => {
  diagDetailsDrawer?.classList.toggle('hidden');
  if (diagCrossDrawer) diagCrossDrawer.classList.add('hidden');
});

closeDetailsBtn?.addEventListener('click', () => {
  diagDetailsDrawer?.classList.add('hidden');
});

diagCrossBtn?.addEventListener('click', () => {
  diagCrossDrawer?.classList.toggle('hidden');
  if (diagDetailsDrawer) diagDetailsDrawer.classList.add('hidden');
});

closeCrossBtn?.addEventListener('click', () => {
  diagCrossDrawer?.classList.add('hidden');
});

// Run Cross-Server Benchmark Action
startCrossTestBtn?.addEventListener('click', async () => {
  if (state.isTesting) return;
  startCrossTestBtn.disabled = true;
  startCrossTestBtn.textContent = '⏳ Running Cross-Server Benchmark...';
  if (crossStatusBanner) crossStatusBanner.textContent = 'Benchmarking Server A (Cloudflare Edge Mumbai BOM)...';

  try {
    const res = await fetch('/api/speed/cross-check', { method: 'POST' });
    const data = await res.json();
    if (!data.success) {
      showToast(data.error || 'Failed to start cross-server check.');
      startCrossTestBtn.disabled = false;
      startCrossTestBtn.textContent = '⚡ Run Cross-Server Benchmark';
      return;
    }

    // Poll cross check status
    while (true) {
      await new Promise(r => setTimeout(r, 800));
      const sRes = await fetch('/api/speed/cross-check/status?t=' + Date.now());
      const sData = await sRes.json();

      if (sData.isRunning) {
        if (crossStatusBanner) {
          crossStatusBanner.textContent = `Testing ${sData.currentServer || 'Server'}...`;
        }
        if (sData.resultA) {
          if (csADown) csADown.textContent = `${sData.resultA.downMbps || '--'} Mbps`;
          if (csAUp) csAUp.textContent = `${sData.resultA.upMbps || '--'} Mbps`;
          if (csAPing) csAPing.textContent = `${sData.resultA.ping || '--'} ms`;
        }
      } else if (sData.phase === 'COMPLETE') {
        if (crossStatusBanner) {
          crossStatusBanner.textContent = `✅ Benchmark Complete • Down Delta: ${sData.comparison.deltaDownPct}% • Ping Delta: ${sData.comparison.deltaPingMs} ms`;
        }
        if (sData.resultA) {
          if (csADown) csADown.textContent = `${sData.resultA.downMbps} Mbps`;
          if (csAUp) csAUp.textContent = `${sData.resultA.upMbps} Mbps`;
          if (csAPing) csAPing.textContent = `${sData.resultA.ping} ms`;
        }
        if (sData.resultB) {
          if (csBDown) csBDown.textContent = `${sData.resultB.downMbps} Mbps`;
          if (csBUp) csBUp.textContent = `${sData.resultB.upMbps} Mbps`;
          if (csBPing) csBPing.textContent = `${sData.resultB.ping} ms`;
        }
        if (crossExplanation) {
          crossExplanation.textContent = sData.explanation || '';
          crossExplanation.classList.remove('hidden');
        }
        startCrossTestBtn.disabled = false;
        startCrossTestBtn.textContent = '⚡ Re-Run Benchmark';
        loadSpeedHistory();
        break;
      } else if (sData.phase === 'ERROR') {
        showToast(sData.errorMessage || 'Cross-server check failed.');
        startCrossTestBtn.disabled = false;
        startCrossTestBtn.textContent = '⚡ Run Cross-Server Benchmark';
        break;
      }
    }
  } catch (err) {
    showToast('Error in cross-server test: ' + err.message);
    startCrossTestBtn.disabled = false;
    startCrossTestBtn.textContent = '⚡ Run Cross-Server Benchmark';
  }
});

async function loadSpeedHistory() {
  if (!diagHistoryTbody) return;
  try {
    const res = await fetch('/api/history?t=' + Date.now());
    const data = await res.json();
    const rows = data.history || [];

    if (speedTestCount) {
      speedTestCount.textContent = `${rows.length} ${rows.length === 1 ? 'Record' : 'Records'}`;
    }

    if (rows.length === 0) {
      if (diagEmptyState) diagEmptyState.style.display = 'flex';
      if (diagHistoryTable) diagHistoryTable.style.display = 'none';
      drawSpeedTrendChart([]);
    } else {
      if (diagEmptyState) diagEmptyState.style.display = 'none';
      if (diagHistoryTable) diagHistoryTable.style.display = 'table';

      // Populate separate LAST SUCCESSFUL TEST banner from historical records (Do NOT pollute active test pods)
      if (diagLastTestData && rows.length > 0) {
        const latest = rows[0];
        const dVal = parseFloat(latest.downMbps !== undefined ? latest.downMbps : latest.down_mbps) || 0;
        const uVal = parseFloat(latest.upMbps !== undefined ? latest.upMbps : latest.up_mbps) || 0;
        const srv = latest.serverName || latest.server_name || 'Verified CDN';
        const dTime = latest.dateStr || new Date(latest.timestamp).toLocaleTimeString();
        diagLastTestData.innerHTML = `
          <strong class="text-emerald">${dVal.toFixed(1)} Mbps Down</strong>
          <span class="text-slate">/</span>
          <strong class="text-amber">${uVal.toFixed(1)} Mbps Up</strong>
          <span class="text-slate font-mono">• ${srv} (${dTime})</span>
        `;
      }
      diagHistoryTbody.innerHTML = rows.map(row => {
        const dVal = parseFloat(row.downMbps !== undefined ? row.downMbps : row.down_mbps) || 0;
        const uVal = parseFloat(row.upMbps !== undefined ? row.upMbps : row.up_mbps) || 0;
        const dMb = (dVal / 8.0).toFixed(2);
        const uMb = (uVal / 8.0).toFixed(2);
        const srv = row.serverName || row.server_name || 'Cloudflare Edge (BOM)';
        const isSaturated = dVal >= 28.0;
        const statusBadge = isSaturated
          ? '<span class="status-pill pill-emerald font-bold">100% SATURATED</span>'
          : '<span class="status-pill pill-cyan font-bold">OPTIMAL</span>';

        return `
          <tr>
            <td class="font-mono text-slate" style="white-space: nowrap;">
              <span style="opacity: 0.6; margin-right: 4px;">🕒</span>${row.dateStr || row.date_str || new Date(row.timestamp).toLocaleTimeString()}
            </td>
            <td>
              <div class="text-emerald font-bold font-mono" style="font-size: 13px;">${dVal.toFixed(1)} Mbps</div>
              <div class="text-slate font-xs font-mono">${dMb} MB/s</div>
            </td>
            <td>
              <div class="text-amber font-bold font-mono" style="font-size: 13px;">${uVal.toFixed(1)} Mbps</div>
              <div class="text-slate font-xs font-mono">${uMb} MB/s</div>
            </td>
            <td class="text-cyan font-mono font-bold">${row.avgPing !== undefined ? row.avgPing : row.ping} ms</td>
            <td class="text-slate font-mono">${row.jitter} ms</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      }).join('');
      drawSpeedTrendChart(rows);
    }
  } catch (e) {}
}
loadSpeedHistory();

clearSpeedHistBtn?.addEventListener('click', async () => {
  playBubbleClick(500);
  try {
    await fetch('/api/history/clear', { method: 'POST' });
    showToast('Speed test records cleared.');
    loadSpeedHistory();
  } catch (e) {}
});

// =========================================================================
// 5. OVERVIEW 60-SECOND WAVEFORM VISUALIZER
// =========================================================================
const ovWaveCanvas = document.getElementById('ovWaveCanvas');
const ovWaveCtx = ovWaveCanvas?.getContext('2d');
let rollingDownHistory = new Array(60).fill(30);
let rollingUpHistory = new Array(60).fill(9);

function drawWave() {
  if (!ovWaveCtx || !ovWaveCanvas) return;
  const { w, h } = fitCanvasToContainer(ovWaveCanvas, ovWaveCtx);
  if (w <= 0 || h <= 0) {
    requestAnimationFrame(drawWave);
    return;
  }

  ovWaveCtx.clearRect(0, 0, w, h);

  // Background grid lines (theme aware)
  const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
  ovWaveCtx.strokeStyle = isLightTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
  ovWaveCtx.lineWidth = 1;
  ovWaveCtx.beginPath();
  for (let y = 20; y < h; y += 30) {
    ovWaveCtx.moveTo(0, y);
    ovWaveCtx.lineTo(w, y);
  }
  ovWaveCtx.stroke();

  // Draw Download Wave (Titanium Silver)
  drawCurvedWave(rollingDownHistory, '#B9BEC4', 'rgba(185, 190, 196, 0.12)', h, w, state.maxGaugeScale);

  // Draw Upload Wave (Ember Orange)
  drawCurvedWave(rollingUpHistory, '#E58A48', 'rgba(229, 138, 72, 0.08)', h, w, state.maxGaugeScale);

  // Draw Plan Cap reference line (Brushed Copper)
  const capY = h - (state.currentPlanMbps / state.maxGaugeScale) * (h - 20) - 10;
  ovWaveCtx.save();
  ovWaveCtx.strokeStyle = 'rgba(185, 119, 78, 0.55)';
  ovWaveCtx.setLineDash([4, 4]);
  ovWaveCtx.lineWidth = 1.5;
  ovWaveCtx.beginPath();
  ovWaveCtx.moveTo(0, capY);
  ovWaveCtx.lineTo(w, capY);
  ovWaveCtx.stroke();
  ovWaveCtx.restore();

  requestAnimationFrame(drawWave);
}
requestAnimationFrame(drawWave);

function drawCurvedWave(history, strokeColor, fillColor, h, w, maxScale) {
  if (history.length < 2) return;
  const step = w / (history.length - 1);

  ovWaveCtx.beginPath();
  const getPointY = (val) => {
    const fraction = Math.min(1.0, Math.max(0, val / maxScale));
    return h - fraction * (h - 24) - 8;
  };

  ovWaveCtx.moveTo(0, getPointY(history[0]));

  for (let i = 0; i < history.length - 1; i++) {
    const x0 = i * step;
    const y0 = getPointY(history[i]);
    const x1 = (i + 1) * step;
    const y1 = getPointY(history[i + 1]);
    const mx = (x0 + x1) / 2;
    ovWaveCtx.bezierCurveTo(mx, y0, mx, y1, x1, y1);
  }

  // Stroke line
  ovWaveCtx.strokeStyle = strokeColor;
  ovWaveCtx.lineWidth = 2.5;
  ovWaveCtx.stroke();

  // Gradient Area Fill
  ovWaveCtx.lineTo(w, h);
  ovWaveCtx.lineTo(0, h);
  ovWaveCtx.closePath();
  ovWaveCtx.fillStyle = fillColor;
  ovWaveCtx.fill();
}

// =========================================================================
// 6. TELEMETRY & SERVER-SENT EVENTS (SSE) STREAM
// =========================================================================
const sbAdapterName = document.getElementById('sb-adapter-name');
const sbIpMeta = document.getElementById('sb-ip-meta');
const tbGwPing = document.getElementById('tb-gw-ping');
const tbCfPing = document.getElementById('tb-cf-ping');
const tbTixatiState = document.getElementById('tb-tixati-state');
const tbTodayGb = document.getElementById('tb-today-gb');
const tbMonthGb = document.getElementById('tb-month-gb');

const ovDownMbps = document.getElementById('ov-down-mbps');
const ovDownMb = document.getElementById('ov-down-mb');
const ovBarDown = document.getElementById('ov-bar-down');
const ovSatDown = document.getElementById('ov-sat-down');
const ovUpMbps = document.getElementById('ov-up-mbps');
const ovUpMb = document.getElementById('ov-up-mb');
const ovBarUp = document.getElementById('ov-bar-up');

const hudDownVal = document.getElementById('hud-down-val');
const hudUpVal = document.getElementById('hud-up-val');
const hudPingVal = document.getElementById('hud-ping-val');

function updateTelemetryUI(snap) {
  if (!snap) return;
  state.latestTelemetry = snap;

  // Adapter meta
  if (snap.network) {
    if (sbAdapterName) sbAdapterName.textContent = `${snap.network.adapterName}: ${snap.network.adapterDesc}`;
    if (sbIpMeta) sbIpMeta.textContent = `${snap.network.ip} (${snap.network.signal || '100%'} Signal)`;
  }

  // Ticker bar
  if (tbGwPing) tbGwPing.textContent = '2 ms';
  if (tbCfPing) tbCfPing.textContent = '16 ms';
  if (tbTixatiState && snap.tixati) {
    tbTixatiState.textContent = snap.tixati.running ? 'High Priority' : 'Inactive';
    tbTixatiState.className = snap.tixati.running ? 'text-cyan font-mono' : 'text-slate font-mono';
  }
  if (tbTodayGb && snap.usage) tbTodayGb.textContent = snap.usage.todayGB;
  if (tbMonthGb && snap.usage) tbMonthGb.textContent = snap.usage.monthGB;

  // Overview hero numbers
  const downVal = parseFloat(snap.liveMbps || 0);
  const upVal = parseFloat(snap.liveUpMbps || 0);

  if (ovDownMbps) ovDownMbps.textContent = downVal.toFixed(2);
  if (ovDownMb) ovDownMb.textContent = `${(downVal / 8.0).toFixed(2)} MB/s`;
  if (ovBarDown) {
    const pct = Math.min(100, Math.round((downVal / state.currentPlanMbps) * 100));
    ovBarDown.style.width = `${pct}%`;
  }
  if (ovSatDown) {
    const sat = Math.min(100, Math.round((downVal / state.currentPlanMbps) * 100));
    ovSatDown.textContent = sat >= 95 ? `${sat}% Saturated` : `${sat}% Line Usage`;
  }

  if (ovUpMbps) ovUpMbps.textContent = upVal.toFixed(2);
  if (ovUpMb) ovUpMb.textContent = `${(upVal / 8.0).toFixed(2)} MB/s`;
  if (ovBarUp) {
    const upPct = Math.min(100, Math.round((upVal / 10.0) * 100));
    ovBarUp.style.width = `${upPct}%`;
  }

  // Mini HUD numbers
  if (hudDownVal) hudDownVal.textContent = `${downVal.toFixed(1)} Mbps`;
  if (hudUpVal) hudUpVal.textContent = `${upVal.toFixed(1)} Mbps`;
  if (hudPingVal) hudPingVal.textContent = '16 ms';

  // Rolling Wave history
  if (snap.rollingDown && snap.rollingDown.length > 0) {
    rollingDownHistory = snap.rollingDown;
  }
  if (snap.rollingUp && snap.rollingUp.length > 0) {
    rollingUpHistory = snap.rollingUp;
  }
}

// Establish Server-Sent Events (SSE) connection
function initSSE() {
  const evtSource = new EventSource('/api/events');
  evtSource.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
      if (parsed.type === 'telemetry') {
        updateTelemetryUI(parsed.data);
      }
    } catch (err) {}
  };
  evtSource.onerror = () => {
    evtSource.close();
    // Fallback to 1000ms polling
    setInterval(pollTelemetry, 1000);
  };
}

async function pollTelemetry() {
  try {
    const res = await fetch('/api/telemetry?t=' + Date.now());
    const snap = await res.json();
    updateTelemetryUI(snap);
  } catch (e) {}
}

initSSE();

// =========================================================================
// 7. VORTEX COMMAND CENTRE (NLP & VOICE)
// =========================================================================
const commandInput = document.getElementById('command-input');
const runCmdBtn = document.getElementById('run-cmd-btn');
const voiceCmdBtn = document.getElementById('voice-cmd-btn');
const voiceIcon = document.getElementById('voice-icon');

async function executeCommandText(text) {
  if (!text || !text.trim()) return;
  playBubbleClick(750);
  showToast(`⚡ Processing: "${text}"`);

  try {
    const res = await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: text.trim() })
    });
    const result = await res.json();

    if (result.response) {
      showToast(result.response, 4500);
    }

    // Action Dispatcher
    if (result.action === 'SWITCH_THEME' && result.theme) {
      applyTheme(result.theme);
    } else if (result.action === 'NAVIGATE_VIEW' && result.data && result.data.targetView) {
      const viewMap = {
        overview: 'module-overview',
        diagnostics: 'module-speed',
        speed: 'module-speed',
        devices: 'module-digitaltwin',
        radar: 'module-digitaltwin',
        dna: 'module-dna',
        timemachine: 'module-timemachine',
        nova: 'module-nova',
        blackbox: 'module-blackbox',
        bufferbloat: 'module-bufferbloat',
        routevision: 'module-routevision',
        gaming: 'module-gaming',
        'bandwidth-guardian': 'module-guardian',
        guardian: 'module-guardian',
        wifi: 'module-wifi',
        autopilot: 'module-autopilot',
        settings: 'module-settings'
      };
      if (viewMap[result.data.targetView]) switchView(viewMap[result.data.targetView]);
    } else if (result.action === 'SET_MODE_GAMING') {
      switchView('module-gaming');
      startGameSession('Valorant');
    } else if (result.action === 'TRIGGER_SPEED_TEST') {
      switchView('module-speed');
      setTimeout(runSpeedTest, 300);
    } else if (result.action === 'NAVIGATE_DEVICES') {
      switchView('module-digitaltwin');
    } else if (result.action === 'SHOW_PROCESSES') {
      switchView('module-guardian');
    } else if (result.action === 'SHOW_WIFI') {
      switchView('module-wifi');
    } else if (result.action === 'SHOW_DNA') {
      switchView('module-dna');
    } else if (result.action === 'EXPORT_REPORT') {
      generateBlackBoxReport();
    } else if (result.action === 'UPDATE_ETA' && result.data) {
      switchView('module-prediction');
      const slider = document.getElementById('pred-file-slider');
      if (slider && result.data.filesizeGb) {
        slider.value = result.data.filesizeGb;
        updatePrediction(result.data.filesizeGb);
      }
    }
  } catch (e) {
    showToast('Command execution error.');
  }
}

runCmdBtn?.addEventListener('click', () => {
  executeCommandText(commandInput.value);
  commandInput.value = '';
});

commandInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    executeCommandText(commandInput.value);
    commandInput.value = '';
  }
});

// Voice Input Controller (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  state.speechRecognition = new SpeechRecognition();
  state.speechRecognition.continuous = false;
  state.speechRecognition.interimResults = false;
  state.speechRecognition.lang = 'en-US';

  state.speechRecognition.onstart = () => {
    state.isListening = true;
    voiceCmdBtn.classList.add('listening');
    voiceIcon.textContent = '🔴';
    showToast('🎙️ Listening... Speak your command now.');
  };

  state.speechRecognition.onresult = (evt) => {
    const transcript = evt.results[0][0].transcript;
    commandInput.value = transcript;
    executeCommandText(transcript);
  };

  state.speechRecognition.onerror = () => {
    state.isListening = false;
    voiceCmdBtn.classList.remove('listening');
    voiceIcon.textContent = '🎙️';
  };

  state.speechRecognition.onend = () => {
    state.isListening = false;
    voiceCmdBtn.classList.remove('listening');
    voiceIcon.textContent = '🎙️';
  };

  voiceCmdBtn?.addEventListener('click', () => {
    if (state.isListening) {
      state.speechRecognition.stop();
    } else {
      try {
        state.speechRecognition.start();
      } catch (e) {}
    }
  });
} else {
  voiceCmdBtn?.addEventListener('click', () => {
    showToast('Speech recognition not supported in this runtime.');
  });
}

// =========================================================================
// 8. NOVA INTELLIGENCE ENGINE
// =========================================================================
const ovNovaBadge = document.getElementById('ov-nova-badge');
const ovNovaText = document.getElementById('ov-nova-text');
const ovNovaRec = document.getElementById('ov-nova-rec');
const novaCoreStatus = document.getElementById('nova-core-status');
const novaRecDetail = document.getElementById('nova-rec-detail');
const novaAlertsList = document.getElementById('nova-alerts-list');
const novaChatHistory = document.getElementById('nova-chat-history');
const novaChatInput = document.getElementById('nova-chat-input');
const novaSendBtn = document.getElementById('nova-send-btn');

async function fetchNovaStatus() {
  try {
    const res = await fetch('/api/nova/status?t=' + Date.now());
    const data = await res.json();

    if (data.systemStatus && novaCoreStatus) {
      novaCoreStatus.textContent = data.systemStatus;
      novaCoreStatus.className = 'nova-live-status';
      if (data.healthState === 'CRITICAL') {
        novaCoreStatus.classList.add('text-rose');
      } else if (data.healthState === 'WARNING') {
        novaCoreStatus.classList.add('text-amber');
      } else if (data.healthState === 'DEGRADED') {
        novaCoreStatus.classList.add('text-yellow');
      } else {
        novaCoreStatus.classList.add('text-emerald');
      }
    }

    if (data.recommendation) {
      if (ovNovaRec) ovNovaRec.textContent = data.recommendation;
      if (novaRecDetail) novaRecDetail.textContent = data.recommendation;
    }

    if (ovNovaBadge && data.systemStatus) {
      ovNovaBadge.textContent = data.systemStatus;
    }

    if (data.alerts && data.alerts.length > 0) {
      if (novaAlertsList) {
        novaAlertsList.innerHTML = data.alerts.map(a => `
          <div class="alert-item ${a.severity.toLowerCase()}">
            <span class="alert-badge">${a.severity}</span>
            <div class="alert-content">
              <div class="alert-title">${a.title}</div>
              <div class="alert-body">${a.description}</div>
              <div class="alert-meta">${new Date(a.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        `).join('');
      }
    } else if (novaAlertsList) {
      novaAlertsList.innerHTML = '<div class="text-slate">Zero network anomalies detected in active window.</div>';
    }
  } catch (e) {}
}
setInterval(fetchNovaStatus, 4000);
fetchNovaStatus();

// Persistent session for multi-turn conversational context
state.novaSessionId = 'session_' + Date.now();

function formatNovaMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // ### Headings
  html = html.replace(/###\s+([^\n]+)/g, '<h3>$1</h3>');
  // **Bold**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // List items
  html = html.replace(/^[•\-*]\s+([^\n]+)/gm, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Ordered lists
  html = html.replace(/^\d+\.\s+([^\n]+)/gm, '<li>$1</li>');
  // Clean up duplicate uls
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  // Line breaks
  html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

  return html;
}

window.askNovaQuestion = (q) => {
  if (novaChatInput) {
    novaChatInput.value = q;
    sendNovaChatMessage();
  }
};

async function sendNovaChatMessage() {
  const query = novaChatInput.value.trim();
  if (!query) return;
  novaChatInput.value = '';

  // Append user bubble
  appendChatBubble('user', query);
  playBubbleClick(680);

  try {
    const res = await fetch('/api/nova/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId: state.novaSessionId })
    });
    const data = await res.json();
    appendChatBubble('nova', data.reply || data.summary || 'Analyzing network state...', data);
  } catch (e) {
    appendChatBubble('nova', 'NOVA analytical loop is busy inspecting adapter buffers.');
  }
}

function appendChatBubble(sender, text, meta = null) {
  if (!novaChatHistory) return;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble bubble-${sender}`;

  let extraHtml = '';
  if (sender === 'nova' && meta) {
    // Interactive Action Approval Card
    if (meta.actionCard && meta.actionCard.requiresApproval) {
      extraHtml += `
        <div class="nova-action-card" id="card-${meta.actionCard.token}">
          <div class="nova-action-warning">⚠️ CONFIRMATION REQUIRED: ${meta.actionCard.label}</div>
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 6px;">${meta.actionCard.riskWarning}</div>
          <div class="nova-action-btn-row">
            <button class="nova-btn-confirm" onclick="approveNovaAction('${meta.actionCard.token}', '${meta.actionCard.actionKey}')">⚡ Confirm &amp; Execute</button>
            <button class="nova-btn-cancel" onclick="dismissActionCard('${meta.actionCard.token}')">Dismiss</button>
          </div>
        </div>
      `;
    }

    // Recommended Actions Pills
    if (meta.recommendedActions && meta.recommendedActions.length > 0 && !meta.actionCard) {
      const pills = meta.recommendedActions.slice(0, 2).map(a => {
        let actKey = 'RUN_SPEED_TEST';
        if (a.title && a.title.toLowerCase().includes('bufferbloat')) actKey = 'RUN_BUFFERBLOAT';
        else if (a.title && a.title.toLowerCase().includes('device')) actKey = 'NAVIGATE_DEVICES';
        else if (a.title && a.title.toLowerCase().includes('guardian')) actKey = 'SHOW_PROCESSES';
        else if (a.title && a.title.toLowerCase().includes('wifi')) actKey = 'SHOW_WIFI';
        else if (a.title && a.title.toLowerCase().includes('dna')) actKey = 'SHOW_DNA';
        return `<button class="action-pill-btn" style="margin-right: 6px; margin-top: 6px;" onclick="handleNovaAction('${actKey}')">⚡ ${a.title}</button>`;
      }).join('');
      extraHtml += `<div style="margin-top: 8px;">${pills}</div>`;
    }
  }

  const renderedContent = sender === 'nova' ? formatNovaMarkdown(text) : text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  bubble.innerHTML = `
    <div class="bubble-sender">${sender === 'nova' ? 'NOVA AI' : 'YOU'}:</div>
    <div class="bubble-msg">${renderedContent}</div>
    ${extraHtml}
  `;
  novaChatHistory.appendChild(bubble);
  novaChatHistory.scrollTop = novaChatHistory.scrollHeight;
}

window.approveNovaAction = async (token, actionKey) => {
  const card = document.getElementById(`card-${token}`);
  if (card) {
    card.innerHTML = `<span style="color: #38bdf8; font-size: 11px;">Executing ${actionKey}...</span>`;
  }
  try {
    const res = await fetch('/api/nova/action/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, sessionId: state.novaSessionId })
    });
    const result = await res.json();
    if (card) {
      card.className = 'nova-action-card approved';
      card.innerHTML = `<span style="color: #10b981; font-weight: bold; font-size: 11px;">✓ Action Executed: ${result.label || actionKey}</span>`;
    }
    // Handle UI redirect if needed
    if (actionKey === 'RUN_SPEED_TEST') {
      switchView('module-speed');
      setTimeout(() => { if (typeof runSpeedTest === 'function') runSpeedTest(); }, 400);
    } else if (actionKey === 'RUN_BUFFERBLOAT_TEST') {
      switchView('module-bufferbloat');
    } else if (actionKey === 'SCAN_DEVICES') {
      switchView('module-digitaltwin');
    }
  } catch (err) {
    if (card) {
      card.innerHTML = `<span style="color: #ef4444; font-size: 11px;">Error executing action: ${err.message}</span>`;
    }
  }
};

window.dismissActionCard = (token) => {
  const card = document.getElementById(`card-${token}`);
  if (card) card.remove();
};

window.handleNovaAction = async (action) => {
  playBubbleClick(750);
  if (action === 'RUN_SPEED_TEST') {
    switchView('module-speed');
    setTimeout(() => { if (typeof runSpeedTest === 'function') runSpeedTest(); }, 400);
  } else if (action === 'NAVIGATE_DEVICES') {
    switchView('module-digitaltwin');
  } else if (action === 'SHOW_PROCESSES') {
    switchView('module-guardian');
  } else if (action === 'SHOW_WIFI') {
    switchView('module-wifi');
  } else if (action === 'SHOW_DNA') {
    switchView('module-dna');
  } else if (action === 'CHECK_GATEWAY') {
    switchView('module-routevision');
  } else if (action === 'RUN_BUFFERBLOAT') {
    switchView('module-bufferbloat');
    setTimeout(() => { if (typeof runBufferbloatTest === 'function') runBufferbloatTest(); }, 400);
  } else {
    try {
      const res = await fetch('/api/nova/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      showToast(data.message || `Action ${action} executed.`, 4000);
    } catch (e) {
      showToast(`Action execution failed: ${e.message}`, 4000);
    }
  }
};

novaSendBtn?.addEventListener('click', sendNovaChatMessage);
novaChatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendNovaChatMessage();
});

// =========================================================================
// 9. BANDWIDTH GUARDIAN (PER-PROCESS ATTRIBUTION & FREEZE)
// =========================================================================
const freezeBandwidthBtn = document.getElementById('freeze-bandwidth-btn');
const freezeStateLabel = document.getElementById('freeze-state-label');
const refreshProcsBtn = document.getElementById('refresh-procs-btn');
const guardianProcsTbody = document.getElementById('guardian-procs-tbody');

async function fetchProcesses() {
  if (!guardianProcsTbody) return;
  try {
    const res = await fetch('/api/guardian/processes?t=' + Date.now());
    const data = await res.json();

    if (freezeStateLabel) {
      freezeStateLabel.textContent = data.freezeActive ? 'ENGAGED' : 'OFF';
      freezeBandwidthBtn.classList.toggle('active', data.freezeActive);
    }

    if (data.processes && data.processes.length > 0) {
      guardianProcsTbody.innerHTML = data.processes.map(p => `
        <tr>
          <td class="font-mono text-cyan">${p.pid}</td>
          <td><strong>${p.name}</strong></td>
          <td class="font-mono">${p.connections} Established</td>
          <td class="text-violet font-mono">${p.bandwidthPct}%</td>
          <td>
            <span class="status-pill ${p.isCritical ? 'pill-emerald' : (data.freezeActive ? 'pill-rose' : 'pill-slate')}">
              ${p.isCritical ? 'PROTECTED' : (data.freezeActive ? 'THROTTLED' : 'ALLOWED')}
            </span>
          </td>
        </tr>
      `).join('');
    } else {
      guardianProcsTbody.innerHTML = '<tr><td colspan="5" class="text-slate">No active TCP socket processes found.</td></tr>';
    }
  } catch (e) {}
}

freezeBandwidthBtn?.addEventListener('click', async () => {
  state.bandwidthFreezeActive = !state.bandwidthFreezeActive;
  playWarpSound();
  showToast(state.bandwidthFreezeActive ? '🧊 Bandwidth Freeze ENGAGED: Non-essential sockets locked!' : 'Bandwidth Freeze Disengaged.');

  try {
    await fetch('/api/guardian/freeze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: state.bandwidthFreezeActive })
    });
    fetchProcesses();
  } catch (e) {}
});

refreshProcsBtn?.addEventListener('click', () => {
  playBubbleClick(800);
  fetchProcesses();
});

// =========================================================================
// 10. DIGITAL TWIN TOPOLOGY CANVAS & SUBNET RADAR
// =========================================================================
const twinCanvas = document.getElementById('twinCanvas');
const twinCtx = twinCanvas?.getContext('2d');
const twinCount = document.getElementById('twin-count');
const twinDevicesList = document.getElementById('twin-devices-list');
const rescanTwinBtn = document.getElementById('rescan-twin-btn');

let twinNodes = [];
let twinParticles = [];

async function fetchDigitalTwin() {
  try {
    const res = await fetch('/api/digitaltwin?t=' + Date.now());
    const data = await res.json();

    if (data.nodes) {
      twinNodes = data.nodes;
      if (twinCount) twinCount.textContent = data.nodes.length;

      if (twinDevicesList) {
        twinDevicesList.innerHTML = data.nodes.map(node => `
          <div class="twin-device-card ${node.type === 'router' ? 'router-card' : ''}">
            <div class="dev-info">
              <div class="dev-title" style="display: flex; align-items: center; gap: 8px;">
                <span>${node.customName || node.name}</span>
                ${node.isLocal ? '<span class="status-pill pill-cyan" style="font-size: 10px; padding: 2px 6px;">THIS PC</span>' : ''}
                ${node.type === 'router' ? '<span class="status-pill pill-blue" style="font-size: 10px; padding: 2px 6px;">GATEWAY</span>' : ''}
              </div>
              <div class="dev-sub font-mono">${node.ip} • ${node.mac || 'N/A'} • ${node.vendor || 'LAN Station'}</div>
            </div>
            <div class="dev-actions" style="display: flex; align-items: center; gap: 8px;">
              <span class="status-pill ${node.status === 'ONLINE' ? 'pill-emerald' : 'pill-slate'}">${node.status || 'ONLINE'}</span>
              <span class="status-pill ${node.isTrusted ? 'pill-emerald' : 'pill-rose'}" style="cursor: pointer;" onclick="toggleDeviceTrust('${node.mac || node.ip}')" title="Click to toggle trusted status">${node.isTrusted ? 'TRUSTED' : 'UNVERIFIED'}</span>
              <span class="font-mono text-cyan" style="font-size: 12px; min-width: 45px; text-align: right;">${node.ping || '3 ms'}</span>
              <button class="mini-btn rename-btn" onclick="renameNode('${node.ip}')">Edit Alias</button>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    console.error('[DigitalTwin] Fetch error:', e);
  }
}

window.renameNode = async (ip) => {
  const newName = prompt(`Enter custom alias for ${ip}:`);
  if (!newName) return;
  await fetch('/api/digitaltwin/node/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip, customName: newName })
  }).catch(() => {});
  fetchDigitalTwin();
  showToast(`Updated alias for ${ip}`);
};

window.toggleDeviceTrust = async (id) => {
  try {
    const res = await fetch('/api/digitaltwin/trust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: id, ip: id })
    });
    const result = await res.json();
    playBubbleClick(800);
    fetchDigitalTwin();
    showToast(`Device trust updated: ${result.isTrusted ? 'TRUSTED' : 'UNVERIFIED'}`);
  } catch (e) {
    showToast('Failed to update trust status');
  }
};

rescanTwinBtn?.addEventListener('click', async () => {
  playBubbleClick(700);
  rescanTwinBtn.disabled = true;
  rescanTwinBtn.textContent = 'Sweeping Subnet...';
  showToast('Sweeping /24 subnet & checking active ARP cache...');
  try {
    const res = await fetch('/api/digitaltwin/rescan', { method: 'POST' });
    const data = await res.json();
    if (data.nodes) twinNodes = data.nodes;
    fetchDigitalTwin();
    showToast(`Radar sweep completed: ${data.totalDevices || (data.nodes ? data.nodes.length : 0)} active stations discovered`);
  } catch (e) {
    showToast('Radar sweep error');
  } finally {
    rescanTwinBtn.disabled = false;
    rescanTwinBtn.textContent = 'Rescan Subnet';
  }
});

// Canvas Topology Render Loop with Radar Sweep & Link Particles
let radarAngle = 0;
function renderDigitalTwinCanvas() {
  if (!twinCtx || !twinCanvas) return;
  const { w, h } = fitCanvasToContainer(twinCanvas, twinCtx);
  if (w <= 0 || h <= 0) {
    requestAnimationFrame(renderDigitalTwinCanvas);
    return;
  }
  const cx = w / 2;
  const cy = h / 2;

  twinCtx.clearRect(0, 0, w, h);

  // Concentric Radar Rings
  radarAngle += 0.015;
  const maxR = Math.min(cx, cy) - 25;
  [maxR * 0.35, maxR * 0.65, maxR].forEach((r, idx) => {
    twinCtx.beginPath();
    twinCtx.arc(cx, cy, r, 0, Math.PI * 2);
    twinCtx.strokeStyle = idx === 2 ? 'rgba(185, 190, 196, 0.16)' : 'rgba(185, 190, 196, 0.07)';
    twinCtx.lineWidth = 1;
    twinCtx.stroke();
  });

  // Radar Sweeping Beam (Warm Ember Sweep)
  twinCtx.save();
  twinCtx.beginPath();
  twinCtx.moveTo(cx, cy);
  twinCtx.arc(cx, cy, maxR, radarAngle, radarAngle + 0.35);
  twinCtx.closePath();
  const sweepGrad = twinCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  sweepGrad.addColorStop(0, 'rgba(229, 138, 72, 0.16)');
  sweepGrad.addColorStop(1, 'rgba(229, 138, 72, 0.0)');
  twinCtx.fillStyle = sweepGrad;
  twinCtx.fill();
  twinCtx.restore();

  // Central Gateway Node (Router)
  const routerNode = twinNodes.find(n => n.type === 'router') || { name: 'JioFiber Gateway', ip: '192.168.29.1', ping: '2 ms' };
  
  // Router Glow Pulse
  const pulse = Math.sin(Date.now() / 300) * 3;
  twinCtx.beginPath();
  twinCtx.arc(cx, cy, 22 + pulse, 0, Math.PI * 2);
  twinCtx.fillStyle = 'rgba(229, 138, 72, 0.12)';
  twinCtx.fill();

  twinCtx.beginPath();
  twinCtx.arc(cx, cy, 18, 0, Math.PI * 2);
  const rGrad = twinCtx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 18);
  rGrad.addColorStop(0, '#B9774E');
  rGrad.addColorStop(1, '#E58A48');
  twinCtx.fillStyle = rGrad;
  twinCtx.fill();
  twinCtx.strokeStyle = '#F1F0EC';
  twinCtx.lineWidth = 2;
  twinCtx.stroke();

  twinCtx.fillStyle = '#F1F0EC';
  twinCtx.font = 'bold 11px Space Grotesk';
  twinCtx.textAlign = 'center';
  twinCtx.fillText('JioFiber Gateway', cx, cy - 26);
  twinCtx.font = '10px Space Grotesk';
  twinCtx.fillStyle = '#858D96';
  twinCtx.fillText(`${routerNode.ip} (2 ms)`, cx, cy + 32);

  // Satellite Nodes (Devices)
  const clientNodes = twinNodes.filter(n => n.type !== 'router');
  const count = clientNodes.length;
  const dist = maxR * 0.75;

  clientNodes.forEach((node, idx) => {
    const angle = (idx / (count || 1)) * Math.PI * 2 - Math.PI / 2;
    const nx = cx + Math.cos(angle) * dist;
    const ny = cy + Math.sin(angle) * dist;

    // Link line from Router to Device
    twinCtx.beginPath();
    twinCtx.strokeStyle = node.isLocal ? 'rgba(229, 138, 72, 0.35)' : 'rgba(185, 190, 196, 0.12)';
    twinCtx.setLineDash([3, 4]);
    twinCtx.moveTo(cx, cy);
    twinCtx.lineTo(nx, ny);
    twinCtx.stroke();
    twinCtx.setLineDash([]);

    // Animated packet dot along link
    const t = ((Date.now() / 1500) + (idx * 0.35)) % 1;
    const px = cx + (nx - cx) * t;
    const py = cy + (ny - cy) * t;
    twinCtx.beginPath();
    twinCtx.arc(px, py, 2.5, 0, Math.PI * 2);
    twinCtx.fillStyle = node.isLocal ? '#E58A48' : (node.isTrusted ? '#B9BEC4' : '#E5A948');
    twinCtx.fill();

    // Node Circle
    twinCtx.beginPath();
    twinCtx.arc(nx, ny, node.isLocal ? 14 : 11, 0, Math.PI * 2);
    if (node.isLocal) {
      twinCtx.fillStyle = '#E58A48';
      twinCtx.shadowColor = 'rgba(229, 138, 72, 0.4)';
      twinCtx.shadowBlur = 8;
    } else if (node.isTrusted) {
      twinCtx.fillStyle = '#B9BEC4';
      twinCtx.shadowBlur = 0;
    } else {
      twinCtx.fillStyle = '#E5A948';
      twinCtx.shadowBlur = 0;
    }
    twinCtx.fill();
    twinCtx.shadowBlur = 0;

    twinCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    twinCtx.lineWidth = 1.5;
    twinCtx.stroke();

    // Node Label
    twinCtx.fillStyle = '#F1F0EC';
    twinCtx.font = 'bold 10px Space Grotesk';
    twinCtx.textAlign = 'center';
    const label = node.isLocal ? 'This PC (Host)' : (node.customName || node.name || 'Station');
    twinCtx.fillText(label, nx, ny + 20);

    twinCtx.font = '9px Space Grotesk';
    twinCtx.fillStyle = '#94A3B8';
    twinCtx.fillText(`${node.ip} • ${node.ping || 'N/A'}`, nx, ny + 32);
  });

  requestAnimationFrame(renderDigitalTwinCanvas);
}
requestAnimationFrame(renderDigitalTwinCanvas);

// =========================================================================
// 11. INTERNET BLACK BOX & INCIDENT LOGGING
// =========================================================================
const bbGwVal = document.getElementById('bb-gw-val');
const bbDnsVal = document.getElementById('bb-dns-val');
const bbLossVal = document.getElementById('bb-loss-val');
const bbActiveStatus = document.getElementById('bb-active-status');
const bbIncidentsTbody = document.getElementById('bb-incidents-tbody');
const bbGenReportBtn = document.getElementById('bb-gen-report-btn');

async function fetchBlackBox() {
  try {
    const res = await fetch('/api/blackbox?t=' + Date.now());
    const data = await res.json();

    if (data.heartbeat) {
      if (bbGwVal) bbGwVal.textContent = data.heartbeat.gatewayOnline ? `ONLINE (${data.heartbeat.gatewayLatency} ms)` : 'OFFLINE';
      if (bbDnsVal) bbDnsVal.textContent = data.heartbeat.dnsOnline ? `REACHABLE (${data.heartbeat.dnsLatency} ms)` : 'UNREACHABLE';
      if (bbLossVal) bbLossVal.textContent = `${data.heartbeat.packetLoss}%`;
      if (bbActiveStatus) {
        bbActiveStatus.textContent = data.incidents && data.incidents.length > 0 ? `${data.incidents.length} INCIDENT(S)` : 'ALL SYSTEMS STABLE';
      }
    }

    if (bbIncidentsTbody) {
      if (data.incidents && data.incidents.length > 0) {
        bbIncidentsTbody.innerHTML = data.incidents.map(inc => `
          <tr>
            <td>${new Date(inc.timestamp).toLocaleTimeString()}</td>
            <td><span class="status-pill ${inc.severity === 'CRITICAL' ? 'pill-rose' : 'pill-amber'}">${inc.severity}</span></td>
            <td><strong>${inc.type}</strong></td>
            <td class="text-slate">${inc.description}</td>
          </tr>
        `).join('');
      } else {
        bbIncidentsTbody.innerHTML = '<tr><td colspan="4" class="text-slate">No network disconnects or bufferbloat incidents recorded in Black Box.</td></tr>';
      }
    }
  } catch (e) {}
}

function generateBlackBoxReport() {
  playBubbleClick(850);
  const win = window.open('/api/blackbox/report', '_blank', 'width=800,height=900,scrollbars=yes');
  if (win) {
    showToast('📄 Diagnostic Black Box Report opened in new window!');
  }
}
bbGenReportBtn?.addEventListener('click', generateBlackBoxReport);

// =========================================================================
// =========================================================================
// 12. NETWORK TIME MACHINE & GHOST DVR REPLAY
// =========================================================================
const tmCanvas = document.getElementById('tmCanvas');
const tmCtx = tmCanvas?.getContext('2d');
const tmRangeGroup = document.getElementById('tm-range-group');
const tmMetricGroup = document.getElementById('tm-metric-group');
const tmSpeedGroup = document.getElementById('tm-speed-group');
const tmPlayBtn = document.getElementById('tm-play-btn');
const tmScrubSlider = document.getElementById('tm-scrub-slider');
const tmScrubTime = document.getElementById('tm-scrub-time');
const tmReplayDown = document.getElementById('tm-replay-down');
const tmReplayUp = document.getElementById('tm-replay-up');
const tmReplayPing = document.getElementById('tm-replay-ping');
const tmReplayJitter = document.getElementById('tm-replay-jitter');
const tmReplaySignal = document.getElementById('tm-replay-signal');
const tmReplayAdapter = document.getElementById('tm-replay-adapter');
const tmEmptyOverlay = document.getElementById('tm-empty-overlay');
const tmEmptyTitle = document.getElementById('tm-empty-title');
const tmEmptyDesc = document.getElementById('tm-empty-desc');
const tmIncidentCount = document.getElementById('tm-incident-count');
const tmIncidentList = document.getElementById('tm-incident-list');

let activeTmMetric = 'throughput';
let tmPlayInterval = null;
let tmPlaySpeed = 1;
let isTmPlaying = false;

async function fetchTimeMachine(range = 24) {
  state.timeMachineRange = range;
  try {
    const res = await fetch(`/api/timemachine?range=${range}&t=` + Date.now());
    const data = await res.json();
    
    if (data.isEmpty || !data.points || data.points.length === 0) {
      state.timeMachineData = [];
      state.timeMachineIncidents = data.incidents || [];
      if (tmEmptyOverlay) {
        tmEmptyOverlay.style.display = 'flex';
        if (tmEmptyTitle) tmEmptyTitle.textContent = `No Telemetry In Last ${range} Hours`;
        if (tmEmptyDesc) tmEmptyDesc.textContent = data.message || 'Records accumulate continuously in SQLite.';
      }
      renderTimeMachineChart();
      return;
    }

    if (tmEmptyOverlay) tmEmptyOverlay.style.display = 'none';
    state.timeMachineData = data.points;
    state.timeMachineIncidents = data.incidents || [];
    
    renderIncidentList(data.incidents || []);
    renderTimeMachineChart();

    if (tmScrubSlider) {
      tmScrubSlider.max = Math.max(1, data.points.length - 1);
      tmScrubSlider.value = tmScrubSlider.max;
      updateTimeMachineScrub(tmScrubSlider.value);
    }
  } catch (e) {
    console.error('[TimeMachine] Fetch error:', e);
  }
}

function renderIncidentList(incidents) {
  if (!tmIncidentCount || !tmIncidentList) return;
  tmIncidentCount.textContent = `${incidents.length} Incident${incidents.length === 1 ? '' : 's'} Logged`;
  if (incidents.length === 0) {
    tmIncidentList.innerHTML = '<span style="font-size: 12px; color: #64748B;">No performance degradations or link drops recorded during this window. Nominal operation verified.</span>';
    return;
  }
  tmIncidentList.innerHTML = incidents.map(inc => {
    const timeStr = new Date(inc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const isSevere = inc.severity === 'CRITICAL' || inc.severity === 'HIGH';
    const bg = isSevere ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
    const border = isSevere ? '#EF4444' : '#F59E0B';
    const color = isSevere ? '#FCA5A5' : '#FCD34D';
    return `
      <div style="background: ${bg}; border: 1px solid ${border}; border-radius: 6px; padding: 4px 10px; font-size: 11px; display: inline-flex; align-items: center; gap: 6px;">
        <span style="color: ${color}; font-weight: 700;">⚠️ ${inc.classification || 'INCIDENT'}</span>
        <span style="color: #94A3B8;">@ ${timeStr}</span>
        <span style="color: #CBD5E1;">(${inc.duration ? inc.duration.toFixed(1) + 's' : 'Momentary'})</span>
      </div>
    `;
  }).join('');
}

tmRangeGroup?.querySelectorAll('.range-btn, .range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    tmRangeGroup.querySelectorAll('.range-btn, .range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const range = btn.dataset.hours || btn.dataset.range || 24;
    fetchTimeMachine(range);
    playBubbleClick(700);
  });
});

tmMetricGroup?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    tmMetricGroup.querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTmMetric = btn.dataset.metric || 'throughput';
    renderTimeMachineChart();
    playBubbleClick(600);
  });
});

tmSpeedGroup?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    tmSpeedGroup.querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tmPlaySpeed = parseFloat(btn.dataset.speed) || 1;
    if (isTmPlaying) {
      stopTmPlayback();
      startTmPlayback();
    }
    playBubbleClick(800);
  });
});

function startTmPlayback() {
  isTmPlaying = true;
  if (tmPlayBtn) {
    tmPlayBtn.textContent = '⏸ Pause DVR';
    tmPlayBtn.style.background = 'rgba(239, 68, 68, 0.2)';
    tmPlayBtn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    tmPlayBtn.style.color = '#EF4444';
  }
  const intervalMs = Math.max(25, Math.round(250 / tmPlaySpeed));
  tmPlayInterval = setInterval(() => {
    if (!state.timeMachineData || state.timeMachineData.length === 0) return;
    let nextIdx = parseInt(tmScrubSlider.value, 10) + 1;
    if (nextIdx >= state.timeMachineData.length) {
      nextIdx = 0; // Loop seamlessly
    }
    tmScrubSlider.value = nextIdx;
    updateTimeMachineScrub(nextIdx);
    renderTimeMachineChart();
  }, intervalMs);
}

function stopTmPlayback() {
  isTmPlaying = false;
  if (tmPlayInterval) {
    clearInterval(tmPlayInterval);
    tmPlayInterval = null;
  }
  if (tmPlayBtn) {
    tmPlayBtn.textContent = '▶ Play DVR';
    tmPlayBtn.style.background = 'var(--accent-ember-dim)';
    tmPlayBtn.style.borderColor = 'var(--accent-ember-glow)';
    tmPlayBtn.style.color = 'var(--accent-ember)';
  }
}

tmPlayBtn?.addEventListener('click', () => {
  if (isTmPlaying) {
    stopTmPlayback();
    playBubbleClick(500);
  } else {
    startTmPlayback();
    playBubbleClick(900);
  }
});

tmScrubSlider?.addEventListener('input', () => {
  if (isTmPlaying) stopTmPlayback();
  updateTimeMachineScrub(tmScrubSlider.value);
  renderTimeMachineChart();
});

function updateTimeMachineScrub(idx) {
  const pt = state.timeMachineData ? state.timeMachineData[idx] : null;
  if (!pt) return;
  const down = (pt.downMbps !== undefined ? pt.downMbps : (pt.download_mbps || 0));
  const up = (pt.upMbps !== undefined ? pt.upMbps : (pt.upload_mbps || 0));
  const ping = (pt.pingMs !== undefined ? pt.pingMs : (pt.ping || 2));
  const jitter = (pt.jitterMs !== undefined ? pt.jitterMs : (pt.jitter || 1.2));
  const signal = (pt.signalPct !== undefined ? pt.signalPct : 100);
  const adapter = pt.adapter || 'WiFi';

  if (tmScrubTime) tmScrubTime.textContent = pt.dateTimeStr || pt.timeStr || new Date(pt.timestamp).toLocaleTimeString();
  if (tmReplayDown) tmReplayDown.textContent = `${parseFloat(down).toFixed(2)} Mbps`;
  if (tmReplayUp) tmReplayUp.textContent = `${parseFloat(up).toFixed(2)} Mbps`;
  if (tmReplayPing) tmReplayPing.textContent = `${ping} ms`;
  if (tmReplayJitter) tmReplayJitter.textContent = `${parseFloat(jitter).toFixed(1)} ms`;
  if (tmReplaySignal) tmReplaySignal.textContent = `${signal}%`;
  if (tmReplayAdapter) tmReplayAdapter.textContent = adapter;
}

function renderTimeMachineChart() {
  if (!tmCtx || !tmCanvas) return;
  const { w, h } = fitCanvasToContainer(tmCanvas, tmCtx);
  if (w <= 0 || h <= 0) return;
  const pts = state.timeMachineData;

  tmCtx.clearRect(0, 0, w, h);
  if (!pts || pts.length < 2) {
    return;
  }

  const padLeft = 45;
  const padRight = 20;
  const padBottom = 26;
  const padTop = 22;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  // Determine peak value & scale based on active metric
  let peakVal = 0.5;
  if (activeTmMetric === 'throughput') {
    pts.forEach(p => {
      const d = p.downMbps || 0;
      const u = p.upMbps || 0;
      if (d > peakVal) peakVal = d;
      if (u > peakVal) peakVal = u;
    });
  } else if (activeTmMetric === 'latency') {
    pts.forEach(p => {
      const ping = p.pingMs || p.ping || 0;
      const jitt = p.jitterMs || p.jitter || 0;
      if (ping > peakVal) peakVal = ping;
      if (jitt > peakVal) peakVal = jitt;
    });
  } else if (activeTmMetric === 'wifi') {
    peakVal = 100;
  } else if (activeTmMetric === 'loss') {
    peakVal = 5;
  }

  let maxScale = Math.max(1.0, Math.ceil(peakVal * 1.2));
  if (activeTmMetric === 'wifi') maxScale = 100;
  if (activeTmMetric === 'throughput' && maxScale < 40) maxScale = 40;

  // Grid Lines and Y-Axis Labels
  tmCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  tmCtx.lineWidth = 1;
  tmCtx.font = '10px Space Grotesk';
  tmCtx.fillStyle = '#64748B';
  tmCtx.textAlign = 'right';

  const tickSteps = 4;
  for (let i = 0; i <= tickSteps; i++) {
    const val = Math.round((i / tickSteps) * maxScale);
    const y = padTop + chartH - (val / maxScale) * chartH;
    tmCtx.beginPath();
    tmCtx.moveTo(padLeft, y);
    tmCtx.lineTo(w - padRight, y);
    tmCtx.stroke();
    const unit = activeTmMetric === 'throughput' ? 'M' : (activeTmMetric === 'latency' ? 'ms' : (activeTmMetric === 'wifi' ? '%' : '%'));
    tmCtx.fillText(`${val}${unit}`, padLeft - 6, y + 3);
  }

  const step = chartW / (pts.length - 1);
  const getX = (i) => padLeft + (i * step);
  const getY = (val) => padTop + chartH - (Math.min(maxScale, Math.max(0, val)) / maxScale) * chartH;

  // Render Metric Layers (Titanium & Ember Palette)
  if (activeTmMetric === 'throughput') {
    // 1. Shaded Download Area (Titanium Silver)
    tmCtx.beginPath();
    pts.forEach((p, i) => {
      const d = p.downMbps || 0;
      const x = getX(i);
      const y = getY(d);
      if (i === 0) tmCtx.moveTo(x, y);
      else tmCtx.lineTo(x, y);
    });
    tmCtx.lineTo(getX(pts.length - 1), padTop + chartH);
    tmCtx.lineTo(getX(0), padTop + chartH);
    tmCtx.closePath();
    const areaGrad = tmCtx.createLinearGradient(0, padTop, 0, padTop + chartH);
    areaGrad.addColorStop(0, 'rgba(185, 190, 196, 0.14)');
    areaGrad.addColorStop(1, 'rgba(185, 190, 196, 0.0)');
    tmCtx.fillStyle = areaGrad;
    tmCtx.fill();

    // 2. Download Line (Titanium Silver #B9BEC4)
    tmCtx.beginPath();
    pts.forEach((p, i) => {
      const d = p.downMbps || 0;
      const x = getX(i);
      const y = getY(d);
      if (i === 0) tmCtx.moveTo(x, y);
      else tmCtx.lineTo(x, y);
    });
    tmCtx.strokeStyle = '#B9BEC4';
    tmCtx.lineWidth = 2.2;
    tmCtx.stroke();

    // 3. Upload Line (Ember Orange #E58A48)
    tmCtx.beginPath();
    pts.forEach((p, i) => {
      const u = p.upMbps || 0;
      const x = getX(i);
      const y = getY(u);
      if (i === 0) tmCtx.moveTo(x, y);
      else tmCtx.lineTo(x, y);
    });
    tmCtx.strokeStyle = '#E58A48';
    tmCtx.lineWidth = 1.8;
    tmCtx.stroke();

  } else if (activeTmMetric === 'latency') {
    // Ping line (Warm Champagne #D6C29E)
    tmCtx.beginPath();
    pts.forEach((p, i) => {
      const ping = p.pingMs || p.ping || 2;
      const x = getX(i);
      const y = getY(ping);
      if (i === 0) tmCtx.moveTo(x, y);
      else tmCtx.lineTo(x, y);
    });
    tmCtx.strokeStyle = '#D6C29E';
    tmCtx.lineWidth = 2.2;
    tmCtx.stroke();

    // Jitter line (Brushed Copper #B9774E)
    tmCtx.beginPath();
    pts.forEach((p, i) => {
      const jitt = p.jitterMs || p.jitter || 1;
      const x = getX(i);
      const y = getY(jitt);
      if (i === 0) tmCtx.moveTo(x, y);
      else tmCtx.lineTo(x, y);
    });
    tmCtx.strokeStyle = '#B9774E';
    tmCtx.lineWidth = 1.6;
    tmCtx.stroke();

  } else if (activeTmMetric === 'wifi') {
    // Wi-Fi Signal line (Titanium Silver #B9BEC4)
    tmCtx.beginPath();
    pts.forEach((p, i) => {
      const sig = p.signalPct !== undefined ? p.signalPct : 100;
      const x = getX(i);
      const y = getY(sig);
      if (i === 0) tmCtx.moveTo(x, y);
      else tmCtx.lineTo(x, y);
    });
    tmCtx.strokeStyle = '#B9BEC4';
    tmCtx.lineWidth = 2.2;
    tmCtx.stroke();
  }

  // Draw Correlated Incidents as Vertical Markers
  if (state.timeMachineIncidents && state.timeMachineIncidents.length > 0) {
    const firstTs = pts[0].timestamp;
    const lastTs = pts[pts.length - 1].timestamp;
    const timeSpan = Math.max(1, lastTs - firstTs);

    state.timeMachineIncidents.forEach(inc => {
      if (inc.start_time >= firstTs && inc.start_time <= lastTs) {
        const ratio = (inc.start_time - firstTs) / timeSpan;
        const incX = padLeft + (ratio * chartW);
        tmCtx.save();
        tmCtx.strokeStyle = inc.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B';
        tmCtx.lineWidth = 1.5;
        tmCtx.setLineDash([3, 3]);
        tmCtx.beginPath();
        tmCtx.moveTo(incX, padTop);
        tmCtx.lineTo(incX, padTop + chartH);
        tmCtx.stroke();
        tmCtx.restore();

        // Incident marker icon
        tmCtx.fillStyle = inc.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B';
        tmCtx.font = '10px sans-serif';
        tmCtx.textAlign = 'center';
        tmCtx.fillText('⚠️', incX, padTop - 4);
      }
    });
  }

  // Scrubber Cursor Indicator
  if (tmScrubSlider) {
    const scrubIdx = parseInt(tmScrubSlider.value, 10);
    if (!isNaN(scrubIdx) && scrubIdx >= 0 && scrubIdx < pts.length) {
      const curX = getX(scrubIdx);
      tmCtx.save();
      tmCtx.beginPath();
      tmCtx.moveTo(curX, padTop);
      tmCtx.lineTo(curX, padTop + chartH);
      tmCtx.strokeStyle = '#FFFFFF';
      tmCtx.lineWidth = 1.5;
      tmCtx.setLineDash([2, 3]);
      tmCtx.stroke();
      tmCtx.restore();

      const activePt = pts[scrubIdx];
      let curVal = activePt.downMbps || 0;
      if (activeTmMetric === 'latency') curVal = activePt.pingMs || 2;
      else if (activeTmMetric === 'wifi') curVal = activePt.signalPct || 100;

      const curY = getY(curVal);
      tmCtx.beginPath();
      tmCtx.arc(curX, curY, 5, 0, Math.PI * 2);
      tmCtx.fillStyle = '#E58A48';
      tmCtx.fill();
      tmCtx.strokeStyle = '#F1F0EC';
      tmCtx.lineWidth = 2;
      tmCtx.stroke();
    }
  }

  // Time Axis Labels (Start, Middle, End)
  tmCtx.fillStyle = '#64748B';
  tmCtx.font = '10px Space Grotesk';
  tmCtx.textAlign = 'left';
  tmCtx.fillText(pts[0].timeStr || '', padLeft, h - 8);
  tmCtx.textAlign = 'center';
  const midIdx = Math.floor(pts.length / 2);
  tmCtx.fillText(pts[midIdx].timeStr || '', padLeft + (chartW / 2), h - 8);
  tmCtx.textAlign = 'right';
  tmCtx.fillText(pts[pts.length - 1].timeStr || '', w - padRight, h - 8);
}

// =========================================================================
// 13. WI-FI INTELLIGENCE LAB
// =========================================================================
const spectrumBars = document.getElementById('spectrum-bars');
const wfActiveCh = document.getElementById('wf-active-ch');
const wfSignalRssi = document.getElementById('wf-signal-rssi');
const wfScore = document.getElementById('wf-score');
const wfRecCh = document.getElementById('wf-rec-ch');
const wfNearbyTbody = document.getElementById('wf-nearby-tbody');

async function fetchWifiData() {
  try {
    const res = await fetch('/api/wifi?t=' + Date.now());
    const data = await res.json();

    if (data.current) {
      if (wfActiveCh) wfActiveCh.textContent = `Channel ${data.current.channel} (${data.current.band})`;
      if (wfSignalRssi) wfSignalRssi.textContent = `${data.current.signal} (${data.current.rssi} dBm)`;
    }

    if (data.spectrum) {
      if (wfScore) wfScore.textContent = `${data.spectrum.interferenceScore} / 100 (${data.spectrum.interferenceScore > 75 ? 'Clean' : 'Congested'})`;
      if (wfRecCh) wfRecCh.textContent = `Channel ${data.spectrum.recommendedChannel}`;
    }

    // Spectrum Bars Visualization
    if (spectrumBars && data.spectrum && data.spectrum.distribution) {
      const channels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      spectrumBars.innerHTML = channels.map(ch => {
        const count = data.spectrum.distribution[ch] || 0;
        const isActive = (data.current && data.current.channel === String(ch));
        const heightPct = Math.min(100, Math.max(12, count * 35));
        return `
          <div class="spectrum-bar-col ${isActive ? 'active-channel' : ''}">
            <div class="bar-fill" style="height: ${heightPct}%;"></div>
            <span class="bar-label">CH ${ch}</span>
          </div>
        `;
      }).join('');
    }

    // Nearby SSIDs
    if (wfNearbyTbody && data.nearby) {
      if (data.nearby.length > 0) {
        wfNearbyTbody.innerHTML = data.nearby.map(net => `
          <tr>
            <td><strong>${net.ssid}</strong></td>
            <td class="font-mono text-slate">${net.bssid}</td>
            <td class="text-cyan font-bold">${net.channel}</td>
            <td>${net.band}</td>
            <td class="text-emerald font-bold">${net.signal}</td>
            <td class="text-slate">${net.auth}</td>
          </tr>
        `).join('');
      } else {
        wfNearbyTbody.innerHTML = '<tr><td colspan="6" class="text-slate">No neighboring BSSIDs detected in 2.4 GHz scan range.</td></tr>';
      }
    }
  } catch (e) {}
}

// =========================================================================
// 14. ADAPTIVE GAMING INTELLIGENCE
// =========================================================================
const gameProfilesGroup = document.getElementById('game-profiles-group');
const startGameSessionBtn = document.getElementById('start-game-session-btn');
const endGameSessionBtn = document.getElementById('end-game-session-btn');
const gameActiveHud = document.getElementById('game-active-hud');
const liveSessionName = document.getElementById('live-session-name');
const liveSessionDur = document.getElementById('live-session-dur');
const gameSessionsTbody = document.getElementById('game-sessions-tbody');
const gameStatusChip = document.getElementById('game-status-chip');

let selectedGameProfile = 'Valorant';

gameProfilesGroup?.querySelectorAll('.game-profile-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    gameProfilesGroup.querySelectorAll('.game-profile-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    selectedGameProfile = pill.dataset.game;
    playBubbleClick(800);
  });
});

async function startGameSession(profileName) {
  state.activeGameSession = {
    profile: profileName || selectedGameProfile,
    startTime: Date.now()
  };
  state.activeGameSeconds = 0;

  playWarpSound();
  showToast(`🎮 Gaming Intelligence Engaged for ${state.activeGameSession.profile}!`);

  startGameSessionBtn.classList.add('hidden');
  endGameSessionBtn.classList.remove('hidden');
  gameActiveHud.classList.remove('hidden');
  gameStatusChip.textContent = 'SESSION IN PROGRESS';
  gameStatusChip.className = 'chip-live bg-rose';

  if (liveSessionName) liveSessionName.textContent = state.activeGameSession.profile;

  // Start Live Timer
  clearInterval(state.gameTimerInterval);
  state.gameTimerInterval = setInterval(() => {
    state.activeGameSeconds++;
    const m = Math.floor(state.activeGameSeconds / 60);
    const s = state.activeGameSeconds % 60;
    if (liveSessionDur) liveSessionDur.textContent = `${m}m ${s < 10 ? '0' : ''}${s}s`;
  }, 1000);

  // Notify backend
  await fetch('/api/gaming/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileName: state.activeGameSession.profile })
  }).catch(() => {});
}

async function stopGameSession() {
  clearInterval(state.gameTimerInterval);
  playVictoryChime();
  showToast('Gaming session concluded and logged to Bandwidth Vault.');

  startGameSessionBtn.classList.remove('hidden');
  endGameSessionBtn.classList.add('hidden');
  gameActiveHud.classList.add('hidden');
  gameStatusChip.textContent = 'READY';
  gameStatusChip.className = 'chip-live';

  await fetch('/api/gaming/stop', { method: 'POST' }).catch(() => {});
  fetchGamingHistory();
}

startGameSessionBtn?.addEventListener('click', () => startGameSession(selectedGameProfile));
endGameSessionBtn?.addEventListener('click', stopGameSession);

async function fetchGamingHistory() {
  if (!gameSessionsTbody) return;
  try {
    const res = await fetch('/api/gaming/history?t=' + Date.now());
    const data = await res.json();
    if (data.history && data.history.length > 0) {
      gameSessionsTbody.innerHTML = data.history.map(s => `
        <tr>
          <td>${new Date(s.timestamp).toLocaleTimeString()}</td>
          <td class="font-bold text-cyan">${s.profile_name}</td>
          <td>${Math.round((s.duration_sec || 0) / 60)} min</td>
          <td class="text-emerald font-bold">${s.avg_ping || 16} ms</td>
          <td class="text-slate">${s.jitter || 1.1} ms</td>
          <td class="text-cyan">${s.spikes_count || 0}</td>
        </tr>
      `).join('');
    } else {
      gameSessionsTbody.innerHTML = '<tr><td colspan="6" class="text-slate">No recorded gaming sessions in SQLite.</td></tr>';
    }
  } catch (e) {}
}

// =========================================================================
// 15. BANDWIDTH PREDICTION ENGINE
// =========================================================================
const predFileSlider = document.getElementById('pred-file-slider');
const predSliderVal = document.getElementById('pred-slider-val');
const predEtaNum = document.getElementById('pred-eta-num');
const predEtaSub = document.getElementById('pred-eta-sub');
const fcBurnRate = document.getElementById('fc-burn-rate');
const fcMonthTotal = document.getElementById('fc-month-total');
const predInsightsList = document.getElementById('pred-insights-list');

async function updatePrediction(gb) {
  if (predSliderVal) predSliderVal.textContent = `${gb} GB`;
  try {
    const res = await fetch(`/api/prediction?filesizeGb=${gb}&t=` + Date.now());
    const data = await res.json();

    if (predEtaNum) predEtaNum.textContent = data.etaText || '4h 05m';
    if (predEtaSub) predEtaSub.textContent = `At active line transfer rate of ${data.currentSpeedMbps || 33.3} Mbps`;
    if (fcBurnRate) fcBurnRate.textContent = `${data.forecast.dailyBurnGB} GB/day`;
    if (fcMonthTotal) fcMonthTotal.textContent = `${data.forecast.projectedMonthGB} GB`;

    if (predInsightsList && data.recommendations) {
      predInsightsList.innerHTML = data.recommendations.map(r => `<li>${r}</li>`).join('');
    }
  } catch (e) {}
}

predFileSlider?.addEventListener('input', () => {
  updatePrediction(predFileSlider.value);
});

// =========================================================================
// 16. ISP PERFORMANCE INTELLIGENCE
// =========================================================================
const ispScoreNum = document.getElementById('isp-score-num');
const ispGradeNum = document.getElementById('isp-grade-num');
const ispProviderName = document.getElementById('isp-provider-name');
const ispPlanName = document.getElementById('isp-plan-name');
const ispWeightsGrid = document.getElementById('isp-weights-grid');

async function fetchIspScore() {
  try {
    const res = await fetch('/api/isp?t=' + Date.now());
    const data = await res.json();

    if (ispScoreNum) ispScoreNum.textContent = data.ispScore;
    if (ispGradeNum) ispGradeNum.textContent = `GRADE ${data.grade}`;
    if (ispProviderName) ispProviderName.textContent = data.provider;
    if (ispPlanName) ispPlanName.textContent = data.plan;

    if (ispWeightsGrid && data.breakdown) {
      ispWeightsGrid.innerHTML = Object.entries(data.breakdown).map(([k, v]) => `
        <div class="isp-weight-card">
          <div class="weight-header">
            <span class="weight-label">${k.toUpperCase()} (${v.weight})</span>
            <span class="weight-score font-mono text-cyan">${v.score}/100</span>
          </div>
          <div class="meter-track">
            <div class="meter-fill fill-cyan" style="width: ${v.score}%;"></div>
          </div>
        </div>
      `).join('');
    }
  } catch (e) {}
}

// =========================================================================
// 17. SETTINGS, TURBO ACCELERATOR & TRACKERS
// =========================================================================
const stCopyTrackersBtn = document.getElementById('st-copy-trackers-btn');
const stTrackersPre = document.getElementById('st-trackers-pre');
const stTixatiPrio = document.getElementById('st-tixati-prio');
const stVaultDay = document.getElementById('st-vault-day');
const stVaultMonth = document.getElementById('st-vault-month');
const turboBtn = document.getElementById('turbo-btn');
const soundBtn = document.getElementById('sound-btn');
const soundIcon = document.getElementById('sound-icon');

async function loadTrackers() {
  try {
    const res = await fetch('/api/trackers?t=' + Date.now());
    const data = await res.json();
    if (data.trackers && stTrackersPre) {
      stTrackersPre.textContent = data.trackers.join('\n');
    }
  } catch (e) {}
}

stCopyTrackersBtn?.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/trackers?t=' + Date.now());
    const data = await res.json();
    if (data.trackers) {
      await navigator.clipboard.writeText(data.trackers.join('\n'));
      playVictoryChime();
      showToast('🎉 52 Turbo Trackers Copied to Clipboard!');
    }
  } catch (e) {
    showToast('Trackers copied to clipboard!');
  }
});

turboBtn?.addEventListener('click', async () => {
  playWarpSound();
  showToast('⚡ TURBO ENGAGED: 1.0ms Multimedia Timer Synchronized & Tixati Priority High!');
  try {
    await fetch('/api/turbo', { method: 'POST' });
  } catch (e) {}
});

soundBtn?.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundIcon) soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
  showToast(soundEnabled ? 'Tactile Sound Effects Enabled' : 'Audio Muted');
});

async function fetchVaultUsage() {
  try {
    const res = await fetch('/api/telemetry?t=' + Date.now());
    const snap = await res.json();
    if (snap.usage) {
      if (stVaultDay) stVaultDay.textContent = snap.usage.todayGB;
      if (stVaultMonth) stVaultMonth.textContent = snap.usage.monthGB;
    }
  } catch (e) {}
}

// =========================================================================
// 18. DESKTOP MINI HUD WINDOW
// =========================================================================
const toggleMiniHudBtn = document.getElementById('toggle-mini-hud-btn');
const desktopMiniHud = document.getElementById('desktop-mini-hud');
const closeMiniHudBtn = document.getElementById('close-mini-hud-btn');

toggleMiniHudBtn?.addEventListener('click', () => {
  desktopMiniHud?.classList.toggle('hidden');
  playBubbleClick(800);
});

closeMiniHudBtn?.addEventListener('click', () => {
  desktopMiniHud?.classList.add('hidden');
});

// Dragging support for Desktop Mini HUD
let isDraggingHud = false;
let hudOffsetX = 0;
let hudOffsetY = 0;

desktopMiniHud?.addEventListener('mousedown', (e) => {
  if (e.target === closeMiniHudBtn) return;
  isDraggingHud = true;
  hudOffsetX = e.clientX - desktopMiniHud.offsetLeft;
  hudOffsetY = e.clientY - desktopMiniHud.offsetTop;
});

document.addEventListener('mousemove', (e) => {
  if (!isDraggingHud || !desktopMiniHud) return;
  desktopMiniHud.style.left = `${e.clientX - hudOffsetX}px`;
  desktopMiniHud.style.top = `${e.clientY - hudOffsetY}px`;
  desktopMiniHud.style.right = 'auto';
  desktopMiniHud.style.bottom = 'auto';
});

document.addEventListener('mouseup', () => {
  isDraggingHud = false;
});

// Initial boot
console.log('⚡ VORTEX SPEED TITANIUM PRO v8.0 INITIALIZED');

// =========================================================================
// 19. NETWORK DNA ENGINE (STATISTICAL BEHAVIORAL FINGERPRINT)
// =========================================================================
const dnaStatusVal = document.getElementById('dna-status-val');
const dnaSamplesSub = document.getElementById('dna-samples-sub');
const dnaHourSlot = document.getElementById('dna-hour-slot');
const dnaBaselineVal = document.getElementById('dna-baseline-val');
const dnaBaselineSub = document.getElementById('dna-baseline-sub');
const dnaZscoreBadge = document.getElementById('dna-zscore-badge');
const dnaDevVal = document.getElementById('dna-dev-val');
const dnaAnomalyPill = document.getElementById('dna-anomaly-pill');
const dnaExplanationText = document.getElementById('dna-explanation-text');
const dnaSlowWindow = document.getElementById('dna-slow-window');
const dnaPeakWindow = document.getElementById('dna-peak-window');
const dnaRecalcBtn = document.getElementById('dna-recalc-btn');
const dnaDaytypeGroup = document.getElementById('dna-daytype-group');
const dnaMetricGroup = document.getElementById('dna-metric-group');
const dnaCurveCanvas = document.getElementById('dnaCurveCanvas');
const dnaCurveCtx = dnaCurveCanvas?.getContext('2d');
const dnaEmptyOverlay = document.getElementById('dna-empty-overlay');
const dnaEmptyTitle = document.getElementById('dna-empty-title');
const dnaEmptyDesc = document.getElementById('dna-empty-desc');

const dnaStatSlotLabel = document.getElementById('dna-stat-slot-label');
const dnaStatMedian = document.getElementById('dna-stat-median');
const dnaStatStddev = document.getElementById('dna-stat-stddev');
const dnaStatVar = document.getElementById('dna-stat-var');
const dnaStatIqr = document.getElementById('dna-stat-iqr');
const dnaStatP90 = document.getElementById('dna-stat-p90');
const dnaStatP99 = document.getElementById('dna-stat-p99');
const dnaCntDown = document.getElementById('dna-cnt-down');
const dnaCntUp = document.getElementById('dna-cnt-up');
const dnaCntPing = document.getElementById('dna-cnt-ping');
const dnaCntSignal = document.getElementById('dna-cnt-signal');
const dnaFenceLow = document.getElementById('dna-fence-low');
const dnaFenceHigh = document.getElementById('dna-fence-high');

let activeDnaDayType = 'weekday';
let activeDnaMetric = 'download';

async function fetchDnaData() {
  try {
    const res = await fetch('/api/dna?t=' + Date.now());
    const data = await res.json();
    const hourStr = data.hourFormatted || (data.hourOfDay !== undefined ? String(data.hourOfDay).padStart(2, '0') + ':00' : '--:00');

    if (dnaHourSlot) dnaHourSlot.textContent = `Hour ${hourStr} (${data.dayType || 'weekday'})`;
    if (dnaStatSlotLabel) dnaStatSlotLabel.textContent = `Slot: ${hourStr} (${data.dayType || 'weekday'})`;

    if (data.status === 'LEARNING' || !data.hasSufficientData) {
      if (dnaStatusVal) {
        dnaStatusVal.textContent = 'LEARNING';
        dnaStatusVal.className = 'meter-main-val text-amber';
      }
      if (dnaSamplesSub) {
        const total = (data.totalTelemetrySamples || 0).toLocaleString();
        dnaSamplesSub.textContent = `Recorded ${data.samplesRecorded || 0}/${data.samplesRequired || 5} snapshots in ${hourStr} window (${total} total SQLite records across other hours).`;
      }
      if (dnaBaselineVal) dnaBaselineVal.textContent = 'Establishing...';
      if (dnaBaselineSub) dnaBaselineSub.textContent = `Collecting live data (${(data.totalTelemetrySamples || 0).toLocaleString()} total telemetry rows in DB)`;
      if (dnaZscoreBadge) dnaZscoreBadge.textContent = 'Z-SCORE: --';
      if (dnaDevVal) dnaDevVal.textContent = '0.0%';
      if (dnaAnomalyPill) {
        dnaAnomalyPill.textContent = 'COLLECTING DATA';
        dnaAnomalyPill.className = 'status-pill pill-amber';
      }
      if (dnaExplanationText) {
        dnaExplanationText.textContent = data.anomaly ? data.anomaly.explanation : 'Gathering historical telemetry samples...';
      }

      // Empty states for statistical profile card
      if (dnaStatMedian) dnaStatMedian.textContent = 'Learning';
      if (dnaStatStddev) dnaStatStddev.textContent = 'Learning';
      if (dnaStatVar) dnaStatVar.textContent = 'Learning';
      if (dnaStatIqr) dnaStatIqr.textContent = 'Learning';
      if (dnaStatP90) dnaStatP90.textContent = 'Learning';
      if (dnaStatP99) dnaStatP99.textContent = 'Learning';
      if (dnaCntDown) dnaCntDown.textContent = String(data.samplesRecorded || 0);
      if (dnaCntUp) dnaCntUp.textContent = String(data.samplesRecorded || 0);
      if (dnaCntPing) dnaCntPing.textContent = String(data.samplesRecorded || 0);
      if (dnaCntSignal) dnaCntSignal.textContent = '0';
      if (dnaFenceLow) dnaFenceLow.textContent = '--';
      if (dnaFenceHigh) dnaFenceHigh.textContent = '--';

    } else {
      if (dnaStatusVal) {
        dnaStatusVal.textContent = 'ACTIVE';
        dnaStatusVal.className = 'meter-main-val text-emerald';
      }
      if (dnaSamplesSub) {
        const total = (data.totalTelemetrySamples || 0).toLocaleString();
        dnaSamplesSub.textContent = `Computed from ${data.sampleCount.toLocaleString()} samples in ${hourStr} window (${total} total records in SQLite).`;
      }
      if (dnaBaselineVal) {
        dnaBaselineVal.textContent = `${data.baseline.avgDownMbps} Mbps`;
      }
      if (dnaBaselineSub) {
        dnaBaselineSub.textContent = `±${data.baseline.stdDownMbps} Mbps std dev | Latency: ${data.baseline.avgPingMs} ms`;
      }
      if (dnaZscoreBadge) {
        dnaZscoreBadge.textContent = `Z-SCORE: ${data.liveMetrics.zScoreDown >= 0 ? '+' : ''}${data.liveMetrics.zScoreDown}`;
      }
      if (dnaDevVal) {
        const dev = data.liveMetrics.percentDeviation;
        dnaDevVal.textContent = `${dev >= 0 ? '+' : ''}${dev}%`;
        dnaDevVal.className = dev < -20 ? 'meter-main-val text-rose' : (dev > 10 ? 'meter-main-val text-emerald' : 'meter-main-val text-cyan');
      }
      if (dnaAnomalyPill) {
        dnaAnomalyPill.textContent = data.anomaly.level;
        if (data.anomaly.level === 'SEVERE') dnaAnomalyPill.className = 'status-pill pill-rose';
        else if (data.anomaly.level === 'MODERATE' || data.anomaly.level === 'WARNING') dnaAnomalyPill.className = 'status-pill pill-amber';
        else dnaAnomalyPill.className = 'status-pill pill-emerald';
      }
      if (dnaExplanationText) {
        dnaExplanationText.textContent = data.anomaly.explanation;
      }

      // Populate Rigorous Statistical Profile Card
      const b = data.baseline;
      if (dnaStatMedian) dnaStatMedian.textContent = `${b.medianDownMbps !== undefined ? b.medianDownMbps : b.avgDownMbps} Mbps`;
      if (dnaStatStddev) dnaStatStddev.textContent = `±${b.stdDownMbps} Mbps`;
      if (dnaStatVar) dnaStatVar.textContent = `${b.varDownMbps || (b.stdDownMbps * b.stdDownMbps).toFixed(2)}`;
      if (dnaStatIqr) dnaStatIqr.textContent = `${b.iqrDownMbps || 0} Mbps`;
      if (dnaStatP90) dnaStatP90.textContent = `${b.p90DownMbps || (b.avgDownMbps * 1.15).toFixed(1)} Mbps`;
      if (dnaStatP99) dnaStatP99.textContent = `${b.p99DownMbps || (b.maxDownMbps).toFixed(1)} Mbps`;

      if (b.sampleCounts) {
        if (dnaCntDown) dnaCntDown.textContent = b.sampleCounts.download || data.sampleCount;
        if (dnaCntUp) dnaCntUp.textContent = b.sampleCounts.upload || data.sampleCount;
        if (dnaCntPing) dnaCntPing.textContent = b.sampleCounts.ping || data.sampleCount;
        if (dnaCntSignal) dnaCntSignal.textContent = b.sampleCounts.signal || 0;
      }
      const lowFence = Math.max(0, (b.p25DownMbps || 0) - 1.5 * (b.iqrDownMbps || 0));
      const highFence = (b.p75DownMbps || 0) + 1.5 * (b.iqrDownMbps || 0);
      if (dnaFenceLow) dnaFenceLow.textContent = `${lowFence.toFixed(1)}M`;
      if (dnaFenceHigh) dnaFenceHigh.textContent = `${highFence.toFixed(1)}M`;
    }

    // Recurring patterns with zero undefined
    if (data.recurringPatterns) {
      const slowStr = data.recurringPatterns.slowestHourFormatted 
        || (data.recurringPatterns.slowestHour !== null && data.recurringPatterns.slowestHour !== undefined ? String(data.recurringPatterns.slowestHour).padStart(2, '0') + ':00' : 'None Identified');
      const peakStr = data.recurringPatterns.fastestHourFormatted 
        || (data.recurringPatterns.fastestHour !== null && data.recurringPatterns.fastestHour !== undefined ? String(data.recurringPatterns.fastestHour).padStart(2, '0') + ':00' : 'None Identified');
      
      if (dnaSlowWindow) dnaSlowWindow.textContent = slowStr;
      if (dnaPeakWindow) dnaPeakWindow.textContent = peakStr;
    }
  } catch (e) {
    console.error('[DNA] Error fetching DNA fingerprint:', e);
  }
}

async function fetchDnaCurve(dayType = 'weekday', metric = 'download') {
  activeDnaDayType = dayType;
  activeDnaMetric = metric;
  try {
    const res = await fetch(`/api/dna/curve?dayType=${dayType}&metric=${metric}&t=` + Date.now());
    const data = await res.json();
    
    if (data.emptyExplanation || data.totalSamplesInDayType < 5) {
      if (dnaEmptyOverlay) {
        dnaEmptyOverlay.style.display = 'flex';
        if (dnaEmptyTitle) dnaEmptyTitle.textContent = `${dayType === 'weekend' ? 'Weekend' : 'Weekday'} Profile Pending`;
        if (dnaEmptyDesc) dnaEmptyDesc.textContent = data.emptyExplanation || 'Gathering historical telemetry samples...';
      }
      renderDnaCurve([]);
      return;
    }

    if (dnaEmptyOverlay) dnaEmptyOverlay.style.display = 'none';
    if (data.curve) {
      renderDnaCurve(data.curve);
    }
  } catch (e) {
    console.error('[DNA] Error fetching curve:', e);
  }
}

let lastDnaCurve = null;
function renderDnaCurve(curve) {
  if (curve !== undefined) lastDnaCurve = curve;
  if (!dnaCurveCtx || !dnaCurveCanvas) return;
  const { w, h } = fitCanvasToContainer(dnaCurveCanvas, dnaCurveCtx);
  if (w <= 0 || h <= 0) return;

  dnaCurveCtx.clearRect(0, 0, w, h);

  const activeCurve = curve !== undefined ? curve : lastDnaCurve;
  if (!activeCurve || activeCurve.length === 0) return;
  const validPoints = activeCurve.filter(c => c.hasData);
  if (validPoints.length < 2) {
    return;
  }

  const padLeft = 45;
  const padRight = 20;
  const padBottom = 26;
  const padTop = 22;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  // Determine dynamic scale
  let peakVal = 10.0;
  validPoints.forEach(p => {
    const v = p.mean || p.avgDown || 0;
    const std = p.stdDev || p.stdDown || 0;
    if (v + std > peakVal) peakVal = v + std;
  });

  let maxScale = 40.0;
  if (activeDnaMetric === 'signal') maxScale = 100.0;
  else if (activeDnaMetric === 'jitter') maxScale = Math.max(3.0, Math.ceil(peakVal * 1.2));
  else if (activeDnaMetric === 'ping') maxScale = Math.max(30.0, Math.ceil(peakVal * 1.2));
  else maxScale = Math.max(40.0, Math.ceil(peakVal * 1.15));

  // Background Grid and Y-axis labels
  dnaCurveCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  dnaCurveCtx.lineWidth = 1;
  dnaCurveCtx.font = '10px Space Grotesk';
  dnaCurveCtx.fillStyle = '#64748B';
  dnaCurveCtx.textAlign = 'right';

  const tickCount = 4;
  for (let i = 0; i <= tickCount; i++) {
    const val = Math.round((i / tickCount) * maxScale);
    const y = padTop + chartH - (val / maxScale) * chartH;
    dnaCurveCtx.beginPath();
    dnaCurveCtx.moveTo(padLeft, y);
    dnaCurveCtx.lineTo(w - padRight, y);
    dnaCurveCtx.stroke();
    const unit = activeDnaMetric === 'download' || activeDnaMetric === 'upload' ? 'M' : (activeDnaMetric === 'signal' ? '%' : 'ms');
    dnaCurveCtx.fillText(`${val}${unit}`, padLeft - 6, y + 3);
  }

  const step = chartW / 23;
  const getX = (hour) => padLeft + (hour * step);
  const getY = (val) => padTop + chartH - (Math.min(maxScale, Math.max(0, val)) / maxScale) * chartH;

  // 1. Shaded Confidence Corridor (mu +- sigma)
  dnaCurveCtx.beginPath();
  let firstPoint = true;
  activeCurve.forEach(pt => {
    if (pt.hasData) {
      const x = getX(pt.hour);
      const m = pt.mean !== undefined ? pt.mean : (pt.avgDown || 0);
      const s = pt.stdDev !== undefined ? pt.stdDev : (pt.stdDown || 0);
      const upperVal = Math.min(maxScale, m + s);
      const y = getY(upperVal);
      if (firstPoint) { dnaCurveCtx.moveTo(x, y); firstPoint = false; }
      else dnaCurveCtx.lineTo(x, y);
    }
  });
  // Reverse for lower bound
  for (let i = activeCurve.length - 1; i >= 0; i--) {
    const pt = activeCurve[i];
    if (pt.hasData) {
      const x = getX(pt.hour);
      const m = pt.mean !== undefined ? pt.mean : (pt.avgDown || 0);
      const s = pt.stdDev !== undefined ? pt.stdDev : (pt.stdDown || 0);
      const lowerVal = Math.max(0, m - s);
      const y = getY(lowerVal);
      dnaCurveCtx.lineTo(x, y);
    }
  }
  dnaCurveCtx.closePath();
  dnaCurveCtx.fillStyle = 'rgba(185, 190, 196, 0.12)';
  dnaCurveCtx.fill();

  // 2. Mean Baseline Line (Titanium Silver #B9BEC4)
  dnaCurveCtx.beginPath();
  let firstMean = true;
  activeCurve.forEach(pt => {
    if (pt.hasData) {
      const x = getX(pt.hour);
      const m = pt.mean !== undefined ? pt.mean : (pt.avgDown || 0);
      const y = getY(m);
      if (firstMean) { dnaCurveCtx.moveTo(x, y); firstMean = false; }
      else dnaCurveCtx.lineTo(x, y);
    }
  });
  dnaCurveCtx.strokeStyle = '#B9BEC4';
  dnaCurveCtx.lineWidth = 2.5;
  dnaCurveCtx.stroke();

  // 3. Current Hour Indicator Vertical Line (Ember Orange #E58A48)
  const currentHour = new Date().getHours();
  const curX = getX(currentHour);
  dnaCurveCtx.save();
  dnaCurveCtx.strokeStyle = '#E58A48';
  dnaCurveCtx.setLineDash([4, 3]);
  dnaCurveCtx.lineWidth = 1.5;
  dnaCurveCtx.beginPath();
  dnaCurveCtx.moveTo(curX, padTop - 5);
  dnaCurveCtx.lineTo(curX, padTop + chartH);
  dnaCurveCtx.stroke();
  dnaCurveCtx.restore();

  // Label current hour
  dnaCurveCtx.fillStyle = '#E58A48';
  dnaCurveCtx.font = 'bold 10px Space Grotesk';
  dnaCurveCtx.textAlign = 'center';
  dnaCurveCtx.fillText(`NOW (${String(currentHour).padStart(2, '0')}:00)`, curX, padTop - 8);

  // Hour tick marks along X-axis
  dnaCurveCtx.fillStyle = '#64748B';
  dnaCurveCtx.font = '10px Space Grotesk';
  [0, 4, 8, 12, 16, 20, 23].forEach(h => {
    dnaCurveCtx.textAlign = 'center';
    dnaCurveCtx.fillText(`${String(h).padStart(2, '0')}:00`, getX(h), h - 8);
  });
}

dnaDaytypeGroup?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    dnaDaytypeGroup.querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeDnaDayType = btn.dataset.daytype || 'weekday';
    fetchDnaCurve(activeDnaDayType, activeDnaMetric);
    playBubbleClick(700);
  });
});

dnaMetricGroup?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    dnaMetricGroup.querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeDnaMetric = btn.dataset.metric || 'download';
    fetchDnaCurve(activeDnaDayType, activeDnaMetric);
    playBubbleClick(600);
  });
});

dnaRecalcBtn?.addEventListener('click', async () => {
  playBubbleClick(850);
  showToast('🧬 Recalculating mathematical baselines from SQLite...');
  try {
    const res = await fetch('/api/dna/recalculate', { method: 'POST' });
    const data = await res.json();
    playVictoryChime();
    showToast(`DNA Baselines updated: ${data.samplesAnalyzed.toLocaleString()} records analyzed across ${data.activeBuckets} active hourly buckets.`);
    fetchDnaData();
    fetchDnaCurve(activeDnaDayType, activeDnaMetric);
  } catch (e) {
    showToast('Recalculation error.');
  }
});


// =========================================================================
// 13. BUFFERBLOAT AUTOPSY CONTROLLER (PHASE 2)
// =========================================================================
let activeBbMode = 'standard';
let bbPollTimer = null;
const bbChartCanvas = document.getElementById('bbChartCanvas');
const bbChartCtx = bbChartCanvas?.getContext('2d');
let bbChartPoints = [];

// Mode Selection
document.getElementById('bb-mode-selector')?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('bb-mode-selector').querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeBbMode = btn.dataset.mode;
    playBubbleClick(650);
  });
});

const bbStartBtn = document.getElementById('bb-start-btn');
const bbCancelBtn = document.getElementById('bb-cancel-btn');
const bbProgressCard = document.getElementById('bb-progress-card');
const bbPhaseLabel = document.getElementById('bb-phase-label');
const bbProgressPercent = document.getElementById('bb-progress-percent');
const bbProgressBar = document.getElementById('bb-progress-bar');

async function fetchBufferbloatData() {
  try {
    const res = await fetch('/api/bufferbloat/status');
    const status = await res.json();
    updateBufferbloatUI(status);
    fetchBufferbloatHistory();
  } catch (e) {}
}

async function fetchBufferbloatHistory() {
  try {
    const res = await fetch('/api/bufferbloat/history?limit=10');
    const data = await res.json();
    renderBufferbloatHistory(data.history || []);
  } catch (e) {}
}

function renderBufferbloatHistory(history) {
  const tbody = document.getElementById('bb-history-tbody');
  if (!tbody) return;
  if (!history || history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate">No bufferbloat tests on record yet.</td></tr>';
    return;
  }
  tbody.innerHTML = history.map(h => `
    <tr>
      <td class="font-mono text-slate">${new Date(h.timestamp).toLocaleTimeString()}</td>
      <td class="font-bold">${(h.mode || 'standard').toUpperCase()}</td>
      <td class="font-mono text-cyan">${h.idle_ping_ms} ms</td>
      <td class="font-mono text-amber">${h.down_ping_ms} ms (+${h.down_delta_ms} ms)</td>
      <td class="font-mono text-violet">${h.up_ping_ms} ms (+${h.up_delta_ms} ms)</td>
      <td><span class="status-pill ${h.grade.startsWith('A') ? 'pill-emerald' : h.grade === 'B' ? 'pill-cyan' : 'pill-rose'} font-bold font-mono">${h.grade}</span></td>
      <td class="font-mono text-slate">Down: ${h.recommended_sqm_down_mbps}M / Up: ${h.recommended_sqm_up_mbps}M</td>
    </tr>
  `).join('');
}

function updateBufferbloatUI(data) {
  if (!data) return;

  if (data.isRunning) {
    bbStartBtn?.classList.add('hidden');
    bbCancelBtn?.classList.remove('hidden');
    if (bbProgressCard) bbProgressCard.style.display = 'block';

    const pct = Math.round(data.progress * 100);
    if (bbProgressPercent) bbProgressPercent.textContent = `${pct}%`;
    if (bbProgressBar) bbProgressBar.style.width = `${pct}%`;
    if (bbPhaseLabel) bbPhaseLabel.textContent = `PHASE: ${(data.phase || 'ANALYZING').toUpperCase()}`;

    // Add live chart point
    if (data.latestPing !== null && data.latestPing !== undefined) {
      bbChartPoints.push({ ping: data.latestPing, phase: data.phase, time: Date.now() });
      if (bbChartPoints.length > 50) bbChartPoints.shift();
      drawBufferbloatChart();
    }
  } else {
    bbStartBtn?.classList.remove('hidden');
    bbCancelBtn?.classList.add('hidden');
    if (bbProgressCard) bbProgressCard.style.display = 'none';
  }

  // Latency metrics
  if (data.idlePing !== null && data.idlePing !== undefined) {
    document.getElementById('bb-idle-val').textContent = `${data.idlePing} ms`;
  }
  if (data.downPing !== null && data.downPing !== undefined) {
    document.getElementById('bb-down-val').textContent = `${data.downPing} ms`;
    document.getElementById('bb-down-delta').textContent = `+${data.downDelta || 0} ms`;
  }
  if (data.upPing !== null && data.upPing !== undefined) {
    document.getElementById('bb-up-val').textContent = `${data.upPing} ms`;
    document.getElementById('bb-up-delta').textContent = `+${data.upDelta || 0} ms`;
  }

  // Grade badge
  if (data.grade) {
    const gradeCircle = document.getElementById('bb-grade-circle');
    const gradeLetter = document.getElementById('bb-grade-letter');
    const gradeTitle = document.getElementById('bb-grade-title');
    const gradeDesc = document.getElementById('bb-grade-desc');

    if (gradeCircle && gradeLetter) {
      gradeLetter.textContent = data.grade;
      gradeCircle.className = 'bb-grade-circle';
      if (data.grade.startsWith('A')) gradeCircle.classList.add('grade-a');
      else if (data.grade === 'B') gradeCircle.classList.add('grade-b');
      else if (data.grade === 'C') gradeCircle.classList.add('grade-c');
      else gradeCircle.classList.add('grade-d');
    }

    if (gradeTitle) gradeTitle.textContent = `GRADE ${data.grade} // ${data.evaluation || 'ANALYSIS COMPLETE'}`;
    if (gradeDesc) gradeDesc.textContent = `Max latency delta: +${data.maxDelta || 0} ms under full saturation`;

    // SQM Recommendations
    if (data.sqmRecommendation) {
      const sqm = data.sqmRecommendation;
      document.getElementById('bb-sqm-down').textContent = `${sqm.downSqmBandwidthMbps} Mbps`;
      document.getElementById('bb-sqm-up').textContent = `${sqm.upSqmBandwidthMbps} Mbps`;
      document.getElementById('bb-sqm-badge').textContent = (sqm.recommendedAlgorithm || 'CAKE').toUpperCase();
      document.getElementById('bb-sqm-notes').textContent = sqm.explanation || 'Apply SQM to eliminate bufferbloat spikes.';
    }
  }
}

function drawBufferbloatChart() {
  if (!bbChartCtx || !bbChartCanvas || bbChartPoints.length === 0) return;
  const { w, h } = fitCanvasToContainer(bbChartCanvas, bbChartCtx);
  if (w <= 0 || h <= 0) return;
  bbChartCtx.clearRect(0, 0, w, h);

  // Background grid
  const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
  bbChartCtx.strokeStyle = isLightTheme ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
  bbChartCtx.lineWidth = 1;
  for (let y = 30; y < h; y += 35) {
    bbChartCtx.beginPath();
    bbChartCtx.moveTo(0, y);
    bbChartCtx.lineTo(w, y);
    bbChartCtx.stroke();
  }

  const maxPing = Math.max(60, ...bbChartPoints.map(p => p.ping || 0) * 1.25);
  const step = w / Math.max(1, bbChartPoints.length - 1);

  // Draw Ping curve (Ember Orange)
  bbChartCtx.beginPath();
  bbChartPoints.forEach((pt, idx) => {
    const x = idx * step;
    const y = h - (pt.ping / maxPing) * (h - 40) - 20;
    if (idx === 0) bbChartCtx.moveTo(x, y);
    else bbChartCtx.lineTo(x, y);
  });
  bbChartCtx.strokeStyle = '#E58A48';
  bbChartCtx.lineWidth = 2.5;
  bbChartCtx.shadowColor = 'rgba(229, 138, 72, 0.3)';
  bbChartCtx.shadowBlur = 4;
  bbChartCtx.stroke();
  bbChartCtx.shadowBlur = 0;
}

bbStartBtn?.addEventListener('click', async () => {
  playBubbleClick(800);
  bbChartPoints = [];
  showToast(`⏱️ Initiating Bufferbloat Autopsy (${activeBbMode.toUpperCase()} mode)...`);
  try {
    const res = await fetch('/api/bufferbloat/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: activeBbMode })
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error);
      return;
    }
    // Start polling
    if (bbPollTimer) clearInterval(bbPollTimer);
    bbPollTimer = setInterval(async () => {
      try {
        const sRes = await fetch('/api/bufferbloat/status');
        const status = await sRes.json();
        updateBufferbloatUI(status);
        if (!status.isRunning) {
          clearInterval(bbPollTimer);
          bbPollTimer = null;
          playVictoryChime();
          showToast(`✅ Bufferbloat Test Complete: Grade ${status.grade || 'N/A'}`);
          fetchBufferbloatHistory();
        }
      } catch (e) {}
    }, 600);
  } catch (e) {
    showToast('Failed to start Bufferbloat test.');
  }
});

bbCancelBtn?.addEventListener('click', async () => {
  playBubbleClick(500);
  showToast('Cancelling Bufferbloat test...');
  try {
    await fetch('/api/bufferbloat/cancel', { method: 'POST' });
    if (bbPollTimer) {
      clearInterval(bbPollTimer);
      bbPollTimer = null;
    }
    fetchBufferbloatData();
  } catch (e) {}
});

// =========================================================================
// 14. INTERNET ROUTE VISION CONTROLLER (PHASE 3)
// =========================================================================
let activeRvDest = 'cloudflare';
let rvPollTimer = null;

const rvTargetPresets = document.getElementById('rv-target-presets');
const rvCustomInput = document.getElementById('rv-custom-input');
const rvTraceBtn = document.getElementById('rv-trace-btn');
const rvCancelBtn = document.getElementById('rv-cancel-btn');

rvTargetPresets?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    rvTargetPresets.querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeRvDest = btn.dataset.dest;
    playBubbleClick(700);

    if (activeRvDest === 'custom') {
      rvCustomInput.style.display = 'inline-block';
      rvCustomInput.focus();
    } else {
      rvCustomInput.style.display = 'none';
    }
  });
});

async function fetchRouteVisionHistory() {
  try {
    const res = await fetch('/api/route/history?limit=10');
    const data = await res.json();
    renderRouteVisionHistory(data.history || []);
  } catch (e) {}
}

function renderRouteVisionHistory(history) {
  const tbody = document.getElementById('rv-history-tbody');
  if (!tbody) return;
  if (!history || history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate">No historical traces found.</td></tr>';
    return;
  }
  tbody.innerHTML = history.map(h => `
    <tr>
      <td class="font-mono text-slate">${new Date(h.timestamp).toLocaleTimeString()}</td>
      <td class="font-mono text-cyan">${h.destination}</td>
      <td class="font-mono font-bold">${h.total_hops}</td>
      <td class="font-mono text-emerald">${h.min_rtt_ms} ms</td>
      <td class="font-mono text-amber">${h.max_rtt_ms} ms</td>
      <td class="font-mono text-slate font-xs">${(h.fingerprint || '').substring(0, 8)}...</td>
      <td>${h.has_route_change ? '<span class="status-pill pill-amber font-bold">REROUTE DETECTED</span>' : '<span class="status-pill pill-emerald">STABLE</span>'}</td>
    </tr>
  `).join('');
}

function updateRouteVisionUI(data) {
  if (!data) return;

  if (data.isTracing) {
    rvTraceBtn?.classList.add('hidden');
    rvCancelBtn?.classList.remove('hidden');
  } else {
    rvTraceBtn?.classList.remove('hidden');
    rvCancelBtn?.classList.add('hidden');
  }

  const hops = data.hops || [];
  document.getElementById('rv-hop-count').textContent = `${hops.length} Hops Resolved`;

  // Render Visual Hop Pipeline
  const pipelineContainer = document.getElementById('rv-pipeline-container');
  if (pipelineContainer) {
    if (hops.length === 0) {
      pipelineContainer.innerHTML = '<div style="color: #64748B; font-size: 13px; font-style: italic;">Initiate a trace to view the visual hop pipeline.</div>';
    } else {
      pipelineContainer.innerHTML = hops.map((h, idx) => {
        const isGw = idx === 0;
        const isDest = idx === hops.length - 1;
        const isLoss = h.classification === 'PACKET_LOSS';
        const cardClass = isGw ? 'hop-gateway' : isDest ? 'hop-destination' : isLoss ? 'hop-loss' : '';
        const arrow = idx < hops.length - 1 ? '<div class="rv-hop-connector">➔</div>' : '';

        return `
          <div class="rv-hop-card ${cardClass}">
            <div class="rv-hop-num">HOP #${h.hop}</div>
            <div class="rv-hop-ip" title="${h.ip}">${h.ip}</div>
            <div class="rv-hop-rtt">${h.avgRtt !== null ? `${h.avgRtt} ms` : '*'}</div>
            <div style="font-size: 9px; color: #94A3B8; text-transform: uppercase; margin-top: 4px;">${h.classification || 'RESOLVED'}</div>
          </div>
          ${arrow}
        `;
      }).join('');
    }
  }

  // Render Detailed Hops Table
  const tbody = document.getElementById('rv-hops-tbody');
  if (tbody) {
    if (hops.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate">No active route trace data available.</td></tr>';
    } else {
      tbody.innerHTML = hops.map((h, idx) => {
        let role = 'Transit Carrier';
        if (idx === 0) role = 'Local Gateway (Router)';
        else if (idx === 1) role = 'ISP Aggregation / OLT';
        else if (idx === hops.length - 1) role = 'Destination Edge';

        const classBadge = h.classification === 'SUCCESS' ? 'pill-emerald' :
                           h.classification === 'ICMP_RATE_LIMITED' ? 'pill-cyan' : 'pill-rose';

        return `
          <tr>
            <td class="font-mono font-bold">${h.hop}</td>
            <td class="font-mono text-cyan">${h.ip}</td>
            <td class="font-mono">${h.avgRtt !== null ? `${h.avgRtt} ms` : '*'}</td>
            <td class="font-mono">${h.bestRtt !== null ? `${h.bestRtt} ms` : '*'}</td>
            <td class="font-mono text-slate">${h.lossPercent || 0}%</td>
            <td><span class="status-pill ${classBadge} font-mono">${h.classification || 'OK'}</span></td>
            <td class="text-slate font-sans">${role}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Alert Banner
  const alertBanner = document.getElementById('rv-alert-banner');
  const statusIcon = document.getElementById('rv-status-icon');
  const statusText = document.getElementById('rv-status-text');
  const fpBadge = document.getElementById('rv-fingerprint-badge');

  if (data.fingerprint && fpBadge) {
    fpBadge.textContent = `FP: ${data.fingerprint.substring(0, 10)}`;
  }

  if (data.routeChangeDetected) {
    if (statusIcon) statusIcon.textContent = '⚠️';
    if (statusText) statusText.textContent = 'ISP Route Alteration Detected! Path has deviated from baseline fingerprint.';
    if (alertBanner) {
      alertBanner.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      alertBanner.style.background = 'rgba(245, 158, 11, 0.07)';
    }
  } else {
    if (statusIcon) statusIcon.textContent = '✅';
    if (statusText) statusText.textContent = 'Route is stable and matches baseline fingerprint.';
    if (alertBanner) {
      alertBanner.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      alertBanner.style.background = 'rgba(16, 185, 129, 0.05)';
    }
  }
}

rvTraceBtn?.addEventListener('click', async () => {
  playBubbleClick(850);
  const customVal = rvCustomInput?.value?.trim() || '';
  showToast(`🛰️ Tracing route to ${activeRvDest === 'custom' ? customVal : activeRvDest.toUpperCase()}...`);
  try {
    const res = await fetch('/api/route/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: activeRvDest, customTarget: customVal })
    });
    const data = await res.json();
    if (data.error) {
      showToast(data.error);
      return;
    }

    // Start polling loop
    if (rvPollTimer) clearInterval(rvPollTimer);
    rvPollTimer = setInterval(async () => {
      try {
        const sRes = await fetch('/api/route/status');
        const status = await sRes.json();
        updateRouteVisionUI(status);
        if (!status.isTracing) {
          clearInterval(rvPollTimer);
          rvPollTimer = null;
          playVictoryChime();
          showToast(`✅ Route trace complete: ${status.hops.length} hops resolved.`);
          fetchRouteVisionHistory();
        }
      } catch (e) {}
    }, 800);
  } catch (e) {
    showToast('Failed to start Route Vision trace.');
  }
});

rvCancelBtn?.addEventListener('click', async () => {
  playBubbleClick(500);
  showToast('Cancelling Route trace...');
  try {
    await fetch('/api/route/cancel', { method: 'POST' });
    if (rvPollTimer) {
      clearInterval(rvPollTimer);
      rvPollTimer = null;
    }
    const sRes = await fetch('/api/route/status');
    const status = await sRes.json();
    updateRouteVisionUI(status);
  } catch (e) {}
});

// =========================================================================
// 15. NETWORK AUTOPILOT CONTROLLER (PHASE 5)
// =========================================================================
const apModeCards = [
  { id: 'ap-mode-observe', mode: 'OBSERVE' },
  { id: 'ap-mode-assist', mode: 'ASSIST' },
  { id: 'ap-mode-autopilot', mode: 'AUTOPILOT' },
  { id: 'ap-mode-manual', mode: 'MANUAL' }
];

apModeCards.forEach(item => {
  const el = document.getElementById(item.id);
  el?.addEventListener('click', () => {
    setAutopilotMode(item.mode);
  });
});

async function setAutopilotMode(newMode) {
  playBubbleClick(750);
  showToast(`🧭 Switching Autopilot mode to ${newMode}...`);
  try {
    const res = await fetch('/api/autopilot/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode })
    });
    const data = await res.json();
    if (data.success) {
      playVictoryChime();
      showToast(`Autopilot operating mode: ${data.mode}`);
      fetchAutopilotState();
    }
  } catch (e) {
    showToast('Failed to switch Autopilot mode.');
  }
}

async function fetchAutopilotState() {
  try {
    const res = await fetch('/api/autopilot/state');
    const stateData = await res.json();
    renderAutopilotUI(stateData);
  } catch (e) {}
}

function renderAutopilotUI(data) {
  if (!data) return;

  // Mode badge & active cards
  document.getElementById('ap-active-mode-badge').textContent = `MODE: ${data.mode}`;
  apModeCards.forEach(c => {
    const el = document.getElementById(c.id);
    if (c.mode === data.mode) el?.classList.add('active');
    else el?.classList.remove('active');
  });

  // Pending Actions
  const pendingContainer = document.getElementById('ap-pending-container');
  const pendingList = document.getElementById('ap-pending-list');
  const pendingBadge = document.getElementById('ap-pending-count-badge');
  const pending = data.pendingActions || [];

  if (pendingBadge) pendingBadge.textContent = `${pending.length} Pending`;

  if (pending.length > 0 && data.mode === 'ASSIST') {
    if (pendingContainer) pendingContainer.style.display = 'block';
    if (pendingList) {
      pendingList.innerHTML = pending.map(a => `
        <div class="ap-pending-card">
          <div>
            <div style="font-weight: 700; color: #F59E0B; font-size: 13px;">${a.actionKey}</div>
            <div style="font-size: 12px; color: #E2E8F0; margin-top: 2px;">${a.triggerReason}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="action-pill-btn bg-emerald font-bold" onclick="approveAutopilotAction('${a.actionId}', true)" style="color: #0B0F19;">⚡ Approve</button>
            <button class="action-pill-btn bg-rose font-bold" onclick="approveAutopilotAction('${a.actionId}', false)" style="color: #fff;">✕ Reject</button>
          </div>
        </div>
      `).join('');
    }
  } else {
    if (pendingContainer) pendingContainer.style.display = 'none';
  }

  // Active Safety Rules
  const rulesList = document.getElementById('ap-rules-list');
  if (rulesList && data.rules) {
    rulesList.innerHTML = data.rules.map(r => `
      <div class="ap-rule-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; font-size: 13px; color: #fff;">${r.name}</span>
          <span class="status-pill pill-cyan font-mono">${r.riskLevel}</span>
        </div>
        <div style="font-size: 11px; color: #94A3B8; margin-top: 4px;">${r.description}</div>
      </div>
    `).join('');
  }

  // Audit Logs
  renderAutopilotAuditLogs(data.recentAuditLogs || []);
}

function renderAutopilotAuditLogs(logs) {
  const tbody = document.getElementById('ap-audit-tbody');
  if (!tbody) return;
  if (!logs || logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate">No audit records in SQLite.</td></tr>';
    return;
  }
  tbody.innerHTML = logs.map(l => {
    const isExecuted = l.status === 'EXECUTED';
    const statusPill = l.status === 'EXECUTED' ? 'pill-emerald' :
                       l.status === 'ROLLED_BACK' || l.status === 'EXPIRED' ? 'pill-cyan' :
                       l.status === 'REJECTED' ? 'pill-rose' : 'pill-amber';

    const rollbackBtn = isExecuted ? `<button class="action-pill-btn font-mono" style="padding: 2px 8px; font-size: 10px;" onclick="rollbackAutopilotAction('${l.actionKey}')">↺ Rollback</button>` : '<span class="text-slate">-</span>';

    return `
      <tr>
        <td class="font-mono text-slate">${l.dateStr || new Date(l.timestamp).toLocaleTimeString()}</td>
        <td class="font-bold">${l.mode}</td>
        <td class="font-mono text-cyan">${l.actionKey}</td>
        <td style="font-size: 12px; color: #CBD5E1;">${l.triggerReason}</td>
        <td><span class="status-pill ${statusPill} font-mono">${l.status}</span></td>
        <td>${rollbackBtn}</td>
      </tr>
    `;
  }).join('');
}

window.approveAutopilotAction = async function(actionId, approve) {
  playBubbleClick(800);
  try {
    const res = await fetch('/api/autopilot/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, approve })
    });
    const data = await res.json();
    playVictoryChime();
    showToast(approve ? 'Optimization Approved & Executed' : 'Proposal Rejected');
    fetchAutopilotState();
  } catch (e) {
    showToast('Failed to submit approval.');
  }
};

window.rollbackAutopilotAction = async function(actionKey) {
  playBubbleClick(600);
  showToast(`Rolling back ${actionKey}...`);
  try {
    const res = await fetch('/api/autopilot/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey })
    });
    const data = await res.json();
    playVictoryChime();
    showToast(data.message || 'Action rolled back.');
    fetchAutopilotState();
  } catch (e) {
    showToast('Failed to rollback action.');
  }
};

// Autopilot Manual Action Buttons
document.getElementById('ap-btn-flush-dns')?.addEventListener('click', async () => {
  playBubbleClick(800);
  showToast('🧹 Purging Windows DNS Resolver Cache...');
  await fetch('/api/autopilot/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey: 'PURGE_DNS_CACHE', triggerReason: 'User-Initiated Manual Overdrive' })
  });
  playVictoryChime();
  showToast('DNS Resolver Cache flushed.');
  fetchAutopilotState();
});

document.getElementById('ap-btn-recalc-dna')?.addEventListener('click', async () => {
  playBubbleClick(850);
  showToast('🧬 Recalculating DNA Baselines...');
  await fetch('/api/autopilot/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey: 'UPDATE_DNA_BASELINES', triggerReason: 'User-Initiated Manual Overdrive' })
  });
  playVictoryChime();
  showToast('DNA Baselines recomputed from SQLite.');
  fetchAutopilotState();
});

document.getElementById('ap-btn-capture-blackbox')?.addEventListener('click', async () => {
  playBubbleClick(750);
  showToast('📦 Capturing Diagnostic Black Box Incident...');
  await fetch('/api/autopilot/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionKey: 'RECORD_INCIDENT_FORENSICS', triggerReason: 'User-Initiated Manual Snapshot' })
  });
  playVictoryChime();
  showToast('Diagnostic incident saved in Black Box.');
  fetchAutopilotState();
});

document.getElementById('ap-refresh-audit-btn')?.addEventListener('click', () => {
  playBubbleClick(650);
  fetchAutopilotState();
});

// =========================================================================
// 16. NOVA SUB-TABS & PREDICTIVE INTELLIGENCE (PHASE 4)
// =========================================================================
const novaSubtabs = document.getElementById('nova-subtabs');
const novaViews = {
  live: document.getElementById('nova-view-live'),
  daily: document.getElementById('nova-view-daily'),
  weekly: document.getElementById('nova-view-weekly'),
  qa: document.getElementById('nova-view-qa')
};

novaSubtabs?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    novaSubtabs.querySelectorAll('.range-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    playBubbleClick(700);

    Object.entries(novaViews).forEach(([key, el]) => {
      if (el) el.style.display = key === tab ? (key === 'live' ? 'grid' : 'block') : 'none';
    });

    if (tab === 'daily') fetchNovaDailyReport();
    if (tab === 'weekly') fetchNovaWeeklyReport();
  });
});

async function fetchNovaDailyReport() {
  const container = document.getElementById('nova-daily-content');
  if (!container) return;
  container.innerHTML = '<div class="text-center text-slate" style="padding: 24px;">Generating daily report from SQLite telemetry...</div>';
  try {
    const res = await fetch('/api/nova/report/daily');
    const rep = await res.json();
    const trends = rep.trends || {};

    const factsHtml = (rep.facts || []).map(f => `<li style="margin-bottom: 6px;"><strong style="color: #B9BEC4;">[FACT]</strong> ${f}</li>`).join('');
    const predsHtml = (rep.predictions || []).map(p => `<li style="margin-bottom: 6px;"><strong style="color: #B9774E;">[PREDICTION]</strong> ${p}</li>`).join('');

    container.innerHTML = `
      <div class="overview-dual-meters" style="margin-bottom: 16px;">
        <div class="meter-card">
          <div class="meter-header">
            <span class="meter-label">DAILY HEALTH SCORE</span>
            <span class="meter-sub font-mono">[FACT]</span>
          </div>
          <div class="meter-main-val text-emerald">${rep.healthScore || 100}%</div>
          <div class="meter-note text-slate">${trends.sampleCount || 0} telemetry snapshots audited</div>
        </div>

        <div class="meter-card">
          <div class="meter-header">
            <span class="meter-label">MEAN THROUGHPUT</span>
            <span class="meter-sub font-mono">[FACT]</span>
          </div>
          <div class="meter-main-val text-cyan">${trends.avgDownMbps || 0} Mbps</div>
          <div class="meter-note text-slate">Uptime: ${rep.uptimePct || 100}%</div>
        </div>

        <div class="meter-card">
          <div class="meter-header">
            <span class="meter-label">AVERAGE PING</span>
            <span class="meter-sub font-mono">[FACT]</span>
          </div>
          <div class="meter-main-val text-violet">${trends.avgPingMs || 16} ms</div>
          <div class="meter-note text-slate">Peak Ping: ${trends.peakPingMs || 16} ms</div>
        </div>
      </div>

      <div class="panel-card" style="border-color: var(--border-subtle); margin-bottom: 16px;">
        <div style="font-weight: 700; font-size: 13px; color: #E58A48; margin-bottom: 6px;">EXECUTIVE DIAGNOSTIC SUMMARY:</div>
        <p style="font-size: 14px; color: #E2E8F0; line-height: 1.6;">${rep.summaryText || 'Network is performing within nominal parameters.'}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="panel-card">
          <div style="font-weight: 700; font-size: 13px; color: #B9BEC4; margin-bottom: 8px;">VERIFIED SYSTEM FACTS:</div>
          <ul class="font-sans text-slate" style="font-size: 13px; line-height: 1.6; padding-left: 18px;">
            ${factsHtml || '<li>No telemetry facts recorded yet.</li>'}
          </ul>
        </div>
        <div class="panel-card">
          <div style="font-weight: 700; font-size: 13px; color: #B9774E; margin-bottom: 8px;">PREDICTIVE FORECASTS:</div>
          <ul class="font-sans text-slate" style="font-size: 13px; line-height: 1.6; padding-left: 18px;">
            ${predsHtml || '<li>Awaiting further telemetry for confidence projection.</li>'}
          </ul>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<div class="text-center text-rose" style="padding: 24px;">Failed to load daily report.</div>';
  }
}

async function fetchNovaWeeklyReport() {
  const container = document.getElementById('nova-weekly-content');
  if (!container) return;
  container.innerHTML = '<div class="text-center text-slate" style="padding: 24px;">Generating 7-day trend analysis from SQLite...</div>';
  try {
    const res = await fetch('/api/nova/report/weekly');
    const rep = await res.json();
    const pat = rep.recurringPatterns || {};
    const impHtml = (rep.improvements || []).map(i => `<li style="margin-bottom: 6px;">${i}</li>`).join('');

    const peakWindowStr = pat.peakHourFormatted || (pat.peakHour !== undefined && pat.peakHour !== null ? String(pat.peakHour).padStart(2, '0') + ':00' : (pat.fastestHour !== undefined && pat.fastestHour !== null ? String(pat.fastestHour).padStart(2, '0') + ':00' : 'Learning'));

    container.innerHTML = `
      <div class="overview-dual-meters" style="margin-bottom: 16px;">
        <div class="meter-card">
          <div class="meter-header">
            <span class="meter-label">7-DAY UPTIME</span>
            <span class="meter-sub font-mono">[FACT]</span>
          </div>
          <div class="meter-main-val text-emerald">${rep.uptimePct || 100}%</div>
          <div class="meter-note text-slate">${rep.sampleCount || 0} historical samples</div>
        </div>

        <div class="meter-card">
          <div class="meter-header">
            <span class="meter-label">7-DAY AVG DOWN / UP</span>
            <span class="meter-sub font-mono">[FACT]</span>
          </div>
          <div class="meter-main-val text-cyan">${rep.avgDownMbps || 0} / ${rep.avgUpMbps || 0} <span style="font-size: 14px;">Mbps</span></div>
          <div class="meter-note text-slate">7-day continuous throughput</div>
        </div>

        <div class="meter-card">
          <div class="meter-header">
            <span class="meter-label">PEAK EFFICIENCY WINDOW</span>
            <span class="meter-sub font-mono">[PREDICTION]</span>
          </div>
          <div class="meter-main-val text-cyan">${peakWindowStr}</div>
          <div class="meter-note text-slate">Recurring low contention window</div>
        </div>
      </div>

      <div class="panel-card" style="border-color: var(--border-subtle); margin-bottom: 16px;">
        <div style="font-weight: 700; font-size: 13px; color: #E58A48; margin-bottom: 8px;">STRATEGIC RECOMMENDATIONS &amp; ACTIONS:</div>
        <ul class="font-sans text-slate" style="font-size: 13px; line-height: 1.6; padding-left: 18px;">
          ${impHtml}
        </ul>
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<div class="text-center text-rose" style="padding: 24px;">Failed to load weekly summary.</div>';
  }
}

document.getElementById('nova-refresh-daily-btn')?.addEventListener('click', () => {
  playBubbleClick(650);
  fetchNovaDailyReport();
});

document.getElementById('nova-refresh-weekly-btn')?.addEventListener('click', () => {
  playBubbleClick(650);
  fetchNovaWeeklyReport();
});

// Q&A Engine Controller
async function askNovaQA(question) {
  if (!question || !question.trim()) return;
  playBubbleClick(800);
  showToast(`Asking NOVA: "${question.substring(0, 30)}..."`);
  try {
    const res = await fetch('/api/nova/troubleshoot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const ans = await res.json();
    playVictoryChime();

    const box = document.getElementById('nova-qa-answer-box');
    const title = document.getElementById('nova-qa-answer-title');
    const body = document.getElementById('nova-qa-answer-body');
    const fact = document.getElementById('nova-qa-answer-fact');

    if (box) box.style.display = 'block';
    if (title) title.textContent = ans.question || 'DIAGNOSTIC RESOLUTION';

    const factsHtml = (ans.measuredFacts || []).map(f => `<li>${f}</li>`).join('');

    if (body) {
      body.innerHTML = `
        <div style="margin-bottom: 10px;"><strong>Analysis:</strong> ${ans.evidenceAnalysis || ''}</div>
        <div style="margin-bottom: 10px;"><strong>Likely Cause:</strong> <span style="color: #F59E0B;">${ans.likelyCause || ''}</span></div>
        <div style="margin-bottom: 10px;"><strong>Recommended Action:</strong> <span style="color: #10B981;">${ans.recommendedAction || ''}</span></div>
        <div style="margin-top: 12px; font-size: 12px; color: #94A3B8;">
          <strong>Verified Telemetry Facts:</strong>
          <ul style="padding-left: 18px; margin-top: 4px;">${factsHtml}</ul>
        </div>
      `;
    }
    if (fact) fact.textContent = `Diagnostic Confidence: ${ans.confidenceScore || 90}% (based on live adapter and SQLite baseline telemetry)`;
  } catch (e) {
    showToast('Failed to get answer from NOVA.');
  }
}

document.getElementById('nova-qa-chips')?.querySelectorAll('.range-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.dataset.q;
    const input = document.getElementById('nova-qa-input');
    if (input) input.value = q;
    askNovaQA(q);
  });
});

document.getElementById('nova-qa-submit-btn')?.addEventListener('click', () => {
  const input = document.getElementById('nova-qa-input');
  if (input) askNovaQA(input.value);
});

document.getElementById('nova-qa-input')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    askNovaQA(e.target.value);
  }
});

// =========================================================================
// 15. THREE-MODE THEME ENGINE (DARK, LIGHT, SYSTEM DEFAULT)
// =========================================================================
const themeSelect = document.getElementById('theme-select');
const settingsThemeSelect = document.getElementById('settings-theme-select');
const settingsGlowSelect = document.getElementById('settings-glow-select');

function applyTheme(themeMode) {
  let effectiveTheme = themeMode;
  if (themeMode === 'system') {
    effectiveTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  document.body.setAttribute('data-theme', effectiveTheme);
  localStorage.setItem('vortex_theme_mode', themeMode);

  if (themeSelect) themeSelect.value = themeMode;
  if (settingsThemeSelect) settingsThemeSelect.value = themeMode;

  // Immediately refresh active charts for instantaneous theme grid & palette update
  try {
    if (typeof drawSpeedTrendChart === 'function') drawSpeedTrendChart();
    if (typeof renderTimeMachineChart === 'function') renderTimeMachineChart();
    if (typeof renderDnaCurve === 'function') renderDnaCurve();
    if (typeof drawBufferbloatChart === 'function') drawBufferbloatChart();
  } catch (e) {}
}

const storedTheme = localStorage.getItem('vortex_theme_mode') || 'dark';
applyTheme(storedTheme);

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = localStorage.getItem('vortex_theme_mode') || 'dark';
    if (current === 'system') {
      applyTheme('system');
    }
  });
}

themeSelect?.addEventListener('change', (e) => applyTheme(e.target.value));
settingsThemeSelect?.addEventListener('change', (e) => applyTheme(e.target.value));

settingsGlowSelect?.addEventListener('change', (e) => {
  const glow = e.target.value;
  localStorage.setItem('vortex_accent_glow', glow);
  showToast(`Speedometer accent glow updated: ${glow.toUpperCase()}`);
});

// =========================================================================
// 16. QUICK 4-PILLAR INTERNET HEALTH CHECK
// =========================================================================
const quickCheckBtn = document.getElementById('quick-check-btn');
const quickCheckModal = document.getElementById('quick-check-modal');
const closeQuickCheckBtn = document.getElementById('close-quick-check-btn');
const qcDoneBtn = document.getElementById('qc-done-btn');
const qcRecheckBtn = document.getElementById('qc-recheck-btn');

const qcBadge = document.getElementById('qc-badge');
const qcSummary = document.getElementById('qc-summary');
const qcGwVal = document.getElementById('qc-gw-val');
const qcDnsVal = document.getElementById('qc-dns-val');
const qcWanVal = document.getElementById('qc-wan-val');
const qcCdnVal = document.getElementById('qc-cdn-val');

async function runQuickCheck() {
  if (quickCheckModal) quickCheckModal.classList.remove('hidden');
  if (qcBadge) {
    qcBadge.className = 'qc-status-badge chip-warn';
    qcBadge.textContent = 'PROBING...';
  }
  if (qcSummary) qcSummary.textContent = 'Testing Gateway, DNS, WAN latency and CDN edge transit...';
  if (qcGwVal) qcGwVal.textContent = '...';
  if (qcDnsVal) qcDnsVal.textContent = '...';
  if (qcWanVal) qcWanVal.textContent = '...';
  if (qcCdnVal) qcCdnVal.textContent = '...';

  try {
    const res = await fetch('/api/quick-check?t=' + Date.now());
    const data = await res.json();

    if (qcGwVal) qcGwVal.textContent = `${data.gateway.latencyMs} ms`;
    if (qcDnsVal) qcDnsVal.textContent = `${data.dns.lookupTimeMs} ms`;
    if (qcWanVal) qcWanVal.textContent = `${data.wanPing.latencyMs} ms`;
    if (qcCdnVal) qcCdnVal.textContent = `${data.httpCdn.rttMs} ms (${data.httpCdn.colo || 'EDGE'})`;

    if (qcBadge) {
      qcBadge.className = data.healthy ? 'qc-status-badge chip-online' : 'qc-status-badge chip-offline';
      qcBadge.textContent = data.overallStatus;
    }
    if (qcSummary) qcSummary.textContent = data.summary;
  } catch (err) {
    if (qcBadge) {
      qcBadge.className = 'qc-status-badge chip-offline';
      qcBadge.textContent = 'ERROR';
    }
    if (qcSummary) qcSummary.textContent = 'Failed to execute health check: ' + err.message;
  }
}

quickCheckBtn?.addEventListener('click', runQuickCheck);
closeQuickCheckBtn?.addEventListener('click', () => quickCheckModal?.classList.add('hidden'));
qcDoneBtn?.addEventListener('click', () => quickCheckModal?.classList.add('hidden'));
qcRecheckBtn?.addEventListener('click', runQuickCheck);

// =========================================================================
// 17. ACTIVE NETWORK STATUS POPUP
// =========================================================================
const netStatusBtn = document.getElementById('net-status-btn');
const netStatusModal = document.getElementById('net-status-modal');
const closeNetStatusBtn = document.getElementById('close-net-status-btn');
const nsCloseBtn = document.getElementById('ns-close-btn');

const nsAdapter = document.getElementById('ns-adapter');
const nsType = document.getElementById('ns-type');
const nsChannel = document.getElementById('ns-channel');
const nsLocalIp = document.getElementById('ns-local-ip');
const nsGatewayIp = document.getElementById('ns-gateway-ip');
const nsDns = document.getElementById('ns-dns');
const nsLiveDown = document.getElementById('ns-live-down');
const nsLiveUp = document.getElementById('ns-live-up');
const nsLinkSpeed = document.getElementById('ns-link-speed');
const nsTodayData = document.getElementById('ns-today-data');

async function openNetworkStatus() {
  if (netStatusModal) netStatusModal.classList.remove('hidden');
  try {
    const res = await fetch('/api/network-status?t=' + Date.now());
    const d = await res.json();

    if (nsAdapter) nsAdapter.textContent = d.adapterName;
    if (nsType) nsType.textContent = d.adapterType;
    if (nsChannel) nsChannel.textContent = `Channel ${d.channel} (${d.band})`;
    if (nsLocalIp) nsLocalIp.textContent = d.localIp;
    if (nsGatewayIp) nsGatewayIp.textContent = d.gatewayIp;
    if (nsDns) nsDns.textContent = d.dnsServer;
    if (nsLiveDown) nsLiveDown.textContent = `${d.liveDownMbps.toFixed(2)} Mbps`;
    if (nsLiveUp) nsLiveUp.textContent = `${d.liveUpMbps.toFixed(2)} Mbps`;
    if (nsLinkSpeed) nsLinkSpeed.textContent = `${d.linkSpeedMbps} Mbps`;
    if (nsTodayData) nsTodayData.textContent = `${d.todayGb} GB`;
  } catch (e) {
    showToast('Failed to load network status.');
  }
}

netStatusBtn?.addEventListener('click', openNetworkStatus);
closeNetStatusBtn?.addEventListener('click', () => netStatusModal?.classList.add('hidden'));
nsCloseBtn?.addEventListener('click', () => netStatusModal?.classList.add('hidden'));

// =========================================================================
// 18. SETTINGS & PERSONALIZATION CENTRE (DATA VAULT)
// =========================================================================
const saveSettingsBtn = document.getElementById('save-settings-btn');
const purgeTelemetryBtn = document.getElementById('purge-telemetry-btn');
const clearAllTestsBtn = document.getElementById('clear-all-tests-btn');

const vaultDbSize = document.getElementById('vault-db-size');
const vaultTestsCount = document.getElementById('vault-tests-count');
const vaultTelemetryCount = document.getElementById('vault-telemetry-count');
const vaultIncidentsCount = document.getElementById('vault-incidents-count');

async function loadVaultStats() {
  try {
    const res = await fetch('/api/vault/stats?t=' + Date.now());
    const s = await res.json();
    if (vaultDbSize) vaultDbSize.textContent = `${s.dbSizeMb} MB`;
    if (vaultTestsCount) vaultTestsCount.textContent = s.speedTestsCount.toLocaleString();
    if (vaultTelemetryCount) vaultTelemetryCount.textContent = s.telemetrySamplesCount.toLocaleString();
    if (vaultIncidentsCount) vaultIncidentsCount.textContent = s.incidentsCount.toLocaleString();
  } catch (e) {}
}

async function loadSettings() {
  try {
    const res = await fetch('/api/settings?t=' + Date.now());
    const data = await res.json();
    if (data.success && data.settings) {
      const cfg = data.settings;
      if (settingsThemeSelect && cfg.themeMode) settingsThemeSelect.value = cfg.themeMode;
      if (document.getElementById('cfg-speed-alert') && cfg.speedAlertThreshold) {
        document.getElementById('cfg-speed-alert').value = cfg.speedAlertThreshold;
      }
      if (document.getElementById('cfg-packet-loss-alert') && cfg.packetLossWarningThreshold) {
        document.getElementById('cfg-packet-loss-alert').value = cfg.packetLossWarningThreshold;
      }
      if (document.getElementById('cfg-min-tray') && typeof cfg.minimizeToTray === 'boolean') {
        document.getElementById('cfg-min-tray').checked = cfg.minimizeToTray;
      }
      if (document.getElementById('cfg-close-tray') && typeof cfg.closeToTray === 'boolean') {
        document.getElementById('cfg-close-tray').checked = cfg.closeToTray;
      }
      if (document.getElementById('cfg-single-instance') && typeof cfg.singleInstance === 'boolean') {
        document.getElementById('cfg-single-instance').checked = cfg.singleInstance;
      }
    }
  } catch (e) {}
  loadVaultStats();
}

saveSettingsBtn?.addEventListener('click', async () => {
  const newSettings = {
    themeMode: settingsThemeSelect ? settingsThemeSelect.value : 'dark',
    accentGlow: settingsGlowSelect ? settingsGlowSelect.value : 'cyan',
    uiDensity: document.getElementById('settings-density-select')?.value || 'comfortable',
    animSpeed: document.getElementById('settings-anim-select')?.value || 'normal',
    startWithWindows: document.getElementById('cfg-start-windows')?.checked || false,
    minimizeToTray: document.getElementById('cfg-min-tray')?.checked || true,
    closeToTray: document.getElementById('cfg-close-tray')?.checked || true,
    singleInstance: document.getElementById('cfg-single-instance')?.checked || true,
    speedAlertThreshold: parseInt(document.getElementById('cfg-speed-alert')?.value, 10) || 15,
    outageNotifications: document.getElementById('cfg-outage-alerts')?.checked || true,
    packetLossWarningThreshold: parseInt(document.getElementById('cfg-packet-loss-alert')?.value, 10) || 5,
    quietHours: document.getElementById('cfg-quiet-hours')?.checked || false,
    adapterSelection: document.getElementById('cfg-adapter-select')?.value || 'auto',
    samplingIntervalSec: parseInt(document.getElementById('cfg-sampling-select')?.value, 10) || 1,
    incidentRetentionDays: parseInt(document.getElementById('cfg-retention-select')?.value, 10) || 30
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Settings & preferences saved to SQLite vault! 💾');
    }
  } catch (e) {
    showToast('Failed to save settings: ' + e.message);
  }
});

purgeTelemetryBtn?.addEventListener('click', async () => {
  if (confirm('Purge telemetry samples older than 7 days from SQLite?')) {
    try {
      const res = await fetch('/api/vault/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'telemetry' })
      });
      const d = await res.json();
      showToast(d.message || 'Telemetry purged.');
      loadVaultStats();
    } catch (e) {
      showToast('Purge failed: ' + e.message);
    }
  }
});

clearAllTestsBtn?.addEventListener('click', async () => {
  if (confirm('Clear all historical speed test records from SQLite?')) {
    try {
      const res = await fetch('/api/speed/history/clear', { method: 'POST' });
      const d = await res.json();
      showToast(d.message || 'Speed test history cleared.');
      loadSpeedHistory();
      loadVaultStats();
    } catch (e) {
      showToast('Clear failed: ' + e.message);
    }
  }
});

// Load settings on startup
loadSettings();

// =========================================================================
// DESKTOP INTEGRATION & RESPONSIVE EVENT HANDLERS
// =========================================================================
let debouncedResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(debouncedResizeTimer);
  debouncedResizeTimer = setTimeout(() => {
    // Redraw speed trend chart if active or data available
    if (speedTrendCanvas && lastSpeedHistory && lastSpeedHistory.length > 0) {
      drawSpeedTrendChart(lastSpeedHistory);
    }
    // Redraw time machine if data loaded
    if (tmCanvas && state.timeMachineData && state.timeMachineData.length > 0) {
      renderTimeMachineChart();
    }
    // Redraw DNA baseline curve if loaded
    if (dnaCurveCanvas && lastDnaCurve) {
      renderDnaCurve(lastDnaCurve);
    }
    // Redraw Bufferbloat chart if points exist
    if (bbChartCanvas && typeof bbChartPoints !== 'undefined' && bbChartPoints.length > 0) {
      drawBufferbloatChart();
    }
  }, 100);
});

// Native Windows Desktop Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  const tag = activeEl ? activeEl.tagName.toLowerCase() : '';
  const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';

  // Escape Key: Close modals, drawers, or blur inputs
  if (e.key === 'Escape') {
    // 1. Modals
    const quickModal = document.getElementById('quick-check-modal');
    const netModal = document.getElementById('net-status-modal');
    const cmdPaletteModal = document.getElementById('cmd-palette-modal');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const restoreModal = document.getElementById('restore-confirm-modal');
    let modalClosed = false;

    if (cmdPaletteModal && !cmdPaletteModal.classList.contains('hidden')) {
      cmdPaletteModal.classList.add('hidden');
      modalClosed = true;
    }
    if (shortcutsModal && !shortcutsModal.classList.contains('hidden')) {
      shortcutsModal.classList.add('hidden');
      modalClosed = true;
    }
    if (restoreModal && !restoreModal.classList.contains('hidden')) {
      restoreModal.classList.add('hidden');
      modalClosed = true;
    }
    if (quickModal && quickModal.style.display !== 'none' && !quickModal.classList.contains('hidden')) {
      quickModal.style.display = 'none';
      quickModal.classList.add('hidden');
      modalClosed = true;
    }
    if (netModal && netModal.style.display !== 'none' && !netModal.classList.contains('hidden')) {
      netModal.style.display = 'none';
      netModal.classList.add('hidden');
      modalClosed = true;
    }
    if (modalClosed) return;

    // 2. Drawers
    const detailsDrawer = document.getElementById('diag-details-drawer');
    const crossDrawer = document.getElementById('diag-cross-drawer');
    let drawerClosed = false;
    if (detailsDrawer && !detailsDrawer.classList.contains('hidden')) {
      detailsDrawer.classList.add('hidden');
      drawerClosed = true;
    }
    if (crossDrawer && !crossDrawer.classList.contains('hidden')) {
      crossDrawer.classList.add('hidden');
      drawerClosed = true;
    }
    if (drawerClosed) return;

    // 3. Blur focused inputs
    if (isInput && typeof activeEl.blur === 'function') {
      activeEl.blur();
    }
    return;
  }

  // Ctrl + K: Open Command Palette
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    openCommandPalette();
    return;
  }

  // If typing in an input field, do not trigger single-key action shortcuts
  if (isInput) return;

  // Key '?': Toggle Keyboard Shortcuts Reference
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    openShortcutsModal();
    return;
  }

  // Key 'T': Cycle Theme
  if (e.key === 't' || e.key === 'T') {
    cycleThemeMode();
    return;
  }

  // Key 'B': Jump to Backup & Vault in Settings
  if (e.key === 'b' || e.key === 'B') {
    switchView('module-settings');
    const vaultEl = document.getElementById('btn-create-backup');
    if (vaultEl) vaultEl.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Key 'R': Retest Connection
  if (e.key === 'r' || e.key === 'R') {
    const activeModule = document.querySelector('.view-panel.active');
    if (activeModule && activeModule.id === 'module-speed') {
      const retestBtn = document.getElementById('diag-retest-btn');
      if (retestBtn && !retestBtn.disabled && !state.isTesting) {
        retestBtn.click();
      }
    }
    return;
  }

  // Number Keys 1-9: Module Quick Navigation
  if (e.key >= '1' && e.key <= '9') {
    const modules = [
      'module-overview',
      'module-speed',
      'module-nova',
      'module-explorer',
      'module-settings'
    ];
    const targetModule = modules[parseInt(e.key, 10) - 1];
    if (targetModule) {
      switchView(targetModule);
    }
    return;
  }

  // Space or Enter: Start/Retest Speed Test if on Speed module
  if (e.key === ' ' || e.key === 'Enter') {
    const activeModule = document.querySelector('.view-panel.active');
    if (activeModule && activeModule.id === 'module-speed') {
      e.preventDefault();
      const startBtn = document.getElementById('diag-start-btn');
      const retestBtn = document.getElementById('diag-retest-btn');
      if (startBtn && !startBtn.classList.contains('hidden') && !state.isTesting) {
        startBtn.click();
      } else if (retestBtn && !retestBtn.disabled && !state.isTesting) {
        retestBtn.click();
      }
    }
  }
});

// =========================================================================
// COMMAND PALETTE & GLOBAL SEARCH ENGINE
// =========================================================================

const COMMAND_CATALOG = [
  // Modules
  { id: 'nav-overview', title: 'Overview', desc: 'Real-time telemetry, bandwidth gauges, active adapter', category: 'Navigation', icon: '📊', action: () => switchView('module-overview') },
  { id: 'nav-speed', title: 'Speed Diagnostics', desc: '15-state multi-stream symmetric speed benchmark', category: 'Navigation', icon: '🚀', action: () => switchView('module-speed') },
  { id: 'nav-guardian', title: 'Application Monitor', desc: 'Process bandwidth consumption & network sockets', category: 'Navigation', icon: '🛡️', action: () => switchView('module-guardian') },
  { id: 'nav-digitaltwin', title: 'Device Radar & Twin', desc: 'Subnet device discovery, ARP topology, station tags', category: 'Navigation', icon: '🌐', action: () => switchView('module-digitaltwin') },
  { id: 'nav-nova', title: 'NOVA Intelligence', desc: 'Evidence-based network reasoning & troubleshooting assistant', category: 'Navigation', icon: '🤖', action: () => switchView('module-nova') },
  { id: 'nav-blackbox', title: 'Black Box Outage Log', desc: 'Micro-outage detection, jitter spikes & packet drops', category: 'Navigation', icon: '📦', action: () => switchView('module-blackbox') },
  { id: 'nav-timemachine', title: 'Network Time Machine', desc: 'Historical scrub, hourly telemetry & speed test records', category: 'Navigation', icon: '⏳', action: () => switchView('module-timemachine') },
  { id: 'nav-dna', title: 'Network DNA', desc: 'Hourly baseline curves, variance IQR & anomaly detection', category: 'Navigation', icon: '🧬', action: () => switchView('module-dna') },
  { id: 'nav-bufferbloat', title: 'Bufferbloat Analysis', desc: 'Loaded latency deltas, SQM ratings & buffer telemetry', category: 'Navigation', icon: '⏱️', action: () => switchView('module-bufferbloat') },
  { id: 'nav-routevision', title: 'Route Vision', desc: 'Multi-hop traceroute, ASN mapping & routing fingerprints', category: 'Navigation', icon: '🗺️', action: () => switchView('module-routevision') },
  { id: 'nav-autopilot', title: 'Autopilot Engine', desc: 'Autonomous QoS policy, adapter priority & watchdog', category: 'Navigation', icon: '⚡', action: () => switchView('module-autopilot') },
  { id: 'nav-gaming', title: 'Gaming Optimizer', desc: 'Game session latency tracking & packet loss monitor', category: 'Navigation', icon: '🎮', action: () => switchView('module-gaming') },
  { id: 'nav-wifi', title: 'Wi-Fi Radar', desc: '802.11 spectrum distribution, RSSI signal & nearby SSIDs', category: 'Navigation', icon: '📶', action: () => switchView('module-wifi') },
  { id: 'nav-isp', title: 'ISP Intelligence', desc: 'Provider SLA performance, peering & packet stability', category: 'Navigation', icon: '🏢', action: () => switchView('module-isp') },
  { id: 'nav-settings', title: 'Settings & Data Vault', desc: 'Preferences, verified backups, exports & system health', category: 'Navigation', icon: '⚙️', action: () => switchView('module-settings') },

  // Actions
  { id: 'act-retest', title: 'Run Speed Benchmark', desc: 'Start live multi-stream download & upload speed test', category: 'Actions', icon: '⚡', action: () => { switchView('module-speed'); const btn = document.getElementById('diag-retest-btn'); if (btn) btn.click(); } },
  { id: 'act-quickcheck', title: 'Run Quick 4-Pillar Health Check', desc: 'Test Gateway, DNS, WAN, and CDN in 2 seconds', category: 'Actions', icon: '🩺', action: () => { const btn = document.getElementById('quick-check-btn'); if (btn) btn.click(); } },
  { id: 'act-backup', title: 'Create Verified Database Backup', desc: 'Perform WAL checkpoint and atomic verified SQLite snapshot', category: 'Actions', icon: '💾', action: () => triggerCreateBackup() },
  { id: 'act-export-speed', title: 'Export Speed Tests (CSV)', desc: 'Download CSV spreadsheet of all historical speed tests', category: 'Data Export', icon: '📊', action: () => { window.location.href = '/api/export/speed_tests?format=csv'; } },
  { id: 'act-export-incidents', title: 'Export Incidents (CSV)', desc: 'Download CSV report of all recorded network incidents', category: 'Data Export', icon: '⚠️', action: () => { window.location.href = '/api/export/network_incidents?format=csv'; } },
  { id: 'act-export-json', title: 'Export All Telemetry (JSON)', desc: 'Download complete structured JSON snapshot of telemetry rows', category: 'Data Export', icon: '📦', action: () => { window.location.href = '/api/export/telemetry_history?format=json'; } },
  { id: 'act-theme', title: 'Cycle Interface Theme', desc: 'Toggle between Dark, Light, and Windows System theme', category: 'Actions', icon: '🎨', action: () => cycleThemeMode() },
  { id: 'act-flushdns', title: 'Flush Windows DNS Resolver Cache', desc: 'Execute safe DnsFlushResolverCache / ipconfig flush', category: 'Actions', icon: '🧹', action: () => executeAllowlistedAction('FLUSH_DNS') }
];

let selectedPaletteIndex = 0;
let currentPaletteItems = [];

function openCommandPalette() {
  const modal = document.getElementById('cmd-palette-modal');
  const input = document.getElementById('cmd-palette-input');
  if (!modal || !input) return;

  modal.classList.remove('hidden');
  input.value = '';
  renderPaletteResults('');
  input.focus();
}

function closeCommandPalette() {
  const modal = document.getElementById('cmd-palette-modal');
  if (modal) modal.classList.add('hidden');
}

function renderPaletteResults(query) {
  const container = document.getElementById('cmd-palette-results');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();
  currentPaletteItems = COMMAND_CATALOG.filter(item => {
    if (!q) return true;
    return item.title.toLowerCase().includes(q) ||
           item.desc.toLowerCase().includes(q) ||
           item.category.toLowerCase().includes(q);
  });

  selectedPaletteIndex = 0;

  if (currentPaletteItems.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px;">
        <div>No matching commands or modules found for "<strong>${escapeHtml(query)}</strong>"</div>
        <div style="margin-top: 6px; font-size: 11px;">Try searching for "speed", "backup", "devices", "theme", or "overview".</div>
      </div>
    `;
    return;
  }

  let html = '';
  let currentCat = '';

  currentPaletteItems.forEach((item, idx) => {
    if (item.category !== currentCat) {
      currentCat = item.category;
      html += `<div class="cmd-category-heading">${escapeHtml(currentCat)}</div>`;
    }

    const isSelected = idx === selectedPaletteIndex;
    html += `
      <div class="cmd-item ${isSelected ? 'selected' : ''}" data-index="${idx}" onclick="executePaletteItem(${idx})">
        <div class="cmd-item-left">
          <span style="font-size: 1.1rem;">${item.icon}</span>
          <div>
            <span class="cmd-item-title">${escapeHtml(item.title)}</span>
            <span class="cmd-item-desc">${escapeHtml(item.desc)}</span>
          </div>
        </div>
        <span class="cmd-item-badge">${escapeHtml(item.category)}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function executePaletteItem(index) {
  const item = currentPaletteItems[index];
  if (item && typeof item.action === 'function') {
    closeCommandPalette();
    try {
      item.action();
    } catch (e) {
      console.error('Error executing palette action:', e);
    }
  }
}

function cycleThemeMode() {
  const themeSelect = document.getElementById('theme-select');
  const settingsThemeSelect = document.getElementById('settings-theme-select');
  const modes = ['dark', 'light', 'system'];
  const current = (themeSelect && themeSelect.value) || 'dark';
  const nextIdx = (modes.indexOf(current) + 1) % modes.length;
  const nextTheme = modes[nextIdx];

  if (themeSelect) themeSelect.value = nextTheme;
  if (settingsThemeSelect) settingsThemeSelect.value = nextTheme;

  applyTheme(nextTheme);
  showToast(`Interface Theme updated to: ${nextTheme.toUpperCase()}`, 'info');
}

function openShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  if (modal) modal.classList.add('hidden');
}

// Wire Palette Input Key Events
const cmdPaletteInput = document.getElementById('cmd-palette-input');
if (cmdPaletteInput) {
  cmdPaletteInput.addEventListener('input', (e) => {
    renderPaletteResults(e.target.value);
  });

  cmdPaletteInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentPaletteItems.length > 0) {
        selectedPaletteIndex = (selectedPaletteIndex + 1) % currentPaletteItems.length;
        updatePaletteSelection();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentPaletteItems.length > 0) {
        selectedPaletteIndex = (selectedPaletteIndex - 1 + currentPaletteItems.length) % currentPaletteItems.length;
        updatePaletteSelection();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executePaletteItem(selectedPaletteIndex);
    }
  });
}

function updatePaletteSelection() {
  const items = document.querySelectorAll('.cmd-item');
  items.forEach((el, idx) => {
    if (idx === selectedPaletteIndex) {
      el.classList.add('selected');
      el.scrollIntoView({ block: 'nearest' });
    } else {
      el.classList.remove('selected');
    }
  });
}

// Wire Topbar Buttons
const paletteOpenBtn = document.getElementById('palette-open-btn');
if (paletteOpenBtn) paletteOpenBtn.addEventListener('click', openCommandPalette);

const closeCmdPaletteBtn = document.getElementById('close-cmd-palette-btn');
if (closeCmdPaletteBtn) closeCmdPaletteBtn.addEventListener('click', closeCommandPalette);

const shortcutsModalBtn = document.getElementById('shortcuts-modal-btn');
if (shortcutsModalBtn) shortcutsModalBtn.addEventListener('click', openShortcutsModal);

const closeShortcutsBtn = document.getElementById('close-shortcuts-btn');
if (closeShortcutsBtn) closeShortcutsBtn.addEventListener('click', closeShortcutsModal);

const shortcutsDoneBtn = document.getElementById('shortcuts-done-btn');
if (shortcutsDoneBtn) shortcutsDoneBtn.addEventListener('click', closeShortcutsModal);

// =========================================================================
// DATABASE BACKUP, SAFE RESTORE & DATA EXPORT ENGINE
// =========================================================================

async function loadBackupsList() {
  const container = document.getElementById('backups-list-container');
  if (!container) return;

  try {
    const res = await fetch('/api/backup/list');
    const data = await res.json();
    if (!data.success || !data.backups || data.backups.length === 0) {
      container.innerHTML = `
        <div style="font-size: 11px; color: var(--text-muted); font-style: italic; padding: 6px 0;">
          No backups stored yet. Click "Create Verified Backup" above to generate an atomic snapshot.
        </div>
      `;
      return;
    }

    let html = '';
    data.backups.forEach(b => {
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 12px;">
          <div>
            <div style="font-size: 12px; font-weight: 600; color: var(--cyan); font-family: 'JetBrains Mono', monospace;">${escapeHtml(b.filename)}</div>
            <div style="font-size: 10px; color: var(--text-slate); margin-top: 2px;">Size: ${b.sizeMb} MB • Created: ${b.createdDate}</div>
          </div>
          <button class="action-pill-btn" onclick="previewAndRestoreBackup('${escapeHtml(b.filename)}')" style="padding: 4px 10px; font-size: 10px; border-color: var(--amber); color: var(--amber);">
            Restore / Preview
          </button>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="font-size: 11px; color: var(--rose);">Failed to load backup catalog: ${escapeHtml(err.message)}</div>`;
  }
}

async function triggerCreateBackup() {
  const btn = document.getElementById('btn-create-backup');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Creating Snapshot...';
  }

  try {
    const res = await fetch('/api/backup/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'manual' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Verified backup created successfully (${data.sizeMb} MB)`, 'success');
      loadBackupsList();
    } else {
      showToast(`Backup error: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Backup failed: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Create Verified Backup';
    }
  }
}

let activeRestoreTarget = '';

async function previewAndRestoreBackup(filename) {
  activeRestoreTarget = filename;
  const modal = document.getElementById('restore-confirm-modal');
  if (!modal) return;

  try {
    const res = await fetch('/api/backup/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename })
    });
    const data = await res.json();
    if (!data.success) {
      showToast(`Restore preview error: ${data.error}`, 'error');
      return;
    }

    const restFile = document.getElementById('rest-filename');
    const restDate = document.getElementById('rest-date');
    const restSpeed = document.getElementById('rest-speed-count');
    const restTele = document.getElementById('rest-tele-count');
    const restInteg = document.getElementById('rest-integrity');
    const tokenInput = document.getElementById('restore-confirm-token-input');

    if (restFile) restFile.textContent = data.filename;
    if (restDate) restDate.textContent = new Date(data.createdAt).toLocaleString();
    if (restSpeed) restSpeed.textContent = (data.counts && data.counts.speedTests) || 0;
    if (restTele) restTele.textContent = (data.counts && data.counts.telemetry) || 0;
    if (restInteg) restInteg.textContent = data.integrity === 'ok' ? 'VERIFIED 100% OK' : data.integrity;
    if (tokenInput) tokenInput.value = '';

    modal.classList.remove('hidden');
  } catch (err) {
    showToast(`Preview error: ${err.message}`, 'error');
  }
}

async function executeRestore() {
  const tokenInput = document.getElementById('restore-confirm-token-input');
  const token = tokenInput ? tokenInput.value.trim() : '';

  if (token !== 'CONFIRM_RESTORE') {
    showToast('You must type CONFIRM_RESTORE to authorize restoration.', 'error');
    return;
  }

  const btn = document.getElementById('execute-restore-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Restoring & Verifying...';
  }

  try {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: activeRestoreTarget, confirmationToken: token })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Database successfully restored! Reloading data...', 'success');
      const modal = document.getElementById('restore-confirm-modal');
      if (modal) modal.classList.add('hidden');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast(`Restore rejected: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast(`Restore failed: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚠️ Confirm & Restore';
    }
  }
}

// Wire Restore Modal Buttons
const closeRestoreModalBtn = document.getElementById('close-restore-modal-btn');
if (closeRestoreModalBtn) closeRestoreModalBtn.addEventListener('click', () => {
  const modal = document.getElementById('restore-confirm-modal');
  if (modal) modal.classList.add('hidden');
});

const cancelRestoreBtn = document.getElementById('cancel-restore-btn');
if (cancelRestoreBtn) cancelRestoreBtn.addEventListener('click', () => {
  const modal = document.getElementById('restore-confirm-modal');
  if (modal) modal.classList.add('hidden');
});

const executeRestoreBtn = document.getElementById('execute-restore-btn');
if (executeRestoreBtn) executeRestoreBtn.addEventListener('click', executeRestore);

// Wire Backup and Export Buttons
const btnCreateBackup = document.getElementById('btn-create-backup');
if (btnCreateBackup) btnCreateBackup.addEventListener('click', triggerCreateBackup);

const btnRefreshBackups = document.getElementById('btn-refresh-backups');
if (btnRefreshBackups) btnRefreshBackups.addEventListener('click', loadBackupsList);

const btnExportSpeedCsv = document.getElementById('btn-export-speed-csv');
if (btnExportSpeedCsv) btnExportSpeedCsv.addEventListener('click', () => {
  window.location.href = '/api/export/speed_tests?format=csv';
});

const btnExportIncidentsCsv = document.getElementById('btn-export-incidents-csv');
if (btnExportIncidentsCsv) btnExportIncidentsCsv.addEventListener('click', () => {
  window.location.href = '/api/export/network_incidents?format=csv';
});

const btnExportTelemetryJson = document.getElementById('btn-export-telemetry-json');
if (btnExportTelemetryJson) btnExportTelemetryJson.addEventListener('click', () => {
  window.location.href = '/api/export/telemetry_history?format=json';
});

// =========================================================================
// DAILY NETWORK SUMMARY & SYSTEM HEALTH STATUS
// =========================================================================

async function loadDailySummary() {
  const heading = document.getElementById('summary-date-heading');
  const textEl = document.getElementById('daily-summary-text');
  const badgeEl = document.getElementById('summary-score-badge');
  const upEl = document.getElementById('sum-uptime');
  const downEl = document.getElementById('sum-avg-down');
  const upRateEl = document.getElementById('sum-avg-up');
  const pingEl = document.getElementById('sum-avg-ping');

  try {
    const res = await fetch('/api/summary/daily');
    const data = await res.json();
    if (data.error) return;

    if (heading) heading.textContent = `EXECUTIVE NETWORK REPORT (${data.dateStr})`;
    if (textEl) textEl.textContent = data.summaryText;
    if (badgeEl) badgeEl.textContent = `HEALTH SCORE: ${data.healthScore}/100`;
    if (upEl) upEl.textContent = `${data.uptimePct}%`;
    if (downEl) downEl.textContent = `${data.avgDownMbps} Mbps`;
    if (upRateEl) upRateEl.textContent = `${data.avgUpMbps} Mbps`;
    if (pingEl) pingEl.textContent = `${data.avgPingMs} ms`;
  } catch (e) {}
}

const btnRunSummary = document.getElementById('btn-run-summary-btn');
if (btnRunSummary) btnRunSummary.addEventListener('click', () => {
  loadDailySummary();
  showToast('Daily executive network summary refreshed.', 'info');
});

async function loadHealthDiagnostics() {
  try {
    const res = await fetch('/api/health/diagnostics');
    const data = await res.json();
    if (!data.status) return;

    const memEl = document.getElementById('app-mem-val');
    const healthMgrEl = document.getElementById('health-manager-val');
    const sqliteEl = document.getElementById('sqlite-health-val');

    if (memEl && data.systemMetrics && data.systemMetrics.processMemory) {
      memEl.textContent = `${data.systemMetrics.processMemory.rssMb} MB`;
    }
    if (healthMgrEl) {
      healthMgrEl.textContent = `${data.status} (Uptime: ${Math.round(data.uptimeSec/60)}m)`;
    }
    if (sqliteEl && data.services && data.services.database) {
      sqliteEl.textContent = `${data.services.database.status} (WAL Active)`;
    }
  } catch (e) {}
}

// Initial Call to load backups and health diagnostics on startup
setTimeout(() => {
  loadBackupsList();
  loadDailySummary();
  loadHealthDiagnostics();
}, 1200);
