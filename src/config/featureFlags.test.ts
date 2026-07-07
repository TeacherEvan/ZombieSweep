import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from './featureFlags';

describe('FEATURE_FLAGS', () => {
  it('render3d is present and OFF by default (no env override)', () => {
    expect(FEATURE_FLAGS.render3d).toBe(false);
    expect(isFeatureEnabled('render3d')).toBe(false);
  });

  it('all three gameplay/3d flags default to off before any env injection', () => {
    expect(FEATURE_FLAGS.onlineCoop).toBe(false);
    expect(FEATURE_FLAGS.onlineVersus).toBe(false);
    expect(FEATURE_FLAGS.render3d).toBe(false);
  });
});
