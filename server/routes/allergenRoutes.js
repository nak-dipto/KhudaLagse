import express from 'express';
import { detectAllergensWithCache } from '../services/allergenService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/allergen/detect
 * Detect allergens in a menu item
 */
router.post('/detect', protect, async (req, res) => {
  try {
    const { item, allergies } = req.body;
    
    if (!item) {
      return res.status(400).json({
        success: false,
        message: 'Menu item is required'
      });
    }
    
    if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
      return res.json({
        success: true,
        data: {
          allergenDetected: false,
          detectedAllergens: [],
          crossContamination: [],
          summary: 'No allergies specified'
        }
      });
    }
    
    console.log(`🔍 Processing allergen detection for: ${item.name || 'Unknown item'}`);
    console.log(`👤 User allergies: ${allergies.join(', ')}`);
    
    const startTime = Date.now();
    const detected = await detectAllergensWithCache(item, allergies);
    const endTime = Date.now();
    
    console.log(`✅ Detection completed in ${endTime - startTime}ms`);
    
    if (detected.allergenDetected) {
      console.log(`⚠️ Allergens detected:`, detected.detectedAllergens);
    } else {
      console.log(`✅ No allergens detected`);
    }
    
    res.json({
      success: true,
      data: detected
    });
    
  } catch (error) {
    console.error('❌ Allergen detection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to detect allergens'
    });
  }
});

/**
 * POST /api/allergen/batch-detect
 * Detect allergens for multiple menu items in batch
 */
router.post('/batch-detect', protect, async (req, res) => {
  try {
    const { items, allergies } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }
    
    if (!allergies || !Array.isArray(allergies) || allergies.length === 0) {
      // Return safe for all items if no allergies
      const results = items.map(item => ({
        itemId: item._id,
        result: {
          allergenDetected: false,
          detectedAllergens: [],
          crossContamination: [],
          summary: 'No allergies specified'
        }
      }));
      
      return res.json({
        success: true,
        data: results
      });
    }
    
    console.log(`🔍 Batch processing ${items.length} items for allergens`);
    
    // Process items in parallel with a concurrency limit to avoid rate limiting
    const concurrencyLimit = 5;
    const results = [];
    
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const batch = items.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (item) => {
        const result = await detectAllergensWithCache(item, allergies);
        return {
          itemId: item._id,
          result
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid rate limits
      if (i + concurrencyLimit < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const detectedCount = results.filter(r => r.result.allergenDetected).length;
    console.log(`✅ Batch complete: ${detectedCount} items with allergens out of ${items.length}`);
    
    res.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('❌ Batch allergen detection error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to detect allergens'
    });
  }
});

/**
 * GET /api/allergen/cache-stats
 * Get cache statistics (for debugging)
 */
router.get('/cache-stats', protect, (req, res) => {
  // This is a simple endpoint to check cache status
  // In a real app, you might want to restrict this to admins only
  res.json({
    success: true,
    message: 'Cache stats endpoint - implement as needed'
  });
});

export default router;