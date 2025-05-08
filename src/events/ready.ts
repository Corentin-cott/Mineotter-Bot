import { Events, ChannelType, PermissionFlagsBits, Colors, Client, Guild } from "discord.js";
import * as fs from "fs";
import { BotEvent } from "../types";
import otterlogs from "../utils/otterlogs";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    otterlogs.success(`Ready! Logged in as ${client.user?.tag}`);
    client.user?.setActivity("Minecraft");

    // Noms des salons à créer pour le fonctionnement de mineotter
    const channelNames: string[] = [
      "🌌・discu-mc",
      "🌌・chat-mc-partenaire", // Attention à ne pas avoir deux fois le même nom de salon ! Aussi, quand celui la doit être remplacé, il ne faut pas oublier de changer les 2 instances.
      "🦦・logs-mineotter",
      "❌・logs-erreur",
      "🟩・mcmyadmin-primaire",
      "🟩・mcmyadmin-secondaire",
      "🔐・mcmyadmin-partenaire"
    ];

    // ID du serveur
    const guildId = process.env.GUILD_ID;
    if (!guildId) {
      otterlogs.error("GuildId non trouvée");
      return;
    }

    // Nom de la catégorie
    const categoryName = process.env.CATEGORY_NAME;
    if (!categoryName) {
      otterlogs.error("CategoryName non trouvée");
      return;
    }

    
    // Nom de la catégorie de gestion des serveurs
    const serverManagmentCategoryName = process.env.SERVER_MANAGMENT_CATEGORY_NAME;
    if (!serverManagmentCategoryName) {
      otterlogs.error("ServerManagmentCategoryName non trouvée");
      return;
    }

    // Nom du rôle
    const roleName = process.env.ROLE_NAME;
    if (!roleName) {
      otterlogs.error("RoleName non trouvée");
      return;
    }

    // Tableau pour stocker les noms des salons existants
    const channelsDiscord: string[] = [];

    try {
      // Récupère la guild
      const guild: Guild | undefined = client.guilds.cache.get(guildId);
      if (!guild) {
        otterlogs.error("Guild non trouvée");
        return;
      }

      // Récupère la liste des salons et stocke les noms dans un tableau
      guild.channels.cache.forEach((channel) => {
        channelsDiscord.push(channel.name);
      });

      // Vérifie si le rôle existe déjà
      let role = guild.roles.cache.find((r) => r.name === roleName);
      if (!role) {
        // Crée un rôle spécifique
        role = await guild.roles.create({
          name: roleName,
          color: Colors.Blue,
          reason: "Role spécifique pour la catégorie",
        });
        otterlogs.success(`Rôle "${roleName}" créé !`);
      } else {
        otterlogs.log(`Le rôle "${roleName}" existe déjà`);
      }

      // Vérifie si la catégorie existe déjà
      let category = guild.channels.cache.find(
        (channel) =>
          channel.name === categoryName &&
          channel.type === ChannelType.GuildCategory
      );
      if (category) {
        otterlogs.log(`La catégorie "${categoryName}" existe déjà`);
      } else {
        // Crée une catégorie avec les permissions pour le rôle spécifique
        category = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id, // ID du serveur
              deny: [PermissionFlagsBits.ViewChannel], // Interdire la vue des salons à tout le monde par défaut
            },
            {
              id: role.id, // ID du rôle spécifique
              allow: [PermissionFlagsBits.ViewChannel], // Autoriser la vue des salons pour le rôle spécifique
            },
          ],
        });
        otterlogs.success(`Catégorie "${categoryName}" créée avec les permissions !`);
      }

      // Vérifie si la catégorie de gestion des serveurs existe déjà
      let serverManagmentCategory = guild.channels.cache.find(
        (channel) =>
          channel.name === serverManagmentCategoryName &&
          channel.type === ChannelType.GuildCategory
      );
      if (serverManagmentCategory) {
        otterlogs.log(`La catégorie "${serverManagmentCategoryName}" existe déjà`);
      } else {
        // Crée une catégorie avec les permissions pour le rôle spécifique
        serverManagmentCategory = await guild.channels.create({
          name: serverManagmentCategoryName,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id, // ID du serveur
              deny: [PermissionFlagsBits.ViewChannel], // Interdire la vue des salons à tout le monde par défaut
            },
            {
              id: role.id, // ID du rôle spécifique
              allow: [PermissionFlagsBits.ViewChannel], // Autoriser la vue des salons pour le rôle spécifique
            },
          ],
        });
        otterlogs.success(`Catégorie "${serverManagmentCategoryName}" créée avec les permissions !`);
      }

      // Crée des salons à l'intérieur de la catégorie avec les mêmes permissions
      for (const channelName of channelNames) {
        if (channelsDiscord.includes(channelName)) {
          otterlogs.log(`Le salon "${channelName}" existe déjà`);
        } else {
          await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel],
              },
            ],
          });
          otterlogs.success(`Salon "${channelName}" créé !`);
        }
        if (channelName.includes("discu-mc") || channelName.includes("partenaire") || channelName.includes("logs-mineotter") || channelName.includes("logs-erreur")) {
          let envVarName = "";
          switch (channelName) {
            case "🌌・discu-mc":
              envVarName = "DISCU_MC";
              break;
            case "🌌・chat-mc-partenaire":
              envVarName = "DISCU_MC_PARTENAIRE";
              break;
            case "🦦・logs-mineotter":
              envVarName = "GLOBAL_LOGS";
              break;
            case "❌・logs-erreur":
              envVarName = "ERROR_LOGS";
              break;
          }

          try {
            const channel = guild.channels.cache.find((ch) => ch.name === channelName);
            if (channel) {
              // Mettre à jour le fichier .env
              const envFilePath = ".env";
              const envFileContent = fs.readFileSync(envFilePath, "utf8");

              // Vérifier si la variable existe déjà et la remplacer, sinon l'ajouter
              const newEnvContent = envFileContent.includes(envVarName)
                ? envFileContent.replace(new RegExp(`^${envVarName}=.*`, "m"), `${envVarName}=${channel.id}`)
                : envFileContent + `\n${envVarName}=${channel.id}`;

              fs.writeFileSync(envFilePath, newEnvContent, "utf8");

              otterlogs.success(`ID du salon "${channelName}" (${channel.id}) enregistré dans le .env !`);
            }
          } catch (error) {
            otterlogs.error(`Erreur lors de l'enregistrement de l'ID du salon "${channelName}" dans le .env : ${error}`);
          }
        }
      }
    } catch (error) {
      otterlogs.error(`Erreur lors de la création de la catégorie, des salons et du rôle : ${error}`);
    }

    // Check la config Rcon
    const rconPrimaire = process.env.ENABLE_PRIMARY_SERVER_RCON;
    const rconSecondaire = process.env.ENABLE_SECONDARY_SERVER_RCON;
    const rconPartenaire = process.env.ENABLE_PARTENAIRE_SERVER_RCON;
    otterlogs.log(`RCON Primaire = ${rconPrimaire}, RCON Secondaire = ${rconSecondaire}, RCON Partenaire = ${rconPartenaire}`);
  }
};

export default event;
