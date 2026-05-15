import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { docker } from "../utils/dockerClient";
import { applyBotBranding } from "../utils/embedBranding";
import { rconHelper } from "../utils/rconHelper";
import {
    fetchAllServeurs,
    findActiveServerForServeurId,
    findServeurById,
    isStartable,
    parseColor,
    parseMinecraftPlayerList,
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
        doesNotExist: (id: number) =>
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
        modpackLink: (name: string, url: string) => `[${name}](${url})`,
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
    autocompleteLabel: (name: string, game: string) => `${name} (${game})`,
} as const;

const DEFAULT_EMBED_COLOR = 0x57F287;
const AUTOCOMPLETE_LIMIT = 25;
const MINECRAFT_GAME = "Minecraft";
const RCON_TIMEOUT_MS = 5000;

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
        const focused = interaction.options.getFocused().toLowerCase();
        const servers = await fetchAllServeurs();

        const choices = servers
            .filter(s => s.nom.toLowerCase().includes(focused))
            .slice(0, AUTOCOMPLETE_LIMIT)
            .map(s => ({
                name: STRINGS.autocompleteLabel(s.nom, s.jeu),
                value: s.id.toString(),
            }));

        await interaction.respond(choices);
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId = parseInt(interaction.options.getString(STRINGS.option.name, true), 10);

        await interaction.deferReply();

        const target = await findServeurById(serverId);
        if (!target) {
            await interaction.editReply(STRINGS.replies.doesNotExist(serverId));
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(STRINGS.embed.title(target.nom))
            .setColor(parseColor(target.embed_color) ?? DEFAULT_EMBED_COLOR)
            .setTimestamp()
            .addFields(
                { name: STRINGS.embed.fieldGame, value: target.jeu || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldVersion, value: target.version || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldModpack, value: formatModpack(target.modpack, target.modpack_url), inline: true },
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
                const info = await docker.getContainer(target.contenaire).inspect();
                isRunning = info.State.Running;
                embed.addFields({
                    name: STRINGS.embed.fieldStatus,
                    value: isRunning
                        ? STRINGS.embed.statusRunning(info.State.Status)
                        : STRINGS.embed.statusStopped(info.State.Status),
                    inline: true,
                });
            } catch (err) {
                otterlogs.error(STRINGS.logs.inspectFailed(target.contenaire, err));
                embed.addFields({ name: STRINGS.embed.fieldStatus, value: STRINGS.embed.statusUnknown, inline: true });
            }
        }

        // ─── Players via RCON (only for running Minecraft servers) ──────
        if (isRunning) {
            const playersField = await buildPlayersField(target.id, target.jeu);
            embed.addFields(playersField);
        }

        await interaction.editReply({ embeds: [embed] });
    },
};

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
    serveurId: number,
    jeu: string,
): Promise<{ name: string; value: string }> {
    if (jeu !== MINECRAFT_GAME) {
        return { name: STRINGS.embed.fieldPlayers(0, 0), value: STRINGS.embed.playersNotMinecraft };
    }

    const active = await findActiveServerForServeurId(serveurId);
    const password = process.env.RCON_PASSWORD;
    const port = active ? parseInt(active.rcon_port || "0", 10) : 0;

    if (!active || !active.rcon_host || !port || !password) {
        return { name: STRINGS.embed.fieldPlayers(0, 0), value: STRINGS.embed.playersNoRconConfig };
    }

    let raw: string | null;
    try {
        raw = await rconHelper.sendCommand(
            { host: active.rcon_host, port, password, timeout: RCON_TIMEOUT_MS },
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
