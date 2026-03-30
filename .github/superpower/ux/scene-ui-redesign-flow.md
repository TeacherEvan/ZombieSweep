# Flow Specification: Scene UI Broadcast Redesign

## Design System — Broadcast Visual Language

Before detailing each scene, here's the shared visual vocabulary that every scene MUST use to maintain broadcast continuity with the HTML wrapper.

### Typography

- **Primary**: Barlow Condensed 700/800 — all headlines, labels, data values
- **Secondary**: Barlow Condensed 600 — body text, descriptions, prompts
- **Italic accent**: Barlow Condensed 600 Italic — disclaimers, editorial text
- **NO Impact, NO Arial Black, NO Courier New** — these break the broadcast fiction
- Note: Barlow Condensed is already loaded via Google Fonts in index.html. Phaser text objects must use `fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif"`

### Color Palette (from wrapper CSS vars)

| Token          | Hex     | Usage                             |
| -------------- | ------- | --------------------------------- |
| bc-bg          | #070a10 | Scene backgrounds                 |
| bc-chrome      | #0e1118 | Panel backgrounds                 |
| bc-chrome-lit  | #161a24 | Hover/active panels               |
| bc-chrome-edge | #1e222e | Borders, dividers                 |
| bc-red         | #cc1100 | Station brand, accents, danger    |
| bc-red-glow    | #ff2a10 | Glow effects, emphasis            |
| bc-red-dim     | #6b0a00 | Background tints, muted red       |
| bc-gold        | #d4a828 | Score, rewards, success secondary |
| bc-gold-dim    | #7a6218 | Muted gold                        |
| bc-text        | #d8d0c4 | Primary text (warm off-white)     |
| bc-text-dim    | #6a645c | Secondary text                    |
| bc-text-muted  | #3a3630 | Tertiary text, hints              |
| alert-green    | #22aa44 | Victory, gains, Easy Street       |
| alert-amber    | #cc8822 | Caution, Middle Road              |

### Shared UI Components

#### Lower Third Chyron

The signature broadcast element. Used for titles and key info in every scene.

```
┌──────────────────────────────────────────────────────┐
│ ▌ LABEL TEXT                                         │  ← red left accent (4px)
│   Subtitle or description in lighter weight          │  ← chrome background
└──────────────────────────────────────────────────────┘
```

- Height: ~50-60px
- Background: bc-chrome with 90% opacity
- Left accent bar: 4px bc-red
- Label: Barlow Condensed 800, 18-22px, uppercase, bc-text, letter-spacing 0.08em
- Subtitle: Barlow Condensed 600, 12-13px, bc-text-dim, letter-spacing 0.12em

#### Data Row

For stats, scores, and information pairs.

```
LABEL ·············· VALUE
```

- Label: Barlow Condensed 600, 12px, bc-text-dim, uppercase, letter-spacing 0.16em
- Value: Barlow Condensed 800, 18-22px, bc-text or accent color
- Separator: dotted line or just spacing
- Left-aligned labels, right-aligned values

#### Broadcast Button

Menu actions styled as broadcast controls.

```
┌──────────────────────────────┐
│ ▌ BUTTON TEXT                │  ← red left accent on hover/selected
└──────────────────────────────┘
```

- Height: 44-52px
- Default: bc-chrome background, bc-chrome-edge border (1px)
- Hover/Selected: bc-chrome-lit background, bc-red left accent bar (3px), text goes bc-text
- Text: Barlow Condensed 700, 16-18px, uppercase, letter-spacing 0.1em
- No rounded corners (broadcast is angular)
- Transition: 150ms ease-out on background and border

#### Alert Banner

For important announcements (perfect day, subscriber changes, game over reason).

```
┌─────────────────────────────────────────────┐
│ bc-red background                           │
│   ALERT TEXT IN WHITE                       │
└─────────────────────────────────────────────┘
```

- Full-width or near-full-width
- Red background for critical, gold for positive, chrome for neutral
- Text: Barlow Condensed 800, white, letter-spacing 0.12em

---

## Scene Flows

### Flow 1: WelcomeScene — "Breaking News Intro"

**Entry Point**: Loading overlay fades out (channel-off animation)

