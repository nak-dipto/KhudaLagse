import express from 'express';
import { 
  initializeSSLCommerz, 
  verifySSLCommerzSuccess, 
  completePaymentVerification,
  handleSSLCommerzFail,
  handleSSLCommerzCancel,
  handleSSLCommerzIPN 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// SSLCommerz payment initialization (protected)
router.post('/sslcommerz-init', protect, initializeSSLCommerz);

// SSLCommerz callback routes (public - SSLCommerz calls these)
router.post('/sslcommerz-success', verifySSLCommerzSuccess);
router.post('/sslcommerz-fail', handleSSLCommerzFail);
router.post('/sslcommerz-cancel', handleSSLCommerzCancel);
router.post('/sslcommerz-ipn', handleSSLCommerzIPN);

// Final verification endpoint (protected - called from frontend after success)
router.post('/verify-payment', protect, completePaymentVerification);

export default router;