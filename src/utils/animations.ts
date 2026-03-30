import Phaser from "phaser";
import { BC, BROADCAST_FONT } from "../ui/broadcast-styles";

// ── Easing constants ──
// Natural deceleration curves — never bounce or elastic
const EASE_OUT_QUART = "Quart.easeOut";
const EASE_OUT_EXPO = "Expo.easeOut";

// ── Station Break Transition Config ──
// Timing and layout constants for the broadcast "Station Break" wipe.
export const STATION_BREAK = {
  WIPE_IN_MS: 250,
  HOLD_MS: 200,
  DEPTH: 999,
  BAR_HEIGHT: 6,
  STATION_ID: "WZMB 13",
} as const;

// ── Screen Shake ──
// Camera shake on damage, impact, etc.
export function screenShake(
  scene: Phaser.Scene,
  intensity = 0.008,
  duration = 180,
): void {
  scene.cameras.main.shake(duration, intensity);
}

// ── Red Damage Flash ──
// Brief red tint on the camera for player damage
export function damageFlash(scene: Phaser.Scene, duration = 150): void {
  scene.cameras.main.flash(duration, 180, 20, 10, false);
}

// ── Floating Text ──
// Text that rises and fades out — for "+100", "DELIVERED!", "MISS", combo text, etc.
export function floatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string,
  fontSize = "16px",
  rise = 40,
  duration = 700,
): Phaser.GameObjects.Text {
  const txt = scene.add
    .text(x, y, text, {
      fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
      fontSize,
      color,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: "#000000",
        blur: 4,
        fill: true,
      },
    })
    .setOrigin(0.5)
    .setDepth(150);

  scene.tweens.add({
    targets: txt,
    y: y - rise,
    alpha: 0,
    duration,
    ease: EASE_OUT_QUART,
    onComplete: () => txt.destroy(),
  });

  return txt;
}

