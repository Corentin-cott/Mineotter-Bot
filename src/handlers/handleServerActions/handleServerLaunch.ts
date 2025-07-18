import { StringSelectMenuInteraction } from "discord.js";
import otterlogs from "../../utils/otterlogs";
import Docker from "dockerode";
import fs from "fs";
import path from "path";
import { ServeurType } from "../../types/otterly";
import buildServerEmbed from "../../utils/buildServerEmbed";
import {
    fetchPrimaryAndSecondaryIds,
    fetchPrimaryAndSecondaryServers,
    fetchPrimaryServer,
    updateSecondaryServerId
} from "../../services/api/otterlyapi";
import shutdownServer from "./shutdownServer";

export default async function launchServer(interaction: StringSelectMenuInteraction, serveur: ServeurType) {
    // Récupération des serveurs qui sont actuellement supposés être lancés
    const { primary, secondary } = await fetchPrimaryAndSecondaryServers();

    // Configuration dockerode
    const docker = new Docker({
        host: process.env.DOCKER_HOST,
        port: process.env.DOCKER_PORT,
        protocol: "https",
        ca: fs.readFileSync(path.join("./src/", "certs", "ca.pem")),
        cert: fs.readFileSync(path.join("./src/", "certs", "cert.pem")),
        key: fs.readFileSync(path.join("./src/", "certs", "key.pem")),
    });

    // Récupération des conteneurs Docker correspondant
    const primaryConteneur = docker.getContainer(primary.contenaire);
    const secondaireConteneur = docker.getContainer(secondary.contenaire);

    // Ce bout de logique définit si un serveur doit être fermé pour ouvrir celui demandé par l'utilisateur.
    // Vérification que le serveur à ouvrir n'est pas déjà celui supposé être ouvert
    let mustShutdown = true;
    if (serveur.type === "primary" && serveur.id === primary.id) {
        mustShutdown = false;
    } else if (serveur.type === "secondary" && serveur.id === secondary.id) {
        mustShutdown = false;
    }

    otterlogs.log(`Le serveur ${primary.nom} doit être fermé pour ouvrir ${serveur.nom} : mustShutdown : ${mustShutdown ? "OUI" : "NON"}`);
    if (mustShutdown) {
        let isRunning = false;

        if (serveur.type === "primary" && primaryConteneur) {
            const data = await primaryConteneur.inspect();
            isRunning = data.State.Running;
            otterlogs.log(`Conteneur primaire en cours d'exécution : ${isRunning}`);
        } else if (serveur.type === "secondary" && secondaireConteneur) {
            const data = await secondaireConteneur.inspect();
            isRunning = data.State.Running;
            otterlogs.log(`Conteneur secondaire en cours d'exécution : ${isRunning}`);
        }

        if (!isRunning) {
            otterlogs.log("Le conteneur n'est pas en cours d'exécution, pas besoin de l'arrêter.");
            return; // On ne fait rien si le conteneur est déjà arrêté
        }

        // Fermeture silencieuse du serveur qui prend la place (type) du serveur à ouvrir
        await shutdownServer(interaction, serveur.type, true);

        // Arrêt du conteneur correspondant une fois la fermeture propre finie
        if (serveur.type === "primary" && primaryConteneur) {
            try {
                await primaryConteneur.stop();
                otterlogs.success("Le contenaire à été fermé avec succès !")
            } catch (error) {
                otterlogs.error(`Erreur lors de l'arrêt du conteneur primaire : ${error}`);
            }
        } else if (serveur.type === "secondary" && secondaireConteneur) {
            try {
                await secondaireConteneur.stop();
                otterlogs.success("Le contenaire à été fermé avec succès !")
            } catch (error) {
                otterlogs.error(`Erreur lors de l'arrêt du conteneur secondaire : ${error}`);
            }
        }
    }

    if (!serveur.contenaire) {
        otterlogs.error("Conteneur manquant, lancement du serveur impossible.");
        return interaction.editReply({ content: process.env.ERROR_MESSAGE });
    }

    // Passage à l'ouverture du serveur
    otterlogs.log(`Lancement du serveur ${serveur.nom} : ${serveur.contenaire}`);
    try {
        const container = docker.getContainer(serveur.contenaire);
        await container.start();
        otterlogs.success("Ouverture effectué avec succès !")
    } catch (error: any) {
        if (error.statusCode === 304) {
            return interaction.update({
                embeds: [buildServerEmbed(interaction, serveur, "déjà démarré")],
                content: "Le serveur est déjà démarré.",
                components: [],
            });
        } else {
            otterlogs.error(`Docker error sur ${serveur.contenaire} : ${error.statusCode} : ${error.message}`);
            return interaction.editReply({ content: process.env.ERROR_MESSAGE });
        }
    }

    let success: boolean
    try {
        success = await updateSecondaryServerId(serveur.id)
    } catch (err) {
        otterlogs.error(`Erreur Otterly API : ${err}`);
        return interaction.editReply({ content: process.env.ERROR_MESSAGE });
    }

    if (!success) {
        otterlogs.warn("L'ID du serveur secondaire n'a pas été changé dans la BDD")
    }

    return interaction.editReply({
        embeds: [buildServerEmbed(interaction, serveur, "démarré")],
        content: "Le serveur a été démarré avec succès.",
        components: [],
    });
}
