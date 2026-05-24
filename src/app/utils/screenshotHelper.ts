import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { OtterPocketBase } from "../../otterbots/utils/pocketbase/pocketbase";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { AUTOCOMPLETE_LIMIT, isManagedGameName } from "./serverHelper";
import { Platform } from "../types/serverType";

export const PLATFORMS_ALIAS = "get_platforms";
export const SCREENSHOTS_COLLECTION = "player_screenshots";
export const DISCORD_USERS_COLLECTION = "discord_users";

export const MODERATION_SALON_ALIAS = "moderator-only";

export const PENDING_EMOJI = "⏳";
export const VALIDATED_EMOJI = "✅";
export const REFUSED_EMOJI = "❌";

export const VALIDATE_PREFIX = "ss_ok";
export const REFUSE_PREFIX = "ss_no";
const CUSTOM_ID_SEP = ":";

export const PENDING_COLOR = 0xFEE75C;
export const VALIDATED_COLOR = 0x57F287;
export const REFUSED_COLOR = 0xED4245;

export async function fetchAllPlatforms(): Promise<Platform[]> {
    const data = await OtterPocketBase.execByAlias<Platform[]>(PLATFORMS_ALIAS);
    if (!Array.isArray(data)) return [];
    return data.filter(p => isManagedGameName(p.name));
}

export async function findPlatformById(id: string): Promise<Platform | undefined> {
    const platforms = await fetchAllPlatforms();
    return platforms.find(p => p.id === id);
}

export function buildPlatformChoices(
    platforms: Platform[],
    focused: string,
): { name: string; value: string }[] {
    const query = focused.toLowerCase();
    return platforms
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, AUTOCOMPLETE_LIMIT)
        .map(p => ({ name: p.name, value: p.id }));
}

export async function findDiscordUserRecordId(discordId: string): Promise<string | undefined> {
    try {
        const pb = await OtterPocketBase.getClient();
        const record = await pb
            .collection(DISCORD_USERS_COLLECTION)
            .getFirstListItem(`discord_id="${discordId}"`);
        return record.id;
    } catch (error) {
        otterlogs.warn(`screenshot: no discord_users record for discord_id=${discordId}: ${error}`);
        return undefined;
    }
}

export interface ScreenshotData {
    name: string;
    serverId: string;
    platformId: string;
    discordUserRecordId: string | undefined;
    imageUrl: string;
}

function extensionFromContentType(contentType: string): string {
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("webp")) return "webp";
    return "png";
}

export async function createScreenshotRecord(data: ScreenshotData): Promise<void> {
    const pb = await OtterPocketBase.getClient();

    const response = await fetch(data.imageUrl);
    if (!response.ok) {
        throw new Error(`Image download failed (HTTP ${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ?? "image/png";
    const blob = new Blob([arrayBuffer], { type: contentType });
    const filename = `screenshot_${Date.now()}.${extensionFromContentType(contentType)}`;

    const form = new FormData();
    form.append("name", data.name);
    form.append("server", data.serverId);
    form.append("platform", data.platformId);
    if (data.discordUserRecordId) {
        form.append("discord_users", data.discordUserRecordId);
    }
    form.append("is_in_carousel", "false");
    form.append("screenshot", blob, filename);

    await pb.collection(SCREENSHOTS_COLLECTION).create(form);
}

export function buildValidateCustomId(
    serverId: string,
    platformId: string,
    authorId: string,
): string {
    return [VALIDATE_PREFIX, serverId, platformId, authorId].join(CUSTOM_ID_SEP);
}

export function buildRefuseCustomId(): string {
    return REFUSE_PREFIX;
}

export type ParsedCustomId =
    | { action: "validate"; serverId: string; platformId: string; authorId: string }
    | { action: "refuse" }
    | undefined;

export function parseCustomId(customId: string): ParsedCustomId {
    const parts = customId.split(CUSTOM_ID_SEP);

    if (parts[0] === VALIDATE_PREFIX && parts.length === 4) {
        return { action: "validate", serverId: parts[1], platformId: parts[2], authorId: parts[3] };
    }

    if (parts[0] === REFUSE_PREFIX && parts.length === 1) {
        return { action: "refuse" };
    }

    return undefined;
}

export interface MessageRef {
    channelId: string;
    messageId: string;
}

export function parseMessageRef(url: string | null | undefined): MessageRef | undefined {
    if (!url) return undefined;
    const match = /channels\/\d+\/(\d+)\/(\d+)/.exec(url);
    if (!match) return undefined;
    return { channelId: match[1], messageId: match[2] };
}

export async function updateSubmissionStatus(
    client: Client,
    ref: MessageRef,
    emoji: string,
    footerText: string,
): Promise<void> {
    const channel = await client.channels.fetch(ref.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const message = await (channel as TextChannel).messages.fetch(ref.messageId).catch(() => null);
    if (!message) return;

    const pending = message.reactions.cache.get(PENDING_EMOJI);
    if (pending && client.user) {
        await pending.users.remove(client.user.id).catch(() => undefined);
    }
    await message.react(emoji).catch(() => undefined);

    const current = message.embeds[0];
    if (current) {
        const updated = EmbedBuilder.from(current).setFooter({ text: footerText });
        await message.edit({ embeds: [updated] }).catch(() => undefined);
    }
}
