# ZombieSweep — Game Design Document

## Overview

A Paperboy (1985) inspired 2D arcade game set in a post-apocalyptic suburban America where zombies are a fact of life. The player is a zombie exterminator who delivers newspapers by bicycle/roller blades/skateboard while killing zombies along the route. Oblique projection view, vector hand-drawn art style, deployed on Vercel.

---

## 1. Tech Stack

| Layer     | Choice                     | Rationale                                                                             |
| --------- | -------------------------- | ------------------------------------------------------------------------------------- |
| Engine    | **Phaser 3**               | Best-in-class 2D web game framework, oblique/isometric support, huge plugin ecosystem |
| Language  | **TypeScript**             | Type safety for complex game state, better refactoring                                |
| Build     | **Vite**                   | Fast HMR, native TS support, clean Vercel integration                                 |
| Deploy    | **Vercel**                 | Static export, zero-config, instant deploys                                           |
| Art Style | **Vector hand-drawn**      | Distinct indie look, scales well, lightweight assets                                  |
| Audio     | **Howler.js** (via Phaser) | Cross-browser audio, sprite sheet support                                             |

---

## 2. Game Flow

```
Welcome Screen
  → Vehicle Select (Bicycle / Roller Blades / Skateboard)
    → Difficulty Select (Easy Street / Middle Road / Hard Way)
      → Day 1 (Monday)
        → Delivery Route (20 houses, 10 subscribers)
          → Training Course (targets, ramps, jumps)
            → Score Summary (subscriptions gained/lost)
              → Day 2 (Tuesday) ... through Day 7 (Sunday)
                → Final Score / Game Over
```

**Game ends when:** all lives lost, all subscriptions cancelled, or Sunday training course completed.

---

## 3. Difficulty Settings

| Setting     | Point Multiplier | Zombie Density | Obstacle Frequency |
| ----------- | ---------------- | -------------- | ------------------ |
| Easy Street | 1x               | Low            | Low                |
| Middle Road | 2x               | Medium         | Medium             |
| Hard Way    | 3x               | High           | High               |

---

## 4. Vehicles & Weapons

Every vehicle carries **newspapers** (delivery item, unlimited throwing for deliveries, limited combat supply) plus **2 unique combat weapons** (1 melee, 1 ranged).

### Bicycle

| Attribute     | Value                                                                 |
| ------------- | --------------------------------------------------------------------- |
| Speed         | Medium                                                                |
| Handling      | Good — smooth turning                                                 |
| Stability     | High — hard to knock off                                              |
| Melee Weapon  | **Baseball Bat** — wide swing arc, moderate damage, good knockback    |
| Ranged Weapon | **Slingshot** — fast projectile, low damage, unlimited rocks (pickup) |
| Playstyle     | Balanced all-rounder, best for beginners                              |

### Roller Blades

| Attribute     | Value                                                                     |
| ------------- | ------------------------------------------------------------------------- |
| Speed         | Fast                                                                      |
| Handling      | Slippery — momentum-based, drift on turns                                 |
| Stability     | Low — easier to trip on hazards                                           |
| Melee Weapon  | **Hockey Stick** — fast swing, moderate damage, can deflect projectiles   |
| Ranged Weapon | **Crossbow** — slow reload, high damage, pierces through multiple zombies |
| Playstyle     | High-risk glass cannon, rewards skilled play                              |

### Skateboard

| Attribute     | Value                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Speed         | Variable — kick to accelerate, coasts to slow                                          |
| Handling      | Tight — quick direction changes                                                        |
| Stability     | Medium — can ollie over small hazards                                                  |
| Melee Weapon  | **Machete** — short range, high damage, fast attack speed                              |
| Ranged Weapon | **Shotgun** — spread shot, devastating at close range, very limited ammo (pickup only) |
| Playstyle     | Aggressive close-combat, trick-based evasion                                           |

### Newspaper Mechanics

- **Delivery:** Thrown at houses — must land on porch or in mailbox for successful delivery
- **Combat:** Can stun zombies briefly (low damage), newspapers used for combat deplete delivery supply
- **Resupply:** Newspaper bundles on the ground replenish stock
- **Sunday papers** are heavier → slower throw arc, more stun damage

---

## 5. Maps (3 Themed Neighborhoods)

Each map has 20 houses (10 subscribers at start). Maps rotate across the 7-day week.

### Map 1: Maple Grove (Suburban)

- **Theme:** Classic American suburbia — white picket fences, green lawns, mailboxes
- **Days:** Monday, Tuesday
- **Zombie Density:** Low
- **Hazard Density:** Low
- **Unique Feature:** Wide streets, clear sightlines, forgiving layout
- **Vibe:** Tutorial-friendly, easing player into mechanics

### Map 2: Downtown Deadwood (Urban)

- **Theme:** Small-town Main Street — shops, apartments above storefronts, parked cars, alleys
- **Days:** Wednesday, Thursday, Friday
- **Zombie Density:** Medium
- **Hazard Density:** Medium
- **Unique Feature:** Narrow streets, parked cars as cover/obstacles, alley shortcuts
- **Vibe:** Tighter navigation, more tactical combat

