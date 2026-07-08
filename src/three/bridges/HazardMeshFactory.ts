import * as THREE from 'three';
import { HazardType } from '../../entities/Hazard';

const MAT = {
  dirt: new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.95 }),
  pit: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1.0 }),
  log: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }),
  bark: new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.95 }),
  ice: new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    roughness: 0.05,
    metalness: 0.9,
    transparent: true,
    opacity: 0.8,
  }),
};

export function createHoleMesh(): THREE.Group {
  const group = new THREE.Group();

  const rim = new THREE.Mesh(new THREE.TorusGeometry(12, 2.5, 8, 16), MAT.dirt);
  rim.name = 'rim';
  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const pit = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 4, 16), MAT.pit);
  pit.name = 'pit';
  pit.position.y = -2;
  group.add(pit);

  return group;
}

export function createLogMesh(): THREE.Group {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 38, 12), MAT.bark);
  trunk.name = 'trunk';
  trunk.rotation.z = Math.PI / 2;
  trunk.position.y = 4;
  group.add(trunk);

  // Cut ends
  [
    [-19, 4, 0],
    [19, 4, 0],
  ].forEach(([x, y, z]) => {
    const end = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.5, 10), MAT.log);
    end.name = 'end';
    end.rotation.z = Math.PI / 2;
    end.position.set(x, y, z);
    group.add(end);
  });

  return group;
}

export function createIceMesh(): THREE.Group {
  const group = new THREE.Group();

  const slab = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 22), MAT.ice);
  slab.name = 'ice';
  slab.position.y = 0.5;
  group.add(slab);

  return group;
}

export function createHazardMeshForType(type: HazardType): THREE.Group {
  switch (type) {
    case HazardType.Hole:
      return createHoleMesh();
    case HazardType.Log:
      return createLogMesh();
    case HazardType.IcePatch:
      return createIceMesh();
  }
}
