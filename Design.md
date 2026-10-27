# Archive — Design Language

> The single source of truth for all visual decisions in Archive.  
> Every component must be implemented using these tokens — no hardcoded hex values, no one-off overrides.

---

## 0. Philosophy

Archive is a tool students reach for during stressful study sessions and placement prep. The design should feel:

- **Calm and organised** — lots of white space, clear hierarchy, no clutter.
- **Alive and responsive** — micro-animations acknowledge every interaction.
- **Expressive but not loud** — color is purposeful (coding meaning, not decoration).
- **Comfortable to stare at for hours** — four dark-mode themes, all tuned for contrast.

---

## 1. Themes

Archive exposes four themes via the `data-theme` attribute on `<html>`. Every CSS variable below is defined per-theme. Switching themes requires only changing this one attribute.

### 1.1 Theme — `light` (default)
```css
[data-theme="light"] {
  --paper:          #F6F5FB;   /* page background */
  --surface:        #FFFFFF;   /* card / sidebar background */
  --surface-raised: #FFFFFF;   /* elevated panels */
  --ink:            #181925;   /* primary text */
  --ink-soft:       #5B5C6C;   /* secondary text */
  --ink-faint:      #9394A5;   /* placeholder / metadata */
  --border:         #E7E5F3;
  --border-soft:    #EFEDF7;
}
```

### 1.2 Theme — `dark-grey`
```css
[data-theme="dark-grey"] {
  --paper:          #1C1D24;
  --surface:        #24252E;
  --surface-raised: #2B2C37;
  --ink:            #F1F1F6;
  --ink-soft:       #B6B7C6;
  --ink-faint:      #7C7D8D;
  --border:         #363744;
  --border-soft:    #2E2F3A;
}
```

### 1.3 Theme — `black` (OLED)
```css
[data-theme="black"] {
  --paper:          #000000;
  --surface:        #121212;
  --surface-raised: #191919;
  --ink:            #F5F5F5;
  --ink-soft:       #ABABAB;
  --ink-faint:      #707070;
  --border:         #282828;
  --border-soft:    #1E1E1E;
}
```

### 1.4 Theme — `dark-blue`
```css
[data-theme="dark-blue"] {
  --paper:          #0A1220;
  --surface:        #101B30;
  --surface-raised: #132038;
  --ink:            #EAF0FC;
  --ink-soft:       #A9B7D6;
  --ink-faint:      #6E7CA0;
  --border:         #1F2E4C;
  --border-soft:    #182541;
}
```

> **Rule:** All four themes define _all_ tokens below. Never leave a token undefined for a theme.

---

## 2. Color Palette — Accent Colors

Accents remain consistent in hue across themes but are lightened/desaturated for dark themes to maintain comfortable contrast. Each accent also has a **tint** (background) variant.

| Token | Light value | Role |
|---|---|---|
| `--primary` | `#6C5CE7` | Primary action, active state, brand |
| `--primary-ink` | `#FFFFFF` | Text on primary background |
| `--primary-tint` | `#EFEBFD` | Primary chip bg, active nav bg |
| `--blue` | `#4C8DFF` | Informational, Placement posts |
| `--blue-tint` | `#EAF1FF` | |
| `--teal` | `#00B39C` | Notes, Resource Share posts |
| `--teal-tint` | `#E3F7F4` | |
| `--coral` | `#FF6F4E` | Doubts, urgent countdowns |
| `--coral-tint` | `#FFEBE5` | |
| `--amber` | `#E8A400` | QA Problems, saved/bookmarked state |
| `--amber-tint` | `#FFF4DA` | |
| `--pink` | `#F0508C` | Lab manuals, Chemistry |
| `--pink-tint` | `#FDE8F0` | |

### Accent-to-meaning map

| Accent | Resource type | Post type | Subject |
|---|---|---|---|
| `--primary` (violet) | PYQ | — | Computer Science |
| `--teal` | Notes | Resource Share | Physics |
| `--coral` | DSA | Doubt | Mechanical |
| `--amber` | QA | QA Problem | Electrical |
| `--blue` | Placement Material | Placement Experience | Mathematics |
| `--pink` | Lab Manual | — | Chemistry |

---

## 3. Typography

