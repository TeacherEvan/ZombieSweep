import { describe, expect, it, vi } from 'vitest';
import { SyncBridge } from './SyncBridge';

/** Minimal contract a concrete bridge interacts with (decoupled from THREE). */
interface TestHost {
  add(mesh: object): void;
  remove(mesh: object): void;
}

class TestBridge extends SyncBridge<object, TestHost> {
  /** Number of times `syncMeshes` ran while enabled. */
  synced = 0;
  /** Meshes currently added to the host. */
  added: object[] = [];
  /** Whether the disabled hook fired. */
  disabledCalled = false;

  protected createMesh(_item: unknown, index: number): object {
    return { index };
  }

  protected onAddToHost(mesh: object, host: TestHost): void {
    this.added.push(mesh);
    host.add(mesh);
  }

  protected onRemoveFromHost(mesh: object, host: TestHost): void {
    this.added = this.added.filter(m => m !== mesh);
    host.remove(mesh);
  }

  protected onDisabled(): void {
    this.disabledCalled = true;
  }

  protected syncMeshes(_source: object[], _host: TestHost): void {
    if (this.isEnabled()) this.synced++;
  }
}

describe('SyncBridge', () => {
  const makeSource = () => [{}, {}, {}];

  it('syncs meshes only when enabled', () => {
    const host: TestHost = { add: vi.fn(), remove: vi.fn() };
    const b = new TestBridge();
    b.setEnabled(false);
    b.update({ source: makeSource(), host });
    expect(b.synced).toBe(0);

    b.setEnabled(true);
    b.update({ source: makeSource(), host });
    expect(b.synced).toBe(1);
  });

  it('adds host meshes when enabled and removes them when disabled', () => {
    const host: TestHost = { add: vi.fn(), remove: vi.fn() };
    const b = new TestBridge();
    b.setEnabled(true);
    b.update({ source: makeSource(), host });
    expect(host.add).toHaveBeenCalledTimes(3);
    expect(host.remove).toHaveBeenCalledTimes(0);

    b.setEnabled(false);
    b.update({ source: makeSource(), host });
    expect(host.remove).toHaveBeenCalledTimes(3);
  });

  it('reports enabled state', () => {
    const b = new TestBridge();
    expect(b.isEnabled()).toBe(false);
    b.setEnabled(true);
    expect(b.isEnabled()).toBe(true);
  });

  it('teardown clears host meshes and resets enabled', () => {
    const host: TestHost = { add: vi.fn(), remove: vi.fn() };
    const b = new TestBridge();
    b.setEnabled(true);
    b.update({ source: makeSource(), host });
    b.teardown(host);
    expect(host.remove).toHaveBeenCalledTimes(3);
    expect(b.isEnabled()).toBe(false);
  });

  it('invokes onDisabled when toggled off, so the 2D layer can be restored', () => {
    const host: TestHost = { add: vi.fn(), remove: vi.fn() };
    const b = new TestBridge();
    b.setEnabled(true);
    b.update({ source: makeSource(), host });
    expect(b.disabledCalled).toBe(false);
    b.setEnabled(false);
    b.update({ source: makeSource(), host });
    expect(b.disabledCalled).toBe(true);
  });
});

describe('SyncBridge — stable-key reconciliation (M1)', () => {
  // A source item whose identity is stable across frames (like a sprite
  // object) but whose array slot changes when an earlier item is removed.
  interface KeyedItem {
    id: number;
    slot: number;
  }

  class KeyedBridge extends SyncBridge<KeyedItem, TestHost> {
    created: KeyedItem[] = [];
    removed: KeyedItem[] = [];

    constructor() {
      super({ getKey: (item: unknown) => (item as KeyedItem).id });
    }

    protected createMesh(item: unknown): KeyedItem {
      const it = item as KeyedItem;
      this.created.push(it);
      return it;
    }
    protected onAddToHost(mesh: KeyedItem, host: TestHost): void {
      host.add(mesh);
    }
    protected onRemoveFromHost(mesh: KeyedItem, host: TestHost): void {
      this.removed.push(mesh);
      host.remove(mesh);
    }
    protected onDisabled(): void {}
    protected syncMeshes(): void {}
  }

  it('keeps a mesh bound to its stable key across reindexing', () => {
    const host: TestHost = { add: vi.fn(), remove: vi.fn() };
    const b = new KeyedBridge();
    b.setEnabled(true);

    // Frame 1: items A (slot 0), B (slot 1).
    const a = { id: 1, slot: 0 };
    const bb = { id: 2, slot: 1 };
    b.update({ source: [a, bb], host });
    expect(b.created.map(i => i.id)).toEqual([1, 2]);

    // Frame 2: A removed mid-list → B shifts to slot 0. B must NOT be
    // recreated (its key is unchanged) and A must be the one removed.
    b.created = [];
    b.removed = [];
    b.update({ source: [bb], host });
    expect(b.created.map(i => i.id)).toEqual([]); // B reused
    expect(b.removed.map(i => i.id)).toEqual([1]); // only A removed
  });

  it('recreates a mesh when its key reappears after a gap', () => {
    const host: TestHost = { add: vi.fn(), remove: vi.fn() };
    const b = new KeyedBridge();
    b.setEnabled(true);

    const a = { id: 1, slot: 0 };
    b.update({ source: [a], host });
    b.update({ source: [], host }); // A removed
    b.created = [];
    b.update({ source: [a], host }); // A returns
    expect(b.created.map(i => i.id)).toEqual([1]);
  });
});
