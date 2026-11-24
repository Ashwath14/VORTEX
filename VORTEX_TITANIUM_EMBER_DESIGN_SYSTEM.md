# VORTEX SPEED TITANIUM PRO — DESIGN SYSTEM SPECIFICATION
## Visual Identity: Titanium & Ember (v8.0)
**Permanent Visual Architecture for Windows Precision Engineering Software**

---

## 1. Executive Summary & Design Vision

The **Titanium & Ember** design system transforms Vortex Speed Titanium Pro into a high-precision Windows desktop engineering instrument. Rejecting generic AI templates, cyberpunk neon, and electric-blue gaming dashboards, the interface is anchored in **machined graphite surfaces, brushed titanium accents, and restrained burnt ember orange highlights**.

### The 70 / 20 / 10 Aesthetic Balance
* **70% Obsidian Graphite & Deep Charcoal (`#151719`, `#1B1E21`)**: Grounded, dark-mode technical foundation providing maximum contrast for dense telemetry data without visual fatigue.
* **20% Titanium Charcoal & Neutral Surfaces (`#202326`, `#292D31`, `#B9BEC4`)**: Elevated card bodies, subtle hairline dividers, tabular backgrounds, and structural framing.
* **10% Ember Orange & Brushed Copper (`#E58A48`, `#B9774E`)**: Strictly reserved for primary call-to-actions, active navigation states, key metric highlights, and live telemetry saturation.

---

## 2. Master Color Palette

### Primary Surface & Background Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--bg-obsidian` | `#151719` | Main viewport canvas, baseline foundation |
| `--bg-charcoal` | `#1B1E21` | Sidebar, top header, telemetry ticker background |
| `--bg-surface` | `#202326` | Primary dashboard card bodies, panel containers |
| `--bg-elevated` | `#292D31` | Interactive elements, elevated dialogs, modal headers |
| `--bg-hover` | `#32373C` | Hover state for elevated controls and cards |
| `--bg-input` | `rgba(255, 255, 255, 0.04)` | Form inputs, select dropdowns, search bars |

### Accent Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--accent-ember` | `#E58A48` | Primary accent, active tab, primary buttons, test start |
| `--accent-ember-hover` | `#EE985B` | Interactive hover for primary controls |
| `--accent-ember-dim` | `rgba(229, 138, 72, 0.12)` | Subtle badge backgrounds, highlight pill backdrops |
| `--accent-ember-glow` | `rgba(229, 138, 72, 0.28)` | Focus borders, active selection outlines |
| `--accent-copper` | `#B9774E` | Secondary accent, upload curves, metric secondary headers |
| `--accent-copper-dim` | `rgba(185, 119, 78, 0.14)` | Plan cap indicators, secondary badges |

### Typography Tokens
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--text-warm` | `#F1F0EC` | Primary body text, major numerical readings, headers |
| `--text-silver` | `#B9BEC4` | Secondary text, active column headers, verified badges |
| `--text-steel` | `#858D96` | Muted labels, units, timestamp indicators, table th |
| `--text-dim` | `#5C636B` | Technical metadata, secondary subtext, fine print |

### Structural Dividers & Borders
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--border-subtle` | `#383E43` | Dark Titanium panel boundaries, hairline card borders |
| `--border-medium` | `#454C53` | Interactive borders, input outlines, modal dividers |
| `--border-accent` | `rgba(229, 138, 72, 0.40)` | Focus states, active card indicators |

### Semantic Status Tokens
| Semantic Role | Hex Code | Visual Styling |
| :--- | :--- | :--- |
| **Success** | `#E2E4E8` / `#F1F0EC` | Soft silver text with neutral titanium badge & clear icon |
| **Warning** | `#E5A948` | Warm amber badge with `rgba(229, 169, 72, 0.12)` background |
| **Critical / Error** | `#CF6862` | Muted red badge with `rgba(207, 104, 98, 0.12)` background |
| **Information** | `#B9BEC4` | Cool neutral silver badge with subtle titanium frame |

---

## 3. Data Visualization Semantic Tokens

Every canvas chart adheres to an unambiguous semantic mapping:

| Metric | Line / Stroke Color | Area Fill / Gradient |
| :--- | :--- | :--- |
| **Download Throughput** | `#B9BEC4` (Titanium Silver) | `rgba(185, 190, 196, 0.12)` gradient |
| **Upload Throughput** | `#E58A48` (Ember Orange) | `rgba(229, 138, 72, 0.08)` gradient |
| **Latency / Ping** | `#D6C29E` (Warm Champagne) | None (Clean precision line) |
| **Jitter** | `#B9774E` (Brushed Copper) | None (Dashed precision line) |
| **Packet Loss** | `#CF6862` (Muted Red) | High-contrast vertical incident marker |
| **Statistical Baseline** | `#858D96` (Steel Grey) | `rgba(185, 190, 196, 0.10)` corridor |
| **ISP Plan Ceiling** | `#B9774E` (Brushed Copper) | 4px dashed threshold line |

---

## 4. Typography Hierarchy

* **Font Families**:
  * Primary Interface: `'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  * Numerical & Telemetry: `'Space Grotesk', 'JetBrains Mono', Consolas, monospace`
* **Hierarchy**:
  * Major Speedometer Reading: `3.8rem` (Space Grotesk, Bold 800, `#F1F0EC`)
  * Overview Live Throughput: `2.3rem` (Space Grotesk, Bold 800, `#B9BEC4` / `#E58A48`)
  * Panel Headers: `0.78rem` (Outfit, Bold 800, Letter-spacing `0.8px`, `#B9BEC4`)
  * Data Table Cells: `0.76rem` (Outfit, Regular 500, `#F1F0EC`)
  * Monospace Units / Meta: `0.65rem` - `0.72rem` (Space Grotesk, Medium 600, `#858D96`)

---

## 5. Industrial Surface Background Specification

The previous generic starfield and cyan dot matrix background is permanently replaced with a precision-machined technical background:
```css
body {
  background-color: #151719;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.016) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.016) 1px, transparent 1px),
    radial-gradient(ellipse at 50% 0%, rgba(229, 138, 72, 0.04) 0%, transparent 60%);
  background-size: 36px 36px, 36px 36px, 100% 100%;
}
```
* **Characteristics**:
  * 36px technical grid with 1.6% white opacity: invisible during normal glance, establishes clean technical grid structure.
  * Subtle 4% ember radial highlight anchored at top center: provides warm depth without distracting from telemetry.
  * Zero animated glowing particles, zero blurred neon circles.

---

## 6. Strict Design Rules & Guidelines

1. **NO Green Decorative Elements**: Green is forbidden as an interface accent, button glow, or decorative icon. Statuses use restrained soft silver (`#E2E4E8`) with clear iconography.
2. **NO Electric Blue or Cyan as Dominant Colors**: Electric cyan (`#00D9FF`) and neon blues (`#258BFF`) are eliminated in favor of Titanium Silver and Burnt Ember.
3. **NO Purple**: Replaced by Brushed Copper (`#B9774E`) and Graphite Steel (`#292D31`).
4. **NO Cartoon Avatars**: NOVA is styled as a machined titanium neural core (`⬡`), not a robot face with blinking eyes.
5. **No Visual Overlap**: All buttons, dropdowns, and cards use flex/grid layout with strict constraints (`max-width: 185px` on dropdowns, text-overflow ellipsis).
