import * as THREE from 'three';

/**
 * Shared-resource marker for the 3D bridge meshes.
 *
 * Several mesh factories (`WeaponMeshFactory`, `PlayerMeshFactory`,
 * `CitizenMeshFactory`, `HazardMeshFactory`, and `EffectsBridge`'s fallback
 * projectile) define their materials/geometries as module-level singletons that
 * are reused by EVERY mesh instance. Disposing those when an individual mesh is
 * removed would free a resource still referenced by other live meshes — causing
 * GPU re-upload churn and potential flicker on the hottest path (projectiles).
 *
 * Mark a shared geometry/material with {@link markShared}; {@link disposeObject3D}
 * then skips it, so only genuinely per-mesh resources are freed on removal.
 */
export type BridgeKey = string | number | object;

/** Tag a geometry/material as a shared singleton that must survive mesh removal. */
export function markShared<T extends THREE.BufferGeometry | THREE.Material>(res: T): T {
  res.userData = { ...(res.userData as Record<string, unknown>), shared: true };
  return res;
}

function isSharedResource(res: { userData?: Record<string, unknown> } | null | undefined): boolean {
  return !!res?.userData?.shared;
}

/** Dispose a mesh subtree, skipping any geometry/material marked shared. */
export function disposeObject3D(root: THREE.Object3D): void {
  root.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (!isSharedResource(obj.geometry)) obj.geometry.dispose();
    const mat = obj.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => {
        if (!isSharedResource(m)) m.dispose();
      });
    } else if (!isSharedResource(mat)) {
      mat.dispose();
    }
  });
}
