# NPC Town Ecosystem — Implementation Plan

**Goal:** build a systems-first NPC ecosystem for ZombieSweep with reusable factions, roles, schedules, and spawn planning so town life scales without scene-specific special cases.

**Source design:** `.github/superpower/brainstorm/2026-03-31-npc-town-ecosystem-design.md`

**Implementation approach:** keep the current Phaser scenes as runtime controllers, but move all NPC identity, behavior selection, scheduling, and spawn planning into pure TypeScript modules. Legacy `Citizen` and `Zombie` modules stay in place initially and become adapters over the shared NPC model.

---

## Task 1 — Shared NPC contract and archetype catalog

### Objective
Create the reusable domain model that can represent civilians, defenders, traders, responders, hostile humans, and infected NPCs.

### Files
- `src/entities/Npc.ts`
- `src/entities/NpcCatalog.ts`
- `src/entities/NpcCatalog.test.ts`

### Deliverables
- `NpcFaction`, `NpcRole`, `NpcState`
- `NpcBehaviorProfile`, `NpcScheduleProfile`, `NpcSpawnProfile`
- `NpcDefinition`
- `createNpcDefinition()`
- `normalizeNpcDefinition()`
- `getFallbackNpcDefinition()`
- initial catalog with at least five families and at least two archetypes per family
- safe defaults for missing or invalid input

### Acceptance criteria
- shared contract is pure TypeScript and scene-free
- invalid definitions normalize safely
- catalog exposes the initial family/archetype set
- tests pass without Phaser runtime involvement

---

## Task 2 — Town reputation and shared behavior rules

### Objective
Add the pure logic that evaluates danger, trust, and faction-driven behavior transitions.

### Files
- `src/systems/TownReputation.ts`
- `src/systems/NpcRules.ts`
- `src/systems/TownReputation.test.ts`
- `src/systems/NpcRules.test.ts`

### Deliverables
- reputation model with trust/collateral/alertness
- behavior evaluation based on faction, role, danger, reputation, and day/time slice
- fallback to `Idle` or `Flee` when profile data is missing

### Acceptance criteria
- delivery success improves trust
- collateral damage lowers trust
- civilians flee under pressure
- defenders hold or defend
- traders prefer safe zones
- responders investigate or rescue
- hostile humans ambush, extort, or block
- infected behavior resolves to `Infected`

---

## Task 3 — Scheduler and spawn planning

### Objective
Select eligible NPC archetypes deterministically from the day/map/threat context.

### Files
- `src/systems/NpcScheduler.ts`
- `src/systems/NpcScheduler.test.ts`

### Deliverables
- `NpcSpawnPlan`
- `NpcScheduleContext`
- deterministic selection helpers
- safe fallback behavior for invalid zones and missing schedule data

### Acceptance criteria
- same inputs produce the same spawn plan
- map/day/threat/reputation influence selection
- invalid spawn zones are skipped safely
- missing schedule data falls back to daytime defaults
- rarity rules are respected

---

## Task 4 — Route generation emits NPC spawn data

### Objective
Make route generation the source of truth for NPC placement hints.

### Files
- `src/maps/MapGenerator.ts`
- `src/maps/MapGenerator.test.ts`

### Deliverables
- extend `Route` with `npcSpawns`
- call the scheduler from `generateRoute()`
- keep houses/hazards/pickups deterministic and unchanged aside from the new NPC output

### Acceptance criteria
- route generation stays deterministic
- existing route outputs remain intact
- NPC plans are included in the returned route object

---

## Task 5 — Legacy entity adapters and scene wiring

### Objective
Keep the old `Citizen` and `Zombie` APIs working while introducing the shared NPC model into the runtime path.

### Files
- `src/entities/Citizen.ts`
- `src/entities/Zombie.ts`
- `src/systems/NpcAssets.ts`
- `src/scenes/BootScene.ts`
- `src/scenes/GameScene.ts`
- `src/entities/Citizen.test.ts`
- `src/entities/Zombie.test.ts`
- `src/systems/NpcAssets.test.ts`

### Deliverables
- adapter helpers from legacy entities to shared NPC families/roles/states
- placeholder texture support for missing art
- `GameScene` consumes spawn plans instead of hardcoding families

### Acceptance criteria
- legacy factories still work
- missing texture keys fall back safely
- Phaser logic remains in scenes while selection logic stays in systems

---

## Verification order

1. Write failing tests
2. Implement the smallest safe code change
3. Re-run the targeted tests
4. Run the full test suite
5. Run `npm run build`
6. Do a browser smoke check if a scene/runtime file changed

---

## Out of scope

- full dialogue trees
- save/load persistence for NPC memory
- cutscenes
- bespoke final art for each archetype

---

## Milestone summary

The first milestone is complete when the shared NPC contract exists, the archetype catalog is populated, and the pure logic layer can represent and validate NPCs without scene code.
