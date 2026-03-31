# In-Game HUD & Feedback Polish — Design Document

**Date:** 2026-03-31  
**Status:** Approved

---

## Overview

Polish the in-game HUD and player feedback systems in ZombieSweep. The broadcast news aesthetic is preserved; no sprite assets required — all changes use Phaser Graphics primitives and Text objects.

---

## Section 1: HUD Redesign

The HUD remains a 32px chrome strip at the top of the screen with Barlow Condensed font, red accent, and dirty-checked updates.

### Changes

1. **Split PAPERS and AMMO** into separate labeled fields with independent low-supply warnings (currently combined in one text field)
2. **Visual life indicators** — small Graphics-drawn icons (red circles or skulls) instead of "●●●" text dots; lost lives grey out with a brief death animation
3. **Delivery progress bar** — compact horizontal bar showing deliveries completed vs. total houses; fills green per successful delivery, marks red for missed houses
4. **Low-supply escalation** — extend existing dirty-check in `HUD.update()` with severity tiers:
   - Papers ≤ 3 or Ammo ≤ 2: warning (red color, moderate pulse)
   - Papers ≤ 1 or Ammo ≤ 1: critical (faster pulse, brighter red)

### Dropped

- ~~Weapon indicator~~ — too cluttered for the 32px strip

### New HUD API

- `setPaperCount(count: number)` — existing, unchanged
- `setAmmoCount(count: number)` — existing, unchanged
- `setDeliveryProgress(completed: number, total: number)` — new method, called from GameScene on delivery events

---

## Section 2: In-Game Feedback Polish

### New Feedback Effects

1. **Delivery feedback**
   - Successful delivery: green floating "+DELIVERED!" text + brief pulse on delivery progress bar
   - Missed delivery: red floating "MISS" text + subtle camera nudge (weaker than damage shake)

2. **Combo text**
   - Consecutive zombie kills within 2 seconds trigger escalating floating text
   - "2× COMBO!", "3× COMBO!", etc. in gold with increasing font size
   - Powered by `ComboTracker` module (see Section 3)

3. **Low supply warnings**
   - Papers ≤ 3 or Ammo ≤ 2: HUD field flashes red with increasing urgency
   - Pulse frequency increases as supply drops toward 0

4. **Pickup feedback**
   - Existing `collectEffect` retained
   - Add green floating "+5 PAPERS" or "+3 AMMO" text showing quantity gained

5. **Pause Menu confirmation**
   - "END TRANSMISSION" now requires confirmation
   - First press: button text changes to "ARE YOU SURE?" with confirm/cancel options
   - Prevents accidental game abandonment

---

## Section 3: Architecture & Testing

### File Changes

| File                               | Changes                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/ui/HUD.ts`                    | Split papers/ammo fields, Graphics-drawn life icons, delivery progress bar, low-supply escalation |
| `src/ui/PauseMenu.ts`              | Two-state confirmation flow for "END TRANSMISSION"                                                |
| `src/scenes/GameScene.ts`          | Wire delivery progress updates, integrate ComboTracker, add pickup quantity floating text         |
| `src/systems/ComboTracker.ts`      | **NEW** — Pure combo counter module                                                               |
| `src/systems/ComboTracker.test.ts` | **NEW** — Unit tests for combo logic                                                              |

### ComboTracker Module

**Location:** `src/systems/ComboTracker.ts`  
**No Phaser dependency** — pure timestamp math, fully unit-testable.

API:

- `registerKill(timestamp: number) → { comboCount: number; isCombo: boolean }` — records a kill and returns current combo state
- `resetCombo() → void` — clears combo counter
- Combo window: 2000ms between consecutive kills

### Testing Strategy

- **ComboTracker** — full TDD with co-located `.test.ts` file; test combo detection, timeout, reset, edge cases
- **HUD changes** — Phaser-dependent, browser-verified (no unit tests)
- **PauseMenu confirmation** — Phaser-dependent, browser-verified (no unit tests)
- **Existing tests** — unchanged; `animations.test.ts` and all other tests remain passing

---

## Constraints

- No new sprite assets — all visuals drawn with Phaser Graphics + Text
- Maintain broadcast news aesthetic (chrome, red accents, Barlow Condensed)
- Respect `prefersReducedMotion()` for all new animations
- Dirty-check pattern for all HUD updates (no per-frame setText calls)
- Keep GameScene lean — combo logic extracted to ComboTracker
