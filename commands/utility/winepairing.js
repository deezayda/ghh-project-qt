const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json'); // Make sure your config file contains the Spoonacular API key

module.exports = {
    data: new SlashCommandBuilder()
        .setName('winepairing')
        .setDescription('Find a wine that goes well with a given dish')
        .addStringOption(option =>
            option.setName('food')
                .setDescription('Enter the dish, ingredient, or cuisine')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('maxprice')
                .setDescription('Set a maximum price for the wine recommendation in USD')
                .setRequired(false)),

    async execute(interaction) {
        // Get user input from the interaction options
        const food = interaction.options.getString('food');
        const maxPrice = interaction.options.getInteger('maxprice');

        // Inform the user that the bot is processing the request
        await interaction.reply(`Searching for wine pairing recommendations for: ${food}...`);

        // Build the API URL with query parameters
        const apiKey = config.apiKey; // Ensure your API key is stored securely in your config file
        const url = `https://api.spoonacular.com/food/wine/pairing?food=${encodeURIComponent(food)}${maxPrice ? `&maxPrice=${maxPrice}` : ''}&apiKey=${apiKey}`;

        try {
            // Make the API request
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch wine pairing. Please try again later.');
            }
            const winePairing = await response.json();

            // Check if we got a pairing recommendation
            if (!winePairing.pairedWines || winePairing.pairedWines.length === 0) {
                await interaction.editReply(`No wine pairing found for "${food}". Try another dish or ingredient.`);
                return;
            }

            // Format the response for the user
            const pairingEmbed = formatWinePairingEmbed(winePairing, food);

            // Send the wine pairing details to the user
            await interaction.editReply({ embeds: [pairingEmbed] });
        } catch (error) {
            console.error('Error fetching wine pairing:', error);
            await interaction.editReply('There was an error finding a wine pairing. Please try again later.');
        }
    },
};

// Helper function to format the wine pairing response into an embed
function formatWinePairingEmbed(winePairing, food) {
    const { EmbedBuilder } = require('discord.js');

    let description = `**Recommended Wines for ${food}:**\n`;
    winePairing.pairedWines.forEach(wine => {
        description += `- ${wine}\n`;
    });

    if (winePairing.productMatches && winePairing.productMatches.length > 0) {
        description += `\n**Wine Details:**\n`;
        winePairing.productMatches.forEach(wine => {
            description += `- **${wine.title}** (${wine.price})\n`;
            description += `  ${wine.description}\n`;
            description += `[More Info](${wine.link})\n\n`;
        });
    } else {
        description += `\nNo specific wine products were found for your price range.`;
    }

    const embed = new EmbedBuilder()
        .setTitle('Wine Pairing Recommendation')
        .setDescription(description)
        .setColor(0xA52A2A) // Wine-like color
        .setFooter({ text: 'Powered by Spoonacular' });

    return embed;
}