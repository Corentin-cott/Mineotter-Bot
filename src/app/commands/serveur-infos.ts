import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { docker } from "../utils/dockerClient";
import { applyBotBranding } from "../utils/embedBranding";
import { rconHelper, RCON_TIMEOUT_MS } from "../utils/rconHelper";
import { ActiveServer } from "../types/activeServeurType";
import {
    ANTRE_BASE_URL,
    buildServerChoices,
    DEFAULT_EMBED_COLOR,
    fetchAllServeurs,
    findActiveServerForServeurId,
    findServeurById,
    getServerGame,
    isStartable,
    parseColor,
    parseMinecraftPlayerList,
    resolveImageUrl,
} from "../utils/serverHelper";

const STRINGS = {
    command: {
        name: "serveur-infos",
        description: "Afficher les informations d'un serveur (actif ou non).",
    },
    option: {
        name: "serveur",
        description: "Le serveur dont on veut les informations",
    },
    replies: {
        doesNotExist: (id: string) =>
            `Le serveur \`${id}\` n'existe pas. Merci de contacter un administrateur et de lui donner le code suivant : \`404-${id}\``,
    },
    logs: {
        inspectFailed: (container: string, err: unknown) =>
            `Docker inspect failed for '${container}': ${err}`,
        rconFailed: (host: string, err: unknown) =>
            `RCON list failed for '${host}': ${err}`,
    },
    embed: {
        title: (name: string) => `Informations : ${name}`,
        fieldGame: "Jeu",
        fieldVersion: "Version",
        fieldModpack: "Modpack",
        fieldStatus: "État",
        fieldWebPage: "Page web",
        fieldIp: "IP",
        ipUnavailable: "Non accessible",
        modpackLink: (name: string, url: string) => `[${name}](${url})`,
        webPageLink: (url: string) => `[Voir la page](${url})`,
        fieldPlayers: (online: number, max: number) => `Joueurs en ligne (${online}/${max})`,
        emptyValue: "—",
        statusNoContainer: "Non démarrable",
        statusRunning: (status: string) => `🟢 En cours d'exécution (\`${status}\`)`,
        statusStopped: (status: string) => `🔴 Arrêté (\`${status}\`)`,
        statusUnknown: "❓ État inconnu",
        playersNobody: "Personne en ligne.",
        playersUnavailable: "Impossible de récupérer la liste des joueurs (RCON injoignable).",
        playersNoRconConfig: "Pas de configuration RCON pour ce serveur.",
        playersNotMinecraft: "Liste des joueurs non disponible pour ce jeu via RCON.",
    },
} as const;

const MINECRAFT_GAME = "Minecraft";

export default {
    data: new SlashCommandBuilder()
        .setName(STRINGS.command.name)
        .setDescription(STRINGS.command.description)
        .addStringOption(option =>
            option.setName(STRINGS.option.name)
                .setDescription(STRINGS.option.description)
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction: AutocompleteInteraction) {
        const servers = await fetchAllServeurs();
        await interaction.respond(buildServerChoices(servers, interaction.options.getFocused()));
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId = interaction.options.getString(STRINGS.option.name, true);

        await interaction.deferReply();

        const target = await findServeurById(serverId);
        if (!target) {
            await interaction.editReply(STRINGS.replies.doesNotExist(serverId));
            return;
        }

        const active = await findActiveServerForServeurId(target.id);
        const game = getServerGame(target);
        const ipValue = active?.host ? `\`${active.host}\`` : STRINGS.embed.ipUnavailable;

        const embed = new EmbedBuilder()
            .setTitle(STRINGS.embed.title(target.name))
            .setColor(parseColor(target.embed_color) ?? DEFAULT_EMBED_COLOR)
            .setThumbnail(resolveImageUrl(target.image, target.id) ?? null)
            .setTimestamp()
            .addFields(
                { name: STRINGS.embed.fieldGame, value: game || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldVersion, value: target.version || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldModpack, value: formatModpack(target.modpack, target.modpack_url), inline: true },
                { name: STRINGS.embed.fieldIp, value: ipValue, inline: true },
                { name: STRINGS.embed.fieldWebPage, value: STRINGS.embed.webPageLink(buildWebPageUrl(game, target.name)), inline: true },
            );

        if (target.description && target.description !== "NA") {
            embed.setDescription(target.description);
        }

        applyBotBranding(embed, interaction);

        // ─── Container state ────────────────────────────────────────────
        let isRunning = false;

        if (!isStartable(target)) {
            embed.addFields({ name: STRINGS.embed.fieldStatus, value: STRINGS.embed.statusNoContainer, inline: true });
        } else {
            try {
                const info = await docker.getContainer(target.container).inspect();
                isRunning = info.State.Running;
                embed.addFields({
                    name: STRINGS.embed.fieldStatus,
                    value: isRunning
                        ? STRINGS.embed.statusRunning(info.State.Status)
                        : STRINGS.embed.statusStopped(info.State.Status),
                    inline: true,
                });
            } catch (err) {
                otterlogs.error(STRINGS.logs.inspectFailed(target.container, err));
                embed.addFields({ name: STRINGS.embed.fieldStatus, value: STRINGS.embed.statusUnknown, inline: true });
            }
        }

        // ─── Players via RCON (only for running Minecraft servers) ──────
        if (isRunning) {
            const playersField = await buildPlayersField(active, game);
            embed.addFields(playersField);
        }

        await interaction.editReply({ embeds: [embed] });
    },
};

