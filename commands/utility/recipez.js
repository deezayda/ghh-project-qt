const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('recipez')
        .setDescription('Find possible recipes with available ingredients!')
        .addStringOption(option => 
            option.setName('ingredients')
                .setDescription('Enter the ingredients you have – separated by commas')
                .setRequired(true)),
    
    async execute(interaction) {
        console.log("GOING INTO EXECUTION")
        const ingredients = interaction.options.getString('ingredients');
        await interaction.reply(`Searching for recipes with: ${ingredients}`);

        const recipes = await getRecipes(ingredients);
        const limitedRecipes = recipes.slice(0, 5); // 5 per query
        
        if (limitedRecipes.length > 0) {
            // embedded display instead of just text //
            console.log("Before Embed Display")
            const embed = embedDisplay(limitedRecipes[0], 1, limitedRecipes.length);
            console.log("After Embed Console")
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
                    // new ButtonBuilder()
                    //     .setCustomId('Details')
                    //     .setLabel('Details')
                    //     .setStyle(ButtonStyle.Secondary)
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
        // .setDescription(`Ingredients: ${ingredientsList}`)
        // .setFooter({ text: `Recipe ${currentIndex} of ${totalRecipes}` });
        .setDescription(`**Ingredients**: ${ingredientsList}\n\n**Instructions**: ${recipe.instructions}`)
        .setURL(recipe.sourceUrl) // Makes the title clickable with the link to the source
        .setFooter({ text: `Recipe ${currentIndex} of ${totalRecipes}` });
    return embed;
}

async function detailsButton(interaction, recipe) {
    try {
        // Create a new embed with the details of the recipe
        const ingredientsList = recipe.ingredients && recipe.ingredients.length > 0 
            ? recipe.ingredients.join(', ') 
            : 'Ingredients data not available';

        const instructions = recipe.instructions || 'Instructions not available';

        const detailsEmbed = new EmbedBuilder()
            .setTitle(`Details for ${recipe.title}`)
            .setDescription(`**Ingredients:**\n${ingredientsList}\n\n**Instructions:**\n${instructions}`)
            .setImage(recipe.image)
            .setFooter({ text: 'Recipe Details' });

        // Create a row with a "Back" button
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back')
                    .setLabel('Back')
                    .setStyle(ButtonStyle.Secondary)
            );
        
            return detailsEmbed;

        // // Update the interaction to show the details page
        // await interaction.update({ embeds: [detailsEmbed], components: [row] });


        // Set up a collector to handle the "Back" button
        // const filter = i => i.customId === 'back' && i.user.id === interaction.user.id;
        // const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        // collector.on('collect', async i => {
        //     const embed = embedDisplay(recipe, 1, 1); // Display the single recipe again
        //     const row = new ActionRowBuilder()
        //         .addComponents(
        //             new ButtonBuilder()
        //                 .setCustomId('prev')
        //                 .setLabel('Previous')
        //                 .setStyle(ButtonStyle.Primary)
        //                 .setDisabled(true),
        //             new ButtonBuilder()
        //                 .setCustomId('next')
        //                 .setLabel('Next')
        //                 .setStyle(ButtonStyle.Primary)
        //                 .setDisabled(true),
        //             new ButtonBuilder()
        //                 .setCustomId('details')
        //                 .setLabel('Details')
        //                 .setStyle(ButtonStyle.Secondary)
        //         );
        //     await i.update({ embeds: [embed], components: [row] });
        // });
    } catch (error) {
        console.error('Error updating interaction:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error showing the details.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error showing the details.', ephemeral: true });
        }
    }
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
        else if (i.customId === 'Details') {
            await detailsButton(i, recipes[currentIndex]);
        }
        else {
            console.log('No Interaction');
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
                    .setDisabled(currentIndex === recipes.length - 1),
                new ButtonBuilder()
                    .setCustomId('details')
                    .setLabel('Details')
                    .setStyle(ButtonStyle.Secondary)    
            );
        await i.update({ embeds: [embed], components: [row] });
    });
}

async function getRecipes(ingredients) {
    const apiKey  = config.apiKey; 
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=5&apiKey=${apiKey}`;

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
                ingredients: detailData.extendedIngredients.map(ing => ing.name),
                instructions: detailData.instructions || 'Instructions not available', // Fetching instructions
                sourceUrl: detailData.sourceUrl || 'URL not available' // Fetching source URL
            };
        }));
        console.log('End of Get Recipes Function')
        return detailedRecipes;
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
    }
}


