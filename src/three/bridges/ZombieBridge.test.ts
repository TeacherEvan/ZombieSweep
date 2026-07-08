import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ZombieBridge, type ZombieSourceItem } from './ZombieBridge';
import { ZombieType } from '../../entities/Zombie';
import { defaultOrthoConfig, worldToThree, type CameraView } from '../projection';

const cfg = defaultOrthoConfig(960, 540, 1);

function makeSprite(
  x: number,
  y: number,
  rotation = 0
): { x: number; y: number; rotation: number; visible: boolean; setVisible: (v: boolean) => void } {
  return {
    x,
    y,
    rotation,
    visible: true,
    setVisible: function (v: boolean) {
      this.visible = v;
    },
  };
}

describe('ZombieBridge', () => {
  const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

  it('adds a zombie mesh when enabled and hides the 2D sprite', () => {
    const scene = new THREE.Scene();
    const bridge = new ZombieBridge(scene, cfg);
    bridge.setEnabled(true);

    const source: ZombieSourceItem[] = [
      {
        type: ZombieType.Shambler,
        elite: false,
        sprite: makeSprite(480, 270),
      },
    ];

    bridge.update({ source, host: scene, cam, dt: 16 });

    const groups = scene.children.filter(c => c instanceof THREE.Group);
    expect(groups.length).toBe(1);
    expect(source[0].sprite.visible).toBe(false);
  });

  it('reprojects zombie mesh to parity and applies bobbing and rotation', () => {
    const scene = new THREE.Scene();
    const bridge = new ZombieBridge(scene, cfg);
    bridge.setEnabled(true);

    const source: ZombieSourceItem[] = [
      {
        type: ZombieType.Runner,
        elite: true,
        sprite: makeSprite(120, 240, Math.PI / 6),
      },
    ];

    // Tick forward by 100ms
    bridge.update({ source, host: scene, cam, dt: 100 });

    const group = scene.children[0] as THREE.Group;
    const expected = worldToThree(120, 240, cam, cfg);

    expect(group.position.x).toBeCloseTo(expected.x);
    expect(group.position.z).toBeCloseTo(expected.z);
    
    // Bobbing is active, y must be positive
    expect(group.position.y).toBeGreaterThan(0);
    expect(group.rotation.y).toBeCloseTo(-Math.PI / 6);
    
    // Elite scale is 1.25
    expect(group.scale.x).toBeCloseTo(1.25);
  });

  it('re-shows 2D zombie sprite and removes meshes when disabled', () => {
    const scene = new THREE.Scene();
    const bridge = new ZombieBridge(scene, cfg);
    bridge.setEnabled(true);

    const source: ZombieSourceItem[] = [
      {
        type: ZombieType.Spitter,
        elite: false,
        sprite: makeSprite(480, 270),
      },
    ];

    bridge.update({ source, host: scene, cam, dt: 16 });
    expect(source[0].sprite.visible).toBe(false);

    bridge.setEnabled(false);
    bridge.update({ source, host: scene, cam, dt: 16 });

    const groups = scene.children.filter(c => c instanceof THREE.Group);
    expect(groups.length).toBe(0);
    expect(source[0].sprite.visible).toBe(true);
  });
});
