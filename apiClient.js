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

