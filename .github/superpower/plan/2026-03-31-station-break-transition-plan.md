# Station Break Transition — Implementation Plan

**Goal:** Replace the simple camera fade in `fadeToScene()` with a branded "Station Break" broadcast wipe — red accent bar slide-in, WZMB 13 station ID hold, then scene switch — all within `src/utils/animations.ts`.

**Architecture:** Enhanced drop-in replacement of `fadeToScene()` using Phaser Graphics + Text overlays with a tween chain. No new files. No call-site changes.

**Tech Stack:** Phaser 3, TypeScript, Vitest

**Design Doc:** `.github/superpower/brainstorm/2026-03-31-station-break-transition-design.md`

---

## Task 1: Write failing test for Station Break timing config

**Step 1: Write the test**

- File: `src/utils/animations.test.ts` (new file)
- Code:

```typescript
import { describe, expect, it } from "vitest";
import { STATION_BREAK, prefersReducedMotion } from "./animations";

describe("animations", () => {
  describe("STATION_BREAK config", () => {
    it("should define wipe-in duration in ms", () => {
      expect(STATION_BREAK.WIPE_IN_MS).toBe(250);
    });

    it("should define hold duration in ms", () => {
      expect(STATION_BREAK.HOLD_MS).toBe(200);
    });

    it("should define overlay depth above all game content", () => {
      expect(STATION_BREAK.DEPTH).toBeGreaterThanOrEqual(999);
    });

    it("should define red accent bar height in px", () => {
      expect(STATION_BREAK.BAR_HEIGHT).toBe(6);
    });

    it("should define station ID text", () => {
      expect(STATION_BREAK.STATION_ID).toBe("WZMB 13");
    });
  });

  describe("prefersReducedMotion", () => {
    it("should return false when window is undefined (SSR/node)", () => {
      expect(prefersReducedMotion()).toBe(false);
    });
  });
});
```

**Step 2: Run test and verify failure**

- Command: `npm test -- animations.test.ts`
- Expected: FAIL — `STATION_BREAK` is not exported from `./animations`

---

## Task 2: Implement Station Break config constants

**Step 3: Add exported config to `src/utils/animations.ts`**

- Location: After the existing easing constants (line ~6), add:

```typescript
// ── Station Break Transition Config ──
// Timing and layout constants for the broadcast "Station Break" wipe.
export const STATION_BREAK = {
  WIPE_IN_MS: 250,
  HOLD_MS: 200,
  DEPTH: 999,
  BAR_HEIGHT: 6,
  STATION_ID: "WZMB 13",
} as const;
```

**Step 4: Run test and verify pass**

- Command: `npm test -- animations.test.ts`
- Expected:

```
PASS src/utils/animations.test.ts
  ✓ should define wipe-in duration in ms
  ✓ should define hold duration in ms
  ✓ should define overlay depth above all game content
  ✓ should define red accent bar height in px
  ✓ should define station ID text
  ✓ should return false when window is undefined (SSR/node)
```

---

## Task 3: Add broadcast-styles import

**Step 5: Add import to `src/utils/animations.ts`**

- Location: Line 1, after the Phaser import, add:

```typescript
import { BC, BROADCAST_FONT } from "../ui/broadcast-styles";
```

**Step 6: Run test to verify import doesn't break anything**

- Command: `npm test -- animations.test.ts`
- Expected: All tests still pass

---

## Task 4: Replace fadeToScene with Station Break animation

**Step 7: Replace the `fadeToScene` function body in `src/utils/animations.ts`**

- Replace the current `fadeToScene` function (the block starting at `export function fadeToScene(`) with:

