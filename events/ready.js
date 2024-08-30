const { Events, ActivityType, Colors, ChannelType, PermissionFlagsBits } = require('discord.js');
const { categoryName, guildId, roleName } = require('../config.json'); // Ajoutez roleName dans votre config.json
const fetch = require('node-fetch');
const fs = require('fs');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Bot connecté, description définie
        console.log(`[INFO] Connecté en tant que ${client.user.tag} !`);

        client.user.setActivity({
            type: ActivityType.Custom,
            name: 'customstatus',
            state: '🦦 Je gère les serveurs Minecraft !'
        });

        // Ici ont crée des salons et un rôle pour les logs
        const channelNames = ['❌logs-erreur-mineotter', '📃logs-mineotter', "🍔mcmyadmin-primaire", "🍟mcmyadmin-secondaire"];
        
        try {
            const guild = client.guilds.cache.first(); // Identifiant du serveur
            const channelsDiscord = guild.channels.cache.map(channel => channel.name);

            // Vérifie si le rôle existe déjà
            let role = guild.roles.cache.find(r => r.name === roleName);
            if (!role) {
                role = await guild.roles.create({
                    name: roleName,
                    color: Colors.Blue,
                    reason: 'Role pour les logs Minotter',
                });
                console.log(`[INFO] Rôle "${roleName}" créé !`);
            } else {
                // console.log(`Le rôle "${roleName}" existe déjà`);
            }

            // Vérifie si la catégorie existe déjà
            let category = guild.channels.cache.find(channel => channel.name === categoryName && channel.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({
                    name: categoryName,
                    type: ChannelType.GuildCategory,
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
                console.log(`[INFO] Catégorie "${categoryName}" créée avec les permissions adéquates !`);
            } else {
                // console.log(`La catégorie "${categoryName}" existe déjà`);
            }

            // Crée des salons à l'intérieur de la catégorie avec les mêmes permissions
            for (const channelName of channelNames) {
                if (channelsDiscord.includes(channelName)) {
                    // console.log(`Le salon "${channelName}" existe déjà`);
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
                    console.log(`[INFO] Salon "${channelName}" créé !`);
                }
            }
        } catch (error) {
            console.error(`[ERROR] Erreur lors de la création d'un salons : ${error}`);
        }

        // Et la vérification de si l'API est bien en ligne
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch('https://api.antredesloutres.fr/');
            const data = await response.json();
            console.log(`[INFO] API bien en ligne 👍`);
        } catch (error) {
            console.error('[ERROR] Erreur lors de la récupération des données:', error);
            // Envoie un message dans le salon de logs
            const guild = client.guilds.cache.get(guildId);
            const channel = guild.channels.cache.find(channel => channel.name === '❌logs-erreur-mineotter');
            channel.send(`**[ERROR]** Erreur lors de la récupération des données sur l'API : ${error}`);
        }
    },
};