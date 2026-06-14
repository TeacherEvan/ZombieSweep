## Summary

Deepened ZombieSweep's combat authorship with clearer elite identities, route-triggered encounter beats, adaptive pickup rhythm, and HUD combat alerts. The route now feels more intentionally staged instead of relying only on generic escalating spawn pressure.

## Phases Completed

1. Added a dedicated combat authorship helper for elite profiles, route encounter definitions, surge variants, and contextual pickup drops.
2. Refactored `GameScene` to trigger named route encounters from subscriber progress and to use authored blood-rush surge variants.
3. Upgraded elite presentation with type-specific tuning, labels, and combat alerts.
4. Extended `HUD` with a combat alert strip and added tests for the new combat authorship rules.

## Files Changed

- `README.md`
- `.github/jobcards/jobcard-2026-04-05-night.md`
- `src/scenes/GameScene.ts`
- `src/scenes/combat-authorship.ts`
- `src/scenes/combat-authorship.test.ts`
- `src/ui/HUD.ts`
- `/home/ewaldt/.copilot/session-state/6970bd9e-0482-4a0b-aa1a-f936efc4be98/plan.md`

## Test Results

- `npm test`
- `npm run build`

## Next Steps

1. Build the planned browser versus mode on top of the now-stabler co-op/runtime foundation.
2. Continue extracting combat orchestration out of `GameScene` if boss encounters or longer-form set pieces are added.
3. Make intermission scenes multiplayer-aware once versus and fuller co-op flows need end-to-end session continuity.

## Recommendations

- Keep authored combat definitions in dedicated helpers so balance passes do not become `GameScene` rewrites.
- Reuse the HUD combat alert strip for future versus warnings, boss intros, and co-op role messaging.

## Potential Enhancements

- Boss-lite subscriber defense encounters with explicit clear rewards.
- Mouse-driven or icon-driven threat priority UX for the gunner.
- Encounter completion bonuses and richer combat-score breakdowns in the summary flow.
