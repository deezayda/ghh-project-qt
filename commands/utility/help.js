const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Lists all available commands and their descriptions'),

    async execute(interaction) {
        // Get the path of the commands folder
        const commandsPath = path.join(__dirname);
        
        // Read all the command files in the commands folder
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        // Initialize an embed
        const helpEmbed = new EmbedBuilder()
            .setColor('#0099ff') // Set embed color
            .setTitle('Available Commands')
            .setDescription('Here is a list of all available commands and their descriptions:')
            .setTimestamp()
            .setFooter({ text: 'Recipe Buddy\'s Commands'});

        // Create a string to hold all commands and descriptions
        let commandList = '';

        // Loop through each command file and add it to the string
        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));

            // Ensure the command has the required properties (data and description)
            if (command.data && command.data.name && command.data.description) {
                commandList += `**/${command.data.name}**: ${command.data.description}\n\n`; // Add a newline for spacing
            }
        }

        // Add the command list to the embed description
        helpEmbed.setDescription(commandList);

        // Reply to the interaction with the embed
        await interaction.reply({ embeds: [helpEmbed] });
    }
};
