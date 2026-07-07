/**
 * Pure coordinate projection for the 3D bridge.
 *
 * The 2D `GameScene` camera (Phaser orthographic, scroll + zoom) is the source
 * of truth. This module converts a Phaser WORLD point into a Three.js world
 * point through an intermediate SCREEN (canvas pixel) space, so a matched
 * orthographic Three camera renders meshes in pixel-perfect positional parity
 * with the 2D sprites. No WebGL context required — these functions are pure and
 * fully unit-testable in node.
 */

export interface OrthoConfig {
  /** Viewport width in CSS pixels (Phaser canvas width). */
  viewWidth: number;
  /** Viewport height in CSS pixels (Phaser canvas height). */
  viewHeight: number;
  /** Three world units per screen pixel. 1 → 1:1 parity. */
  unitsPerPixel: number;
}

export interface CameraView {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Build a matched orthographic config for a viewport, 1:1 by default. */
export function defaultOrthoConfig(
  viewWidth: number,
  viewHeight: number,
  unitsPerPixel = 1
): OrthoConfig {
  return { viewWidth, viewHeight, unitsPerPixel };
}

/**
 * Phaser world point -> screen (canvas pixel) point for an orthographic camera
 * that zooms about the viewport origin. Pure; the bridge supplies scroll/zoom
 * read from `cameras.main`.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  scrollX: number,
  scrollY: number,
  zoom: number
): Vec2 {
  return {
    x: (worldX - scrollX) * zoom,
    y: (worldY - scrollY) * zoom,
  };
}

/**
 * Screen (canvas pixel, y-down) -> Three world (y-up, origin at viewport
 * center, scaled by `unitsPerPixel`).
 */
export function screenToThree(screenX: number, screenY: number, cfg: OrthoConfig): Vec3 {
  return {
    x: (screenX - cfg.viewWidth / 2) * cfg.unitsPerPixel,
    y: (cfg.viewHeight / 2 - screenY) * cfg.unitsPerPixel,
    z: 0,
  };
}

/**
 * Three world -> screen (canvas pixel). Inverse of {@link screenToThree}.
 */
export function threeToScreen(threeX: number, threeY: number, cfg: OrthoConfig): Vec2 {
  return {
    x: threeX / cfg.unitsPerPixel + cfg.viewWidth / 2,
    y: cfg.viewHeight / 2 - threeY / cfg.unitsPerPixel,
  };
}

/**
 * Phaser world point -> Three world point, composing {@link worldToScreen}
 * then {@link screenToThree}. `cam` is the live Phaser camera view.
 */
export function worldToThree(
  worldX: number,
  worldY: number,
  cam: CameraView,
  cfg: OrthoConfig
): Vec3 {
  const screen = worldToScreen(worldX, worldY, cam.scrollX, cam.scrollY, cam.zoom);
  return screenToThree(screen.x, screen.y, cfg);
}
