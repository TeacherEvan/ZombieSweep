export const FEATURE_FLAGS = {
  onlineCoop: import.meta.env.VITE_ONLINE_COOP === 'true',
  onlineVersus: import.meta.env.VITE_ONLINE_VERSUS === 'true',
  // Default ON: the 3D layer is the primary renderer. The transparent-canvas
  // fix (main.ts T3) + mount wiring (Render3DManager T2) mean the WebGL world
  // now shows through the Phaser canvas instead of painting black over it.
  // Roll back with VITE_RENDER3D=false; WebGL-unavailable already degrades to
  // 2D with zero regression.
  render3d: (import.meta.env.VITE_RENDER3D ?? 'true') === 'true',
  debugMetrics: import.meta.env.DEV,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

export function getFeatureFlags() {
  return { ...FEATURE_FLAGS };
}
