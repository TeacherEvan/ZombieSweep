# Jobcard — 2026-03-31 Afternoon

## Summary

Implemented the first major pass of the Paperboy-style gameplay fix. `GameScene` now uses difficulty-aware delivery thresholds, reactive house damage, active citizens, route momentum, and stronger day-based pressure so the delivery loop feels more arcade-driven without removing the zombie-combat identity.

## Phases Completed

| Phase | Description | Status |
| ----- | ----------- | ------ |
| 1 | Audit the live game loop and dormant delivery-related systems | ✅ |
| 2 | Add shared arcade-rule helpers for delivery, momentum, vehicle control, and spawn pacing | ✅ |
| 3 | Rebuild delivery handling around house difficulty and precision bands | ✅ |
| 4 | Activate citizens and property reactions in the live route | ✅ |
| 5 | Restore route momentum and scale zombie pressure over the week | ✅ |
| 6 | Rebalance vehicle feel through handling/stability usage and weapon tuning | ✅ |
| 7 | Add regression coverage for the new pure logic helpers | ✅ |
| 8 | Run full test suite and production build | ✅ |

## Files Changed

| File | Action | Description |
| ---- | ------ | ----------- |
| `src/scenes/GameScene.ts` | Modified | Delivery classification, citizen spawns, property damage, momentum, and spawn scaling |
| `src/scenes/arcade-rules.ts` | New | Shared arcade-rule helpers for delivery thresholds, scroll speed, control, and waves |
| `src/scenes/arcade-rules.test.ts` | New | Regression tests for the arcade-rule helpers |
| `src/config/vehicles.ts` | Modified | Rebalanced ranged weapon damage/ammo values |

## Test Results

- `npm test` — 295 tests passed
- `npm run build` — successful production build

## Next Steps

- Continue the remaining planned work on route layout polish, scoring pressure, and final verification of the updated delivery flow.
- Playtest the route pacing and citizen placement in-browser to tune spacing and delivery windows if needed.

## Recommendations

- Keep pushing scene-specific balancing through shared helpers like `arcade-rules.ts`; it makes the core feel easier to tune without scattering magic numbers.
- Preserve the Paperboy-like delivery pressure by keeping precision bands tight and route consequences visible.
- Treat vehicle handling/stability as part of the core loop, not just combat flavor.

## Potential Enhancements

- Add a small ollie/safety mechanic for the skateboard to make the vehicle identity even stronger.
- Expand citizen behavior so panicked runners move more aggressively and armed survivalists have a clearer counterplay pattern.
- Surface house damage and delivery precision more visibly in the HUD or summary scene.
