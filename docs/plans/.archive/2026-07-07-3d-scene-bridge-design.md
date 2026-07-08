# ZombieSweep — 3D Scene-Replacement Bridge (Design v2)

**Date:** 2026-07-07
**Status:** ✅ **Archived — Implemented & Verified** (July 2026) | Environment (Phase 2), Effects (Phase 3), and sync foundation (Phase 0/1) all shipped & flag-gated. Vehicle bridge (Phase 1) deferred; vehicles + NPCs remain 2D.
**Author:** Evan + Hermes (superpowers workflow)

## Goal

Add real 3D visual elements to ZombieSweep without rewriting the 2D game loop.
The 2D `GameScene` remains the **canonical source of truth** for all gameplay state
(positions, physics, collisions, scoring). A parallel Three.js renderer draws 3D
meshes that *replace* selected 2D sprite groups in-place, driven by a per-frame
**sync bridge** that reads 2D transforms and reprojects them into a 3D camera.

Three element groups get their own bridge (parallel tracks):
1. **Vehicles** — the player vehicle only (NPCs are texture-keyed *characters*,
   NOT vehicles; they stay 2D under this scope — see "Not in scope").
2. **Environment** — houses/buildings + ground plane.
3. **Effects** — projectiles, death bursts, lighting/atmosphere.

## Core Constraints (non-negotiable)

- **Gameplay state is canonical.** No gameplay logic moves into Three.js. The 3D
  layer is a pure projection of 2D state. If 3D is disabled, the game is unchanged.
- **Physics preserved.** Hidden 2D sprites keep their physics bodies active
  (`setVisible(false)`, body untouched). Collisions/scoring never depend on the 3D layer.
- **Feature-flag gated.** `FEATURE_FLAGS.render3d` toggles the 3D layer. Off →
  original 2D sprites render exactly as today (zero regression). On → sprite groups
  are hidden and their 3D counterparts render.
- **TDD throughout.** Every bridge module ships with failing tests first.
- **No Phaser-internal coupling.** The bridge reads only public transform data
  (x, y, rotation, scaleX/Y, visible, alpha, depth) from sprites.

## Architecture

### Render layering (z-order, top to bottom)
```
  UIScene canvas        HUD, PauseMenu, TouchControls, reticle   (depth 50–60 band)
  ────────────────────  ← 3D meshes MUST sit below the UI band
  Three.js canvas       vehicles / environment / effects meshes  (gameplay depth band)
  ────────────────────
  GameScene canvas      road/background graphics + HIDDEN sprite groups
```
**Key fix (v2):** Today the HUD lives inside `GameScene` at depth 50–60 with
`setScrollFactor(0)`. A single Three canvas stacked on top would occlude it. Intended
solution: extract HUD/PauseMenu/TouchControls/reticle into a **`UIScene`** launched in
parallel (`this.scene.launch('UIScene')`), rendered above the Three canvas. `GameScene`
keeps only gameplay + background. The Three canvas is inserted between the two Phaser
canvases in the DOM (`#game-root`).

> **Implementation note (2026-07-07):** The `UIScene` extraction (P0.6) was **deferred**.
> The shipped MVP inserts the Three.js canvas between `GameScene` and the UI band but keeps
> the HUD inside `GameScene`; the Three canvas sits at the bottom of the gameplay depth band
> and the HUD (depth 50–60) still paints above it. This preserves paint order without the
> `UIScene` split. If the Vehicle/Effects bridges are later added above the HUD band, the
> `UIScene` extraction must be revisited.

### Coordinate projection (`projection.ts`) — camera decision
- **Use an ORTHOGRAPHIC Three camera matched to the Phaser viewport**, not perspective.
  Rationale: the route scrolls vertically with a fixed ortho 2D camera; an ortho 3D
  camera with the same frustum gives **pixel-perfect positional parity** with 2D
  sprites while still rendering real extruded meshes, dynamic lighting, and depth
  occlusion. This delivers a genuine "real 3D look" (lit, shadowed, volumetric) with
  trivial alignment and no parallax/foreshortening surprises on a side-scroller.
