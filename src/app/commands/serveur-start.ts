import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { docker } from "../utils/dockerClient";
import {
    fetchAllServeurs,
    findServeurById,
    isStartable,
    parseColor,
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
        doesNotExist: (id: number) => `Le serveur \`${id}\` n'existe pas. Merci de contacter un administrateur et de lui donner le code suivant : \`404-${id}\``,
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

        if (!isStartable(target)) {
            await interaction.editReply(STRINGS.replies.noContainer(target.nom));
            return;
        }

        const container = docker.getContainer(target.contenaire);

        let running: boolean;
        try {
            const info = await container.inspect();
            running = info.State.Running;
        } catch (err) {
            otterlogs.error(STRINGS.logs.inspectFailed(target.contenaire, err));
            await interaction.editReply(STRINGS.replies.inspectFailed(target.contenaire));
            return;
        }

        if (running) {
            await interaction.editReply(STRINGS.replies.alreadyRunning(target.nom));
            return;
        }

        try {
            await container.start();
        } catch (err) {
            otterlogs.error(STRINGS.logs.startFailed(target.contenaire, err));
            await interaction.editReply(STRINGS.replies.startFailed(target.contenaire));
            return;
        }

        otterlogs.success(STRINGS.logs.started(target.contenaire, interaction.user.tag));

        const embed = new EmbedBuilder()
            .setTitle(STRINGS.embed.title(target.nom))
            .setDescription(STRINGS.embed.description(target.contenaire))
            .addFields(
                { name: STRINGS.embed.fieldGame, value: target.jeu, inline: true },
                { name: STRINGS.embed.fieldVersion, value: target.version || STRINGS.embed.emptyValue, inline: true },
                { name: STRINGS.embed.fieldModpack, value: target.modpack || STRINGS.embed.emptyValue, inline: true },
            )
            .setColor(parseColor(target.embed_color) ?? DEFAULT_EMBED_COLOR)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
