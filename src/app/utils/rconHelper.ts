import { otterlogs } from "../../otterbots/utils/otterlogs";
import { Rcon } from "rcon-client";
import { RconConfig } from "../types/rconTypes"

export const rconHelper = {
    /**
     * Connects to a Minecraft server via RCON, runs a command, returns the response.
     */
    async sendCommand(config: RconConfig, command: string): Promise<string | null> {
        if (!command?.trim()) {
            otterlogs.warn("Attempted to send empty command.");
            return null;
        }

        const rcon = new Rcon(config);

        try {
            await rcon.connect();
            return await rcon.send(command);
        } catch (error) {
            otterlogs.error(`Error sending command to ${config.host}: ${error}`);
            return null;
        } finally {
            try { await rcon.end(); } catch (e) { console.warn("Rcon : " + e); }
        }
    }
};
