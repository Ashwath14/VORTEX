const path = require('path');

const SETTINGS = {
  PORT: 49876,
  DB_PATH: path.join(__dirname, '..', 'vortex_v8.db'),
  USAGE_FILE: path.join(__dirname, '..', 'data_usage.json'),
  HISTORY_FILE: path.join(__dirname, '..', 'test_history.json'),
  TRACKERS_FILE: path.join(__dirname, '..', '..', 'trackers_list.txt'),
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  
  DEFAULT_PLAN_MBPS: 30.0,
  SUPPORTED_PLANS: [30, 100, 150, 300, 500, 1000],
  
  TELEMETRY_INTERVAL_MS: 1000,
  WIFI_SCAN_INTERVAL_MS: 6000,
  DEVICE_SWEEP_INTERVAL_MS: 12000,
  SOCKET_INSPECT_INTERVAL_MS: 3000,
  BLACKBOX_CHECK_INTERVAL_MS: 2500,
  
  PING_TARGETS: {
    GATEWAY: '192.168.29.1', // Dynamically updated by telemetry
    DNS: '1.1.1.1',
    EXTERNAL: 'cloudflare.com'
  }
};

module.exports = SETTINGS;
