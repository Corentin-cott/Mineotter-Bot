import { OtterPocketBase } from "../../otterbots/utils/pocketbase/pocketbase";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { Server } from "../types/serverType";
import { ActiveServer } from "../types/activeServeurType";

export const SERVEURS_ALIAS = "get_servers";
export const ACTIVE_SERVERS_ALIAS = "get_active_servers";
export const DEPRECATED_MARKER = "depreciated";
export const ANTRE_BASE_URL = "https://antredesloutres.fr";
export const MANAGED_GAMES_WILDCARD = "*";
export const AUTOCOMPLETE_LIMIT = 25;
export const DEFAULT_EMBED_COLOR = 0x57F287;

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
export function isManagedGameName(name: string | undefined): boolean {
    const managed = getManagedGames();
    if (managed === MANAGED_GAMES_WILDCARD) return true;
    return !!name && managed.includes(name.toLowerCase());
}

export function isGameManaged(s: Server): boolean {
    return isManagedGameName(getServerGame(s));
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
        otterlogs.warn(`fetchAllServeurs: PocketBase did not return an array for "${SERVEURS_ALIAS}" (got: ${typeof data}). Check PB_URL and the List/View API rule of the "servers" collection.`);
        return [];
    }

    const filtered = data.filter(isGameManaged);

    if (data.length === 0) {
        otterlogs.warn(`fetchAllServeurs: the "servers" collection is empty (PocketBase returned 0 records).`);
    } else if (filtered.length === 0) {
        const games = [...new Set(data.map(getServerGame))].join(", ");
        otterlogs.warn(`fetchAllServeurs: all ${data.length} server(s) were filtered out by GAMES_MANAGED="${process.env.GAMES_MANAGED}". Games present in DB (platform.name): [${games}].`);
    }

    return filtered;
}

/**
 * Builds the discord.js autocomplete choices for a server list: keeps servers
 * whose name matches `focused`, caps the count, and labels each "Name (Game)".
 */
export function buildServerChoices(
    servers: Server[],
    focused: string,
): { name: string; value: string }[] {
    const query = focused.toLowerCase();
    return servers
        .filter(s => s.name.toLowerCase().includes(query))
        .slice(0, AUTOCOMPLETE_LIMIT)
        .map(s => ({ name: `${s.name} (${getServerGame(s)})`, value: s.id }));
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
 * Fetches the active-servers list (the one that carries RCON connection info).
 * Returns an empty array on failure or when no data is returned.
 */
export async function fetchAllActiveServers(): Promise<ActiveServer[]> {
    const data = await OtterPocketBase.execByAlias<ActiveServer[]>(ACTIVE_SERVERS_ALIAS);
    return Array.isArray(data) ? data : [];
}

/**
 * Returns the active-server entry whose `server` relation matches the given
 * server id, or undefined if not found.
 */
export async function findActiveServerForServeurId(
    serverId: string,
): Promise<ActiveServer | undefined> {
    const active = await fetchAllActiveServers();
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
