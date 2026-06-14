export const FEATURE_FLAGS = {
  onlineCoop: import.meta.env.VITE_ONLINE_COOP === 'true',
  onlineVersus: import.meta.env.VITE_ONLINE_VERSUS === 'true',
  debugMetrics: import.meta.env.DEV,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

export function getFeatureFlags() {
  return { ...FEATURE_FLAGS };
}
