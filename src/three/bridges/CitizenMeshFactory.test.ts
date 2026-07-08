import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import { createCitizenMeshForType } from './CitizenMeshFactory';
import { CitizenType } from '../../entities/Citizen';

describe('CitizenMeshFactory', () => {
  it('FriendlyNeighbor returns THREE.Group', () => {
    expect(createCitizenMeshForType(CitizenType.FriendlyNeighbor)).toBeInstanceOf(THREE.Group);
  });
  it('PanickedRunner returns THREE.Group', () => {
    expect(createCitizenMeshForType(CitizenType.PanickedRunner)).toBeInstanceOf(THREE.Group);
  });
  it('ArmedSurvivalist returns THREE.Group', () => {
    expect(createCitizenMeshForType(CitizenType.ArmedSurvivalist)).toBeInstanceOf(THREE.Group);
  });
  it('ArmedSurvivalist has weapon child', () => {
    const g = createCitizenMeshForType(CitizenType.ArmedSurvivalist);
    expect(g.children.find(c => c.name === 'weapon')).toBeDefined();
  });
  it('PanickedRunner is leaned forward (rotation.x < 0)', () => {
    const g = createCitizenMeshForType(CitizenType.PanickedRunner);
    expect(g.rotation.x).toBeLessThan(0);
  });
});
