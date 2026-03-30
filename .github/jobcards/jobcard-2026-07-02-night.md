# Jobcard: Production Hardening Pass

**Date**: 2026-07-02 (night)
**Agent**: GitHub Copilot (Claude Opus 4.6)

## Summary

Comprehensive production-hardening pass across all ZombieSweep UI scenes and supporting systems. Addressed edge cases around null keyboard access (touch-only devices), double-transition race conditions, GameState registry safety, DayManager out-of-range days, PauseMenu double-call protection, zombie type array overflow, and index.html resilience (clock + ticker).

## Phases Completed

1. **Exploration** — Read all 14+ scene/UI/system files, identified 16 vulnerability categories
2. **GameState hardening** — Added `getOrCreateGameState()` safe registry helper
3. **Keyboard hardening** — Replaced all `this.input.keyboard!` assertions with `?.` optional chaining across 8 scenes + PauseMenu
4. **Transition guards** — Added `transitioning` boolean flag to every scene to prevent double `fadeToScene` calls
5. **Scene cleanup** — Added `Phaser.Scenes.Events.SHUTDOWN` listeners to VehicleSelectScene, DifficultySelectScene, ScoreSummaryScene, GameOverScene
6. **DayManager hardening** — Added wrapping/fallback for out-of-range days in `getDayOfWeek()` and `getMapForDay()`
7. **PauseMenu hardening** — Early-return guards in `show()`/`hide()` to prevent physics race conditions
8. **Zombie type clamping** — `Math.min(types.length - 1, ...)` in GameScene zombie spawning
9. **index.html hardening** — Clock refactored from recursive setTimeout to setInterval; ticker rebuilt with DOM methods instead of innerHTML
10. **Tests** — Added 7 new test cases for `getOrCreateGameState` and DayManager out-of-range handling

## Files Changed

| File                                  | Changes                                                             |
| ------------------------------------- | ------------------------------------------------------------------- |
| `src/systems/GameState.ts`            | Added `getOrCreateGameState()` export                               |
| `src/systems/GameState.test.ts`       | +3 tests for `getOrCreateGameState`                                 |
| `src/systems/DayManager.ts`           | Wrapping fallbacks for out-of-range days                            |
| `src/systems/DayManager.test.ts`      | +4 tests for out-of-range days                                      |
| `src/scenes/GameScene.ts`             | 11 edits: keyboard guards, transition flag, zombie clamping         |
| `src/scenes/ScoreSummaryScene.ts`     | Safe GameState, keyboard guards, transition guard, SHUTDOWN cleanup |
| `src/scenes/GameOverScene.ts`         | Safe GameState, keyboard guards, transition guard, SHUTDOWN cleanup |
| `src/scenes/TrainingScene.ts`         | Safe GameState, keyboard guards, transition guard                   |
| `src/scenes/WelcomeScene.ts`          | Keyboard guards, transition guard                                   |
| `src/scenes/VehicleSelectScene.ts`    | Keyboard guards, transition guard, SHUTDOWN cleanup                 |
| `src/scenes/DifficultySelectScene.ts` | Safe GameState, keyboard guards, transition guard, SHUTDOWN cleanup |
| `src/ui/PauseMenu.ts`                 | Double show/hide protection, keyboard guards                        |
| `index.html`                          | Clock refactor (setInterval), ticker DOM-method construction        |

## Test Results

- **270 tests passing** across 17 test files
- **0 failures**
- **TypeScript compilation clean** (tsc --noEmit: no errors)

## Next Steps

- Manual browser testing on touch-only device (mobile/tablet) to verify keyboard-less flow
- Add integration tests for scene transitions if Phaser test harness is adopted
- Consider adding error boundaries around Phaser scene lifecycle hooks

## Recommendations

- Adopt a centralized scene-transition utility (e.g., `safeTransition(scene, target)`) to DRY up the `transitioning` flag pattern across all scenes
- Consider adding a linter rule to flag `this.input.keyboard!` non-null assertions

## Potential Enhancements

- Gamepad input support (some players use controllers)
- Touch gesture support for mobile play
- Centralized error logging for production diagnostics
