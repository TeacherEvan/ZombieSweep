import Phaser from "phaser";

// ── Easing constants ──
// Natural deceleration curves — never bounce or elastic
const EASE_OUT_QUART = "Quart.easeOut";
const EASE_OUT_EXPO = "Expo.easeOut";

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

// ── Fade Scene Transition ──
// Fade camera out, call onMidpoint (to start next scene), with configurable duration
export function fadeToScene(
  scene: Phaser.Scene,
  targetScene: string,
  data?: object,
  duration = 400,
): void {
  scene.cameras.main.fadeOut(duration, 0, 0, 0);
  scene.cameras.main.once(
    Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
    () => {
      scene.scene.start(targetScene, data);
    },
  );
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
