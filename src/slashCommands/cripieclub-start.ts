import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { SlashCommand } from '../types';
import { ApiController } from "../database/apiController";
import axios from 'axios';
import otterlogs from "../utils/otterlogs";

export const command: SlashCommand = {
    name: 'cripieclub-start',
    data: new SlashCommandBuilder()
        .setName('cripieclub-start')
        .setDescription('Permet de lancer le serveur CripieClub. (La commande changera bientôt, celle-ci est temporaire)'),
    execute: async (interaction: CommandInteraction) => {
        otterlogs.log("Lancement du serveur CripieClub.");
        const apiController = new ApiController() || ""
        let routeData = await apiController.getRouteByAlias("start-Serveur")
        if (!routeData || !routeData.route) {
            otterlogs.error("URL de démarrage du serveur introuvable ! Appeler dans la commande de lancement de serveur.");
            await interaction.reply({
                content: "Erreur : Impossible de trouver l'URL de démarrage du serveur.",
                ephemeral: true
            });
            return;
        }
        let startserv_url: string = routeData.route;
        let tokenAPI = process.env.API_TOKEN;
        let serveurId = 19;
        
        const response = await axios.post(startserv_url, {
            client_token: tokenAPI,
            id_serv: serveurId
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await interaction.reply({
            content: `Le serveur CripieClub a bien été lancé, s'il ne l'était pas déjà. Il devrait être disponible dans quelques instants.`,
            ephemeral: true
        });
    }
};
