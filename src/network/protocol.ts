import { Difficulty } from "../config/difficulty";
import { PickupType } from "../entities/Pickup";
import { ZombieType } from "../entities/Zombie";
import { VehicleType } from "../config/vehicles";

export type MultiplayerMode = "coop" | "versus";
export type CoopRole = "driver" | "gunner";
export type VersusMatchReason = "route-complete" | "driver-down";
export type VersusMatchWinner = "driver" | "rival" | "draw";

export interface GunnerAction {
  type: GunnerActionType;
  targetId: number | null;
}

export interface CoopGameConfig {
  mode: MultiplayerMode;
  difficulty: Difficulty;
  vehicle: VehicleType;
  day: number;
  subscribers: number;
}

export interface VersusScoreboard {
  driverScore: number;
  rivalScore: number;
}

export interface VersusMatchResult {
  mode: "versus";
  reason: VersusMatchReason;
  winner: VersusMatchWinner;
  driverScore: number;
  rivalScore: number;
}

export interface DriverSnapshot {
  mode: MultiplayerMode;
  player: {
    x: number;
    y: number;
    alpha: number;
  };
  worldY: number;
  score: number;
  lives: number;
  subscribers: number;
  paperCount: number;
  ammoCount: number;
  deliveries: boolean[];
  zombies: Array<{
    id: number;
    type: ZombieType;
    x: number;
    y: number;
    hp: number;
    elite: boolean;
  }>;
  pickups: Array<{
    id: number;
    type: PickupType;
    x: number;
    y: number;
    collected: boolean;
  }>;
  versusScoreboard?: VersusScoreboard;
}

export type GunnerActionType =
  | "melee"
  | "ranged"
  | "throw-left"
  | "throw-right";

export type ClientMessage =
  | { type: "host-room"; mode: MultiplayerMode }
  | { type: "join-room"; roomCode: string }
  | { type: "host-game-config"; config: CoopGameConfig }
  | { type: "host-start-game" }
  | { type: "driver-snapshot"; snapshot: DriverSnapshot }
  | { type: "host-finish-match"; result: VersusMatchResult }
  | { type: "gunner-action"; action: GunnerAction };

export type ServerMessage =
  | { type: "room-hosted"; roomCode: string; mode: MultiplayerMode }
  | { type: "room-joined"; roomCode: string; role: CoopRole; mode: MultiplayerMode }
  | { type: "peer-status"; connected: boolean }
  | { type: "game-config"; config: CoopGameConfig }
  | { type: "start-game" }
  | { type: "gunner-action"; action: GunnerAction }
  | { type: "snapshot"; snapshot: DriverSnapshot }
  | { type: "match-result"; result: VersusMatchResult }
  | { type: "session-ended"; reason: string }
  | { type: "error"; message: string };
