import { StringSelectMenuInteraction } from "discord.js";
import otterlogs from "../utils/otterlogs";
import { ServeursDatabase } from "../database/serveursController";
import Docker from 'dockerode';
import fs from 'fs';
import path from "path";

export default async function handleServerSelect(interaction: StringSelectMenuInteraction) {
    try {
        const [selectedServerId, action, utilisateurId] = interaction.values[0]?.split('|') ?? [];

        if (!selectedServerId || !action || !utilisateurId) {
            return interaction.reply({ content: "Interaction invalide.", ephemeral: true });
        }

        if (interaction.user.id !== utilisateurId) {
            return interaction.reply({ content: "Cette sélection ne t'appartient pas ! <a:mineotter:1355287083559944282>", ephemeral: true });
        }

        const db = new ServeursDatabase();
        const selectedServer = await db.getServeurById(parseInt(selectedServerId));
        const serverInfo = selectedServer?.results?.[0];

        if (!serverInfo) {
            return interaction.reply({ content: "Serveur introuvable.", ephemeral: true });
        }

        if (action === "lancer") {
            const containerName = "creatif"; // Récupéré depuis la DB

            if (!containerName) {
                otterlogs.error("Nom du conteneur manquant dans la base de données.");
                return interaction.reply({
                    content: "Erreur : Impossible de trouver le conteneur du serveur.",
                    ephemeral: true,
                });
            }

            try {
                const docker = new Docker({
                    host: process.env.DOCKER_HOST,
                    port: process.env.DOCKER_PORT,
                    protocol: "https",
                    ca: fs.readFileSync(path.join(__dirname, 'certs', 'ca.pem')),
                    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem')),
                    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
                });

                const container = docker.getContainer(containerName);

                await container.start();

                await interaction.update({
                    embeds: [buildServerEmbed(interaction, serverInfo, "démarré")],
                    content: "Le serveur a été démarré avec succès via Docker distant.",
                    components: [],
                });

            } catch (error: any) {
                if (error.statusCode === 304) {
                    await interaction.update({
                        embeds: [buildServerEmbed(interaction, serverInfo, "déjà démarré")],
                        content: "Le serveur était déjà démarré.",
                        components: [],
                    });
                } else {
                    otterlogs.error(`Erreur Docker (distant) sur "${containerName}" : ${error.message || error}`);
                    await interaction.reply({
                        content: "Erreur lors du démarrage du conteneur distant.",
                        ephemeral: true,
                    });
                }
            }
        } else if (action === 'infos') {
            await interaction.update({
                embeds: [buildServerEmbed(interaction, serverInfo, "infos")]
            });
        } else {
            await interaction.reply({ content: "Action inconnue.", ephemeral: true });
        }
    } catch (err) {
        otterlogs.error(`Erreur dans handleServerSelect : ${err}`);
        await interaction.reply({ content: "Une erreur est survenue lors du traitement.", ephemeral: true });
    }
}

function buildServerEmbed(interaction: StringSelectMenuInteraction, server: any, type: 'infos' | 'démarré' | 'déjà démarré') {
    const title =
        type === 'démarré' ? `Serveur ${server.nom} démarré` :
            type === 'déjà démarré' ? `Serveur ${server.nom} déjà actif` :
                `Informations sur le serveur ${server.nom}`;

    const description =
        type === 'démarré'
            ? `Le serveur ${server.nom} a été démarré avec succès.`
            : type === 'déjà démarré'
                ? `Le serveur ${server.nom} était déjà en cours d'exécution.`
                : `Voici les informations sur le serveur ${server.nom}.`;

    return {
        title,
        description,
        color: parseInt(server.embed_color.replace("#", ""), 16),
        fields: [
            { name: "Jeu", value: server.jeu, inline: true },
            { name: "Version", value: server.version, inline: true },
            {
                name: "Modpack",
                value: `[${server.modpack}](${server.modpack_url})`,
                inline: true,
            },
        ],
        footer: {
            text: "Mineotter",
            icon_url: interaction.client.user?.displayAvatarURL() || "",
        },
        timestamp: new Date().toISOString(),
    };
}
