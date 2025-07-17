import { StringSelectMenuInteraction } from "discord.js";
import otterlogs from "../../utils/otterlogs";
import Docker from "dockerode";
import fs from "fs";
import path from "path";
import { ServeurType } from "../../types/otterly";
import buildServerEmbed from "../../utils/buildServerEmbed";

export default async function launchServer(interaction: StringSelectMenuInteraction, serveur: ServeurType) {
    if (!serveur.contenaire) {
        otterlogs.error("Conteneur manquant, lancement du serveur impossible.");
        return interaction.reply({ content: process.env.ERROR_MESSAGE });
    }

    try {
        const docker = new Docker({
            host: process.env.DOCKER_HOST,
            port: process.env.DOCKER_PORT,
            protocol: "https",
            ca: fs.readFileSync(path.join("./src/", "certs", "ca.pem")),
            cert: fs.readFileSync(path.join("./src/", "certs", "cert.pem")),
            key: fs.readFileSync(path.join("./src/", "certs", "key.pem")),
        });

        const container = docker.getContainer(serveur.contenaire);
        await container.start();

        return interaction.update({
            embeds: [buildServerEmbed(interaction, serveur, "démarré")],
            content: "Le serveur a été démarré avec succès.",
            components: [],
        });

    } catch (error: any) {
        if (error.statusCode === 304) {
            return interaction.update({
                embeds: [buildServerEmbed(interaction, serveur, "déjà démarré")],
                content: "Le serveur est déjà démarré.",
                components: [],
            });
        } else {
            otterlogs.error(`Docker error sur ${serveur.contenaire} : ${error.statusCode} : ${error.message}`);
            return interaction.reply({ content: process.env.ERROR_MESSAGE });
        }
    }
}
