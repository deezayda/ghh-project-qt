const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json');
const savedRecipes = {};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipe')
        .setDescription('Find possible recipes with available ingredients or get more info on a recipe via its ID')
        .addStringOption(option => 
            option.setName('ingredients')
                .setDescription('Enter the ingredients you have – separated by commas')
                .setRequired(false))
        .addIntegerOption(option => 
            option.setName('id')
                .setDescription("Enter the unique ID for the recipe you're searching for")
                .setRequired(false)), 
    
    async execute(interaction){
        const ingredients = interaction.options.getString('ingredients');
        const recipeId = interaction.options.getInteger('id');

        if (!ingredients && !recipeId) {
            await interaction.reply('Please add some ingredients or enter a recipe ID');
            return;
        }
        
        if (recipeId){
            const recipeDetails = await getRecipeDetails(recipeId);
            if (!recipeDetails){
                await interaction.reply('No details found for the given recipe ID');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x4CAF50)
                .setTitle(recipeDetails.title || 'Title not available')
                .setImage(recipeDetails.image || 'https://example.com/default-image.jpg')
                .setDescription(`**Ingredients:**\n${recipeDetails.extendedIngredients.map(ing => `${ing.name}: ${ing.amount} ${ing.unit}`).join('\n')}\n\n**Instructions:**\n${recipeDetails.instructions || 'No instructions available.'}`)
                .setFooter({ text: `Recipe ID: ${recipeDetails.id}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        }
        else if (ingredients){
            await interaction.reply(`Searching for recipes with: ${ingredients}`);
            const recipes = await getRecipes(ingredients);
            const limitedRecipes = recipes.slice(0, 5);

            if (limitedRecipes.length > 0){
                const embed = embedDisplay(limitedRecipes[0], 1, limitedRecipes.length, ingredients);
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                    );

                await interaction.followUp({ embeds: [embed], components: [row] });
                pageNav(interaction, limitedRecipes, ingredients);
            } 
            else{
                await interaction.followUp('No recipes were found with the given ingredients');
            }
        } 
        else{
            await interaction.reply('Please provide either ingredients or a recipe ID.');
        }
    },
};


// embed it so prettier than just plain text //
function embedDisplay(recipe, currentIndex, totalRecipes, userIngredients){
    const userIngredientsList = userIngredients.split(',').map(ing => ing.trim().toLowerCase());

    const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
    const missingIngredients = recipeIngredients.filter(ing => !userIngredientsList.includes(ing));

    const ingredientsList = recipeIngredients.length > 0 ? recipeIngredients.join(', ') : 'Ingredients data not available';
    const shoppingList = missingIngredients.length > 0 
        ? missingIngredients.map(ing => `• ${ing}`).join('\n') 
        : 'You have all the ingredients!';

    const embed = new EmbedBuilder()
        .setColor(0x4287f5)
        .setTitle(recipe.title || 'Title not available')
        .setImage(recipe.image || 'https://example.com/default-image.jpg')
        .setDescription(`**Ingredients:** ${ingredientsList}\n\n**Need to buy:**\n${shoppingList}\n\nFor more info, use \`/recipe id: ${recipe.id}\``)
        .setFooter({ text: `Recipe ${currentIndex} of ${totalRecipes} | ID: ${recipe.id}` });
    return embed;
}


// page navigation w/ buttons //
async function pageNav(interaction, recipes, userIngredients){
    let currentIndex = 0;
    const filter = i => ['prev', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'next'){
            currentIndex = Math.min(currentIndex + 1, recipes.length - 1);
        } 
        else if (i.customId === 'prev'){
            currentIndex = Math.max(currentIndex - 1, 0);
        }

        const embed = embedDisplay(recipes[currentIndex], currentIndex + 1, recipes.length, userIngredients);
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentIndex === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentIndex === recipes.length - 1)
            );
        await i.update({ embeds: [embed], components: [row] });
    });
}

// use Spoonacular API to get recipes based on ingreds and prep/cook time
async function getRecipes(ingredients) {
    const apiKey = config.apiKey; 
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=5&ranking=1&ignorePantry=true&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const recipes = await response.json();

        if (!Array.isArray(recipes)) {
            console.error('Unexpected response format:', recipes);
            return []; 
        }

        const detailedRecipes = await Promise.all(recipes.map(async recipe => {
            const recipeId = recipe.id;
            const detailUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;
            const detailResponse = await fetch(detailUrl);
            const detailData = await detailResponse.json();

            return {
                title: detailData.title,
                image: detailData.image,
                ingredients: detailData.extendedIngredients.map(ing => ing.name),
                id: detailData.id 
            };
        }));

        return detailedRecipes;
    } 
    catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
}


// recipe info //
async function getRecipeDetails(recipeId){
    const apiKey = config.apiKey;
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;

    try{
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const recipe = await response.json();
        return recipe;
    } 
    catch (error){
        console.error('Error fetching recipe details:', error);
        return null;
    }
}
