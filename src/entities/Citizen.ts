import { CITIZEN_PENALTY } from "../config/constants";

export enum CitizenType {
  FriendlyNeighbor = "FriendlyNeighbor",
  PanickedRunner = "PanickedRunner",
  ArmedSurvivalist = "ArmedSurvivalist",
}

export interface Citizen {
  type: CitizenType;
  x: number;
  y: number;
  hitPenalty: number;
  dropsPickup: boolean;
  isStationary: boolean;
  retaliates: boolean;
}

export function createFriendlyNeighbor(x: number, y: number): Citizen {
  return {
    type: CitizenType.FriendlyNeighbor,
    x,
    y,
    hitPenalty: CITIZEN_PENALTY.FRIENDLY_NEIGHBOR,
    dropsPickup: true,
    isStationary: true,
    retaliates: false,
  };
}

export function createPanickedRunner(x: number, y: number): Citizen {
  return {
    type: CitizenType.PanickedRunner,
    x,
    y,
    hitPenalty: CITIZEN_PENALTY.PANICKED_RUNNER,
    dropsPickup: false,
    isStationary: false,
    retaliates: false,
  };
}

export function createArmedSurvivalist(x: number, y: number): Citizen {
  return {
    type: CitizenType.ArmedSurvivalist,
    x,
    y,
    hitPenalty: CITIZEN_PENALTY.ARMED_SURVIVALIST,
    dropsPickup: false,
    isStationary: true,
    retaliates: true,
  };
}
