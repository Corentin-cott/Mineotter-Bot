import { Events, ChannelType, PermissionFlagsBits, Colors, Client, Guild } from "discord.js";
const mysql = require("mysql2/promise");
import * as fs from "fs";
import { BotEvent } from "../types";
import otterlogs from "../utils/otterlogs";

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    client.user?.setActivity("Minecraft");

    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });
      await connection.connect();
      otterlogs.success("Connexion à la base de données réussie");
      await connection.end();
    } catch (error) {
      otterlogs.error(`Erreur MySQL : ${error}`);
    }

    const {
      GUILD_ID,
      CATEGORY_NAME,
      SERVER_MANAGMENT_CATEGORY_NAME,
      ROLE_NAME,
    } = process.env;

    if (!GUILD_ID || !CATEGORY_NAME || !SERVER_MANAGMENT_CATEGORY_NAME || !ROLE_NAME) {
      otterlogs.error("Une ou plusieurs variables d'environnement manquent");
      return;
    }

    // Lancement de la tâche périodique
    import("../task/task").then(task => {
      task.task(client, process.env.GUILD_ID);
    });
    otterlogs.success("Les tâches périodiques ont été initialisés")

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return otterlogs.error("Guild non trouvée");

    let role = guild.roles.cache.find((r) => r.name === ROLE_NAME);
    if (!role) {
      role = await guild.roles.create({
        name: ROLE_NAME,
        color: Colors.Blue,
        reason: "Rôle pour accès salons",
      });
      otterlogs.success(`Rôle "${ROLE_NAME}" créé`);
    }

    const category = await createCategoryIfNotExists(guild, CATEGORY_NAME, role.id);
    await createCategoryIfNotExists(guild, SERVER_MANAGMENT_CATEGORY_NAME, role.id);

    const channelsToCreate = [
      { name: "🌌・discu-mc", envVar: "DISCU_MC" },
      { name: "🌌・chat-mc-partenaire", envVar: "DISCU_MC_PARTENAIRE" },
      { name: "🦦・logs-mineotter", envVar: "GLOBAL_LOGS" },
      { name: "❌・logs-erreur", envVar: "ERROR_LOGS" },
      { name: "🟩・mcmyadmin-primaire" },
      { name: "🟩・mcmyadmin-secondaire" },
      { name: "🔐・mcmyadmin-partenaire" },
    ];

    for (const { name, envVar } of channelsToCreate) {
      const ch = await createTextChannelIfNotExists(guild, name, category.id, role.id);
      if (envVar) {
        try {
          updateEnvVariable(envVar, ch.id);
        } catch (err) {
          otterlogs.error(`Erreur maj .env pour ${name} : ${err}`);
        }
      }
    }

    otterlogs.log(`RCON Primaire = ${process.env.ENABLE_PRIMARY_SERVER_RCON}`);
    otterlogs.log(`RCON Secondaire = ${process.env.ENABLE_SECONDARY_SERVER_RCON}`);
    otterlogs.log(`RCON Partenaire = ${process.env.ENABLE_PARTENAIRE_SERVER_RCON}`);
  },
};

const createCategoryIfNotExists = async (
    guild: Guild,
    name: string,
    roleId: string
) => {
  let category = guild.channels.cache.find(
      (c) => c.name === name && c.type === ChannelType.GuildCategory
  );

  if (category) {
    otterlogs.log(`La catégorie "${name}" existe déjà`);
    return category;
  }

  category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roleId, allow: [PermissionFlagsBits.ViewChannel] },
    ],
  });

  otterlogs.success(`Catégorie "${name}" créée avec les permissions !`);
  return category;
};

const createTextChannelIfNotExists = async (
    guild: Guild,
    name: string,
    categoryId: string,
    roleId: string
) => {
  const existing = guild.channels.cache.find(
      (ch) => ch.name === name && ch.type === ChannelType.GuildText
  );
  if (existing) {
    otterlogs.log(`Le salon "${name}" existe déjà`);
    return existing;
  }

  const channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: roleId, allow: [PermissionFlagsBits.ViewChannel] },
    ],
  });

  otterlogs.success(`Salon "${name}" créé !`);
  return channel;
};

const updateEnvVariable = (key: string, value: string) => {
  const envFilePath = ".env";
  const envFile = fs.readFileSync(envFilePath, "utf8");
  const regex = new RegExp(`^${key}=.*`, "m");

  const newEnv = envFile.match(regex)
      ? envFile.replace(regex, `${key}=${value}`)
      : envFile + `\n${key}=${value}`;

  fs.writeFileSync(envFilePath, newEnv, "utf8");
  otterlogs.success(`Variable ${key} mise à jour dans le .env`);
};

export default event;
