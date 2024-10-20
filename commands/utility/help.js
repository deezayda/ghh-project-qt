const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available commands and their descriptions'),

    async execute(interaction) {
        const commandsPath = path.join(__dirname);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Available Commands')
            .setDescription('Here is a list of all available commands and their descriptions:')
            .setTimestamp()
            .setFooter({ text: 'Recipe Buddy\'s Commands'});

        let commandList = '';
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));

            if (command.data && command.data.name && command.data.description) {
                commandList += `**/${command.data.name}**: ${command.data.description}\n\n`;
            }
        }

        helpEmbed.setDescription(commandList);
        await interaction.reply({ embeds: [helpEmbed] });
    }
};