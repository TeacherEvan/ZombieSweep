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
  width: 960,
  height: 540,
  parent: 'app',
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
    autoCenter: Phaser.Scale.NO_CENTER,
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
}
