import * as THREE from 'three';
import { CitizenType } from '../../entities/Citizen';
import { markShared } from './disposeObject3D';

// Shared module singletons — reused by every citizen mesh instance. Marked
// shared so per-mesh disposal (disposeObject3D) never frees them.
const MAT = {
  skin: markShared(new THREE.MeshStandardMaterial({ color: 0xffd5a8, roughness: 0.85 })),
  hair: markShared(new THREE.MeshStandardMaterial({ color: 0x4e3324, roughness: 0.9 })),
  shirtBlue: markShared(new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 })),
  shirtOrng: markShared(new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.8 })),
  shirtGray: markShared(
    new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.6, metalness: 0.2 })
  ),
  pants: markShared(new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.9 })),
  shoes: markShared(new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 })),
  gun: markShared(
    new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.3, metalness: 0.9 })
  ),
};

function buildHumanoid(shirtMat: THREE.MeshStandardMaterial): THREE.Group {
  const group = new THREE.Group();

  // Feet
  [-1.5, 1.5].forEach(x => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4), MAT.shoes);
    foot.name = 'foot';
    foot.position.set(x, 0.75, 0);
    group.add(foot);
  });

  // Legs
  const legGeom = new THREE.BoxGeometry(2.5, 9, 3);
  [-1.5, 1.5].forEach((x, i) => {
    const leg = new THREE.Mesh(legGeom, MAT.pants);
    leg.name = i === 0 ? 'legL' : 'legR';
    leg.position.set(x, 6, 0);
    group.add(leg);
  });

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(7, 9, 4), shirtMat);
  torso.name = 'torso';
  torso.position.set(0, 15, 0);
  group.add(torso);

  // Arms
  const armGeom = new THREE.BoxGeometry(2, 8, 2.5);
  [-5.5, 5.5].forEach((x, i) => {
    const arm = new THREE.Mesh(armGeom, shirtMat);
    arm.name = i === 0 ? 'armL' : 'armR';
    arm.position.set(x, 14, 0);
    group.add(arm);
  });

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), MAT.skin);
  head.name = 'head';
  head.position.set(0, 22, 0);
  group.add(head);

  // Hair cap
  const hair = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 6), MAT.hair);
  hair.name = 'hair';
  hair.scale.set(1, 0.55, 1);
  hair.position.set(0, 25, 0);
  group.add(hair);

  return group;
}

export function createFriendlyNeighborMesh(): THREE.Group {
  return buildHumanoid(MAT.shirtBlue);
}

export function createPanickedRunnerMesh(): THREE.Group {
  const g = buildHumanoid(MAT.shirtOrng);
  g.rotation.x = -0.35; // lean forward in panic
  return g;
}

export function createArmedSurvivalistMesh(): THREE.Group {
  const g = buildHumanoid(MAT.shirtGray);

  // Rifle
  const rifle = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 14, 8), MAT.gun);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.x = 7;
  rifle.add(barrel);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(5, 2, 2), MAT.gun);
  stock.position.x = -2;
  rifle.add(stock);
  rifle.name = 'weapon';
  rifle.position.set(5.5, 13, 2);
  rifle.rotation.set(0.2, 0, 0);
  g.add(rifle);

  return g;
}

export function createCitizenMeshForType(type: CitizenType): THREE.Group {
  switch (type) {
    case CitizenType.FriendlyNeighbor:
      return createFriendlyNeighborMesh();
    case CitizenType.PanickedRunner:
      return createPanickedRunnerMesh();
    case CitizenType.ArmedSurvivalist:
      return createArmedSurvivalistMesh();
  }
}
