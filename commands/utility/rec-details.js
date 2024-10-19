const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipe-details')
        .setDescription('Get detailed information about a recipe')
        .addIntegerOption(option => 
            option.setName('id')
                .setDescription('Enter the recipe ID')
                .setRequired(true)),
    
    async execute(interaction) {
        const recipeId = interaction.options.getInteger('id');

        const details = await getRecipeDetails(recipeId);

        if (details) {
            await interaction.reply(`**${details.title}**\nIngredients: ${details.ingredients}\nInstructions: ${details.instructions}`);
        } else {
            await interaction.reply('Sorry, no details found for that recipe.');
        }
    },
};

async function getRecipeDetails(recipeId) {
    const apiKey = 'e5a045dd0b5644e7ac01fe865488352a';
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            title: data.title,
            ingredients: data.extendedIngredients.map(i => i.original).join(', '),
            instructions: data.instructions || 'No instructions available',
        };
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}
