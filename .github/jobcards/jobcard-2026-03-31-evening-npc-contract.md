# Jobcard — 2026-03-31 Evening NPC Contract

## Summary

Created the first milestone of the NPC town ecosystem plan on branch `feature/npc-town-ecosystem`. Added a shared NPC domain contract plus a reusable archetype catalog so civilians, hostiles, responders, traders, and infected characters can be represented through one normalized model instead of scene-specific logic.

## Phases Completed

- ✅ Phase 1 — Created feature branch for the NPC ecosystem work
- ✅ Phase 2 — Saved implementation plan to `.github/superpower/plan/`
- ✅ Phase 3 — Wrote failing contract/catalog test
- ✅ Phase 4 — Implemented shared `Npc` domain module
- ✅ Phase 5 — Implemented `NpcCatalog` with five families and archetypes
- ✅ Phase 6 — Verified targeted NPC catalog test
- ✅ Phase 7 — Ran the full test suite and production build

## Files Changed

- `.github/superpower/plan/2026-03-31-npc-town-ecosystem-plan.md` — saved the implementation plan used for execution
- `src/entities/NpcCatalog.test.ts` — failing-first test for the shared NPC contract and catalog
- `src/entities/Npc.ts` — shared NPC enums, interfaces, normalization helpers, and fallback definition
- `src/entities/NpcCatalog.ts` — initial catalog of five NPC families with multiple archetypes each

## Test Results

- Targeted test: `npm test -- src/entities/NpcCatalog.test.ts` — ✅ pass
- Full suite: `npm test` — ✅ pass (21 files, 303 tests)
- Production build: `npm run build` — ✅ pass

## Next Steps

- Implement Task 2: town reputation and shared behavior rules
- Add tests for reputation changes, faction reaction rules, and fallback state handling
- Keep the NPC logic pure so scene wiring can stay thin and testable

## Recommendations

- Continue using fail-first tests for each new NPC system slice
- Keep all scheduling, faction, and behavior rules outside Phaser scenes
- Prefer normalization over throwing when config or archetype data is incomplete

## Potential Enhancements

- Add lookup helpers for archetypes by faction, role, and trigger type
- Introduce NPC asset fallback keys into the boot scene when the runtime wiring starts
- Add a small scheduler preview test to validate that route generation and catalog selection stay deterministic
