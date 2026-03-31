# Jobcard: HUD & Feedback Polish

**Date**: 2026-03-31 (night)
**Agent**: GitHub Copilot (Claude Opus 4.6)

## Summary

Implemented the approved HUD & Feedback Polish design: split HUD fields, visual life icons, delivery progress bar, combo tracking system, low-supply escalation, delivery miss feedback, and PauseMenu quit confirmation.

## Phases Completed

1. **ComboTracker TDD** — New pure-logic module with 7 tests (red→green)
2. **Split Papers & Ammo** — Separated combined field into independent PAPERS and AMMO HUD fields
3. **Low-Supply Escalation** — Two-tier severity (warning + critical) for both papers and ammo with escalating pulse
4. **Visual Life Icons** — Replaced text dots with Graphics-drawn filled circles; grey-out + flash on life loss
5. **Delivery Progress Bar** — ROUTE section with proportional green fill bar + count text; pulses on delivery
6. **Combo + Feedback Integration** — ComboTracker wired into GameScene; combo floating text in gold; delivery miss feedback with "MISS" text + subtle shake
7. **PauseMenu Quit Confirmation** — Two-press flow: "END TRANSMISSION" → "ARE YOU SURE?" before quitting; resets on show/hide

## Files Changed

| File                               | Changes                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/systems/ComboTracker.ts`      | **NEW** — Pure combo counter: registerKill(timestamp), resetCombo(), 2s window             |
| `src/systems/ComboTracker.test.ts` | **NEW** — 7 tests: combo detection, timeout, boundary, reset                               |
| `src/ui/HUD.ts`                    | Split papers/ammo, Graphics life icons, delivery progress bar, low-supply escalation tiers |
| `src/ui/PauseMenu.ts`              | confirmingQuit two-state flow, label reset on show/hide                                    |
| `src/scenes/GameScene.ts`          | ComboTracker integration, awardZombieKill(x,y), delivery progress wiring, miss feedback    |

## Test Results

- **288 tests passing** across 19 test files (281 existing + 7 new)
- **0 failures**
- **TypeScript compilation clean** (tsc --noEmit: no errors)
- **Production build clean** (vite build: success)

## Next Steps

- Browser-test the updated HUD layout at various resolutions
- Verify delivery progress bar fills correctly during gameplay
- Test combo text visibility and positioning during fast combat

## Recommendations

- Consider adding a combo multiplier to score (currently visual-only)
- The delivery bar could show red segments for missed houses at end-of-route
- Low-supply warnings could be accompanied by a brief audio cue when audio is added

## Potential Enhancements

- Animated combo counter with streak timer visualization
- HUD layout responsive scaling for mobile viewports
- Score popup animations matching combo tier (bronze/silver/gold)
