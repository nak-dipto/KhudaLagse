import Subscription from "../models/Subscription.js";
import Order from "../models/Order.js";
import {MenuItem} from "../models/MenuItem.js";
import {User} from "../models/User.js";

const MONTHLY_DISCOUNT_PERCENT = 10;

// Helper to calculate delivery time based on meal type
const getDeliveryDateTime = (dateString, mealType) => {
  const date = new Date(dateString);
  if (mealType === 'lunch') {
    date.setHours(12, 0, 0, 0); // 12:00 PM for lunch
  } else {
    date.setHours(19, 0, 0, 0); // 7:00 PM for dinner
  }
  return date;
};

// Create subscription and orders
export const createSubscription = async (req, res) => {
  try {
    const { restaurantId, mealSelections, planType, startDate } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!restaurantId || !mealSelections || !planType || !startDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate meal selections
    if (!Array.isArray(mealSelections) || mealSelections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one meal"
      });
    }

    // Get user details for delivery address
    const user = await User.findById(userId);
    if (!user || !user.address) {
      return res.status(400).json({
        success: false,
        message: "Please update your delivery address before creating a subscription"
      });
    }

    // Validate menu items exist and get their details
    const menuItemIds = mealSelections.map(meal => meal.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some menu items not found"
      });
    }

    // Create menu item map for quick lookup
    const menuItemMap = {};
    menuItems.forEach(item => {
      menuItemMap[item._id.toString()] = item;
    });

    // Calculate total amount
    let totalAmount = 0;
    const enrichedMealSelections = mealSelections.map(meal => {
      const menuItem = menuItemMap[meal.menuItemId];
      const mealTotal = menuItem.price * (meal.quantity || 1);
      totalAmount += mealTotal;

      return {
        restaurantId,
        menuItemId: meal.menuItemId,
        day: meal.day,
        mealType: meal.mealType,
        quantity: meal.quantity || 1,
        price: menuItem.price,
        itemName: meal.itemName || menuItem.name,
        date: meal.date
      };
    });

    // Calculate discount for monthly plans
    const discount = planType === 'monthly' ? (totalAmount * MONTHLY_DISCOUNT_PERCENT) / 100 : 0;
    const finalAmount = totalAmount - discount;

    // Create subscription with pending_payment status
    const subscription = new Subscription({
      user: userId,
      restaurantId,
      planType,
      startDate: new Date(startDate),
      mealSelections: enrichedMealSelections,
      totalAmount,
      discount,
      finalAmount,
      status: 'pending_payment', // Changed from 'active' to 'pending_payment'
      paymentStatus: 'pending'
    });

    await subscription.save();

    // DO NOT CREATE ORDERS YET - wait for payment confirmation

    res.status(201).json({
      success: true,
      message: "Subscription created successfully. Pending payment.",
      data: subscription
    });

  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create subscription"
    });
  }
};

// Activate subscription after payment and create all orders

// In subscriptionController.js

/**
 * Create orders for a subscription after successful payment
 */
