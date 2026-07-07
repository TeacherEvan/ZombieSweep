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
