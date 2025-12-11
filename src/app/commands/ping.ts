import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Permet de tester la connexion avec le bot"),
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.reply({ content: "Otter Pong!" });
    }
};