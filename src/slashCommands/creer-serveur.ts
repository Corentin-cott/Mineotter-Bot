import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, ColorResolvable, ChannelType, GuildMemberRoleManager, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import { SlashCommand } from '../types';

export const command: SlashCommand =  {
    name: 'creer-serveur',
    data: new SlashCommandBuilder()
        .setName('creer-serveur')
        .setDescription('Commande unique aux Investisseurs, permet de créer un serveur Minecraft')
        .addStringOption(option =>
            option.setName('nom')
                .setDescription('Nom de votre serveur Minecraft')
                .setRequired(true)
        ),
    execute: async (interaction: CommandInteraction) => {
        // Avant tout, on vérifie si l'utilisateur a le rôle d'investisseur, booster ou partenaire

        // Récupération des rôles de l'utilisateur
        if (!interaction.member?.roles || !(interaction.member.roles instanceof GuildMemberRoleManager)) {
            await interaction.reply({ content: "Désolé, je ne trouve pas les rôles de l'utilisateur... Merci de contacter un administrateur.", ephemeral: true });
            return;
        }

        const investorRoleId = process.env.INVESTISSEUR_ROLE_ID;
        const boosterRoleId = process.env.BOOSTER_ROLE_ID;
        const partnerRoleId = process.env.PARTENAIRE_ROLE_ID;

        if (!investorRoleId || !boosterRoleId || !partnerRoleId) {
            console.error("Un ou plusieurs IDs de rôle sont manquants dans le fichier .env");
            await interaction.reply({ content: "Une erreur est survenue. Merci de contacter un administrateur.", ephemeral: true });
            return;
        }

        const roles = interaction.member.roles.cache;
        const hasInvestorRole = roles.has(investorRoleId);
        const hasBoosterRole = roles.has(boosterRoleId);
        const hasPartnerRole = roles.has(partnerRoleId);

        if (!hasInvestorRole && !hasBoosterRole && !hasPartnerRole) {
            await interaction.reply({ content: "Désolé, vous n'avez pas la permission d'utiliser cette commande."});
            return;
        }

        // Paramètres de la commande
        const server_name = interaction.options.get('nom')?.value as string;
        // Récupération de BOT_COLOR et VERSION depuis .env
        let bot_color: string;
        let server_creation_categorie_name: string;
        let creation_time: number; // En minutes
        bot_color = process.env.BOT_COLOR || "#FFFFFF";
        creation_time = parseInt(process.env.SERVER_CREATION_TIME_MINUTES || "20"); // En minutes
        if (process.env.SERVER_MANAGMENT_CATEGORY_NAME) {
            server_creation_categorie_name = process.env.SERVER_MANAGMENT_CATEGORY_NAME;
        } else {
            await interaction.reply({ content: "Désolé, la catégorie de gestion des serveurs n'est pas configurée. Merci de contacter un administrateur.", ephemeral: true });
            return;
        }

        let creation_channel_id: string;
        let creation_channel_name: string;
        creation_channel_name = server_name + "-🔧";

        // On crée un salon de création dans la catégorie de gestion des serveurs
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: "Désolé, je ne trouve pas le serveur Discord... Merci de contacter un admininstrateur.", ephemeral: true });
            return;
        }
        const category = guild.channels.cache.find(c => c.name === server_creation_categorie_name && c.type === ChannelType.GuildCategory);
        if (!category) {
            await interaction.reply({ content: "Désolé, je ne trouve pas la catégorie de gestion des serveurs... Merci de contacter un admininstrateur.", ephemeral: true });
            return;
        }
        try {
            const channel = await guild.channels.create({
                name: creation_channel_name,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: [
                    {
                        id: guild.id, // ID du serveur
                        deny: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                    },
                    {
                        id: interaction.user.id, // ID de l'utilisateur qui a créé le salon
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                    },
                ],
            });
            
            // On récupère l'id du salon créé
            creation_channel_id = channel.id;

            // On envoie un message dans le salon de création
            const intro_message = new EmbedBuilder()
            .setTitle(`Okay ${interaction.user.username} !`)
            .setDescription(
                `Tout d'abord, merci d'avoir créé un serveur ! Si jamais tu rencontre le moindre problème, n'hésite pas à contacter <@&1112707976273338470> !
                \nDanse ce salon va arriver une suite de questions afin de configurer ton serveur. Tu à ${creation_time} minutes pour répondre à toutes les questions, sinon le salon sera supprimé et tu devras recommencer !
                \nSache que toute les configurations ici pourront être modifiées par la suite, donc pas de stress ! 🦦
                \nAmuse-toi bien à créer ton serveur Minecraft ${server_name} !`
            )
            .setColor(bot_color as ColorResolvable)
            .setFooter({
                text: "Mineotter",
                iconURL: interaction.client.user?.displayAvatarURL() || '',
            })
            .setTimestamp();

            const startButton = new ButtonBuilder()
                .setCustomId('start_setup')
                .setLabel('Commencer')
                .setStyle(ButtonStyle.Success);
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(startButton);

            await channel.send({
                embeds: [intro_message],
                components: [row.toJSON()]
            });            

            // On ping l'utilisateur qui a créé le salon
            const ping = channel.send({content: `<@${interaction.user.id}>`})
            // On suprime le ping
            setTimeout(() => {
                ping.then((message) => {
                    message.delete();
                });
            }, 10);

            // On envoie un message dans le salon de l'interaction
            const embed = new EmbedBuilder()
            .setTitle("Création de serveur Minecraft")
            .setDescription(`Un salon a été créé le temps de la création du serveur Minecraft, vous pouvez le retrouver ici : <#${creation_channel_id}>.\n\nCelui-ci est temporaire et sera supprimé une fois le serveur créé ou après ${creation_time} minutes.`)
            .setImage("https://s4.gifyu.com/images/bLANr.gif")
            .setColor(bot_color as ColorResolvable)
            .setFooter({
                text: "Mineotter",
                iconURL: interaction.client.user?.displayAvatarURL() || '',
            })
            .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur lors de la création du salon : ", error);
            await interaction.reply({ content: "Désolé, je n'ai pas pu créer le salon de création. Merci de contacter un administrateur.", ephemeral: true });
            return;
        }
    },
};
