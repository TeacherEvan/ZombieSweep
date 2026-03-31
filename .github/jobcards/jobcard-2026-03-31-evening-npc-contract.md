# Jobcard — 2026-03-31 Evening NPC Contract

## Summary

Created the first milestone of the NPC town ecosystem plan on branch `feature/npc-town-ecosystem`. Added a shared NPC domain contract, a reusable archetype catalog, reputation rules, a deterministic scheduler, route-level NPC spawn output, legacy entity adapters, and safe NPC texture resolution so civilians, hostiles, responders, traders, and infected characters can be represented through one normalized model instead of scene-specific logic. Finished the final browser smoke check by driving the title screen into vehicle select, difficulty select, and the gameplay scene.

## Phases Completed

- ✅ Phase 1 — Created feature branch for the NPC ecosystem work
- ✅ Phase 2 — Saved implementation plan to `.github/superpower/plan/`
- ✅ Phase 3 — Wrote failing contract/catalog test
- ✅ Phase 4 — Implemented shared `Npc` domain module
- ✅ Phase 5 — Implemented `NpcCatalog` with five families and archetypes
- ✅ Phase 6 — Verified targeted NPC catalog test
- ✅ Phase 7 — Ran the full test suite and production build
- ✅ Phase 8 — Wrote reputation and NPC rules tests
- ✅ Phase 9 — Implemented `TownReputation` and `NpcRules`
- ✅ Phase 10 — Wrote scheduler tests
- ✅ Phase 11 — Implemented `NpcScheduler`
- ✅ Phase 12 — Verified targeted reputation/rules/scheduler tests
- ✅ Phase 13 — Re-ran the full test suite and production build
- ✅ Phase 14 — Wrote route NPC spawn tests
- ✅ Phase 15 — Implemented route-level NPC spawn generation in `MapGenerator`
- ✅ Phase 16 — Verified targeted route tests
- ✅ Phase 17 — Re-ran the full test suite and production build
- ✅ Phase 18 — Wrote legacy adapter and asset tests
- ✅ Phase 19 — Implemented citizen/zombie adapters and NPC asset resolver
- ✅ Phase 20 — Wired `BootScene` and `GameScene` to the NPC route plans
- ✅ Phase 21 — Verified targeted adapter/asset tests
- ✅ Phase 22 — Re-ran the full test suite and production build
- ✅ Phase 23 — Verified browser smoke check through the full scene launch flow

## Files Changed

- `.github/superpower/plan/2026-03-31-npc-town-ecosystem-plan.md` — saved the implementation plan used for execution
- `src/entities/NpcCatalog.test.ts` — failing-first test for the shared NPC contract and catalog
- `src/entities/Npc.ts` — shared NPC enums, interfaces, normalization helpers, and fallback definition
- `src/entities/NpcCatalog.ts` — initial catalog of five NPC families with multiple archetypes each
- `src/systems/TownReputation.test.ts` — reputation model tests for trust, collateral, and alertness
- `src/systems/NpcRules.test.ts` — faction and behavior transition tests
- `src/systems/TownReputation.ts` — pure reputation state and update helpers
- `src/systems/NpcRules.ts` — pure NPC state resolution rules
- `src/systems/NpcScheduler.test.ts` — scheduler tests for deterministic spawn planning
- `src/systems/NpcScheduler.ts` — deterministic scheduler and spawn-plan builder
- `src/maps/MapGenerator.test.ts` — route tests now covering `npcSpawns`
- `src/maps/MapGenerator.ts` — route generation now emits NPC spawn plans
- `src/systems/NpcAssets.test.ts` — texture fallback and legacy texture resolution tests
- `src/systems/NpcAssets.ts` — NPC texture fallback and legacy texture resolution helpers
- `src/entities/Citizen.test.ts` — citizen adapter assertions
- `src/entities/Citizen.ts` — citizen adapter to shared NPC definitions
- `src/entities/Zombie.test.ts` — zombie adapter assertions
- `src/entities/Zombie.ts` — zombie adapter to shared NPC definitions
- `src/scenes/BootScene.ts` — now creates the `npc-placeholder` texture
- `src/scenes/GameScene.ts` — now consumes route NPC spawn plans and resolves NPC textures safely

## Browser Smoke Check

- Title screen responds to `Enter` and advances to `VehicleSelectScene`
- Vehicle select responds to `Enter` and advances to `DifficultySelectScene`
- Difficulty select responds to `Enter` and advances to `GameScene`
- Gameplay scene renders successfully after the launch sequence

## Test Results

- Targeted test: `npm test -- src/entities/NpcCatalog.test.ts` — ✅ pass
- Targeted tests: `npm test -- src/systems/TownReputation.test.ts src/systems/NpcRules.test.ts` — ✅ pass
- Targeted test: `npm test -- src/systems/NpcScheduler.test.ts` — ✅ pass
- Targeted test: `npm test -- src/maps/MapGenerator.test.ts` — ✅ pass
- Targeted tests: `npm test -- src/entities/Citizen.test.ts src/entities/Zombie.test.ts src/systems/NpcAssets.test.ts` — ✅ pass
- Full suite: `npm test` — ✅ pass (25 files, 333 tests)
- Production build: `npm run build` — ✅ pass
- Browser smoke check: title → vehicle select → difficulty select → gameplay — ✅ pass

## Next Steps

- Keep the NPC logic pure so scene wiring can stay thin and testable
- Move on to any remaining balancing or polish now that the browser pass is clean

## Recommendations

- Continue using fail-first tests for each new NPC system slice
- Keep all scheduling, faction, and behavior rules outside Phaser scenes
- Prefer normalization over throwing when config or archetype data is incomplete

## Potential Enhancements

- Add lookup helpers for archetypes by faction, role, and trigger type
- Introduce NPC asset fallback keys into the boot scene when the runtime wiring starts
- Add a small scheduler preview test to validate that route generation and catalog selection stay deterministic
