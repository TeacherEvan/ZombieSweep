import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ZombieBridge, type ZombieSourceItem } from './ZombieBridge';
import { CitizenBridge } from './CitizenBridge';
import { defaultOrthoConfig, type CameraView } from '../projection';
import { ZombieType } from '../../entities/Zombie';
import { CitizenType } from '../../entities/Citizen';

// Reproduces the Phase-3 finding: the bridges key on `item.sprite`, but
// GameScene.syncRender3DLayer rebuilds that `sprite` wrapper object literal
// every frame (GameScene.ts:697-712, 721-735, 671-688). When the wrapper is
// re-created each frame, the key is never stable, so the bridge tears down and
// rebuilds every entity mesh every frame — defeating the keyed reconciliation
// introduced in commit 7e90dcc.

const cfg = defaultOrthoConfig(960, 540, 1);
const cam: CameraView = { scrollX: 0, scrollY: 0, zoom: 1 };

interface SpriteLike {
  x: number;
  y: number;
  rotation: number;
  visible: boolean;
  setVisible(v: boolean): void;
}

function firstGroup(scene: THREE.Scene): THREE.Group {
  return scene.children.find(c => c instanceof THREE.Group) as THREE.Group;
}

// Frame shape that matches what GameScene actually produces: a FRESH wrapper
// object each frame for the same logical entity.
function frameFor(sprite: SpriteLike): ZombieSourceItem[] {
  return [{ type: ZombieType.Shambler, elite: false, sprite }];
}

describe('Bridges — stable key required across frames (repro of key instability)', () => {
  it('BUG: ZombieBridge rebuilds the mesh every frame when the sprite wrapper is re-created', () => {
    const scene = new THREE.Scene();
    const bridge = new ZombieBridge(scene, cfg);
    bridge.setEnabled(true);

    // Frame 1 with wrapper A (same logical zombie).
    const a = makeSprite(480, 270);
    bridge.update({ source: frameFor(a), host: scene, cam, dt: 16 });
    const groupAfterA = firstGroup(scene);

    // Frame 2: SAME logical zombie, but GameScene creates a NEW wrapper object B.
    const b = makeSprite(480, 270);
    bridge.update({ source: frameFor(b), host: scene, cam, dt: 16 });
    const groupAfterB = firstGroup(scene);

    // A stable key would keep the SAME group instance across frames. The bug:
    // because B is a distinct object from A, the bridge removes the old mesh
    // and builds a new one, so the instance identity changes.
    expect(groupAfterB).not.toBe(groupAfterA);
  });

  it('BUG: CitizenBridge likewise rebuilds when the wrapper is re-created', () => {
    const scene = new THREE.Scene();
    const bridge = new CitizenBridge(scene, cfg);
    bridge.setEnabled(true);

    const a = makeSprite(300, 200);
    bridge.update({
      source: [{ type: CitizenType.FriendlyNeighbor, sprite: a }],
      host: scene,
      cam,
      dt: 16,
    });
    const g1 = firstGroup(scene);

    const b = makeSprite(300, 200);
    bridge.update({
      source: [{ type: CitizenType.FriendlyNeighbor, sprite: b }],
      host: scene,
      cam,
      dt: 16,
    });
    const g2 = firstGroup(scene);

    expect(g2).not.toBe(g1);
  });

  it('control: a STABLE wrapper keeps the same mesh instance across frames', () => {
    const scene = new THREE.Scene();
    const bridge = new ZombieBridge(scene, cfg);
    bridge.setEnabled(true);

    const stable = makeSprite(480, 270);
    bridge.update({ source: frameFor(stable), host: scene, cam, dt: 16 });
    const g1 = firstGroup(scene);
    bridge.update({ source: frameFor(stable), host: scene, cam, dt: 16 });
    const g2 = firstGroup(scene);

    expect(g2).toBe(g1);
  });
});

function makeSprite(x: number, y: number, rotation = 0): SpriteLike {
  return {
    x,
    y,
    rotation,
    visible: true,
    setVisible(v: boolean) {
      this.visible = v;
    },
  };
}
