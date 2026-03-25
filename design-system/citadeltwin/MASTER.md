# Design System Master File — CitadelTwin

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** CitadelTwin
**Updated:** 2026-03-17
**Category:** AEC (Architecture, Engineering, Construction)
**Style:** Skeuomorphism — realistic depth, tactile surfaces, embossed/debossed elements

---

## Design Philosophy

CitadelTwin uses a **skeuomorphic** design language inspired by architectural drafting tables and engineering instruments. Surfaces feel like real materials — brushed metal toolbars, paper-like content areas, physically raised buttons, debossed input wells. The aesthetic is professional, warm, and tactile — the opposite of flat/generic AI aesthetics.

**Key principles:**
- Every surface implies a material (paper, metal, wood, leather)
- Depth via multi-layer realistic shadows, not colored glows
- Light source from top-left (highlights on top/left edges, shadows on bottom/right)
- Restraint — effects serve function, not decoration

---

## Color Palette

### Light Mode (Drafting Paper)

| Role | HSL | Hex (approx) | Description |
|------|-----|--------------|-------------|
| Background | `40 20% 95%` | `#F3F1EC` | Warm off-white, drafting paper |
| Foreground | `215 25% 17%` | `#222D3A` | Deep slate ink |
| Card | `40 25% 98%` | `#FBF9F6` | Cream white surface |
| Primary | `215 20% 33%` | `#445264` | Industrial steel |
| Secondary | `40 15% 91%` | `#EAE7E1` | Brushed aluminium |
| Accent | `21 90% 48%` | `#E8600A` | Safety orange (AEC standard) |
| Muted | `40 12% 90%` | `#E6E3DE` | Soft warm grey |
| Border | `220 13% 81%` | `#C8CDD4` | Slate-300 |
| Destructive | `0 72% 51%` | `#DC2626` | Error red |

### Dark Mode (Walnut & Leather)

| Role | HSL | Hex (approx) | Description |
|------|-----|--------------|-------------|
| Background | `20 14% 10%` | `#1D1814` | Dark walnut |
| Foreground | `30 10% 88%` | `#E3DFDB` | Warm cream |
| Card | `20 12% 14%` | `#282220` | Dark wood panel |
| Primary | `30 10% 78%` | `#CCC6BF` | Warm light beige |
| Accent | `21 90% 52%` | `#EF6C0E` | Safety orange (brighter for dark) |
| Border | `20 8% 24%` | `#3F3A36` | Subtle warm border |

### Sidebar (Tool Cabinet)

Dark panel in both modes:
- Light: `220 16% 22%` — dark charcoal
- Dark: `20 14% 8%` — near-black walnut

---

## Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Headings | DM Sans | 600–700 | `tracking-tight`, clean geometric sans |
| Body | DM Sans / Inter | 400–500 | Excellent readability at 16px |
| Code/Data | JetBrains Mono | 400 | Monospace for technical values only |

**Google Fonts:**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
```

**Tailwind Config:**
```js
fontFamily: {
  sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
  heading: ['DM Sans', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
}
```

---

## Skeuomorphic Tokens

### Shadow System (Light mode shown; dark mode uses higher opacity)

| Token | Value | Usage |
|-------|-------|-------|
| `--skeuo-shadow-raised` | Inner highlight + 2-layer shadow | Buttons, interactive elements |
| `--skeuo-shadow-pressed` | Inset shadow | Active/pressed state |
| `--skeuo-shadow-card` | Inner highlight + 3-layer shadow | Cards, panels |
| `--skeuo-shadow-deep` | Inner highlight + deep stack | Hover state, modals |
| `--skeuo-shadow-inset` | Double inset shadow | Input wells, debossed areas |

### Surface Gradients

| Token | Usage |
|-------|-------|
| `--skeuo-surface-gradient` | Subtle top-to-bottom white fade on card surfaces |
| `--skeuo-toolbar-gradient` | Brushed metal effect for toolbars/headers |
| `--skeuo-button-gradient` | Physical button top-light effect |

### Texture

| Token | Usage |
|-------|-------|
| `--skeuo-grain` | SVG noise texture overlay on body (paper feel) |

---

## Component Specs

### Buttons (`.skeuo-button`)

```css
background: var(--skeuo-button-gradient);
border: 1px solid hsl(var(--border));
box-shadow: var(--skeuo-shadow-raised);
/* Hover: brightness(1.03) + deeper shadow */
/* Active: inset shadow + translateY(1px) */
/* Primary variant: orange gradient + white text */
```

### Cards (`.skeuo-card`)

```css
background: hsl(var(--card));
background-image: var(--skeuo-surface-gradient);
box-shadow: var(--skeuo-shadow-card);
border: 1px solid hsl(var(--border));
/* Hover: deep shadow + translateY(-1px) */
```

### Inputs (`.skeuo-input`)

```css
background: hsl(var(--input));
box-shadow: var(--skeuo-shadow-inset);  /* Debossed well */
/* Focus: orange ring (3px) + border color change */
```

### Toolbar (`.skeuo-toolbar`)

```css
background: var(--skeuo-toolbar-gradient);
box-shadow: inner white highlight + bottom shadow;
```

### Text Effects

| Class | Effect |
|-------|--------|
| `.skeuo-embossed` | White text-shadow below (raised text) |
| `.skeuo-engraved` | Dark text-shadow above (stamped text) |

### Drafting Grid (`.skeuo-drafting-grid`)

Subtle 24px grid lines — blueprint reference without being distracting.

---

## Anti-Patterns (Do NOT Use)

- **Colored glows** (cyan, magenta, neon) — use realistic shadows only
- **Gradient borders** with mask-composite tricks — use solid 1px borders
- **Monospace body text** — reserve for code/data only
- **Flat, shadowless cards** — every surface needs depth
- **AI purple/pink gradients** — signature of generic AI output
- **Text-shadow glows** on headings — use emboss/engrave effects instead
- **Grid pattern overlays** at high opacity — drafting grid should be <=3% opacity
- **Emojis as icons** — use Lucide React SVGs

---

## Pre-Delivery Checklist

- [ ] Surfaces have realistic depth (multi-layer shadows, not flat)
- [ ] Light source consistent (top-left: highlight top/left, shadow bottom/right)
- [ ] Buttons feel physical (raised idle, pressed active)
- [ ] Input fields feel debossed/inset
- [ ] No neon/glow effects remain
- [ ] DM Sans used for text, JetBrains Mono only for code
- [ ] Safety orange accent used sparingly (CTAs, active states, badges)
- [ ] Paper grain texture visible but subtle
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover transitions 150–200ms
- [ ] Focus states visible (orange ring)
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Dark mode tested separately (warm walnut palette, not just inverted)
