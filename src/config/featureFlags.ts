export const FEATURE_FLAGS = {
  onlineCoop: import.meta.env.VITE_ONLINE_COOP === 'true',
  onlineVersus: import.meta.env.VITE_ONLINE_VERSUS === 'true',
  // Default OFF: the 2D broadcast backdrop is the proven, reliable renderer.
  // The 3D layer (primary-renderer intent) currently fails to paint in some
  // deployments (blank WebGL canvas behind a transparent Phaser canvas ->
  // black playfield). Re-enable explicitly with VITE_RENDER3D=true once the 3D
  // layer reliably renders. WebGL-unavailable already degrades to 2D.
  render3d: (import.meta.env.VITE_RENDER3D ?? 'false') === 'true',
  debugMetrics: import.meta.env.DEV,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

export function getFeatureFlags() {
  return { ...FEATURE_FLAGS };
}
