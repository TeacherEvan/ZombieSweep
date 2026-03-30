import { WeaponConfig } from "../config/vehicles";

export interface MeleeWeapon {
  name: string;
  type: "melee";
  damage: number;
  speed: number;
  range: number;
  knockback: number;
  attack(): number;
}

export interface RangedWeapon {
  name: string;
  type: "ranged";
  damage: number;
  speed: number;
  range: number;
  knockback: number;
  ammo: number;
  piercing: boolean;
  spread: boolean;
  fire(): number;
  addAmmo(amount: number): void;
}

export function createMeleeWeapon(config: WeaponConfig): MeleeWeapon {
  return {
    name: config.name,
    type: "melee",
    damage: config.damage,
    speed: config.speed,
    range: config.range,
    knockback: config.knockback,
    attack() {
      return this.damage;
    },
  };
}

export function createRangedWeapon(config: WeaponConfig): RangedWeapon {
  return {
    name: config.name,
    type: "ranged",
    damage: config.damage,
    speed: config.speed,
    range: config.range,
    knockback: config.knockback,
    ammo: config.ammoPerPickup,
    piercing: config.piercing,
    spread: config.spread,
    fire() {
      if (this.ammo <= 0) return 0;
      this.ammo--;
      return this.damage;
    },
    addAmmo(amount: number) {
      this.ammo += amount;
    },
  };
}
