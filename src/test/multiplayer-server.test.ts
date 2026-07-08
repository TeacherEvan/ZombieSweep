import { describe, it, expect, afterAll } from 'vitest';
import { spawn } from 'child_process';
import WebSocket from 'ws';

interface RoomHostedResponse {
  type: 'room-hosted';
  roomCode: string;
  mode: string;
}

interface MinimalProcess {
  kill(signal?: string): boolean;
  stderr: {
    on(event: 'data', listener: (chunk: unknown) => void): void;
  } | null;
  killed: boolean;
  exitCode: number | null;
}

describe('Multiplayer Server Smoke Test', () => {
  let serverProcess: MinimalProcess | null = null;
  const TEST_PORT = 2568;

  const stopServer = () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    }
  };

  afterAll(() => {
    stopServer();
  });

  it('starts up without syntax errors and responds to WebSocket connection', async () => {
    // Spawn server process
    serverProcess = spawn('node', ['server/multiplayer-server.mjs'], {
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
      },
    });

    let stderrOutput = '';
    serverProcess.stderr?.on('data', data => {
      stderrOutput += String(data);
    });

    // Wait for the server to bind or error out
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`Server startup timed out. Stderr: ${stderrOutput}`)),
        3000
      );

      // We can poll connection until it's open, or listen to stdout/stderr.
      // Let's poll connecting to ws://localhost:2568 every 100ms
      const interval = setInterval(() => {
        const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
        ws.on('open', () => {
          ws.close();
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
        });
        ws.on('error', () => {
          // If the process exited, fail fast
          if (serverProcess?.killed || serverProcess?.exitCode !== null) {
            clearInterval(interval);
            clearTimeout(timeout);
            reject(new Error(`Server process exited prematurely. Stderr: ${stderrOutput}`));
          }
        });
      }, 100);
    });

    // Now make a clean connection to verify room hosting protocol
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);

    const roomHostedPromise = new Promise<RoomHostedResponse>((resolve, reject) => {
      ws.on('message', data => {
        try {
          const msg = JSON.parse(String(data)) as Record<string, unknown>;
          if (msg.type === 'room-hosted') {
            resolve(msg as unknown as RoomHostedResponse);
          } else if (msg.type === 'error') {
            reject(new Error(String(msg.message)));
          }
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'host-room', mode: 'coop' }));
      });

      ws.on('error', err => {
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });

    const response = await roomHostedPromise;
    expect(response.type).toBe('room-hosted');
    expect(response.roomCode).toMatch(/^[A-Z2-9]{4}$/);
    expect(response.mode).toBe('coop');

    ws.close();
  });
});
