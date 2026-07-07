import { describe, expect, it, vi } from 'vitest';
import { Render3DManager } from './Render3DManager';
import type { SceneHost, RendererStub } from './Render3DManager';

/** Stub renderer used in tests — exercises manager wiring without WebGL. */
function makeStubRenderer(): RendererStub {
  return {
    render: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn(),
    domElement: { tagName: 'CANVAS' } as unknown as HTMLCanvasElement,
  };
}

function makeHost(): SceneHost {
  const children: unknown[] = [];
  return {
    add: (m: unknown) => children.push(m),
    remove: (m: unknown) => {
      const i = children.indexOf(m);
      if (i >= 0) children.splice(i, 1);
    },
    children,
  };
}

describe('Render3DManager', () => {
  it('does NOT construct a renderer when the flag is off (zero 2D regression)', () => {
    const rendererFactory = vi.fn(makeStubRenderer);
    const host = makeHost();
    const manager = new Render3DManager({
      enabled: false,
      rendererFactory,
      host,
    });
    manager.create();
    expect(rendererFactory).not.toHaveBeenCalled();
    expect(manager.isActive()).toBe(false);
  });

  it('constructs the renderer, scene, and camera when the flag is on', () => {
    const rendererFactory = vi.fn(makeStubRenderer);
    const host = makeHost();
    const manager = new Render3DManager({
      enabled: true,
      rendererFactory,
      host,
    });
    manager.create();
    expect(rendererFactory).toHaveBeenCalledTimes(1);
    expect(manager.isActive()).toBe(true);
  });

  it('update() is a no-op when inactive (flag off → no render calls)', () => {
    const renderer = makeStubRenderer();
    const rendererFactory = vi.fn(() => renderer);
    const manager = new Render3DManager({
      enabled: false,
      rendererFactory,
      host: makeHost(),
    });
    manager.create();
    manager.update(0);
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it('update() renders each frame when active', () => {
    const renderer = makeStubRenderer();
    const rendererFactory = vi.fn(() => renderer);
    const manager = new Render3DManager({
      enabled: true,
      rendererFactory,
      host: makeHost(),
    });
    manager.create();
    manager.update(16);
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });

  it('teardown disposes the renderer and deactivates', () => {
    const renderer = makeStubRenderer();
    const rendererFactory = vi.fn(() => renderer);
    const manager = new Render3DManager({
      enabled: true,
      rendererFactory,
      host: makeHost(),
    });
    manager.create();
    manager.teardown();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(manager.isActive()).toBe(false);
  });

  it('teardown when inactive is safe (no renderer → no throw)', () => {
    const rendererFactory = vi.fn(makeStubRenderer);
    const manager = new Render3DManager({
      enabled: false,
      rendererFactory,
      host: makeHost(),
    });
    manager.create();
    expect(() => manager.teardown()).not.toThrow();
  });
});
