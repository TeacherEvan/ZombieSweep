# Jobcard: Performance Optimization Pass

**Date**: 2026-03-31 (evening)
**Agent**: GitHub Copilot (Claude Opus 4.6)

## Summary

Systematic performance audit and optimization across the ZombieSweep build pipeline, runtime hot path (GameScene), and HTML shell. Focused on measurable wins: vendor chunk splitting, eliminating per-frame waste in the HUD, reducing Graphics object churn at boot, and improving font loading and paint containment.

## Phases Completed

1. **Audit** - Profiled bundle output (1.26 MB single chunk), analyzed GameScene update() hot path, reviewed all scene creation costs, HTML/CSS paint behavior
2. **Vendor chunk splitting** - Split Phaser into a separate cacheable chunk via `manualChunks` function in Vite config (Rolldown-compatible)
3. **HUD dirty-checking** - Replaced 5 unconditional `setText()` calls per frame with change-detection; cached day string since it never changes during a scene
4. **BootScene texture reuse** - Refactored 20+ create/destroy Graphics cycles into single reusable Graphics object with `clear()` between textures
5. **Font preload** - Added `<link rel="preload">` for Barlow Condensed WOFF2 to eliminate render-blocking font discovery
6. **CSS containment** - Added `contain: strict` to CRT scanline overlay and vignette pseudo-elements; `will-change: transform` to ticker scroll
7. **PauseMenu scanlines** - Replaced 135 individual `lineBetween()` draw calls with a single tiled 4x4 texture

## Files Changed

| File                      | Changes                                                                       |
| ------------------------- | ----------------------------------------------------------------------------- |
| `vite.config.ts`          | Added `manualChunks` function + `chunkSizeWarningLimit`                       |
| `src/ui/HUD.ts`           | Full dirty-checking, cached day string, eliminated per-frame DayManager field |
| `src/scenes/BootScene.ts` | Single reusable Graphics object for all texture generation                    |
| `src/ui/PauseMenu.ts`     | TileSprite scanline texture replacing 135 draw calls                          |
| `index.html`              | Font preload, `contain: strict` on overlays, `will-change` on ticker          |

## Performance Impact

### Bundle (before -> after)

| Metric                         | Before                         | After                                         |
| ------------------------------ | ------------------------------ | --------------------------------------------- |
| Chunks                         | 1                              | 3                                             |
| Game code size                 | 1,259 KB (bundled with Phaser) | 60.7 KB (standalone)                          |
| Game code gzip                 | ~336 KB (bundled)              | 16.8 KB (standalone)                          |
| Phaser chunk                   | (bundled)                      | 1,199 KB / 319 KB gzip (cached independently) |
| Deploy transfer on code change | ~336 KB gzip                   | ~17 KB gzip                                   |

### Runtime (GameScene hot path)

| Metric                              | Before                            | After                         |
| ----------------------------------- | --------------------------------- | ----------------------------- |
| HUD setText() calls per frame       | 5 (always)                        | 0 (when idle)                 |
| DayManager.getDayOfWeek() per frame | 1                                 | 0 (cached once)               |
| HUD DayManager allocation           | new instance per HUD construction | local variable in constructor |
| BootScene Graphics objects created  | ~20                               | 1                             |
| PauseMenu draw calls for scanlines  | 135 lineBetween()                 | 1 TileSprite                  |

## Test Results

- **270 tests passing** across 17 test files
- **0 failures**
- **TypeScript compilation clean** (tsc --noEmit: no errors)
- **Build clean** (no warnings)

## Next Steps

- Profile with Chrome DevTools Performance panel during gameplay for frame time validation
- Consider `content-visibility: auto` for off-screen HTML elements if the ticker causes jank
- Evaluate Phaser's WebGL renderer performance vs Canvas for this game's sprite count

## Recommendations

- When Phaser 4 releases, evaluate its tree-shakeable architecture to significantly reduce vendor chunk size
- Consider generating a spritesheet atlas at boot instead of individual textures to reduce texture swaps during rendering
- The WelcomeScene 300-rect noise effect could be replaced with a single generated texture if boot time becomes noticeable

## Potential Enhancements

- Object pooling for zombie sprites (avoid create/destroy per wave)
- Object pooling for floating text (frequent allocations during combat)
- Spatial partitioning for zombie collision checks (currently O(n) per frame)
