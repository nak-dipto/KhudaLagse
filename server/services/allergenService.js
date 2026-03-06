import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Detects allergens in a menu item using Gemini
 * @param {Object} item - Menu item with name, description, ingredients
 * @param {Array} userAllergies - User's allergies (e.g., ["nuts", "dairy", "gluten"])
 * @returns {Promise<Object>} - Complete allergen detection result
 */
export const detectAllergensWithGemini = async (item, userAllergies) => {
  if (!userAllergies || userAllergies.length === 0) {
    return {
      allergenDetected: false,
      detectedAllergens: [],
      crossContamination: [],
      summary: 'No allergies specified'
    };
  }
  
  try {
    // Use the free Gemini model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" // Use this instead of gemini-3-flash-preview
    });
    
    // Build the enhanced prompt
    const prompt = buildAllergenPrompt(item, userAllergies);
    
    console.log(`🔍 Sending to Gemini: ${item.name}`);
    console.log(`🔍 User allergies: ${userAllergies.join(', ')}`);
    
    // Call Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log(`📥 Received response from Gemini:`, text);
    
    // Parse the JSON response
    return parseGeminiResponse(text);
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      allergenDetected: false,
      detectedAllergens: [],
      crossContamination: [],
      summary: 'Error analyzing allergens'
    };
  }
};

/**
 * Builds an enhanced prompt for Gemini with comprehensive allergen relationships
 */
const buildAllergenPrompt = (item, userAllergies) => {
  const itemDetails = `
    Item Name: ${item.name || 'Unknown'}
    Description: ${item.description || 'No description'}
    Ingredients: ${item.ingredients ? item.ingredients.join(', ') : 'Not listed'}
  `;
  
  return `
    You are a food allergen detection system. Analyze this menu item for potential allergens.
    
    USER ALLERGIES: ${userAllergies.join(', ')}
    
    MENU ITEM:
    ${itemDetails}
    
    CRITICAL ALLERGEN RELATIONSHIPS - YOU MUST UNDERSTAND THESE:
    ===============================================================
    - If user is allergic to "nuts", that includes ALL of these: almonds, Cashews, walnuts, pecans, hazelnuts, pistachios, macadamia nuts, pine nuts, chestnuts, brazil nuts, mixed nuts, nut extracts, nut oils, nut butters, praline, marzipan, frangipane, nutella, nut-based sauces, nut-based crusts, nut-based toppings, gianduja, nut meal, nut flour
    - If user is allergic to "peanuts", that includes: peanuts, peanut butter, groundnuts, peanut oil, arachis oil, beer nuts, goobers, peanut flour, peanut protein, hydrolyzed peanut protein, peanut sauce, satay sauce, monkey nuts, peanut pieces
    - If user is allergic to "dairy", that includes: milk, cheese, butter, cream, yogurt, whey, casein, lactose, ghee, paneer, sour cream, cream cheese, cottage cheese, ricotta, mozzarella, parmesan, cheddar, buttermilk, milk powder, milk solids, milk protein, curds, custard, ice cream, frozen yogurt, half-and-half, condensed milk, evaporated milk, milk chocolate, white chocolate, buttermilk, kefir, quark, fromage, creme fraiche
    - If user is allergic to "gluten", that includes: wheat, barley, rye, oats, spelt, kamut, triticale, durum, semolina, farro, einkorn, emmer, graham flour, malt, brewer's yeast, bread, pasta, noodles, couscous, bulgur, seitan, wheat germ, wheat bran, wheat starch, modified wheat starch, hydrolyzed wheat protein, malt extract, malt flavoring, malt syrup, malt vinegar, beer, ale, lager, panko, breadcrumbs, pastry, cake, cookies, crackers, pretzels
    - If user is allergic to "soy", that includes: soy, soya, tofu, tempeh, edamame, miso, natto, soy sauce, tamari, teriyaki, hoisin, soybean oil, soy lecithin, soy protein, textured vegetable protein (TVP), hydrolyzed soy protein, soy milk, soy yogurt, soy cheese, soybean sprouts, yuba, okara, shoyu, ponzu, edamame beans, soy nuts, soy flour
    - If user is allergic to "eggs", that includes: eggs, egg whites, egg yolks, dried eggs, powdered eggs, egg wash, mayonnaise, aioli, hollandaise, béarnaise, meringue, custard, eggnog, albumin, ovoglobulin, ovomucin, ovomucoid, ovotransferrin, ovovitellin, livetin, lysozyme, lecithin (from eggs), Simplesse (fat substitute), egg white powder, egg yolk powder, pasteurized eggs
    - If user is allergic to "shellfish", that includes: shrimp, prawn, crab, lobster, crayfish, langoustine, scampi, krill, barnacle, clam, clams, mussel, mussels, oyster, oysters, scallop, scallops, abalone, cockle, cockles, whelk, periwinkle, sea urchin, surimi (imitation crab), crawfish, crawdad, langostino
    - If user is allergic to "fish", that includes: salmon, tuna, mackerel, herring, sardine, anchovy, cod, haddock, pollock, halibut, flounder, sole, trout, bass, snapper, grouper, catfish, tilapia, mahi-mahi, swordfish, shark, eel, roe, caviar, fish sauce, worcestershire sauce (contains fish), caesar dressing (contains anchovy), surimi (contains fish), fish oil, fish stock, fish paste, gefilte fish
    - If user is allergic to "sesame", that includes: sesame seeds, sesame oil, tahini, halva, hummus (often contains tahini), baba ganoush, gomashio, benne seeds, benne oil, sesame paste, sesame flour, sesame salt, tahini sauce

    TASK:
    1. Carefully analyze the item's name, description, and ingredients
    2. Check for ANY of the user's allergies, using the comprehensive relationships above
    3. Consider cross-contamination risks based on the ingredients
    4. For each detected allergen, specify exactly what triggered the detection

    Return a JSON object with this EXACT structure (no other text, no markdown formatting):
    {
      "allergenDetected": boolean,
      "detectedAllergens": [
        {
          "allergen": "string (the matched allergen category like 'nuts', 'dairy', etc.)",
          "trigger": "string (what caused the detection - e.g., 'cashews in ingredients')",
          "confidence": "high|medium|low",
          "message": "string (user-friendly explanation like 'Contains cashews (tree nuts)')"
        }
      ],
      "crossContamination": ["array of potential cross-contamination warnings"],
      "summary": "string (brief summary for the user)"
    }

    RULES:
    - If ANY allergen is detected, allergenDetected MUST be true
    - Be thorough - check every word, ingredient, and description
    - Use the allergen relationships to understand synonyms and related terms
    - If unsure, err on the side of caution (better safe than sorry)
    - For butter chicken, note that it often contains cashews or almonds (nuts)
    - For Thai curries, note they often contain peanuts or tree nuts
    - Return ONLY the JSON object, no additional text or markdown
  `;
};