```typescript
// ── Station Break Transition ──
// Broadcast-branded wipe: red accent bar slides in, WZMB 13 station ID holds,
// then scene.start() fires and the new scene's fadeIn() reveals content.
export function fadeToScene(
  scene: Phaser.Scene,
  targetScene: string,
  data?: object,
  _duration = 400,
): void {
  // Accessibility: instant cut when user prefers reduced motion
  if (prefersReducedMotion()) {
    scene.scene.start(targetScene, data);
    return;
  }

  const { width: cw, height: ch } = scene.cameras.main;
  const { WIPE_IN_MS, HOLD_MS, DEPTH, BAR_HEIGHT, STATION_ID } = STATION_BREAK;

  // ── Chrome background — full screen, fades in ──
  const bg = scene.add.graphics().setDepth(DEPTH).setAlpha(0);
  bg.fillStyle(BC.CHROME, 1);
  bg.fillRect(0, 0, cw, ch);

  // ── Red accent bar — full width, starts offscreen left ──
  const bar = scene.add.graphics().setDepth(DEPTH + 1);
  bar.fillStyle(BC.RED, 1);
  bar.fillRect(0, 0, cw, BAR_HEIGHT);
  bar.setPosition(-cw, ch / 2 - BAR_HEIGHT / 2);

  // ── Station ID text — centered below bar, starts hidden ──
  const stationText = scene.add
    .text(cw / 2, ch / 2 + 20, STATION_ID, {
      fontFamily: BROADCAST_FONT,
      fontSize: "28px",
      fontStyle: "800",
      color: BC.TEXT,
      letterSpacing: 4,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH + 2)
    .setAlpha(0);

  // Phase 1: Wipe in — chrome bg fades, bar slides, text appears
  scene.tweens.add({
    targets: bg,
    alpha: 1,
    duration: WIPE_IN_MS,
    ease: EASE_OUT_QUART,
  });

  scene.tweens.add({
    targets: bar,
    x: 0,
    duration: WIPE_IN_MS,
    ease: EASE_OUT_QUART,
  });

  scene.tweens.add({
    targets: stationText,
    alpha: 1,
    duration: WIPE_IN_MS,
    ease: EASE_OUT_QUART,
  });

  // Phase 2: Hold, then switch scene.
  // Phaser's scene.start() destroys the old scene and all its objects,
  // so the overlay auto-cleans. The new scene's fadeIn() provides the reveal.
  scene.time.delayedCall(WIPE_IN_MS + HOLD_MS, () => {
    scene.scene.start(targetScene, data);
  });
}
```

**Step 8: Run test suite**

- Command: `npm test`
- Expected: All tests pass (257 existing + 6 new animation tests = 263 total)

---

## Task 5: Verify build

**Step 9: TypeScript compile check**

- Command: `npx tsc --noEmit`
- Expected: Clean — no errors

**Step 10: Vite build**

- Command: `npm run build`
- Expected: Clean build output in `dist/`

---

## Task 6: Visual QA in browser

**Step 11: Run dev server and verify transitions**

- Command: `npm run dev`
- Checklist:
  - [ ] Welcome → VehicleSelect: red bar slides in, "WZMB 13" briefly visible, new scene fades in
  - [ ] VehicleSelect → DifficultySelect: same transition
  - [ ] DifficultySelect → GameScene: same transition
  - [ ] GameScene → TrainingScene (complete route): same transition
  - [ ] ScoreSummary → next day or GameOver: same transition
  - [ ] GameOver → WelcomeScene: same transition
  - [ ] PauseMenu → WelcomeScene (quit): same transition
  - [ ] No visual glitches, 1-frame gaps, or overlay remnants
  - [ ] Total transition feels ~700ms

---

## Task 7: Create jobcard

**Step 12: Write jobcard**

- File: `.github/jobcards/jobcard-2026-03-31-<timeOfDay>.md`
- Sections: Summary, Phases Completed, Files Changed, Test Results, Next Steps, Recommendations, Potential Enhancements

---

## Summary of Changes

| File                           | Action   | Description                                                                           |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------- |
| `src/utils/animations.ts`      | Modified | Import BC/BROADCAST_FONT, add `STATION_BREAK` config, replace `fadeToScene` internals |
| `src/utils/animations.test.ts` | New      | 6 tests for STATION_BREAK config + prefersReducedMotion                               |

**Zero call-site changes.** All 13 `fadeToScene()` calls across 8 files automatically get the new transition.

---

## Handoff

Execute with: **superpower-execute**
