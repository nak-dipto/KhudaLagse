import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/Order.js'; 
import { User } from '../models/User.js';     // <--- ADDED THIS
import Payment from '../models/Payment.js';   // <--- ADDED THIS

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    console.log("💰 Payment Request Received:", req.body.type);
    
    const { items, type, amount, address } = req.body;
    let line_items = [];

    if (!type) {
      return res.status(400).json({ message: "Missing payment type" });
    }

    if (type === 'cart_checkout') {
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      line_items = items.map((item) => ({
        price_data: {
          currency: 'bdt', 
          product_data: {
            name: item.name,
            description: `Meal for ${item.day || 'scheduled date'}`,
          },
          unit_amount: Math.round(item.price * 100), 
        },
        quantity: item.quantity || 1,
      }));

      // Delivery Fee
      line_items.push({
        price_data: {
          currency: 'bdt',
          product_data: { name: 'Delivery Fee' },
          unit_amount: 30 * 100, 
        },
        quantity: 1,
      });

    } else {
      // Wallet Recharge Logic
      if (!amount) {
        return res.status(400).json({ message: "Amount is required for recharge" });
      }
      line_items = [{
        price_data: {
          currency: 'bdt',
          product_data: { name: 'Wallet Recharge' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      metadata: { 
        userId: req.user ? req.user._id.toString() : 'guest', 
        type: type,
        // Only add address if it exists
        address: address ? JSON.stringify(address) : ''
      },
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      // Pass the type to the cancel page
      cancel_url: `${process.env.CLIENT_URL}/cancel?type=${type}`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("🔥 Stripe Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- VERIFY PAYMENT (FIXED LOGIC) ---
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId, cartItems } = req.body;
    
    // 1. Retrieve Session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 2. Check if actually paid
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: "Payment not verified" });
    }

    const type = session.metadata.type;
    const userId = session.metadata.userId;

    // --- CASE A: WALLET RECHARGE ---
    if (type === 'wallet_recharge') {
        const amountPaid = session.amount_total / 100; // Stripe amount is in cents

        // 1. Update User Balance in DB
        const user = await User.findById(userId);
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + amountPaid;
            await user.save();
        }

        // 2. Create Transaction Record
        await Payment.create({
            user: userId,
            amount: amountPaid,
            type: 'wallet_recharge',
            method: 'stripe',
            status: 'success'
        });

        return res.json({ success: true, type: 'wallet_recharge', message: "Funds Added!" });
    } 
    
    // --- CASE B: FOOD ORDER ---
    if (type === 'cart_checkout') {
      const address = session.metadata.address ? JSON.parse(session.metadata.address) : {};

      const orderPromises = cartItems.map(item => {
        const deliveryDateTime = new Date(item.date || item.deliveryDate);
        deliveryDateTime.setHours(item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20), 0, 0, 0);

        return Order.create({
          userId: userId,
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
          paymentMethod: 'card',
          paymentStatus: 'paid',
          deliveryDateTime: deliveryDateTime,
          deliveryFee: 30
        });
      });

      await Promise.all(orderPromises);

      return res.json({ success: true, type: 'cart_checkout', message: "Order Placed Successfully!" });
    }

  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: error.message });
  }
};