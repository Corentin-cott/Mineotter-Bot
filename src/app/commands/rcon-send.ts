import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { OtterPocketBase } from "../../otterbots/utils/pocketbase/pocketbase";
import { ACTIVE_SERVERS_ALIAS } from "../utils/serverHelper";
import { rconHelper } from "../utils/rconHelper";
import { otterlogs } from "../../otterbots/utils/otterlogs";
import { ActiveServer } from "../types/activeServeurType";

export default {
    data: new SlashCommandBuilder()
        .setName("rcon-send")
        .setDescription("Envoyer une commande RCON à un serveur actif.")
        .addStringOption(option =>
            option.setName("server")
                .setDescription("Le serveur cible")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName("command")
                .setDescription("La commande à envoyer")
                .setRequired(true)
        ),

    async autocomplete(interaction: AutocompleteInteraction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const servers = await OtterPocketBase.execByAlias<ActiveServer[]>(ACTIVE_SERVERS_ALIAS);

        if (!Array.isArray(servers)) {
            await interaction.respond([]);
            return;
        }

        const choices = servers
            .filter(s => s.host?.toLowerCase().includes(focused))
            .slice(0, 25)
            .map(s => ({ name: s.host || "Unknown", value: s.id }));

        await interaction.respond(choices);
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId = interaction.options.getString("server", true);
        const command = interaction.options.getString("command", true);

        await interaction.deferReply();

        // Reject newlines to prevent RCON command injection
        if (/[\r\n]/.test(command)) {
            await interaction.editReply("Les sauts de ligne ne sont pas autorisés dans les commandes RCON.");
            return;
        }

        const servers = await OtterPocketBase.execByAlias<ActiveServer[]>(ACTIVE_SERVERS_ALIAS);
        const target = servers?.find(s => s.id === serverId);
        if (!target) {
            otterlogs.error(`Server '${serverId}' not found.`);
            await interaction.editReply(`Serveur '${serverId}' introuvable.`);
            return;
        }

        const port = parseInt(target.rcon_port || "0");
        if (!target.rcon_host || !port) {
            await interaction.editReply(`Configuration RCON incomplète pour le serveur '${serverId}'.`);
            return;
        }

        const response = await rconHelper.sendCommand(
            { host: target.rcon_host, port, password: target.rcon_password, timeout: 5000 },
            command
        );

        const embed = new EmbedBuilder()
            .setTitle(`RCON: ${serverId}`)
            .addFields(
                { name: "Commande", value: `\`${command}\`` },
                { name: "Réponse", value: `\`\`\`${response || "Aucune réponse (ou vide)"}\`\`\`` }
            )
            .setColor(response ? "Green" : "Red")
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
