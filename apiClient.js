require('dotenv').config(); // Loads the environment
const axios = require('axios')

// Creating an axios instance (request) with base URL and API Key
const apiClient = axios.create({
    baseURL: 'https://api.spoonacular.com', 
    headers: {
        'Content-Type': 'application/json',
    },
    params: {
        apiKey: process.env.SPOONACULAR_API_KEY
    }
    });

// Searching for Recipes Based on Keyword, Returns 5
async function searchRecipes(query) {
    try {
        const response = await apiClient.get('/recipes/complexSearch', {
            params: {
                query: query,
                number: 5 
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching recipes:', error.response ? error.response.data : error.message);
        return [];
    }
}

// // Function to search for recipes based on a query and minimum protein requirement
// async function searchProteinRecipes(query, minProtein = 20) {
//     try {
//         const response = await apiClient.get('/recipes/complexSearch', {
//             params: {
//                 query: query,
//                 minProtein: minProtein, // Minimum grams of protein per serving
//                 number: 5 // Number of results to return
//             }
//         });
//         return response.data.results;
//     } catch (error) {
//         console.error('Error fetching recipes:', error.response ? error.response.data : error.message);
//         return [];
//     }
// }

// To be used in other files
module.exports = { searchRecipes };