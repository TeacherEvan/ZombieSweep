import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import {
  createBicycleMesh,
  createRollerBladesMesh,
  createSkateboardMesh,
  createPlayerMeshForVehicle,
} from './PlayerMeshFactory';
import { VehicleType } from '../../config/vehicles';

describe('PlayerMeshFactory', () => {
  it('createBicycleMesh returns THREE.Group', () => {
    expect(createBicycleMesh()).toBeInstanceOf(THREE.Group);
  });
  it('bicycle has >=6 children (frame, bars, wheels, torso, legs, arms, head)', () => {
    expect(createBicycleMesh().children.length).toBeGreaterThanOrEqual(6);
  });
  it('bicycle has >=2 named wheel children for animation', () => {
    expect(
      createBicycleMesh().children.filter(c => c.name === 'wheel').length
    ).toBeGreaterThanOrEqual(2);
  });
  it('bicycle rider has named torso child', () => {
    expect(createBicycleMesh().children.find(c => c.name === 'torso')).toBeDefined();
  });
  it('createRollerBladesMesh returns THREE.Group', () => {
    expect(createRollerBladesMesh()).toBeInstanceOf(THREE.Group);
  });
  it('createSkateboardMesh returns THREE.Group', () => {
    expect(createSkateboardMesh()).toBeInstanceOf(THREE.Group);
  });
  it('skateboard deck has name=deck for ollie animation', () => {
    expect(createSkateboardMesh().children.find(c => c.name === 'deck')).toBeDefined();
  });
  it('createPlayerMeshForVehicle dispatches on all VehicleType values', () => {
    expect(createPlayerMeshForVehicle(VehicleType.Bicycle)).toBeInstanceOf(THREE.Group);
    expect(createPlayerMeshForVehicle(VehicleType.RollerBlades)).toBeInstanceOf(THREE.Group);
    expect(createPlayerMeshForVehicle(VehicleType.Skateboard)).toBeInstanceOf(THREE.Group);
  });
});
