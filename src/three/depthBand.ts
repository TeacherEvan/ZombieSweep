/**
 * Explicit depth-band mapping for the single 3D scene.
 *
 * The 2D `GameScene` uses a gameplay depth band of about -10..12. In the 3D
 * layer everything is reprojected onto a flat matched-ortho plane (z≈0), so we
 * give meshes a deterministic draw order via `renderOrder` plus a small z-offset
 * so the orthographic z-buffer still occludes correctly when depthTest is on.
 *
 * Lower `renderOrder` draws first (further back). Houses/ground sit at the back;
 * projectiles and gore particles render in front of them, consistent with the
 * 2D band ordering (e.g. houses depth -10..2, projectiles/effects ~4..12).
 */
export const DEPTH_BAND = {
  ground: 0,
  house: 1,
  player: 3,
  actor: 4,
  projectile: 5,
  particle: 6,
} as const;

export type DepthBand = keyof typeof DEPTH_BAND;

/**
 * Small world-unit z offsets. The matched orthographic camera looks toward -z,
 * so a larger z is closer to the camera (drawn in front). Front-most effects
 * get the largest z.
 */
export const DEPTH_Z_OFFSET = {
  ground: -4,
  house: -2,
  player: -0.5,
  actor: 0,
  projectile: 1,
  particle: 2,
} as const;

export function depthRenderOrder(band: DepthBand): number {
  return DEPTH_BAND[band];
}

export function depthZOffset(band: DepthBand): number {
  return DEPTH_Z_OFFSET[band];
}