/**
 * Slugifies a string for use in URLs: lowercases, strips accents, replaces
 * runs of non-alphanumerics with a single underscore, trims edges.
 * "La Vanilla" → "la_vanilla", "Cobblemon Loutre Monde S2" → "cobblemon_loutre_monde_s2".
 */
function slugify(input: string): string {
    return input
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

/**
 * Builds the antredesloutres.fr page URL for a given server, of the form:
 *   <ANTRE_BASE_URL>/serveurs/<jeu>/<nom>/
 */
function buildWebPageUrl(jeu: string, nom: string): string {
    return `${ANTRE_BASE_URL}/serveurs/${slugify(jeu)}/${slugify(nom)}/`;
}

/**
 * Renders the modpack field value. When a usable URL is provided, wraps the
 * modpack name as a Markdown hyperlink. Falls back to plain text otherwise.
 */
function formatModpack(name: string, rawUrl: string): string {
    if (!name) return STRINGS.embed.emptyValue;
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : undefined;
    return url ? STRINGS.embed.modpackLink(name, url) : name;
}

/**
 * Returns an embed field describing the online players of a running server.
 * Each branch returns a self-contained { name, value } so the caller can
 * just push it to the embed.
 */
async function buildPlayersField(
    active: ActiveServer | undefined,
    jeu: string,
): Promise<{ name: string; value: string }> {
    if (jeu.toLowerCase() !== MINECRAFT_GAME.toLowerCase()) {
        return { name: STRINGS.embed.fieldPlayers(0, 0), value: STRINGS.embed.playersNotMinecraft };
    }

    const port = active ? parseInt(active.rcon_port || "0", 10) : 0;

    if (!active || !active.rcon_host || !port) {
        return { name: STRINGS.embed.fieldPlayers(0, 0), value: STRINGS.embed.playersNoRconConfig };
    }

    let raw: string | null;
    try {
        raw = await rconHelper.sendCommand(
            { host: active.rcon_host, port, password: active.rcon_password, timeout: RCON_TIMEOUT_MS },
            "list",
        );
    } catch (err) {
        otterlogs.error(STRINGS.logs.rconFailed(active.rcon_host, err));
        return { name: STRINGS.embed.fieldPlayers(0, 0), value: STRINGS.embed.playersUnavailable };
    }

    const parsed = parseMinecraftPlayerList(raw);
    if (!parsed) {
        return { name: STRINGS.embed.fieldPlayers(0, 0), value: STRINGS.embed.playersUnavailable };
    }

    const value = parsed.players.length === 0
        ? STRINGS.embed.playersNobody
        : parsed.players.map(p => `• ${p}`).join("\n");

    return { name: STRINGS.embed.fieldPlayers(parsed.online, parsed.max), value };
}
