import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Phaser's WebGLRenderer `require`s `phaser3spectorjs` unconditionally at
// import time (statically, even though guarded by a DEBUG flag), even though
// this project uses the CANVAS renderer (and the 3D layer is a separate
// three.js scene). Alias the missing dev-only module to an empty stub so
// headless tests that import Phaser can load. No runtime code path exercises
// the WebGL renderer in this project.
const phaser3spectorStub = fileURLToPath(
  new URL("./src/test/phaser3spectorjs-stub.js", import.meta.url)
);

export default defineConfig({
  resolve: {
    alias: {
      phaser3spectorjs: phaser3spectorStub,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    alias: {
      phaser3spectorjs: phaser3spectorStub,
    },
    // The jsdom-pool test that imports the real Phaser (GameScene) is loaded via
    // Vite's transform pipeline, which bypasses the esbuild dep optimizer that
    // bakes the `phaser3spectorjs` alias into the pre-bundled dist. Inline
    // Phaser so the alias is applied at transform time in every environment.
    deps: {
      inline: ["phaser"],
    },
  },
});
