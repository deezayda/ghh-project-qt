const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists selected available commands and their descriptions'),

    async execute(interaction) {
        // Define a whitelist of specific commands you want to show
        const allowedCommands = ['greet', 'mealplan', 'recipe', 'timer', 'winepairing'];

        // Create the help embed
        const helpEmbed = new EmbedBuilder()
            .setColor('#3477eb')
            .setTitle('Available Commands')
            .setDescription('Here is a list of selected commands and their descriptions:')
            .setTimestamp()
            .setFooter({ text: 'Meal Manager\'s Commands' });

        let commandList = '';

        for (const commandName of allowedCommands) {
            try {
                const command = require(path.join(__dirname, `${commandName}.js`));
                
                if (command.data && command.data.name && command.data.description) {
                    commandList += `\`/${command.data.name}\`: ${command.data.description}\n\n`;
                }
            } catch (error) {
                console.error(`Could not load command: ${commandName}`, error);
            }
        }

        helpEmbed.setDescription(commandList || 'No commands available.');

        await interaction.reply({ embeds: [helpEmbed] });
    }
};
