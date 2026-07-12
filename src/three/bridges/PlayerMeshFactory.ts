import * as THREE from 'three';
import { VehicleType } from '../../config/vehicles';
import { markShared } from './disposeObject3D';

// Shared module singletons — reused by every player mesh instance. Marked
// shared so per-mesh disposal (disposeObject3D) never frees them.
const MAT = {
  bicycleFrame: markShared(
    new THREE.MeshStandardMaterial({
      color: 0xd93838,
      roughness: 0.35,
      metalness: 0.7,
    })
  ),
  chrome: markShared(
    new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.1, metalness: 0.95 })
  ),
  rubber: markShared(
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95, metalness: 0.0 })
  ),
  skateboardDeck: markShared(
    new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.55,
      metalness: 0.1,
    })
  ),
  trucks: markShared(
    new THREE.MeshStandardMaterial({ color: 0xa0a0a0, roughness: 0.25, metalness: 0.85 })
  ),
  bladeBoot: markShared(
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.45, metalness: 0.3 })
  ),
  skin: markShared(
    new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.85, metalness: 0.0 })
  ),
  shirt: markShared(
    new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.8, metalness: 0.0 })
  ),
  helmet: markShared(
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4, metalness: 0.5 })
  ),
  jeans: markShared(
    new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.9, metalness: 0.0 })
  ),
  cap: markShared(
    new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.7, metalness: 0.1 })
  ),
  goggles: markShared(
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.6,
    })
  ),
  satchel: markShared(
    new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.8, metalness: 0.05 })
  ),
};

function addRider(group: THREE.Group, baseY: number): void {
  const legGeom = new THREE.BoxGeometry(2.5, 9, 3);
  [-2, 2].forEach((x, i) => {
    const leg = new THREE.Mesh(legGeom, MAT.jeans);
    leg.name = i === 0 ? 'legL' : 'legR';
    leg.position.set(x, baseY + 4.5, 0);
    group.add(leg);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(7, 10, 4), MAT.shirt);
  torso.name = 'torso';
  torso.position.set(0, baseY + 14, 0);
  group.add(torso);

  const armGeom = new THREE.BoxGeometry(2, 8, 2.5);
  [-5.5, 5.5].forEach((x, i) => {
    const arm = new THREE.Mesh(armGeom, MAT.shirt);
    arm.name = i === 0 ? 'armL' : 'armR';
    arm.position.set(x, baseY + 14, 3);
    arm.rotation.x = -0.4;
    group.add(arm);
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), MAT.skin);
  head.name = 'head';
  head.position.set(0, baseY + 21, 0);
  group.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 8), MAT.helmet);
  helmet.name = 'helmet';
  helmet.scale.set(1, 0.7, 1);
  helmet.position.set(0, baseY + 23.5, 0);
  group.add(helmet);

  // Courier cap — sits on top of the head
  const cap = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.6, 6.4), MAT.cap);
  cap.name = 'cap';
  cap.position.set(0, baseY + 24.6, 0);
  group.add(cap);

  // Goggles — band across the eyes
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(6, 1.4, 1.2), MAT.goggles);
  goggles.name = 'goggles';
  goggles.position.set(0, baseY + 21.4, 2.6);
  group.add(goggles);

  // Newspaper satchel — slung at the rider's side/back
  const satchel = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 3), MAT.satchel);
  satchel.name = 'satchel';
  satchel.position.set(4.5, baseY + 13, -2.5);
  satchel.rotation.z = 0.15;
  group.add(satchel);
}

export function createBicycleMesh(): THREE.Group {
  const group = new THREE.Group();

  // Frame tubes
  const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 18, 8), MAT.bicycleFrame);
  downTube.name = 'frame';
  downTube.position.set(0, 9, 0);
  downTube.rotation.z = Math.PI * 0.05;
  group.add(downTube);

  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 15, 8), MAT.bicycleFrame);
  topTube.name = 'frame';
  topTube.position.set(0, 13, 0);
  topTube.rotation.x = Math.PI / 2;
  group.add(topTube);

  // Handlebars
  const bar = new THREE.Mesh(new THREE.BoxGeometry(13, 1.2, 1.5), MAT.chrome);
  bar.name = 'handlebar';
  bar.position.set(0, 14, 7);
  group.add(bar);

  // Wheels (cylinder, rotated to roll on Z axis)
  const wheelGeom = new THREE.CylinderGeometry(6, 6, 1.5, 16);
  wheelGeom.rotateZ(Math.PI / 2);
  [9, -9].forEach(z => {
    const w = new THREE.Mesh(wheelGeom, MAT.rubber);
    w.name = 'wheel';
    w.position.set(0, 6, z);
    group.add(w);
  });

  // Pedal
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.5), MAT.chrome);
  pedal.name = 'pedal';
  pedal.position.set(0, 7, 0);
  group.add(pedal);

  addRider(group, 9);
  return group;
}

export function createSkateboardMesh(): THREE.Group {
  const group = new THREE.Group();

  const deck = new THREE.Mesh(new THREE.BoxGeometry(9, 1.5, 24), MAT.skateboardDeck);
  deck.name = 'deck';
  deck.position.y = 4;
  group.add(deck);

  // Kicktail nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(9, 1, 4), MAT.skateboardDeck);
  nose.name = 'deck';
  nose.position.set(0, 5.5, 13);
  nose.rotation.x = -0.4;
  group.add(nose);

  // Trucks
  [-8, 8].forEach(z => {
    const truck = new THREE.Mesh(new THREE.BoxGeometry(10, 1.5, 3), MAT.trucks);
    truck.name = 'truck';
    truck.position.set(0, 2.5, z);
    group.add(truck);
  });

  // Wheels
  const wGeom = new THREE.CylinderGeometry(2, 2, 1.5, 12);
  wGeom.rotateZ(Math.PI / 2);
  [
    [-4, 1.8, -8],
    [4, 1.8, -8],
    [-4, 1.8, 8],
    [4, 1.8, 8],
  ].forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wGeom, MAT.rubber);
    w.name = 'wheel';
    w.position.set(x, y, z);
    group.add(w);
  });

  addRider(group, 4);
  return group;
}

export function createRollerBladesMesh(): THREE.Group {
  const group = new THREE.Group();
  const bootGeom = new THREE.BoxGeometry(4, 9, 10);

  [-4, 4].forEach((x, i) => {
    const boot = new THREE.Mesh(bootGeom, MAT.bladeBoot);
    boot.name = i === 0 ? 'bootL' : 'bootR';
    boot.position.set(x, 5, 0);
    group.add(boot);

    const cuff = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 10.5), MAT.chrome);
    cuff.name = 'cuff';
    cuff.position.set(x, 9.5, 0);
    group.add(cuff);

    // 4 inline wheels per boot
    const wGeom = new THREE.SphereGeometry(1.5, 10, 10);
    [-4, -1.5, 1.5, 4].forEach(z => {
      const w = new THREE.Mesh(wGeom, MAT.rubber);
      w.name = 'wheel';
      w.position.set(x, 1.5, z);
      group.add(w);
    });
  });

  addRider(group, 10);
  return group;
}

export function createPlayerMeshForVehicle(type: VehicleType): THREE.Group {
  switch (type) {
    case VehicleType.Bicycle:
      return createBicycleMesh();
    case VehicleType.Skateboard:
      return createSkateboardMesh();
    case VehicleType.RollerBlades:
      return createRollerBladesMesh();
  }
}
