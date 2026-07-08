import * as THREE from 'three';
import { describe, it, expect } from 'vitest';
import {
  animateBicycleRider,
  animateSkateboardRider,
  animateRollerbladeRider,
  animateZombieWalk,
  animateCitizenPanic,
} from './AnimationRig';
import { ZombieType } from '../../entities/Zombie';

function group(...names: string[]): THREE.Group {
  const g = new THREE.Group();
  names.forEach(n => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
    m.name = n;
    g.add(m);
  });
  return g;
}

describe('AnimationRig', () => {
  it('animateBicycleRider spins wheel rotation.x', () => {
    const g = group('wheel', 'wheel', 'torso', 'legL', 'legR');
    const wheel = g.children.find(c => c.name === 'wheel')!;
    const before = wheel.rotation.x;
    animateBicycleRider(g, 100, 5);
    expect(wheel.rotation.x).not.toBe(before);
  });
  it('animateBicycleRider does not throw on empty group', () => {
    expect(() => animateBicycleRider(new THREE.Group(), 100, 5)).not.toThrow();
  });
  it('animateZombieWalk rotates armL', () => {
    const g = group('armL', 'armR', 'legL', 'legR');
    const arm = g.children.find(c => c.name === 'armL')!;
    const before = arm.rotation.x;
    animateZombieWalk(g, 200, ZombieType.Shambler);
    expect(arm.rotation.x).not.toBe(before);
  });
  it('animateCitizenPanic oscillates torso.rotation.z', () => {
    const g = group('torso');
    const torso = g.children.find(c => c.name === 'torso')!;
    animateCitizenPanic(g, 0);
    const r0 = torso.rotation.z;
    animateCitizenPanic(g, 250);
    expect(torso.rotation.z).not.toBe(r0);
  });
  it('animateSkateboardRider spins wheels and does not throw on rider-only group', () => {
    const g = group('wheel', 'wheel', 'torso', 'legL', 'legR');
    const wheel = g.children.find(c => c.name === 'wheel')!;
    const before = wheel.rotation.x;
    animateSkateboardRider(g, 100, 8);
    expect(wheel.rotation.x).not.toBe(before);
    expect(() => animateSkateboardRider(new THREE.Group(), 100, 8)).not.toThrow();
  });
  it('animateRollerbladeRider oscillates legs (stride) and does not throw on empty group', () => {
    const g = group('legL', 'legR', 'torso', 'armL', 'armR');
    const legL = g.children.find(c => c.name === 'legL')!;
    const before = legL.rotation.x;
    animateRollerbladeRider(g, 100, 8);
    expect(legL.rotation.x).not.toBe(before);
    expect(() => animateRollerbladeRider(new THREE.Group(), 100, 8)).not.toThrow();
  });
});
