import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import {
  createShamblerMesh,
  createRunnerMesh,
  createSpitterMesh,
  createZombieMeshForType,
} from './ZombieMeshFactory';
import { ZombieType } from '../../entities/Zombie';

describe('ZombieMeshFactory', () => {
  it('createShamblerMesh returns THREE.Group', () => {
    expect(createShamblerMesh(false)).toBeInstanceOf(THREE.Group);
  });
  it('shambler has >=4 children (torso, head, arms)', () => {
    expect(createShamblerMesh(false).children.length).toBeGreaterThanOrEqual(4);
  });
  it('shambler non-elite has no visor', () => {
    expect(createShamblerMesh(false).children.find(c => c.name === 'visor')).toBeUndefined();
  });
  it('shambler elite has visor', () => {
    expect(createShamblerMesh(true).children.find(c => c.name === 'visor')).toBeDefined();
  });
  it('runner mesh has taller bounding box than shambler', () => {
    const rb = new THREE.Box3().setFromObject(createRunnerMesh(false));
    const sb = new THREE.Box3().setFromObject(createShamblerMesh(false));
    expect(rb.max.y).toBeGreaterThan(sb.max.y);
  });
  it('spitter has acidSac child', () => {
    expect(createSpitterMesh(false).children.find(c => c.name === 'acidSac')).toBeDefined();
  });
  it('createZombieMeshForType dispatches all types', () => {
    expect(createZombieMeshForType(ZombieType.Shambler, false)).toBeInstanceOf(THREE.Group);
    expect(createZombieMeshForType(ZombieType.Runner, false)).toBeInstanceOf(THREE.Group);
    expect(createZombieMeshForType(ZombieType.Spitter, false)).toBeInstanceOf(THREE.Group);
  });
});