**Layout** (960x540 canvas):

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [background: bc-bg with subtle noise/static texture]          │
│  [blood-red radial glow, upper-left biased — ASYMMETRIC]       │
│                                                                │
│  ┌─ CHYRON BAR (lower-third position, y ~60%) ───────────────┐│
│  │ ▌ ZOMBIESWEEP                                              ││
│  │   COURIER DISPATCH OPERATION — TRI-COUNTY ZONE             ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌─ MENU BLOCK (left-aligned, x ~8%, y ~72%) ────────────────┐│
│  │  ▌ NEW GAME                                                ││
│  │    CONTROLS                                                ││
│  │    CREDITS                                                 ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                │
│  [zombie silhouettes march across bottom with "LIVE FIELD CAM"]│
│                                                                │
│  v0.1.0 ─────────────────────────────── PRESS ENTER TO BEGIN  │
└────────────────────────────────────────────────────────────────┘
```

**Flow Steps**:

1. **Background renders**: bc-bg, radial glow (bc-red-dim, 0.3 alpha), noise texture dots
2. **Chyron slides in** from left (300ms, ease-out-quart):
   - Red left accent bar (4px)
   - "ZOMBIESWEEP" in Barlow Condensed 800, 42px, bc-red
   - Subtitle: "COURIER DISPATCH OPERATION — TRI-COUNTY ZONE" in 12px, bc-text-dim
3. **Menu items appear** staggered (200ms each, from left):
   - Selected item has red left accent bar + bc-text color
   - Unselected items: bc-text-dim color, no accent
   - Navigation: Up/Down/W/S, Enter/Space to confirm
4. **Zombie silhouettes march** across bottom (existing behavior, keep)
5. **"LIVE FIELD CAM" label** above zombie line — Barlow Condensed 600, 10px, bc-text-muted

**Exit Points**:

- NEW GAME → fadeToScene("VehicleSelectScene")
- CONTROLS → overlay (keep existing behavior, restyle with broadcast fonts)
- CREDITS → overlay (restyle)

---

### Flow 2: VehicleSelectScene — "Fleet Dispatch"

**Entry Point**: fadeIn from WelcomeScene

**Layout**:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─ CHYRON ──────────────────────────────────────────────────┐│
│  │ ▌ FLEET STATUS: AVAILABLE UNITS                           ││
│  │   SELECT DISPATCH VEHICLE                                 ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌── CARD 1 ──────┐┌── CARD 2 ──────┐┌── CARD 3 ──────┐     │
│  │ ▌ BICYCLE      ││ ▌ ROLLER BLADES││ ▌ SKATEBOARD    │     │
│  │                ││                ││                │     │
│  │ SPEED    ████░ ││ SPEED   █████░ ││ SPEED   ███░░ │     │
│  │ HANDLING ███░░ ││ HANDLING ██░░░ ││ HANDLING ████░ │     │
│  │ STABILITY████░ ││ STABILITY█░░░░ ││ STABILITY ██░░ │     │
│  │                ││                ││                │     │
│  │ ⚔ Baseball Bat ││ ⚔ Hockey Stick ││ ⚔ Machete      │     │
│  │ 🎯 Slingshot   ││ 🎯 Crossbow    ││ 🎯 Shotgun      │     │
│  └────────────────┘└────────────────┘└────────────────┘     │
│                                                                │
│  ← →  SELECT  ·  ENTER  CONFIRM ──────────────────────────── │
└────────────────────────────────────────────────────────────────┘
```

**Flow Steps**:

1. **Chyron slides in**: "FLEET STATUS: AVAILABLE UNITS"
2. **Vehicle cards** appear staggered (left to right):
   - Each card: bc-chrome background, 1px bc-chrome-edge border
   - Vehicle-colored left accent bar (4px): green/blue/gold
   - Name: Barlow Condensed 800, 20px
   - Stat bars: vehicle color fill on bc-chrome-edge track
   - Stat labels: Barlow Condensed 600, 10px, bc-text-dim, uppercase
   - Weapon lines: Barlow Condensed 600, 12px, bc-gold-dim
3. **Selected card**: bc-red border, name glows, slight scale-up (1.03x)
4. **Unselected cards**: dimmed (0.7 alpha), scale-down (0.97x)
5. **Confirm**: brief flash, "DISPATCHING..." text, fadeToScene

**Navigation**: Left/Right/A/D + Enter/Space

---

### Flow 3: DifficultySelectScene — "Threat Advisory"

**Entry Point**: fadeIn from VehicleSelectScene, receives `{ vehicle }` data

