import { Otterlyapi } from "../../otterbots/utils/otterlyapi/otterlyapi";
import { Serveur } from "../types/serveurType";

export const SERVEURS_ALIAS = "otr-serveurs";
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
 * Tells whether the bot is allowed to handle a server based on its game,
 * driven by the GAMES_MANAGED environment variable.
 */
export function isGameManaged(s: Serveur): boolean {
    const managed = getManagedGames();
    if (managed === MANAGED_GAMES_WILDCARD) return true;
    return managed.includes(s.jeu.toLowerCase());
}

/**
 * A server is startable if it has a real Docker container associated
 * (not empty, not flagged as deprecated in Otterlyapi).
 */
export function isStartable(s: Serveur): boolean {
    return !!s.contenaire && s.contenaire !== DEPRECATED_MARKER;
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
 * - Anything else (empty, "NA", malformed) returns undefined.
 */
export function resolveImageUrl(image: string | undefined): string | undefined {
    if (!image) return undefined;
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith("/")) return `${ANTRE_BASE_URL}${image}`;
    return undefined;
}

/**
 * Fetches the server list from Otterlyapi and keeps only the games this bot
 * is allowed to manage (per GAMES_MANAGED env). Returns an empty array on
 * failure or when no data is returned.
 */
export async function fetchAllServeurs(): Promise<Serveur[]> {
    const data = await Otterlyapi.getDataByAlias<Serveur[]>(SERVEURS_ALIAS);
    return Array.isArray(data) ? data.filter(isGameManaged) : [];
}

/**
 * Fetches the server list and returns the one matching `id`,
 * or undefined if not found.
 */
export async function findServeurById(id: number): Promise<Serveur | undefined> {
    const servers = await fetchAllServeurs();
    return servers.find(s => s.id === id);
}
