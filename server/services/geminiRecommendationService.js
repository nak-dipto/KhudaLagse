import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Get personalized food recommendations using Gemini
 */
export const getPersonalizedRecommendations = async (items, preferences) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" // Free tier
    });
    
    const prompt = buildRecommendationPrompt(items, preferences);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return parseGeminiResponse(text);
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
};

/**
 * Build comprehensive prompt for Gemini recommendations
 */
const buildRecommendationPrompt = (items, preferences) => {
  const { likes = [], dislikes = [], allergies = [] } = preferences;
  
  return `
    You are a personalized food recommendation system. Your task is to analyze menu items and recommend the best ones based on user preferences.

    USER PREFERENCES:
    =================
    👍 LIKES: ${likes.length > 0 ? likes.join(', ') : 'None specified'}
    👎 DISLIKES: ${dislikes.length > 0 ? dislikes.join(', ') : 'None specified'}
    ⚠️ ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None specified'}

    IMPORTANT ALLERGEN RELATIONSHIPS - YOU MUST UNDERSTAND THESE:
    ===============================================================
    - If user is allergic to "nuts", that includes ALL of these: almonds, cashews, walnuts, pecans, hazelnuts, pistachios, macadamia nuts, pine nuts, chestnuts, brazil nuts, mixed nuts, nut extracts, nut oils, nut butters, praline, marzipan, frangipane, nutella, nut-based sauces
    - If user is allergic to "peanuts", that includes: peanuts, peanut butter, groundnuts, peanut oil, arachis oil, peanut sauce, satay sauce
    - If user is allergic to "dairy", that includes: milk, cheese, butter, cream, yogurt, whey, casein, lactose, ghee, paneer, sour cream, cream cheese, cottage cheese, buttermilk, ice cream, milk chocolate
    - If user is allergic to "gluten", that includes: wheat, barley, rye, oats, spelt, flour, bread, pasta, noodles, couscous, bulgur, seitan, malt, beer
    - If user is allergic to "soy", that includes: soy, soya, tofu, tempeh, edamame, miso, soy sauce, tamari, teriyaki, hoisin, soybean oil, soy lecithin
    - If user is allergic to "eggs", that includes: eggs, egg whites, egg yolks, mayonnaise, aioli, hollandaise, meringue, custard, eggnog, albumin
    - If user is allergic to "shellfish", that includes: shrimp, prawn, crab, lobster, crayfish, clam, mussels, oysters, scallops
    - If user is allergic to "fish", that includes: salmon, tuna, mackerel, cod, sardines, anchovies, fish sauce, roe, caviar
    - If user is allergic to "sesame", that includes: sesame seeds, sesame oil, tahini, halva, hummus (often contains tahini), baba ganoush

    MENU ITEMS TO ANALYZE:
    ======================
    ${items.map((item, index) => {
      return `
      ITEM ${index + 1}:
      - ID: ${item._id || index}
      - Name: ${item.name || 'Unknown'}
      - Description: ${item.description || 'No description'}
      - Ingredients: ${item.ingredients ? item.ingredients.join(', ') : 'Not listed'}
      - Cuisine: ${item.cuisine || 'Various'}
      - Meal Type: ${item.mealType || 'Any'}
      - Price: ${item.price || 0} BDT
      - Restaurant: ${item.restaurant?.name || 'Unknown'}
      `;
    }).join('\n')}

    YOUR TASK:
    ==========
    For each menu item, analyze it and provide:
    
    1. ALLERGEN CHECK: Does it contain ANY of the user's allergies? Use the allergen relationships above!
    2. LIKE MATCH: How well does it match the user's likes? (0-100)
    3. DISLIKE CHECK: Does it contain any disliked ingredients?
    4. OVERALL SCORE: Calculate a score from 0-100 based on:
       - Base score 50
       - +10 for each like match (max +40)
       - -15 for each dislike match
       - -100 if ANY allergen detected (automatic 0)
    
    5. RECOMMENDATION REASON: A brief explanation of why this item was recommended or rejected

    Return a JSON array with this EXACT structure (no other text):
    [
      {
        "id": "string",
        "name": "string",
        "allergenDetected": boolean,
        "allergens": ["list of detected allergens"],
        "likeScore": number (0-100),
        "dislikeDetected": boolean,
        "dislikes": ["list of disliked items found"],
        "finalScore": number (0-100),
        "reason": "brief explanation for the user",
        "shouldRecommend": boolean (true if finalScore > 50 and no allergens)
      }
    ]

    IMPORTANT RULES:
    - If allergenDetected is true, finalScore MUST be 0 and shouldRecommend MUST be false
    - Be intelligent about semantic relationships (e.g., "cashews" counts as "nuts" allergy)
    - Consider that "likes" might be cuisines, ingredients, or dish types
    - Be thorough in checking ingredients, names, and descriptions
    - Only recommend items with finalScore > 50 and no allergens
  `;
};

/**
 * Parse Gemini's JSON response
 */
const parseGeminiResponse = (text) => {
  try {
    // Extract JSON array from response (remove any markdown or extra text)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse Gemini response:', e);
    console.log('Raw response:', text);
  }
  return null;
};