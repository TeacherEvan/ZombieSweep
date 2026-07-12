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

describe('zombie gore details', () => {
  it('shambler has sunken eyes (eyeL, eyeR)', () => {
    const g = createShamblerMesh(false);
    expect(g.children.find(c => c.name === 'eyeL')).toBeDefined();
    expect(g.children.find(c => c.name === 'eyeR')).toBeDefined();
  });
  it('shambler has teeth', () => {
    expect(createShamblerMesh(false).children.find(c => c.name === 'teeth')).toBeDefined();
  });
  it('non-elite still has no visor (regression guard)', () => {
    expect(createShamblerMesh(false).children.find(c => c.name === 'visor')).toBeUndefined();
  });
});

describe('elite zombie variants', () => {
  it('elite shambler has eyeGlow + entrails + visor', () => {
    const g = createShamblerMesh(true);
    expect(g.children.find(c => c.name === 'visor')).toBeDefined();
    expect(g.children.find(c => c.name === 'eyeGlowL')).toBeDefined();
    expect(g.children.find(c => c.name === 'entrails')).toBeDefined();
  });
  it('elite is larger than non-elite (bounding box volume)', () => {
    const vol = (b: THREE.Box3) => (b.max.x - b.min.x) * (b.max.y - b.min.y) * (b.max.z - b.min.z);
    const elite = new THREE.Box3().setFromObject(createShamblerMesh(true));
    const normal = new THREE.Box3().setFromObject(createShamblerMesh(false));
    expect(vol(elite)).toBeGreaterThan(vol(normal));
  });
  it('non-elite has no eyeGlow/entrails', () => {
    const g = createShamblerMesh(false);
    expect(g.children.find(c => c.name === 'eyeGlowL')).toBeUndefined();
    expect(g.children.find(c => c.name === 'entrails')).toBeUndefined();
  });
  it('all elite types carry eyeGlow + entrails', () => {
    [createRunnerMesh(true), createSpitterMesh(true)].forEach(g => {
      expect(g.children.find(c => c.name === 'eyeGlowL')).toBeDefined();
      expect(g.children.find(c => c.name === 'entrails')).toBeDefined();
    });
  });
});
