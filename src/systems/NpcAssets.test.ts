import { describe, expect, it } from "vitest";
import {
  NPC_PLACEHOLDER_TEXTURE_KEY,
  NpcFaction,
  NpcRole,
  NpcState,
} from "../entities/Npc";
import { resolveNpcSpriteTextureKey, resolveNpcTextureKey } from "./NpcAssets";

describe("NpcAssets", () => {
  it("falls back to the placeholder when a texture key is missing", () => {
    const key = resolveNpcTextureKey("", {
      exists: () => false,
    });

    expect(key).toBe(NPC_PLACEHOLDER_TEXTURE_KEY);
  });

  it("keeps a valid direct texture key when it exists", () => {
    const key = resolveNpcTextureKey("npc-porch-watcher", {
      exists: (candidate: string) => candidate === "npc-porch-watcher",
    });

    expect(key).toBe("npc-porch-watcher");
  });

  it("resolves a legacy citizen texture when specific NPC art is missing", () => {
    const key = resolveNpcSpriteTextureKey(
      {
        faction: NpcFaction.Survivor,
        role: NpcRole.Civilian,
        state: NpcState.Idle,
        textureKey: "npc-porch-watcher",
      },
      {
        exists: (candidate: string) => candidate === "citizen-friendly",
      },
    );

    expect(key).toBe("citizen-friendly");
  });

  it("falls back to the placeholder when neither new nor legacy art exists", () => {
    const key = resolveNpcSpriteTextureKey(
      {
        faction: NpcFaction.Infected,
        role: NpcRole.Shambler,
        state: NpcState.Infected,
        textureKey: "npc-infected-shambler",
      },
      {
        exists: () => false,
      },
    );

    expect(key).toBe(NPC_PLACEHOLDER_TEXTURE_KEY);
  });
});
