import Phaser from "phaser";
import { GAME } from "../config/constants";
import { VEHICLE_STATS, WeaponSlot } from "../config/vehicles";
import {
  Citizen,
  CitizenType,
  createArmedSurvivalist,
  createFriendlyNeighbor,
  createPanickedRunner,
} from "../entities/Citizen";
import {
  createNewspaper,
  Newspaper,
  NewspaperState,
} from "../entities/Newspaper";
import { NpcFaction, NpcRole, NpcState } from "../entities/Npc";
import { createPickup, PickupType } from "../entities/Pickup";
import {
  DriverSnapshot,
  GunnerAction,
  GunnerActionType,
  ServerMessage,
  VersusMatchReason,
} from "../network/protocol";
import {
  CoopRuntimeState,
  getCoopRuntimeState,
  getCoopSession,
  mergeCoopRuntimeState,
  setCoopSession,
  setCoopRuntimeState,
} from "../network/runtime";
import { MultiplayerSession } from "../network/MultiplayerSession";
import { cycleTargetId, resolveTargetId } from "../network/coop-targeting";
import {
  createVersusMatchResult,
  scoreRivalKill,
} from "../network/versus-rules";
import {
  CombatAlertTone,
  CombatEncounter,
  getEliteProfile,
  getRouteEncounter,
  getRouteEventThreshold,
  getSurgeEncounter,
  resolveCombatPickupDrop,
} from "./combat-authorship";
import {
  createRunner,
  createShambler,
  createSpitter,
  Zombie,
  ZombieType,
} from "../entities/Zombie";
import { MapConfig, MAPS } from "../maps/MapConfig";
import { generateRoute, Route } from "../maps/MapGenerator";
import { ComboTracker } from "../systems/ComboTracker";
import { DayManager } from "../systems/DayManager";
import { GameState, getOrCreateGameState } from "../systems/GameState";
import { resolveNpcSpriteTextureKey } from "../systems/NpcAssets";
import { ScoreManager } from "../systems/ScoreManager";
import { BC, BROADCAST_FONT } from "../ui/broadcast-styles";
import { resolveBroadcastViewportContext } from "../ui/broadcast-viewport";
import { HUD } from "../ui/HUD";
import { PauseMenu } from "../ui/PauseMenu";
import {
  headlineDelivery,
  headlineLifeLost,
  headlineZombieKill,
} from "../ui/ticker-bridge";
import { TouchControls } from "../ui/TouchControls";
import {
  collectEffect,
  damageFlash,
  deathFlash,
  fadeIn,
  fadeToScene,
  floatingText,
  isTouchPrimary,
  meleeSwingArc,
  screenShake,
} from "../utils/animations";
import {
  createMeleeWeapon,
  createRangedWeapon,
  MeleeWeapon,
  RangedWeapon,
} from "../weapons/Weapon";
import {
  classifyDelivery,
  getHouseTextureKey,
  getRouteScrollSpeed,
  getVehicleControlProfile,
  getZombieWaveSettings,
} from "./arcade-rules";

interface PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  paperCount: number;
  meleeWeapon: MeleeWeapon;
  rangedWeapon: RangedWeapon;
}

interface HousePlacement {
  house: ReturnType<typeof generateRoute>["houses"][number];
  sprite: Phaser.Physics.Arcade.Sprite;
}

