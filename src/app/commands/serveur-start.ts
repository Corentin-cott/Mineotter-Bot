import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { docker } from "../utils/dockerClient";
import { applyBotBranding } from "../utils/embedBranding";
import {
    fetchAllServeurs,
    findServeurById,
    getServerGame,
    isStartable,
    parseColor,
    resolveImageUrl,
} from "../utils/serverHelper";

const STRINGS = {
    command: {
        name: "serveur-start",
        description: "Démarrer un serveur Minecraft.",
    },
    option: {
        name: "serveur",
        description: "Le serveur à démarrer",
    },
    replies: {
        doesNotExist: (id: string) => `Le serveur \`${id}\` n'existe pas. Merci de contacter un administrateur et de lui donner le code suivant : \`404-${id}\``,
        noContainer: (name: string) => `Le serveur **${name}** n'est pas démarrable. Merci de contacter un administrateur et de lui donner le code suivant : \`404-${name}\``,
        inspectFailed: (container: string) =>
            `Impossible d'inspecter le serveur. Merci de contactez un administrateur et donnez-lui le code suivant : \`500-${container}\``,
        alreadyRunning: (name: string) =>
            `Le serveur **${name}** tourne déjà, c'est pas génial ça ?`,
        startFailed: (container: string) =>
            `Échec du démarrage du serveur. Merci de contactez un administrateur et donnez-lui le code suivant : \`500-${container}\``,
    },
    logs: {
        inspectFailed: (container: string, err: unknown) =>
            `Docker inspect failed for '${container}': ${err}`,
        startFailed: (container: string, err: unknown) =>
            `Docker start failed for '${container}': ${err}`,
        started: (container: string, user: string) =>
            `Container '${container}' started by ${user}`,
    },
    embed: {
        title: (name: string) => `Démarrage : ${name}`,
        description: (name: string) => `Le serveur **${name}** est en cours de démarrage.`,
        fieldGame: "Jeu",
        fieldVersion: "Version",
        fieldModpack: "Modpack",
        emptyValue: "—",
    },
    autocompleteLabel: (name: string, game: string) => `${name} (${game})`,
} as const;

const DEFAULT_EMBED_COLOR = 0x57F287;
const AUTOCOMPLETE_LIMIT = 25;

export default {
    data: new SlashCommandBuilder()
        .setName(STRINGS.command.name)
        .setDescription(STRINGS.command.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
            .filter(isStartable)
            .filter(s => s.name.toLowerCase().includes(focused))
            .slice(0, AUTOCOMPLETE_LIMIT)
            .map(s => ({
                name: STRINGS.autocompleteLabel(s.name, getServerGame(s)),
                value: s.id.toString(),
            }));

        await interaction.respond(choices);
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId = interaction.options.getString(STRINGS.option.name, true);

        await interaction.deferReply();

        const target = await findServeurById(serverId);

        if (!target) {
            await interaction.editReply(STRINGS.replies.doesNotExist(serverId));
            return;
        }

        if (!isStartable(target)) {
            await interaction.editReply(STRINGS.replies.noContainer(target.name));
            return;
        }

        const container = docker.getContainer(target.container);

        let running: boolean;
        try {
            const info = await container.inspect();
            running = info.State.Running;
        } catch (err) {
            otterlogs.error(STRINGS.logs.inspectFailed(target.container, err));
            await interaction.editReply(STRINGS.replies.inspectFailed(target.container));
            return;
        }

        if (running) {
            await interaction.editReply(STRINGS.replies.alreadyRunning(target.name));
            return;
        }

        try {
            await container.start();
        } catch (err) {
            otterlogs.error(STRINGS.logs.startFailed(target.container, err));
            await interaction.editReply(STRINGS.replies.startFailed(target.container));
            return;
        }

        otterlogs.success(STRINGS.logs.started(target.container, interaction.user.tag));

        const embed = new EmbedBuilder()
            .setTitle(STRINGS.embed.title(target.name))
            .setDescription(STRINGS.embed.description(target.container))
            .setThumbnail(resolveImageUrl(target.image, target.id) ?? null)
            .addFields(
                { name: STRINGS.embed.fieldGame, value: getServerGame(target) || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldVersion, value: target.version || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldModpack, value: target.modpack || STRINGS.embed.emptyValue, inline: true },
            )
            .setColor(parseColor(target.embed_color) ?? DEFAULT_EMBED_COLOR)
            .setTimestamp();

        applyBotBranding(embed, interaction);

        await interaction.editReply({ embeds: [embed] });
    },
};
