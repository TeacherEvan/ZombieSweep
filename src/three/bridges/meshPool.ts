/**
 * Generic mesh pool.
 *
 * Per-bridge rule: no per-frame allocation. The pool grows to the live source
 * count, reuses freed meshes, and disposes only the excess. `T` is intentionally
 * THREE-agnostic so the pool contract is testable without a WebGL context.
 */
export class MeshPool<T> {
  private live: T[] = [];
  private free: T[] = [];

  constructor(
    private readonly factory: () => T,
    private readonly dispose?: (mesh: T) => void
  ) {}

  get liveCount(): number {
    return this.live.length;
  }

  get liveMeshes(): readonly T[] {
    return this.live;
  }

  /**
   * Reconcile the live set to exactly `count` meshes.
   *  - count > live  → pull from free list or create new
   *  - count < live  → release the overflow (dispose if provided)
   *  - count == live → no-op (no factory calls)
   */
  sync(count: number): void {
    if (count < 0) count = 0;

    while (this.live.length < count) {
      const reused = this.free.pop();
      this.live.push(reused !== undefined ? reused : this.factory());
    }

    while (this.live.length > count) {
      const released = this.live.pop()!;
      this.dispose?.(released);
      this.free.push(released);
    }
  }

  /** Dispose every live mesh and clear both lists. */
  clear(): void {
    for (const mesh of this.live) {
      this.dispose?.(mesh);
    }
    this.live = [];
    this.free = [];
  }
}
