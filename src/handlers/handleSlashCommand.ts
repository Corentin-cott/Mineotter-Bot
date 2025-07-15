import { ChatInputCommandInteraction } from "discord.js";
import otterlogs from "../utils/otterlogs";

export default async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
    const command = interaction.client.slashCommands.get(interaction.commandName);
    if (!command?.execute) {
        otterlogs.warn(`Commande "${interaction.commandName}" inconnue (utilisateur : ${interaction.user.tag})`);
        return interaction.reply({
            content: "Cette commande n'existe pas ou plus.",
            ephemeral: true,
        });
    }

    otterlogs.log(`La commande "${command.name}" a été lancé par "${interaction.user.tag}"`)
    await command.execute(interaction);
}
