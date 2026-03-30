# Station Break Transition — Design Document

## Overview

A single universal scene transition for ZombieSweep that replaces all current `fadeToScene()` camera fades with a branded "Station Break" effect inspired by modern news broadcast segment transitions.

## Visual Concept

A full-width red accent bar (`BC.RED`) slides in from the left edge, briefly revealing a centered "WZMB 13" station ID in Barlow Condensed against a `BC.CHROME` background. The bar holds briefly, then the new scene fades in as the transition completes.

## Aesthetic Direction

- **Modern news broadcast** — clean geometric motion, no CRT/VHS glitch effects
- **Branded** — WZMB 13 station ID visible mid-transition
- **Single universal transition** — same effect used everywhere for cohesion

## Animation Sequence

1. **Phase 1 — Wipe In (250ms):** Red accent bar slides in left→right on current scene. Chrome background fades in. "WZMB 13" text appears.
2. **Hold (200ms):** Station ID visible. At end of hold, `scene.start(targetScene)` fires — Phaser auto-destroys old scene and overlay objects.
3. **Phase 2 — Reveal (250ms):** New scene's `create()` calls `fadeIn()`, camera fades from black to reveal new content.

**Total perceived duration:** ~700ms

## Technical Architecture

- **No new files or scenes** — enhanced `fadeToScene()` in `src/utils/animations.ts`
- Draws overlay using current scene's `add.graphics()` and `add.text()` at depth 999+
- Tween chain drives the animation phases
- Phaser's `scene.start()` at midpoint auto-cleans overlay objects
- New scene's existing `fadeIn()` call provides the reveal
- `prefersReducedMotion()` → falls back to instant `scene.start()`

## Runtime-Drawn Components (No Assets)

| Element           | Type                   | Style                                  |
| ----------------- | ---------------------- | -------------------------------------- |
| Chrome background | `Graphics` filled rect | `BC.CHROME`, full screen               |
| Red accent bar    | `Graphics` filled rect | `BC.RED`, full width, ~6px tall        |
| Station ID text   | `Text`                 | "WZMB 13", Barlow Condensed, `BC.TEXT` |

## Integration Points

All existing `fadeToScene()` call sites across scenes remain unchanged — the function signature stays the same, only the internal animation changes:

- `WelcomeScene` → VehicleSelectScene
- `VehicleSelectScene` → DifficultySelectScene
- `DifficultySelectScene` → GameScene
- `GameScene` → TrainingScene
- `TrainingScene` → ScoreSummaryScene
- `ScoreSummaryScene` → GameScene / GameOverScene
- `GameOverScene` → WelcomeScene

## Accessibility

- Respects `prefers-reduced-motion` — instant scene switch, no animation
- No flashing or strobing effects
- Station ID text meets contrast requirements against chrome background

## Constraints

- 960×540 canvas, `Phaser.Scale.FIT`
- All visuals drawn with Phaser primitives — no image assets required
- Must work with existing `fadeIn()` calls in each scene's `create()`
