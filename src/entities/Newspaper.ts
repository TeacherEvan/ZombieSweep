import { NEWSPAPER } from "../config/constants";

export enum NewspaperState {
  Flying = "Flying",
  Landed = "Landed",
  Hit = "Hit",
}

export interface Newspaper {
  x: number;
  y: number;
  speed: number;
  direction: "left" | "right";
  state: NewspaperState;
  stunDamage: number;
}

export function createNewspaper(
  x: number,
  y: number,
  direction: "left" | "right",
  isSunday: boolean,
): Newspaper {
  return {
    x,
    y,
    speed: isSunday
      ? NEWSPAPER.BASE_THROW_SPEED * NEWSPAPER.SUNDAY_SPEED_MULTIPLIER
      : NEWSPAPER.BASE_THROW_SPEED,
    direction,
    state: NewspaperState.Flying,
    stunDamage: NEWSPAPER.STUN_DAMAGE,
  };
}
