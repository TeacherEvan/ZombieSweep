import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Loading bar background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x141418, 0.9);
    progressBox.fillRoundedRect(width / 2 - 170, height / 2 - 30, 340, 60, 6);
    progressBox.fillStyle(0xcc1100, 1);
    progressBox.fillRect(width / 2 - 170, height / 2 - 30, 340, 3);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(
      width / 2,
      height / 2 - 55,
      "LOADING...",
      {
        fontFamily: "Impact, 'Arial Black', sans-serif",
        fontSize: "22px",
        color: "#cc1100",
      },
    );
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xcc1100, 1);
      progressBar.fillRoundedRect(
        width / 2 - 155,
        height / 2 - 12,
        310 * value,
        24,
        3,
      );
      // Inner highlight
      progressBar.fillStyle(0xff3300, 0.3);
      progressBar.fillRect(width / 2 - 155, height / 2 - 12, 310 * value, 8);
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
    // Player vehicles — distinctive shapes with outlines
    this.generateVehicle("player-bicycle", 32, 48, 0x22bb44, 0x115522);
    this.generateVehicle("player-rollerblades", 24, 48, 0x2299dd, 0x114466);
    this.generateVehicle("player-skateboard", 28, 44, 0xddaa22, 0x665511);

    // Zombies — dark greens and reds with menacing look
    this.generateZombie("zombie-shambler", 32, 40, 0x4a6a3a, 0x2a3a1a);
    this.generateZombie("zombie-runner", 28, 44, 0x8b2222, 0x551111);
    this.generateZombie("zombie-spitter", 32, 40, 0x6b8e33, 0x3a5511);

    // Citizens
    this.generateRect("citizen-friendly", 24, 40, 0x4169e1);
    this.generateRect("citizen-panicked", 24, 40, 0xdd8833);
    this.generateRect("citizen-armed", 28, 44, 0x808080);

    // Houses — subscriber vs non-subscriber with distinct styles
    this.generateHouse("house-ranch-sub", 80, 60, 0x44aa44, true);
    this.generateHouse("house-ranch-nonsub", 80, 60, 0x4a4a4a, false);
    this.generateHouse("house-colonial-sub", 70, 80, 0x4682b4, true);
    this.generateHouse("house-colonial-nonsub", 70, 80, 0x4a4a4a, false);
    this.generateHouse("house-victorian-sub", 75, 90, 0x8866aa, true);
    this.generateHouse("house-victorian-nonsub", 75, 90, 0x4a4a4a, false);

    // Hazards — clear danger markers
    this.generateHazard("hazard-hole", 64, 64, 0x1a1a1a, 0x333300);
    this.generateHazard("hazard-log", 192, 32, 0x6b4423, 0x4a3015);
    this.generateHazard("hazard-ice", 96, 96, 0x88bbdd, 0x6699bb);

    // Pickups — bright and noticeable
    this.generatePickup("pickup-newspaper", 20, 20, 0xf5f0d0, "📰");
    this.generatePickup("pickup-ammo", 20, 20, 0xff5500, "🔶");
    this.generatePickup("pickup-health", 20, 20, 0xff3366, "➕");

    // Newspaper projectile
    this.generateRect("newspaper", 12, 8, 0xf5f0c0);

    // Training elements
    this.generateTarget("target", 40, 40);
    this.generateRect("ramp", 50, 20, 0xcc8844);

    // UI
    this.generateRect("button", 200, 50, 0x1a1a1a);
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

  private generateVehicle(
    key: string,
    width: number,
    height: number,
    color: number,
    outline: number,
  ): void {
    const g = this.add.graphics();
    // Body
    g.fillStyle(outline, 1);
    g.fillRoundedRect(0, 0, width, height, 4);
    g.fillStyle(color, 1);
    g.fillRoundedRect(2, 2, width - 4, height - 4, 3);
    // Highlight stripe
    g.fillStyle(0xffffff, 0.2);
    g.fillRect(4, 4, width - 8, 6);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generateZombie(
    key: string,
    width: number,
    height: number,
    color: number,
    outline: number,
  ): void {
    const g = this.add.graphics();
    // Body
    g.fillStyle(outline, 1);
    g.fillRoundedRect(0, 4, width, height - 4, 3);
    g.fillStyle(color, 1);
    g.fillRoundedRect(2, 6, width - 4, height - 8, 2);
    // Head
    g.fillStyle(color, 1);
    g.fillCircle(width / 2, 6, 8);
    // Eyes (red dots)
    g.fillStyle(0xcc0000, 1);
    g.fillCircle(width / 2 - 3, 5, 2);
    g.fillCircle(width / 2 + 3, 5, 2);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generateHouse(
    key: string,
    width: number,
    height: number,
    color: number,
    isSubscriber: boolean,
  ): void {
    const g = this.add.graphics();
    // Wall
    g.fillStyle(color, 1);
    g.fillRect(4, height * 0.3, width - 8, height * 0.7);
    // Roof (triangle shape via trapezoid)
    g.fillStyle(isSubscriber ? 0x885533 : 0x3a3a3a, 1);
    g.fillTriangle(width / 2, 0, 0, height * 0.35, width, height * 0.35);
    // Door
    g.fillStyle(isSubscriber ? 0x553311 : 0x222222, 1);
    g.fillRect(width / 2 - 6, height * 0.6, 12, height * 0.4);
    // Window
    if (isSubscriber) {
      g.fillStyle(0xffee88, 0.8);
    } else {
      g.fillStyle(0x333333, 0.6);
    }
    g.fillRect(width * 0.2, height * 0.45, 10, 8);
    g.fillRect(width * 0.65, height * 0.45, 10, 8);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generateHazard(
    key: string,
    width: number,
    height: number,
    color: number,
    border: number,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(border, 1);
    g.fillRoundedRect(0, 0, width, height, 2);
    g.fillStyle(color, 1);
    g.fillRoundedRect(2, 2, width - 4, height - 4, 1);
    // Warning stripes
    g.fillStyle(0xccaa00, 0.3);
    for (let i = 0; i < width; i += 12) {
      g.fillRect(i, 0, 6, 3);
      g.fillRect(i + 6, height - 3, 6, 3);
    }
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generatePickup(
    key: string,
    width: number,
    height: number,
    color: number,
    _icon: string,
  ): void {
    const g = this.add.graphics();
    // Glowing circle
    g.fillStyle(color, 0.3);
    g.fillCircle(width / 2, height / 2, width / 2);
    g.fillStyle(color, 1);
    g.fillCircle(width / 2, height / 2, width / 2 - 3);
    // Highlight
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(width / 2 - 2, height / 2 - 2, 3);
    g.generateTexture(key, width, height);
    g.destroy();
  }

  private generateTarget(key: string, width: number, height: number): void {
    const g = this.add.graphics();
    // Concentric rings
    g.fillStyle(0xffffff, 1);
    g.fillCircle(width / 2, height / 2, width / 2);
    g.fillStyle(0xcc1100, 1);
    g.fillCircle(width / 2, height / 2, width / 2 - 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(width / 2, height / 2, width / 2 - 8);
    g.fillStyle(0xcc1100, 1);
    g.fillCircle(width / 2, height / 2, width / 2 - 12);
    g.generateTexture(key, width, height);
    g.destroy();
  }
}
