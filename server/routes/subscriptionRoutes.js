import express from 'express';
import { 
  createSubscription,
  createPendingSubscription,
  getUserSubscriptions,
  getSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  updateSubscription,
  createSubscriptionWithOrders,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js'; // Your auth middleware

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/create-with-orders', createSubscriptionWithOrders);

// Create subscription
router.post('/', createSubscription);

// Create subscription in "pending payment" state (used by SSLCommerz flow)
router.post('/create', createPendingSubscription);

// Get user's subscriptions
router.get('/', getUserSubscriptions);

// Get single subscription
router.get('/:id', getSubscription);

// Pause subscription
router.patch('/:id/pause', pauseSubscription);

// Resume subscription
router.patch('/:id/resume', resumeSubscription);

// Update subscription (status updates used by frontend payment flow)
router.patch('/:id', updateSubscription);

// Cancel subscription
router.delete('/:id', cancelSubscription);

export default router;