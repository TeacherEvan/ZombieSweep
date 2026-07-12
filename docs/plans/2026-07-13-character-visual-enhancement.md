# Character Visual Enhancement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task. Each task = write failing test → watch fail → implement → watch pass → commit.

**Design doc:** `docs/plans/2026-07-13-character-visual-enhancement-design.md`
**Scope:** Player (`PlayerMeshFactory`) + Zombies (`ZombieMeshFactory`) only. Citizens deferred.

**Global Constraints:**
- No new npm deps.
- `VITE_RENDER3D=false` / 2D path untouched.
- Preserve all existing named child parts (`visor`, `acidSac`, `torso`, `head`, `armL/R`, `legL/R`, `wheel`, `deck`, `jaw`, `rib`, `hand`). AnimationRig depends on these.
- Shared materials via `markShared()`.
- Each factory keeps co-located `*.test.ts`.

---

## Task 1: Player courier details (`PlayerMeshFactory.ts`)

**Files:** Modify `src/three/bridges/PlayerMeshFactory.ts`, `src/three/bridges/PlayerMeshFactory.test.ts`

**Step 1 — Write failing tests** (append to `PlayerMeshFactory.test.ts`):
```typescript
describe('player courier details', () => {
  it('rider has a cap', () => {
    expect(createBicycleMesh().children.find(c => c.name === 'cap')).toBeDefined();
  });
  it('rider has a satchel (newspaper bag)', () => {
    expect(createBicycleMesh().children.find(c => c.name === 'satchel')).toBeDefined();
  });
  it('rider has goggles', () => {
    expect(createBicycleMesh().children.find(c => c.name === 'goggles')).toBeDefined();
  });
  it('all vehicles carry cap + satchel + goggles', () => {
    [createBicycleMesh(), createSkateboardMesh(), createRollerBladesMesh()].forEach(g => {
      expect(g.children.find(c => c.name === 'cap')).toBeDefined();
      expect(g.children.find(c => c.name === 'satchel')).toBeDefined();
      expect(g.children.find(c => c.name === 'goggles')).toBeDefined();
    });
  });
  it('existing torso + wheel parts still present', () => {
    const g = createBicycleMesh();
    expect(g.children.find(c => c.name === 'torso')).toBeDefined();
    expect(g.children.filter(c => c.name === 'wheel').length).toBeGreaterThanOrEqual(2);
  });
});
```

**Step 2 — Run, expect FAIL** (`npx vitest run src/three/bridges/PlayerMeshFactory.test.ts`).

**Step 3 — Implement** in `addRider(group, baseY)`: after `helmet`, add:
- `cap`: `MeshStandardMaterial` (shared, courier color e.g. 0x6b7280) box on head top.
- `satchel`: shared-material box slung at torso side/back; name `satchel`.
- `goggles`: shared dark-material thin box across eyes; name `goggles`.
Add new shared MAT entries (`cap`, `goggles`, `satchel`).

**Step 4 — Run, expect PASS.**

**Step 5 — Commit:**
```bash
git add src/three/bridges/PlayerMeshFactory.ts src/three/bridges/PlayerMeshFactory.test.ts
git commit -m "feat(3d): player courier details (cap, satchel, goggles)"
```

---

## Task 2: Zombie gore details (`ZombieMeshFactory.ts`)

**Files:** Modify `src/three/bridges/ZombieMeshFactory.ts`, `src/three/bridges/ZombieMeshFactory.test.ts`

**Step 1 — Write failing tests** (append to `ZombieMeshFactory.test.ts`):
```typescript
describe('zombie gore details', () => {
  it('shambler has sunken eyes (eyeL, eyeR)', () => {
    const g = createShamblerMesh(false);
    expect(g.children.find(c => c.name === 'eyeL')).toBeDefined();
    expect(g.children.find(c => c.name === 'eyeR')).toBeDefined();
  });
  it('shambler has teeth', () => {
    expect(createShamblerMesh(false).children.find(c => c.name === 'teeth')).toBeDefined();
  });
  it('non-elite still has no visor (regression guard)', () => {
    expect(createShamblerMesh(false).children.find(c => c.name === 'visor')).toBeUndefined();
  });
});
```

