# ZombieSweep — 3D-as-Default Visual Overhaul — Implementation Plan

**Design:** `2026-07-08-3d-default-visual-overhaul-design.md`
**Mode:** Direct for wiring (T1–T4, T7–T10) + parallel subagents for mesh bridges (T5, T6).
**Rule:** TDD — failing test first, then implement, commit green after each task.

## T1 — Flip 3D default ON
- Edit `src/config/featureFlags.ts`: `render3d = (VITE_RENDER3D ?? 'true') === 'true'`.
- Edit `src/config/featureFlags.test.ts`: default expected ON (env undefined ⇒ true); keep
  explicit 'false' expectation.
- Verify: `npm run test` (featureFlags) still green; `npm run test:3d` green.

## T2 — Mount the 3D canvas (fix invisible-3D bug)
- `Render3DManager`: add `mount?: HTMLElement` to options; in `create()`, if WebGL active
  and `mount` provided, append `renderer.domElement`, add class `three-canvas`, position
  absolute/inset:0/z:0. Add `setSize` already present.
- Add test: production-path constructor accepts `mount`; assert `renderer.domElement`
  appended (use a jsdom element). Stub (host) path unaffected.

## T3 — Transparent Phaser + layering + skip 2D road
- `src/main.ts`: `transparent: true`, remove opaque `backgroundColor` (other scenes keep
  own bg).
- `index.html`: add `#app canvas.three-canvas { position:absolute; inset:0; z-index:0; }`
  (Phaser canvas keeps z-index:1 from existing `#app canvas` rule).
- `GameScene.create()`: when `this.render3d` active, call
  `this.cameras.main.setBackgroundColor('rgba(0,0,0,0)')` and **skip drawing** the opaque
  road/sidewalk/edge `Graphics` (gate on `!this.render3d?.isActive()`). Vignette stays.
- Verify scene still builds (existing integration test + manual: bg transparent when 3D on).

## T4 — Post-FX (bloom + output)
- `Render3DManager`: optional `EffectComposer` built in `create()` when active AND not
  reduced-motion: `RenderPass` → `UnrealBloomPass` (moderate strength) → `OutputPass`.
  Keep renderer for fallback. `update()` → `composer.render()` when present else
  `renderer.render()`. Add `setSize` propagation to composer. Reduced-motion ⇒ skip composer.
- Add test: composer constructed when not reduced-motion + active; `update()` calls
  composer render (stub). Import guard: postprocessing from `three/examples/jsm/...`.

## T5 — PlayerBridge (subagent, parallel)
- New `src/three/bridges/PlayerBridge.ts`: procedural low-poly vehicle mesh per
  `VEHICLE_STATS` type (bicycle/rollerblades/skateboard), reads `PlayerSprite` (x,y,
  rotation, scaleX). Depth band `'player'`.
- `PlayerBridge.test.ts` mirroring `EnvironmentBridge.test.ts` (mesh count reconciles,
  hide 2D sprite on enable, parity position).
- (Wiring into GameScene done by lead in T5/6 integration step.)

## T6 — ZombieBridge (subagent, parallel)
- New `src/three/bridges/ZombieBridge.ts`: capsule body + sphere head + limb hints,
  color-by-type (shambler/runner/spitter) + elite emissive accent, time-driven bob.
  Depth band `'actor'`.
- `ZombieBridge.test.ts` mirroring the above.
- (Wiring done by lead.)

## T5/6 Integration (lead, direct)
- `depthBand.ts`: add `player`, `actor` bands (between house and projectile ordering).
- `GameScene`: add `playerBridge`/`zombieBridge` fields; create+enable in
  `initRender3DLayer`; sync in `syncRender3DLayer` (read `this.player`, `zombieSprites`);
  teardown in `destroyRender3DLayer`. Hide 2D player/zombie sprites when active
  (`setVisible(false)`, bodies untouched).

## T7 — Environment polish
- `EnvironmentBridge.create()`: add hemisphere/rim light for mood; keep fog (skip reduced).
- `HouseMeshFactory`: subtle material tweak (trim, roughness) so windows pop on bloom.
- Ground: add lane dashes + curb strips (texture-less geometry) so 3D reads as a road.
- Tests: keep existing; add a light-count or ground-child assertion if stable.

## T8 — Perf guard extension
- Extend `Render3D.perf.test.ts`: include player + zombie bridges in the 300-frame loop;
  assert budget holds and particle cap intact.

## T9 — Docs
- `README.md`: 3D section → now default; `VITE_RENDER3D=false` disables.
- `LAUNCH_CHECKLIST.md`: flag row → `render3d` ON by default; rollback = `VITE_RENDER3D=false`.
- New design doc already committed.

## T10 — Full verification
- `npm run test` + `npm run test:3d` + `npm run lint` + `npm run build` all green.
- Commit branch; present merge/PR options (Phase 5).
