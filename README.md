# ZombieSweep

ZombieSweep is a Paperboy-inspired 2D delivery game with zombie combat. Deliver newspapers along your route, fight off zombies with melee and ranged weapons, and progress through multiple in-game days as the difficulty ramps up.

## Features

- Paperboy-inspired delivery gameplay
- Zombie combat with melee and ranged weapons
- Crimsonland-style combat escalation with elite zombies and blood-rush surges
- Authored route encounters, adaptive pickups, and combat alert callouts
- Multiple vehicles with unique handling and loadouts
- Desktop-browser online co-op and asymmetric versus play
- Progressive map unlocks and day-based progression
- Training course, score summary, and game over flow
- Built with Phaser 3, TypeScript, and Vite
- Deployed with Vercel

## Tech Stack

- **Game framework:** Phaser 3
- **Language:** TypeScript
- **Build tool:** Vite
- **Testing:** Vitest
- **Deployment:** Vercel

## Project Structure

```text
src/
├── config/       # Game balance: difficulty, vehicles, constants
├── systems/      # GameState, ScoreManager, DayManager
├── entities/     # Zombie, Citizen, House, Hazard, Newspaper, Pickup
├── weapons/      # MeleeWeapon / RangedWeapon factories
├── maps/         # MapConfig, MapGenerator
├── network/      # Browser co-op protocol, session client, registry helpers
├── scenes/       # Boot → Welcome → VehicleSelect → DifficultySelect → Game → Training → ScoreSummary → GameOver
├── ui/           # HUD, PauseMenu
└── main.ts       # Phaser game entry point
```

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (required by Vite 8; Node 18 is unsupported)
- npm

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Run the co-op relay server

```bash
npm run multiplayer:server
```

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build the production bundle
- `npm run preview` — preview the production build locally
- `npm run multiplayer:server` — start the local WebSocket relay for desktop-browser co-op
- `npm test` — run the Vitest test suite once
- `npm run test:watch` — run tests in watch mode

## Gameplay Overview

The game follows a 7-day week with 3 lives, 20 houses per route, and 10 starting subscribers. Difficulty affects score multipliers, Sunday papers are heavier, and three vehicles unlock across the experience: Bicycle, RollerBlades, and Skateboard. Maps also unlock progressively: MapleGrove, DowntownDeadwood, and RustCreek.

A typical loop is:

1. Start at the Welcome screen
2. Select a vehicle
3. Choose a difficulty
4. Play the delivery route
5. Complete the training course
6. Review the score summary
7. Continue to the next day or reach Game Over

As the route heats up, subscriber progress can trigger named combat beats, elite variants telegraph more clearly, blood-rush surges use authored enemy mixes, and the HUD calls out major danger spikes instead of relying only on raw spawn pressure.

## Browser Multiplayer

ZombieSweep now supports desktop-browser multiplayer through the in-game relay console. The host acts as the **driver** and owns movement plus route progression. The second player can either join as a **gunner** in co-op or as a **rival** in versus mode.

To try it locally:

1. Run `npm run multiplayer:server`
2. Open the game in a desktop browser
3. Choose **ONLINE PLAY** from the welcome screen
4. Set the session mode to **CO-OP** or **VERSUS**
5. Enter the relay URL and host or join directly from the in-game relay console
6. Share the host room code with the second player and launch the route once both roles are linked

In co-op, the gunner can cycle targets with the keyboard and fire targeted ranged support while the driver keeps route ownership. In versus, the driver keeps their own score through delivery and survival while the rival competes by cashing in remote combat kills on the same route.

## Testing Notes

The repository uses Vitest for behavior-focused tests around pure-logic modules. Phaser scenes are intended for browser-based integration testing rather than unit tests.

## Performance

Hot-path optimizations in `GameScene` are documented in [docs/plans/.archive/2026-07-07-game-scene-hot-path-optimization.md](docs/plans/.archive/2026-07-07-game-scene-hot-path-optimization.md). Patterns applied without behavior change: cache the vehicle control profile once instead of per-frame, maintain an incremental delivery counter instead of re-filtering the deliveries array every frame/wave, and hoist repeated index reads out of conditional branches.

## 3D Scene-Replacement (Implemented, flag-gated)

> **Status:** Implemented, flag-gated (off by default), zero-regression. See [docs/plans/.archive/2026-07-07-3d-scene-bridge-design.md](docs/plans/.archive/2026-07-07-3d-scene-bridge-design.md).

A parallel Three.js renderer replaces selected 2D sprite groups (environment houses/ground,
combat effects) in-place. The 2D `GameScene` remains the canonical source of truth for
gameplay; the 3D layer is a per-frame projection of 2D state, gated behind the `render3d`
feature flag (off by default) for zero-regression rollout.

**Current state (2026-07-07):** the `render3d` flag is fully wired and ships three bridges
behind `VITE_RENDER3D=true`:
- **sync bridge** (Phase 0/1) — reprojection + matched ortho camera;
- **environment bridge** (Phase 2) — instanced houses + scrolling ground;
- **effects bridge** (Phase 3) — flying-projectile sprites, a pooled death-burst particle
  system (hard-capped at 200 live particles), and a combo point-light pulse.

**Cross-cutting (Phase 4, all done):**
- **P4.1 Unified depth sort** — every mesh is placed in a gameplay depth band via
  `renderOrder` + `depthZOffset`, with a parity test proving houses sit behind projectiles.
- **P4.2 Camera shake sync** — the live 2D Phaser camera-shake offset is fed into the 3D
  ortho camera each frame so the 3D view shakes in sync (no accumulation/drift).
- **P4.3 Graceful fallback** — flag OFF is a complete no-op; if WebGL is unavailable or the
  renderer fails to construct, `initRender3DLayer()` degrades to a 2D-only run via try/catch,
  leaving all 2D render objects untouched.
- **P4.5 Reduced-motion / low-power** — `prefers-reduced-motion` is read defensively and
  threaded into both bridges (fewer particles, no fog/shadows).

The 2D `GameScene` stays the source of truth; when the flag is OFF none of the 3D bridges
are created or synced (proven by tests). Vehicles and NPCs remain 2D in all cases.

## Deployment

The project is configured for Vercel deployment from the Vite `dist/` output.

## License

Add a license here if/when one is chosen for the project.
