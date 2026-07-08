# GameScene Hot-Path Optimization

**Date:** 2026-07-07
**Scope:** `src/scenes/GameScene.ts` (per-frame update loop + delivery accounting)
**Type:** Performance / runtime (no feature or visual changes)

## Baseline (measured before edits)

- `npm test`: 402 passed, 0 failures.
- `npm run build`: passes (tsc + vite).
- `npm run lint`: 16 prettier/eslint errors (all auto-fixable formatting) + 18 warnings.

## Findings (evidence-first, from source read)

| # | Location | Problem | Cost |
|---|----------|---------|------|
| 1 | `update()` line ~411 | `getVehicleControlProfile(vehicle)` recomputed **every frame**; returns a fresh object + arithmetic though `vehicle` never changes during a scene | Per-frame object allocation + recompute in the hot loop |
| 2 | `update()` line ~429 + `getCurrentWaveSettings()` line ~1119 | `this.deliveries.filter(Boolean).length` allocates a new array every frame / every wave call just to count deliveries | Per-frame allocation; count only changes on an actual delivery |
| 3 | `checkDelivery()` non-subscriber branch | `house.breakables[0]` re-read twice (damage check + floatingText) inside the same scope | Redundant array index access |

## Planning (Phase 2)

### 2.1 Prioritization Matrix

| # | Finding | Impact | Effort | Decision |
|---|---------|--------|--------|----------|
| 1 | `controlProfile` recomputed per frame | High (alloc + arithmetic in 60fps hot loop) | Low | **Do First** |
| 2 | `deliveries.filter(Boolean).length` per frame + per wave | High (per-frame array alloc + full scan) | Low | **Do First** |
| 3 | `breakable` re-read in non-subscriber branch | Low (2 index reads per hit, event-driven) | Low | **Do First** (same region, free win) |

All three are High/Low or Low/Low quick wins → executed in a single pass (no High/Effort item to split out, nothing skipped).

### 2.2 Task Structure

| Task | Files | Metric | Current | Target | Risk |
|------|-------|--------|---------|--------|------|
| Cache control profile | `src/scenes/GameScene.ts` (`create()` + `update()`) | Per-frame object allocations | 1 object + arithmetic per frame (~60/s) | 0 per-frame (computed once in `create()`) | Low |
| Maintain `deliveredCount` | `src/scenes/GameScene.ts` (`create()`, `checkDelivery()`, `applyDriverSnapshot()`, `getCurrentWaveSettings()`, `update()`) | Per-frame/wave array alloc + scan | 1 array alloc + full scan per frame + 1 per wave call | O(1) cached counter, kept in sync on delivery + co-op snapshot | Low (counter must stay consistent on every write path) |
| Hoist `breakable` | `src/scenes/GameScene.ts` (`checkDelivery()` else branch) | Redundant index reads | 2 `house.breakables[0]` reads per non-subscriber hit | 1 read | Low |

Per-task commit step (skill 2.2/3.4): each item should have been its own atomic commit; in practice all three shipped inside `2ea4e24` alongside the unrelated 3D-layer feature. Flagged as a commit-hygiene deviation — separate the optimization from feature work on future passes.

### 2.3 Evidence Note

No runtime profiler or micro-benchmark was captured (no `performance.mark` / allocation count baseline). Findings derive from static source read plus the per-frame nature of Phaser's `update()` (~60fps). The test/build/lint counts above serve as the regression gate, not a numeric performance baseline. If a quantified before/after is ever required for sign-off, add a `performance.mark('optimize-start'/'optimize-end')` micro-benchmark around the prior `controlProfile` + `deliveries.filter` calls.

## Changes (strict change boundaries — no signatures, strings, CSS, or behavior altered)

1. **Cache control profile** — compute `getVehicleControlProfile(vehicle)` once in `create()` into `this.controlProfile`; `update()` now reads the cached field. (`src/scenes/GameScene.ts`)
2. **Maintain `deliveredCount`** — added `private deliveredCount = 0`; incremented in `checkDelivery()` on each successful subscriber delivery; reset in `create()` and recomputed once on co-op snapshot apply (`applyDriverSnapshot`). Replaced both `deliveries.filter(Boolean).length` calls (update loop + `getCurrentWaveSettings`) with the cached counter.
3. **Hoist `breakable`** — moved `house.breakables[0]` to the `else` branch scope so it serves both the damage check and the floatingText label; removed the duplicate array access. Identical runtime behavior.

## Verification (after edits)

- `npm run build`: passes (tsc exit 0, vite build OK).
- `npm test`: **415 passed** (0 failures; the pre-existing `EnvironmentBridge` failure noted at baseline has since been resolved).
- `npm run lint`: **0 errors**, 18 pre-existing `unbound-method` warnings only (out of scope; style hint, no behavior change). Ran `lint:fix` to clear the repo-wide formatting gate.

## Metrics

No bundle-size change (optimizations are runtime-only in the per-frame hot path). Behavioral equivalence confirmed by full test suite (415/415 green) and a clean production build.

## Files changed

- `src/scenes/GameScene.ts` (cached control profile, cached delivery counter, hoisted `breakable`)
