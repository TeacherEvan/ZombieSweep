import { MultiplayerSession } from "./MultiplayerSession";
import { CoopRole, MultiplayerMode } from "./protocol";

export type CoopSessionPhase =
  | "idle"
  | "connecting"
  | "hosting"
  | "joining"
  | "waiting"
  | "linked"
  | "launching"
  | "in-match"
  | "disconnected"
  | "error";

export interface CoopRuntimeState {
  enabled: boolean;
  mode: MultiplayerMode;
  role: CoopRole;
  roomCode: string;
  serverUrl: string;
  peerConnected: boolean;
  phase: CoopSessionPhase;
  statusMessage: string;
}

const COOP_RUNTIME_KEY = "coopRuntimeState";
const COOP_SESSION_KEY = "coopRuntimeSession";

interface RegistryLike {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  remove?(key: string): void;
}

export function getCoopRuntimeState(
  registry: RegistryLike,
): CoopRuntimeState | null {
  const state = registry.get(COOP_RUNTIME_KEY);
  if (!state || typeof state !== "object") return null;
  return state as CoopRuntimeState;
}

export function setCoopRuntimeState(
  registry: RegistryLike,
  state: CoopRuntimeState | null,
): void {
  registry.set(COOP_RUNTIME_KEY, state);
}

export function mergeCoopRuntimeState(
  registry: RegistryLike,
  patch: Partial<CoopRuntimeState>,
): CoopRuntimeState | null {
  const current = getCoopRuntimeState(registry);
  if (!current) return null;

  const next = {
    ...current,
    ...patch,
  };
  setCoopRuntimeState(registry, next);
  return next;
}

export function getCoopSession(
  registry: RegistryLike,
): MultiplayerSession | null {
  const session = registry.get(COOP_SESSION_KEY);
  return session instanceof MultiplayerSession ? session : null;
}

export function setCoopSession(
  registry: RegistryLike,
  session: MultiplayerSession | null,
): void {
  registry.set(COOP_SESSION_KEY, session);
}

export function clearCoopRuntime(registry: RegistryLike): void {
  setCoopRuntimeState(registry, null);
  const session = getCoopSession(registry);
  session?.disconnect();
  setCoopSession(registry, null);
}
