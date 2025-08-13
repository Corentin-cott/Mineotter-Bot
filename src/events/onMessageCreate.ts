import { Events, Message } from "discord.js";
import { ServeurParametersController } from "../database/serveursParametersController";
import { Rcon } from "rcon-client";
import otterlogs from "../utils/otterlogs";

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    if (content.includes("mineotter")) {
      await message.react("🦦").catch(() => null);
    }

    const { channelId, author } = message;

    const isMcChannel = [
      process.env.DISCU_MC,
      process.env.DISCU_MC_PARTENAIRE
    ].includes(channelId);

    if (!isMcChannel) return;

    const formattedMessage = `tellraw @a ["",{"text":"<${escapeMinecraftJson(author.username)}>","color":"#7289DA"},{"text":" ${escapeMinecraftJson(replaceEmojis(message.content))}"}]`;

    const serverParams = new ServeurParametersController();

    let configs: { host: string, port: number, password: string }[] = [];
    try {
      configs = await buildRconConfigs(channelId, serverParams);
    } catch (error) {
      otterlogs.error(`Errreur lors du build de la configuration RCON : ${error}`);
    }
    if (!configs.length) {
      otterlogs.warn(`Aucun serveur RCON configuré et/ou activé pour le salon ${channelId}`);
      return;
    }

    otterlogs.log(`Message reçu dans le salon ${channelId} par ${author.tag} (${author.id}), envoi du message dans ${configs.length} serveurs.`);

    for (const cfg of configs) {
      try {
        await sendRconMessage(cfg, formattedMessage);
      } catch (err) {
        otterlogs.error(`Erreur RCON [${cfg.host}:${cfg.port}] : ${err}`);
      }
    }
  }
};

async function buildRconConfigs(channelId: string, serverParams: ServeurParametersController) {
  const configs: { host: string, port: number, password: string }[] = [];

  if (channelId === process.env.DISCU_MC) {
    if (process.env.ENABLE_PRIMARY_SERVER_RCON === "true") {
      configs.push({
        host: process.env.PRIMARY_SERVER_RCON_HOST ?? "localhost",
        port: 25575,
        password: await serverParams.getRconPassword() ?? "password"
      });
    }

    if (process.env.ENABLE_SECONDARY_SERVER_RCON === "true") {
      configs.push({
        host: process.env.SECONDARY_SERVER_RCON_HOST ?? "localhost",
        port: 25574,
        password: await serverParams.getRconPassword() ?? "password"
      });
    }
  } else if (channelId === process.env.DISCU_MC_PARTENAIRE) {
    if (process.env.ENABLE_PARTENAIRE_SERVER_RCON === "true") {
      configs.push({
        host: process.env.PARTENAIRE_SERVER_RCON_HOST ?? "localhost",
        port: 25580,
        password: await serverParams.getPartenaireRconPassword() ?? "password"
      });
    }
  }

  return configs.filter(cfg => cfg.host && cfg.password);
}

async function sendRconMessage(config: { host: string; port: number; password: string }, message: string) {
  const rcon = new Rcon(config);

  let hasThrown = false;

  const errorListener = (err: Error) => {
    hasThrown = true;
    otterlogs.error(`RCON internal error (${config.host}:${config.port}): ${err.message}`);
  };

  rcon.on("error", errorListener);

  try {
    await rcon.connect();
    if (!hasThrown) {
      await rcon.send(message);
    }
  } catch (err) {
    otterlogs.error(`RCON connection/send failed: ${err}`);
  } finally {
    rcon.off("error", errorListener); // Nettoyage
    await rcon.end().catch(() => null); // ignore les erreurs ici
  }
}

function escapeMinecraftJson(text: string): string {
  return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '')
      .replace(/\t/g, '\\t');
}

function replaceEmojis(text: string): string {
  return text
      .replace(/<a?:\w+:\d+>/g, "🦦");
}
