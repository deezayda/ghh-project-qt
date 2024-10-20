const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config.json');

// Function to call Spoonacular's Dish Pairing for Wine endpoint
async function getDishPairingForWine(wineType) {
    const apiKey = config.spoonacularAPI;

    try {
        const response = await axios.get(`https://api.spoonacular.com/food/wine/dishes`, {
            params: {
                wine: wineType,
                apiKey: apiKey
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching dish pairing:', error.response ? error.response.data : error.message);
        throw new Error('Could not retrieve dish pairing. Please try again later.');
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dishpair')
        .setDescription('Find a dish that pairs well with a specific wine')
        .addStringOption(option =>
            option.setName('wine')
                .setDescription('Enter the type of wine (e.g., merlot, chardonnay)')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Get the wine type from the user's input
        const wineType = interaction.options.getString('wine');

        // Defer the reply to give time for the API call
        await interaction.deferReply();

        try {
            // Get the dish pairing for the given wine type
            const pairingData = await getDishPairingForWine(wineType);

            // Check if we have any pairings
            if (pairingData && pairingData.pairings && pairingData.pairings.length > 0) {
                const dishes = pairingData.pairings.join(', ');

                // Send the response with the paired dishes
                await interaction.editReply(`Here are some dishes that pair well with **${wineType}**: ${dishes}`);
            } else {
                // If no pairings found
                await interaction.editReply(`Sorry, I couldn't find any dish pairings for **${wineType}**.`);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('There was an error fetching the dish pairing. Please try again later.');
        }
    }
};