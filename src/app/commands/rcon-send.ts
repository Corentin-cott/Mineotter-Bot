import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Otterlyapi } from "../../otterbots/utils/otterlyapi/otterlyapi";
import { rconHelper } from "../utils/rconHelper";
import { RconConfig } from "../types/rconTypes";
import { otterlogs } from "../../otterbots/utils/otterlogs";

interface Server {
    nom?: string;
    name?: string;
    host?: string;
    ip?: string;
    port?: string;
    rcon_port?: string;
    rcon_password?: string;
    password?: string;
}

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

        // Fetch active servers
        // Assuming 'serveurs_actifs' returns an array of server objects
        const servers = await Otterlyapi.getDataByAlias<Server[]>('otr-serveurs-primaire-secondaire');

        if (!servers || !Array.isArray(servers)) {
            await interaction.respond([]);
            return;
        }

        // Filter servers based on user input (focusedValue)
        // Assuming server object has a 'name' or 'alias' field. 
        // If not, we might need to inspect the data structure.
        // For now, I'll assume there's a 'nom' or 'name' field.
        const filtered = servers.filter(server =>
            (server.nom || server.name || server.host || "").toLowerCase().includes(focusedValue.toLowerCase())
        );

        // Map to choices. Name is what user sees, Value is what we get in execute (e.g. ID or unique name)
        // Using 'nom' as value for now, or maybe 'id' if available.
        // Let's use the name as the value to look it up again.
        await interaction.respond(
            filtered.slice(0, 25).map(server => ({ name: server.nom || server.name || server.host || "Unknown", value: server.nom || server.name || server.host || "Unknown" }))
        );
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const serverName = interaction.options.getString("server", true);
        const command = interaction.options.getString("command", true);

        await interaction.deferReply();

        // 1. Retrieve server details
        const servers = await Otterlyapi.getDataByAlias<Server[]>('otr-serveurs');

        if (!servers) {
            await interaction.editReply("Impossible de récupérer la liste des serveurs.");
            return;
        }

        const targetServer = servers.find(s => (s.nom || s.name || s.host) === serverName);

        if (!targetServer) {
            await interaction.editReply(`Serveur '${serverName}' introuvable.`);
            return;
        }

        // 2. Map to RconConfig
        // We need to map the API response to RconConfig.
        // Assuming the API returns keys like 'ip', 'port', 'rcon_password' etc.
        // We might need to adjust this mapping after verifying the data.
        const rconConfig: RconConfig = {
            host: targetServer.ip || targetServer.host || "",
            port: parseInt(targetServer.rcon_port || targetServer.port || "0"),
            password: targetServer.rcon_password || targetServer.password || "",
            timeout: 5000 // Default timeout
        };

        // Basic validation
        if (!rconConfig.host || !rconConfig.port || !rconConfig.password) {
            await interaction.editReply(`Configuration RCON incomplète pour le serveur '${serverName}'.`);
            return;
        }

        // Security: Prevent RCON injection by disallowing newlines
        if (command.includes('\n') || command.includes('\r')) {
            await interaction.editReply("Les sauts de ligne ne sont pas autorisés dans les commandes RCON.");
            return;
        }

        // Note: No explicit cooldown is implemented here. 
        // Discord's rate limits and the bot's execution speed provide some natural throttling,
        // but a dedicated cooldown system in the command handler would be better for high-traffic bots.

        // 3. Send Command
        const response = await rconHelper.sendCommand(rconConfig, command);

        // 4. Reply
        const embed = new EmbedBuilder()
            .setTitle(`RCON: ${serverName}`)
            .addFields(
                { name: "Commande", value: `\`${command}\`` },
                { name: "Réponse", value: `\`\`\`${response || "Aucune réponse (ou vide)"}\`\`\`` }
            )
            .setColor(response ? "Green" : "Red")
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
