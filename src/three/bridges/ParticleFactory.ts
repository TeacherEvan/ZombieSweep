import * as THREE from 'three';
import { markShared } from './disposeObject3D';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  ttl: number;
}

// Shared module singletons — reused by every pooled particle mesh. Marked
// shared so any future disposeObject3D path skips them (consistent with the
// other factories' shared MAT bags).
const GEOM_GORE = markShared(new THREE.SphereGeometry(1.2, 5, 5));
const GEOM_ACID = markShared(new THREE.SphereGeometry(1.8, 6, 6));
const GEOM_PAPER = markShared(new THREE.BoxGeometry(1.5, 0.3, 2.5));
const MAT_GORE = markShared(new THREE.MeshBasicMaterial({ color: 0x8b0000 }));
const MAT_ACID = markShared(new THREE.MeshBasicMaterial({ color: 0xb8e820 }));
const MAT_PAPER = markShared(new THREE.MeshBasicMaterial({ color: 0xfaf3e0 }));

export class ParticlePool {
  readonly cap: number;
  private live: Particle[] = [];
  private free: THREE.Mesh[] = [];

  constructor(cap: number) {
    this.cap = cap;
  }

  get liveCount(): number {
    return this.live.length;
  }

  acquire(geom: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh | null {
    if (this.live.length >= this.cap) return null;
    return this.free.pop() ?? new THREE.Mesh(geom, mat);
  }

  addLive(mesh: THREE.Mesh, vx: number, vy: number, vz: number, ttl: number): void {
    this.live.push({ mesh, vx, vy, vz, ttl });
  }

  tick(scene: THREE.Scene, dt: number): void {
    const s = dt / 1000;
    this.live = this.live.filter(p => {
      p.mesh.position.x += p.vx * s;
      p.mesh.position.y += p.vy * s;
      p.mesh.position.z += p.vz * s;
      p.vy -= 60 * s; // gravity
      p.ttl -= dt;
      if (p.ttl <= 0) {
        scene.remove(p.mesh);
        this.free.push(p.mesh);
        return false;
      }
      return true;
    });
  }

  clear(scene: THREE.Scene): void {
    for (const p of this.live) {
      scene.remove(p.mesh);
      this.free.push(p.mesh);
    }
    this.live = [];
  }
}

export function spawnGoreBurst(
  scene: THREE.Scene,
  pool: ParticlePool,
  x: number,
  y: number,
  intensity: number
): void {
  const count = Math.min(Math.round(5 * intensity), 12);
  for (let i = 0; i < count; i++) {
    const mesh = pool.acquire(GEOM_GORE, MAT_GORE);
    if (!mesh) break;
    mesh.position.set(x, y, 0);
    const a = Math.random() * Math.PI * 2;
    const spd = 30 + Math.random() * 60 * intensity;
    pool.addLive(
      mesh,
      Math.cos(a) * spd,
      40 + Math.random() * 60,
      Math.sin(a) * spd * 0.3,
      200 + Math.random() * 150
    );
    scene.add(mesh);
  }
}

export function spawnAcidSplash(
  scene: THREE.Scene,
  pool: ParticlePool,
  x: number,
  y: number
): void {
  for (let i = 0; i < 5; i++) {
    const mesh = pool.acquire(GEOM_ACID, MAT_ACID);
    if (!mesh) break;
    mesh.position.set(x, y, 0);
    const a = Math.random() * Math.PI * 2;
    pool.addLive(
      mesh,
      Math.cos(a) * 35,
      30 + Math.random() * 30,
      Math.sin(a) * 15,
      500 + Math.random() * 300
    );
    scene.add(mesh);
  }
}

export function spawnNewspaperDelivery(
  scene: THREE.Scene,
  pool: ParticlePool,
  x: number,
  y: number
): void {
  for (let i = 0; i < 4; i++) {
    const mesh = pool.acquire(GEOM_PAPER, MAT_PAPER);
    if (!mesh) break;
    mesh.position.set(x, y, 0);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    const a = Math.random() * Math.PI * 2;
    pool.addLive(
      mesh,
      Math.cos(a) * 15,
      50 + Math.random() * 30,
      Math.sin(a) * 10,
      500 + Math.random() * 400
    );
    scene.add(mesh);
  }
}
