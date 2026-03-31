import Phaser from "phaser";
import { BC, BROADCAST_FONT } from "./broadcast-styles";

export type TouchControlAction =
  | "throwLeft"
  | "throwRight"
  | "melee"
  | "ranged"
  | "pause";

export type TouchControlDirection = "left" | "right" | "up" | "down";

interface TouchButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  kind: "hold" | "tap";
  direction?: TouchControlDirection;
  action?: TouchControlAction;
  accentColor?: number;
  labelSize?: string;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private viewportScale = 1;
  private movement: Record<TouchControlDirection, boolean> = {
    left: false,
    right: false,
    up: false,
    down: false,
  };
  private queuedActions = new Set<TouchControlAction>();

  constructor(scene: Phaser.Scene, width: number, height: number, scale = 1) {
    this.scene = scene;
    this.viewportScale = scale;
    this.container = this.scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(180);
    this.build(width, height);
  }

  isHeld(direction: TouchControlDirection): boolean {
    return this.movement[direction];
  }

  consumeAction(action: TouchControlAction): boolean {
    const hasAction = this.queuedActions.has(action);
    if (hasAction) {
      this.queuedActions.delete(action);
    }

    return hasAction;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.queuedActions.clear();
    this.container.destroy(true);
  }

  private build(width: number, height: number): void {
    const title = this.scene.add
      .text(
        width / 2,
        height - Math.round(168 * this.viewportScale),
        "FIELD CONTROLS",
        {
          fontFamily: BROADCAST_FONT,
          fontSize: `${Math.round(11 * this.viewportScale)}px`,
          fontStyle: "800",
          color: BC.TEXT_DIM,
          letterSpacing: 3,
        },
      )
      .setOrigin(0.5, 1)
      .setAlpha(0.92);

    this.container.add(title);

    const padCenterX = Math.round(92 * this.viewportScale);
    const padCenterY = height - Math.round(112 * this.viewportScale);
    const padSize = Math.round(56 * this.viewportScale);
    const padGap = Math.round(8 * this.viewportScale);

    this.createButton({
      x: padCenterX,
      y: padCenterY - padSize - padGap,
      width: padSize,
      height: padSize,
      label: "▲",
      kind: "hold",
      direction: "up",
      accentColor: BC.GREEN,
      labelSize: `${Math.round(20 * this.viewportScale)}px`,
    });
    this.createButton({
      x: padCenterX - padSize - padGap,
      y: padCenterY,
      width: padSize,
      height: padSize,
      label: "◀",
      kind: "hold",
      direction: "left",
      accentColor: BC.GREEN,
      labelSize: `${Math.round(20 * this.viewportScale)}px`,
    });
    this.createButton({
      x: padCenterX + padSize + padGap,
      y: padCenterY,
      width: padSize,
      height: padSize,
      label: "▶",
      kind: "hold",
      direction: "right",
      accentColor: BC.GREEN,
      labelSize: `${Math.round(20 * this.viewportScale)}px`,
    });
    this.createButton({
      x: padCenterX,
      y: padCenterY + padSize + padGap,
      width: padSize,
      height: padSize,
      label: "▼",
      kind: "hold",
      direction: "down",
      accentColor: BC.GREEN,
      labelSize: `${Math.round(20 * this.viewportScale)}px`,
    });

    const actionsStartX = width - Math.round(272 * this.viewportScale);
    const actionsStartY = height - Math.round(164 * this.viewportScale);
    const actionWidth = Math.round(114 * this.viewportScale);
    const actionHeight = Math.round(42 * this.viewportScale);
    const actionGap = Math.round(10 * this.viewportScale);

    this.createButton({
      x: actionsStartX,
      y: actionsStartY,
      width: actionWidth,
      height: actionHeight,
      label: "L THROW",
      kind: "tap",
      action: "throwLeft",
      accentColor: BC.RED,
      labelSize: `${Math.round(12 * this.viewportScale)}px`,
    });
    this.createButton({
      x: actionsStartX + actionWidth + actionGap,
      y: actionsStartY,
      width: actionWidth,
      height: actionHeight,
      label: "R THROW",
      kind: "tap",
      action: "throwRight",
      accentColor: BC.RED,
      labelSize: `${Math.round(12 * this.viewportScale)}px`,
    });
    this.createButton({
      x: actionsStartX,
      y: actionsStartY + actionHeight + actionGap,
      width: actionWidth,
      height: actionHeight,
      label: "MELEE",
      kind: "tap",
      action: "melee",
      accentColor: BC.GOLD,
      labelSize: `${Math.round(12 * this.viewportScale)}px`,
    });
    this.createButton({
      x: actionsStartX + actionWidth + actionGap,
      y: actionsStartY + actionHeight + actionGap,
      width: actionWidth,
      height: actionHeight,
      label: "FIRE",
      kind: "tap",
      action: "ranged",
      accentColor: BC.GOLD,
      labelSize: `${Math.round(12 * this.viewportScale)}px`,
    });

    this.createButton({
      x: width / 2,
      y: height - Math.round(28 * this.viewportScale),
      width: Math.round(160 * this.viewportScale),
      height: Math.round(30 * this.viewportScale),
      label: "PAUSE",
      kind: "tap",
      action: "pause",
      accentColor: BC.AMBER,
      labelSize: `${Math.round(12 * this.viewportScale)}px`,
    });
  }

  private createButton(config: TouchButtonConfig): void {
    const container = this.scene.add
      .container(config.x, config.y)
      .setScrollFactor(0);
    const bg = this.scene.add.graphics();
    const accent = this.scene.add.graphics();
    const label = this.scene.add
      .text(0, 0, config.label.toUpperCase(), {
        fontFamily: BROADCAST_FONT,
        fontSize:
          config.labelSize ?? (config.kind === "hold" ? "18px" : "12px"),
        fontStyle: "800",
        color: BC.TEXT,
        letterSpacing: 1,
        align: "center",
      })
      .setOrigin(0.5);

    const hitArea = this.scene.add
      .rectangle(0, 0, config.width, config.height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    const draw = (pressed: boolean): void => {
      bg.clear();
      accent.clear();

      if (pressed) {
        bg.fillStyle(BC.CHROME_LIT, 1);
        bg.fillRoundedRect(
          -config.width / 2,
          -config.height / 2,
          config.width,
          config.height,
          10,
        );
        bg.lineStyle(1, BC.CHROME_EDGE, 1);
        bg.strokeRoundedRect(
          -config.width / 2,
          -config.height / 2,
          config.width,
          config.height,
          10,
        );
      } else {
        bg.fillStyle(BC.CHROME, 0.85);
        bg.fillRoundedRect(
          -config.width / 2,
          -config.height / 2,
          config.width,
          config.height,
          10,
        );
        bg.lineStyle(1, BC.CHROME_EDGE, 0.8);
        bg.strokeRoundedRect(
          -config.width / 2,
          -config.height / 2,
          config.width,
          config.height,
          10,
        );
      }

      accent.fillStyle(config.accentColor ?? BC.RED, 1);
      const accentWidth = config.kind === "hold" ? 3 : 4;
      accent.fillRect(
        -config.width / 2,
        -config.height / 2,
        accentWidth,
        config.height,
      );

      label.setColor(pressed ? BC.TEXT : BC.TEXT_DIM);
    };

    const press = (): void => {
      container.setScale(0.97);
      draw(true);
      if (config.direction) {
        this.movement[config.direction] = true;
      }
      if (config.action) {
        this.queuedActions.add(config.action);
      }
    };

    const release = (): void => {
      container.setScale(1);
      draw(false);
      if (config.direction) {
        this.movement[config.direction] = false;
      }
    };

    hitArea.on("pointerdown", press);
    hitArea.on("pointerup", release);
    hitArea.on("pointerout", release);

    container.add([bg, accent, label, hitArea]);
    draw(false);
    this.container.add(container);
  }
}
