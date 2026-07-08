# ZombieSweep — 3D-as-Default Visual Overhaul (Design)

**Date:** 2026-07-08
**Status:** 📝 Draft — Awaiting approval
**Author:** Evan + Hermes (superpowers workflow)
**Builds on:** `docs/plans/.archive/2026-07-07-3d-scene-bridge-design.md` (flag-gated 3D bridges)

## Goal

Make the Three.js 3D layer the **default renderer** and finish/polish it so the
game "drastically improves" visually out of the box:

1. 3D default ON (still disableable via `VITE_RENDER3D=false` + WebGL fallback).
2. Fix the existing bug where the 3D canvas is built but **never mounted** → no
   visible 3D today even with the flag on.
3. Add **3D player vehicle** + **3D zombies** (new bridges).
4. Add **post-FX** (bloom + film grade) for an apocalyptic look.
5. Polish environment lighting + house materials.
6. Keep the 2D path 100% functional as the graceful fallback.

## Key Findings (from code audit)

- `featureFlags.ts`: `render3d = VITE_RENDER3D === 'true'` → OFF unless env set.
- `Render3DManager.create()` builds `THREE.WebGLRenderer()` but **never appends
  `renderer.domElement` to the DOM** (only `this.host.add(scene)` for test stubs;
  `host` is `null` in production). **This is why 3D is currently invisible.**
- `main.ts` uses `Phaser.CANVAS` with opaque `backgroundColor: '#000000'`. The HUD
  lives on the SAME GameScene canvas (depth 50–60), so any 3D canvas stacked on
  top would occlude the HUD.
- `three/examples/jsm/postprocessing/*` ships in the installed `three` (EffectComposer,
  UnrealBloomPass, OutputPass, FilmPass available) → post-FX needs no new deps.
- Existing tests: `GameScene.3d-integration.test.ts` mutates the flag per-case and
  asserts flag-OFF = no-op; `featureFlags.test.ts` asserts `render3d` equals env
  value. Both must stay green (default-on changes the env-default assumption only).

## Architecture Changes

### Layering (the core fix)
```
  Phaser canvas (transparent)   ← GameScene gameplay sprites (HIDDEN where 3D owns them)
                                     + HUD + vignette  (depth band 50–60), z-index: 1
  ─────────────────────────────
  Three.js canvas (.three-canvas) ← ground, houses, player, zombies, effects, post-FX
                                     z-index: 0  (mounted behind, in #app)
```
- `main.ts`: set Phaser `transparent: true` (drop opaque black bg; other scenes keep
  their own backgrounds via camera bg fills).
- `Render3DManager`: add `mount?: HTMLElement` option; in `create()`, if `mount`,
  append `renderer.domElement`, add class `three-canvas`, style absolute/inset:0/z:0.
- `index.html`: add `#app canvas.three-canvas { z-index: 0 }` rule (existing
  `#app canvas` rule gives Phaser canvas z-index:1).
- `GameScene.create()`: when 3D active, set camera background transparent
  (`setBackgroundColor('rgba(0,0,0,0)')`) and **skip drawing the opaque 2D road /
  sidewalk / edge graphics** (the 3D ground plane replaces them). Vignette stays
  (it's an edge overlay, doesn't block center).

### Default flip
- `featureFlags.ts`: `render3d = (import.meta.env.VITE_RENDER3D ?? 'true') === 'true'`
  → ON by default; explicitly `'false'` (or `'0'`) disables. WebGL-unavailable path
  still degrades to 2D (unchanged `isWebGLAvailable()` guard).
- Update `featureFlags.test.ts` expected default to ON (env-resolved: undefined ⇒ true).

### New bridges
- `bridges/PlayerBridge.ts` (P1, was deferred): procedural low-poly vehicle mesh per
  `VEHICLE_STATS` type (bicycle = frame+2 wheels; rollerblades = body+wheels;
  skateboard = deck+wheels). Reads `PlayerSprite` (x,y,rotation,scaleX). Hides 2D
  player sprite (body stays). Depth band `'player'` (between house and projectile).
  TDD tests mirror `EnvironmentBridge.test.ts`.