- `projection.ts` converts a Phaser **world point** → **screen px** (from
  `cameras.main` scroll/zoom) → Three **world units** via the matched ortho frustum.
- Perspective is explicitly a *later toggle* (P4.4 optional), not baseline.
- Projection functions are pure → unit-testable with no WebGL context.

### Sync bridge base (`bridges/SyncBridge.ts`)
- Abstract base: `sync(scene, dt)`. Reads a registered sprite group, updates meshes.
- **Mesh pool per group**: reuse geometries/materials; spawn/despawn to match live
  sprite count. No per-frame allocation.
- `enabled` flag flips on/off; when off, the corresponding 2D group is re-shown
  (`setVisible(true)`) and meshes are cleared.
- Each bridge exposes a **data contract**: exact sprite fields → mesh properties.

### Per-bridge data contract
| Bridge | Source (2D) | Mesh prop ← sprite field |
|--------|-------------|---------------------------|
| Vehicle | `PlayerSprite` (`player-${vehicle}`) | position ← (x,y); rotation.z ← rotation; scale ← scaleX; mesh variant ← `gameState.vehicle` |
| Environment | `houseSprites[]` placements | position ← (house.x, house.y); height ← house.stories; ground plane offset ← `worldY` |
| Effects | `newspaperSprites`, kill events, `comboTracker` | projectile mesh ← sprite (x,y,angle); burst ← kill event; light pulse ← combo tier |

### Three sub-bridges
- `bridges/VehicleBridge.ts` — player vehicle only. Mesh: extruded low-poly hull per
  `VEHICLE_STATS` type, procedural geometry (no external GLTF in v1).
- `bridges/EnvironmentBridge.ts` — instanced house boxes + scrolling ground plane;
  shared directional + ambient light rig; fog for mood.
- `bridges/EffectsBridge.ts` — projectile meshes + trailing particles; death-burst
  particle pool triggered on zombie-kill events; combo light pulse. Particle/instance
  counts hard-capped and pooled.

## Multi-Level Phase Plan

### Phase 0 — Foundation
- P0.1 Add `three` dependency; DOM `#game-root` with stacked transparent Three canvas
      inserted between `GameScene` and `UIScene` canvases.
- P0.2 `projection.ts`: ortho frustum matching + world→screen→world functions. **Tests.**
- P0.3 `SyncBridge` base + mesh pool. **Tests** (pool grows/shrinks to sprite count,
      enabled toggle re-shows 2D group).
- P0.4 `FEATURE_FLAGS.render3d`. Bootstrap mounts Three renderer only when on; flag off
      → **no** Three canvas, `GameScene` renders exactly as today.
      **Integration test: flag off ⇒ renderer never constructed.**
- P0.5 `Render3DManager` lifecycle in `GameScene.create()`/`update()`; teardown on shutdown.
- P0.6 **Extract `UIScene`**: move HUD/PauseMenu/TouchControls/reticle out of
      `GameScene`; launch above Three canvas. **Test: UI still renders, input intact.**

### Phase 1 — Vehicle Bridge (player only)
- P1.1 Vehicle mesh factory per `VEHICLE_STATS` type (procedural extrude). **Tests.**
- P1.2 Hide 2D player sprite (body stays); sync player mesh from `PlayerSprite` transform.
- P1.3 Parity test: mesh world-pos == reprojected player screen-pos within tolerance.
- P1.4 Depth/scale correct under route scroll + zoom.

### Phase 2 — Environment Bridge
- P2.1 House mesh factory (instanced boxes by stories). **Tests.**
- P2.2 Sync `houseSprites` placements → house meshes; hide 2D houses (bodies stay).
- P2.3 Scrolling ground plane driven by `worldY`; fog/atmosphere.
- P2.4 Lighting rig tuned to apocalypse mood; shadow map on key meshes.

