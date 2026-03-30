import Phaser from "phaser";
import { DayManager } from "../systems/DayManager";
import { GameState } from "../systems/GameState";

export class HUD {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private dayManager: DayManager;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private papersText!: Phaser.GameObjects.Text;
  private subscribersText!: Phaser.GameObjects.Text;

  private paperCount: number;
  private ammoCount: number;

  constructor(
    scene: Phaser.Scene,
    gameState: GameState,
    paperCount: number,
    ammoCount: number,
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.dayManager = new DayManager();
    this.paperCount = paperCount;
    this.ammoCount = ammoCount;

    this.create();
  }

  private create(): void {
    const style = { fontSize: "14px", color: "#ffffff" };
    const y = 10;

    this.scoreText = this.scene.add
      .text(10, y, "", style)
      .setScrollFactor(0)
      .setDepth(100);
    this.livesText = this.scene.add
      .text(10, y + 20, "", style)
      .setScrollFactor(0)
      .setDepth(100);
    this.dayText = this.scene.add
      .text(10, y + 40, "", style)
      .setScrollFactor(0)
      .setDepth(100);
    this.papersText = this.scene.add
      .text(10, y + 60, "", style)
      .setScrollFactor(0)
      .setDepth(100);
    this.subscribersText = this.scene.add
      .text(10, y + 80, "", style)
      .setScrollFactor(0)
      .setDepth(100);

    this.update();
  }

  setPaperCount(count: number): void {
    this.paperCount = count;
  }

  setAmmoCount(count: number): void {
    this.ammoCount = count;
  }

  update(): void {
    const dow = this.dayManager.getDayOfWeek(this.gameState.day);
    this.scoreText.setText(`Score: ${this.gameState.score}`);
    this.livesText.setText(`Lives: ${"❤️".repeat(this.gameState.lives)}`);
    this.dayText.setText(`Day ${this.gameState.day} — ${dow}`);
    this.papersText.setText(
      `Papers: ${this.paperCount} | Ammo: ${this.ammoCount}`,
    );
    this.subscribersText.setText(
      `Subscribers: ${this.gameState.subscribers}/10`,
    );
  }
}
