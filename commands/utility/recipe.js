const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipe')
        .setDescription('Find possible recipes with available ingredients!')
        .addStringOption(option => 
            option.setName('ingredients')
                .setDescription('Enter the ingredients you have – separated by commas')
                .setRequired(true)),
    
    async execute(interaction) {
        const ingredients = interaction.options.getString('ingredients');
        await interaction.reply(`Searching for recipes with: ${ingredients}`);

        const recipes = await getRecipes(ingredients);
        const limitedRecipes = recipes.slice(0, 5); // 5 per query
        
        if (limitedRecipes.length > 0) {
            // embedded display instead of just text //
            const embed = embedDisplay(limitedRecipes[0], 1, limitedRecipes.length);
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
            pageNav(interaction, limitedRecipes); // flipping b/w pgs – like recipe book
        }
        else {
            await interaction.followUp('Sorry, no recipes were found with the listed ingredients.');
            // potensh add a continuation like 'try again?' button click –> user input field
        }
    },
};

function embedDisplay(recipe, currentIndex, totalRecipes) {
    const ingredientsList = recipe.ingredients && recipe.ingredients.length > 0 
        ? recipe.ingredients.join(', ') : 'Ingredients data not available';

    const embed = new EmbedBuilder()
        .setTitle(recipe.title || 'Title not available')
        .setImage(recipe.image || 'https://example.com/default-image.jpg')
        .setDescription(`Ingredients: ${ingredientsList}`)
        .setFooter({ text: `Recipe ${currentIndex} of ${totalRecipes}` });
    return embed;
}

// left and right buttons for page navigation //
async function pageNav(interaction, recipes) {
    let currentIndex = 0;
    const filter = i => ['prev', 'next'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'next') {
            currentIndex = Math.min(currentIndex + 1, recipes.length - 1);
        } 
        else if (i.customId === 'prev') {
            currentIndex = Math.max(currentIndex - 1, 0);
        }

        const embed = embedDisplay(recipes[currentIndex], currentIndex + 1, recipes.length);
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

async function getRecipes(ingredients) {
    const apiKey  = config.apiKey; 
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=5&ranking=1&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        const recipes = await response.json();

        const detailedRecipes = await Promise.all(recipes.map(async recipe => {
            const recipeId = recipe.id;
            const detailUrl = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}`;
            const detailResponse = await fetch(detailUrl);
            const detailData = await detailResponse.json();

            return {
                title: detailData.title,
                image: detailData.image,
                ingredients: detailData.extendedIngredients.map(ing => ing.name)
            };
        }));

        return detailedRecipes;
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
}
