import * as THREE from 'three';
import { ZombieType } from '../../entities/Zombie';

const BONE_WHITE = 0xede0c8;
const GORE_RED = 0x8b0000;
const EYE_DARK = 0x1a0000;
const TEETH_WHITE = 0xd8d8c0;
const ELITE_EYE_GLOW = 0xff2a2a;
const ENTRAIL_RED = 0x5a0a0a;

function mat(color: number, roughness = 0.8): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 });
}

function addCore(group: THREE.Group, bodyColor: number, torsoH: number, headR: number): void {
  // Torso
  const body = new THREE.Mesh(new THREE.BoxGeometry(7, torsoH, 4.5), mat(bodyColor));
  body.name = 'torso';
  body.position.y = torsoH / 2;
  group.add(body);

  // Exposed ribs
  const ribMat = mat(BONE_WHITE, 0.6);
  [-2, 0, 2].forEach(dy => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.8, 0.6), ribMat);
    rib.name = 'rib';
    rib.position.set(0, torsoH / 2 + dy, 2.4);
    group.add(rib);
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 10, 8), mat(bodyColor, 0.7));
  head.name = 'head';
  head.position.y = torsoH + headR + 1;
  group.add(head);

  // Jaw
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(headR * 1.4, headR * 0.4, headR * 0.9),
    mat(bodyColor)
  );
  jaw.name = 'jaw';
  jaw.position.set(0, torsoH + headR * 0.5, headR * 0.6);
  group.add(jaw);

  // Sunken eyes — dark recessed spheres on the face
  const eyeGeom = new THREE.SphereGeometry(headR * 0.32, 8, 6);
  [-headR * 0.45, headR * 0.45].forEach((x, i) => {
    const eye = new THREE.Mesh(eyeGeom, mat(EYE_DARK, 0.95));
    eye.name = i === 0 ? 'eyeL' : 'eyeR';
    eye.position.set(x, torsoH + headR * 1.05, headR * 0.85);
    group.add(eye);
  });

  // Teeth — a thin off-white strip in the jaw
  const teeth = new THREE.Mesh(
    new THREE.BoxGeometry(headR * 1.2, headR * 0.28, headR * 0.5),
    mat(TEETH_WHITE, 0.6)
  );
  teeth.name = 'teeth';
  teeth.position.set(0, torsoH + headR * 0.35, headR * 0.95);
  group.add(teeth);

  // Arms
  const armGeom = new THREE.BoxGeometry(2, 2.5, 10);
  [-4.5, 4.5].forEach((x, i) => {
    const arm = new THREE.Mesh(armGeom, mat(bodyColor, 0.85));
    arm.name = i === 0 ? 'armL' : 'armR';
    arm.position.set(x, torsoH * 0.7, 4);
    group.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 6), mat(GORE_RED, 0.9));
    hand.name = 'hand';
    hand.position.set(x, torsoH * 0.7, 9);
    group.add(hand);
  });
}

function addEliteDetails(group: THREE.Group, headY: number, torsoH: number): void {
  // Red pulsating visor (continuity with prior elite look; animated by AnimationRig)
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: new THREE.Color(0xff3333),
    emissiveIntensity: 3.5,
  });
  const visor = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 1), visorMat);
  visor.name = 'visor';
  visor.position.set(0, headY, 2.8);
  group.add(visor);

  // Glowing red eyes (pulsate via AnimationRig alongside the visor)
  const glowMat = new THREE.MeshStandardMaterial({
    color: ELITE_EYE_GLOW,
    emissive: new THREE.Color(ELITE_EYE_GLOW),
    emissiveIntensity: 4,
  });
  const glowGeom = new THREE.SphereGeometry(0.9, 8, 6);
  [-1.7, 1.7].forEach((x, i) => {
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.name = i === 0 ? 'eyeGlowL' : 'eyeGlowR';
    glow.position.set(x, headY - 0.2, 2.7);
    group.add(glow);
  });

  // Exposed entrails — a dark-red twisted mass at the torso
  const entrailMat = new THREE.MeshStandardMaterial({
    color: ENTRAIL_RED,
    roughness: 0.5,
    metalness: 0.05,
  });
  const entrails = new THREE.Mesh(new THREE.TorusGeometry(2.2, 1.1, 8, 12), entrailMat);
  entrails.name = 'entrails';
  entrails.position.set(0, torsoH * 0.55, 2.6);
  entrails.rotation.set(Math.PI / 2, 0, 0.4);
  group.add(entrails);

  // Bulkier silhouette — modest uniform scale (rig still drives named parts)
  group.scale.setScalar(1.2);
}

export function createShamblerMesh(elite: boolean): THREE.Group {
  const group = new THREE.Group();
  addCore(group, 0x4caf50, 13, 3.8);
  // Torn shirt
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(7.5, 5, 1), mat(0x3a3a3a, 0.95));
  shirt.name = 'shirt';
  shirt.position.set(0, 9, 2.4);
  group.add(shirt);
  if (elite) addEliteDetails(group, 15, 13);
  return group;
}

export function createRunnerMesh(elite: boolean): THREE.Group {
  const group = new THREE.Group();
  addCore(group, 0xc62828, 16, 3.2);
  group.rotation.x = -0.3; // lean forward
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 1.5), mat(0x1a1a1a, 0.7));
  jacket.name = 'jacket';
  jacket.position.set(0, 11, 2.5);
  group.add(jacket);
  if (elite) addEliteDetails(group, 18, 16);
  return group;
}

export function createSpitterMesh(elite: boolean): THREE.Group {
  const group = new THREE.Group();
  addCore(group, 0x827717, 12, 4.2);
  // Bloated acid sac
  const sacMat = new THREE.MeshStandardMaterial({
    color: 0xc5e01a,
    emissive: new THREE.Color(0x99b800),
    emissiveIntensity: 0.5,
    roughness: 0.3,
  });
  const acidSac = new THREE.Mesh(new THREE.SphereGeometry(4, 10, 10), sacMat);
  acidSac.name = 'acidSac';
  acidSac.scale.set(1, 0.8, 0.9);
  acidSac.position.set(0, 4, 3);
  group.add(acidSac);
  if (elite) addEliteDetails(group, 14, 12);
  return group;
}

export function createZombieMeshForType(type: ZombieType, elite: boolean): THREE.Group {
  switch (type) {
    case ZombieType.Shambler:
      return createShamblerMesh(elite);
    case ZombieType.Runner:
      return createRunnerMesh(elite);
    case ZombieType.Spitter:
      return createSpitterMesh(elite);
  }
}