// ── Death Flash ──
// Entity death: brief white flash, scale down, fade out, then destroy
export function deathFlash(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite,
  onComplete?: () => void,
): void {
  // Disable physics body immediately so it can't interact
  if ("body" in sprite && sprite.body) {
    (sprite.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  sprite.setTint(0xffffff);

  scene.tweens.add({
    targets: sprite,
    scaleX: 0.2,
    scaleY: 0.2,
    alpha: 0,
    duration: 250,
    ease: EASE_OUT_EXPO,
    onComplete: () => {
      sprite.destroy();
      onComplete?.();
    },
  });
}

// ── Collect Effect ──
// Pickup collection: brief scale pop + fade out
export function collectEffect(
  scene: Phaser.Scene,
  sprite: Phaser.GameObjects.Sprite | Phaser.Physics.Arcade.Sprite,
  onComplete?: () => void,
): void {
  if ("body" in sprite && sprite.body) {
    (sprite.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  scene.tweens.add({
    targets: sprite,
    scaleX: 1.6,
    scaleY: 1.6,
    alpha: 0,
    duration: 200,
    ease: EASE_OUT_QUART,
    onComplete: () => {
      sprite.destroy();
      onComplete?.();
    },
  });
}

// ── Melee Swing Arc ──
// Brief visual swing indicator: a thin arc that appears and fades
export function meleeSwingArc(
  scene: Phaser.Scene,
  x: number,
  y: number,
  range: number,
  color = 0xffffff,
): void {
  const arc = scene.add.graphics().setDepth(120);
  arc.lineStyle(3, color, 0.7);
  arc.beginPath();
  arc.arc(x, y, range, Phaser.Math.DegToRad(-120), Phaser.Math.DegToRad(-60));
  arc.strokePath();

  scene.tweens.add({
    targets: arc,
    alpha: 0,
    duration: 200,
    ease: EASE_OUT_QUART,
    onComplete: () => arc.destroy(),
  });
}

// ── Pulse ──
// Quick scale-up and back for score changes, notifications, etc.
export function pulse(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  scale = 1.2,
  duration = 150,
): void {
  scene.tweens.killTweensOf(target);
  scene.tweens.add({
    targets: target,
    scaleX: scale,
    scaleY: scale,
    duration,
    yoyo: true,
    ease: EASE_OUT_QUART,
  });
}

// ── Station Break Transition ──
// Broadcast-branded wipe: red accent bar slides in, WZMB 13 station ID holds,
// then scene.start() fires and the new scene's fadeIn() reveals content.
export function fadeToScene(
  scene: Phaser.Scene,
  targetScene: string,
  data?: object,
  _duration = 400,
): void {
  // Accessibility: instant cut when user prefers reduced motion
  if (prefersReducedMotion()) {
    scene.scene.start(targetScene, data);
    return;
  }

  const { width: cw, height: ch } = scene.cameras.main;
  const { WIPE_IN_MS, HOLD_MS, DEPTH, BAR_HEIGHT, STATION_ID } = STATION_BREAK;

  // ── Chrome background — full screen, fades in ──
  const bg = scene.add.graphics().setDepth(DEPTH).setAlpha(0);
  bg.fillStyle(BC.CHROME, 1);
  bg.fillRect(0, 0, cw, ch);

  // ── Red accent bar — full width, starts offscreen left ──
  const bar = scene.add.graphics().setDepth(DEPTH + 1);
  bar.fillStyle(BC.RED, 1);
  bar.fillRect(0, 0, cw, BAR_HEIGHT);
  bar.setPosition(-cw, ch / 2 - BAR_HEIGHT / 2);

  // ── Station ID text — centered below bar, starts hidden ──
  const stationText = scene.add
    .text(cw / 2, ch / 2 + 20, STATION_ID, {
      fontFamily: BROADCAST_FONT,
      fontSize: "28px",
      fontStyle: "800",
      color: BC.TEXT,
      letterSpacing: 4,
    })
    .setOrigin(0.5)
    .setDepth(DEPTH + 2)
    .setAlpha(0);

  // Phase 1: Wipe in — chrome bg fades, bar slides, text appears
  scene.tweens.add({
    targets: bg,
    alpha: 1,
    duration: WIPE_IN_MS,
    ease: EASE_OUT_QUART,
  });

  scene.tweens.add({
    targets: bar,
    x: 0,
    duration: WIPE_IN_MS,
    ease: EASE_OUT_QUART,
  });

  scene.tweens.add({
    targets: stationText,
    alpha: 1,
    duration: WIPE_IN_MS,
    ease: EASE_OUT_QUART,
  });

  // Phase 2: Hold, then switch scene.
  // Phaser's scene.start() destroys the old scene and all its objects,
  // so the overlay auto-cleans. The new scene's fadeIn() provides the reveal.
  scene.time.delayedCall(WIPE_IN_MS + HOLD_MS, () => {
    scene.scene.start(targetScene, data);
  });
}

// ── Fade In on Scene Start ──
// Call at the beginning of create() for a smooth entrance
export function fadeIn(scene: Phaser.Scene, duration = 350): void {
  scene.cameras.main.fadeIn(duration, 0, 0, 0);
}

// ── Staggered Reveal ──
// Animate an array of targets with increasing delay
export function staggerReveal(
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject[],
  config: {
    baseDelay?: number;
    stagger?: number;
    duration?: number;
    offsetY?: number;
  } = {},
): void {
  const {
    baseDelay = 200,
    stagger = 80,
    duration = 400,
    offsetY = 16,
  } = config;

  targets.forEach((target, i) => {
    if (
      target instanceof Phaser.GameObjects.Text ||
      target instanceof Phaser.GameObjects.Rectangle
    ) {
      target.setAlpha(0);
    }
    scene.tweens.add({
      targets: target,
      alpha: 1,
      y: `-=${offsetY}`,
      duration,
      delay: baseDelay + i * stagger,
      ease: EASE_OUT_QUART,
    });
  });
}

// ── Count-Up Animation ──
// Animate a number from 0 to target in a text object
export function countUp(
  scene: Phaser.Scene,
  textObj: Phaser.GameObjects.Text,
  target: number,
  duration = 1200,
  delay = 0,
  prefix = "",
  suffix = "",
): void {
  const counter = { value: 0 };
  scene.tweens.add({
    targets: counter,
    value: target,
    duration,
    delay,
    ease: EASE_OUT_QUART,
    onUpdate: () => {
      textObj.setText(`${prefix}${Math.floor(counter.value)}${suffix}`);
    },
  });
}

// ── Reduced Motion Check ──
// Respect prefers-reduced-motion
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Touch Device Detection ──
// Returns true when the primary input is touch (phone/tablet).
// Used to swap instruction text ("PRESS ENTER" → "TAP").
export function isTouchPrimary(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}
