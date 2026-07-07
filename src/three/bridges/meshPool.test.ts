import { describe, expect, it, vi } from 'vitest';
import { MeshPool } from './meshPool';

interface FakeMesh {
  id: number;
}

describe('MeshPool', () => {
  it('starts empty', () => {
    const pool = new MeshPool<FakeMesh>(() => ({ id: 0 }));
    expect(pool.liveCount).toBe(0);
  });

  it('grows to the requested count by calling the factory', () => {
    let created = 0;
    const pool = new MeshPool<FakeMesh>(() => ({ id: created++ }));
    pool.sync(3);
    expect(pool.liveCount).toBe(3);
    expect(pool.liveMeshes.map(m => m.id)).toEqual([0, 1, 2]);
  });

  it('reuses freed meshes when shrinking then regrowing', () => {
    let created = 0;
    const pool = new MeshPool<FakeMesh>(() => ({ id: created++ }));
    pool.sync(3);
    pool.sync(1);
    expect(pool.liveCount).toBe(1);
    pool.sync(3);
    // The 2 new slots should reuse the 2 previously freed meshes (ids 1, 2)
    expect(pool.liveMeshes.map(m => m.id).sort()).toEqual([0, 1, 2]);
  });

  it('does not call the factory again when count is unchanged', () => {
    const factory = vi.fn(() => ({ id: 0 }));
    const pool = new MeshPool<FakeMesh>(factory);
    pool.sync(2);
    pool.sync(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('calls dispose when an excess mesh is released', () => {
    let created = 0;
    const disposed: FakeMesh[] = [];
    const pool = new MeshPool<FakeMesh>(
      () => ({ id: created++ }),
      m => disposed.push(m)
    );
    pool.sync(2);
    pool.sync(1);
    expect(disposed.length).toBe(1);
    // sync(1) releases the LAST live mesh (id 1), keeping id 0 alive.
    expect(disposed[0].id).toBe(1);
    expect(pool.liveMeshes.map(m => m.id)).toEqual([0]);
  });

  it('clear() disposes every live mesh and frees the list', () => {
    let created = 0;
    const disposed: FakeMesh[] = [];
    const pool = new MeshPool<FakeMesh>(
      () => ({ id: created++ }),
      m => disposed.push(m)
    );
    pool.sync(4);
    pool.clear();
    expect(pool.liveCount).toBe(0);
    expect(disposed.length).toBe(4);
  });
});
