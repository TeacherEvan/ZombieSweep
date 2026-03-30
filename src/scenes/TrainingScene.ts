import Phaser from "phaser";
import { createNewspaper } from "../entities/Newspaper";
import { DayManager } from "../systems/DayManager";
import { GameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";
import { BC, BROADCAST_FONT } from "../ui/broadcast-styles";
import { HUD } from "../ui/HUD";
import { fadeIn, fadeToScene, floatingText } from "../utils/animations";

interface DeliveryData {
  house: { isSubscriber: boolean };
  delivered: boolean;
}

export class TrainingScene extends Phaser.Scene {
  private gameState!: GameState;
  private scoreManager!: ScoreManager;
  private dayManager!: DayManager;
  private hud!: HUD;
  private player!: Phaser.Physics.Arcade.Sprite;
  private papers!: Phaser.Physics.Arcade.Group;
  private targets!: Phaser.Physics.Arcade.StaticGroup;
  private ramps!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private consecutiveHits = 0;
  private deliveryData: DeliveryData[] = [];

  constructor() {
    super({ key: "TrainingScene" });
  }

  init(data: { deliveryData: DeliveryData[] }): void {
    this.deliveryData = data.deliveryData || [];
    this.consecutiveHits = 0;
  }

  create(): void {
    this.gameState = this.registry.get("gameState") as GameState;
    this.scoreManager = new ScoreManager(this.gameState);
    this.dayManager = new DayManager();

    this.cameras.main.setBackgroundColor("#1a2a1a");
    fadeIn(this);

    // Training ground textures
    const groundGfx = this.add.graphics();
    groundGfx.setDepth(-10);
    // Grass field
    groundGfx.fillStyle(0x2a4a2a, 1);
    groundGfx.fillRect(0, 0, 960, 540);
    // Central track lane
    groundGfx.fillStyle(0x3a3a2a, 1);
    groundGfx.fillRect(180, 0, 600, 540);
    // Lane markings
    groundGfx.fillStyle(0x5a5a3a, 0.3);
    for (let ly = 0; ly < 540; ly += 30) {
      groundGfx.fillRect(478, ly, 4, 18);
    }
    // Side grass detail
    groundGfx.fillStyle(0x224422, 0.4);
    for (let gy = 0; gy < 540; gy += 20) {
      groundGfx.fillRect(0, gy, 180, 1);
      groundGfx.fillRect(780, gy, 180, 1);
    }

    // Header with dramatic styling
    this.add
      .text(482, 22, "TRAINING COURSE", {
        fontFamily: BROADCAST_FONT,
        fontSize: "34px",
        fontStyle: "800",
        color: "#000000",
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.4)
      .setDepth(10);

    this.add
      .text(480, 20, "TRAINING COURSE", {
        fontFamily: BROADCAST_FONT,
        fontSize: "34px",
        fontStyle: "800",
        color: BC.css.GOLD,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ffcc44",
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    this.add
      .text(480, 58, "UNLIMITED PAPERS  ·  HIT TARGETS FOR BONUS", {
        fontFamily: BROADCAST_FONT,
        fontSize: "12px",
        fontStyle: "600",
        color: BC.TEXT_DIM,
        letterSpacing: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(10);

    // Physics groups
    this.papers = this.physics.add.group();
    this.targets = this.physics.add.staticGroup();
    this.ramps = this.physics.add.staticGroup();

    // Player
    const playerKey = `player-${this.gameState.vehicle.toLowerCase()}`;
    this.player = this.physics.add.sprite(480, 450, playerKey);
    this.player.setCollideWorldBounds(true);

    // Place targets on left and right
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? 70 : 890;
      const y = 100 + i * 65;
      const target = this.physics.add.staticSprite(side, y, "target");
      target.setData("type", "target");
      this.targets.add(target);
    }

    // Place ramps in the middle
    for (let i = 0; i < 3; i++) {
      const x = 300 + i * 180;
      const ramp = this.physics.add.staticSprite(x, 200 + i * 80, "ramp");
      ramp.setData("type", "ramp");
      this.ramps.add(ramp);
    }

    // Overlap: papers hit targets
    this.physics.add.overlap(
      this.papers,
      this.targets,
      this
        .onHitTarget as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.papers,
      this.ramps,
      this
        .onHitRamp as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    // Crash = collide with ramp
    this.physics.add.overlap(
      this.player,
      this.ramps,
      this
        .onCrash as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey("W"),
      A: this.input.keyboard!.addKey("A"),
      S: this.input.keyboard!.addKey("S"),
      D: this.input.keyboard!.addKey("D"),
    };
    this.keys = {
      Q: this.input.keyboard!.addKey("Q"),
      E: this.input.keyboard!.addKey("E"),
    };

    // HUD
    const paperCount = 999; // Unlimited
    this.hud = new HUD(this, this.gameState, paperCount, 0);

    // Countdown timer display
    const timerText = this.add
      .text(920, 20, "15", {
        fontFamily: BROADCAST_FONT,
        fontSize: "28px",
        fontStyle: "800",
        color: BC.TEXT,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(100);

    let remaining = 15;
    this.time.addEvent({
      delay: 1000,
      repeat: 14,
      callback: () => {
        remaining--;
        timerText.setText(`${remaining}`);
        if (remaining <= 5) {
          timerText.setColor(BC.css.RED);
          // Pulse urgency
          this.tweens.add({
            targets: timerText,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 120,
            yoyo: true,
            ease: "Quart.easeOut",
          });
        }
      },
    });

    // Auto-end after 15 seconds
    this.time.delayedCall(15000, () => this.endTraining());
  }

  update(): void {
    const speed = 200;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

    this.player.setVelocity(vx, vy);

    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
      this.throwPaper("left");
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
      this.throwPaper("right");
    }

    // Remove out-of-bounds papers
    this.papers.getChildren().forEach((obj) => {
      const p = obj as Phaser.Physics.Arcade.Sprite;
      if (p.x < -50 || p.x > 1010 || p.y < -50 || p.y > 590) {
        this.consecutiveHits = 0;
        p.destroy();
      }
    });

    this.hud.update();
  }

  private throwPaper(direction: "left" | "right"): void {
    const isSunday = this.dayManager.isSunday(this.gameState.day);
    const np = createNewspaper(
      this.player.x,
      this.player.y,
      direction,
      isSunday,
    );

    const sprite = this.physics.add.sprite(
      this.player.x,
      this.player.y,
      "newspaper",
    );
    sprite.setData("newspaper", np);
    const vx = direction === "left" ? -np.speed * 40 : np.speed * 40;
    sprite.setVelocity(vx, -20);
    this.papers.add(sprite);
  }

  private onHitTarget(
    _paperObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _targetObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const paperSprite = _paperObj as Phaser.Physics.Arcade.Sprite;
    const targetSprite = _targetObj as Phaser.Physics.Arcade.Sprite;
    this.consecutiveHits++;
    // Multiplier: 1x, 2x, 3x etc.
    this.scoreManager.trainingTarget();
    if (this.consecutiveHits > 1) {
      this.gameState.addRawScore(50 * (this.consecutiveHits - 1));
    }

    // Target hit flash
    targetSprite.setTint(0xffffff);
    this.time.delayedCall(100, () => {
      targetSprite.clearTint();
    });

    // Floating combo text
    if (this.consecutiveHits > 1) {
      floatingText(
        this,
        targetSprite.x,
        targetSprite.y - 10,
        `${this.consecutiveHits}× COMBO!`,
        "#ffcc22",
        "20px",
        50,
        900,
      );
    } else {
      floatingText(
        this,
        targetSprite.x,
        targetSprite.y - 10,
        "HIT!",
        "#22ee66",
        "14px",
      );
    }

    paperSprite.destroy();
  }

  private onHitRamp(
    _paperObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _rampObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const paperSprite = _paperObj as Phaser.Physics.Arcade.Sprite;
    this.scoreManager.trainingRamp();
    floatingText(
      this,
      paperSprite.x,
      paperSprite.y - 10,
      "RAMP!",
      "#ddaa22",
      "14px",
    );
    paperSprite.destroy();
  }

  private onCrash(): void {
    // Crash ends training (no life loss)
    this.endTraining();
  }

  private endTraining(): void {
    fadeToScene(this, "ScoreSummaryScene", { deliveryData: this.deliveryData });
  }
}
