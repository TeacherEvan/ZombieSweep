import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Phaser's WebGLRenderer `require`s `phaser3spectorjs` unconditionally at
// import time (statically, even though guarded by a DEBUG flag), even though
// this project uses the CANVAS renderer (and the 3D layer is a separate
// three.js scene). Alias the missing dev-only module to an empty stub so
// headless tests that import Phaser can load. No runtime code path exercises
// the WebGL renderer in this project.
const phaser3spectorStub = fileURLToPath(
  new URL("./src/test/phaser3spectorjs-stub.js", import.meta.url),
);

// Render3D smoke config: injects VITE_RENDER3D=true so the feature-flag-gated
// 3D bridges are exercised end-to-end through the real GameScene wiring.
// (design P5.1/P5.3: full suite green with render3d ON and OFF.)
export default defineConfig({
  resolve: {
    alias: {
      phaser3spectorjs: phaser3spectorStub,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      VITE_RENDER3D: "true",
    },
    alias: {
      phaser3spectorjs: phaser3spectorStub,
    },
    server: {
      deps: {
        inline: ["phaser"],
      },
    },
  },
});
