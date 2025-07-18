import { StringSelectMenuInteraction } from "discord.js";
import otterlogs from "../../utils/otterlogs";
import { Rcon } from "rcon-client";
import buildServerEmbed from "../../utils/buildServerEmbed";
import { ServeurParametersController } from "../../database/serveursParametersController";
import { ServeurType } from "../../types/otterly";
import { fetchPrimaryServer, fetchSecondaryServer } from "../../services/api/otterlyapi";

type ServerPos = 'primary' | 'secondary' | 'partenaire';

export default async function handleShutdownServer(interaction: StringSelectMenuInteraction, type: ServerPos, silent: boolean = false) {
    const serverParams = new ServeurParametersController();
    let rconConfig;

    try {
        const configs: { host: string; port: number; password: string }[] = [];

        // Récupération des configs RCON selon le channel
        if (process.env.ENABLE_PRIMARY_SERVER_RCON === "true") {
            configs.push({
                host: process.env.PRIMARY_SERVER_RCON_HOST ?? "localhost",
                port: 25575,
                password: await serverParams.getRconPassword?.() ?? "password",
            });
        }

        if (process.env.ENABLE_SECONDARY_SERVER_RCON === "true") {
            configs.push({
                host: process.env.SECONDARY_SERVER_RCON_HOST ?? "localhost",
                port: 25574,
                password: await serverParams.getRconPassword?.() ?? "password",
            });
        }
        if (process.env.ENABLE_PARTENAIRE_SERVER_RCON === "true") {
            configs.push({
                host: process.env.PARTENAIRE_SERVER_RCON_HOST ?? "localhost",
                port: 25580,
                password: await serverParams.getPartenaireRconPassword?.() ?? "password",
            });
        }

        // Trouver la bonne config RCON selon le type de serveur
        if (type === "primary") {
            rconConfig = configs.find(cfg => cfg.port === 25575);
        } else if (type === "secondary") {
            rconConfig = configs.find(cfg => cfg.port === 25574);
        } else if (type === "partenaire") {
            rconConfig = configs.find(cfg => cfg.port === 25580);
        }

        if (!rconConfig) {
            otterlogs.warn("Configuration RCON introuvable pour le serveur");
            if (!silent) {
                await interaction.reply({ content: process.env.ERROR_MESSAGE });
            }
            return;
        }

        // Connexion RCON et arrêt
        const rcon = await Rcon.connect({
            host: rconConfig.host,
            port: rconConfig.port,
            password: rconConfig.password,
        });

        await rcon.send("say Un utilisateur a décidé de fermer ce serveur.");
        await rcon.send("stop");
        await rcon.end();

        otterlogs.log(`Arrêt RCON envoyé au serveur ${type}`);

        // Si on n'est pas en mode silent, on met à jour l'interaction avec un embed
        if (!silent) {
            let serveur: ServeurType | null = null;

            try {
                if (type === "primary") {
                    serveur = await fetchPrimaryServer();
                } else if (type === "secondary") {
                    serveur = await fetchSecondaryServer();
                } else if (type === "partenaire") {
                    otterlogs.warn("La fermeture de serveur partenaire n'est pas encore supportée.");
                }
            } catch (err) {
                otterlogs.error(`Erreur Otterly API : ${err}`);
                if (!silent) {
                    return interaction.reply({ content: process.env.ERROR_MESSAGE });
                }
            }

            if (serveur) {
                return interaction.update({
                    embeds: [buildServerEmbed(interaction, serveur, "arrêté")],
                    content: `Le serveur **${serveur.nom}** a été arrêté avec succès.`,
                    components: [],
                });
            } else {
                otterlogs.warn(`Problème lors de la récupération du serveur ${type}`);
                if (!silent) {
                    return interaction.reply({ content: process.env.ERROR_MESSAGE });
                }
            }
        }
    } catch (error: any) {
        otterlogs.error(`Erreur RCON sur la fermeture du serveur ${type} : ${error.message}`);
        if (!silent) {
            return interaction.reply({ content: process.env.ERROR_MESSAGE });
        }
    }
}
