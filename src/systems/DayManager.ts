import { NEWSPAPER } from "../config/constants";

export enum DayOfWeek {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

export enum MapName {
  MapleGrove = "MapleGrove",
  DowntownDeadwood = "DowntownDeadwood",
  RustCreek = "RustCreek",
}

const DAY_TO_WEEKDAY: Record<number, DayOfWeek> = {
  1: DayOfWeek.Monday,
  2: DayOfWeek.Tuesday,
  3: DayOfWeek.Wednesday,
  4: DayOfWeek.Thursday,
  5: DayOfWeek.Friday,
  6: DayOfWeek.Saturday,
  7: DayOfWeek.Sunday,
};

const DAY_TO_MAP: Record<number, MapName> = {
  1: MapName.MapleGrove,
  2: MapName.MapleGrove,
  3: MapName.DowntownDeadwood,
  4: MapName.DowntownDeadwood,
  5: MapName.DowntownDeadwood,
  6: MapName.RustCreek,
  7: MapName.RustCreek,
};

export class DayManager {
  getDayOfWeek(day: number): DayOfWeek {
    return (
      DAY_TO_WEEKDAY[day] ??
      DAY_TO_WEEKDAY[((day - 1) % 7) + 1] ??
      DayOfWeek.Monday
    );
  }

  getMapForDay(day: number): MapName {
    return DAY_TO_MAP[day] ?? DAY_TO_MAP[Math.min(day, 7)] ?? MapName.RustCreek;
  }

  isSunday(day: number): boolean {
    return day === 7;
  }

  getThrowSpeedMultiplier(day: number): number {
    return this.isSunday(day) ? NEWSPAPER.SUNDAY_SPEED_MULTIPLIER : 1.0;
  }

  getZombieDensityScale(day: number): number {
    return 0.5 + (day - 1) * 0.15;
  }
}
