const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pokemon')
		.setDescription('Choose your pokemon!'),
	async execute(interaction) {
		const select = new StringSelectMenuBuilder()
			.setCustomId('starter')
			.setPlaceholder('Make a selection!')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Bulbasaur')
					.setDescription('The dual-type Grass/Poison Seed Pokémon.')
					.setValue('bulbasaur'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Charmander')
					.setDescription('The Fire-type Lizard Pokémon.')
					.setValue('charmander'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Squirtle')
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue('squirtle'),
			);

		const row = new ActionRowBuilder()
			.addComponents(select);

		await interaction.reply({
			content: 'Choose your starter!',
			components: [row],
		});

        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isStringSelectMenu()) return;
        
            // Check if the select menu is the one we created
            if (interaction.customId === 'selectMenu') {
                const selection = interaction.values[0];  // Get the selected value
                // Do something based on the selection
                if (selection === 'bulbasuar') {
                    await interaction.reply('You selected Option 1!');
                } else if (selection === 'charmander') {
                    await interaction.reply('You selected Option 2!');
                } else if (selection === 'squirtle') {
                    await interaction.reply('You selected Option 3!');
                }
            }
        });
	},
};