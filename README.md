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

- Node.js 18+ recommended
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

## Deployment

The project is configured for Vercel deployment from the Vite `dist/` output.

## License

Add a license here if/when one is chosen for the project.
