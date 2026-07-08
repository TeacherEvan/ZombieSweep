import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, isFeatureEnabled } from './featureFlags';

// The render3d flag is read from VITE_RENDER3D at import time. The suite is
// run both with it OFF (default `npm run test`) and ON (`npm run test:3d`).
// Assert the ACTUAL resolved value rather than a hard-coded false so the
// entire suite stays green under both modes (design P5.1/P5.3).
const render3dExpected = (import.meta.env.VITE_RENDER3D ?? '') === 'true';

describe('FEATURE_FLAGS', () => {
  it('render3d matches the injected env (off by default, on under test:3d)', () => {
    expect(FEATURE_FLAGS.render3d).toBe(render3dExpected);
    expect(isFeatureEnabled('render3d')).toBe(render3dExpected);
  });

  it('gameplay/3d flags preserve their env-resolved default', () => {
    expect(FEATURE_FLAGS.onlineCoop).toBe(false);
    expect(FEATURE_FLAGS.onlineVersus).toBe(false);
    expect(FEATURE_FLAGS.render3d).toBe(render3dExpected);
  });
});
