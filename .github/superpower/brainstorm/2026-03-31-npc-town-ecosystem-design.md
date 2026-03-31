# NPC Town Ecosystem Design — 2026-03-31

## Summary

Design a systems-first NPC ecosystem for ZombieSweep that supports friendly, neutral, and hostile town characters alongside special infected behavior. The system should scale from reusable archetypes instead of relying on one-off scene logic, while staying aligned with the project’s conventions: interfaces, factory functions, pure-logic modules, and behavior-focused tests.

## Goals

- Add a full-town cast beyond the current thin `Citizen` and `Zombie` models
- Support mixed NPC roles: helper, ambient, trader, responder, defender, threat
- Enable advanced simulation without requiring bespoke logic for every NPC
- Keep state logic testable outside Phaser scenes
- Allow graceful fallback behavior when config, spawn rules, or art assets are incomplete

## Architecture

### Core Model

Use shared interfaces plus factory functions rather than classes.

Each NPC is described by layered data:

- **Faction**: `Survivor`, `HostileHuman`, `Responder`, `Trader`, `Infected`
- **Role**: `Civilian`, `Guard`, `Merchant`, `Scavenger`, `Medic`, `Raider`, etc.
- **BehaviorProfile**: decision rules and default state priorities
- **ScheduleProfile**: where and when the NPC should appear
- **SpawnProfile**: rarity, map fit, route triggers, and event gating

### Runtime Split

- **Pure logic modules** handle definitions, state evaluation, faction rules, scheduling, and spawn selection
- **Scene-side controllers** handle Phaser sprites, movement, collisions, animations, and interaction prompts

### Integration Strategy

The current `Citizen` and `Zombie` definitions should evolve into specialized NPC families rather than remain isolated gameplay silos. This allows town characters, hostile humans, and infected variants to share scheduling and behavior systems where appropriate.

## Behaviors and Data Flow

### Shared State Machine

NPCs operate on a common state model such as:

- `Idle`
- `Travel`
- `Interact`
- `Flee`
- `Defend`
- `Trade`
- `Investigate`
- `Infected`

### Decision Inputs

A shared evaluation tick should consider:

- nearby zombie pressure
- player proximity
- player reputation or collateral history
- route danger level
- current day / time slice
- faction rules
- local scripted events

### Example Reactions

- civilians flee, hide, or call for help
- defenders patrol or hold safe zones
- traders appear in safer route pockets and provide goods or information
- responders rescue, escort, or stabilize survivors
- hostile humans ambush, extort, or block alternate routes
- infected NPCs shift behavior under pressure and create surprise encounters

### Scene Flow

1. Day/map systems choose eligible NPC families
2. Spawn logic selects archetypes and placements
3. Controllers evaluate state changes over time
4. Scene systems apply movement, interactions, combat, and presentation

## Content Structure

### Initial Families

Start with five core NPC families:

1. Civilians
2. Defenders
3. Traders
4. Responders
5. Hostile Humans

Each family should ship with 2–3 archetypes in the first milestone.

### Suggested First Archetypes

- **Civilians**: porch watcher, panicked evacuee, barricade resident
- **Defenders**: neighborhood guard, rooftop shooter, checkpoint volunteer
- **Traders**: black-market mechanic, ammo runner, field medic vendor
- **Responders**: rescue scout, radio operator, triage worker
- **Hostile Humans**: raider, paranoid prepper, route extortionist

## Failure Handling and Fallbacks

- invalid spawn zone → skip spawn safely
- missing behavior profile → fall back to `Idle` or `Flee`
- missing texture key → use placeholder sprite
- missing schedule data → use emergency daytime default
- invalid faction-role combination → reject at factory level or normalize to safe defaults

## Testing Strategy

Focus tests on pure logic and player-facing outcomes:

- spawn scheduling by map/day/threat level
- faction reaction rules
- state transitions under danger or trust changes
- reputation effects from delivery success or collateral damage
- fallback behavior for missing or bad config
- archetype factory correctness

Phaser scenes remain integration-tested in-browser; scene tests should not become the primary safety net for NPC logic.

## Recommended File Shape

- `src/entities/` — shared NPC types, archetypes, and factories
- `src/systems/` — scheduling, reputation, state evaluation, faction logic
- `src/scenes/` — spawn orchestration and visual/controller wiring only

## Recommendation

Build the system as a **systems-first ecosystem** with reusable archetypes, then layer in authored named NPCs or event encounters later. This preserves scale, keeps tests practical, and avoids scene-level special-case sprawl.

## Out of Scope for This Design

- full authored story dialog trees
- cutscene system
- save/load persistence for long-term NPC memory
- handcrafted art production details for every archetype
