import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import {
  createHoleMesh,
  createLogMesh,
  createIceMesh,
  createHazardMeshForType,
} from './HazardMeshFactory';
import { HazardType } from '../../entities/Hazard';

describe('HazardMeshFactory', () => {
  it('createHoleMesh returns THREE.Group', () => {
    expect(createHoleMesh()).toBeInstanceOf(THREE.Group);
  });
  it('hole has pit child', () => {
    expect(createHoleMesh().children.find(c => c.name === 'pit')).toBeDefined();
  });
  it('createLogMesh returns THREE.Group', () => {
    expect(createLogMesh()).toBeInstanceOf(THREE.Group);
  });
  it('log has trunk child', () => {
    expect(createLogMesh().children.find(c => c.name === 'trunk')).toBeDefined();
  });
  it('createIceMesh returns THREE.Group', () => {
    expect(createIceMesh()).toBeInstanceOf(THREE.Group);
  });
  it('ice slab has low roughness (< 0.2)', () => {
    const g = createIceMesh();
    const ice = g.children.find(c => c.name === 'ice') as THREE.Mesh;
    expect((ice.material as THREE.MeshStandardMaterial).roughness).toBeLessThan(0.2);
  });
  it('createHazardMeshForType dispatches on all types', () => {
    expect(createHazardMeshForType(HazardType.Hole)).toBeInstanceOf(THREE.Group);
    expect(createHazardMeshForType(HazardType.Log)).toBeInstanceOf(THREE.Group);
    expect(createHazardMeshForType(HazardType.IcePatch)).toBeInstanceOf(THREE.Group);
  });
});