### 3.1 Typefaces
| Family | Weight | Use case |
|---|---|---|
| **Space Grotesk** | 500, 600, 700 | Page titles, card titles, brand name |
| **Inter** | 400, 500, 600, 700 | Body text, labels, buttons, descriptions |
| **JetBrains Mono** | 500, 600 | File types, tags, dates, sizes, code |

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
```

### 3.2 Type scale
| Class | Font | Size | Weight | Use |
|---|---|---|---|---|
| `.display` / `h1` | Space Grotesk | 28–32px | 700 | Page-level headings |
| `h2` | Space Grotesk | 22px | 700 | Section headings |
| `h3` | Space Grotesk | 17px | 700 | Card titles, post titles |
| `.body` | Inter | 14px | 400 | General prose |
| `.body-sm` | Inter | 13px | 400 | Post bodies, descriptions |
| `.label` | Inter | 12–13px | 600 | Buttons, nav items, uploader names |
| `.caption` | Inter | 11–12px | 400–500 | Metadata, timestamps |
| `.mono` | JetBrains Mono | 11–12px | 500 | Tags, file types, dates |

```css
h1, h2, h3, .display { font-family: 'Space Grotesk', sans-serif; letter-spacing: -0.01em; }
.mono                 { font-family: 'JetBrains Mono', monospace; }
body                  { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
```

---

## 4. Spacing Scale

Use multiples of **4px** for all spacing. Named steps for consistency:

| Token | Value | Typical use |
|---|---|---|
| `--sp-1` | 4px | Icon gap, tight padding |
| `--sp-2` | 8px | Chip padding, icon-text gap |
| `--sp-3` | 12px | Card inner padding (compact) |
| `--sp-4` | 16px | Card padding, section gap |
| `--sp-5` | 20px | Section header margin |
| `--sp-6` | 24px | Layout column gap |
| `--sp-8` | 32px | Topbar / view padding |
| `--sp-10` | 40px | Large section spacing |

---

## 5. Border Radius

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 10px | Mini avatars, kind badges, tags |
| `--r-md` | 16px | Nav items, input fields, chips |
| `--r-lg` | 22px | Resource cards, post cards, search bar |
| `--r-xl` | 28px | Event detail panel, modal dialogs |
| `--r-full` | 9999px | Pills, segment controls |

---

## 6. Shadows

Shadows are theme-aware. Each theme redefines them with appropriate opacity.

| Token | Description |
|---|---|
| `--shadow-sm` | Default card resting state. Barely visible. |
| `--shadow-md` | Card hover state. Lifted feel. |
| `--shadow-lg` | Modal overlays, drawer panels. |

```css
/* Light theme reference */
--shadow-sm: 0 1px 2px rgba(24,25,37,0.04), 0 1px 1px rgba(24,25,37,0.03);
--shadow-md: 0 8px 24px rgba(24,25,37,0.08), 0 2px 6px rgba(24,25,37,0.04);
--shadow-lg: 0 20px 48px rgba(24,25,37,0.14);
```

---

## 7. Component Patterns

### 7.1 Resource Card (`.rcard`)
- Background: `--surface`, border `1px solid --border`, radius `--r-lg`.
- Left-edge **binder tab**: `6px` wide, radius `0 6px 6px 0`, color = subject accent.
- Top row: `kind-badge` (accent tint bg + accent text) + `filetype` (`.mono`).
- Title: `h3`-level, `font-weight: 700`.
- Footer: uploader mini-avatar + name · download count · bookmark count.
- Hover: `transform: translateY(-2px)` + `--shadow-md`.

### 7.2 Post Card (`.post`)
- Same surface/border/radius as rcard.
- Header: mini-avatar + name + `post-badge` (color-coded by type) + timestamp.
- `attach-chip`: dashed border, `--paper` bg, paperclip icon in `--primary`.
- Tags: `.mono`, `--paper` bg, `--border-soft` border.
- Actions row: upvote · reply · bookmark — in `--ink-faint`, hover to `--ink`.

### 7.3 Event Card (`.ecard`)
- Min-width `250px`, flex-shrink `0` (horizontally scrollable strip).
- `countdown` badge: coral tint + coral text.
- Save button: `30×30px`, radius `9px`; saved state → amber tint + amber bookmark icon (filled).
- Selected: `border-color: --primary` + `box-shadow: 0 0 0 3px --primary-tint`.

### 7.4 Timeline (`.timeline`)
- Each item: dot + vertical line + content column.
- Dot: `14px`, round, primary color; glow ring `0 0 0 4px --primary-tint`.
- Last item omits `tl-line`.
- Stage label: `.mono` or small caps, accent color.

### 7.5 Chips & Pills
- Default: `--surface` bg, `--border`, `--ink-soft` text, `--r-full`.
- Active (selected filter): `--ink` bg, `--paper` text.
- Subject chips include a color dot matching subject accent.

### 7.6 Buttons
| Class | Background | Text | Border |
|---|---|---|---|
| `.btn-primary` | `--primary` | `--primary-ink` | none |
| `.btn-ghost` | `--surface` | `--ink` | `1px solid --border` |
| `.icon-btn` | `--surface` | `--ink` | `1px solid --border` |

All buttons: `border-radius: --r-lg`, `font-weight: 600`, hover → `--shadow-md`, active → `transform: scale(0.97)`.

### 7.7 Sidebar
- Width: `236px`, sticky, full-height.
- Brand mark: three overlapping binder tabs (primary + teal + coral) at slight rotations.
- Nav items: `--r-md` radius, `padding: 11px 12px`, active → `--primary-tint` bg + `--primary` text.
- Theme picker in footer: swatch grid (four 34×34 swatches), active swatch outlined in `--primary`.
- Profile chip at very bottom: avatar gradient (primary → pink).

### 7.8 Composer
- Sits at top of Community feed.
- Textarea in `--paper` bg with `--border-soft` border.
- Post-type segment pills below — each type gets its own accent on selection.

### 7.9 Search Bar
- Full-width up to `480px` in topbar.
- `--surface` bg, `--border` border, `--r-lg` radius.
- Placeholder text in `--ink-faint`.

---

## 8. Motion & Animation

### 8.1 Principles
- All transitions use `ease` or `cubic-bezier(0.4, 0, 0.2, 1)` — never `linear`.
- Duration: `120ms` for micro (hover, button press) · `200–250ms` for state changes · `300ms` for layout shifts.
- Never animate layout-triggering properties (`width`, `height`) — use `transform` and `opacity`.

### 8.2 Standard transitions
| Element | Property | Duration |
|---|---|---|
| Cards (hover) | `transform`, `box-shadow` | `150ms ease` |
| Nav items | `background`, `color` | `150ms ease` |
| Theme switch (body) | `background`, `color` | `250ms ease` |
| Buttons (active) | `transform: scale(0.97)` | `120ms ease` |
| Swatch (active ring) | `border-color` | `150ms ease` |
| Event card (selected ring) | `box-shadow` | `150ms ease` |

### 8.3 Interaction states
- **Hover**: cards lift (translateY -2px + shadow-md), buttons gain shadow.
- **Active / press**: buttons scale to 0.97.
- **Focus visible**: `outline: 2px solid --primary`, offset `2px` — always present, never removed.
- **Loading**: skeleton shimmer using `--border-soft` → `--surface` gradient animation.

---

## 9. Layout Guidelines

### 9.1 App shell
```
[ Sidebar 236px ] [ Main: flex-1 ]
                     [ Topbar (sticky) ]
                     [ View content (scrollable) ]
```

### 9.2 View padding
- Side padding: `32px`.
- Top of content below topbar: `28px`.
- Bottom of content: `60px` (breathing room above fold).

### 9.3 Grid
- Resource grid: `repeat(auto-fill, minmax(266px, 1fr))`, gap `16px`.
- Community layout: `1fr 300px` (feed + right rail), gap `24px`.
- Below 980px: community collapses to single column, sidebar hides.

### 9.4 Content width
- Maximum comfortable reading line length: `~680px`.
- Right rail on Community: `300px` (cards with trending tags, active users).

---

## 10. Iconography

- All icons are **inline SVG** — no icon font, no external sprite.
- Stroke-based: `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`.
- Standard size: `17–19px` in nav / buttons · `13–15px` in post actions / card stats.
- Icons inherit color from their parent — never hardcode icon colors.

---

## 11. Do & Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use CSS custom properties exclusively | Hardcode hex values in components |
| Define all 4 theme variants for any new token | Add theme-only tokens that break others |
| Use Space Grotesk for headings | Use Inter for headings |
| Use JetBrains Mono for tags, timestamps | Use Inter for mono content |
| Animate `transform` & `opacity` | Animate `width`, `height`, `top`, `left` |
| Always include `focus-visible` styles | Remove outlines with `outline: none` without replacement |
| Color-code by meaning (accent map) | Use accent colors arbitrarily |
| Keep border radius consistent via tokens | Mix pixel values inline |

---

## 12. Accessibility Baseline

- Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text / UI components (WCAG AA).
- All interactive elements must be keyboard-reachable.
- `aria-label` on icon-only buttons.
- Meaningful `alt` on uploaded document thumbnails.
- Reduced-motion: wrap keyframe animations in `@media (prefers-reduced-motion: no-preference)`.

---

*Last updated: 2026-07-28*
