import { disposeObject3D, type BridgeKey } from './disposeObject3D';

/**
 * Abstract sync bridge base.
 *
 * A bridge reconciles a registered 2D sprite group (the `source`) into 3D
 * meshes each frame. It owns a map of live meshes keyed by a STABLE id derived
 * from each source item (see {@link SyncBridgeOptions.getKey}); on every
 * {@link update} it:
 *  - adds meshes for new keys    → `createMesh()` + `onAddToHost()`
 *  - removes meshes for gone keys → `onRemoveFromHost()`
 *  - while enabled → `syncMeshes()` positions the live meshes
 *
 * Keying (not array index) is essential: the caller builds `source` via
 * `Phaser.Group.getChildren()` each frame, and Phaser reindexes that array when
 * a sprite is destroyed mid-list. Index-based reconciliation would then bind a
 * mesh originally built for entity A to entity B's data (wrong model / stale
 * transform). Keying by a stable entity id keeps each mesh bound to its owner.
 *
 * `enabled` is the flag contract: when OFF the bridge releases every mesh from
 * the host (the corresponding 2D group stays/returns visible). Base is
 * THREE-agnostic via `HostT` so the lifecycle is testable without WebGL.
 */
export interface BridgeUpdateArgs<HostT> {
  source: unknown[];
  host: HostT;
}

export interface SyncBridgeOptions {
  /**
   * Derive a stable, comparable key for a source item at `index`. Must return
   * the same key for the same logical entity across frames. Defaults to the
   * source item's own identity (object reference), which is fine for callers
   * that reuse the same item objects each frame; bridges that rebuild source
   * arrays each frame (e.g. from `getChildren()`) MUST supply a stable key
   * (e.g. the sprite's entity id).
   */
  getKey?: (item: unknown, index: number) => BridgeKey;
}

export abstract class SyncBridge<MeshT, HostT> {
  private enabled = false;
  private readonly getKey: (item: unknown, index: number) => BridgeKey;
  /** Live meshes keyed by stable id. */
  private readonly meshes = new Map<BridgeKey, MeshT>();
  /** Current source item per key, for stable-order syncing. */
  private currentItems = new Map<BridgeKey, unknown>();

  constructor(opts: SyncBridgeOptions = {}) {
    this.getKey = opts.getKey ?? ((item: unknown) => item as BridgeKey);
  }

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

    const next = new Map<BridgeKey, { item: unknown; mesh: MeshT }>();
    for (let i = 0; i < source.length; i++) {
      const item = source[i];
      const key = this.getKey(item, i);
      let entry = this.meshes.get(key);
      if (entry === undefined) {
        entry = this.createMesh(item, i);
        this.meshes.set(key, entry);
        this.onAddToHost(entry, host);
      }
      next.set(key, { item, mesh: entry });
    }

    // Remove meshes whose key is no longer present.
    for (const [key, mesh] of this.meshes) {
      if (!next.has(key)) {
        this.meshes.delete(key);
        this.onRemoveFromHost(mesh, host);
      }
    }

    // Snapshot the current item per key (stable order) for syncMeshes.
    this.currentItems = new Map();
    for (const [key, { item }] of next) {
      this.currentItems.set(key, item);
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
    return [...this.meshes.values()];
  }

  /**
   * Current (sourceItem, mesh) pairs in stable-key order. Bridges use this in
   * `syncMeshes` to bind each source entity to the mesh built for its key —
   * independent of array-index reindexing in the caller.
   */
  protected getSyncedPairs(): Array<[unknown, MeshT]> {
    const pairs: Array<[unknown, MeshT]> = [];
    for (const [key, mesh] of this.meshes) {
      pairs.push([this.currentItems.get(key), mesh]);
    }
    return pairs;
  }

  /** Live meshes in stable-key order (deterministic, unlike insertion order). */
  protected get liveMeshesByKey(): IterableIterator<[BridgeKey, MeshT]> {
    return this.meshes.entries();
  }

  private releaseAll(host: HostT): void {
    for (const [, mesh] of this.meshes) {
      this.onRemoveFromHost(mesh, host);
    }
    this.meshes.clear();
    this.currentItems.clear();
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

// Re-exported so bridges can dispose removed meshes without per-bridge helpers.
export { disposeObject3D };