### Map 3: Rust Creek Industrial (Industrial/Rural)

- **Theme:** Abandoned warehouses, overgrown lots, rusted fences, trailer parks
- **Days:** Saturday, Sunday
- **Zombie Density:** High
- **Hazard Density:** High
- **Unique Feature:** Open but cluttered terrain, longer distances between houses, ambush zones
- **Vibe:** Endgame gauntlet, survival pressure

---

## 6. Houses (3 Types)

Houses are either **subscribers** (bright colors, decorated) or **non-subscribers** (dark, run-down).

### Ranch House

- **Look:** Single-story, wide porch, ground-level mailbox
- **Delivery Target:** Large porch (easy) or mailbox (bonus points)
- **Damage Points:** Windows (2), garden gnomes (1), fence (1)
- **Spawn Near:** Sidewalk zombies, skateboarders

### Colonial House

- **Look:** Two-story, picket fence, mailbox at sidewalk edge
- **Delivery Target:** Porch (medium difficulty — fence in the way) or mailbox (easy)
- **Damage Points:** Upper windows (3), lower windows (2), porch furniture (1)
- **Spawn Near:** Tire hazards, citizen NPCs

### Victorian House

- **Look:** Ornate, wrap-around porch, elevated mailbox on post
- **Delivery Target:** Narrow porch opening (hard) or elevated mailbox (medium)
- **Damage Points:** Stained glass (5), tombstones in yard (2), porch railing (1)
- **Spawn Near:** Multiple zombie types, fire hazards

---

## 7. Citizens (3 Types)

Citizens are NPCs on the route. They are NOT targets — hitting them with weapons has penalties.

### Friendly Neighbor

- **Behavior:** Stands on porch or lawn waving. Stays put.
- **Interaction:** If player delivers successfully, cheers and tosses a small health/ammo pickup
- **Threat Level:** None
- **Penalty if Hit:** -50 points, neighbor becomes non-subscriber next day

### Panicked Runner

- **Behavior:** Runs across the street randomly when zombies are near
- **Interaction:** Unpredictable pathing — acts as a moving obstacle
- **Threat Level:** Indirect — can cause player to swerve into hazards
- **Penalty if Hit:** -100 points, triggers more zombie spawns (attracted by screaming)

### Armed Survivalist

