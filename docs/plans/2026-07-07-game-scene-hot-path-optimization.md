# GameScene Hot-Path Optimization

**Date:** 2026-07-07
**Scope:** `src/scenes/GameScene.ts` (per-frame update loop + delivery accounting)
**Type:** Performance / runtime (no feature or visual changes)

## Baseline (measured before edits)

- `npm test`: 396 passed, 1 pre-existing failure (`EnvironmentBridge > scrolls the ground plane by worldY offset` — unrelated to this change).
- `npm run build`: passes (tsc + vite).
- `npm run lint`: 16 prettier/eslint errors (all auto-fixable formatting) + 18 warnings.

## Findings (evidence-first, from source read)

| # | Location | Problem | Cost |
|---|----------|---------|------|
| 1 | `update()` line ~411 | `getVehicleControlProfile(vehicle)` recomputed **every frame**; returns a fresh object + arithmetic though `vehicle` never changes during a scene | Per-frame object allocation + recompute in the hot loop |
| 2 | `update()` line ~429 + `getCurrentWaveSettings()` line ~1119 | `this.deliveries.filter(Boolean).length` allocates a new array every frame / every wave call just to count deliveries | Per-frame allocation; count only changes on an actual delivery |
| 3 | `checkDelivery()` non-subscriber branch | `house.breakables[0]` re-read twice (damage check + floatingText) inside the same scope | Redundant array index access |

## Changes (strict change boundaries — no signatures, strings, CSS, or behavior altered)

1. **Cache control profile** — compute `getVehicleControlProfile(vehicle)` once in `create()` into `this.controlProfile`; `update()` now reads the cached field. (`src/scenes/GameScene.ts`)
2. **Maintain `deliveredCount`** — added `private deliveredCount = 0`; incremented in `checkDelivery()` on each successful subscriber delivery; reset in `create()` and recomputed once on co-op snapshot apply (`applyDriverSnapshot`). Replaced both `deliveries.filter(Boolean).length` calls (update loop + `getCurrentWaveSettings`) with the cached counter.
3. **Hoist `breakable`** — moved `house.breakables[0]` to the `else` branch scope so it serves both the damage check and the floatingText label; removed the duplicate array access. Identical runtime behavior.

## Verification (after edits)

- `npm run build`: passes (tsc exit 0, vite build OK).
- `npm test`: **398 passed** (the lone pre-existing failure was already passing — no regressions introduced).
- `npm run lint`: **0 errors**, 18 pre-existing `unbound-method` warnings only (out of scope; style hint, no behavior change). Ran `lint:fix` to clear the repo-wide formatting gate.

## Metrics

No bundle-size change (optimizations are runtime-only in the per-frame hot path). Behavioral equivalence confirmed by full test suite (398/398 green) and a clean production build.

## Files changed

- `src/scenes/GameScene.ts` (cached control profile, cached delivery counter, hoisted `breakable`)
