// =========================================================================
// VORTEX SPEED TITANIUM PRO — VERSION & RELEASE METADATA MANIFEST
// =========================================================================

const VERSION_MANIFEST = {
  appName: 'Vortex Speed Titanium Pro',
  version: '8.1.0-PRO',
  build: '20261119.1',
  releaseDate: '2026-11-19',
  channel: 'Stable Production',
  dbSchemaVersion: 8,
  runtimeRequirements: {
    nodeMinVersion: 'v18.0.0',
    nodeRecommended: 'v24.22.1',
    edgeAppMode: true,
    os: 'Windows 10 / 11 (64-bit)'
  },
  releaseHighlights: [
    'Critical speed engine stabilization: 15-state observable diagnostic pipeline with zero DOM ReferenceErrors.',
    'Integrated Application Health & Recovery Manager with autonomous self-healing and anti-restart-loop safeguards.',
    'Hardened Local API security: loopback address enforcement, DNS rebinding prevention, and strict path traversal protection.',
    'Full SQLite Database Vault: verified manual & automated daily backups, restore preview, emergency rollback, and CSV/JSON export.',
    'Native Windows Command Palette (Ctrl+K) with instant fuzzy navigation and global keyboard shortcuts.',
    'Enhanced NOVA Evidence-Based Diagnostics with historical baseline comparison, upstream vs. local isolation, and confidence scoring.',
    'Autonomous notifications with quiet hours, rate-limiting, and daily executive network summaries.'
  ]
};

module.exports = VERSION_MANIFEST;
