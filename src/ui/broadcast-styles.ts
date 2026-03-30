import Phaser from "phaser";

// ── Broadcast Color Palette ──
// Mirrors the CSS custom properties in index.html for visual continuity.
// Integer values (0x) for Phaser graphics fills.
// String values (#) for Phaser text style colors.
export const BC = {
  // Phaser fill colors (integers)
  BG: 0x070a10,
  CHROME: 0x0e1118,
  CHROME_LIT: 0x161a24,
  CHROME_EDGE: 0x1e222e,
  RED: 0xcc1100,
  RED_GLOW: 0xff2a10,
  RED_DIM: 0x6b0a00,
  GOLD: 0xd4a828,
  GOLD_DIM: 0x7a6218,
  GREEN: 0x22aa44,
  AMBER: 0xcc8822,

  // Phaser text colors (CSS strings)
  TEXT: "#d8d0c4",
  TEXT_DIM: "#6a645c",
  TEXT_MUTED: "#3a3630",

  // CSS hex strings for fill colors (used in text style color fields)
  css: {
    RED: "#cc1100",
    RED_GLOW: "#ff2a10",
    RED_DIM: "#6b0a00",
    GOLD: "#d4a828",
    GOLD_DIM: "#7a6218",
    GOLD_GLOW: "#ffcc44",
    GREEN: "#22aa44",
    GREEN_BRIGHT: "#22ee66",
    AMBER: "#cc8822",
  },
} as const;

export const BROADCAST_FONT =
  "'Barlow Condensed', 'Arial Narrow', sans-serif" as const;

// ── Shared Text Styles ──

export function labelStyle(
  overrides: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: BROADCAST_FONT,
    fontSize: "12px",
    fontStyle: "600",
    color: BC.TEXT_DIM,
    letterSpacing: 2,
    ...overrides,
  };
}

export function valueStyle(
  overrides: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: BROADCAST_FONT,
    fontSize: "20px",
    fontStyle: "bold",
    color: BC.TEXT,
    ...overrides,
  };
}

// ── Chyron (Lower Third) ──
// The signature broadcast element — red left accent + title + subtitle on chrome bg.
export function createChyron(
  scene: Phaser.Scene,
  y: number,
  title: string,
  subtitle: string,
  options: { width?: number; x?: number; titleSize?: string } = {},
): Phaser.GameObjects.Container {
  const { width: cw } = scene.cameras.main;
  const w = options.width ?? cw * 0.88;
  const x = options.x ?? cw / 2;
  const titleSize = options.titleSize ?? "22px";

  const container = scene.add.container(x, y);

  // Chrome background
  const bg = scene.add.graphics();
  bg.fillStyle(BC.CHROME, 0.92);
  bg.fillRect(-w / 2, -28, w, 56);

  // Red left accent bar
  const accent = scene.add.graphics();
  accent.fillStyle(BC.RED, 1);
  accent.fillRect(-w / 2, -28, 4, 56);

  // Title text
  const titleText = scene.add
    .text(-w / 2 + 18, -12, title.toUpperCase(), {
      fontFamily: BROADCAST_FONT,
      fontSize: titleSize,
      fontStyle: "800",
      color: BC.TEXT,
      letterSpacing: 1,
    })
    .setOrigin(0, 0);

  // Subtitle text
  const subtitleText = scene.add
    .text(-w / 2 + 18, 14, subtitle.toUpperCase(), {
      fontFamily: BROADCAST_FONT,
      fontSize: "11px",
      fontStyle: "600",
      color: BC.TEXT_DIM,
      letterSpacing: 2,
    })
    .setOrigin(0, 0);

  container.add([bg, accent, titleText, subtitleText]);
  return container;
}

