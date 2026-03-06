import express from 'express';
import { getPersonalizedRecommendations } from '../services/geminiRecommendationService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/recommendations/personalized
 * Get personalized food recommendations based on user preferences
 */
router.post('/personalized', protect, async (req, res) => {
  try {
    const { items, preferences } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }
    
    console.log('🧠 Getting personalized recommendations...');
    console.log('User preferences:', preferences);
    
    // Get recommendations from Gemini
    const recommendations = await getPersonalizedRecommendations(items, preferences || {});
    
    if (!recommendations || recommendations.length === 0) {
      console.log('⚠️ Gemini analysis failed, using fallback');
      
      // Simple fallback
      const fallback = items.map(item => {
        let score = 50;
        const reasons = [];
        
        // Simple like matching
        if (preferences.likes?.length) {
          preferences.likes.forEach(like => {
            if (item.name?.toLowerCase().includes(like.toLowerCase())) {
              score += 15;
              reasons.push(`Matches your like: ${like}`);
            }
            if (item.description?.toLowerCase().includes(like.toLowerCase())) {
              score += 10;
            }
          });
        }
        
        // Simple dislike matching
        if (preferences.dislikes?.length) {
          preferences.dislikes.forEach(dislike => {
            if (item.name?.toLowerCase().includes(dislike.toLowerCase())) {
              score -= 15;
              reasons.push(`Contains disliked: ${dislike}`);
            }
          });
        }
        
        // Cap score
        score = Math.min(100, Math.max(0, score));
        
        return {
          id: item._id,
          name: item.name,
          allergenDetected: false,
          allergens: [],
          likeScore: score,
          dislikeDetected: false,
          dislikes: [],
          finalScore: score,
          reason: reasons.join('. ') || 'Average match',
          shouldRecommend: score > 50
        };
      });
      
      return res.json({
        success: true,
        data: fallback,
        source: 'fallback'
      });
    }
    
    // Filter and sort recommendations
    const goodRecommendations = recommendations
      .filter(r => r.shouldRecommend && !r.allergenDetected)
      .sort((a, b) => b.finalScore - a.finalScore);
    
    console.log(`✅ Found ${goodRecommendations.length} good recommendations out of ${recommendations.length} items`);
    
    res.json({
      success: true,
      data: recommendations,
      goodRecommendations: goodRecommendations,
      source: 'gemini'
    });
    
  } catch (error) {
    console.error('Recommendation route error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;