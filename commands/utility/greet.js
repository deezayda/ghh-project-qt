const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('greeting')
		.setDescription('Say hello!'),
	async execute(interaction) {
		const greetings = [
			`Hello ${interaction.user.username}!`,
			`Hey ${interaction.user.username}!`,
			`What up, ${interaction.user.username}!`,
			`Greetings, ${interaction.user.username}!`,
			`Good to see you, ${interaction.user.username}!`,
		];
		
		const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
		await interaction.reply(randomGreeting);
	},
};
