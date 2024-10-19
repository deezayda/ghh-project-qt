require('dotenv').config()
const axios = require('axios')

const apiClient = axios.create({
    baseURL: "https://api.spoonacular.com",
    headers: {
        'Content-type': "application/json",
    },
    params: {
        apiKey: process.env.SPOONACULAR_API_KEY
    }
});

// Function to fetch 10 recipes with maxReadyTime of 30 mins
async function getQuickRecipes() {
    const maxReadyTime = 30; // Max cooking time in minutes
    const numberOfRecipes = 10; // Number of recipes to retrieve

    try {
        // Make the API request with custom parameters
        const response = await apiClient.get('/recipes/complexSearch', {
            params: {
                maxReadyTime: maxReadyTime,
                number: numberOfRecipes
            }
        });

        const recipes = response.data.results;

        // Log the recipe titles and IDs
        console.log(`Fetched ${recipes.length} recipes:`);
        recipes.forEach((recipe, index) => {
            console.log(`${index + 1}. ${recipe.title} (ID: ${recipe.id})`);
        });

        // Return the recipes if needed
        return recipes;

    } catch (error) {
        console.error('Error fetching recipes:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { getQuickRecipes };