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
      fontFamily: BROADCAST_FONT,
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

// ── Newspaper Confetti ──
// Burst of small newspaper-page rectangles for victory celebrations.
// Runtime-drawn — no assets needed.
export function newspaperConfetti(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  count = 24,
): void {
  if (prefersReducedMotion()) return;

  const colors = [0xf5f0d0, 0xe8e0c8, 0xd8d0b8, 0xccbbaa];
  const { width: cw, height: ch } = scene.cameras.main;

  for (let i = 0; i < count; i++) {
    const w = Phaser.Math.Between(6, 14);
    const h = Phaser.Math.Between(4, 10);
    const color = colors[i % colors.length];

    const piece = scene.add.rectangle(cx, cy, w, h, color).setDepth(500);
    piece.setAlpha(0.9);

    // Scatter randomly outward
    const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
    const dist = Phaser.Math.Between(80, Math.max(cw, ch) * 0.5);
    const targetX = cx + Math.cos(angle) * dist;
    const targetY = cy + Math.sin(angle) * dist + Phaser.Math.Between(40, 160);
    const rotEnd = Phaser.Math.FloatBetween(-3, 3);

    scene.tweens.add({
      targets: piece,
      x: targetX,
      y: targetY,
      rotation: rotEnd,
      alpha: 0,
      duration: Phaser.Math.Between(1400, 2200),
      delay: Phaser.Math.Between(0, 200),
      ease: EASE_OUT_QUART,
      onComplete: () => piece.destroy(),
    });
  }
}

// ── TV Static Noise ──
// Brief burst of random noise rectangles simulating signal loss.
// Used on defeat screen before "SIGNAL LOST" text appears.
export function tvStatic(
  scene: Phaser.Scene,
  duration = 350,
  onComplete?: () => void,
): void {
  if (prefersReducedMotion()) {
    onComplete?.();
    return;
  }

  const { width: cw, height: ch } = scene.cameras.main;
  const noiseGfx = scene.add.graphics().setDepth(800);

  // Draw a static noise frame
  const drawFrame = () => {
    noiseGfx.clear();
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * cw;
      const y = Math.random() * ch;
      const size = Math.random() * 6 + 1;
      const brightness = Math.random();
      noiseGfx.fillStyle(0xffffff, brightness * 0.8);
      noiseGfx.fillRect(x, y, size, size * 0.6);
    }
  };

  // Animate noise frames at ~20fps
  const interval = 50;
  let elapsed = 0;
  const timer = scene.time.addEvent({
    delay: interval,
    repeat: Math.floor(duration / interval),
    callback: () => {
      elapsed += interval;
      if (elapsed >= duration) {
        noiseGfx.destroy();
        timer.destroy();
        onComplete?.();
      } else {
        drawFrame();
      }
    },
  });

  drawFrame();
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