- **Behavior:** Stands in yard with weapon, shoots at nearby zombies
- **Interaction:** Friendly fire risk — their bullets can hit the player if in the crossfire
- **Threat Level:** Low-medium (accidental damage)
- **Penalty if Hit:** -25 points (they're tough), survivalist retaliates with 1 shot at player

---

## 8. Zombies (3 Types)

All zombies have a **detection radius** — they aggro when the player enters range.

### Shambler

- **Speed:** Slow (50% of bicycle speed)
- **HP:** Low (1 newspaper hit = stun, 2 melee hits = kill, 1 ranged hit = kill)
- **Attack:** Lunge grab — must be adjacent, deals 1 damage
- **Behavior:** Wanders aimlessly, beelines when aggro'd
- **Spawn:** Everywhere, most common
- **Points:** 10 base

### Runner

- **Speed:** Fast (matches roller blade speed)
- **HP:** Medium (2 newspaper hits = stun, 3 melee hits = kill, 2 ranged hits = kill)
- **Attack:** Tackle — charges in a straight line, deals 2 damage, knockback
- **Behavior:** Sprints directly at player, can be dodged (they overshoot)
- **Spawn:** Streets and alleys, more common from Day 3+
- **Points:** 25 base

### Spitter

- **Speed:** Slow (doesn't chase)
- **HP:** Medium (same as Runner)
- **Attack:** Acid spit — ranged projectile, 2 damage, leaves damage puddle on ground for 3 seconds
- **Behavior:** Stays at range, retreats if player gets close
- **Spawn:** Rooftops, yards, behind fences — more common from Day 5+
- **Points:** 40 base

---

## 9. Hazards (3 Types)

Static obstacles on the route. Crashing costs 1 life on delivery route (instant on training course).

### Hole in the Ground

- **Visual:** Cracked asphalt with dark pit, caution tape remnants
- **Size:** Medium (2x2 tiles)
- **Avoidance:** Steer around, or **Skateboard can ollie over** small ones
- **Frequency:** All maps, increases with difficulty
- **Training Course:** Appears as ditches to jump over via ramps

### Log Across the Road

- **Visual:** Fallen tree trunk blocking part of the road
- **Size:** Long horizontal barrier (spans ~60% of road width)
- **Avoidance:** Find the gap, or use a ramp to jump. **Cannot be destroyed.**
- **Frequency:** Map 2 and 3, increases with difficulty
- **Training Course:** Appears as walls to jump over

### Ice Patch

- **Visual:** Glistening blue-white slick on road surface
- **Size:** Large area (3x3 tiles)
- **Avoidance:** Steer around. If hit: player slides uncontrollably for 1.5 seconds (direction of momentum)
- **Special:** Does NOT cost a life directly, but sliding into another hazard/zombie does
- **Frequency:** All maps, more common on later days (gets colder toward Sunday)
- **Training Course:** Appears as slick ramps for style points

---

## 10. Scoring System

| Action                       | Points (Easy 1x) |
| ---------------------------- | ---------------- |
| Successful porch delivery    | 250              |
| Mailbox delivery (bonus)     | 500              |
| Shambler kill                | 10               |
| Runner kill                  | 25               |
| Spitter kill                 | 40               |
| Non-subscriber window break  | 25               |
| Non-subscriber tombstone     | 15               |
| Training target hit          | 50               |
| Training ramp jump           | 100              |
| Perfect day (all deliveries) | 1,000 bonus      |
| Remaining lives (end game)   | 5,000 each       |

**Subscription Rules:**

- Missed delivery → subscriber cancels
- House damaged by player → subscriber cancels
- All deliveries made → gain 1 subscriber (max 10)
- 0 subscribers → game over

---

## 11. Welcome Screen

- **Game title:** "ZombieSweep" with animated zombie hand reaching for a newspaper
- **Menu options:** New Game, High Scores, Controls, Credits
- **New Game flow:** Vehicle Select → Difficulty Select → Day 1 begins
- **Background:** Animated suburban street with zombies shambling, papers blowing in wind
- **Music:** Upbeat retro synthwave with eerie undertone

---

## 12. Controls

| Action                  | Keyboard   | Gamepad       |
| ----------------------- | ---------- | ------------- |
| Steer Left/Right        | A/D or ←/→ | Left Stick    |
| Accelerate              | W or ↑     | Right Trigger |
| Brake/Slow              | S or ↓     | Left Trigger  |
| Throw Newspaper (left)  | Q          | Left Bumper   |
| Throw Newspaper (right) | E          | Right Bumper  |
| Melee Attack            | Space      | X Button      |
| Ranged Attack           | F          | Y Button      |
| Pause                   | Escape     | Start         |

---

## 13. Training Course

- Appears after each delivery route
- Unlimited newspaper supply
- Targets on both sides of road — hit for points
- Ramps for jumping over walls/ditches/holes
- Crash = course ends immediately (no life lost)
- Bonus multiplier for consecutive hits without miss

---

## 14. Technical Architecture

```
src/
├── main.ts                  # Phaser game config, boot
├── scenes/
│   ├── BootScene.ts         # Asset preloading
│   ├── WelcomeScene.ts      # Title screen, menu
│   ├── VehicleSelectScene.ts
│   ├── DifficultySelectScene.ts
│   ├── GameScene.ts         # Main gameplay loop
│   ├── TrainingScene.ts     # Training course
│   ├── ScoreSummaryScene.ts # Day-end summary
│   └── GameOverScene.ts
├── entities/
│   ├── Player.ts            # Vehicle + weapon controller
│   ├── Zombie.ts            # Base zombie + 3 subtypes
│   ├── Citizen.ts           # Base citizen + 3 subtypes
│   ├── House.ts             # Base house + 3 subtypes
│   ├── Hazard.ts            # Base hazard + 3 subtypes
│   ├── Newspaper.ts         # Projectile
│   └── Pickup.ts            # Ammo/paper bundles
├── weapons/
│   ├── Weapon.ts            # Base weapon interface
│   ├── MeleeWeapon.ts       # Bat, Hockey Stick, Machete
│   └── RangedWeapon.ts      # Slingshot, Crossbow, Shotgun
├── maps/
│   ├── MapGenerator.ts      # Procedural house placement
│   ├── MapleGrove.ts        # Suburban config
│   ├── DowntownDeadwood.ts  # Urban config
│   └── RustCreek.ts         # Industrial config
├── systems/
│   ├── ScoreManager.ts      # Points, multipliers
│   ├── SubscriptionManager.ts # Subscriber tracking
│   ├── DayManager.ts        # Day progression Mon-Sun
│   ├── SpawnManager.ts      # Zombie/citizen/hazard spawning
│   └── InputManager.ts      # Keyboard + gamepad
├── ui/
│   ├── HUD.ts               # Score, lives, papers, ammo
│   └── PauseMenu.ts
├── config/
│   ├── constants.ts         # Game balance numbers
│   ├── vehicles.ts          # Vehicle stats + weapon assignments
│   └── difficulty.ts        # Difficulty scaling
└── utils/
    ├── physics.ts           # Oblique projection helpers
    └── audio.ts             # Sound manager
```

**State Management:** Phaser's built-in scene data + a singleton `GameState` class tracking day, score, subscriptions, lives across scenes.

**Rendering:** Phaser's tilemap system for oblique projection. Each map defined as a Tiled JSON tilemap. Entities rendered as animated sprites sorted by Y-position for depth.

---
