import Phaser from "phaser";
import { getOrCreateGameState } from "../systems/GameState";
import {
  BC,
  BROADCAST_FONT,
  createBroadcastButton,
  createBroadcastField,
  createChyron,
} from "../ui/broadcast-styles";
import { resolveBroadcastViewportContext } from "../ui/broadcast-viewport";
import { fadeIn, fadeToScene, isTouchPrimary } from "../utils/animations";
import { MultiplayerSession } from "../network/MultiplayerSession";
import {
  clearCoopRuntime,
  getCoopRuntimeState,
  getCoopSession,
  mergeCoopRuntimeState,
  setCoopRuntimeState,
  setCoopSession,
} from "../network/runtime";
import { MultiplayerMode, ServerMessage } from "../network/protocol";

const DEFAULT_SERVER_URL = "ws://localhost:2567";
const SERVER_URL_STORAGE_KEY = "zombiesweep.coopServerUrl";

type FieldKey = "serverUrl" | "roomCode";
type MenuAction = "mode" | "host" | "join" | "disconnect" | "back";
type FocusableControl =
  | { type: "field"; key: FieldKey }
  | { type: "button"; action: MenuAction };

export class OnlineCoopScene extends Phaser.Scene {
  private selectedIndex = 0;
  private buttons = new Map<MenuAction, ReturnType<typeof createBroadcastButton>>();
  private fields = new Map<FieldKey, ReturnType<typeof createBroadcastField>>();
  private focusOrder: FocusableControl[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private roomText!: Phaser.GameObjects.Text;
  private roleText!: Phaser.GameObjects.Text;
  private editingField: FieldKey | null = null;
  private unsubscribeMessage?: () => void;
  private unsubscribeClose?: () => void;
  private transitioning = false;
  private sessionMode: MultiplayerMode = "coop";

  constructor() {
    super({ key: "OnlineCoopScene" });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const viewport = resolveBroadcastViewportContext(
      window.innerWidth,
      window.innerHeight,
      isTouchPrimary(),
    );
    const compact = viewport.isCompact;
    const scale = viewport.uiScale;

    this.selectedIndex = 0;
    this.buttons.clear();
    this.fields.clear();
    this.focusOrder = [];
    this.editingField = null;
    this.transitioning = false;
    this.sessionMode = "coop";
    this.cameras.main.setBackgroundColor(BC.BG);
    fadeIn(this);

    const bgGlow = this.add.graphics();
    bgGlow.fillStyle(BC.RED_DIM, 0.26);
    bgGlow.fillEllipse(width / 2, height * 0.36, width * 0.92, height * 0.7);

    const borders = this.add.graphics();
    borders.fillStyle(BC.RED, 1);
    borders.fillRect(0, 0, width, 3);
    borders.fillRect(0, height - 3, width, 3);

    createChyron(
      this,
      compact ? 44 : 48,
      "ONLINE RELAY",
      "DESKTOP CO-OP / VERSUS SESSION",
      {
        titleSize: compact ? `${Math.round(18 * scale)}px` : "22px",
        subtitleSize: compact ? `${Math.round(10 * scale)}px` : "11px",
      },
    );

    this.add
      .text(width / 2, compact ? 108 : 120, "HOST OR JOIN A RELAY ROOM", {
        fontFamily: BROADCAST_FONT,
        fontSize: compact ? `${Math.round(20 * scale)}px` : "24px",
        fontStyle: "800",
        color: BC.TEXT,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, compact ? 164 : 178, "Relay idle. Host a room or join one.", {
        fontFamily: BROADCAST_FONT,
        fontSize: compact ? `${Math.round(13 * scale)}px` : "14px",
        fontStyle: "600",
        color: BC.TEXT_DIM,
        align: "center",
        wordWrap: { width: compact ? 420 : 560 },
      })
      .setOrigin(0.5);

    this.roomText = this.add
      .text(width / 2, compact ? 200 : 214, "----", {
        fontFamily: BROADCAST_FONT,
        fontSize: compact ? `${Math.round(24 * scale)}px` : "30px",
        fontStyle: "800",
        color: BC.css.GOLD,
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    this.roleText = this.add
      .text(width / 2, compact ? 228 : 246, "ROLE: STANDBY", {
        fontFamily: BROADCAST_FONT,
        fontSize: compact ? `${Math.round(10 * scale)}px` : "11px",
        fontStyle: "700",
        color: BC.TEXT_MUTED,
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    const fieldY = compact ? 298 : 314;
    const fieldGap = compact ? Math.round(64 * scale) : 68;
    const fieldWidth = compact ? Math.round(400 * scale) : 430;

    const serverField = createBroadcastField(
      this,
      width / 2,
      fieldY,
      "Relay URL",
      window.localStorage.getItem(SERVER_URL_STORAGE_KEY) ?? DEFAULT_SERVER_URL,
      {
        width: fieldWidth,
        valueSize: compact ? `${Math.round(14 * scale)}px` : "16px",
        placeholder: DEFAULT_SERVER_URL,
      },
    );
    const roomField = createBroadcastField(
      this,
      width / 2,
      fieldY + fieldGap,
      "Room Code",
      "",
      {
        width: fieldWidth,
        placeholder: "DRIVER CODE",
      },
    );

    this.fields.set("serverUrl", serverField);
    this.fields.set("roomCode", roomField);
    this.focusOrder.push({ type: "field", key: "serverUrl" });
    this.focusOrder.push({ type: "field", key: "roomCode" });

    serverField.hitArea.on("pointerover", () => this.selectControl(0));
    roomField.hitArea.on("pointerover", () => this.selectControl(1));
    serverField.hitArea.on("pointerdown", () => {
      this.selectControl(0);
      this.beginFieldEdit("serverUrl");
    });
    roomField.hitArea.on("pointerdown", () => {
      this.selectControl(1);
      this.beginFieldEdit("roomCode");
    });

    const menuDefs: { text: string; action: MenuAction }[] = [
      { text: this.getModeButtonLabel(), action: "mode" },
      { text: "HOST SESSION", action: "host" },
      { text: "JOIN SESSION", action: "join" },
      { text: "DISCONNECT", action: "disconnect" },
      { text: "BACK", action: "back" },
    ];
    const btnWidth = compact ? Math.round(330 * scale) : 300;
    const btnHeight = compact ? Math.round(48 * scale) : 50;
    const btnStartY = compact ? height * 0.69 : height * 0.71;
    const btnGap = compact ? Math.round(50 * scale) : 56;

    menuDefs.forEach((item, i) => {
      const btn = createBroadcastButton(
        this,
        width / 2,
        btnStartY + i * btnGap,
        item.text,
        {
          width: btnWidth,
          height: btnHeight,
          labelSize: compact ? `${Math.round(17 * scale)}px` : "17px",
        },
      );
      this.buttons.set(item.action, btn);
      this.focusOrder.push({ type: "button", action: item.action });
      btn.hitArea.on("pointerover", () => this.selectControl(i + 2));
      btn.hitArea.on("pointerdown", () => {
        this.selectControl(i + 2);
        void this.handleMenuAction(item.action);
      });
    });

    this.add
      .text(width / 2, compact ? height - 34 : height - 40, "ARROWS TO NAVIGATE  •  ENTER TO EDIT OR ACTIVATE  •  ESC TO CANCEL EDIT", {
        fontFamily: BROADCAST_FONT,
        fontSize: compact ? `${Math.round(9 * scale)}px` : "10px",
        fontStyle: "700",
        color: BC.TEXT_MUTED,
        letterSpacing: 1.2,
      })
      .setOrigin(0.5);

    this.updateSelection();
    this.attachExistingSession();
    this.bindExistingSession();

    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      this.handleKeyboardInput(event);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeMessage?.();
      this.unsubscribeClose?.();
      this.input.keyboard?.removeAllListeners();
    });
  }

  private handleKeyboardInput(event: KeyboardEvent): void {
    if (this.editingField) {
      this.handleFieldEditing(event);
      return;
    }

    switch (event.code) {
      case "ArrowUp":
        event.preventDefault();
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.updateSelection();
        return;
      case "ArrowDown":
        event.preventDefault();
        this.selectedIndex = Math.min(this.focusOrder.length - 1, this.selectedIndex + 1);
        this.updateSelection();
        return;
      case "Enter":
      case "Space":
        event.preventDefault();
        this.activateSelection();
        return;
      default:
        break;
    }

    const selected = this.focusOrder[this.selectedIndex];
    if (selected?.type === "field" && event.key.length === 1) {
      this.beginFieldEdit(selected.key);
      this.applyFieldCharacter(selected.key, event.key);
    }
  }

  private handleFieldEditing(event: KeyboardEvent): void {
    const fieldKey = this.editingField;
    if (!fieldKey) return;

    switch (event.code) {
      case "Escape":
        event.preventDefault();
        this.editingField = null;
        this.setStatus("Edit cancelled.");
        this.updateSelection();
        return;
      case "Enter":
        event.preventDefault();
        this.finishFieldEdit();
        return;
      case "Backspace": {
        event.preventDefault();
        const field = this.fields.get(fieldKey);
        if (!field) return;
        field.setValue(field.getValue().slice(0, -1));
        return;
      }
      default:
        break;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      this.applyFieldCharacter(fieldKey, event.key);
    }
  }

  private applyFieldCharacter(fieldKey: FieldKey, char: string): void {
    const field = this.fields.get(fieldKey);
    if (!field) return;

    const nextValue = this.sanitizeFieldValue(fieldKey, `${field.getValue()}${char}`);
    field.setValue(nextValue);
  }

  private finishFieldEdit(): void {
    const fieldKey = this.editingField;
    if (!fieldKey) return;

    const field = this.fields.get(fieldKey);
    const normalized = this.sanitizeFieldValue(fieldKey, field?.getValue() ?? "");
    field?.setValue(normalized);
    this.editingField = null;

    if (fieldKey === "serverUrl" && normalized) {
      window.localStorage.setItem(SERVER_URL_STORAGE_KEY, normalized);
    }

    this.setStatus(
      fieldKey === "serverUrl"
        ? "Relay URL updated."
        : normalized
          ? `Room code staged: ${normalized}`
          : "Room code cleared.",
    );
    this.updateSelection();
  }

  private sanitizeFieldValue(fieldKey: FieldKey, value: string): string {
    if (fieldKey === "roomCode") {
      return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    }

    return value.replace(/\s+/g, "").slice(0, 120);
  }

  private activateSelection(): void {
    const selected = this.focusOrder[this.selectedIndex];
    if (!selected) return;

    if (selected.type === "field") {
      this.beginFieldEdit(selected.key);
      return;
    }

    void this.handleMenuAction(selected.action);
  }

  private selectControl(index: number): void {
    this.selectedIndex = Phaser.Math.Clamp(index, 0, this.focusOrder.length - 1);
    this.updateSelection();
  }

  private beginFieldEdit(fieldKey: FieldKey): void {
    this.editingField = fieldKey;
    this.setStatus(
      fieldKey === "serverUrl"
        ? "Editing relay URL. Press Enter to apply."
        : "Editing room code. Press Enter to apply.",
    );
    this.updateSelection();
  }

  private updateSelection(): void {
    const selected = this.focusOrder[this.selectedIndex];
    this.fields.forEach((field, key) => {
      field.setSelected(
        selected?.type === "field" && selected.key === key,
      );
    });
    this.buttons.forEach((button, action) => {
      button.setSelected(
        selected?.type === "button" && selected.action === action,
      );
    });
  }

  private attachExistingSession(): void {
    const runtime = getCoopRuntimeState(this.registry);
    if (!runtime) return;

    this.sessionMode = runtime.mode;
    this.updateModeButtonLabel();
    this.fields.get("serverUrl")?.setValue(runtime.serverUrl);
    this.fields.get("roomCode")?.setValue(runtime.roomCode);
    this.updateRoomDisplay(runtime.roomCode);
    this.roleText.setText(`ROLE: ${this.describeRole(runtime)}`);
    this.setStatus(runtime.statusMessage || this.describeRuntime(runtime), false);
  }

  private bindExistingSession(): void {
    const session = getCoopSession(this.registry);
    if (!session) return;
    this.bindSession(session);
  }

  private async handleMenuAction(action: MenuAction): Promise<void> {
    if (action === "mode") {
      this.toggleMode();
      return;
    }

    if (action === "back") {
      this.releaseSession(true);
      fadeToScene(this, "WelcomeScene");
      return;
    }

    if (action === "disconnect") {
      this.releaseSession(true);
      this.updateRoomDisplay("");
      this.roleText.setText("ROLE: STANDBY");
      this.setStatus("Session cleared. You can host or join another room.");
      return;
    }

    const serverUrl = this.getServerUrlValue();
    if (!serverUrl) {
      this.setStatus("Enter a relay URL before connecting.");
      this.beginFieldEdit("serverUrl");
      return;
    }

    if (action === "join" && !this.getRoomCodeValue()) {
      this.setStatus("Enter a driver room code before joining.");
      this.beginFieldEdit("roomCode");
      return;
    }

    try {
      this.releaseSession(false);

      const session = new MultiplayerSession();
      await session.connect(serverUrl);
      window.localStorage.setItem(SERVER_URL_STORAGE_KEY, serverUrl);
      setCoopSession(this.registry, session);
      this.bindSession(session);

      if (action === "host") {
        this.setStatus(
          this.sessionMode === "versus"
            ? "Establishing versus uplink..."
            : "Establishing room uplink...",
        );
        session.send({ type: "host-room", mode: this.sessionMode });
        return;
      }

      this.setStatus(`Joining room ${this.getRoomCodeValue()}...`);
      session.send({ type: "join-room", roomCode: this.getRoomCodeValue() });
    } catch (error) {
      this.setStatus(
        error instanceof Error ? error.message : "Unable to reach the relay.",
      );
    }
  }

  private bindSession(session: MultiplayerSession): void {
    this.unsubscribeMessage?.();
    this.unsubscribeClose?.();
    this.unsubscribeMessage = session.onMessage((message) => {
      this.handleServerMessage(message);
    });
    this.unsubscribeClose = session.onClose(() => {
      setCoopSession(this.registry, null);
      const runtime = mergeCoopRuntimeState(this.registry, {
        peerConnected: false,
        phase: "disconnected",
        statusMessage: "Relay disconnected. You can reconnect from this screen.",
      });
      if (!this.transitioning) {
        this.roleText.setText(`ROLE: ${runtime ? this.describeRole(runtime) : "STANDBY"}`);
        this.setStatus("Relay disconnected. You can reconnect from this screen.", false);
      }
    });
  }

  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case "room-hosted": {
        const serverUrl = this.getServerUrlValue();
        this.sessionMode = message.mode;
        this.updateModeButtonLabel();
        setCoopRuntimeState(this.registry, {
          enabled: true,
          mode: message.mode,
          role: "driver",
          roomCode: message.roomCode,
          serverUrl,
          peerConnected: false,
          phase: "waiting",
          statusMessage:
            message.mode === "versus"
              ? "Versus room live. Share the code and wait for your rival."
              : "Room live. Share the code and wait for a gunner.",
        });
        this.fields.get("roomCode")?.setValue(message.roomCode);
        this.updateRoomDisplay(message.roomCode);
        this.roleText.setText("ROLE: DRIVER");
        this.setStatus(
          message.mode === "versus"
            ? "Versus room live. Share the code and wait for your rival."
            : "Room live. Share the code and wait for a gunner.",
          false,
        );
        break;
      }
      case "room-joined": {
        const serverUrl = this.getServerUrlValue();
        this.sessionMode = message.mode;
        this.updateModeButtonLabel();
        setCoopRuntimeState(this.registry, {
          enabled: true,
          mode: message.mode,
          role: "gunner",
          roomCode: message.roomCode,
          serverUrl,
          peerConnected: true,
          phase: "linked",
          statusMessage:
            message.mode === "versus"
              ? "Linked as rival. Waiting for the driver loadout."
              : "Linked as gunner. Waiting for the driver loadout.",
        });
        this.fields.get("roomCode")?.setValue(message.roomCode);
        this.updateRoomDisplay(message.roomCode);
        this.roleText.setText(
          `ROLE: ${message.mode === "versus" ? "RIVAL" : "GUNNER"}`,
        );
        this.setStatus(
          message.mode === "versus"
            ? "Linked as rival. Waiting for the driver loadout."
            : "Linked as gunner. Waiting for the driver loadout.",
          false,
        );
        break;
      }
      case "peer-status": {
        const runtime = mergeCoopRuntimeState(this.registry, {
          peerConnected: message.connected,
          phase: message.connected ? "linked" : "waiting",
          statusMessage: message.connected
            ? this.sessionMode === "versus"
              ? "Rival linked. Opening dispatch controls..."
              : "Gunner linked. Opening dispatch controls..."
            : this.sessionMode === "versus"
              ? "Rival disconnected. Waiting for reconnection."
              : "Gunner disconnected. Waiting for reconnection.",
        });
        if (!runtime) break;
        this.roleText.setText(`ROLE: ${this.describeRole(runtime)}`);
        this.setStatus(runtime.statusMessage, false);
        if (runtime.role === "driver" && message.connected && !this.transitioning) {
          this.transitioning = true;
          this.time.delayedCall(300, () => {
            fadeToScene(this, "VehicleSelectScene");
          });
        }
        break;
      }
      case "game-config": {
        const gameState = getOrCreateGameState(this.registry);
        gameState.reset();
        gameState.day = message.config.day;
        gameState.subscribers = message.config.subscribers;
        gameState.configure(message.config.difficulty, message.config.vehicle);
        this.registry.set("gameState", gameState);
        mergeCoopRuntimeState(this.registry, {
          mode: message.config.mode,
          phase: "launching",
          statusMessage:
            message.config.mode === "versus"
              ? "Versus loadout locked. Awaiting launch..."
              : "Driver locked a loadout. Awaiting launch...",
        });
        this.sessionMode = message.config.mode;
        this.updateModeButtonLabel();
        this.setStatus(
          message.config.mode === "versus"
            ? "Versus loadout locked. Awaiting launch..."
            : "Driver locked a loadout. Awaiting launch...",
          false,
        );
        break;
      }
      case "start-game":
        mergeCoopRuntimeState(this.registry, {
          phase: "in-match",
          statusMessage: "Match live. Syncing driver route data.",
        });
        if (!this.transitioning) {
          this.transitioning = true;
          fadeToScene(this, "GameScene");
        }
        break;
      case "session-ended":
        this.releaseSession(true);
        this.updateRoomDisplay("");
        this.roleText.setText("ROLE: STANDBY");
        this.setStatus(message.reason);
        break;
      case "match-result":
        break;
      case "error":
        mergeCoopRuntimeState(this.registry, {
          phase: "error",
          statusMessage: message.message,
        });
        this.setStatus(message.message, false);
        break;
      case "snapshot":
      case "gunner-action":
        break;
    }
  }

  private releaseSession(clearRuntimeState: boolean): void {
    this.unsubscribeMessage?.();
    this.unsubscribeClose?.();
    this.unsubscribeMessage = undefined;
    this.unsubscribeClose = undefined;

    const session = getCoopSession(this.registry);
    setCoopSession(this.registry, null);
    session?.disconnect();

    if (clearRuntimeState) {
      clearCoopRuntime(this.registry);
    }
  }

  private getServerUrlValue(): string {
    return this.sanitizeFieldValue(
      "serverUrl",
      this.fields.get("serverUrl")?.getValue() ?? "",
    );
  }

  private getRoomCodeValue(): string {
    return this.sanitizeFieldValue(
      "roomCode",
      this.fields.get("roomCode")?.getValue() ?? "",
    );
  }

  private updateRoomDisplay(roomCode: string): void {
    this.roomText.setText(roomCode || "----");
  }

  private describeRuntime(
    runtime: NonNullable<ReturnType<typeof getCoopRuntimeState>>,
  ): string {
    if (runtime.role === "driver") {
      return runtime.peerConnected
        ? runtime.mode === "versus"
          ? "Rival linked. Choose a loadout to start the match."
          : "Gunner linked. Choosing a loadout now."
        : runtime.mode === "versus"
          ? "Versus room open. Waiting for a rival to join."
          : "Room open. Waiting for a gunner to join.";
    }

    return runtime.mode === "versus"
      ? "Linked as rival. Waiting for the driver to dispatch."
      : "Linked as gunner. Waiting for the driver to dispatch.";
  }

  private setStatus(message: string, persist = true): void {
    this.statusText.setText(message);
    if (!persist) return;

    mergeCoopRuntimeState(this.registry, {
      statusMessage: message,
    });
  }

  private toggleMode(): void {
    this.sessionMode = this.sessionMode === "coop" ? "versus" : "coop";
    this.updateModeButtonLabel();
    this.setStatus(
      this.sessionMode === "versus"
        ? "Versus mode armed. Driver and rival will compete on one route."
        : "Co-op mode armed. Driver and gunner will share the route fight.",
      false,
    );
  }

  private getModeButtonLabel(): string {
    return `MODE: ${this.sessionMode === "versus" ? "VERSUS" : "CO-OP"}`;
  }

  private updateModeButtonLabel(): void {
    this.buttons.get("mode")?.label.setText(this.getModeButtonLabel());
  }

  private describeRole(
    runtime: NonNullable<ReturnType<typeof getCoopRuntimeState>>,
  ): string {
    if (runtime.role === "driver") return "DRIVER";
    return runtime.mode === "versus" ? "RIVAL" : "GUNNER";
  }
}
