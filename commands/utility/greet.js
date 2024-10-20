const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('greet')
		.setDescription('Say hello!'),
	async execute(interaction) {
		const greetings = [
			`Hello ${interaction.user.username}! Type \`/help\` to get started!`,
			`Hey ${interaction.user.username}! Type \`/help\` to get started!`,
			`What up, ${interaction.user.username}! Type \`/help\` to get started!`,
			`Greetings, ${interaction.user.username}! Type \`/help\` to get started!`,
			`Good to see you, ${interaction.user.username}! Type \`/help\` to get started!`,
		];
		
		const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
		await interaction.reply(randomGreeting);
	},
};
