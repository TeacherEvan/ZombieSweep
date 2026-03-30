export enum Difficulty {
  EasyStreet = "EasyStreet",
  MiddleRoad = "MiddleRoad",
  HardWay = "HardWay",
}

export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 1,
  [Difficulty.MiddleRoad]: 2,
  [Difficulty.HardWay]: 3,
};

export const DIFFICULTY_ZOMBIE_DENSITY: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 0.3,
  [Difficulty.MiddleRoad]: 0.6,
  [Difficulty.HardWay]: 1.0,
};

export const DIFFICULTY_OBSTACLE_FREQUENCY: Record<Difficulty, number> = {
  [Difficulty.EasyStreet]: 0.2,
  [Difficulty.MiddleRoad]: 0.5,
  [Difficulty.HardWay]: 0.9,
};
