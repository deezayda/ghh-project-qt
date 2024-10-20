const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const config = require('../../config.json'); // Ensure your config file contains the Spoonacular API key

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mealplan')
        .setDescription('Generate a meal plan based on time frame, calorie target, diet, and exclusions.')
        .addStringOption(option =>
            option.setName('timeframe')
                .setDescription('Choose time frame of meal plan (day or week)')
                .setRequired(true)
                .addChoices(
                    { name: 'Day', value: 'day' },
                    { name: 'Week', value: 'week' },
                ))
        .addIntegerOption(option =>
            option.setName('targetcalories')
                .setDescription('Set your daily caloric target')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('diet')
                .setDescription('Specify a diet type (e.g., vegetarian, vegan, paleo)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('exclude')
                .setDescription('Comma-separated list of ingredients to exclude (e.g., shellfish, olives)')
                .setRequired(false)),

    async execute(interaction) {
        // Fetch the user inputs from the interaction options
        const timeFrame = interaction.options.getString('timeframe');
        const targetCalories = interaction.options.getInteger('targetcalories');
        const diet = interaction.options.getString('diet') || '';
        const exclude = interaction.options.getString('exclude') || '';

        // Inform the user that the bot is processing the request
        await interaction.reply('Generating your meal plan...');

        // Build the API URL with query parameters
        const apiKey = config.apiKey; // Ensure your API key is stored securely in your config file
        const url = `https://api.spoonacular.com/mealplanner/generate?timeFrame=${timeFrame}&targetCalories=${targetCalories}&diet=${diet}&exclude=${exclude}&apiKey=${apiKey}`;

        try {
            // Make the API request
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch meal plan. Please try again later.');
            }
            const mealPlan = await response.json();

            // Format the response for the user
            const mealPlanEmbed = formatMealPlanEmbed(mealPlan, timeFrame, targetCalories);

            // Send the meal plan details to the user
            await interaction.editReply({ embeds: [mealPlanEmbed] });
        } catch (error) {
            console.error('Error fetching meal plan:', error);
            await interaction.editReply('There was an error generating the meal plan. Please try again later.');
        }
    },
};

// Helper function to format the meal plan response into an embed
function formatMealPlanEmbed(mealPlan, timeFrame, targetCalories) {
    const { EmbedBuilder } = require('discord.js');

    let description = `**Target Calories:** ${targetCalories}\n`;
    description += `**Time Frame:** ${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}\n\n`;

    if (timeFrame === 'day') {
        mealPlan.meals.forEach((meal, index) => {
            description += `**Meal ${index + 1}:** [${meal.title}](${meal.sourceUrl})\n`;
            description += `- Ready in ${meal.readyInMinutes} minutes | Servings: ${meal.servings}\n\n`;
        });
    } else if (timeFrame === 'week') {
        for (const [day, meals] of Object.entries(mealPlan.week)) {
            description += `**${day.charAt(0).toUpperCase() + day.slice(1)}:**\n`;
            meals.meals.forEach((meal, index) => {
                description += `- [${meal.title}](${meal.sourceUrl}) (Ready in ${meal.readyInMinutes} minutes, Servings: ${meal.servings})\n`;
            });
            description += '\n';
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('Your Meal Plan')
        .setDescription(description)
        .setColor(0x00AE86)
        .setFooter({ text: 'Powered by Spoonacular' });

    return embed;
}
