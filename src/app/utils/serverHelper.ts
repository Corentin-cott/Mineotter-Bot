import { OtterPocketBase } from "../../otterbots/utils/pocketbase/pocketbase";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { Server } from "../types/serverType";
import { ActiveServer } from "../types/activeServeurType";

export const SERVEURS_ALIAS = "get_servers";
export const ACTIVE_SERVERS_ALIAS = "get_active_servers";
export const DEPRECATED_MARKER = "depreciated";
export const ANTRE_BASE_URL = "https://antredesloutres.fr";
export const MANAGED_GAMES_WILDCARD = "*";

/**
 * Returns the list of games this bot manages, parsed from GAMES_MANAGED env.
 * - Unset or "*" → wildcard (no game filter).
 * - "Minecraft,Palworld" → array of lowercase names for case-insensitive matching.
 */
function getManagedGames(): typeof MANAGED_GAMES_WILDCARD | string[] {
    const raw = process.env.GAMES_MANAGED?.trim();
    if (!raw || raw === MANAGED_GAMES_WILDCARD) return MANAGED_GAMES_WILDCARD;
    return raw.split(",").map(g => g.trim().toLowerCase()).filter(Boolean);
}

/**
 * Returns the server's game name, read from the expanded `platform` relation.
 * Empty string when the relation isn't expanded or has no name.
 */
export function getServerGame(s: Server): string {
    return s.expand?.platform?.name ?? "";
}

/**
 * Tells whether the bot is allowed to handle a server based on its game,
 * driven by the GAMES_MANAGED environment variable.
 */
export function isGameManaged(s: Server): boolean {
    const managed = getManagedGames();
    if (managed === MANAGED_GAMES_WILDCARD) return true;
    const game = getServerGame(s);
    return !!game && managed.includes(game.toLowerCase());
}

/**
 * A server is startable if it has a real Docker container associated
 * (not empty, not flagged as deprecated).
 */
export function isStartable(s: Server): boolean {
    return !!s.container && s.container !== DEPRECATED_MARKER;
}

/**
 * Parses a "#RRGGBB" or "RRGGBB" hex color string into a numeric value
 * usable by discord.js EmbedBuilder.setColor().
 * Returns undefined when the input is missing or malformed.
 */
export function parseColor(hex: string | undefined): number | undefined {
    if (!hex) return undefined;
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
    return m ? parseInt(m[1], 16) : undefined;
}

/**
 * Resolves a server image field into a fully-qualified URL.
 * - Absolute URLs (http/https) are returned as-is.
 * - Relative paths starting with "/" are prefixed with the Antre des Loutres base URL.
 * - PocketBase filenames are resolved using PB_URL, collection 'servers', and record id.
 * - Anything else (empty, "NA", malformed) returns undefined.
 */
export function resolveImageUrl(image: string | undefined, recordId?: string): string | undefined {
    if (!image || image === "NA") return undefined;
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith("/")) return `${ANTRE_BASE_URL}${image}`;
    if (process.env.PB_URL && recordId && !image.includes("/")) {
        return `${process.env.PB_URL}/api/files/servers/${recordId}/${image}`;
    }
    return undefined;
}

/**
 * Fetches the server list from PocketBase and keeps only the games this bot
 * is allowed to manage (per GAMES_MANAGED env). Returns an empty array on
 * failure or when no data is returned.
 */
export async function fetchAllServeurs(): Promise<Server[]> {
    const data = await OtterPocketBase.execByAlias<Server[]>(SERVEURS_ALIAS);

    if (!Array.isArray(data)) {
        otterlogs.warn(`fetchAllServeurs: PocketBase n'a pas renvoyé de tableau pour "${SERVEURS_ALIAS}" (reçu: ${typeof data}). Vérifie PB_URL et la règle d'API List/View de la collection "servers".`);
        return [];
    }

    const filtered = data.filter(isGameManaged);

    if (data.length === 0) {
        otterlogs.warn(`fetchAllServeurs: la collection "servers" est vide (0 enregistrement renvoyé par PocketBase).`);
    } else if (filtered.length === 0) {
        const games = [...new Set(data.map(getServerGame))].join(", ");
        otterlogs.warn(`fetchAllServeurs: les ${data.length} serveur(s) ont tous été filtrés par GAMES_MANAGED="${process.env.GAMES_MANAGED}". Jeux présents en base (platform.name): [${games}].`);
    }

    return filtered;
}

/**
 * Fetches the server list and returns the one matching `id`,
 * or undefined if not found.
 */
export async function findServeurById(id: string): Promise<Server | undefined> {
    const servers = await fetchAllServeurs();
    return servers.find(s => s.id === id);
}

/**
 * Fetches the active-servers list (the one that carries RCON connection info)
 * and returns the entry whose `server` relation matches the given server id,
 * or undefined if not found.
 */
export async function findActiveServerForServeurId(
    serverId: string,
): Promise<ActiveServer | undefined> {
    const active = await OtterPocketBase.execByAlias<ActiveServer[]>(ACTIVE_SERVERS_ALIAS);
    if (!Array.isArray(active)) return undefined;
    return active.find(s => s.server === serverId);
}

/**
 * Parses Minecraft's `list` RCON response.
 * Example response: "There are 2 of a max of 20 players online: alice, bob"
 * Returns null when the format isn't recognised (e.g. non-Minecraft server).
 */
export function parseMinecraftPlayerList(
    raw: string | null,
): { online: number; max: number; players: string[] } | null {
    if (!raw) return null;
    const m = /There are (\d+) of a max of (\d+) players online:?\s*(.*)$/i.exec(raw.trim());
    if (!m) return null;
    const online = parseInt(m[1], 10);
    const max = parseInt(m[2], 10);
    const players = m[3]
        .split(",")
        .map(p => p.trim())
        .filter(Boolean);
    return { online, max, players };
}
