## Summary

Stabilized the current browser co-op route slice by replacing prompt-based relay setup with a scene-native console, expanding runtime session state, and giving the gunner explicit target selection plus clearer disconnect recovery. This turns the driver/gunner mode into a cleaner desktop-browser feature instead of a brittle prototype flow.

## Phases Completed

1. Added scene-native relay URL and room code fields with host, join, disconnect, and back actions in `OnlineCoopScene`.
2. Expanded co-op runtime metadata so lobby and match flows can track phase and human-readable session status.
3. Refined `GameScene` co-op behavior with targeted gunner actions, on-screen reticle feedback, and safer disconnect fallback for driver and gunner roles.
4. Added pure targeting tests for stable gunner target resolution and cycling.

## Files Changed

- `README.md`
- `.github/jobcards/jobcard-2026-04-05-evening.md`
- `src/network/coop-targeting.ts`
- `src/network/coop-targeting.test.ts`
- `src/network/protocol.ts`
- `src/network/runtime.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/OnlineCoopScene.ts`
- `src/ui/broadcast-styles.ts`

## Test Results

- `npm test`
- `npm run build`

## Next Steps

1. Extend the same co-op session polish into intermission scenes so host/gunner handoff stays coherent beyond the route.
2. Replace the current driver/gunner snapshot model with richer scene-specific state once versus mode and fuller second-rider plans are ready.
3. Tune gunner target UX further with dedicated aim widgets or mouse-driven selection if desktop-only control depth becomes a priority.

## Recommendations

- Keep the current host-authoritative split: driver owns movement and route state, gunner owns combat support requests.
- Continue storing co-op UX state in the runtime registry so scenes can recover cleanly after disconnects and menu returns.

## Potential Enhancements

- Mouse-driven gunner targeting or soft-lock priority rules.
- Intermission-ready co-op sync for training, score summary, and game over flows.
- Lobby niceties like relay history, reconnect shortcuts, and role-ready indicators.
