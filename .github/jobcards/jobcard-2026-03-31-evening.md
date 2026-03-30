# Jobcard — 2026-03-31 Evening

## Summary

Implemented the "Station Break" broadcast transition in `src/utils/animations.ts`. Replaced the simple camera fade in `fadeToScene()` with a branded WZMB 13 wipe: red accent bar slides in left→right, chrome background fades up, "WZMB 13" station ID appears, holds briefly, then `scene.start()` fires and the new scene's `fadeIn()` reveals content. Zero call-site changes — all 13 `fadeToScene()` calls across 8 files automatically use the new transition.

## Phases Completed

| Phase | Description                                                            | Status |
| ----- | ---------------------------------------------------------------------- | ------ |
| 1     | Write failing tests for STATION_BREAK config + prefersReducedMotion    | ✅     |
| 2     | Add STATION_BREAK config constants to animations.ts                    | ✅     |
| 3     | Add broadcast-styles import (BC, BROADCAST_FONT)                       | ✅     |
| 4     | Replace fadeToScene internals with Station Break overlay + tween chain | ✅     |
| 5     | Run full test suite — 263 tests pass                                   | ✅     |
| 6     | Verify tsc + vite build — clean                                        | ✅     |

## Files Changed

| File                           | Action   | Description                                                                                    |
| ------------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `src/utils/animations.ts`      | Modified | Added BC/BROADCAST_FONT import, STATION_BREAK config, replaced fadeToScene with broadcast wipe |
| `src/utils/animations.test.ts` | New      | 6 tests: 5 for STATION_BREAK config values, 1 for prefersReducedMotion in Node                 |

## Test Results

- **263 tests passed** across 17 test files
- **0 failures**
- Build: `tsc && vite build` — clean success

## Design Documents

- Design: `.github/superpower/brainstorm/2026-03-31-station-break-transition-design.md`
- Plan: `.github/superpower/plan/2026-03-31-station-break-transition-plan.md`

## Next Steps

- Visual QA in browser (`npm run dev`) to verify transition timing, bar position, and text readability
- Tune timing values in STATION_BREAK config if transitions feel too fast/slow
- Consider adding a thin red line beneath the accent bar for extra polish

## Recommendations

- The STATION_BREAK config is exported and testable — timing can be tuned without touching animation logic
- The `_duration` parameter is kept for backward compatibility but ignored by the new implementation
- Future scenes should continue using `fadeToScene()` + `fadeIn()` — no special setup needed

## Potential Enhancements

- Add a subtle scan-line texture to the chrome background during the hold
- Animate the station ID text with a slight slide-up entrance
- Add a brief audio cue (broadcast tone) synchronized with the transition
- Consider a "BREAKING NEWS" variant for entering GameScene specifically
