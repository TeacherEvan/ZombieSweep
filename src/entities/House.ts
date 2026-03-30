import { HOUSE_DAMAGE_POINTS } from "../config/constants";

export enum HouseType {
  Ranch = "Ranch",
  Colonial = "Colonial",
  Victorian = "Victorian",
}

export enum DeliveryDifficulty {
  Easy = "Easy",
  Medium = "Medium",
  Hard = "Hard",
}

export interface Breakable {
  name: string;
  points: number;
}

export interface House {
  type: HouseType;
  isSubscriber: boolean;
  porchDifficulty: DeliveryDifficulty;
  breakables: Breakable[];
  delivered: boolean;
  damaged: boolean;
  markDelivered(): void;
  markDamaged(): void;
}

function createHouse(
  type: HouseType,
  isSubscriber: boolean,
  porchDifficulty: DeliveryDifficulty,
  breakables: Breakable[],
): House {
  return {
    type,
    isSubscriber,
    porchDifficulty,
    breakables,
    delivered: false,
    damaged: false,
    markDelivered() {
      this.delivered = true;
    },
    markDamaged() {
      this.damaged = true;
    },
  };
}

export function createRanchHouse(isSubscriber: boolean): House {
  return createHouse(HouseType.Ranch, isSubscriber, DeliveryDifficulty.Easy, [
    { name: "window", points: HOUSE_DAMAGE_POINTS.RANCH_WINDOW },
    { name: "garden gnome", points: HOUSE_DAMAGE_POINTS.RANCH_GNOME },
    { name: "fence", points: HOUSE_DAMAGE_POINTS.RANCH_FENCE },
  ]);
}

export function createColonialHouse(isSubscriber: boolean): House {
  return createHouse(
    HouseType.Colonial,
    isSubscriber,
    DeliveryDifficulty.Medium,
    [
      {
        name: "upper window",
        points: HOUSE_DAMAGE_POINTS.COLONIAL_UPPER_WINDOW,
      },
      {
        name: "lower window",
        points: HOUSE_DAMAGE_POINTS.COLONIAL_LOWER_WINDOW,
      },
      {
        name: "porch furniture",
        points: HOUSE_DAMAGE_POINTS.COLONIAL_PORCH_FURNITURE,
      },
    ],
  );
}

export function createVictorianHouse(isSubscriber: boolean): House {
  return createHouse(
    HouseType.Victorian,
    isSubscriber,
    DeliveryDifficulty.Hard,
    [
      {
        name: "stained glass",
        points: HOUSE_DAMAGE_POINTS.VICTORIAN_STAINED_GLASS,
      },
      { name: "tombstone", points: HOUSE_DAMAGE_POINTS.VICTORIAN_TOMBSTONE },
      {
        name: "porch railing",
        points: HOUSE_DAMAGE_POINTS.VICTORIAN_PORCH_RAILING,
      },
    ],
  );
}
