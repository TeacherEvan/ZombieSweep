import {
  NPC_PLACEHOLDER_TEXTURE_KEY,
  NpcFaction,
  NpcRole,
  NpcState,
} from "../entities/Npc";

export interface TextureLookup {
  exists(key: string): boolean;
}

export interface NpcSpriteTextureSource {
  faction: NpcFaction;
  role: NpcRole;
  state: NpcState;
  textureKey: string;
}

function normalizeTextureKey(textureKey: unknown): string {
  if (typeof textureKey !== "string") {
    return "";
  }

  return textureKey.trim();
}

function getLegacyCitizenTextureKey(state: NpcState): string {
  switch (state) {
    case NpcState.Flee:
      return "citizen-panicked";
    case NpcState.Defend:
      return "citizen-armed";
    default:
      return "citizen-friendly";
  }
}

function getLegacyZombieTextureKey(role: NpcRole): string {
  switch (role) {
    case NpcRole.Runner:
      return "zombie-runner";
    case NpcRole.Spitter:
      return "zombie-spitter";
    case NpcRole.Shambler:
    default:
      return "zombie-shambler";
  }
}

export function getFallbackNpcTextureKey(): string {
  return NPC_PLACEHOLDER_TEXTURE_KEY;
}

export function resolveNpcTextureKey(
  textureKey: string | null | undefined,
  textures?: TextureLookup,
): string {
  const normalized = normalizeTextureKey(textureKey);
  if (normalized.length === 0) {
    return NPC_PLACEHOLDER_TEXTURE_KEY;
  }

  if (textures && !textures.exists(normalized)) {
    return NPC_PLACEHOLDER_TEXTURE_KEY;
  }

  return normalized;
}

export function resolveNpcSpriteTextureKey(
  source: NpcSpriteTextureSource,
  textures?: TextureLookup,
): string {
  const directKey = resolveNpcTextureKey(source.textureKey, textures);
  if (directKey !== NPC_PLACEHOLDER_TEXTURE_KEY) {
    return directKey;
  }

  const legacyKey =
    source.faction === NpcFaction.Infected
      ? getLegacyZombieTextureKey(source.role)
      : getLegacyCitizenTextureKey(source.state);

  return resolveNpcTextureKey(legacyKey, textures);
}
