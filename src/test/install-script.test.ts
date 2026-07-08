import { existsSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';

describe('install-and-test.sh', () => {
  it('exists at project root', () => {
    expect(existsSync(join(process.cwd(), 'install-and-test.sh'))).toBe(true);
  });

  it('package.json has install:test script', async () => {
    const pkg = await import('../../package.json');
    expect(pkg.scripts?.['install:test']).toBeDefined();
  });
});
