# ZombieSweep — Copilot Instructions

## Project Overview

ZombieSweep is a Paperboy-inspired 2D delivery game with zombie combat, built with **Phaser 3 + TypeScript + Vite**, deployed to **Vercel**. The player delivers newspapers along a route while fighting zombies with melee and ranged weapons.

## Tech Stack

- **Runtime**: Phaser 3 (v3.90.0) — 2D game framework with arcade physics
- **Language**: TypeScript (strict mode, ES2020 target)
- **Build**: Vite (v8.0.3) — `npm run build` → `dist/`
- **Test**: Vitest (v4.1.2) — `npm test` or `npm run test:watch`
- **Deploy**: Vercel — static `dist/` output, `base: './'`

## Architecture

```
src/
├── config/       # Game balance: difficulty, vehicles, constants
├── systems/      # GameState (singleton), ScoreManager, DayManager
├── entities/     # Zombie, Citizen, House, Hazard, Newspaper, Pickup
├── weapons/      # MeleeWeapon / RangedWeapon factories
├── maps/         # MapConfig, MapGenerator (route generation)
├── scenes/       # Phaser scenes: Boot → Welcome → VehicleSelect → DifficultySelect → Game → Training → ScoreSummary → GameOver
├── ui/           # HUD, PauseMenu
└── main.ts       # Phaser game config entry point
```

## Conventions

- **Factory functions** for entities: `createShambler()`, `createRanchHouse()`, etc.
- **Singleton GameState** passed via Phaser registry (`this.registry.get('gameState')`)
- **TDD discipline**: Every pure-logic module has a co-located `.test.ts` file
- **No classes for data objects**: Use interfaces + factory functions
- **Phaser scenes are NOT unit tested** — they are integration-tested in-browser
- **Discriminated unions** for polymorphic types (e.g., `Hazard` = `HoleHazard | LogHazard | IcePatchHazard`)

## Code Style

- Double quotes for strings (formatter default)
- Trailing commas in multi-line structures
- `as const` for constant config objects
- Enum values use PascalCase
- Test `describe()` blocks mirror module structure

## Key Game Rules

- 7-day week, 3 lives, 20 houses/route, 10 starting subscribers
- Difficulty multiplies scored points (1x/2x/3x)
- Sunday papers are heavier (0.6x throw speed)
- 3 vehicles (Bicycle/RollerBlades/Skateboard), each with unique melee + ranged weapon
- 3 maps unlock progressively: MapleGrove → DowntownDeadwood → RustCreek
- Route ends → Training course → Score summary → next day or Game Over

## Testing

- Run tests: `npm test` (vitest run) or `npm run test:watch`
- 182 tests across 15 test files — all pure-logic modules covered
- Tests should be **practical and behavior-focused**: test what the code does for the player, not just property values
- Use `beforeEach` for fresh state in stateful modules

## Build & Deploy

- Build: `npm run build` (runs `tsc && vite build`)
- Dev: `npm run dev` (Vite dev server)
- Deploy: Push to main → Vercel auto-deploys from `dist/`
- **npm note**: Use `--prefer-ipv4` flag if IPv6 times out on this machine

## Jobcard Protocol

After completing a large workload (multiple files, phases, or significant changes), agents MUST create or update a jobcard in `.github/jobcards/` following the format:

- Title: `jobcard-YYYY-MM-DD-<timeOfDay>.md`
- Sections: Summary, Phases Completed, Files Changed, Test Results, Next Steps, Recommendations, Potential Enhancements
