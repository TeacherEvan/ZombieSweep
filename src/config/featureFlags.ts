export const FEATURE_FLAGS = {
  onlineCoop: import.meta.env.VITE_ONLINE_COOP === 'true',
  onlineVersus: import.meta.env.VITE_ONLINE_VERSUS === 'true',
  // Default ON: the 3D layer is the primary renderer. Disable explicitly with
  // VITE_RENDER3D=false (or any falsy string). WebGL-unavailable still degrades
  // to 2D (see Render3DManager.create()).
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
