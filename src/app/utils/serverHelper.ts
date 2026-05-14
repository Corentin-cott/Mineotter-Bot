import { Otterlyapi } from "../../otterbots/utils/otterlyapi/otterlyapi";
import { Serveur } from "../types/serveurType";

export const SERVEURS_ALIAS = "otr-serveurs";
export const DEPRECATED_MARKER = "depreciated";
export const ANTRE_BASE_URL = "https://antredesloutres.fr";

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
 * Fetches the full server list from Otterlyapi.
 * Returns an empty array if the call fails or yields no data.
 */
export async function fetchAllServeurs(): Promise<Serveur[]> {
    const data = await Otterlyapi.getDataByAlias<Serveur[]>(SERVEURS_ALIAS);
    return Array.isArray(data) ? data : [];
}

/**
 * Fetches the server list and returns the one matching `id`,
 * or undefined if not found.
 */
export async function findServeurById(id: number): Promise<Serveur | undefined> {
    const servers = await fetchAllServeurs();
    return servers.find(s => s.id === id);
}