### Phase 3 — Effects Bridge
- P3.1 Projectile/pre-newspaper mesh + trailing particles.
- P3.2 Death-burst particle pool on zombie-kill events.
- P3.3 Combo light pulse (reads `comboTracker` tier).
- P3.4 Perf cap: pooled particles, hard max count.

### Phase 4 — Cross-Cutting
- P4.1 Unified depth sort: 3D meshes occupy gameplay depth band (-10..12); UI band
      (50–60) stays above on `UIScene`. Paint order verified by parity test.
- P4.2 Camera shake / zoom from `animations.ts` synced into the 3D ortho camera.
- P4.3 Graceful fallback: WebGL unavailable or flag off ⇒ instant 2D restore
      (`setVisible(true)` on all groups, meshes cleared, no throw).
- P4.4 **Optional** perspective toggle (later, not baseline).
- P4.5 Reduced-motion / low-power mode (fewer particles, no fog, no shadows).

### Phase 5 — Stability & Launch
- P5.1 Full vitest suite green with `render3d` on and off.
- P5.2 Perf budget: FPS delta < 5% vs 2D baseline on reference hardware.
- P5.3 CI: add `render3d` smoke path. **Headless strategy:** Three renderer is only
      instantiated in-browser; in tests we inject a **stub renderer/scene** so bridge
      sync logic is exercised without a GPU. No WebGL context required in CI.
- P5.4 `LAUNCH_CHECKLIST.md` + `README.md` updated with 3D mode + flag.

## Phase Status (as of 2026-07-07)

| Phase | Status | Notes |
|-------|--------|-------|
| P0 Foundation | ✅ Done | projection, SyncBridge + mesh pool, FEATURE_FLAGS.render3d, Render3DManager lifecycle, UIScene split deferred (HUD kept in GameScene; 3D canvas sits in gameplay depth band below HUD) |
| P1 Vehicle Bridge | ⏸ Deferred | Player vehicle remains 2D. Out of scope for the current launch. |
| P2 Environment Bridge | ✅ Done | Instanced houses + scrolling ground + lighting/fog rig. |
| P3 Effects Bridge | ✅ Done | Projectiles (P3.1), death-burst pool (P3.2), combo light pulse (P3.3), hard cap 200 (P3.4). |
| P4 Cross-Cutting | ✅ Done | P4.1 depth band (renderOrder + depthZOffset) with parity test; P4.2 camera-shake offset synced into the 3D ortho camera each frame; P4.3 graceful fallback (flag-off no-op + `isWebGLAvailable()` guard + renderer-construct try/catch, all degrade to 2D); P4.5 reduced-motion threaded into both bridges. |
| P5 Stability & Launch | ✅ Done | Suite green on+off (`npm run test` + `npm run test:3d`), headless perf guard (P5.2), CI smoke path (P5.3), docs (P5.4). |

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| 3D canvas occludes HUD | `UIScene` split (P0.6); 3D band below UI band |
| Projection drift | Per-bridge parity test, tolerance-checked |
| Hidden sprites lose collisions | Bodies stay active; only `setVisible(false)` |
| WebGL absent / CI headless | Stub renderer in tests; flag-off = 2D |
| Perf regression | Pooled meshes/particles; hard caps; P5.2 budget |
| NPC-as-vehicle confusion | Scope clarified: vehicles = player only; NPCs stay 2D |

## Not in scope (YAGNI)
- NPC characters as 3D (they are texture-keyed, belong to none of the 3 chosen groups).
- External GLTF model loading / art pipeline (v1 = procedural geometry only).
- 3D audio, shader rewrites, gameplay-rule changes.
- Perspective camera as baseline (optional later toggle only).

## Success Criteria
- `npm run test` green with `render3d` on and off.
- Gameplay identical with flag off (regression = fail).
- 3D meshes visually replace the three groups with positional parity (tolerance test).
- HUD renders above all 3D content; input unaffected.
- No FPS regression beyond budget.
