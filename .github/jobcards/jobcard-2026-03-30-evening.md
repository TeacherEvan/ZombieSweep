# Jobcard — 2026-03-30 Evening

## Summary

Redesigned the `index.html` wrapper page with a distinctive **"WZMB 13 News Broadcast"** aesthetic — the game now plays inside a simulated live TV news broadcast frame. The concept ties together the newspaper-delivery gameplay, 1980s Paperboy nostalgia, and zombie horror genre into a cohesive, memorable visual identity.

## Phases Completed

1. **Design direction** — Chose "Evening News Broadcast" as the bold aesthetic concept: the game canvas is framed as live footage on a fictional TV station (WZMB Channel 13, Tri-County Emergency Broadcast Network).
2. **HTML/CSS implementation** — Complete rewrite of `index.html` with:
   - Station ident block (WZMB 13 NEWS) with red angled clip-path
   - BREAKING NEWS ribbon with pulse animation
   - Live clock showing real date/time (updates every second)
   - LIVE indicator with blinking red dot + glow
   - Fullscreen toggle button
   - CRT scanline overlay + vignette on the game canvas
   - Scrolling news ticker with 8 themed zombie-report headlines
   - Loading overlay with "ACQUIRING SATELLITE FEED" + channel-switch dismissal animation
   - Responsive breakpoints for small screens
   - Reduced motion support
   - Barlow Condensed (Google Fonts) for broadcast typography
   - SVG favicon (red circle with "Z")
3. **BootScene integration** — Added loading overlay dismissal with channel-switch animation when the game is ready.
4. **Verification** — TypeScript compiles, all 253 tests pass, production build succeeds.

## Files Changed

| File                      | Change                                                    |
| ------------------------- | --------------------------------------------------------- |
| `index.html`              | Complete rewrite — broadcast wrapper with embedded CSS/JS |
| `src/scenes/BootScene.ts` | Added loading overlay dismissal in `create()`             |

## Test Results

- **253 tests passed** across 15 test files
- **0 failures**
- Production build: ✓ (1.02s)

## Design Decisions

- **Color palette**: Dark blue-black chrome (#070a10) contrasts with the game's warm dark (#0d0d0d), creating depth — like viewing a TV screen that's warmer than the surrounding equipment
- **Typography**: Barlow Condensed — a condensed grotesque common in broadcast/sports graphics, not overused in web design
- **Ticker headlines**: 8 in-universe zombie-themed news reports that reinforce worldbuilding
- **Scanlines**: Very subtle (4% opacity) repeating gradient — atmospheric without interfering with gameplay
- **Loading screen**: "Viewer discretion advised" disclaimer sells the broadcast fiction

## Next Steps

- Consider adding a mute/volume toggle that interfaces with Phaser's sound manager
- Potential: subtle VHS tracking glitch animation (very rare, every ~15s)
- Could add keyboard shortcut for fullscreen (F key)

## Recommendations

- The broadcast frame adds ~80px of vertical chrome — test on smaller screens to ensure game canvas still has adequate space
- Consider caching Google Font locally for offline play scenarios

## Potential Enhancements

- Animated station logo transition between scenes
- "SIGNAL LOST" effect when game pauses
- Dynamic ticker that inserts real game events ("BREAKING: Player eliminates 15 zombies on Maple Grove")
