//  Returns the timestamp that the server was created

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guild')
		.setDescription('Provides the date the serve was founded'),
	async execute(interaction) {
		await interaction.reply(`This server was founded on ${interaction.guild.createdAt}`);
	},
};