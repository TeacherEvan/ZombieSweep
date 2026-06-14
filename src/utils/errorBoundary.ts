import type Phaser from 'phaser';
import { captureError, reportMetric } from '../observability';

type AnyFunction = (...args: unknown[]) => unknown;

function safeGet<T>(obj: unknown, key: string): T | undefined {
  return (obj as Record<string, unknown>)[key] as T | undefined;
}

function safeSet(obj: unknown, key: string, value: unknown): void {
  (obj as Record<string, unknown>)[key] = value;
}

export function wrapSceneMethods(scene: Phaser.Scene, sceneName: string): void {
  const originalCreate = safeGet<(...args: unknown[]) => void>(scene, 'create');
  if (originalCreate) {
    safeSet(scene, 'create', (...args: unknown[]) => {
      try {
        originalCreate.bind(scene)(...args);
      } catch (err) {
        captureError({
          event: 'error_caught',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          context: { scene: sceneName, phase: 'create' },
        });
        throw err;
      }
    });
  }

  const originalUpdate = safeGet<(time: number, delta: number) => void>(scene, 'update');
  if (originalUpdate) {
    safeSet(scene, 'update', (time: number, delta: number) => {
      const start = performance.now();
      try {
        originalUpdate.bind(scene)(time, delta);
      } catch (err) {
        captureError({
          event: 'error_caught',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          context: { scene: sceneName, phase: 'update', time, delta },
        });
        throw err;
      } finally {
        reportMetric(`scene_update_${sceneName}`, performance.now() - start, 'ms');
      }
    });
  }

  const originalShutdown = safeGet<() => void>(scene, 'shutdown');
  if (originalShutdown) {
    safeSet(scene, 'shutdown', () => {
      try {
        originalShutdown.bind(scene)();
      } catch (err) {
        captureError({
          event: 'error_caught',
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          context: { scene: sceneName, phase: 'shutdown' },
        });
      }
    });
  }
}

export function wrapMethod<T extends object>(
  obj: T,
  methodName: string,
  context: Record<string, unknown>
): void {
  const original = obj[methodName as keyof T];
  if (typeof original !== 'function') return;

  (obj as Record<string, unknown>)[methodName] = function (...args: unknown[]) {
    const start = performance.now();
    try {
      return (original as AnyFunction).apply(this, args);
    } catch (err) {
      captureError({
        event: 'error_caught',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        context: { method: methodName, ...context },
      });
      throw err;
    } finally {
      reportMetric(
        `method_${JSON.stringify(context).replace(/[^a-zA-Z0-9]/g, '_')}_${methodName}`,
        performance.now() - start,
        'ms'
      );
    }
  };
}

export function initSceneErrorBoundary(scene: Phaser.Scene): void {
  wrapSceneMethods(scene, scene.scene.key);
}
