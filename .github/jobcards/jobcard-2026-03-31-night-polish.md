# Jobcard — 2026-03-31 Night Polish Pass

## Summary

Meticulous final polish pass across the entire ZombieSweep UI surface, addressing color palette consistency, animation performance, interaction state gaps, and code quality.

## Phases Completed

1. **Color Palette Normalization** — Eliminated 7 off-palette hardcoded hex colors across 4 files, replacing them with centralized `BC.css.*` tokens. Added `GOLD_GLOW`, `GREEN_BRIGHT`, and `AMBER` CSS tokens to the broadcast palette.

2. **Animation Performance** — Replaced loading bar `width` animation (causes layout reflow) with `transform: translateX()` only for 60fps paint-free animation.

3. **Interaction State Polish** — Added ESC key dismiss + fade entrance animation to Controls/Credits overlays on WelcomeScene. Added `:focus-visible` style to fullscreen button for keyboard accessibility.

4. **Code Consistency** — Replaced hardcoded font family string in `floatingText()` with `BROADCAST_FONT` constant. Normalized `Back.easeOut` to `Quart.easeOut` in ScoreSummaryScene for consistent motion language.

5. **Test Coverage** — Updated broadcast-styles test to assert new `GOLD_GLOW` and `GREEN_BRIGHT` tokens.

## Files Changed

| File                              | Change                                                                      |
| --------------------------------- | --------------------------------------------------------------------------- |
| `src/ui/broadcast-styles.ts`      | Added `GOLD_GLOW`, `GREEN_BRIGHT`, `AMBER` CSS string tokens                |
| `src/ui/broadcast-styles.test.ts` | Added assertions for new CSS tokens                                         |
| `src/utils/animations.ts`         | `floatingText()` uses `BROADCAST_FONT` constant                             |
| `src/ui/HUD.ts`                   | Replaced `#ff2222` → `BC.css.RED_GLOW`, `#cc2222` → `BC.css.RED`            |
| `src/scenes/GameScene.ts`         | Added `BC` import; replaced 5 off-palette colors with tokens                |
| `src/scenes/TrainingScene.ts`     | Replaced 4 off-palette colors with `BC.css.*` tokens                        |
| `src/scenes/GameOverScene.ts`     | Replaced `#ffcc44` shadow with `BC.css.GOLD_GLOW`                           |
| `src/scenes/ScoreSummaryScene.ts` | Normalized `Back.easeOut` → `Quart.easeOut`                                 |
| `src/scenes/WelcomeScene.ts`      | ESC dismiss + fade entrance for Controls/Credits overlays                   |
| `index.html`                      | Transform-only loading bar animation; `:focus-visible` on fullscreen button |

## Test Results

- **281 tests passed** across 18 test files
- **TypeScript**: Clean compile, zero errors
- **No lint errors** in any modified file

## Next Steps

- Visual QA in browser at 960×540 and responsive breakpoints
- Verify overlay fade looks correct on WelcomeScene controls/credits
- Test fullscreen button focus ring with Tab key

## Recommendations

- Consider adding `BC.css.ORANGE` token if more vivid pickup colors are needed later
- The TrainingScene header still uses a manual text-shadow-via-offset technique (black text at +2px); could be replaced with proper Phaser text shadow for cleaner rendering
