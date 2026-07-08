import type * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { CitizenBridge } from './CitizenBridge';
import { defaultOrthoConfig } from '../projection';

const makeScene = () =>
  ({ add: () => {}, remove: () => {}, children: [] }) as unknown as THREE.Scene;

describe('CitizenBridge', () => {
  it('creates without error', () => {
    expect(() => new CitizenBridge(makeScene(), defaultOrthoConfig(960, 540, 1))).not.toThrow();
  });
  it('update with empty source does not throw', () => {
    const b = new CitizenBridge(makeScene(), defaultOrthoConfig(960, 540, 1));
    expect(() =>
      b.update({ source: [], cam: { scrollX: 0, scrollY: 0, zoom: 1 }, dt: 16, host: makeScene() })
    ).not.toThrow();
  });
});
