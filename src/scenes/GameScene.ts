import Phaser from "phaser";
import { GAME } from "../config/constants";
import { VEHICLE_STATS, WeaponSlot } from "../config/vehicles";
import {
  createArmedSurvivalist,
  createFriendlyNeighbor,
  createPanickedRunner,
  Citizen,
  CitizenType,
} from "../entities/Citizen";
import { PickupType, createPickup } from "../entities/Pickup";
import {
  createNewspaper,
  Newspaper,
  NewspaperState,
} from "../entities/Newspaper";
import {
  createRunner,
  createShambler,
  createSpitter,
  Zombie,
  ZombieType,
} from "../entities/Zombie";
import { MAPS } from "../maps/MapConfig";
import { MapConfig } from "../maps/MapConfig";
import { generateRoute, Route } from "../maps/MapGenerator";
import { ComboTracker } from "../systems/ComboTracker";
import { DayManager } from "../systems/DayManager";
import { GameState, getOrCreateGameState } from "../systems/GameState";
import { ScoreManager } from "../systems/ScoreManager";
import { BC } from "../ui/broadcast-styles";
import { HUD } from "../ui/HUD";
import { PauseMenu } from "../ui/PauseMenu";
import {
  headlineDelivery,
  headlineLifeLost,
  headlineZombieKill,
} from "../ui/ticker-bridge";
import {
  collectEffect,
  damageFlash,
  deathFlash,
  fadeIn,
  fadeToScene,
  floatingText,
  meleeSwingArc,
  screenShake,
} from "../utils/animations";
import {
  classifyDelivery,
  getHouseTextureKey,
  getRouteScrollSpeed,
  getVehicleControlProfile,
  getZombieWaveSettings,
} from "./arcade-rules";
import {
  createMeleeWeapon,
  createRangedWeapon,
  MeleeWeapon,
  RangedWeapon,
} from "../weapons/Weapon";

interface PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  paperCount: number;
  meleeWeapon: MeleeWeapon;
  rangedWeapon: RangedWeapon;
}

