# Jobcard — 2026-03-30 Afternoon (Animations)

## Summary

Added a comprehensive animation and micro-interaction system across all ZombieSweep scenes, enhancing gameplay feedback, scene transitions, and UI responsiveness.

## Phases Completed

### Phase 1: Animation Utility Module

Created `src/utils/animations.ts` with reusable animation helpers:

- `screenShake` — camera shake on impacts
- `damageFlash` — red camera flash on player damage
- `floatingText` — rising/fading text for score popups, delivery feedback, combos
- `deathFlash` — enemy death: white flash → scale down → fade out
- `collectEffect` — pickup collection: scale pop → fade
- `meleeSwingArc` — visual melee attack indicator arc
- `pulse` — quick scale-up/down for HUD state changes
- `fadeToScene` / `fadeIn` — smooth camera fade transitions between scenes
- `staggerReveal` — array element stagger entrance
- `countUp` — animated number counter
- `prefersReducedMotion` — accessibility check

### Phase 2: Scene Transition Fades

All 8 scenes now use `fadeIn()` on entry and `fadeToScene()` on exit instead of instant cuts. Includes WelcomeScene, VehicleSelectScene, DifficultySelectScene, GameScene, TrainingScene, ScoreSummaryScene, GameOverScene, and PauseMenu quit.

### Phase 3: GameScene Combat Feedback

- **Screen shake + red flash** on player hazard/zombie damage
- **Zombie death animation** — white flash, shrink, fade out (instead of instant destroy)
- **Melee swing arc** — visible attack range indicator
- **Floating delivery text** — "MAILBOX!", "DELIVERED", "CRASH!" on newspaper hits
- **Pickup collection effects** — scale pop + floating "+3 PAPERS", "+5 AMMO" text
- **Floating score text** on zombie kills
- Dead zombie physics bodies disabled immediately to prevent ghost collisions

### Phase 4: HUD Animations

- **Score pulse** — 1.3x scale pulse on score change
- **Life loss flash** — lives text turns red and pulses on damage, then reverts
- **Low paper warning** — paper count turns red and pulses when ≤ 3 papers remain

### Phase 5: PauseMenu Animation

- **Smooth entrance** — container fades in over 200ms with Quart.easeOut
- **Smooth exit** — container fades out over 150ms, physics resume on complete

### Phase 6: TrainingScene Hit Feedback

- **Target hit flash** — targets flash white briefly on hit
- **Combo floating text** — "2× COMBO!", "3× COMBO!" in gold for consecutive hits
- **Single hit text** — green "HIT!" for first hits
- **Ramp hit text** — gold "RAMP!" on ramp scoring
- **Countdown timer** — visible timer in corner, turns red and pulses at ≤ 5 seconds

### Phase 7: Score/GameOver Polish

- **ScoreSummary stat rows** — staggered slide-in entrance (400ms, 600ms, 800ms, 1000ms delays)
- **GameOver score counter** — animates from 0 to final score after entrance animation

## Files Changed

| File                                  | Change                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/utils/animations.ts`             | **NEW** — Reusable animation utility module                                                       |
| `src/scenes/WelcomeScene.ts`          | Added fadeIn/fadeToScene transitions                                                              |
| `src/scenes/VehicleSelectScene.ts`    | Added fadeIn/fadeToScene transitions                                                              |
| `src/scenes/DifficultySelectScene.ts` | Added fadeIn/fadeToScene transitions                                                              |
| `src/scenes/GameScene.ts`             | Combat feedback: screenShake, damageFlash, deathFlash, meleeSwingArc, floatingText, collectEffect |
| `src/scenes/TrainingScene.ts`         | Hit feedback: target flash, combo text, countdown timer                                           |
| `src/scenes/ScoreSummaryScene.ts`     | Staggered stat row reveals                                                                        |
| `src/scenes/GameOverScene.ts`         | Score count-up animation, fadeIn/fadeToScene                                                      |
| `src/ui/HUD.ts`                       | Score pulse, life loss flash, low paper warning                                                   |
| `src/ui/PauseMenu.ts`                 | Smooth fade entrance/exit                                                                         |

## Test Results

- **253 tests passed** across 15 test files
- **0 new errors** introduced
- **Vite build succeeds** (31 modules transformed)
- Pre-existing: 2 errors in `Hazard.test.ts` (unrelated `canOllieOver` property)

## Animation Design Principles Applied

- All durations follow established timing: 100-200ms for feedback, 200-400ms for state changes, 500-800ms for entrances
- Easing: Quart.easeOut and Expo.easeOut (natural deceleration) — no bounce/elastic
- Exit animations are faster than entrances (~75% duration)
- `prefersReducedMotion()` utility available for accessibility
- Transform + opacity only for GPU-accelerated performance
- Physics bodies disabled immediately on death to prevent ghost interactions

## Next Steps

- Wire up `prefersReducedMotion()` to conditionally skip/shorten all animations
- Add particle effects for zombie deaths (blood splatter) and perfect day celebration
- Add parallax scrolling layers to GameScene road background
- Consider adding newspaper trail effect (dotted arc showing throw trajectory)

## Recommendations

- The existing Back.easeOut in menu button animations could be replaced with Quart.easeOut for consistency, but it's a minor stylistic choice
- Consider adding a brief "GET READY" entrance overlay to GameScene before gameplay begins
- The floating text system could be extended with configurable font sizes for different contexts

## Potential Enhancements

- Screen shake intensity scaled by damage type (zombie contact vs hazard)
- Combo counter persistent display in TrainingScene (not just floating text)
- Victory confetti particle system on GameOverScene for completed weeks
- Newspaper arc trajectory preview line while aiming
