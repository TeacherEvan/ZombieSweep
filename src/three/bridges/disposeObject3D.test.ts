import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { disposeObject3D, markShared } from './disposeObject3D';

describe('disposeObject3D (H1 — shared resource safety)', () => {
  it('disposes per-instance geometry (non-shared) but skips shared ones', () => {
    const ownGeom = new THREE.BoxGeometry(1, 1, 1);
    const ownMat = new THREE.MeshStandardMaterial();
    let ownDisposed = false;
    ownGeom.dispose = () => {
      ownDisposed = true;
    };

    const sharedGeom = markShared(new THREE.SphereGeometry(2, 6, 6));
    const sharedMat = markShared(new THREE.MeshBasicMaterial({ color: 0xaa2222 }));
    let sharedDisposed = false;
    sharedGeom.dispose = () => {
      sharedDisposed = true;
    };

    const group = new THREE.Group();
    group.add(new THREE.Mesh(ownGeom, ownMat));
    group.add(new THREE.Mesh(sharedGeom, sharedMat));

    disposeObject3D(group);
    expect(ownDisposed).toBe(true);
    expect(sharedDisposed).toBe(false);
  });
});