interface HousePlacement {
  house: ReturnType<typeof generateRoute>["houses"][number];
  sprite: Phaser.Physics.Arcade.Sprite;
}

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private scoreManager!: ScoreManager;
  private dayManager!: DayManager;
  private mapConfig!: MapConfig;
  private route!: Route;
  private hud!: HUD;
  private pauseMenu!: PauseMenu;

  private player!: PlayerSprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  private zombieSprites!: Phaser.Physics.Arcade.Group;
  private newspaperSprites!: Phaser.Physics.Arcade.Group;
  private houseSprites: HousePlacement[] = [];
  private citizenSprites!: Phaser.Physics.Arcade.Group;
  private hazardSprites!: Phaser.Physics.Arcade.StaticGroup;
  private pickupSprites!: Phaser.Physics.Arcade.StaticGroup;

  private scrollSpeed = 0;
  private worldY = 0;
  private deliveries: boolean[] = [];
  private transitioning = false;
  private zombieKillCount = 0;
  private lastTickerKillCount = 0;
  private comboTracker!: ComboTracker;
  private subscriberTotal = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.gameState = getOrCreateGameState(this.registry);
    this.scoreManager = new ScoreManager(this.gameState);
    this.dayManager = new DayManager();
    this.transitioning = false;

    const mapName = this.dayManager.getMapForDay(this.gameState.day);
    const mapConfig = MAPS[mapName];
    this.mapConfig = mapConfig;
    this.route = generateRoute(
      mapConfig,
      this.gameState.difficulty,
      this.gameState.day,
      this.gameState.subscribers,
    );

    this.deliveries = new Array(this.route.houses.length).fill(false);
    this.worldY = 0;
    this.comboTracker = new ComboTracker();
    this.subscriberTotal = this.route.houses.filter(
      (h) => h.isSubscriber,
    ).length;

    const vehicleStats = VEHICLE_STATS[this.gameState.vehicle];

    // Create physics groups
    this.zombieSprites = this.physics.add.group();
    this.newspaperSprites = this.physics.add.group();
    this.citizenSprites = this.physics.add.group();
    this.hazardSprites = this.physics.add.staticGroup();
    this.pickupSprites = this.physics.add.staticGroup();
    this.houseSprites = [];

    // Player
    const playerKey = `player-${this.gameState.vehicle.toLowerCase()}`;
    this.player = this.physics.add.sprite(480, 450, playerKey) as PlayerSprite;
    this.player.setCollideWorldBounds(true);
    this.player.paperCount = GAME.STARTING_PAPERS;

    const meleeConfig = vehicleStats.weapons[WeaponSlot.Melee];
    const rangedConfig = vehicleStats.weapons[WeaponSlot.Ranged];
    this.player.meleeWeapon = createMeleeWeapon(meleeConfig);
    this.player.rangedWeapon = createRangedWeapon(rangedConfig);

    // Road background — dark asphalt with texture
    this.cameras.main.setBackgroundColor("#2a2a2a");
    fadeIn(this);

    // Road surface detail
    const roadGfx = this.add.graphics();
    roadGfx.setDepth(-10);
    // Center road area
    roadGfx.fillStyle(0x3a3a3a, 1);
    roadGfx.fillRect(140, 0, 680, 540);
    // Road lane lines (dashed)
    roadGfx.fillStyle(0x5a5a3a, 0.4);
    for (let ly = 0; ly < 540; ly += 40) {
      roadGfx.fillRect(477, ly, 6, 24);
    }
    // Road edge markings
    roadGfx.fillStyle(0x4a4a35, 0.3);
    roadGfx.fillRect(140, 0, 3, 540);
    roadGfx.fillRect(817, 0, 3, 540);

    // Sidewalks with texture
    const sidewalkGfx = this.add.graphics();
    sidewalkGfx.setDepth(-10);
    sidewalkGfx.fillStyle(0x666660, 1);
    sidewalkGfx.fillRect(20, 0, 120, 540);
    sidewalkGfx.fillRect(820, 0, 120, 540);
    // Sidewalk cracks
    sidewalkGfx.fillStyle(0x555550, 0.6);
    for (let sy = 0; sy < 540; sy += 60) {
      sidewalkGfx.fillRect(20, sy, 120, 2);
    }
    // Grass/dirt edges
    const edgeGfx = this.add.graphics();
    edgeGfx.setDepth(-10);
    edgeGfx.fillStyle(0x2d4a2d, 0.6);
    edgeGfx.fillRect(0, 0, 20, 540);
    edgeGfx.fillRect(940, 0, 20, 540);

    // Atmospheric vignette effect on edges
    const vignetteGfx = this.add.graphics();
    vignetteGfx.setDepth(50);
    vignetteGfx.fillStyle(0x000000, 0.3);
    vignetteGfx.fillRect(0, 0, 30, 540);
    vignetteGfx.fillRect(930, 0, 30, 540);
    vignetteGfx.fillStyle(0x000000, 0.15);
    vignetteGfx.fillRect(0, 0, 960, 15);
    vignetteGfx.fillRect(0, 525, 960, 15);

    // Place houses on both sides of street
    this.spawnHouses();
    this.spawnCitizens();

    // Place hazards
    this.spawnHazards();

    // Place pickups
    this.spawnPickups();

    // Input (guard keyboard availability for touch-only devices)
    const kb = this.input.keyboard;
    if (kb) {
      this.cursors = kb.createCursorKeys();
      this.wasd = {
        W: kb.addKey("W"),
        A: kb.addKey("A"),
        S: kb.addKey("S"),
        D: kb.addKey("D"),
      };
      this.keys = {
        Q: kb.addKey("Q"),
        E: kb.addKey("E"),
        SPACE: kb.addKey("SPACE"),
        F: kb.addKey("F"),
        ESC: kb.addKey("ESC"),
      };
    }

    // HUD + Pause
    this.hud = new HUD(
      this,
      this.gameState,
      this.player.paperCount,
      this.player.rangedWeapon.ammo,
    );
    this.hud.setDeliveryProgress(0, this.subscriberTotal);
    this.pauseMenu = new PauseMenu(this);

    // Collisions
    this.physics.add.overlap(
      this.player,
      this.pickupSprites,
      this
        .onPickup as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.hazardSprites,
      this
        .onHazardHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.zombieSprites,
      this
        .onZombieContact as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.newspaperSprites,
      this.zombieSprites,
      this
        .onNewspaperHitZombie as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.newspaperSprites,
      this.citizenSprites,
      this
        .onNewspaperHitCitizen as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
    this.physics.add.overlap(
      this.player,
      this.citizenSprites,
      this
        .onCitizenContact as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    // Spawn initial zombies
    this.spawnZombieWave();
    this.scheduleZombieWave();
  }

  update(_time: number, delta: number): void {
    if (this.transitioning) return;
    if (this.pauseMenu.getIsVisible()) return;

    if (this.keys?.ESC && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.pauseMenu.toggle();
      return;
    }

    const controlProfile = getVehicleControlProfile(this.gameState.vehicle);
    const speed = controlProfile.maxSpeed;

    // Movement
    let vx = 0;
    let vy = 0;
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) vx = -speed;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) vx = speed;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) vy = -speed;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) vy = speed;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const responsiveness = vx !== 0 || vy !== 0
      ? controlProfile.inputResponsiveness
      : controlProfile.coastResponsiveness;
    this.player.setVelocity(
      Phaser.Math.Linear(body.velocity.x, vx, responsiveness),
      Phaser.Math.Linear(body.velocity.y, vy, responsiveness),
    );

    // Auto scroll
    const deliveredCount = this.deliveries.filter(Boolean).length;
    const targetScrollSpeed =
      getRouteScrollSpeed(
        this.gameState.day,
        deliveredCount,
        this.gameState.difficulty,
      ) * (delta / 1000);
    this.scrollSpeed = Phaser.Math.Linear(this.scrollSpeed, targetScrollSpeed, 0.08);
    this.worldY += this.scrollSpeed;

    // Throw newspaper left/right
    if (
      this.keys?.Q &&
      Phaser.Input.Keyboard.JustDown(this.keys.Q) &&
      this.player.paperCount > 0
    ) {
      this.throwNewspaper("left");
    }
    if (
      this.keys?.E &&
      Phaser.Input.Keyboard.JustDown(this.keys.E) &&
      this.player.paperCount > 0
    ) {
      this.throwNewspaper("right");
    }

    // Melee attack
    if (this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      this.meleeAttack();
    }

    // Ranged attack
    if (this.keys?.F && Phaser.Input.Keyboard.JustDown(this.keys.F)) {
      this.rangedAttack();
    }

    // Update newspaper positions
    this.newspaperSprites.getChildren().forEach((obj) => {
      const np = obj as Phaser.Physics.Arcade.Sprite;
      const data = np.getData("newspaper") as Newspaper;
      if (data.state === NewspaperState.Flying) {
        // Check if out of bounds
        if (np.x < -50 || np.x > 1010) {
          this.checkDelivery(np);
          np.destroy();
        }
      }
    });

    // Move zombies toward player
    this.zombieSprites.getChildren().forEach((obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const zombie = sprite.getData("zombie") as Zombie;
      if (!zombie || zombie.isDead()) {
        return;
      }
      this.physics.moveToObject(sprite, this.player, zombie.speed * 20);
    });

    // Check if route is complete (passed all houses)
    if (
      this.worldY > this.route.houses.length * 50 + 220 &&
      !this.transitioning
    ) {
      this.transitioning = true;
      this.endRoute();
    }

    // Update HUD
    this.hud.setPaperCount(this.player.paperCount);
    this.hud.setAmmoCount(this.player.rangedWeapon.ammo);
    this.hud.update();
  }

  private throwNewspaper(direction: "left" | "right"): void {
    this.player.paperCount--;
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
    sprite.setVelocity(vx, -30);
    this.newspaperSprites.add(sprite);
  }

  private meleeAttack(): void {
    const damage = this.player.meleeWeapon.attack();
    const range = this.player.meleeWeapon.range * 32;

    // Visual swing arc
    meleeSwingArc(this, this.player.x, this.player.y, range, 0xccaa88);

    this.zombieSprites.getChildren().forEach((obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        sprite.x,
        sprite.y,
      );
      if (dist < range) {
        const zombie = sprite.getData("zombie") as Zombie;
        zombie.takeDamage(damage);
        if (zombie.isDead()) {
          this.awardZombieKill(zombie, sprite.x, sprite.y);
          deathFlash(this, sprite);
        }
      }
    });
  }

  private rangedAttack(): void {
    const damage = this.player.rangedWeapon.fire();
    if (damage === 0) return;

    // Simple: damage nearest zombie in front
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDist = Infinity;

    this.zombieSprites.getChildren().forEach((obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        sprite.x,
        sprite.y,
      );
      if (dist < this.player.rangedWeapon.range * 32 && dist < nearestDist) {
        nearest = sprite;
        nearestDist = dist;
      }
    });

    if (nearest) {
      const zombie = (nearest as Phaser.Physics.Arcade.Sprite).getData(
        "zombie",
      ) as Zombie;
      zombie.takeDamage(damage);
      if (zombie.isDead()) {
        this.awardZombieKill(
          zombie,
          (nearest as Phaser.Physics.Arcade.Sprite).x,
          (nearest as Phaser.Physics.Arcade.Sprite).y,
        );
        deathFlash(this, nearest as Phaser.Physics.Arcade.Sprite);
      }
    }
  }

  private awardZombieKill(zombie: Zombie, x: number, y: number): void {
    switch (zombie.type) {
      case ZombieType.Shambler:
        this.scoreManager.shamblerKill();
        break;
      case ZombieType.Runner:
        this.scoreManager.runnerKill();
        break;
      case ZombieType.Spitter:
        this.scoreManager.spitterKill();
        break;
    }

    // Combo tracking
    const result = this.comboTracker.registerKill(this.time.now);
    if (result.isCombo) {
      const size = Math.min(12 + result.comboCount * 2, 24);
      const bonus = result.comboCount * 10;
      this.scoreManager.comboBonus(bonus);
      floatingText(
        this,
        x,
        y - 30,
        `+${bonus} COMBO!`,
        BC.css.GOLD_GLOW,
        `${size}px`,
      );
    }

    // Push a ticker headline every 5th kill (avoid spam)
    this.zombieKillCount++;
    if (this.zombieKillCount - this.lastTickerKillCount >= 5) {
      this.lastTickerKillCount = this.zombieKillCount;
      headlineZombieKill();
    }
  }

  private checkDelivery(npSprite: Phaser.Physics.Arcade.Sprite): void {
    // Check if newspaper landed near a house
    let hit = false;
    for (let i = 0; i < this.houseSprites.length; i++) {
      const { house, sprite: houseSprite } = this.houseSprites[i];
      const xDist = Math.abs(npSprite.x - houseSprite.x);
      const yDist = Math.abs(npSprite.y - houseSprite.y);
      const deliveryResult = classifyDelivery(house, xDist, yDist);

      if (deliveryResult !== "miss" && !this.deliveries[i]) {
        if (house.isSubscriber) {
          this.deliveries[i] = true;
          house.markDelivered();
          // Update delivery progress
          const completed = this.deliveries.filter(
            (d, idx) => d && this.route.houses[idx].isSubscriber,
          ).length;
          this.hud.setDeliveryProgress(completed, this.subscriberTotal);
          if (deliveryResult === "mailbox") {
            this.scoreManager.mailboxDelivery();
            floatingText(
              this,
              houseSprite.x,
              houseSprite.y - 20,
              "MAILBOX!",
              BC.css.GREEN_BRIGHT,
              "18px",
            );
            headlineDelivery();
          } else {
            this.scoreManager.porchDelivery();
            floatingText(
              this,
              houseSprite.x,
              houseSprite.y - 20,
              "DELIVERED",
              BC.css.GREEN,
              "14px",
            );
          }
        } else {
          if (!house.damaged) {
            house.markDamaged();
            const breakable = house.breakables[0];
            if (breakable?.name.includes("tombstone")) {
              this.scoreManager.tombstoneKnock();
            } else {
              this.scoreManager.windowBreak();
            }
          }
          floatingText(
            this,
            houseSprite.x,
            houseSprite.y - 20,
            house.breakables[0]?.name.toUpperCase() ?? "CRASH!",
            BC.css.RED,
            "16px",
          );
          houseSprite.setTint(0xcc6666);
        }
        hit = true;
        break;
      }
    }

    // Delivery miss feedback — newspaper went out of bounds without hitting anything
    if (!hit) {
      floatingText(
        this,
        npSprite.x,
        npSprite.y,
        "MISS",
        BC.css.RED_DIM,
        "12px",
      );
      screenShake(this, 0.004, 100);
    }
  }

  private onNewspaperHitCitizen(
    paperObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    citizenObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const paperSprite = paperObj as Phaser.Physics.Arcade.Sprite;
    const citizenSprite = citizenObj as Phaser.Physics.Arcade.Sprite;
    const citizen = citizenSprite.getData("citizen") as Citizen | undefined;

    if (!citizen || citizenSprite.getData("resolved")) return;
    citizenSprite.setData("resolved", true);
    citizenSprite.setData("hit", true);
    citizenSprite.setData("contacted", true);

    switch (citizen.type) {
      case CitizenType.FriendlyNeighbor:
        this.scoreManager.hitFriendlyNeighbor();
        break;
      case CitizenType.PanickedRunner:
        this.scoreManager.hitPanickedRunner();
        break;
      case CitizenType.ArmedSurvivalist:
        this.scoreManager.hitArmedSurvivalist();
        break;
    }

    floatingText(
      this,
      citizenSprite.x,
      citizenSprite.y - 18,
      `${citizen.hitPenalty}`,
      BC.css.RED,
      "14px",
    );

    if (citizen.dropsPickup) {
      const pickup = createPickup(
        citizenSprite.x,
        citizenSprite.y,
        PickupType.NewspaperBundle,
      );
      const pickupSprite = this.physics.add.staticSprite(
        citizenSprite.x,
        citizenSprite.y,
        "pickup-newspaper",
      );
      pickupSprite.setData("pickup", pickup);
      this.pickupSprites.add(pickupSprite);
    }

    if (citizen.retaliates) {
      screenShake(this, 0.01, 120);
    }

    collectEffect(this, citizenSprite);
    paperSprite.destroy();
  }

  private onCitizenContact(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    citizenObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const citizenSprite = citizenObj as Phaser.Physics.Arcade.Sprite;
    const citizen = citizenSprite.getData("citizen") as Citizen | undefined;
    if (!citizen || citizenSprite.getData("resolved")) return;
    citizenSprite.setData("resolved", true);
    citizenSprite.setData("hit", true);
    citizenSprite.setData("contacted", true);

    switch (citizen.type) {
      case CitizenType.FriendlyNeighbor:
        this.scoreManager.hitFriendlyNeighbor();
        break;
      case CitizenType.PanickedRunner:
        this.scoreManager.hitPanickedRunner();
        break;
      case CitizenType.ArmedSurvivalist:
        this.scoreManager.hitArmedSurvivalist();
        break;
    }

    floatingText(
      this,
      citizenSprite.x,
      citizenSprite.y - 18,
      "HIT!",
      BC.css.RED,
      "14px",
    );
  }

  private onPickup(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    pickupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const sprite = pickupObj as Phaser.Physics.Arcade.Sprite;
    const pickup = sprite.getData("pickup");
    if (pickup && !pickup.collected) {
      pickup.collect();
      if (pickup.type === "NewspaperBundle") {
        this.player.paperCount += pickup.quantity;
        floatingText(
          this,
          sprite.x,
          sprite.y,
          `+${pickup.quantity} PAPERS`,
          BC.TEXT,
          "13px",
        );
      } else if (pickup.type === "AmmoCrate") {
        this.player.rangedWeapon.addAmmo(pickup.quantity);
        floatingText(
          this,
          sprite.x,
          sprite.y,
          `+${pickup.quantity} AMMO`,
          BC.css.AMBER,
          "13px",
        );
      }
      collectEffect(this, sprite);
    }
  }

  private onHazardHit(): void {
    const stability = VEHICLE_STATS[this.gameState.vehicle].stability;
    this.gameState.loseLife();
    screenShake(this, 0.009 + (3 - stability) * 0.003, 200);
    damageFlash(this, 180);
    headlineLifeLost();
    if (this.gameState.isGameOver() && !this.transitioning) {
      this.transitioning = true;
      fadeToScene(this, "GameOverScene");
    } else {
      // Brief invincibility flash
      this.player.setAlpha(0.5);
      this.time.delayedCall(900 + (3 - stability) * 250, () => {
        this.player.setAlpha(1);
      });
    }
  }

  private onZombieContact(
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    zombieObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const stability = VEHICLE_STATS[this.gameState.vehicle].stability;
    const sprite = zombieObj as Phaser.Physics.Arcade.Sprite;
    const zombie = sprite.getData("zombie") as Zombie;
    if (!zombie || zombie.isDead()) return;

    this.gameState.loseLife();
    screenShake(this, 0.011 + (3 - stability) * 0.003, 250);
    damageFlash(this, 200);
    headlineLifeLost();
    deathFlash(this, sprite);

    if (this.gameState.isGameOver() && !this.transitioning) {
      this.transitioning = true;
      fadeToScene(this, "GameOverScene");
    }
  }

  private onNewspaperHitZombie(
    npObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    zombieObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const npSprite = npObj as Phaser.Physics.Arcade.Sprite;
    const zombieSprite = zombieObj as Phaser.Physics.Arcade.Sprite;
    const zombie = zombieSprite.getData("zombie") as Zombie;
    const np = npSprite.getData("newspaper") as Newspaper;

    if (!zombie || zombie.isDead()) return;

    zombie.takeDamage(np.stunDamage);
    npSprite.destroy();

    if (zombie.isDead()) {
      this.awardZombieKill(zombie, zombieSprite.x, zombieSprite.y);
      deathFlash(this, zombieSprite);
    }
  }

  private spawnHouses(): void {
    const leftX = 48 + this.mapConfig.streetWidth * 2;
    const rightX = 912 - this.mapConfig.streetWidth * 2;
    const houseSpacing = 20 + (5 - this.mapConfig.houseSeparation) * 1.5;

    this.route.houses.forEach((house, i) => {
      const side = i % 2 === 0 ? leftX : rightX;
      const y = 68 + i * houseSpacing;
      const sprite = this.physics.add.staticSprite(
        side,
        y,
        getHouseTextureKey(house),
      );
      sprite.setData("house", house);
      this.houseSprites.push({ house, sprite });
    });
  }

  private spawnCitizens(): void {
    this.route.houses.forEach((house, i) => {
      if (i % 2 !== 0 && i % 3 !== 0) return;

      let citizen: Citizen;
      if (house.isSubscriber && house.type === "Ranch") {
        citizen = createFriendlyNeighbor(0, 0);
      } else if (house.type === "Victorian") {
        citizen = createArmedSurvivalist(0, 0);
      } else {
        citizen = createPanickedRunner(0, 0);
      }

      const placement = this.houseSprites[i];
      const houseSprite = placement.sprite;
      const x = houseSprite.x < 480 ? houseSprite.x + 52 : houseSprite.x - 52;
      const y = houseSprite.y + 6;
      const key =
        citizen.type === CitizenType.FriendlyNeighbor
          ? "citizen-friendly"
          : citizen.type === CitizenType.PanickedRunner
            ? "citizen-panicked"
            : "citizen-armed";

      const sprite = this.physics.add.sprite(x, y, key);
      sprite.setData("citizen", citizen);
      sprite.setImmovable(true);
      sprite.setDepth(4);
      sprite.setBounce(0);
      this.citizenSprites.add(sprite);

      if (citizen.type === CitizenType.PanickedRunner) {
        this.tweens.add({
          targets: sprite,
          x: x + (houseSprite.x < 480 ? 18 : -18),
          duration: 900 + i * 40,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
      }
    });
  }

  private spawnHazards(): void {
    this.route.hazards.forEach((hazard, i) => {
      const x = 300 + ((i * 67) % 360);
      const y = 100 + i * 60;
      const sprite = this.physics.add.staticSprite(
        x,
        y,
        `hazard-${hazard.type.toLowerCase()}`,
      );
      sprite.setData("hazard", hazard);
      this.hazardSprites.add(sprite);
    });
  }

  private spawnPickups(): void {
    this.route.pickups.forEach((pickup, i) => {
      const x = 250 + ((i * 130) % 460);
      const y = 150 + i * 80;
      const key =
        pickup.type === "NewspaperBundle"
          ? "pickup-newspaper"
          : pickup.type === "AmmoCrate"
            ? "pickup-ammo"
            : "pickup-health";

      const sprite = this.physics.add.staticSprite(x, y, key);
      sprite.setData("pickup", pickup);
      this.pickupSprites.add(sprite);
    });
  }

  private spawnZombieWave(): void {
    const { count } = getZombieWaveSettings(
      this.gameState.day,
      this.gameState.difficulty,
    );
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(150, 810);
      const y = Phaser.Math.Between(-50, -10);
      const types = [
        ZombieType.Shambler,
        ZombieType.Runner,
        ZombieType.Spitter,
      ];
      const maxTypeIndex = Math.min(
        types.length - 1,
        Math.floor(this.gameState.day / 2),
      );
      const type = types[Phaser.Math.Between(0, maxTypeIndex)];

      let zombie;
      switch (type) {
        case ZombieType.Shambler:
          zombie = createShambler(x, y);
          break;
        case ZombieType.Runner:
          zombie = createRunner(x, y);
          break;
        case ZombieType.Spitter:
          zombie = createSpitter(x, y);
          break;
      }

      const key = `zombie-${type.toLowerCase()}`;
      const sprite = this.physics.add.sprite(x, y, key);
      sprite.setData("zombie", zombie);
      this.zombieSprites.add(sprite);
    }
  }

  private scheduleZombieWave(): void {
    if (this.transitioning) return;
    const { interval } = getZombieWaveSettings(
      this.gameState.day,
      this.gameState.difficulty,
    );
    this.time.delayedCall(interval, () => {
      if (this.transitioning) return;
      this.spawnZombieWave();
      this.scheduleZombieWave();
    });
  }

  private endRoute(): void {
    // Calculate subscription changes
    const deliveryData = this.route.houses.map((house, i) => ({
      house,
      delivered: this.deliveries[i],
    }));

    fadeToScene(this, "TrainingScene", { deliveryData });
  }
}
