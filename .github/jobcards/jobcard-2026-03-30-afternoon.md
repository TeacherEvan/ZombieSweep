# Jobcard — 2026-03-30 Afternoon

## Summary

Completed git hygiene, test enhancement, documentation, and initial commit for the ZombieSweep project. Enhanced all 15 test files with practical, behavior-focused tests — expanding coverage from 182 to 253 tests. Created .gitignore, copilot instructions, and committed 53 clean files to `main`.

## Phases Completed

### Phase 1: Git Review & Hygiene

- Audited staged files — found ~3200 `node_modules/` + `dist/` files incorrectly staged
- Created `.gitignore` excluding node_modules, dist, .vscode, coverage, OS files
- Ran `git rm -r --cached node_modules/` and `git rm -r --cached dist/` to unstage
- Reduced staging area from 3255 to 52 clean source files

### Phase 2: Copilot Instructions

- Created `.github/copilot-instructions.md` with:
  - Tech stack, architecture diagram, conventions
  - Code style rules, key game rules, testing approach
  - Build/deploy notes, npm IPv4 workaround
  - Jobcard Protocol for future agents

### Phase 3: Test Enhancement (182 → 253 tests)

Enhanced all 15 test files with practical gameplay-scenario tests:

| File                 | Before | After | Key Additions                                                                |
| -------------------- | ------ | ----- | ---------------------------------------------------------------------------- |
| constants.test.ts    | 28     | 44    | Cross-constant relationships, house damage, zombie damage comparisons        |
| GameState.test.ts    | 30     | 34    | Game-over priority, full-day scenarios                                       |
| ScoreManager.test.ts | 17     | 21    | Multi-penalty drain, Hard Way day simulation, life bonus                     |
| DayManager.test.ts   | 11     | 15    | Map progression curve, Sunday penalty, density validation                    |
| vehicles.test.ts     | 8      | 14    | Ollie flag, ammo positivity, weapon type specifics, tradeoffs                |
| difficulty.test.ts   | 6      | 9     | Max density, positive multipliers, density range                             |
| Weapon.test.ts       | 9      | 12    | Drained weapon recovery, melee-vs-ranged tradeoff, all-vehicle melee damage  |
| Zombie.test.ts       | 9      | 15    | Exact-HP kill, overkill floor, points ordering, speed ordering, ranged flags |
| Citizen.test.ts      | 7      | 11    | Cross-citizen rules, penalty ranking, pickup drops, position                 |
| House.test.ts        | 14     | 18    | Difficulty escalation, breakable coverage, combined state                    |
| Hazard.test.ts       | 12     | 16    | Lethality classification, ollie advantage, type uniqueness                   |
| Newspaper.test.ts    | 6      | 9     | Sunday speed comparison, left/right equality, position                       |
| Pickup.test.ts       | 7      | 10    | Idempotent collection, type coverage, position                               |
| MapConfig.test.ts    | 11     | 14    | Street narrowness, density escalation, display names                         |
| MapGenerator.test.ts | 7      | 11    | Deterministic structure, sub/non-sub partition, difficulty extremes          |

### Phase 4: Commit

- Staged all 53 files (52 source + 1 jobcard)
- Committed: `feat: initial ZombieSweep implementation with full TDD coverage`
- Commit hash: `9d10269`

## Test Results

```
 Test Files  15 passed (15)
      Tests  253 passed (253)
   Duration  1.51s
```

## Next Steps

1. **Add git remote**: No remote is configured. Run:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. **Vercel deployment**: Connect repo to Vercel for auto-deploy from `dist/`
3. **Asset pipeline**: Add sprite sheets, tilemap assets, audio for Phaser scenes
4. **Integration testing**: Browser-based scene flow testing with Playwright or Cypress
5. **CI/CD**: Add GitHub Actions for `npm test` + `npm run build` on PR

## Recommendations

- **Keep TDD discipline**: Every new pure-logic module should have a co-located `.test.ts` file
- **npm IPv4**: Continue using `--prefer-ipv4` flag on this machine
- **Scene testing**: Phaser scenes should be tested in-browser, not with Vitest
- **Sunday paper mechanic**: Current speed multiplier is 0.6x — consider playtesting for feel

## Potential Enhancements

- **Subscriber attrition**: Damaged houses lose subscriptions; undelivered houses risk cancellation
- **Boss zombies**: End-of-week boss encounters (day 7)
- **Combo scoring**: Chain deliveries + kills for streak multipliers
- **Weather system**: Rain/fog affecting visibility and throw accuracy
- **Leaderboard**: Vercel Edge Functions for persistent high scores
- **Mobile controls**: Touch input support via Phaser's input plugin
- **Sound design**: Newspaper throw SFX, zombie growls, delivery chimes
