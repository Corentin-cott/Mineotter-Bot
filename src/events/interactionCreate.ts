import { Events, Interaction } from "discord.js";
import { BotEvent } from "../types";
import otterlogs from "../utils/otterlogs";
import handleSlashCommands from "../handlers/handleSlashCommands";
import handleServerSelect from "../handlers/handleServerSelect";

const event: BotEvent = {
    name: Events.InteractionCreate,
    once: false,
    async execute(interaction: Interaction) {
        try {
            if (interaction.isChatInputCommand()) {
                return handleSlashCommands(interaction);
            }

            if (interaction.isStringSelectMenu() && interaction.customId === 'serveur_select') {
                return handleServerSelect(interaction);
            }
        } catch (error) {
            otterlogs.error(`Erreur dans InteractionCreate : ${error}`);
            if (interaction.isRepliable()) {
                await interaction.reply({
                    content: "Une erreur est survenue lors de l'interaction.",
                    ephemeral: true,
                }).catch(() => {});
            }
        }
    }
};

export default event;
