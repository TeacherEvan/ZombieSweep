# JTBD Analysis: Scene UI Broadcast Redesign

## Job Statement

When I open ZombieSweep and navigate through menus, I want every screen to feel like part of the same WZMB 13 live broadcast, so I stay immersed in the zombie apocalypse fiction from first click to final score.

## Current Solution & Pain Points

### Current State

The **HTML wrapper** (index.html) establishes a powerful broadcast news metaphor:

- WZMB 13 station call sign with red block and skewed clip-path
- "BREAKING NEWS" pulsing chyron
- Real-time broadcast clock
- LIVE dot with blink animation
- CRT scanline overlay + vignette
- Bottom ticker scrolling apocalypse headlines
- Barlow Condensed typeface — condensed, bold, editorial

The **Phaser scenes** inside break the illusion entirely:

- Generic dark backgrounds (#0d0d0d) with no broadcast texture
- Impact / Arial Black fonts (gaming cliché, doesn't match wrapper)
- Courier New for secondary text (generic "hacker" aesthetic)
- Rectangle buttons with red borders (stock dark UI pattern)
- No news broadcast visual language — no lower thirds, no chyrons, no data overlays
- No continuity with the Barlow Condensed typography outside

### Pain Points

| Problem                                                | Impact                                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Aesthetic whiplash** between wrapper and game scenes | Player feels two different products stitched together                                   |
| **Generic "dark game menu" look**                      | Forgettable — looks like any Phaser tutorial                                            |
| **No broadcast metaphor in scenes**                    | The WZMB 13 concept dies at the canvas edge                                             |
| **Mismatched typography**                              | Impact ≠ Barlow Condensed — different visual DNA                                        |
| **Same layout patterns everywhere**                    | Centered title → centered buttons → centered stats, every scene                         |
| **No narrative framing**                               | Menus are just menus — no fiction around why you're choosing a vehicle or seeing scores |

### Consequence

The broadcast wrapper is the most memorable part of ZombieSweep. But once the game loads, you're in a forgettable menu system. The fiction evaporates. The game loses its strongest differentiator exactly when it should be reinforcing it.

## Desired Outcome

Every Phaser scene should feel like a **broadcast segment** — the Welcome is a breaking news intro, vehicle select is a field correspondent's equipment report, difficulty is a threat level advisory, score summary is an end-of-day news recap, game over is either a victory broadcast or emergency signal lost.

Players should feel like they're _inside_ the broadcast, not just surrounded by it.

## Affected Scenes

1. **WelcomeScene** — The "cold open" / breaking news intro
2. **VehicleSelectScene** — Fleet selection / field equipment briefing
3. **DifficultySelectScene** — Threat level advisory
4. **ScoreSummaryScene** — End-of-day news recap / anchor desk report
5. **GameOverScene** — Final broadcast: victory wrap-up OR signal lost
6. **PauseMenu** — Technical difficulties / standby screen
7. **HUD** — Live broadcast overlay (lower third, data strip)

## Non-Goals

- **Not redesigning** the GameScene gameplay itself (physics, sprites, map rendering)
- **Not redesigning** the TrainingScene gameplay
- **Not changing** the HTML broadcast wrapper (it's already strong)
- **Not adding** new game mechanics or features
