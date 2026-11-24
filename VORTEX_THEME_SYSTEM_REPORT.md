# VORTEX SPEED TITANIUM PRO v8.0 // THEME SYSTEM REPORT
## THREE-MODE THEME ENGINE: OBSIDIAN DARK, EXECUTIVE LIGHT & WINDOWS SYSTEM SYNC

**Author**: Principal UI/UX & Frontend Architect  
**Design Language**: Obsidian Cyber Glassmorphism & Executive Pure Glass  
**Supported Modes**: Dark Mode (`dark`), Light Mode (`light`), System Default (`system`)  
**Status**: 100% Implemented & Verified  

---

### 1. Architectural Philosophy

Vortex Speed Titanium Pro v8.0 introduces an advanced **Three-Mode Theme Architecture** engineered to provide visual immersion during night operations and executive clarity in high-ambient lighting environments:

1. **Dark Mode (Obsidian Cyber Glassmorphism)**: Deep black and navy foundation (`#080A10`), neon cyan and violet luminescence, translucent acrylic surfaces, and futuristic instrument aesthetics.
2. **Light Mode (Executive Pure Glass)**: Pure frosted white and soft ice-blue foundation (`#F4F6FA` / `#FFFFFF`), deep navy typography (`#0F172A`), cobalt blue accents (`#2563EB`), and high-contrast tabular readouts.
3. **System Default Mode**: Seamless dynamic synchronization with Windows 11's Light/Dark mode personalization setting, responding instantaneously via `matchMedia('(prefers-color-scheme: dark)')`.

---

### 2. Dual-Palette Color Matrix

The entire frontend styling is driven by coordinated CSS custom properties (`:root`, `[data-theme="dark"]`, `[data-theme="light"]`), ensuring zero layout shift and 60 FPS transitions without page reloading:

| Token | Obsidian Dark Mode | Executive Light Mode | Functional Role |
| :--- | :--- | :--- | :--- |
| `--bg-obsidian` | `#080A10` | `#F4F6FA` | Core application backdrop |
| `--bg-surface` | `#10141F` | `#FFFFFF` | Primary modal and sidebar background |
| `--bg-card` | `rgba(16, 20, 33, 0.78)` | `rgba(255, 255, 255, 0.96)` | Glassmorphic card surface |
| `--bg-card-hover` | `rgba(22, 28, 46, 0.90)` | `rgba(243, 246, 252, 0.98)` | Interactive card hover state |
| `--bg-input` | `rgba(255, 255, 255, 0.04)` | `rgba(15, 23, 42, 0.05)` | Input field fills & toggles |
| `--border-subtle`| `rgba(255, 255, 255, 0.08)` | `rgba(15, 23, 42, 0.10)` | Card and table dividing lines |
| `--primary-blue` | `#258BFF` | `#2563EB` | Primary brand accent & active states |
| `--secondary-violet`| `#8855FF` | `#7C3AED` | Jitter & secondary data accents |
| `--cyan` | `#00D9FF` | `#0891B2` | Speedometer gauge & ping accents |
| `--text-pure` | `#FFFFFF` | `#0F172A` | High-contrast numbers and headers |
| `--text-main` | `#F1F5F9` | `#1E293B` | Body text & telemetry descriptions |
| `--text-muted` | `#94A3B8` | `#475569` | Secondary labels & sub-stats |
| `--text-slate` | `#64748B` | `#64748B` | Timestamp & neutral metadata |
| `--card-shadow` | `0 10px 30px rgba(0,0,0,0.45)` | `0 8px 24px rgba(15,23,42,0.08)` | Ambient glass elevation |

---

### 3. Implementation Details

#### A. DOM Theme Binding

Theme modes are applied to the top-level HTML root element via `data-theme`:
```html
<html lang="en" data-theme="dark">
```
CSS rules selectively adapt component surfaces based on this attribute:
```css
[data-theme="light"] .app-sidebar {
  background: rgba(255, 255, 255, 0.92);
  border-right: 1px solid var(--border-subtle);
}
[data-theme="light"] .panel-card,
[data-theme="light"] .gauge-card,
[data-theme="light"] .quad-box {
  background: var(--bg-card);
  box-shadow: var(--card-shadow);
}
```

#### B. JavaScript Theme Engine

The theme engine supports instantaneous switching and event-driven OS synchronization:
```javascript
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
}

// OS Light/Dark Preference Change Listener
if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const current = localStorage.getItem('vortex_theme_mode') || 'dark';
    if (current === 'system') applyTheme('system');
  });
}
```

#### C. Dual Control Points

1. **Top Persistent Header**: Users can switch modes directly from the top bar via the `#theme-select` dropdown (`🌑 Dark`, `☀️ Light`, `🖥️ System`).
2. **Settings & Personalization Centre**: Accessible under `Appearance & Theme Engine` (`#settings-theme-select`).
3. **Speedometer Accent Glow**: Users can customize the radial speed dial glow (`Electric Cyan`, `Deep Cobalt Blue`, `Royal Violet`, `Emerald Pulse`).

#### D. Multi-Tier Persistence

The selected mode persists across app restarts through two coordinated layers:
1. **Client Storage**: Fast synchronous hydration via `localStorage.getItem('vortex_theme_mode')`.
2. **SQLite Vault Storage**: Saved to `system_settings` table in `vortex_v8.db` via `POST /api/settings`.