// Create subscription with orders immediately (no payment flow)
export const createSubscriptionWithOrders = async (req, res) => {
  try {
    const { restaurantId, mealSelections, planType, totalAmount } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!restaurantId || !mealSelections || !planType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate meal selections
    if (!Array.isArray(mealSelections) || mealSelections.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one meal"
      });
    }

    // Get user details for delivery address
    const user = await User.findById(userId);
    if (!user || !user.address) {
      return res.status(400).json({
        success: false,
        message: "Please update your delivery address before creating a subscription"
      });
    }

    // Validate menu items exist and get their details
    const menuItemIds = mealSelections.map(meal => meal.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some menu items not found"
      });
    }

    // Create menu item map for quick lookup
    const menuItemMap = {};
    menuItems.forEach(item => {
      menuItemMap[item._id.toString()] = item;
    });

    // Calculate total amount if not provided
    let calculatedTotalAmount = totalAmount || 0;
    const enrichedMealSelections = mealSelections.map(meal => {
      const menuItem = menuItemMap[meal.menuItemId];
      const mealTotal = menuItem.price * (meal.quantity || 1);
      if (!totalAmount) calculatedTotalAmount += mealTotal;

      return {
        restaurantId,
        menuItemId: meal.menuItemId,
        day: meal.day,
        mealType: meal.mealType,
        quantity: meal.quantity || 1,
        price: menuItem.price,
        itemName: meal.itemName || menuItem.name,
        date: meal.date
      };
    });

    // Calculate discount for monthly plans
    const discount = planType === 'monthly' ? (calculatedTotalAmount * MONTHLY_DISCOUNT_PERCENT) / 100 : 0;
    const finalAmount = calculatedTotalAmount - discount;

    // Create subscription with active status
    const subscription = new Subscription({
      user: userId,
      restaurantId,
      planType,
      startDate: new Date(),
      mealSelections: enrichedMealSelections,
      totalAmount: calculatedTotalAmount,
      discount,
      finalAmount,
      status: 'active',
      paymentStatus: 'paid',
      paymentMethod: 'sslcommerz' // No payment method since it's free/instant
    });

    await subscription.save();

    // Create orders for each meal selection
    const createdOrders = [];
    
    for (const meal of enrichedMealSelections) {
      try {
        const menuItem = menuItemMap[meal.menuItemId];
        const deliveryDateTime = getDeliveryDateTime(meal.date, meal.mealType);

        const order = new Order({
          restaurantId,
          userId,
          items: [{
            itemId: meal.menuItemId,
            quantity: meal.quantity,
            price: meal.price,
            mealType: meal.mealType,
            day: meal.day
          }],
          total: meal.price * meal.quantity,
          deliveryDateTime,
          deliveryAddress: {
            fullAddress: user.address.fullAddress || `${user.address.house}, ${user.address.road}, ${user.address.area}, ${user.address.city}`,
            coordinates: {
              type: "Point",
              coordinates: user.address.coordinates?.coordinates || [90.399452, 23.777176]
            },
            house: user.address.house || '',
            road: user.address.road || '',
            area: user.address.area || '',
            city: user.address.city || 'Dhaka'
          },
          subscriptionId: subscription._id,
          isSubscription: true,
          paymentStatus: 'paid',
          paymentMethod: 'sslcommerz',
          status: 'pending'
        });

        await order.save();
        
        // Update meal selection with order ID
        const mealSelection = subscription.mealSelections.find(
          m => m.menuItemId.toString() === meal.menuItemId && 
               m.date === meal.date && 
               m.mealType === meal.mealType
        );
        if (mealSelection) {
          mealSelection.orderId = order._id;
        }
        
        createdOrders.push(order);
      } catch (error) {
        console.error(`Failed to create order for ${meal.date} ${meal.mealType}:`, error);
      }
    }

    // Save subscription with order IDs
    await subscription.save();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully with orders",
      data: {
        subscription,
        ordersCreated: createdOrders.length,
        orders: createdOrders
      }
    });

  } catch (error) {
    console.error("Error creating subscription with orders:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create subscription"
    });
  }
};

