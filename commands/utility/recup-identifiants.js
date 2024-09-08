const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recup-identifiants')
        .setDescription('Afin de récupérer les identifiants de différents services.')
        .addStringOption(option =>
            option.setName('service')
                .setDescription('Le service pour lequel vous souhaitez récupérer les identifiants.')
                .setRequired(true)
                .addChoice('FTP', 'ftp')
        ),
    async execute(interaction) {
        const service = interaction.options.getString('service');
        const user = interaction.user;
        
        await interaction.reply(`Pour le moment, cette commande n'est pas encore disponible. Merci de réessayer plus tard. 🦦`);
    },
};
