# Character Visual Enhancement — Player & Zombies Design

**Date:** 2026-07-13
**Scope:** Enhance `PlayerMeshFactory` (main character) and `ZombieMeshFactory` (3 types + elite variants). Citizens are OUT of scope (deferred).

**Goal:** Make the player read as a recognizable newspaper-courier and make zombies feel detailed/grotesque with elite variants that are dramatically distinct — without breaking the existing 3D animation rig or 2D fallback.

## Constraints (non-negotiable, inherited from existing graphics plan)
- No new npm runtime dependencies.
- `VITE_RENDER3D=false` / 2D path is UNTOUCHED — we only modify 3D mesh factories. Zero regression to 2D gameplay.
- Every mesh factory keeps a co-located `*.test.ts`. New parts must not break existing named-part assertions (`visor`, `acidSac`, `torso`, `head`, `armL/R`, `legL/R`, `wheel`, `deck`).
- Shared materials via existing `markShared()` helper (module singletons) so `disposeObject3D` never frees them and we avoid GPU leak.
- `AnimationRig` animates by **child name**. All currently-named parts must be preserved with identical names so walk/pedal/panic animations keep working. New decorative parts get their own names and are ignored by the rig (safe).
- Reduced-motion path is unaffected (it governs post-FX/particles, not static mesh geometry).

## Player (`PlayerMeshFactory.ts`)
Enhance `addRider()` (shared by all 3 vehicles) so the courier identity is clear:
- **Cap** (named `cap`): small box/sphere on head — courier look.
- **Satchel / newspaper bag** (named `satchel`): a slung box on the back/torso — sells "newspaper delivery".
- **Face**: a subtle nose box + simple goggles (named `goggles`) so the head isn't a blank sphere.
- Keep `torso`, `head`, `armL/R`, `legL/R`, `helmet` names. Rider detail added as EXTRA named children only.
- Vehicle meshes (bicycle/skateboard/rollerblades) unchanged except they inherit the richer rider.

Tests: assert `cap`, `satchel`, `goggles` named children exist on each vehicle mesh; existing `torso`/`wheel`/`deck` assertions still pass.

## Zombies (`ZombieMeshFactory.ts`)
Enhance `addCore()` (shared by all 3 types) + per-type meshes:

### Gore / detail (all zombies, both elite & non-elite)
- **Sunken eyes** (named `eyeL`, `eyeR`): two dark recessed spheres on the head.
- **Teeth / jaw detail** (named `teeth`): a small white strip in the jaw.
- **Dangling arm variant**: one arm (`armL` or `armR`) angled down/outward (zombie posture) — already has arms; adjust rotation so it reads as decayed reach.
- Keep `torso`, `head`, `jaw`, `armL/R`, `hand`, `rib` names.

### Elite variants — dramatically distinct (replace the current flat `addEliteVisor` + 1.25× scale)
Elite (boolean) now applies a richer treatment via a new `addEliteDetails(group, headY)`:
- **Glowing eyes** (named `eyeGlowL/R`): emissive red spheres — pulse handled by AnimationRig (add `eyeGlowL/R` pulsation alongside existing `visor`).
- **Bulkier silhouette**: scale `torso` wider (not whole-group 1.25× — instead scale specific parts so the rig still works) OR keep a modest group scale (1.2×) but ADD bulk.
- **Darker, desaturated palette**: elite uses a darker body material.
- **Exposed entrails** (named `entrails`): a dark red twisted tube/box at the torso — clear "elite" tell.
- **Red visor retained** (named `visor`) for continuity + pulsation.
- Non-elite: NO `visor`, NO `eyeGlow`, NO `entrails` (preserves existing test "non-elite has no visor").

Tests:
- Non-elite shambler still has NO `visor` (existing test preserved).
- Elite shambler HAS `visor` AND `eyeGlowL` AND `entrails` (new).
- Elite is visually larger (bounding box max.y / volume greater than non-elite) — strengthen existing runner-height test analog for elite.
- All 3 types dispatch via `createZombieMeshForType` (existing test preserved).

## Files
- Modify: `src/three/bridges/PlayerMeshFactory.ts`
- Modify: `src/three/bridges/ZombieMeshFactory.ts`
- Modify: `src/three/bridges/PlayerMeshFactory.test.ts` (add courier-detail assertions)
- Modify: `src/three/bridges/ZombieMeshFactory.test.ts` (add gore + elite-detail assertions)
- Modify (optional, if eye-glow pulse desired): `src/three/bridges/AnimationRig.ts` (add `eyeGlowL/R` pulsation in `animateZombieWalk`)

## Out of scope (deferred)
- Citizen meshes (FriendlyNeighbor/PanickedRunner/ArmedSurvivalist).
- 2D sprite fallback improvements.
- New geometry primitives requiring external assets.

## Verification
- `npm run test` — all factory + rig tests pass.
- `npm run lint` and `npm run build` clean.
- Live: start dev server, confirm 3D layer renders player + zombies with new detail; `VITE_RENDER3D=false` yields identical 2D.
