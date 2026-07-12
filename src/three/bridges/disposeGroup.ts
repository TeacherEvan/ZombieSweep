import type * as THREE from 'three';
import { disposeObject3D } from './disposeObject3D';

/**
 * Dispose a THREE.Group subtree on removal, skipping any geometry/material
 * marked shared (see {@link markShared}). Use this from every bridge's
 * `onRemoveFromHost` so shared module-level resources are never freed.
 */
export function disposeGroup(group: THREE.Group): void {
  disposeObject3D(group);
}