- `bridges/ZombieBridge.ts` (new): procedural zombie mesh (capsule body + sphere head
  + limb hints), color-by-type (shambler green / runner red / spitter olive) +
  elite emissive accent. Reads `zombieSprites` (x,y,rotation) + elite flag. Small
  vertical bob in sync (time-driven). Hides 2D zombie sprites (bodies stay). Depth
  band `'actor'`. TDD tests.

### Post-FX
- `Render3DManager`: optional `EffectComposer` built when active & not reduced-motion
  (bloom always optional; reduced-motion ⇒ lighter/no bloom). Pipeline:
  `RenderPass(scene,camera)` → `UnrealBloomPass` (glow on window emissive, combo
  light, projectiles) → `OutputPass`. `update()` calls `composer.render()` when
  present, else `renderer.render()`. Handle `setSize` on resize.
- Combo/elite hooks: bump `effectsBridge.comboLight` + window emissive on big kills.

### Environment polish
- `EnvironmentBridge.create()`: add a cool hemisphere/rim light for mood; keep fog
  (skip in reduced-motion). Add scrolling lane dashes + curb strips to the ground
  plane so 3D reads as a road, not a void.
- `HouseMeshFactory`: subtle roughness/normal variation + desaturated trim; keep
  windows emissive for bloom pickup.

## Phased Task List (each = TDD: test first, then implement, commit green)

- **T1** Flip `render3d` default ON (env-disablable); update `featureFlags.test.ts`.
- **T2** `Render3DManager` mounts canvas into `mount` el (class + style); test that
      production path appends domElement; stub path unaffected.
- **T3** `main.ts` `transparent:true`; `index.html` `.three-canvas` z-index rule;
      `GameScene` transparent bg + skip opaque road graphics when 3D active.
- **T4** Post-FX composer (bloom+output) in `Render3DManager`; reduced-motion guard;
      test composer exists/renders path.
- **T5** `PlayerBridge` + tests; wire into `init/sync/teardownRender3DLayer`; hide 2D
      player sprite when active.
- **T6** `ZombieBridge` + tests; wire in; hide 2D zombie sprites when active; bob.
- **T7** Environment polish: rim/hemi light, road lane dashes, house material touches.
- **T8** Verify perf budget (extend `Render3D.perf.test.ts` with actor bridges); keep
      particle cap.
- **T9** Docs: README + LAUNCH_CHECKLIST flag row (now ON by default; rollback =
      `VITE_RENDER3D=false`); new design doc committed.
- **T10** Full verification: `npm run test` + `npm run test:3d` + `npm run lint` +
      `npm run build` all green.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| 3D canvas occludes HUD | Phaser canvas transparent & on top (z-index 1); 3D behind (z-index 0) |
| 2D road graphics cover 3D | Skip opaque road graphics when 3D active; 3D ground replaces them |
| Hiding 2D sprites breaks collisions | Only `setVisible(false)`; physics bodies untouched (existing pattern) |
| Default-on regresses players w/o WebGL | `isWebGLAvailable()` + renderer try/catch → 2D fallback unchanged |
| Bloom/extra bridges cost FPS | Pooled meshes, particle cap, reduced-motion path; perf test guard |
| Tests assumed default-off | Update `featureFlags.test.ts` only; integration tests mutate flag, still valid |

## Success Criteria

- `npm run test` + `npm run test:3d` green (3D on by default + 2D fallback both verified).
- In a browser the 3D world (road, houses, player vehicle, zombies, effects) renders
  by default with bloom; HUD legible on top.
- `VITE_RENDER3D=false` (or no WebGL) → identical 2D experience, no errors.
- No FPS regression beyond budget; lint + build clean.
