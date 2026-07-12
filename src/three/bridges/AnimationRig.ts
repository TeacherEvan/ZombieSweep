import * as THREE from 'three';
import { ZombieType } from '../../entities/Zombie';

function child(group: THREE.Group, name: string): THREE.Object3D | undefined {
  return group.children.find(c => c.name === name);
}

export function animateBicycleRider(group: THREE.Group, elapsed: number, speed: number): void {
  const t = elapsed * 0.001;
  const rate = speed * 0.035;

  group.children.forEach(c => {
    if (c.name === 'wheel') c.rotation.x = t * rate * 6;
  });

  const legL = child(group, 'legL');
  const legR = child(group, 'legR');
  if (legL) legL.rotation.x = Math.sin(t * rate * 2) * 0.5;
  if (legR) legR.rotation.x = Math.sin(t * rate * 2 + Math.PI) * 0.5;

  const torso = child(group, 'torso');
  if (torso) torso.rotation.x = -0.15 + Math.sin(t * 1.5) * 0.03;

  const armL = child(group, 'armL');
  const armR = child(group, 'armR');
  if (armL) armL.rotation.x = -0.4 + Math.sin(t * rate * 2) * 0.08;
  if (armR) armR.rotation.x = -0.4 + Math.sin(t * rate * 2 + Math.PI) * 0.08;
}

export function animateZombieWalk(group: THREE.Group, elapsed: number, type: ZombieType): void {
  const t = elapsed * 0.001;
  const isRunner = type === ZombieType.Runner;
  const rate = isRunner ? 10 : 4;

  const armL = child(group, 'armL');
  const armR = child(group, 'armR');
  if (armL) armL.rotation.x = Math.sin(t * rate) * (isRunner ? 1.0 : 0.6);
  if (armR) armR.rotation.x = Math.sin(t * rate + Math.PI) * (isRunner ? 1.0 : 0.6);

  const legL = child(group, 'legL');
  const legR = child(group, 'legR');
  if (legL) legL.rotation.x = Math.sin(t * rate) * (isRunner ? 0.7 : 0.4);
  if (legR) legR.rotation.x = Math.sin(t * rate + Math.PI) * (isRunner ? 0.7 : 0.4);

  // Elite visors pulsate brightness dynamically
  const visor = child(group, 'visor');
  if (visor && visor instanceof THREE.Mesh) {
    const mat = visor.material as THREE.MeshStandardMaterial;
    if (mat && mat.isMeshStandardMaterial) {
      mat.emissiveIntensity = 2.0 + Math.sin(t * 8) * 1.0;
    }
  }

  // Elite glowing eyes pulsate in sync with the visor
  ['eyeGlowL', 'eyeGlowR'].forEach(eyeName => {
    const eye = child(group, eyeName);
    if (eye && eye instanceof THREE.Mesh) {
      const m = eye.material as THREE.MeshStandardMaterial;
      if (m && m.isMeshStandardMaterial) {
        m.emissiveIntensity = 3.0 + Math.sin(t * 8) * 1.5;
      }
    }
  });
}

export function animateSkateboardRider(group: THREE.Group, elapsed: number, speed: number): void {
  const t = elapsed * 0.001;
  const rate = speed * 0.035;

  // Wheels spin (visible on the cylindrical truck wheels).
  group.children.forEach(c => {
    if (c.name === 'wheel') c.rotation.x = t * rate * 6;
  });

  // Skateboard stance: subtle weight shift, no bicycling pedal motion.
  const legL = child(group, 'legL');
  const legR = child(group, 'legR');
  if (legL) legL.rotation.x = Math.sin(t * rate) * 0.15;
  if (legR) legR.rotation.x = Math.sin(t * rate + Math.PI) * 0.15;

  const torso = child(group, 'torso');
  if (torso) torso.rotation.x = -0.2 + Math.sin(t * 2) * 0.04; // low crouch

  const armL = child(group, 'armL');
  const armR = child(group, 'armR');
  if (armL) armL.rotation.x = -0.4 + Math.sin(t * rate) * 0.06;
  if (armR) armR.rotation.x = -0.4 + Math.sin(t * rate + Math.PI) * 0.06;
}

export function animateRollerbladeRider(group: THREE.Group, elapsed: number, speed: number): void {
  const t = elapsed * 0.001;
  const rate = speed * 0.035;

  // Inline wheels are spheres (rotationally symmetric) — animate the stride
  // instead of spinning them.
  const legL = child(group, 'legL');
  const legR = child(group, 'legR');
  if (legL) legL.rotation.x = Math.sin(t * rate) * 0.4;
  if (legR) legR.rotation.x = Math.sin(t * rate + Math.PI) * 0.4;

  const torso = child(group, 'torso');
  if (torso) torso.rotation.x = -0.1 + Math.sin(t * 1.5) * 0.03;

  const armL = child(group, 'armL');
  const armR = child(group, 'armR');
  if (armL) armL.rotation.x = -0.3 + Math.sin(t * rate * 1.2) * 0.1;
  if (armR) armR.rotation.x = -0.3 + Math.sin(t * rate * 1.2 + Math.PI) * 0.1;
}

export function animateCitizenPanic(group: THREE.Group, elapsed: number): void {
  const t = elapsed * 0.001;
  const rate = 8;

  const torso = child(group, 'torso');
  if (torso) {
    torso.rotation.z = Math.sin(t * rate) * 0.15; // rock side to side in panic
  }

  const armL = child(group, 'armL');
  const armR = child(group, 'armR');
  if (armL) armL.rotation.x = -Math.PI * 0.6 + Math.sin(t * rate * 1.5) * 0.3; // flail arms
  if (armR) armR.rotation.x = -Math.PI * 0.6 + Math.sin(t * rate * 1.5 + Math.PI) * 0.3;

  const legL = child(group, 'legL');
  const legR = child(group, 'legR');
  if (legL) legL.rotation.x = Math.sin(t * rate) * 0.5;
  if (legR) legR.rotation.x = Math.sin(t * rate + Math.PI) * 0.5;
}
