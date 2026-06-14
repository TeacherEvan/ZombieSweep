## Summary

Added the first browser **versus** branch on top of the host-authoritative multiplayer relay. The online flow is now mode-aware, letting players launch either co-op or an asymmetric driver-vs-rival score race without destabilizing the existing route architecture.

## Phases Completed

1. Extended the relay protocol/runtime to track multiplayer mode, versus scoreboards, and match-result payloads.
2. Updated `OnlineCoopScene` into a neutral online-play console with a co-op/versus mode toggle and mode-aware status text.
3. Wired `DifficultySelectScene` and `GameScene` for versus launch, rival scoring, shared-route scoreboard syncing, and host-driven match resolution.
4. Added a dedicated versus result presentation to `GameOverScene` and covered the core rules with new tests.

## Files Changed

- `README.md`
- `.github/jobcards/jobcard-2026-04-05-late-night.md`
- `server/multiplayer-server.mjs`
- `src/network/protocol.ts`
- `src/network/runtime.ts`
- `src/network/versus-rules.ts`
- `src/network/versus-rules.test.ts`
- `src/scenes/DifficultySelectScene.ts`
- `src/scenes/GameOverScene.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/OnlineCoopScene.ts`
- `src/scenes/WelcomeScene.ts`
- `/home/ewaldt/.copilot/session-state/6970bd9e-0482-4a0b-aa1a-f936efc4be98/plan.md`

## Test Results

- `npm test`
- `npm run build`

## Next Steps

1. Start the dedicated architecture/design work for full second-rider co-op.
2. Decide whether future versus work should stay asymmetric or eventually branch into mirrored-route competition.
3. Add broader multiplayer continuity through intermission scenes if versus rematches or multi-round sessions become a priority.

## Recommendations

- Keep the current versus ruleset tight and readable instead of adding multiple competitive variants immediately.
- Continue to treat the browser relay flow as the source of truth before attempting desktop packaging.

## Potential Enhancements

- Rival-specific sabotage abilities beyond pure remote combat scoring.
- Multi-round versus rematches with score carryover.
- Mode-aware result breakdowns in score summary and training/intermission flows.
