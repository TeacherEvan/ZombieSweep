import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { DifficultySelectScene } from './scenes/DifficultySelectScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { OnlineCoopScene } from './scenes/OnlineCoopScene';
import { ScoreSummaryScene } from './scenes/ScoreSummaryScene';
import { TrainingScene } from './scenes/TrainingScene';
import { VehicleSelectScene } from './scenes/VehicleSelectScene';
import { WelcomeScene } from './scenes/WelcomeScene';
import { syncBroadcastViewportContext } from './ui/broadcast-viewport';
import {
  initObservability,
  reportFps,
  reportFrameTime,
  reportGameLoopPhase,
  getObservabilityStatus,
} from './observability';

syncBroadcastViewportContext();
window.addEventListener('resize', () => {
  syncBroadcastViewportContext();
});
window.addEventListener('orientationchange', () => {
  syncBroadcastViewportContext();
});

initObservability({
  endpoint: import.meta.env.VITE_ERROR_ENDPOINT ?? undefined,
});

let lastFrame = performance.now();
let frameCount = 0;
let fpsLastLog = performance.now();

const originalRequestAnimationFrame = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return originalRequestAnimationFrame(time => {
    const frameTime = time - lastFrame;
    lastFrame = time;
    frameCount++;

    if (time - fpsLastLog >= 1000) {
      reportFps(frameCount);
      reportFrameTime(frameTime);
      frameCount = 0;
      fpsLastLog = time;
    }

    callback(time);
  });
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.CANVAS,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    WelcomeScene,
    OnlineCoopScene,
    VehicleSelectScene,
    DifficultySelectScene,
    GameScene,
    TrainingScene,
    ScoreSummaryScene,
    GameOverScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  callbacks: {
    preBoot: () => {
      reportGameLoopPhase('preboot', 0);
    },
    postBoot: () => {
      reportGameLoopPhase('postboot', 0);
    },
  },
};

const game = new Phaser.Game(config);

game.events.on('prestep', (_: number, delta: number) => {
  if (delta > 100) {
    reportGameLoopPhase('large_delta', delta);
  }
});

game.events.on('step', (_: number, delta: number) => {
  reportGameLoopPhase('step', delta);
});

game.events.on('poststep', (_: number, delta: number) => {
  reportGameLoopPhase('poststep', delta);
});

game.events.on('prerender', () => {
  reportGameLoopPhase('prerender', 0);
});

game.events.on('postrender', () => {
  reportGameLoopPhase('postrender', 0);
});

if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__ZOMBIESWEEP_OBSERVABILITY__ = {
    getStatus: getObservabilityStatus,
  };

  // DEV-playtest hook: lets an automated agent (Chrome DevTools / evaluate_script)
  // introspect the live game without modifying production behavior. Strip-safe:
  // this whole block is compiled out of production builds (import.meta.env.DEV).
  (window as unknown as Record<string, unknown>).__ZOMBIESWEEP__ = {
    game,
    getActiveScenes: () => game.scene.getScenes(true).map(s => s.scene.key),
    getScene: (key: string) => game.scene.getScene(key),
    getGameState: () => {
      const gs = game.registry.get('gameState');
      if (gs && typeof gs === 'object') {
        const g = gs as Record<string, unknown>;
        return {
          day: g.day,
          lives: g.lives,
          score: g.score,
          subscribers: g.subscribers,
          difficulty: g.difficulty,
          vehicle: g.vehicle,
          isGameOver: g.isGameOver,
        };
      }
      return null;
    },
    isPaused: () => {
      const gameScene = game.scene.getScene('GameScene') as
        | { scene: { isPaused: () => boolean } }
        | undefined;
      return gameScene?.scene?.isPaused?.() ?? false;
    },
  };
}
