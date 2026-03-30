import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(
      width / 2,
      height / 2 - 50,
      "Loading...",
      {
        fontSize: "20px",
        color: "#ffffff",
      },
    );
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x8b0000, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Placeholder: generate colored rectangles as temporary sprites
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start("WelcomeScene");
  }

  private createPlaceholderTextures(): void {
    // Player vehicles
    this.generateRect("player-bicycle", 32, 48, 0x00ff00);
    this.generateRect("player-rollerblades", 24, 48, 0x00ccff);
    this.generateRect("player-skateboard", 28, 44, 0xffcc00);

    // Zombies
    this.generateRect("zombie-shambler", 32, 40, 0x556b2f);
    this.generateRect("zombie-runner", 28, 44, 0x8b0000);
    this.generateRect("zombie-spitter", 32, 40, 0x6b8e23);

    // Citizens
    this.generateRect("citizen-friendly", 24, 40, 0x4169e1);
    this.generateRect("citizen-panicked", 24, 40, 0xffa500);
    this.generateRect("citizen-armed", 28, 44, 0x808080);

    // Houses
    this.generateRect("house-ranch-sub", 80, 60, 0x32cd32);
    this.generateRect("house-ranch-nonsub", 80, 60, 0x696969);
    this.generateRect("house-colonial-sub", 70, 80, 0x4682b4);
    this.generateRect("house-colonial-nonsub", 70, 80, 0x696969);
    this.generateRect("house-victorian-sub", 75, 90, 0x9370db);
    this.generateRect("house-victorian-nonsub", 75, 90, 0x696969);

    // Hazards
    this.generateRect("hazard-hole", 64, 64, 0x1a1a1a);
    this.generateRect("hazard-log", 192, 32, 0x8b4513);
    this.generateRect("hazard-ice", 96, 96, 0xadd8e6);

    // Pickups
    this.generateRect("pickup-newspaper", 20, 20, 0xfffff0);
    this.generateRect("pickup-ammo", 20, 20, 0xff4500);
    this.generateRect("pickup-health", 20, 20, 0xff69b4);

    // Newspaper projectile
    this.generateRect("newspaper", 12, 8, 0xf5f5dc);

    // UI elements
    this.generateRect("button", 200, 50, 0x333333);
  }

  private generateRect(
    key: string,
    width: number,
    height: number,
    color: number,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, width, height);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