**Layout**:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─ CHYRON ──────────────────────────────────────────────────┐│
│  │ ▌ ZOMBIE THREAT ADVISORY                                  ││
│  │   WZMB 13 EMERGENCY BROADCAST SYSTEM                      ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌─ THREAT ROW 1 ────────────────────────────────────────────┐│
│  │▌▌ LOW        EASY STREET     1× Points · Low density      ││
│  └───────────────────────────────────────────────────────────┘│
│  ┌─ THREAT ROW 2 ────────────────────────────────────────────┐│
│  │▌▌ ELEVATED   MIDDLE ROAD     2× Points · Medium density   ││
│  └───────────────────────────────────────────────────────────┘│
│  ┌─ THREAT ROW 3 ────────────────────────────────────────────┐│
│  │▌▌ SEVERE     THE HARD WAY    3× Points · High density     ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ↑ ↓  SELECT  ·  ENTER  CONFIRM ──────────────────────────── │
└────────────────────────────────────────────────────────────────┘
```

**Flow Steps**:

1. **Chyron slides in**: "ZOMBIE THREAT ADVISORY"
2. **Threat rows** appear staggered (top to bottom):
   - Each row: full-width, bc-chrome background, 1px top/bottom border
   - Left color band: 6px, green/amber/red
   - Threat level label: Barlow Condensed 800, 14px, threat color, uppercase
   - Difficulty name: Barlow Condensed 800, 22px, bc-text
   - Description: Barlow Condensed 600, 12px, bc-text-dim
3. **Selected row**: bc-chrome-lit background, bc-red left highlight, text brightens
4. **Confirm**: row flashes, "ADVISORY CONFIRMED" text, initializes GameState, fadeToScene

---

### Flow 4: HUD — "Live Broadcast Overlay"

**Replaces**: Corner panel in GameScene/TrainingScene

**Layout** (overlaid during gameplay):

```
┌────────────────────────────────────────────────────────────────┐
│ ▌DAY 3 — WED │ SCORE 1,250 │ ❤❤❤ │ PAPERS 12 │ SUBS 8      │
└────────────────────────────────────────────────────────────────┘
```

OR horizontal top-strip style:

```
┌────────────────────────────────────────────────────────────────┐
│ ▌ DAY 3 — WED                                                │
│                                                    SCORE 1250 │
│   ●●● LIVES    PAPERS 12    SUBS 8                           │
└────────────────────────────────────────────────────────────────┘
```

**Design notes**:

- Semi-transparent bc-chrome background (55% opacity)
- Red left accent bar (3px, bc-red)
- Labels: Barlow Condensed 600, 10-11px, bc-text-dim, uppercase, letter-spacing 0.16em
- Values: Barlow Condensed 700, 14-16px, bc-text
- Score in bc-gold
- Lives as filled dots (●) in bc-red, not emoji hearts
- Score pulse: when score changes, value briefly scales to 1.1x and returns (150ms)
- Compact enough to not obstruct gameplay

---

### Flow 5: ScoreSummaryScene — "Day Report"

**Entry Point**: fadeIn from TrainingScene, receives `{ deliveryData }` data

**Layout**:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─ CHYRON ──────────────────────────────────────────────────┐│
│  │ ▌ DAY 3 REPORT                                            ││
│  │   ROUTE STATUS — MAPLE GROVE DISTRICT                     ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌─ ALERT BANNER (conditional) ──────────────────────────────┐│
│  │ ★ PERFECT DELIVERY — ALL SUBSCRIBERS REACHED               ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  DELIVERIES ·························· 8 / 10                  │
│  SUBSCRIBERS ························· 9                       │
│  ┌─ CHANGE ALERT ────────────────────────────────────────────┐│
│  │ +1 NEW SUBSCRIBER                                         ││
│  └───────────────────────────────────────────────────────────┘│
│  SCORE ······························· 1,250                   │
│  LIVES ······························· ●●●                     │
│                                                                │
│  ────────────────── PRESS ENTER TO CONTINUE COVERAGE ──────── │
└────────────────────────────────────────────────────────────────┘
```

**Flow Steps**:

1. **Chyron slides in** with day number and route name
2. **Alert banner** (if perfect day): green background, slides in from top
3. **Stat rows** appear staggered (200ms each):
   - Deliveries with color-coded ratio (green/amber/red)
   - Subscriber count
   - Change alerts: gains in green alert bar, losses in red alert bar
   - Score in bc-gold
   - Lives as dots
4. **Prompt**: "PRESS ENTER TO CONTINUE COVERAGE" or "PRESS ENTER FOR FINAL RESULTS"

---

### Flow 6: GameOverScene — "Broadcast Finale"

**Entry Point**: fadeIn from ScoreSummaryScene (or GameScene on death)

#### Victory Path — "Mission Complete"

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [background: bc-bg with subtle gold radial glow]              │
│                                                                │
│  ┌─ CHYRON ──────────────────────────────────────────────────┐│
│  │ ▌ SPECIAL REPORT                                          ││
│  │   COURIER SURVIVES FULL WEEK — OPERATION COMPLETE          ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  DAY REACHED ······················· 7                         │
│  SUBSCRIBERS ······················· 12                        │
│  LIFE BONUS ························ +450                      │
│                                                                │
│  ┌─ SCORE BOX ───────────────────────────────────────────────┐│
│  │        FINAL SCORE                                        ││
│  │          8,450                 (count-up animation)        ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ▌ PLAY AGAIN                                                  │
│    MAIN MENU                                                   │
└────────────────────────────────────────────────────────────────┘
```

#### Defeat Path — "Signal Lost"

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [background: brief static/noise burst → bc-bg]                │
│                                                                │
│  ┌─ ALERT BAR (full-width, bc-red bg) ───────────────────────┐│
│  │   SIGNAL LOST — COURIER DOWN                               ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  ┌─ REASON ──────────────────────────────────────────────────┐│
│  │   "All lives expended" or "All subscribers cancelled"      ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
│  DAY REACHED ······················· 4                         │
│  SUBSCRIBERS ······················· 3                         │
│                                                                │
│  FINAL SCORE ······················· 2,150                     │
│                                                                │
│  ▌ RE-ESTABLISH CONTACT (play again)                           │
│    MAIN MENU                                                   │
└────────────────────────────────────────────────────────────────┘
```

