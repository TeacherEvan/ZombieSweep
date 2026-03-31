# Jobcard — 2026-03-31 Evening Layout Fix

## Summary

Fixed the blank/black game area by correcting CSS grid sizing in `index.html`. Phaser was rendering the `WelcomeScene`, but the broadcast shell layout expanded to roughly 8,000px wide because grid children kept their max-content width contribution from the ticker/top-bar. Since `#app` used flex centering, the canvas was centered far off-screen, leaving only the dark screen background visible.

## Phases Completed

| Phase | Description                                                          | Status |
| ----- | -------------------------------------------------------------------- | ------ |
| 1     | Re-read current `WelcomeScene`, `animations`, boot, and layout files | ✅     |
| 2     | Reproduce blank screen in a fresh production preview                 | ✅     |
| 3     | Inspect live DOM/canvas metrics in browser                           | ✅     |
| 4     | Identify oversized grid track and off-screen canvas placement        | ✅     |
| 5     | Verify minimal CSS fix with live browser override                    | ✅     |
| 6     | Patch `index.html` with permanent layout fix                         | ✅     |
| 7     | Rebuild and visually validate corrected layout                       | ✅     |

## Files Changed

| File         | Action   | Description                                                                                                                 |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------------------------- |
| `index.html` | Modified | Added `.broadcast > * { min-width: 0; }` so grid children can shrink to viewport width and keep the Phaser canvas on-screen |

## Test Results

- Build: `npm run build` — ✅ success
- Browser verification: fresh Vite preview on `http://localhost:4181/` — ✅ welcome screen visible
- Layout sanity check: `window.innerWidth`, `body.scrollWidth`, `.screen-area`, and `#app` all measured `801px` wide after the fix

## Next Steps

- Check the deployed Vercel build once it updates to confirm the same layout behavior in production
- Spot-check other scenes to ensure menus and gameplay remain properly centered across viewport sizes
- Remove any temporary local debugging snippets if additional diagnostics were left behind elsewhere

## Recommendations

- Keep `min-width: 0` in mind whenever long ticker/chyron content lives inside grid or flex shells
- For future blank-screen investigations, inspect canvas bounding boxes early — rendering can succeed while layout still hides the result
- Prefer validating suspected CSS fixes with live browser metrics before editing files

## Potential Enhancements

- Add a lightweight Playwright/browser smoke check that asserts the canvas remains within the viewport bounds
- Consider setting explicit `min-width: 0` on other broadcast-shell children preemptively for layout resilience
- Add a small developer-only diagnostic mode that logs canvas and container bounds during boot
