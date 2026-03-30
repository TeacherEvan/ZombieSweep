# Jobcard — 2026-03-30 Evening (Polish)

## Summary

Eliminated all remaining pre-broadcast font/color references from BootScene and TrainingScene. The entire codebase now uses Barlow Condensed (BROADCAST_FONT) and BC color constants consistently — zero Impact or Courier New references remain.

## Phases Completed

1. Audited all source files for old-style font/color references
2. Updated BootScene loading bar: Impact → BROADCAST_FONT, hardcoded hex → BC constants
3. Updated TrainingScene header, subtitle, and timer: Impact/Courier New → BROADCAST_FONT, hardcoded colors → BC constants
4. Verified build + tests clean

## Files Changed

| File                          | Action   | Description                                                                                                                                             |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/scenes/BootScene.ts`     | Modified | Import broadcast-styles, replace Impact font with BROADCAST_FONT, replace 0x141418/0xcc1100/0xff3300 with BC.CHROME/BC.RED/BC.RED_GLOW                  |
| `src/scenes/TrainingScene.ts` | Modified | Import broadcast-styles, replace Impact/Courier New fonts with BROADCAST_FONT, replace hardcoded colors with BC.css.GOLD/BC.TEXT_DIM/BC.TEXT/BC.css.RED |

## Test Results

- 257 tests passed across 16 test files
- 0 failures
- Build: `tsc && vite build` — clean success

## Verification

```
grep -rn "Impact\|Courier New" src/ --include="*.ts" | grep -v .test.ts
→ (no output — zero matches)
```

## Next Steps

- Visual QA in browser (`npm run dev`)
- Consider art/audio assets for gameplay polish