**Flow Steps**:

1. **Victory**: gold glow, chyron slides in as "SPECIAL REPORT", stats stagger in, score count-up
2. **Defeat**: brief static burst (200ms), red alert bar slams in, reason fades in, stats appear subdued
3. **Buttons**: broadcast-style text buttons with red accent on selection
4. **Score count-up**: Barlow Condensed 800, 52px, bc-gold (victory) or bc-text (defeat)

---

### Flow 7: PauseMenu — "Technical Difficulties"

**Entry Point**: ESC key during gameplay

**Layout**:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  [dark overlay 85% opacity]                                    │
│                                                                │
│  ┌─ CENTERED PANEL ──────────────────────────────────────────┐│
│  │ ▌ (red accent top bar, 3px)                                ││
│  │                                                            ││
│  │   PLEASE STAND BY                                          ││
│  │   TECHNICAL DIFFICULTIES                                   ││
│  │                                                            ││
│  │   ▌ RESUME BROADCAST                                       ││
│  │     END TRANSMISSION                                       ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Accessibility Requirements

### Keyboard Navigation

- All scenes fully navigable via keyboard (already implemented — maintain current patterns)
- Tab order follows visual order: top to bottom, left to right
- Visible focus indicator: bc-red left accent bar + text color change (no outline-only)
- Enter/Space activate selections
- ESC closes overlays (controls, credits, pause)
- Arrow keys + WASD for navigation (maintain dual binding)

### Screen Reader Support

- Phaser canvas is inherently not screen-reader accessible
- The HTML wrapper provides structural content (`role="status"`, `aria-live`)
- Game instructions available in plain text via Controls overlay
- Consider adding an `aria-live` region outside canvas that announces scene transitions

### Visual Accessibility

- Text contrast: bc-text (#d8d0c4) on bc-chrome (#0e1118) = 10.2:1 ratio (exceeds WCAG AAA)
- bc-text-dim (#6a645c) on bc-bg (#070a10) = 3.8:1 (passes WCAG AA for large text)
- Selected states use color + left accent bar (not color alone)
- Score colors (bc-gold, alert-green, bc-red) always paired with text labels
- Text sizes: minimum 12px for body, 10px for tertiary labels only

### Reduced Motion

- All tweens should respect `prefers-reduced-motion`:
  - Replace slide-in with instant appearance
  - Replace scale animations with opacity-only
  - Keep staggered timing (helpful for readability) but remove transform motion
- Check via: `matchMedia('(prefers-reduced-motion: reduce)').matches`

### Touch Targets

- All interactive buttons: minimum 44px height (already met)
- Vehicle cards: large touch targets (250px wide)
- Adequate spacing between menu items (current 72px gap is generous)

---

## Implementation Notes

### Font Loading

Barlow Condensed is already loaded in index.html. Phaser text objects should use:

```typescript
const BROADCAST_FONT = "'Barlow Condensed', 'Arial Narrow', sans-serif";
```

Consider creating a shared style constants module:

```typescript
// src/ui/broadcast-styles.ts
export const BC = {
  FONT: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  BG: 0x070a10,
  CHROME: 0x0e1118,
  CHROME_LIT: 0x161a24,
  CHROME_EDGE: 0x1e222e,
  RED: 0xcc1100,
  RED_GLOW: 0xff2a10,
  RED_DIM: 0x6b0a00,
  GOLD: 0xd4a828,
  GOLD_DIM: 0x7a6218,
  TEXT: "#d8d0c4",
  TEXT_DIM: "#6a645c",
  TEXT_MUTED: "#3a3630",
  GREEN: 0x22aa44,
  AMBER: 0xcc8822,
} as const;
```

### Chyron Helper

A reusable function for the lower-third chyron component:

```typescript
function createChyron(
  scene: Phaser.Scene,
  y: number,
  title: string,
  subtitle: string,
): Phaser.GameObjects.Container;
```

### Reduced Motion Check

```typescript
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
```

Use this to conditionally set tween durations to 0 or swap transform animations for opacity-only.

### Scene Transition Order

No changes to scene flow — only visual redesign:

```
Boot → Welcome → VehicleSelect → DifficultySelect → Game → Training → ScoreSummary → (next day or GameOver)
```
