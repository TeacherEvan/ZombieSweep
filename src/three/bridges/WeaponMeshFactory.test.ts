import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import {
  createNewspaperMesh,
  createBoltMesh,
  createShotgunPelletMesh,
  createProjectileMeshForVehicle,
} from './WeaponMeshFactory';
import { VehicleType } from '../../config/vehicles';

describe('WeaponMeshFactory', () => {
  it('createNewspaperMesh returns THREE.Group with >=2 children (roll + band)', () => {
    const g = createNewspaperMesh();
    expect(g).toBeInstanceOf(THREE.Group);
    expect(g.children.length).toBeGreaterThanOrEqual(2);
  });
  it('newspaper has roll child', () => {
    expect(createNewspaperMesh().children.find(c => c.name === 'roll')).toBeDefined();
  });
  it('createBoltMesh returns THREE.Group with shaft + tip', () => {
    const g = createBoltMesh();
    expect(g).toBeInstanceOf(THREE.Group);
    expect(g.children.find(c => c.name === 'shaft')).toBeDefined();
    expect(g.children.find(c => c.name === 'tip')).toBeDefined();
  });
  it('createShotgunPelletMesh returns THREE.Mesh', () => {
    expect(createShotgunPelletMesh()).toBeInstanceOf(THREE.Mesh);
  });
  it('createProjectileMeshForVehicle returns object for each type', () => {
    expect(createProjectileMeshForVehicle(VehicleType.Bicycle)).toBeDefined();
    expect(createProjectileMeshForVehicle(VehicleType.RollerBlades)).toBeDefined();
    expect(createProjectileMeshForVehicle(VehicleType.Skateboard)).toBeDefined();
  });
});