export const activateSubscription = async (req, res) => {
  try {
    const { subscriptionId, tranId, amount } = req.body;

    console.log('Activating subscription:', { subscriptionId, tranId, amount });

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    // Check if already activated
    if (subscription.status === 'active') {
      return res.json({
        success: true,
        message: "Subscription already activated"
      });
    }

    // Get user details for delivery address
    const user = await User.findById(subscription.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get all menu items for this subscription
    const menuItemIds = subscription.mealSelections.map(meal => meal.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    
    const menuItemMap = {};
    menuItems.forEach(item => {
      menuItemMap[item._id.toString()] = item;
    });

    // Create orders for each meal selection
    const createdOrders = [];
    
    for (const meal of subscription.mealSelections) {
      try {
        const menuItem = menuItemMap[meal.menuItemId.toString()];
        if (!menuItem) {
          console.error('Menu item not found:', meal.menuItemId);
          continue;
        }

        const deliveryDateTime = getDeliveryDateTime(meal.date, meal.mealType);

        const order = new Order({
          restaurantId: subscription.restaurantId,
          userId: subscription.user,
          items: [{
            itemId: meal.menuItemId,
            quantity: meal.quantity,
            price: meal.price,
            mealType: meal.mealType,
            day: meal.day
          }],
          total: meal.price * meal.quantity,
          deliveryDateTime,
          deliveryAddress: {
            fullAddress: user.address.fullAddress || 
              `${user.address.house || ''}, ${user.address.road || ''}, ${user.address.area || ''}, ${user.address.city || 'Dhaka'}`,
            coordinates: {
              type: "Point",
              coordinates: user.address.coordinates?.coordinates || [90.399452, 23.777176]
            },
            house: user.address.house || '',
            road: user.address.road || '',
            area: user.address.area || '',
            city: user.address.city || 'Dhaka'
          },
          subscriptionId: subscription._id,
          isSubscription: true,
          paymentStatus: 'paid',
          paymentMethod: 'sslcommerz',
          status: 'pending'
        });

        await order.save();
        
        // Update meal selection with order ID
        const mealSelection = subscription.mealSelections.find(
          m => m.menuItemId.toString() === meal.menuItemId.toString() && 
               m.date === meal.date && 
               m.mealType === meal.mealType
        );
        if (mealSelection) {
          mealSelection.orderId = order._id;
        }
        
        createdOrders.push(order);
      } catch (error) {
        console.error(`Failed to create order for ${meal.date} ${meal.mealType}:`, error);
      }
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.paymentStatus = 'paid';
    subscription.paymentDetails = {
      tranId,
      amount,
      paidAt: new Date()
    };
    
    await subscription.save();

    res.json({
      success: true,
      message: "Payment successful, subscription activated",
      data: {
        subscription,
        ordersCreated: createdOrders.length
      }
    });

  } catch (error) {
    console.error("Error activating subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to activate subscription"
    });
  }
};

// Create a subscription record before payment is completed.
// This matches the frontend flow in `SubscriptionManager.jsx` which expects:
// POST /api/subscriptions/create { restaurantId, planType, mealSelections, totalAmount, status }
export const createPendingSubscription = async (req, res) => {
  try {
    const { restaurantId, mealSelections, planType, totalAmount, status } = req.body;
    const userId = req.user._id;

    if (!restaurantId || !Array.isArray(mealSelections) || mealSelections.length === 0 || !planType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Ensure user has an address (orders need it later)
    const user = await User.findById(userId);
    if (!user || !user.address) {
      return res.status(400).json({
        success: false,
        message: "Please update your delivery address before creating a subscription",
      });
    }

    // Determine a start date (earliest selected meal date, fallback to today)
    const dates = mealSelections
      .map((m) => (m?.date ? new Date(m.date) : null))
      .filter((d) => d && !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    const derivedStartDate = dates.length ? dates[0] : new Date();

    // Validate menu items exist, and normalize meal selections
    const menuItemIds = mealSelections.map((meal) => meal.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some menu items not found",
      });
    }

    const menuItemMap = {};
    menuItems.forEach((item) => {
      menuItemMap[item._id.toString()] = item;
    });

    const normalizedSelections = mealSelections.map((meal) => {
      const menuItem = menuItemMap[String(meal.menuItemId)];
      const quantity = Number(meal.quantity) > 0 ? Number(meal.quantity) : 1;
      return {
        restaurantId,
        menuItemId: meal.menuItemId,
        day: meal.day,
        mealType: meal.mealType,
        quantity,
        price: typeof meal.price === "number" ? meal.price : menuItem.price,
        itemName: meal.itemName || meal.menuItemName || menuItem.name,
        date: meal.date,
      };
    });

    const subscription = await Subscription.create({
      user: userId,
      restaurantId,
      planType,
      startDate: derivedStartDate,
      mealSelections: normalizedSelections,
      totalAmount: typeof totalAmount === "number" ? totalAmount : normalizedSelections.reduce((sum, m) => sum + (m.price * (m.quantity || 1)), 0),
      status: status || "pending_payment",
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created (pending payment)",
      data: subscription,
    });
  } catch (error) {
    console.error("Error creating pending subscription:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create pending subscription",
    });
  }
};

// Update subscription (currently used for payment failure marking, etc.)
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { status } = req.body;

    const subscription = await Subscription.findOne({ _id: id, user: userId });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (status) {
      subscription.status = status;
    }

    await subscription.save();

    return res.status(200).json({
      success: true,
      data: subscription,
      message: "Subscription updated",
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update subscription",
    });
  }
};

// Get user's subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscriptions = await Subscription.find({ user: userId })
      .populate('restaurantId', 'name logo address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions"
    });
  }
};

// Get single subscription
export const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ 
      _id: id, 
      user: userId 
    }).populate('restaurantId', 'name logo address');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription"
    });
  }
};

