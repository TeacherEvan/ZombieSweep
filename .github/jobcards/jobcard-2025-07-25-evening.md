# Jobcard — 2025-07-25 Evening

## Summary

Applied the **"Bolder" visual amplification** methodology across the entire ZombieSweep UI. Every scene and UI component was rewritten to establish a cohesive **retro horror-arcade** aesthetic — 80s VHS horror-comedy meets coin-op cabinet. The game went from safe/generic placeholder visuals to a high-energy, atmospheric experience with consistent design language.

## Design Direction

- **Color palette**: Deep black (#0d0d0d), blood red (#cc1100), warm ochre (#ddaa22), muted earth (#aa8877), dark green (#2d4a2d)
- **Typography**: Impact/'Arial Black' for headers, 'Courier New' monospace for labels/body
- **Animation**: Staggered entrance choreography (Back.easeOut, 120ms delays), pulse effects, scale transitions
- **Mood**: Atmospheric glows, zombie silhouettes, accent bars, textured environments

## Phases Completed

1. **Context Gathering** — Read all scene, UI, config, and entry point files
2. **Visual Assessment** — Took "before" screenshots, cataloged weaknesses (generic fonts, muted colors, no hierarchy, zero texture, no motion)
3. **Amplification Planning** — Defined design direction, color palette, typography, animation patterns
4. **Implementation** — Rewrote all 10 scene/UI files with amplified visuals
5. **Verification** — Ran all tests (253 passing), took "after" screenshots confirming transformation

## Files Changed

| File                                  | Changes                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/scenes/WelcomeScene.ts`          | Hero title with red glow + pulse, atmospheric blood-red gradient, zombie silhouettes marching across bottom, staggered button entrance, keyboard nav, accent bars, restyled overlays                                     |
| `src/scenes/VehicleSelectScene.ts`    | Per-vehicle accent colors (green/blue/yellow), visual stat bars, card entrance animation, scale feedback on selection                                                                                                    |
| `src/scenes/DifficultySelectScene.ts` | Color-coded difficulty rows (green/orange/red), skull icons, accent bars, staggered entrance, glow-on-select                                                                                                             |
| `src/scenes/GameScene.ts`             | Detailed road environment: asphalt layers, dashed lane lines, textured sidewalks with cracks, grass/dirt edges, screen vignette                                                                                          |
| `src/scenes/GameOverScene.ts`         | Dynamic glow color (victory=green, game over=red), hero score with golden glow + count-up animation, pulsing header, staggered buttons                                                                                   |
| `src/scenes/ScoreSummaryScene.ts`     | Golden accent bars, animated stat rows, color-coded delivery ratio, "+NEW SUBSCRIBER" pop animation, "PERFECT DAY BONUS" glow                                                                                            |
| `src/scenes/TrainingScene.ts`         | Green grass field with track lane, lane markings, grass detail lines, restyled header with golden glow                                                                                                                   |
| `src/scenes/BootScene.ts`             | Upgraded placeholder textures: vehicles with outlines + highlights, zombies with heads + red eyes, houses with roofs/doors/windows (lit vs dark), hazards with warning stripes, glowing pickups, concentric target rings |
| `src/ui/HUD.ts`                       | Semi-transparent panel with red accent bar, structured label/value layout, gold score highlight                                                                                                                          |
| `src/ui/PauseMenu.ts`                 | Centered panel with accent bar, red glowing title, styled hover buttons                                                                                                                                                  |

## Test Results

- **253 tests passing** across 15 test files
- **0 failures**, no regressions
- Tests run via `npx vitest run` in 1.43s

## Next Steps

- Replace placeholder textures with actual sprite assets (when available)
- Add sound effects/music to complement the visual atmosphere
- Add screen transition effects (fade/wipe between scenes)
- Consider particle effects for zombie kills, newspaper impacts

## Recommendations

- The placeholder textures in BootScene are now much more visually informative — but real sprite art would be the biggest remaining visual upgrade
- The staggered animation timings (120ms delays) feel good — could be exposed as a config constant if tuning is needed
- The color palette constants could be extracted to a shared `src/config/theme.ts` if more files need them

## Potential Enhancements

- Screen shake on zombie hit
- Newspaper trail particles
- Day/night cycle with lighting changes per map
- Parallax scrolling for grass/sidewalk edges
- CRT scanline overlay shader for full retro effect
