import { ColorResolvable, Events, Interaction } from "discord.js";
import { BotEvent } from "../types";
import otterlogs from "../utils/otterlogs";
import { ServeursDatabase } from "../database/serveursController";
import { ApiController } from "../database/apiController";
import axios from 'axios';

const event: BotEvent = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: Interaction) {
        try {
            // Gère les commandes slash
            if (interaction.isChatInputCommand()) {
                const command = interaction.client.slashCommands.get(interaction.commandName);
                if (!command || !command.execute) {
                    otterlogs.warn(`Commande nommée "${interaction.commandName}" exécutée par ${interaction.user.tag} (ID: ${interaction.user.id}), mais la commande n'existe pas ou plus. Les commandes sont-elles à jour ?`);
                    return interaction.reply({ content: "Cette commande n'existe pas ou plus ! ", ephemeral: true });
                }
                await command.execute(interaction);
            }
            
            // Gère les interactions de sélection de serveurs
            if (interaction.isStringSelectMenu() && interaction.customId === 'serveur_select') {
                const [selectedServerId, action, utilisateurId] = interaction.values[0].split('|');
                if (interaction.user.id !== utilisateurId) {
                    return interaction.reply({ content: "Cette sélection ne t'appartient pas ! <a:mineotter:1355287083559944282>", ephemeral: true });
                }
                const db = new ServeursDatabase();
                const selectedServer = await db.getServeurById(parseInt(selectedServerId));

                if (action === 'lancer') {
                    const apiController = new ApiController() || ""
                    const token = await apiController.getToken();
                    let routeData = await apiController.getRouteByAlias("otr-start-serveur")
                    if (!routeData || !routeData.route) {
                        otterlogs.error("URL de démarrage du serveur introuvable ! Appeler dans la commande de lancement de serveur.");
                        await interaction.reply({
                            content: "Erreur : Impossible de trouver l'URL de démarrage du serveur.",
                            ephemeral: true
                        });
                        return;
                    }
                    let startserv_url: string = routeData.route;
                    let serveurId = selectedServer.results[0].id;
                    
                    const response = await axios.post(startserv_url, {
                        id: serveurId
                    }, {
                        headers: { 'Authorization': `${token?.token}` }
                    });

                    await interaction.update({
                        embeds: [
                            {
                                title: `Serveur ${selectedServer.results[0].nom} démarré`,
                                description: `Le serveur ${selectedServer.results[0].nom} a été démarré avec succès.`,
                                color: parseInt(selectedServer.results[0].embed_color.replace('#', ''), 16),
                                fields: [
                                    {
                                        name: "Jeu",
                                        value: selectedServer.results[0].jeu,
                                        inline: true
                                    },
                                    {
                                        name: "Version",
                                        value: selectedServer.results[0].version,
                                        inline: true
                                    },
                                    {
                                        name: "Modpack",
                                        value: `[${selectedServer.results[0].modpack}](${selectedServer.results[0].modpack_url})`,
                                        inline: true
                                    }
                                ],
                                footer: {
                                    text: "Mineotter",
                                    icon_url: interaction.client.user?.displayAvatarURL() || '',
                                },
                                timestamp: new Date().toISOString()
                            }
                        ],
                        content: "Le serveur a été démarré avec succès.",
                        components: []
                    }).catch(error => {
                        otterlogs.error(`Erreur lors de la mise à jour du message : ${error}`);
                    });
                } else if (action === 'infos') {
                    const embed = {
                        title: `Informations sur le serveur ${selectedServer.results[0].nom}`,
                        description: `Voici les informations sur le serveur ${selectedServer.results[0].nom}.`,
                        color: parseInt(selectedServer.results[0].embed_color.replace('#', ''), 16),
                        fields: [
                            {
                                name: "Jeu",
                                value: selectedServer.results[0].jeu,
                                inline: true
                            },
                            {
                                name: "Version",
                                value: selectedServer.results[0].version,
                                inline: true
                            },
                            {
                                name: "Modpack",
                                value: `[${selectedServer.results[0].modpack}](${selectedServer.results[0].modpack_url})`,
                                inline: true
                            }
                        ],
                        footer: {
                            text: "Mineotter",
                            icon_url: interaction.client.user?.displayAvatarURL() || '',
                        },
                        timestamp: new Date().toISOString()
                    };

                    await interaction.update({
                        embeds: [embed]
                    }).catch(error => {
                        otterlogs.error(`Erreur lors de la mise à jour du message : ${error}`);
                    });
                }
            }
        } catch (error) {
            otterlogs.error("Erreur lors de l'exécution de l'interaction:");
            if (interaction.isChatInputCommand()) {
                interaction.reply({ content: "Une erreur est survenue lors de l'exécution de la commande.", ephemeral: true });
            }
        }
    }
}

export default event;
