import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Otterlyapi } from "../../otterbots/utils/otterlyapi/otterlyapi";
import { rconHelper } from "../utils/rconHelper";
import { RconConfig } from "../types/rconTypes";
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
        const focusedValue = interaction.options.getFocused();

        // Récupérer les serveurs actifs
        const servers = await Otterlyapi.getDataByAlias<ActiveServer[]>('otr-serveurs-primaire-secondaire');

        if (!servers || !Array.isArray(servers)) {
            await interaction.respond([]);
            return;
        }

        // Filtrer les serveurs selon la saisie de l'utilisateur
        const filtered = servers.filter(server =>
            (server.host).toLowerCase().includes(focusedValue.toLowerCase())
        );

        // Mapper les choix. Le nom est affiché à l'utilisateur, la valeur est utilisée dans execute
        await interaction.respond(
            filtered.slice(0, 25).map(server => ({ name: server.host || "Unknown", value: server.id.toString() }))
        );
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverId = interaction.options.getString("server", true);
        const command = interaction.options.getString("command", true);

        await interaction.deferReply();

        // Récupérer les détails du serveur
        const servers = await Otterlyapi.getDataByAlias<ActiveServer[]>('otr-serveurs-primaire-secondaire');

        if (!servers) {
            await interaction.editReply("Impossible de récupérer la liste des serveurs.");
            return;
        }
        otterlogs.log(servers.toString())
        const targetServer = servers.find(s => (s.id) === parseInt(serverId));
        if (!targetServer) {
            await interaction.editReply(`Serveur '${serverId}' introuvable.`);
            otterlogs.error(`Serveur '${serverId}' introuvable.`);
            return;
        }


        const rconConfig: RconConfig = {
            host: targetServer.rcon_host || "unknown",
            port: parseInt(targetServer.rcon_port || "0"),
            password: targetServer.rcon_password || "unknown",
            timeout: 5000
        };

        // Validation de base
        if (!rconConfig.host || !rconConfig.port || !rconConfig.password) {
            await interaction.editReply(`Configuration RCON incomplète pour le serveur '${serverId}'.`);
            return;
        }

        // Sécurité : Empêcher l'injection RCON en interdisant les retours à la ligne
        if (command.includes('\n') || command.includes('\r')) {
            await interaction.editReply("Les sauts de ligne ne sont pas autorisés dans les commandes RCON.");
            return;
        }

        // Envoyer la commande
        const response = await rconHelper.sendCommand(rconConfig, command);

        // Répondre
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
