/**
 * Abstract sync bridge base.
 *
 * A bridge reconciles a registered 2D sprite group (the `source`) into 3D
 * meshes each frame. It owns the live mesh list and, on every
 * {@link update}, grows/shrinks it to match the source count:
 *  - new slots    → `createMesh()` + `onAddToHost()`
 *  - removed slots → `onRemoveFromHost()`
 *  - while enabled → `syncMeshes()` positions the live meshes
 *
 * `enabled` is the flag contract: when OFF the bridge releases every mesh from
 * the host (the corresponding 2D group stays/returns visible). Base is
 * THREE-agnostic via `HostT` so the lifecycle is testable without WebGL.
 */
export interface BridgeUpdateArgs<HostT> {
  source: unknown[];
  host: HostT;
}

export abstract class SyncBridge<MeshT, HostT> {
  private enabled = false;
  private meshes: MeshT[] = [];

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Per-frame reconciliation. No-ops mesh syncing while disabled. */
  update(args: BridgeUpdateArgs<HostT>): void {
    const { source, host } = args;

    if (!this.enabled) {
      this.releaseAll(host);
      this.onDisabled(source, host);
      return;
    }

    // Grow to source count.
    while (this.meshes.length < source.length) {
      const mesh = this.createMesh(source[this.meshes.length], this.meshes.length);
      this.meshes.push(mesh);
      this.onAddToHost(mesh, host);
    }

    // Shrink to source count.
    while (this.meshes.length > source.length) {
      const mesh = this.meshes.pop()!;
      this.onRemoveFromHost(mesh, host);
    }

    this.syncMeshes(source, host);
  }

  /** Hook: restore the 2D layer when the bridge is disabled. */
  protected onDisabled(_source: unknown[], _host: HostT): void {
    // default: nothing
  }

  /** Release all live meshes from the host and reset the enabled flag. */
  teardown(host: HostT): void {
    this.releaseAll(host);
    this.setEnabled(false);
  }

  protected get liveMeshes(): readonly MeshT[] {
    return this.meshes;
  }

  private releaseAll(host: HostT): void {
    while (this.meshes.length > 0) {
      const mesh = this.meshes.pop()!;
      this.onRemoveFromHost(mesh, host);
    }
  }

  /** Create a mesh for the i-th source item. */
  protected abstract createMesh(item: unknown, index: number): MeshT;
  /** Attach a mesh to the host (e.g. scene.add). */
  protected abstract onAddToHost(mesh: MeshT, host: HostT): void;
  /** Detach a mesh from the host (e.g. scene.remove + dispose). */
  protected abstract onRemoveFromHost(mesh: MeshT, host: HostT): void;
  /** Per-frame mesh positioning from source state. */
  protected abstract syncMeshes(source: unknown[], host: HostT): void;
}
