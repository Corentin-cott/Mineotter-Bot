import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

/**
 * Stamps the bot's identity onto an embed: avatar as thumbnail, name and
 * avatar in the footer. The bot display name is taken from BOT_NAME if set,
 * otherwise from the Discord user.
 *
 * Mutates and returns the same embed for chaining.
 */
export function applyBotBranding(
    embed: EmbedBuilder,
    interaction: ChatInputCommandInteraction,
): EmbedBuilder {
    const avatar = interaction.client.user?.displayAvatarURL();
    const name = process.env.BOT_NAME ?? interaction.client.user?.username ?? "Bot";

    if (avatar) embed.setThumbnail(avatar);
    embed.setFooter(avatar ? { text: name, iconURL: avatar } : { text: name });
    return embed;
}
