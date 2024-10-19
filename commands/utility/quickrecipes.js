const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config.json');

async function getQuickRecipes() {
    const maxReadyTime = 30; // Max cooking time in minutes
    const numberOfRecipes = 10; // Number of recipes to retrieve

    try {
        // Make the API request with custom parameters
        const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
            params: {
                maxReadyTime: maxReadyTime,
                number: numberOfRecipes,
                sort: 'random',
                apiKey: config.spoonacularAPI  // Use your API key here
            }
        });

        const recipes = response.data.results;  // Extract recipes from response
        return recipes;  // Return recipes
    } catch (error) {
        console.error('Error fetching recipes:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getquickrecipes')
        .setDescription('Get 10 recipes that are ready in 30 minutes or less!'),

    async execute(interaction) {
        // Acknowledge the interaction
        await interaction.deferReply();

        try {
            // Call the getQuickRecipes function
            const recipes = await getQuickRecipes();

            // Format the recipe data for the Discord response
            const recipeList = recipes.map((recipe, index) => 
                `${index + 1}. [${recipe.title}](https://spoonacular.com/recipes/${recipe.id}/information?apiKey=${config.spoonacularAPI})`
            ).join('\n');

            // Reply to the interaction with the formatted recipe list
            await interaction.editReply(`Here are 10 quick recipes:\n\n${recipeList}`);
        
        } catch (error) {
            console.error(error);
            await interaction.editReply('Sorry, I could not fetch the recipes at this time.');
        }
    },
};