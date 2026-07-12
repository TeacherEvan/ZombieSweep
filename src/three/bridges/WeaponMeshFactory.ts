import * as THREE from 'three';
import { VehicleType } from '../../config/vehicles';
import { markShared } from './disposeObject3D';

// Shared module singletons — reused by every projectile mesh instance. Marked
// shared so per-mesh disposal (disposeObject3D) never frees them.
const MAT = {
  paper: markShared(new THREE.MeshStandardMaterial({ color: 0xfaf3e0, roughness: 0.9 })),
  band: markShared(new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.8 })),
  bolt: markShared(
    new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.4, metalness: 0.7 })
  ),
  boltTip: markShared(
    new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.2, metalness: 0.9 })
  ),
  fletch: markShared(new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.9 })),
  pellet: markShared(
    new THREE.MeshStandardMaterial({
      color: 0xd0a020,
      roughness: 0.3,
      metalness: 0.8,
      emissive: new THREE.Color(0x804000),
      emissiveIntensity: 0.6,
    })
  ),
};

export function createNewspaperMesh(): THREE.Group {
  const group = new THREE.Group();

  const rollGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 10);
  const roll = new THREE.Mesh(rollGeom, MAT.paper);
  roll.name = 'roll';
  roll.rotation.z = Math.PI / 2;
  group.add(roll);

  const band = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.25, 6, 16), MAT.band);
  band.name = 'band';
  band.rotation.x = Math.PI / 2;
  group.add(band);

  return group;
}

export function createBoltMesh(): THREE.Group {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 6), MAT.bolt);
  shaft.name = 'shaft';
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.5, 6), MAT.boltTip);
  tip.name = 'tip';
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 5.5;
  group.add(tip);

  // Fletching (2 fins at 90 degrees)
  const fletchGeom = new THREE.BoxGeometry(0.2, 2, 1.2);
  [0, Math.PI / 2].forEach(ry => {
    const f = new THREE.Mesh(fletchGeom, MAT.fletch);
    f.name = 'fletch';
    f.rotation.z = Math.PI / 2;
    f.rotation.y = ry;
    f.position.x = -4.5;
    group.add(f);
  });

  return group;
}

export function createShotgunPelletMesh(): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(1.5, 6, 6), MAT.pellet);
}

export function createProjectileMeshForVehicle(vehicle: VehicleType): THREE.Group | THREE.Mesh {
  switch (vehicle) {
    case VehicleType.Bicycle:
      return createNewspaperMesh();
    case VehicleType.RollerBlades:
      return createBoltMesh();
    case VehicleType.Skateboard:
      return createShotgunPelletMesh();
  }
}
