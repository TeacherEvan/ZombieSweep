# ZombieSweep — Pre-Launch Checklist

**Version:** 0.1.0
**Target:** Production (Vercel)
**Branch:** `feature/npc-town-ecosystem` → `main`

---

## Code Quality ✅

- [x] All tests pass (356/356)
- [x] Lint: 0 errors, 11 warnings (pre-existing, non-blocking)
- [x] Format: Prettier compliant
- [x] TypeScript: Strict mode, no errors
- [x] Build: Production bundle generated
- [x] Security audit: 0 vulnerabilities (`npm audit --audit-level=high`)

---

## Security ✅

- [x] CSP header configured (index.html meta tag)
- [x] Security headers via Vercel (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- [x] Multiplayer server: Rate limiting (5 conn/IP, 30 msg/sec), payload limit (16KB), input validation
- [x] No secrets in codebase (`.env.example` template only)
- [x] Dependencies audited and patched

---

## Observability ✅

- [x] Structured JSON logging (client + server)
- [x] Correlation IDs on all requests
- [x] RED metrics: connections, messages, errors, latency (p50/p95/p99)
- [x] Client error capture: unhandled exceptions, rejections, component stacks
- [x] Performance observers: paint timing, navigation timing
- [x] Game loop metrics: FPS, frame time, step phases
- [x] Server graceful shutdown with final metrics dump

---

## Infrastructure ✅

- [x] Vercel configuration (vercel.json)
- [x] GitHub Actions CI pipeline (lint → typecheck → test → build → security-audit)
- [x] Multiplayer relay server (WebSocket, ws://0.0.0.0:2567)
- [x] Asset caching headers (1 year immutable for /assets/)
- [x] Health check: `GET /` returns 200 with game HTML

---

## Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `onlineCoop` | OFF | Enable CO-OP multiplayer |
| `onlineVersus` | OFF | Enable VERSUS multiplayer |
| `debugMetrics` | DEV only | Exposes `__ZOMBIESWEEP_OBSERVABILITY__` in console |

---

## Rollout Plan

```
1. DEPLOY to staging (auto on PR merge)
   └── Manual smoke test: welcome → vehicle select → difficulty → game → game over

2. DEPLOY to production (feature flags OFF)
   └── Verify: health check, error rate, latency

3. ENABLE onlineCoop for team (5% of users)
   └── Monitor 24h: WS connections, error rate, latency p95

4. ENABLE onlineVersus for team (5%)
   └── Monitor 24h

5. GRADUAL ROLLOUT: 25% → 50% → 100%
   └── At each step: verify thresholds (see below)
```

---

## Rollback Thresholds

| Metric | Green (advance) | Yellow (hold) | Red (rollback) |
|--------|-----------------|---------------|----------------|
| Error rate | ≤ baseline × 1.1 | ≤ baseline × 2 | > baseline × 2 |
| WS p99 latency | ≤ 200ms | ≤ 500ms | > 500ms |
| Client JS errors | 0 new types | < 0.1% sessions | > 0.1% sessions |
| FPS (p50) | ≥ 55 | ≥ 30 | < 30 |

---

## Rollback Procedure

### Feature Flag Rollback (< 1 min)
```bash
# In Vercel dashboard or via CLI
vercel env add VITE_ONLINE_COOP false
vercel env add VITE_ONLINE_VERSUS false
vercel --prod
```

### Full Version Rollback (< 5 min)
```bash
# Option 1: Vercel instant rollback
vercel rollback [deployment-url]

# Option 2: Git revert + redeploy
git revert HEAD
git push origin main
```

### Database Considerations
- No database migrations in this release
- Multiplayer state is ephemeral (in-memory relay)
- No persistent user data changes

---

## Post-Launch Monitoring (First 60 min)

- [ ] Health endpoint returns 200
- [ ] Error monitoring: no new error types
- [ ] Latency dashboard: p95 < 200ms
- [ ] Critical path: welcome → game → game over works
- [ ] Logs flowing (check Vercel function logs)
- [ ] Rollback tested (dry run feature flag toggle)

---

## Communication

- [ ] Team notified of deployment
- [ ] On-call schedule confirmed
- [ ] Runbook linked in deployment notes

---

## Sign-Off

| Role | Name | Approved |
|------|------|----------|
| Engineer | | ☐ |
| QA | | ☐ |
| Product | | ☐ |

---

*Generated: $(date)*