// ── Broadcast Button ──
// Menu action row with red left accent on select.
export function createBroadcastButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options: { width?: number; height?: number; selected?: boolean } = {},
): {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  accent: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Rectangle;
  setSelected: (selected: boolean) => void;
} {
  const w = options.width ?? 280;
  const h = options.height ?? 48;

  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const accent = scene.add.graphics();
  const label = scene.add
    .text(-w / 2 + 18, 0, text.toUpperCase(), {
      fontFamily: BROADCAST_FONT,
      fontSize: "17px",
      fontStyle: "700",
      color: BC.TEXT_DIM,
      letterSpacing: 1,
    })
    .setOrigin(0, 0.5);

  // Invisible hit area for pointer events
  const hitArea = scene.add
    .rectangle(0, 0, w, h, 0x000000, 0)
    .setInteractive({ useHandCursor: true });

  const setSelected = (selected: boolean) => {
    bg.clear();
    accent.clear();

    if (selected) {
      bg.fillStyle(BC.CHROME_LIT, 1);
      bg.fillRect(-w / 2, -h / 2, w, h);
      bg.lineStyle(1, BC.CHROME_EDGE, 1);
      bg.strokeRect(-w / 2, -h / 2, w, h);
      accent.fillStyle(BC.RED, 1);
      accent.fillRect(-w / 2, -h / 2, 3, h);
      label.setColor(BC.TEXT);

      // Subtle lift on selection
      scene.tweens.killTweensOf(container);
      scene.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 120,
        ease: "Quart.easeOut",
      });
    } else {
      bg.fillStyle(BC.CHROME, 0.6);
      bg.fillRect(-w / 2, -h / 2, w, h);
      bg.lineStyle(1, BC.CHROME_EDGE, 0.5);
      bg.strokeRect(-w / 2, -h / 2, w, h);
      label.setColor(BC.TEXT_DIM);

      // Settle back to normal scale
      scene.tweens.killTweensOf(container);
      scene.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Quart.easeOut",
      });
    }
  };

  // Press-down feel on click
  hitArea.on("pointerdown", () => {
    scene.tweens.add({
      targets: container,
      scaleX: 0.97,
      scaleY: 0.97,
      duration: 60,
      yoyo: true,
      ease: "Quart.easeOut",
    });
  });

  container.add([bg, accent, label, hitArea]);
  setSelected(options.selected ?? false);

  return { container, bg, accent, label, hitArea, setSelected };
}

// ── Data Row ──
// Label + value pair for stats and scores.
export function createDataRow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  value: string,
  options: {
    width?: number;
    valueColor?: string;
    labelSize?: string;
    valueSize?: string;
  } = {},
): {
  container: Phaser.GameObjects.Container;
  labelText: Phaser.GameObjects.Text;
  valueText: Phaser.GameObjects.Text;
} {
  const w = options.width ?? 400;
  const valueColor = options.valueColor ?? BC.TEXT;
  const labelSize = options.labelSize ?? "12px";
  const valueSize = options.valueSize ?? "20px";

  const container = scene.add.container(x, y);

  const labelText = scene.add
    .text(-w / 2, 0, label.toUpperCase(), {
      fontFamily: BROADCAST_FONT,
      fontSize: labelSize,
      fontStyle: "600",
      color: BC.TEXT_DIM,
      letterSpacing: 2,
    })
    .setOrigin(0, 0.5);

  const valueText = scene.add
    .text(w / 2, 0, value, {
      fontFamily: BROADCAST_FONT,
      fontSize: valueSize,
      fontStyle: "800",
      color: valueColor,
    })
    .setOrigin(1, 0.5);

  container.add([labelText, valueText]);
  return { container, labelText, valueText };
}

// ── Alert Banner ──
// Full-width announcement bar for breaking news, alerts, and warnings.
export function createAlertBanner(
  scene: Phaser.Scene,
  y: number,
  text: string,
  options: {
    bgColor?: number;
    textColor?: string;
    width?: number;
    height?: number;
  } = {},
): Phaser.GameObjects.Container {
  const { width: cw } = scene.cameras.main;
  const w = options.width ?? cw * 0.88;
  const h = options.height ?? 36;
  const bgColor = options.bgColor ?? BC.RED;
  const textColor = options.textColor ?? "#ffffff";

  const container = scene.add.container(cw / 2, y);

  const bg = scene.add.graphics();
  bg.fillStyle(bgColor, 0.95);
  bg.fillRect(-w / 2, -h / 2, w, h);

  const label = scene.add
    .text(0, 0, text.toUpperCase(), {
      fontFamily: BROADCAST_FONT,
      fontSize: "14px",
      fontStyle: "800",
      color: textColor,
      letterSpacing: 2,
    })
    .setOrigin(0.5);

  container.add([bg, label]);
  return container;
}