// Pause subscription
export const pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { cancelPendingOrders, keepTodayOrders } = req.body;

    const subscription = await Subscription.findOne({ 
      _id: id, 
      user: userId 
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be paused"
      });
    }

    // Update subscription status
    subscription.status = 'paused';
    await subscription.save();

    let cancelledOrders = 0;

    // Cancel pending orders if requested
    if (cancelPendingOrders) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Cancel orders from tomorrow onwards (keep today's orders if requested)
      const cancelFromDate = keepTodayOrders ? tomorrow : today;

      const result = await Order.updateMany(
        {
          subscriptionId: subscription._id,
          status: 'pending',
          deliveryDateTime: { $gte: cancelFromDate }
        },
        {
          $set: { status: 'cancelled' }
        }
      );

      cancelledOrders = result.modifiedCount || 0;
    }

    res.status(200).json({
      success: true,
      message: "Subscription paused successfully",
      cancelledOrders
    });
  } catch (error) {
    console.error("Error pausing subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to pause subscription"
    });
  }
};

// Resume subscription
export const resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { recreateOrders } = req.body;

    console.log('Resume subscription called:', {
      subscriptionId: id,
      userId,
      body: req.body
    });

    const subscription = await Subscription.findOne({ 
      _id: id, 
      user: userId 
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: "Only paused subscriptions can be resumed"
      });
    }

    // Update subscription status
    subscription.status = 'active';
    await subscription.save();

    let recreatedOrders = 0;

    // Recreate orders if requested
    if (recreateOrders) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('Looking for meals from:', tomorrow);

      // Get meal selections from tomorrow onwards
      const upcomingMeals = subscription.mealSelections.filter(meal => {
        if (!meal.date) return false;
        const mealDate = new Date(meal.date);
        mealDate.setHours(0, 0, 0, 0);
        return mealDate >= tomorrow;
      });

      console.log('Upcoming meals found:', upcomingMeals.length);

      for (const meal of upcomingMeals) {
        try {
          if (!meal.menuItemId || !meal.date || !meal.mealType) {
            console.log('Skipping meal - missing required fields:', meal);
            continue;
          }

          const deliveryDateTime = getDeliveryDateTime(meal.date, meal.mealType);

          // Check if order already exists for this specific meal
          const existingOrder = await Order.findOne({
            subscriptionId: subscription._id,
            'items.mealType': meal.mealType,
            'items.day': meal.day,
            deliveryDateTime: {
              $gte: new Date(new Date(meal.date).setHours(0, 0, 0, 0)),
              $lt: new Date(new Date(meal.date).setHours(23, 59, 59, 999))
            }
          });

          if (existingOrder) {
            console.log('Order already exists for:', meal.date, meal.mealType);
            continue;
          }

          // Get menu item details
          const menuItem = await MenuItem.findById(meal.menuItemId);
          if (!menuItem) {
            console.log('Menu item not found:', meal.menuItemId);
            continue;
          }

          const order = new Order({
            restaurantId: subscription.restaurantId,
            userId,
            items: [{
              itemId: meal.menuItemId,
              quantity: meal.quantity || 1,
              price: menuItem.price,
              mealType: meal.mealType,
              day: meal.day
            }],
            total: (menuItem.price || meal.price || 0) * (meal.quantity || 1),
            deliveryDateTime,
            deliveryAddress: {
              fullAddress: user.address?.fullAddress || 
                `${user.address?.house || ''}, ${user.address?.road || ''}, ${user.address?.area || ''}, ${user.address?.city || 'Dhaka'}`,
              coordinates: {
                type: "Point",
                coordinates: user.address?.coordinates?.coordinates || [90.399452, 23.777176]
              },
              house: user.address?.house || '',
              road: user.address?.road || '',
              area: user.address?.area || '',
              city: user.address?.city || 'Dhaka'
            },
            subscriptionId: subscription._id,
            isSubscription: true,
            paymentStatus: 'paid',
            paymentMethod:'sslcommerz',
            status: 'pending'
          });

          await order.save();
          console.log('Order created for:', meal.date, meal.mealType);
          recreatedOrders++;
          
        } catch (error) {
          console.error(`Failed to recreate order for ${meal.date} ${meal.mealType}:`, error);
        }
      }
    }

    console.log('Resume completed - orders recreated:', recreatedOrders);

    res.status(200).json({
      success: true,
      message: "Subscription resumed successfully",
      recreatedOrders
    });
  } catch (error) {
    console.error("Error resuming subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to resume subscription"
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ 
      _id: id, 
      user: userId 
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    // Update subscription status
    subscription.status = 'cancelled';
    await subscription.save();

    // Cancel all pending orders
    await Order.updateMany(
      {
        subscriptionId: subscription._id,
        status: 'pending'
      },
      {
        $set: { status: 'cancelled' }
      }
    );

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription"
    });
  }
};