/**
 * Parses Gemini's JSON response
 */
const parseGeminiResponse = (text) => {
  try {
    // Clean the text - remove any markdown code blocks if present
    const cleanedText = text.replace(/```json\s*|\s*```/g, '');
    
    // Extract JSON from the response
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure the response has the expected structure
      return {
        allergenDetected: parsed.allergenDetected || false,
        detectedAllergens: parsed.detectedAllergens || [],
        crossContamination: parsed.crossContamination || [],
        summary: parsed.summary || 'No allergen information available'
      };
    }
  } catch (e) {
    console.error('Failed to parse Gemini response:', e);
    console.log('Raw response:', text);
  }
  
  // Return default structure if parsing fails
  return {
    allergenDetected: false,
    detectedAllergens: [],
    crossContamination: [],
    summary: 'Unable to analyze allergens'
  };
};

// Simple in-memory cache
const allergenCache = new Map();

/**
 * Cached version of the detector
 */
export const detectAllergensWithCache = async (item, userAllergies) => {
  if (!userAllergies || userAllergies.length === 0) {
    return {
      allergenDetected: false,
      detectedAllergens: [],
      crossContamination: [],
      summary: 'No allergies specified'
    };
  }
  
  const cacheKey = `${item._id || item.name}-${userAllergies.sort().join(',')}`;
  
  // Check cache first
  if (allergenCache.has(cacheKey)) {
    console.log('📦 Returning cached result for:', item.name);
    return allergenCache.get(cacheKey);
  }
  
  console.log('🤖 Calling Gemini API for:', item.name);
  
  // Call the actual API
  const result = await detectAllergensWithGemini(item, userAllergies);
  
  // Store in cache (expires after 1 hour)
  allergenCache.set(cacheKey, result);
  setTimeout(() => allergenCache.delete(cacheKey), 60 * 60 * 1000);
  
  return result;
};