import axios from 'axios';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import { User } from '../models/User.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import crypto from 'crypto';

dotenv.config();

// SSLCommerz Configuration
const SSL_COMMERZ_STORE_ID = process.env.SSL_COMMERZ_STORE_ID;
const SSL_COMMERZ_STORE_PASSWORD = process.env.SSL_COMMERZ_STORE_PASSWORD;
const SSL_COMMERZ_SANDBOX = process.env.SSL_COMMERZ_SANDBOX === 'true';
const SSL_COMMERZ_API_URL = SSL_COMMERZ_SANDBOX 
  ? 'https://sandbox.sslcommerz.com' 
  : 'https://secure.sslcommerz.com';

// --- INITIALIZE SSLCOMMERZ PAYMENT ---
export const initializeSSLCommerz = async (req, res) => {
  try {
    console.log("💰 SSLCommerz Payment Request Received:", req.body.type);
    
    const { 
      items, 
      type, 
      amount, 
      address, 
      customerName, 
      customerEmail, 
      customerPhone, 
      totalAmount,
      // Subscription specific fields
      mealSelections,
      planType,
      restaurantId,
      userId
    } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Missing payment type" });
    }

    // Generate a unique transaction ID
    const tranId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    let postData = {
      store_id: SSL_COMMERZ_STORE_ID,
      store_passwd: SSL_COMMERZ_STORE_PASSWORD,
      total_amount: type === 'cart_checkout' ? totalAmount : 
                    type === 'subscription_payment' ? totalAmount : amount,
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${process.env.BACKEND_URL}/api/payment/sslcommerz-success`,
      fail_url: `${process.env.BACKEND_URL}/api/payment/sslcommerz-fail`,
      cancel_url: `${process.env.BACKEND_URL}/api/payment/sslcommerz-cancel`,
      ipn_url: `${process.env.BACKEND_URL}/api/payment/sslcommerz-ipn`,
      shipping_method: 'NO',
      product_name: type === 'cart_checkout' ? 'Food Order' : 
                     type === 'subscription_payment' ? 'Food Subscription' : 'Wallet Recharge',
      product_category: type === 'cart_checkout' ? 'Food' : 
                        type === 'subscription_payment' ? 'Subscription' : 'Wallet',
      product_profile: type === 'subscription_payment' ? 'general' : 'general',
      cus_name: customerName || 'Customer',
      cus_email: customerEmail || 'customer@example.com',
      cus_phone: customerPhone || '01700000000',
      cus_add1: address?.area || 'Dhaka',
      cus_city: address?.city || 'Dhaka',
      cus_country: 'Bangladesh',
    };

    // Add multi-product info for cart checkout
    if (type === 'cart_checkout' && items) {
      postData = {
        ...postData,
        num_of_item: items.length,
        product_name: items.map(item => item.name).join(', '),
        product_category: 'Food',
        product_profile: 'physical-goods',
      };
      
      // Add individual product details (SSLCommerz supports up to 5 products)
      items.slice(0, 5).forEach((item, index) => {
        postData[`product_name_${index + 1}`] = item.name;
        postData[`product_price_${index + 1}`] = item.price;
        postData[`product_quantity_${index + 1}`] = item.quantity || 1;
      });
    }

    // Add subscription info
    if (type === 'subscription_payment') {
      postData = {
        ...postData,
        num_of_item: mealSelections?.length || 1,
        product_name: `${planType === 'weekly' ? 'Weekly' : 'Monthly'} Subscription`,
        product_category: 'Subscription',
        product_profile: 'general',
      };
    }

    // Make request to SSLCommerz API
    const response = await axios({
      method: 'POST',
      url: `${SSL_COMMERZ_API_URL}/gwprocess/v4/api.php`,
      data: new URLSearchParams(postData).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.status === 'SUCCESS') {
      res.json({
        success: true,
        gatewayUrl: response.data.GatewayPageURL,
        tranId: tranId
      });
    } else {
      console.error("SSLCommerz Init Failed:", response.data);
      res.status(400).json({ 
        success: false, 
        message: response.data.failedreason || 'Payment initialization failed' 
      });
    }

  } catch (error) {
    console.error("🔥 SSLCommerz Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- VERIFY SSLCOMMERZ PAYMENT (SUCCESS) ---
export const verifySSLCommerzSuccess = async (req, res) => {
  try {
    const { tran_id, val_id, amount, currency, card_type, status } = req.body;

    // Verify the transaction with SSLCommerz API
    const validationUrl = `${SSL_COMMERZ_API_URL}/validator/api/validationserverAPI.php`;
    const validationResponse = await axios({
      method: 'GET',
      url: validationUrl,
      params: {
        val_id: val_id,
        store_id: SSL_COMMERZ_STORE_ID,
        store_passwd: SSL_COMMERZ_STORE_PASSWORD,
        format: 'json'
      }
    });

    if (validationResponse.data.status !== 'VALID' && validationResponse.data.status !== 'VALIDATED') {
      return res.redirect(`${process.env.CLIENT_URL}/payment-failed?reason=validation_failed`);
    }

    // Redirect to frontend with transaction ID
    res.redirect(`${process.env.CLIENT_URL}/success?tran_id=${tran_id}&val_id=${val_id}`);

  } catch (error) {
    console.error("SSLCommerz Success Verification Error:", error);
    res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
  }
};

// --- FINAL VERIFICATION AND ORDER/SUBSCRIPTION CREATION ---
export const completePaymentVerification = async (req, res) => {
  try {
    const { tranId, valId, type, cartItems, address, userId, subscriptionData, subscriptionId } = req.body;

    // Prefer authenticated user for protected endpoint
    const authedUserId = req.user?._id;
    const effectiveUserId = authedUserId || userId;

    // Verify again with SSLCommerz
    const validationUrl = `${SSL_COMMERZ_API_URL}/validator/api/validationserverAPI.php`;
    const validationResponse = await axios({
      method: 'GET',
      url: validationUrl,
      params: {
        val_id: valId,
        store_id: SSL_COMMERZ_STORE_ID,
        store_passwd: SSL_COMMERZ_STORE_PASSWORD,
        format: 'json'
      }
    });

    if (validationResponse.data.status !== 'VALID' && validationResponse.data.status !== 'VALIDATED') {
      return res.status(400).json({ success: false, message: "Payment validation failed" });
    }

    const paymentData = validationResponse.data;
    const amountPaid = parseFloat(paymentData.amount);

    // --- CASE A: WALLET RECHARGE ---
    if (type === 'wallet_recharge') {
      const user = await User.findById(effectiveUserId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + amountPaid;
        await user.save();
      }

      await Payment.create({
        user: effectiveUserId,
        amount: amountPaid,
        type: 'wallet_recharge',
        method: 'sslcommerz',
        status: 'success',
        metadata: {
          tranId: tranId,
          valId: valId,
          cardType: paymentData.card_type,
          bankTranId: paymentData.bank_tran_id
        }
      });

      return res.json({ 
        success: true, 
        type: 'wallet_recharge', 
        message: "Wallet recharged successfully!" 
      });
    } 
    
    // --- CASE B: FOOD ORDER ---
    if (type === 'cart_checkout') {
      const orderPromises = cartItems.map(item => {
        const deliveryDateTime = new Date(item.date || item.deliveryDate);
        deliveryDateTime.setHours(item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20), 0, 0, 0);

        return Order.create({
          userId: effectiveUserId,
          restaurantId: item.restaurant || item.restaurantId,
          items: [{ 
            itemId: item._id, 
            quantity: item.quantity || 1, 
            price: item.price, 
            mealType: item.mealType || "lunch" 
          }],
          total: (item.price * (item.quantity || 1)) + 30,
          deliveryAddress: address,
          status: 'pending',
          paymentMethod: 'sslcommerz',
          paymentStatus: 'paid',
          deliveryDateTime: deliveryDateTime,
          deliveryFee: 30,
          paymentDetails: {
            tranId: tranId,
            valId: valId,
            cardType: paymentData.card_type
          }
        });
      });

      const orders = await Promise.all(orderPromises);

      await Payment.create({
        user: effectiveUserId,
        amount: amountPaid,
        type: 'order_payment',
        method: 'sslcommerz',
        status: 'success',
        metadata: {
          tranId: tranId,
          valId: valId,
          cardType: paymentData.card_type,
          bankTranId: paymentData.bank_tran_id,
          orderIds: orders.map(o => o._id)
        }
      });

      return res.json({ 
        success: true, 
        type: 'cart_checkout', 
        message: "Order placed successfully!" 
      });
    }

    // --- CASE C: SUBSCRIPTION PAYMENT ---
    if (type === 'subscription_payment') {
      // Preferred flow: activate an existing pending subscription created before redirect
      if (subscriptionId) {
        const subscription = await Subscription.findOne({
          _id: subscriptionId,
          user: effectiveUserId,
        });

        if (!subscription) {
          return res.status(404).json({ success: false, message: "Subscription not found" });
        }

        // Idempotency: if already active, don't recreate orders
        if (subscription.status !== 'active') {
          subscription.status = 'active';
          subscription.paymentMethod = 'sslcommerz';
          await subscription.save();

          // Create orders for each meal selection
          const user = await User.findById(effectiveUserId);
          if (!user || !user.address) {
            return res.status(400).json({ success: false, message: "Missing delivery address" });
          }

          const createdOrders = [];
          for (const meal of subscription.mealSelections || []) {
            try {
              if (!meal?.menuItemId || !meal?.date || !meal?.mealType) continue;

              const menuItem = await MenuItem.findById(meal.menuItemId);
              if (!menuItem) continue;

              const deliveryDateTime = new Date(meal.date);
              if (meal.mealType === 'lunch') deliveryDateTime.setHours(12, 0, 0, 0);
              else deliveryDateTime.setHours(19, 0, 0, 0);

              // Avoid duplicates if verify endpoint is called twice
              const existing = await Order.findOne({
                subscriptionId: subscription._id,
                deliveryDateTime,
                'items.itemId': meal.menuItemId,
                'items.mealType': meal.mealType,
              });
              if (existing) continue;

              const order = await Order.create({
                restaurantId: subscription.restaurantId,
                userId: effectiveUserId,
                items: [{
                  itemId: meal.menuItemId,
                  quantity: meal.quantity || 1,
                  price: meal.price ?? menuItem.price,
                  mealType: meal.mealType,
                  day: meal.day,
                }],
                total: (meal.price ?? menuItem.price) * (meal.quantity || 1),
                deliveryDateTime,
                deliveryAddress: {
                  fullAddress: user.address.fullAddress || `${user.address.house || ''}, ${user.address.road || ''}, ${user.address.area || ''}, ${user.address.city || ''}`,
                  coordinates: {
                    type: "Point",
                    coordinates: user.address.coordinates?.coordinates || [90.399452, 23.777176],
                  },
                  house: user.address.house || '',
                  road: user.address.road || '',
                  area: user.address.area || '',
                  city: user.address.city || 'Dhaka',
                },
                subscriptionId: subscription._id,
                isSubscription: true,
                paymentStatus: 'paid',
                paymentMethod: 'sslcommerz',
                status: 'pending',
              });

              // attach orderId back to meal selection
              const ms = subscription.mealSelections.find((m) =>
                String(m.menuItemId) === String(meal.menuItemId) &&
                String(m.date) === String(meal.date) &&
                String(m.mealType) === String(meal.mealType)
              );
              if (ms) ms.orderId = order._id;

              createdOrders.push(order._id);
            } catch (err) {
              console.error('Failed to create subscription order:', err);
            }
          }

          await subscription.save();

          await Payment.create({
            user: effectiveUserId,
            subscription: subscription._id,
            amount: amountPaid,
            type: 'subscription_payment',
            method: 'sslcommerz',
            status: 'success',
            metadata: {
              tranId,
              valId,
              cardType: paymentData.card_type,
              subscriptionId: subscription._id,
              orderIds: createdOrders,
            },
          });
        }

        return res.json({
          success: true,
          type: 'subscription_payment',
          message: "Subscription activated successfully!",
        });
      }

      // Back-compat: if the client sends subscriptionData, create subscription directly
      if (subscriptionData) {
        const subscription = await Subscription.create({
          restaurantId: subscriptionData.restaurantId,
          user: effectiveUserId,
          mealSelections: subscriptionData.mealSelections,
          planType: subscriptionData.planType,
          startDate: subscriptionData.startDate || new Date(),
          totalAmount: amountPaid,
          status: 'active',
          paymentMethod: 'sslcommerz',
        });

        await Payment.create({
          user: effectiveUserId,
          subscription: subscription._id,
          amount: amountPaid,
          type: 'subscription_payment',
          method: 'sslcommerz',
          status: 'success',
          metadata: {
            tranId,
            valId,
            cardType: paymentData.card_type,
            planType: subscriptionData.planType,
          },
        });

        return res.json({
          success: true,
          type: 'subscription_payment',
          message: "Subscription created successfully!",
        });
      }
    }

  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- PAYMENT FAILURE HANDLER ---
export const handleSSLCommerzFail = async (req, res) => {
  console.log("❌ Payment Failed:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
};

// --- PAYMENT CANCEL HANDLER ---
export const handleSSLCommerzCancel = async (req, res) => {
  console.log("🚫 Payment Cancelled:", req.body);
  res.redirect(`${process.env.CLIENT_URL}/payment-cancelled`);
};

// --- IPN (Instant Payment Notification) HANDLER ---
export const handleSSLCommerzIPN = async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;
    
    if (status === 'VALID' || status === 'VALIDATED') {
      console.log(`IPN: Payment ${tran_id} completed`);
    }
    
    res.send('IPN Received');
  } catch (error) {
    console.error("IPN Error:", error);
    res.status(500).send('IPN Error');
  }
};