interface ZombieRenderState {
  elite: boolean;
  eliteLabel?: string;
  id: number;
}

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private scoreManager!: ScoreManager;
  private dayManager!: DayManager;
  private mapConfig!: MapConfig;
  private route!: Route;
  private hud!: HUD;
  private pauseMenu!: PauseMenu;
  private touchControls?: TouchControls;

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
  private viewportContext = resolveBroadcastViewportContext(960, 540, false);
  private nextZombieId = 1;
  private nextPickupId = 1;
  private nextSurgeKillThreshold = 0;
  private coopRuntime: CoopRuntimeState | null = null;
  private coopSession: MultiplayerSession | null = null;
  private unsubscribeCoopMessage?: () => void;
  private unsubscribeCoopClose?: () => void;
  private lastSnapshotSentAt = 0;
  private selectedTargetId: number | null = null;
  private gunnerTargetText?: Phaser.GameObjects.Text;
  private gunnerReticle?: Phaser.GameObjects.Graphics;
  private nextRouteEncounterIndex = 0;
  private lastPickupDropKillCount = -999;
  private lastEliteAnnouncementAt = -9999;
  private versusDriverScore = 0;
  private versusRivalScore = 0;
  private versusScoreText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  create(): void {
    this.gameState = getOrCreateGameState(this.registry);
    this.scoreManager = new ScoreManager(this.gameState);
    this.dayManager = new DayManager();
    this.transitioning = false;
    this.coopRuntime = getCoopRuntimeState(this.registry);
    this.coopSession = getCoopSession(this.registry);
    this.lastSnapshotSentAt = 0;
    this.selectedTargetId = null;
    this.nextRouteEncounterIndex = 0;
    this.lastPickupDropKillCount = -999;
    this.lastEliteAnnouncementAt = -9999;
    this.versusDriverScore = 0;
    this.versusRivalScore = 0;
    this.versusScoreText = undefined;
    const { width, height } = this.cameras.main;
    const touchPrimary = isTouchPrimary();
    this.viewportContext = resolveBroadcastViewportContext(
      window.innerWidth,
      window.innerHeight,
      touchPrimary,
    );

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
    this.nextZombieId = 1;
    this.nextPickupId = 1;
    this.nextSurgeKillThreshold = this.getCurrentWaveSettings().surgeThreshold;

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

    // Place NPCs from the route planner
    this.spawnRouteNpcs();

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

    if (this.viewportContext.touchPrimary) {
      this.touchControls = new TouchControls(
        this,
        width,
        height,
        this.viewportContext.uiScale,
      );
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
    if (this.isGunnerRole()) {
      this.gunnerReticle = this.add.graphics().setDepth(12);
      this.gunnerTargetText = this.add
        .text(28, 86, this.isVersusMode() ? "RIVAL TARGET: SCANNING" : "TARGET: SCANNING", {
          fontFamily: BROADCAST_FONT,
          fontSize: "11px",
          fontStyle: "700",
          color: BC.TEXT,
          letterSpacing: 1.5,
        })
        .setDepth(60)
        .setScrollFactor(0);
    }
    if (this.isVersusMode()) {
      this.versusScoreText = this.add
        .text(width - 28, 86, "", {
          fontFamily: BROADCAST_FONT,
          fontSize: "11px",
          fontStyle: "700",
          color: BC.css.GOLD_GLOW,
          align: "right",
          letterSpacing: 1.2,
        })
        .setOrigin(1, 0)
        .setDepth(60)
        .setScrollFactor(0);
    }
    this.bindCoopSession();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touchControls?.destroy();
      this.touchControls = undefined;
      this.unsubscribeCoopMessage?.();
      this.unsubscribeCoopClose?.();
    });

    if (!this.isGunnerRole()) {
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

      this.scheduleZombieWave();
    }
  }

  update(_time: number, delta: number): void {
    if (this.transitioning) return;
    if (this.pauseMenu.getIsVisible()) return;

    if (this.touchControls?.consumeAction("pause")) {
      this.pauseMenu.toggle();
      return;
    }

    if (this.keys?.ESC && Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.pauseMenu.toggle();
      return;
    }

    if (this.isGunnerRole()) {
      this.updateGunnerControls();
      this.updateGunnerTargetIndicator();
      this.hud.setPaperCount(this.player.paperCount);
      this.hud.setAmmoCount(this.player.rangedWeapon.ammo);
      this.hud.update();
      this.updateVersusScoreboard();
      return;
    }

    const controlProfile = getVehicleControlProfile(this.gameState.vehicle);
    const speed = controlProfile.maxSpeed;

    // Movement
    let vx = 0;
    let vy = 0;
    if (
      this.cursors?.left.isDown ||
      this.wasd?.A.isDown ||
      this.touchControls?.isHeld("left")
    )
      vx = -speed;
    if (
      this.cursors?.right.isDown ||
      this.wasd?.D.isDown ||
      this.touchControls?.isHeld("right")
    )
      vx = speed;
    if (
      this.cursors?.up.isDown ||
      this.wasd?.W.isDown ||
      this.touchControls?.isHeld("up")
    )
      vy = -speed;
    if (
      this.cursors?.down.isDown ||
      this.wasd?.S.isDown ||
      this.touchControls?.isHeld("down")
    )
      vy = speed;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const responsiveness =
      vx !== 0 || vy !== 0
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
      ) *
      (delta / 1000);
    this.scrollSpeed = Phaser.Math.Linear(
      this.scrollSpeed,
      targetScrollSpeed,
      0.08,
    );
    this.worldY += this.scrollSpeed;

    // Throw newspaper left/right
    if (
      (this.keys?.Q &&
        Phaser.Input.Keyboard.JustDown(this.keys.Q) &&
        this.player.paperCount > 0) ||
      ((this.touchControls?.consumeAction("throwLeft") ?? false) &&
        this.player.paperCount > 0)
    ) {
      this.throwNewspaper("left");
    }
    if (
      (this.keys?.E &&
        Phaser.Input.Keyboard.JustDown(this.keys.E) &&
        this.player.paperCount > 0) ||
      ((this.touchControls?.consumeAction("throwRight") ?? false) &&
        this.player.paperCount > 0)
    ) {
      this.throwNewspaper("right");
    }

    // Melee attack
    if (
      this.driverOwnsCombat() &&
      ((this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) ||
        this.touchControls?.consumeAction("melee"))
    ) {
      this.meleeAttack();
    }

    // Ranged attack
    if (
      this.driverOwnsCombat() &&
      ((this.keys?.F && Phaser.Input.Keyboard.JustDown(this.keys.F)) ||
        this.touchControls?.consumeAction("ranged"))
    ) {
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
    this.updateVersusScoreboard();

    if (
      this.isDriverRole() &&
      this.coopRuntime?.peerConnected &&
      this.time.now - this.lastSnapshotSentAt >= 80
    ) {
      this.pushDriverSnapshot();
      this.lastSnapshotSentAt = this.time.now;
    }
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

  private meleeAttack(source: "driver" | "rival" = "driver"): void {
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
          this.awardZombieKill(zombie, sprite, source);
          deathFlash(this, sprite);
        }
      }
    });
  }

  private rangedAttack(
    targetId?: number | null,
    source: "driver" | "rival" = "driver",
  ): void {
    const damage = this.player.rangedWeapon.fire();
    if (damage === 0) return;

    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let nearestDist = Infinity;

    if (targetId !== undefined && targetId !== null) {
      const targetedSprite = this.findZombieSpriteById(targetId);
      if (targetedSprite) {
        const targetDist = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          targetedSprite.x,
          targetedSprite.y,
        );
        if (targetDist < this.player.rangedWeapon.range * 32) {
          nearest = targetedSprite;
          nearestDist = targetDist;
        }
      }
    }

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
          nearest as Phaser.Physics.Arcade.Sprite,
          source,
        );
        deathFlash(this, nearest as Phaser.Physics.Arcade.Sprite);
      }
    }
  }

  private awardZombieKill(
    zombie: Zombie,
    sprite: Phaser.Physics.Arcade.Sprite,
    source: "driver" | "rival" = "driver",
  ): void {
    const x = sprite.x;
    const y = sprite.y;
    const renderState = sprite.getData("zombieRenderState") as
      | ZombieRenderState
      | undefined;
    const isElite = renderState?.elite ?? false;
    const eliteLabel = renderState?.eliteLabel ?? "Elite";

    if (!(this.isVersusMode() && source === "rival")) {
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
    } else {
      this.versusRivalScore += scoreRivalKill(
        zombie.basePoints,
        this.gameState.difficulty,
        {
          elite: isElite,
        },
      );
    }

    if (isElite) {
      const bonus = Math.max(25, Math.round(zombie.basePoints * 1.5));
      if (!(this.isVersusMode() && source === "rival")) {
        this.scoreManager.bonus(bonus);
      }
      floatingText(
        this,
        x,
        y - 44,
        `${eliteLabel.toUpperCase()} +${bonus}`,
        BC.css.RED_GLOW,
        "16px",
      );
    }

    // Combo tracking
    const result = this.comboTracker.registerKill(this.time.now);
    if (result.isCombo) {
      const size = Math.min(12 + result.comboCount * 2, 24);
      const bonus = result.comboCount * 10;
      if (this.isVersusMode() && source === "rival") {
        this.versusRivalScore += bonus;
      } else {
        this.scoreManager.comboBonus(bonus);
      }
      floatingText(
        this,
        x,
        y - 30,
        `+${bonus} COMBO!`,
        BC.css.GOLD_GLOW,
        `${size}px`,
      );
    }

    if (this.isVersusMode()) {
      this.versusDriverScore = this.gameState.score;
    }

    // Push a ticker headline every 5th kill (avoid spam)
    this.zombieKillCount++;
    if (this.zombieKillCount - this.lastTickerKillCount >= 5) {
      this.lastTickerKillCount = this.zombieKillCount;
      headlineZombieKill();
    }

    this.spawnGoreBurst(x, y, isElite ? 1.6 : 1);
    this.trySpawnKillDrop(x, y, isElite);

    if (this.zombieKillCount >= this.nextSurgeKillThreshold) {
      this.triggerBloodRush();
      this.nextSurgeKillThreshold =
        this.zombieKillCount + this.getCurrentWaveSettings().surgeThreshold;
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
          this.maybeTriggerRouteEncounter(completed);
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
      this.spawnPickupSprite(
        PickupType.NewspaperBundle,
        citizenSprite.x,
        citizenSprite.y,
      );
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
      } else if (pickup.type === "HealthKit") {
        if (this.gameState.lives < GAME.STARTING_LIVES) {
          this.gameState.gainLife();
          floatingText(
            this,
            sprite.x,
            sprite.y,
            "+1 LIFE",
            BC.css.GREEN_BRIGHT,
            "13px",
          );
        } else {
          this.player.rangedWeapon.addAmmo(2);
          floatingText(
            this,
            sprite.x,
            sprite.y,
            "MED SCRAP +2 AMMO",
            BC.css.GOLD,
            "13px",
          );
        }
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
      if (this.isVersusMode()) {
        this.finishVersusMatch("driver-down");
      } else {
        fadeToScene(this, "GameOverScene");
      }
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
      if (this.isVersusMode()) {
        this.finishVersusMatch("driver-down");
      } else {
        fadeToScene(this, "GameOverScene");
      }
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
      this.awardZombieKill(zombie, zombieSprite);
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
      this.spawnPickupSprite(pickup.type, x, y);
    });
  }

  private spawnRouteNpcs(): void {
    this.route.npcSpawns.forEach((plan, i) => {
      const placement = this.houseSprites[i % this.houseSprites.length];
      const houseSprite = placement.sprite;
      const { x, y } = this.getNpcSpawnPosition(
        plan.spawnZone,
        houseSprite.x,
        houseSprite.y,
        i,
      );
      const key = resolveNpcSpriteTextureKey(
        {
          faction: plan.definition.faction,
          role: plan.definition.role,
          state: plan.state,
          textureKey: plan.definition.textureKey,
        },
        this.textures,
      );

      if (plan.definition.faction === NpcFaction.Infected) {
        const sprite = this.spawnZombieSprite(
          plan.definition.role === NpcRole.Runner
            ? ZombieType.Runner
            : plan.definition.role === NpcRole.Spitter
              ? ZombieType.Spitter
              : ZombieType.Shambler,
          x,
          y,
          Phaser.Math.FloatBetween(0, 1) <
            this.getCurrentWaveSettings().eliteChance * 0.5,
          key,
        );
        sprite.setData("npcPlan", plan);
        return;
      }

      const citizen = this.createCitizenFromPlan(
        plan.definition.faction,
        plan.state,
        x,
        y,
      );
      const sprite = this.physics.add.sprite(x, y, key);
      sprite.setData("npcPlan", plan);
      sprite.setData("citizen", citizen);
      sprite.setImmovable(true);
      sprite.setDepth(4);
      sprite.setBounce(0);
      this.citizenSprites.add(sprite);

      if (!citizen.isStationary) {
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

  private getNpcSpawnPosition(
    spawnZone: string,
    houseX: number,
    houseY: number,
    index: number,
  ): { x: number; y: number } {
    const isLeftSide = houseX < 480;
    const offset = this.getNpcSpawnOffset(spawnZone);
    const x =
      spawnZone === "CenterStreet"
        ? 480 + (index % 2 === 0 ? -18 : 18)
        : isLeftSide
          ? houseX + offset
          : houseX - offset;
    const y =
      houseY +
      (spawnZone === "Yard" ? 14 : spawnZone === "CenterStreet" ? 2 : 6);

    return { x, y };
  }

  private getNpcSpawnOffset(spawnZone: string): number {
    switch (spawnZone) {
      case "BackPorch":
        return 62;
      case "Yard":
        return 48;
      case "LeftSidewalk":
        return 34;
      case "SidewalkRight":
        return 34;
      case "CenterStreet":
        return 0;
      case "FrontPorch":
      default:
        return 52;
    }
  }

  private createCitizenFromPlan(
    faction: NpcFaction,
    state: NpcState,
    x: number,
    y: number,
  ): Citizen {
    if (faction === NpcFaction.Trader) {
      return createFriendlyNeighbor(x, y);
    }

    if (
      faction === NpcFaction.Responder ||
      faction === NpcFaction.HostileHuman
    ) {
      return createArmedSurvivalist(x, y);
    }

    if (state === NpcState.Flee || state === NpcState.Travel) {
      return createPanickedRunner(x, y);
    }

    if (state === NpcState.Defend) {
      return createArmedSurvivalist(x, y);
    }

    return createFriendlyNeighbor(x, y);
  }

  private spawnZombieWave(): void {
    const { count, eliteChance } = this.getCurrentWaveSettings();
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
      this.spawnZombieSprite(
        type,
        x,
        y,
        Phaser.Math.FloatBetween(0, 1) < eliteChance,
      );
    }
  }

  private scheduleZombieWave(): void {
    if (this.transitioning) return;
    const { interval } = this.getCurrentWaveSettings();
    this.time.delayedCall(interval, () => {
      if (this.transitioning) return;
      this.spawnZombieWave();
      this.scheduleZombieWave();
    });
  }

  private getCurrentWaveSettings() {
    const deliveredCount = this.deliveries.filter(Boolean).length;
    return getZombieWaveSettings(
      this.gameState.day,
      this.gameState.difficulty,
      deliveredCount,
      this.zombieKillCount,
    );
  }

  private spawnZombieSprite(
    type: ZombieType,
    x: number,
    y: number,
    elite = false,
    textureKey = `zombie-${type.toLowerCase()}`,
    forcedId?: number,
  ): Phaser.Physics.Arcade.Sprite {
    let zombie: Zombie;
    switch (type) {
      case ZombieType.Runner:
        zombie = createRunner(x, y);
        break;
      case ZombieType.Spitter:
        zombie = createSpitter(x, y);
        break;
      case ZombieType.Shambler:
      default:
        zombie = createShambler(x, y);
        break;
    }

    const sprite = this.physics.add.sprite(x, y, textureKey);
    const renderState: ZombieRenderState = {
      elite,
      id: forcedId ?? this.nextZombieId++,
    };
    this.nextZombieId = Math.max(this.nextZombieId, renderState.id + 1);

    if (elite) {
      const eliteProfile = getEliteProfile(type, this.gameState.day);
      zombie.hp = Math.ceil(zombie.hp * eliteProfile.healthMultiplier);
      zombie.speed *= eliteProfile.speedMultiplier;
      zombie.damage += eliteProfile.damageBonus;
      zombie.basePoints = Math.round(zombie.basePoints * eliteProfile.pointsMultiplier);
      sprite.setScale(eliteProfile.scale);
      sprite.setTint(eliteProfile.tint);
      renderState.eliteLabel = eliteProfile.label;
    }

    sprite.setData("zombie", zombie);
    sprite.setData("zombieRenderState", renderState);
    this.zombieSprites.add(sprite);
    if (elite && renderState.eliteLabel) {
      const eliteProfile = getEliteProfile(type, this.gameState.day);
      floatingText(
        this,
        x,
        y - 22,
        renderState.eliteLabel.toUpperCase(),
        this.getAlertColor(eliteProfile.tone),
        "12px",
      );
      if (this.hud) {
        this.maybeAnnounceElite(type);
      }
    }
    return sprite;
  }

  private spawnPickupSprite(
    pickup: PickupType,
    x: number,
    y: number,
    forcedId?: number,
  ): Phaser.Physics.Arcade.Sprite {
    const pickupModel = createPickup(x, y, pickup);
    const key =
      pickup === PickupType.NewspaperBundle
        ? "pickup-newspaper"
        : pickup === PickupType.AmmoCrate
          ? "pickup-ammo"
          : "pickup-health";
    const sprite = this.physics.add.staticSprite(x, y, key);
    sprite.setData("pickup", pickupModel);
    const pickupId = forcedId ?? this.nextPickupId++;
    this.nextPickupId = Math.max(this.nextPickupId, pickupId + 1);
    sprite.setData("pickupId", pickupId);
    this.pickupSprites.add(sprite);
    return sprite;
  }

  private trySpawnKillDrop(x: number, y: number, elite: boolean): void {
    const { pickupDropChance } = this.getCurrentWaveSettings();
    const pickupType = resolveCombatPickupDrop({
      activePickupCount: this.pickupSprites.countActive(true),
      ammo: this.player.rangedWeapon.ammo,
      baseDropChance: pickupDropChance,
      chanceRoll: Phaser.Math.FloatBetween(0, 1),
      difficulty: this.gameState.difficulty,
      elite,
      killCount: this.zombieKillCount,
      lastDropKillCount: this.lastPickupDropKillCount,
      lives: this.gameState.lives,
      papers: this.player.paperCount,
      typeRoll: Phaser.Math.FloatBetween(0, 1),
    });
    if (!pickupType) return;

    this.lastPickupDropKillCount = this.zombieKillCount;
    this.spawnPickupSprite(pickupType, x, y);
  }

  private triggerBloodRush(): void {
    const encounter = getSurgeEncounter(
      this.gameState.day,
      this.gameState.difficulty,
      this.getCurrentWaveSettings().count,
      this.zombieKillCount,
    );
    this.launchEncounter(encounter);
  }

  private spawnGoreBurst(x: number, y: number, intensity: number): void {
    const chunkCount = Math.round(5 * intensity);
    for (let i = 0; i < chunkCount; i++) {
      const chunk = this.add.circle(x, y, Phaser.Math.Between(2, 4), BC.RED, 0.85);
      chunk.setDepth(8);
      this.tweens.add({
        targets: chunk,
        x: x + Phaser.Math.Between(-26, 26) * intensity,
        y: y + Phaser.Math.Between(-18, 18) * intensity,
        alpha: 0,
        scale: 0.2,
        duration: 280 + Phaser.Math.Between(40, 140),
        ease: "Cubic.easeOut",
        onComplete: () => {
          chunk.destroy();
        },
      });
    }
  }

  private isGunnerRole(): boolean {
    return this.coopRuntime?.enabled === true && this.coopRuntime.role === "gunner";
  }

  private isDriverRole(): boolean {
    return this.coopRuntime?.enabled === true && this.coopRuntime.role === "driver";
  }

  private isVersusMode(): boolean {
    return this.coopRuntime?.enabled === true && this.coopRuntime.mode === "versus";
  }

  private driverOwnsCombat(): boolean {
    if (this.isVersusMode()) return true;
    return !this.isDriverRole() || this.coopRuntime?.peerConnected !== true;
  }

  private bindCoopSession(): void {
    if (!this.coopSession) return;
    this.unsubscribeCoopMessage?.();
    this.unsubscribeCoopClose?.();
    this.unsubscribeCoopMessage = this.coopSession.onMessage((message) => {
      this.handleCoopMessage(message);
    });
    this.unsubscribeCoopClose = this.coopSession.onClose(() => {
      this.coopSession = null;
      setCoopSession(this.registry, null);
      this.handleCoopDisconnect("Relay disconnected.");
    });
  }

  private handleCoopMessage(message: ServerMessage): void {
    switch (message.type) {
      case "gunner-action":
        if (!this.isDriverRole()) return;
        this.handleGunnerAction(message.action);
        return;
      case "snapshot":
        if (!this.isGunnerRole()) return;
        this.applyDriverSnapshot(message.snapshot);
        return;
      case "peer-status":
        if (!this.coopRuntime) return;
        this.coopRuntime = {
          ...this.coopRuntime,
          peerConnected: message.connected,
        };
        setCoopRuntimeState(this.registry, this.coopRuntime);
        if (!message.connected) {
          this.handleCoopDisconnect(
            this.isDriverRole()
              ? "Gunner link lost. Driver combat restored."
              : "Driver link lost. Returning to relay room.",
          );
        }
        return;
      case "session-ended":
        this.coopSession = null;
        setCoopSession(this.registry, null);
        this.handleCoopDisconnect(message.reason);
        return;
      case "match-result":
        if (!this.isGunnerRole() || !this.isVersusMode()) return;
        if (!this.transitioning) {
          this.transitioning = true;
          mergeCoopRuntimeState(this.registry, {
            phase: "linked",
            statusMessage: "Versus round complete. Awaiting relay return.",
          });
          fadeToScene(this, "GameOverScene", { versusResult: message.result });
        }
        return;
      default:
        return;
    }
  }

  private handleGunnerAction(action: GunnerAction): void {
    const source: "driver" | "rival" = this.isVersusMode() ? "rival" : "driver";
    switch (action.type) {
      case "melee":
        this.meleeAttack(source);
        break;
      case "ranged":
        this.rangedAttack(action.targetId, source);
        break;
      case "throw-left":
        if (!this.isVersusMode() && this.player.paperCount > 0) {
          this.throwNewspaper("left");
        }
        break;
      case "throw-right":
        if (!this.isVersusMode() && this.player.paperCount > 0) {
          this.throwNewspaper("right");
        }
        break;
    }
  }

  private updateGunnerControls(): void {
    const previousTarget =
      (this.cursors?.left && Phaser.Input.Keyboard.JustDown(this.cursors.left)) ||
      (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) ||
      (this.wasd?.A && Phaser.Input.Keyboard.JustDown(this.wasd.A)) ||
      (this.wasd?.W && Phaser.Input.Keyboard.JustDown(this.wasd.W));
    const nextTarget =
      (this.cursors?.right && Phaser.Input.Keyboard.JustDown(this.cursors.right)) ||
      (this.cursors?.down && Phaser.Input.Keyboard.JustDown(this.cursors.down)) ||
      (this.wasd?.D && Phaser.Input.Keyboard.JustDown(this.wasd.D)) ||
      (this.wasd?.S && Phaser.Input.Keyboard.JustDown(this.wasd.S));

    if (previousTarget) {
      this.cycleGunnerTarget("previous");
    } else if (nextTarget) {
      this.cycleGunnerTarget("next");
    }

    if (
      (this.keys?.SPACE && Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) ||
      this.touchControls?.consumeAction("melee")
    ) {
      this.sendGunnerAction("melee");
    }

    if (
      (this.keys?.F && Phaser.Input.Keyboard.JustDown(this.keys.F)) ||
      this.touchControls?.consumeAction("ranged")
    ) {
      this.sendGunnerAction("ranged");
    }

    if (
      !this.isVersusMode() &&
      ((this.keys?.Q && Phaser.Input.Keyboard.JustDown(this.keys.Q)) ||
        this.touchControls?.consumeAction("throwLeft"))
    ) {
      this.sendGunnerAction("throw-left");
    }

    if (
      !this.isVersusMode() &&
      ((this.keys?.E && Phaser.Input.Keyboard.JustDown(this.keys.E)) ||
        this.touchControls?.consumeAction("throwRight"))
    ) {
      this.sendGunnerAction("throw-right");
    }
  }

  private pushDriverSnapshot(): void {
    const snapshot: DriverSnapshot = {
      mode: this.isVersusMode() ? "versus" : "coop",
      player: {
        x: this.player.x,
        y: this.player.y,
        alpha: this.player.alpha,
      },
      worldY: this.worldY,
      score: this.gameState.score,
      lives: this.gameState.lives,
      subscribers: this.gameState.subscribers,
      paperCount: this.player.paperCount,
      ammoCount: this.player.rangedWeapon.ammo,
      deliveries: [...this.deliveries],
      zombies: this.zombieSprites.getChildren().map((obj) => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        const zombie = sprite.getData("zombie") as Zombie;
        const renderState = sprite.getData("zombieRenderState") as ZombieRenderState;
        return {
          id: renderState.id,
          type: zombie.type,
          x: sprite.x,
          y: sprite.y,
          hp: zombie.hp,
          elite: renderState.elite,
        };
      }),
      pickups: this.pickupSprites.getChildren().map((obj) => {
        const sprite = obj as Phaser.Physics.Arcade.Sprite;
        const pickup = sprite.getData("pickup") as ReturnType<typeof createPickup>;
        return {
          id: sprite.getData("pickupId") as number,
          type: pickup.type,
          x: sprite.x,
          y: sprite.y,
          collected: pickup.collected,
        };
      }),
      versusScoreboard: this.isVersusMode()
        ? {
            driverScore: this.gameState.score,
            rivalScore: this.versusRivalScore,
          }
        : undefined,
    };

    this.coopSession?.send({ type: "driver-snapshot", snapshot });
  }

  private applyDriverSnapshot(snapshot: DriverSnapshot): void {
    if (this.coopRuntime && this.coopRuntime.mode !== snapshot.mode) {
      this.coopRuntime = {
        ...this.coopRuntime,
        mode: snapshot.mode,
      };
      setCoopRuntimeState(this.registry, this.coopRuntime);
    }
    this.player.setPosition(snapshot.player.x, snapshot.player.y);
    this.player.setAlpha(snapshot.player.alpha);
    this.worldY = snapshot.worldY;
    this.gameState.score = snapshot.score;
    this.versusDriverScore = snapshot.versusScoreboard?.driverScore ?? snapshot.score;
    this.versusRivalScore = snapshot.versusScoreboard?.rivalScore ?? 0;
    this.gameState.lives = snapshot.lives;
    this.gameState.subscribers = snapshot.subscribers;
    this.player.paperCount = snapshot.paperCount;
    this.player.rangedWeapon.ammo = snapshot.ammoCount;
    this.deliveries = [...snapshot.deliveries];

    const completed = this.deliveries.filter(
      (delivered, index) => delivered && this.route.houses[index]?.isSubscriber,
    ).length;
    this.hud.setDeliveryProgress(completed, this.subscriberTotal);

    snapshot.deliveries.forEach((delivered, index) => {
      if (delivered) {
        this.route.houses[index]?.markDelivered();
      }
    });

    const zombieById = new Map<number, Phaser.Physics.Arcade.Sprite>();
    this.zombieSprites.getChildren().forEach((obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const renderState = sprite.getData("zombieRenderState") as
        | ZombieRenderState
        | undefined;
      if (renderState) {
        zombieById.set(renderState.id, sprite);
      }
    });

    const snapshotZombieIds = new Set<number>();
    snapshot.zombies.forEach((remoteZombie) => {
      snapshotZombieIds.add(remoteZombie.id);
      let sprite = zombieById.get(remoteZombie.id);
      if (!sprite) {
        sprite = this.spawnZombieSprite(
          remoteZombie.type,
          remoteZombie.x,
          remoteZombie.y,
          remoteZombie.elite,
          undefined,
          remoteZombie.id,
        );
      }
      const zombie = sprite.getData("zombie") as Zombie;
      zombie.hp = remoteZombie.hp;
      sprite.setPosition(remoteZombie.x, remoteZombie.y);
    });

    zombieById.forEach((sprite, id) => {
      if (!snapshotZombieIds.has(id)) {
        sprite.destroy();
      }
    });
    this.selectedTargetId = resolveTargetId(snapshot.zombies, this.selectedTargetId);

    const pickupById = new Map<number, Phaser.Physics.Arcade.Sprite>();
    this.pickupSprites.getChildren().forEach((obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      pickupById.set(sprite.getData("pickupId") as number, sprite);
    });

    const snapshotPickupIds = new Set<number>();
    snapshot.pickups.forEach((remotePickup) => {
      snapshotPickupIds.add(remotePickup.id);
      let sprite = pickupById.get(remotePickup.id);
      if (!sprite && !remotePickup.collected) {
        sprite = this.spawnPickupSprite(
          remotePickup.type,
          remotePickup.x,
          remotePickup.y,
          remotePickup.id,
        );
      }

      if (!sprite) return;

      const pickup = sprite.getData("pickup") as ReturnType<typeof createPickup>;
      pickup.collected = remotePickup.collected;
      sprite.setPosition(remotePickup.x, remotePickup.y);

      if (remotePickup.collected) {
        sprite.destroy();
      }
    });

    pickupById.forEach((sprite, id) => {
      if (!snapshotPickupIds.has(id)) {
        sprite.destroy();
      }
    });
  }

  private sendGunnerAction(type: GunnerActionType): void {
    this.coopSession?.send({
      type: "gunner-action",
      action: {
        type,
        targetId: this.selectedTargetId,
      },
    });
  }

  private cycleGunnerTarget(direction: "next" | "previous"): void {
    const targets = this.zombieSprites.getChildren().flatMap((obj) => {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const renderState = sprite.getData("zombieRenderState") as
        | ZombieRenderState
        | undefined;
      if (!renderState) return [];
      return [{ id: renderState.id, x: sprite.x, y: sprite.y }];
    });

    this.selectedTargetId = cycleTargetId(
      targets,
      this.selectedTargetId,
      direction,
    );
    this.updateGunnerTargetIndicator();
  }

  private findZombieSpriteById(id: number): Phaser.Physics.Arcade.Sprite | null {
    for (const obj of this.zombieSprites.getChildren()) {
      const sprite = obj as Phaser.Physics.Arcade.Sprite;
      const renderState = sprite.getData("zombieRenderState") as
        | ZombieRenderState
        | undefined;
      if (renderState?.id === id) {
        return sprite;
      }
    }

    return null;
  }

  private updateGunnerTargetIndicator(): void {
    if (!this.isGunnerRole()) return;

    const targetSprite =
      this.selectedTargetId !== null
        ? this.findZombieSpriteById(this.selectedTargetId)
        : null;

    this.gunnerReticle?.clear();

    if (!targetSprite) {
      this.gunnerTargetText?.setText(
        this.isVersusMode() ? "RIVAL TARGET: SCANNING" : "TARGET: SCANNING",
      );
      return;
    }

    const zombie = targetSprite.getData("zombie") as Zombie;
    const renderState = targetSprite.getData("zombieRenderState") as
      | ZombieRenderState
      | undefined;
    const targetLabel = renderState?.elite
      ? `${this.isVersusMode() ? "RIVAL TARGET" : "TARGET"}: ELITE ${zombie.type.toUpperCase()}`
      : `${this.isVersusMode() ? "RIVAL TARGET" : "TARGET"}: ${zombie.type.toUpperCase()}`;

    this.gunnerTargetText?.setText(targetLabel);
    this.gunnerReticle?.lineStyle(2, BC.RED, 0.95);
    this.gunnerReticle?.strokeCircle(targetSprite.x, targetSprite.y, 18);
    this.gunnerReticle?.lineBetween(
      targetSprite.x - 26,
      targetSprite.y,
      targetSprite.x - 12,
      targetSprite.y,
    );
    this.gunnerReticle?.lineBetween(
      targetSprite.x + 12,
      targetSprite.y,
      targetSprite.x + 26,
      targetSprite.y,
    );
    this.gunnerReticle?.lineBetween(
      targetSprite.x,
      targetSprite.y - 26,
      targetSprite.x,
      targetSprite.y - 12,
    );
    this.gunnerReticle?.lineBetween(
      targetSprite.x,
      targetSprite.y + 12,
      targetSprite.x,
      targetSprite.y + 26,
    );
  }

  private maybeTriggerRouteEncounter(completedDeliveries: number): void {
    if (this.subscriberTotal <= 0) return;

    const threshold = getRouteEventThreshold(this.nextRouteEncounterIndex);
    if (threshold === null) return;

    const progress = completedDeliveries / this.subscriberTotal;
    if (progress < threshold) return;

    const encounter = getRouteEncounter(
      this.nextRouteEncounterIndex,
      this.gameState.day,
      this.gameState.difficulty,
    );
    this.nextRouteEncounterIndex += 1;
    this.launchEncounter(encounter);
  }

  private launchEncounter(encounter: CombatEncounter): void {
    this.hud.setCombatAlert(encounter.alert, encounter.tone, 2200);
    floatingText(
      this,
      this.cameras.main.centerX,
      96,
      encounter.label,
      this.getAlertColor(encounter.tone),
      "24px",
    );
    screenShake(this, encounter.tone === "danger" ? 0.01 : 0.008, 180);
    encounter.groups.forEach((group) => {
      this.spawnEncounterGroup(group);
    });
  }

  private spawnEncounterGroup(group: CombatEncounter["groups"][number]): void {
    const lanePositions =
      group.spread === "wide"
        ? [180, 320, 480, 640, 780]
        : group.spread === "flank"
          ? [220, 740]
          : [360, 480, 600];

    for (let i = 0; i < group.count; i++) {
      const x =
        lanePositions[i % lanePositions.length] +
        Phaser.Math.Between(-18, 18);
      const y =
        Phaser.Math.Between(-70, 10) -
        Math.floor(i / lanePositions.length) * 28;
      this.spawnZombieSprite(group.type, x, y, i < group.eliteCount);
    }
  }

  private maybeAnnounceElite(type: ZombieType): void {
    if (this.time.now - this.lastEliteAnnouncementAt < 1400) return;

    this.lastEliteAnnouncementAt = this.time.now;
    const profile = getEliteProfile(type, this.gameState.day);
    this.hud.setCombatAlert(
      `${profile.label.toUpperCase()} INBOUND`,
      profile.tone,
      1600,
    );
  }

  private getAlertColor(tone: CombatAlertTone): string {
    switch (tone) {
      case "success":
        return BC.css.GREEN_BRIGHT;
      case "warning":
        return BC.css.GOLD_GLOW;
      case "danger":
      default:
        return BC.css.RED_GLOW;
    }
  }

  private updateVersusScoreboard(): void {
    if (!this.isVersusMode() || !this.versusScoreText) return;

    this.versusDriverScore = this.gameState.score;
    this.versusScoreText.setText(
      `DRIVER ${this.versusDriverScore}\nRIVAL ${this.versusRivalScore}`,
    );
  }

  private finishVersusMatch(reason: VersusMatchReason): void {
    const result = createVersusMatchResult(
      this.gameState.score,
      this.versusRivalScore,
      reason,
    );
    mergeCoopRuntimeState(this.registry, {
      phase: "linked",
      statusMessage: "Versus round complete. Return to the relay room for another match.",
    });
    if (this.isDriverRole()) {
      this.coopSession?.send({
        type: "host-finish-match",
        result,
      });
    }
    fadeToScene(this, "GameOverScene", { versusResult: result });
  }

  private handleCoopDisconnect(reason: string): void {
    if (this.isGunnerRole()) {
      mergeCoopRuntimeState(this.registry, {
        peerConnected: false,
        phase: "disconnected",
        statusMessage: reason,
      });
      if (!this.transitioning) {
        this.transitioning = true;
        fadeToScene(this, "OnlineCoopScene");
      }
      return;
    }

    if (this.coopRuntime) {
      this.coopRuntime = {
        ...this.coopRuntime,
        peerConnected: false,
      };
      setCoopRuntimeState(this.registry, this.coopRuntime);
      mergeCoopRuntimeState(this.registry, {
        phase: "disconnected",
        statusMessage: reason,
      });
    }

    floatingText(
      this,
      this.cameras.main.centerX,
      72,
      "SOLO CONTROL RESTORED",
      BC.css.RED_GLOW,
      "20px",
    );
  }

  private endRoute(): void {
    if (this.isVersusMode()) {
      this.finishVersusMatch("route-complete");
      return;
    }

    // Calculate subscription changes
    const deliveryData = this.route.houses.map((house, i) => ({
      house,
      delivered: this.deliveries[i],
    }));

    fadeToScene(this, "TrainingScene", { deliveryData });
  }
}
