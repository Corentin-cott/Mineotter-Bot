import { otterlogs } from "../../otterbots/utils/otterlogs";
import { getSalonByAlias } from "../../otterbots/utils/salon";
import { OtterPocketBase } from "../../otterbots/utils/pocketbase/pocketbase";
import { ACTIVE_SERVERS_ALIAS } from "../utils/serverHelper";
import { rconHelper } from "../utils/rconHelper";
import { cleanUserMessage } from "../utils/discordMessageCleaner";
import { RconConfig } from "../types/rconTypes";
import { ActiveServer } from "../types/activeServeurType";
import { Message } from "discord.js";

type ApiResponse = ActiveServer[];

module.exports = {
    name: "messageCreate",
    once: false,
    async execute(message: Message) {
        // Ignore bots
        if (message.author.bot) return;

        const targetChannel = getSalonByAlias("discu-mc")
        if (!targetChannel) return;

        const targetChannelId: string = targetChannel.id

        if (message.channel.id === targetChannelId) {
            otterlogs.debug(`Message from ${message.author.tag}: ${message.content}`);

            // Construction of the tellraw command
            const cleanMessage = cleanUserMessage(message);
            const tellrawObject = ["", { text: "<" }, { text: message.author.username, color: "#7289DA", hoverEvent: { action: "show_text", contents: "Message provenant de Discord" } }, { text: `> ${cleanMessage}` }];

            // JSON.stringify ensures safe escaping of special characters
            const command: string = `/tellraw @a ${JSON.stringify(tellrawObject)}`;

            try {
                // Fetch active servers (RCON targets) from PocketBase
                const response = await OtterPocketBase.execByAlias<ApiResponse>(ACTIVE_SERVERS_ALIAS);
                otterlogs.debug(`API Response: ${JSON.stringify(response)}`);

                if (response && Array.isArray(response)) {
                    await Promise.all(response.map(async (server) => {
                        const rcon: RconConfig = {
                            host: server.rcon_host,
                            port: parseInt(server.rcon_port),
                            password: server.rcon_password,
                            timeout: 5000
                        };

                        try {
                            const result = await rconHelper.sendCommand(rcon, command);
                            if (result != null && result.length > 0) {
                                otterlogs.debug(`[${server.host}] RCON Response: ${result}`);
                            }
                        } catch (rconError) {
                            otterlogs.error(`[${server.host}] RCON Failed: ${rconError}`);
                        }
                    }));
                } else {
                    otterlogs.warn("API response format was invalid or empty.");
                }
            } catch (error) {
                otterlogs.error(`Failed to fetch servers or send messages: ${error}`);
            }
        }
    }
};