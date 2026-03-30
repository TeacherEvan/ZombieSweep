import { HAZARD } from "../config/constants";

export enum HazardType {
  Hole = "Hole",
  Log = "Log",
  IcePatch = "IcePatch",
}

export interface BaseHazard {
  type: HazardType;
  x: number;
  y: number;
  isLethal: boolean;
  tileWidth: number;
  tileHeight: number;
}

export interface HoleHazard extends BaseHazard {
  type: HazardType.Hole;
  canOllieOver: boolean;
}

export interface LogHazard extends BaseHazard {
  type: HazardType.Log;
  destructible: boolean;
  widthPercent: number;
}

export interface IcePatchHazard extends BaseHazard {
  type: HazardType.IcePatch;
  slideDuration: number;
}

export type Hazard = HoleHazard | LogHazard | IcePatchHazard;

export function createHole(x: number, y: number): HoleHazard {
  return {
    type: HazardType.Hole,
    x,
    y,
    isLethal: true,
    tileWidth: 2,
    tileHeight: 2,
    canOllieOver: true,
  };
}

export function createLog(x: number, y: number): LogHazard {
  return {
    type: HazardType.Log,
    x,
    y,
    isLethal: true,
    tileWidth: 6,
    tileHeight: 1,
    destructible: false,
    widthPercent: HAZARD.LOG_WIDTH_PERCENT,
  };
}

export function createIcePatch(x: number, y: number): IcePatchHazard {
  return {
    type: HazardType.IcePatch,
    x,
    y,
    isLethal: false,
    tileWidth: 3,
    tileHeight: 3,
    slideDuration: HAZARD.ICE_SLIDE_DURATION,
  };
}
