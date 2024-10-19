const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipe')
        .setDescription('Get recipes based on the ingredients you have!')
        .addStringOption(option => 
            option.setName('ingredients')
                .setDescription('Enter the ingredients you have – separated by commas')
                .setRequired(true)),
    
    async execute(interaction) {
        const ingredients = interaction.options.getString('ingredients');
        
        await interaction.reply(`Searching for recipes with: ${ingredients}`);

        const recipes = await getRecipes(ingredients);
        
        if (recipes && recipes.length > 0) {
            let recipeList = recipes.map((r, i) => `${i + 1}. **${r.title}**`).join('\n');
            await interaction.followUp(`Here are some recipes you can try:\n${recipeList}`);
        } else {
            await interaction.followUp('Sorry, no recipes were found with those ingredients.');
        }
    },
};

// Helper function to fetch recipes (You can use an API like Spoonacular)
async function getRecipes(ingredients) {
    const apiKey = 'e5a045dd0b5644e7ac01fe865488352a'; // Add your API key here
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&apiKey=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.map(recipe => ({
            title: recipe.title,
            id: recipe.id,
            image: recipe.image
        }));
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
}