**Step 2 — Run, expect FAIL.**

**Step 3 — Implement** in `addCore()`: after `head`/`jaw`, add:
- `eyeL`/`eyeR`: small dark `MeshStandardMaterial` spheres recessed into head front.
- `teeth`: thin off-white box in jaw.
Preserve existing `torso`, `head`, `jaw`, `armL/R`, `hand`, `rib` names.

**Step 4 — Run, expect PASS.**

**Step 5 — Commit:**
```bash
git add src/three/bridges/ZombieMeshFactory.ts src/three/bridges/ZombieMeshFactory.test.ts
git commit -m "feat(3d): zombie gore details (sunken eyes, teeth)"
```

---

## Task 3: Richer elite zombie variants (`ZombieMeshFactory.ts`)

**Files:** Modify `src/three/bridges/ZombieMeshFactory.ts`, `src/three/bridges/ZombieMeshFactory.test.ts`, optionally `src/three/bridges/AnimationRig.ts`

**Step 1 — Write failing tests** (append):
```typescript
describe('elite zombie variants', () => {
  it('elite shambler has eyeGlow + entrails + visor', () => {
    const g = createShamblerMesh(true);
    expect(g.children.find(c => c.name === 'visor')).toBeDefined();
    expect(g.children.find(c => c.name === 'eyeGlowL')).toBeDefined();
    expect(g.children.find(c => c.name === 'entrails')).toBeDefined();
  });
  it('elite is larger than non-elite (bounding box)', () => {
    const elite = new THREE.Box3().setFromObject(createShamblerMesh(true));
    const normal = new THREE.Box3().setFromObject(createShamblerMesh(false));
    const vol = (b: THREE.Box3) => (b.max.x-b.min.x)*(b.max.y-b.min.y)*(b.max.z-b.min.z);
    expect(vol(elite)).toBeGreaterThan(vol(normal));
  });
  it('non-elite has no eyeGlow/entrails', () => {
    const g = createShamblerMesh(false);
    expect(g.children.find(c => c.name === 'eyeGlowL')).toBeUndefined();
    expect(g.children.find(c => c.name === 'entrails')).toBeUndefined();
  });
  it('all elite types carry eyeGlow + entrails', () => {
    [createRunnerMesh(true), createSpitterMesh(true)].forEach(g => {
      expect(g.children.find(c => c.name === 'eyeGlowL')).toBeDefined();
      expect(g.children.find(c => c.name === 'entrails')).toBeDefined();
    });
  });
});
```

**Step 2 — Run, expect FAIL.**

**Step 3 — Implement** — replace `addEliteVisor` with `addEliteDetails(group, headY)`:
- Keep `visor` (red, pulsating) for continuity.
- Add `eyeGlowL`/`eyeGlowR`: emissive red spheres (pulsate in AnimationRig).
- Add `entrails`: dark-red twisted box/tube at torso.
- Apply a modest group scale (e.g. 1.2×) AND a darker elite body palette for silhouette distinction.
- Non-elite path: none of these added.

Optional AnimationRig: in `animateZombieWalk`, add pulsation for `eyeGlowL`/`eyeGlowR` (mirror visor logic).

**Step 4 — Run, expect PASS.**

**Step 5 — Commit:**
```bash
git add src/three/bridges/ZombieMeshFactory.ts src/three/bridges/ZombieMeshFactory.test.ts src/three/bridges/AnimationRig.ts
git commit -m "feat(3d): richer elite zombie variants (glow eyes, entrails, bulk)"
```

---

## Task 4: Full verification

- `npm run test` — all pass.
- `npm run lint` clean.
- `npm run build` succeeds.
- Live (optional): `npm run dev` → confirm player + zombies render with new detail; `VITE_RENDER3D=false` identical 2D.
