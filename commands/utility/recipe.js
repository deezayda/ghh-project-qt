const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json');

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
    
    async execute(interaction) {
        const ingredients = interaction.options.getString('ingredients');
        const recipeId = interaction.options.getInteger('id');

        if (!ingredients && !recipeId) {
            await interaction.reply('Please add some ingredients or enter a recipe ID');
            return;
        }
        
        if (recipeId) {
            const recipeDetails = await getRecipeDetails(recipeId);
            if (!recipeDetails) {
                await interaction.reply('No details found for the given recipe ID');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(recipeDetails.title || 'Title not available')
                .setImage(recipeDetails.image || 'https://example.com/default-image.jpg')
                .setDescription(`**Ingredients:**\n${recipeDetails.extendedIngredients.map(ing => `${ing.name}: ${ing.amount} ${ing.unit}`).join('\n')}\n\n**Instructions:**\n${recipeDetails.instructions || 'No instructions available.'}`)
                .setFooter({ text: `Recipe ID: ${recipeDetails.id}` })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
        } else if (ingredients) {
            await interaction.reply(`Searching for recipes with: ${ingredients}`);
            const timeOptions = new StringSelectMenuBuilder()
                .setCustomId('time_filter')
                .setPlaceholder('Select cooking time')
                .addOptions([
                    {
                        label: '30 minutes and under',
                        value: '30',
                    },
                    {
                        label: '1-3 hours',
                        value: '180',
                    },
                    {
                        label: 'Overnight meals',
                        value: '1440',
                    },
                ]);

            const row = new ActionRowBuilder().addComponents(timeOptions);

            await interaction.followUp({ content: 'Please select a cooking time:', components: [row] });

            
            const filter = i => i.customId === 'time_filter' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                const maxReadyTime = i.values[0];
                const recipes = await getRecipes(ingredients, maxReadyTime);
                const limitedRecipes = recipes.slice(0, 5);

                if (limitedRecipes.length > 0) {
                    const embed = embedDisplay(limitedRecipes[0], 1, limitedRecipes.length);
                    const navRow = new ActionRowBuilder()
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

                    await i.update({ content: `Here are the recipes under ${maxReadyTime} minutes:`, embeds: [embed], components: [navRow] });
                    pageNav(i, limitedRecipes);
                } else {
                    await i.update({ content: 'No recipes found with the given ingredients for that time.', embeds: [], components: [] });
                }
                collector.stop();
            });
        } else {
            await interaction.reply('Please provide either ingredients or a recipe ID.');
        }
    },
};

// embed it so prettier than just plain text //
function embedDisplay(recipe, currentIndex, totalRecipes) {
    const ingredientsList = recipe.ingredients && recipe.ingredients.length > 0 
        ? recipe.ingredients.join(', ') : 'Ingredients data not available';

    const embed = new EmbedBuilder()
        .setTitle(recipe.title || 'Title not available')
        .setImage(recipe.image || 'https://example.com/default-image.jpg')
        .setDescription(`Ingredients: ${ingredientsList}\n\nFor more info, use /recipe id: ${recipe.id}`)
        .setFooter({ text: `Recipe ${currentIndex} of ${totalRecipes} | ID: ${recipe.id}` });
    return embed;
}

// page navigation w/ buttons //
async function pageNav(interaction, recipes) {
    let currentIndex = 0;
    const filter = i => ['prev', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'next') {
            currentIndex = Math.min(currentIndex + 1, recipes.length - 1);
        } else if (i.customId === 'prev') {
            currentIndex = Math.max(currentIndex - 1, 0);
        }

        const embed = embedDisplay(recipes[currentIndex], currentIndex + 1, recipes.length);
        const navRow = new ActionRowBuilder()
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

        await i.update({ embeds: [embed], components: [navRow] });
    });
}

// use Spoonacular API to get recipes based on ingreds and prep/cook time
async function getRecipes(ingredients, maxReadyTime) {
    const apiKey = config.apiKey; 
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=5&ranking=1&maxReadyTime=${maxReadyTime}&ignorePantry=true&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API error:', errorData);
            return [];
        }

        const recipes = await response.json();

        if (!Array.isArray(recipes)) {
            console.error('Unexpected API response format:', recipes);
            return []; // Return an empty array if recipes is not an array
        }

        // recipe details via ID //
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
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
}

// recipe info //
async function getRecipeDetails(recipeId) {
    const apiKey = config.apiKey;
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const recipe = await response.json();
        return recipe;
    } catch (error) {
        console.error('Error fetching recipe details:', error);
        return null;
    }
}
