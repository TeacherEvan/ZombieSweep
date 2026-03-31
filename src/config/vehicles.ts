export enum VehicleType {
  Bicycle = "Bicycle",
  RollerBlades = "RollerBlades",
  Skateboard = "Skateboard",
}

export enum WeaponSlot {
  Melee = "Melee",
  Ranged = "Ranged",
}

export interface WeaponConfig {
  name: string;
  damage: number;
  speed: number;
  range: number;
  knockback: number;
  ammoPerPickup: number;
  piercing: boolean;
  spread: boolean;
}

export interface VehicleConfig {
  speed: number;
  handling: number;
  stability: number;
  canOllie: boolean;
  weapons: Record<WeaponSlot, WeaponConfig>;
}

export const VEHICLE_STATS: Record<VehicleType, VehicleConfig> = {
  [VehicleType.Bicycle]: {
    speed: 5,
    handling: 2,
    stability: 3,
    canOllie: false,
    weapons: {
      [WeaponSlot.Melee]: {
        name: "Baseball Bat",
        damage: 3,
        speed: 2,
        range: 2,
        knockback: 3,
        ammoPerPickup: 0,
        piercing: false,
        spread: false,
      },
      [WeaponSlot.Ranged]: {
        name: "Slingshot",
        damage: 1,
        speed: 6,
        range: 8,
        knockback: 1,
        ammoPerPickup: 10,
        piercing: false,
        spread: false,
      },
    },
  },
  [VehicleType.RollerBlades]: {
    speed: 7,
    handling: 1,
    stability: 1,
    canOllie: false,
    weapons: {
      [WeaponSlot.Melee]: {
        name: "Hockey Stick",
        damage: 3,
        speed: 3,
        range: 2,
        knockback: 2,
        ammoPerPickup: 0,
        piercing: false,
        spread: false,
      },
      [WeaponSlot.Ranged]: {
        name: "Crossbow",
        damage: 4,
        speed: 2,
        range: 10,
        knockback: 2,
        ammoPerPickup: 6,
        piercing: true,
        spread: false,
      },
    },
  },
  [VehicleType.Skateboard]: {
    speed: 4,
    handling: 3,
    stability: 2,
    canOllie: true,
    weapons: {
      [WeaponSlot.Melee]: {
        name: "Machete",
        damage: 5,
        speed: 4,
        range: 1,
        knockback: 1,
        ammoPerPickup: 0,
        piercing: false,
        spread: false,
      },
      [WeaponSlot.Ranged]: {
        name: "Shotgun",
        damage: 7,
        speed: 1,
        range: 4,
        knockback: 4,
        ammoPerPickup: 3,
        piercing: false,
        spread: true,
      },
    },
  },
};
