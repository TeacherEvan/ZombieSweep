import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { DifficultySelectScene } from "./scenes/DifficultySelectScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { GameScene } from "./scenes/GameScene";
import { ScoreSummaryScene } from "./scenes/ScoreSummaryScene";
import { TrainingScene } from "./scenes/TrainingScene";
import { VehicleSelectScene } from "./scenes/VehicleSelectScene";
import { WelcomeScene } from "./scenes/WelcomeScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "app",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    WelcomeScene,
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
};

new Phaser.Game(config);
