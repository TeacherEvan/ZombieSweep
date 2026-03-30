export enum PickupType {
  NewspaperBundle = "NewspaperBundle",
  AmmoCrate = "AmmoCrate",
  HealthKit = "HealthKit",
}

const PICKUP_QUANTITIES: Record<PickupType, number> = {
  [PickupType.NewspaperBundle]: 5,
  [PickupType.AmmoCrate]: 5,
  [PickupType.HealthKit]: 1,
};

export interface Pickup {
  type: PickupType;
  x: number;
  y: number;
  quantity: number;
  collected: boolean;
  collect(): void;
}

export function createPickup(x: number, y: number, type: PickupType): Pickup {
  return {
    type,
    x,
    y,
    quantity: PICKUP_QUANTITIES[type],
    collected: false,
    collect() {
      this.collected = true;
    },
  };
}
