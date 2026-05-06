import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LUNCH_CUTOFF_HOUR = 10;
const DINNER_CUTOFF_HOUR = 16;
const MONTHLY_DISCOUNT_PERCENT = 10;
const WEEKLY_MIN_MEALS = 2;
const MONTHLY_MIN_MEALS = 4;

// Allergen database for matching
const ALLERGEN_RELATIONSHIPS = {
  'nuts': ['nut', 'nuts', 'almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts', 
           'pecan', 'pecans', 'hazelnut', 'hazelnuts', 'pistachio', 'pistachios', 
           'macadamia', 'pine nut', 'chestnut'],
  'peanuts': ['peanut', 'peanuts', 'groundnut', 'peanut butter'],
  'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'whey', 'casein', 'lactose', 
            'ghee', 'paneer', 'curd'],
  'gluten': ['wheat', 'barley', 'rye', 'oats', 'flour', 'bread', 'pasta', 'noodles', 
             'couscous', 'semolina'],
  'soy': ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'tamari'],
  'eggs': ['egg', 'eggs', 'mayonnaise', 'meringue', 'custard', 'albumin'],
  'shellfish': ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'clam', 'mussel'],
  'fish': ['fish', 'salmon', 'tuna', 'cod', 'sardine', 'anchovy'],
  'sesame': ['sesame', 'tahini', 'halva', 'hummus']
};

// Scoring weights
const SCORE_WEIGHTS = {
  MATCH_LIKE: 5,
  MATCH_DISLIKE: -3,
  MATCH_ALLERGEN: -999,
  CUISINE_MATCH: 2,
  MEAL_TYPE_MATCH: 1
};

const getCurrentDate = () => {
  const now = new Date();
  return {
    date: now,
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes()
  };
};

const isToday = (dateString) => {
  const current = getCurrentDate();
  const currentDateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(current.day).padStart(2, '0')}`;
  return currentDateStr === dateString;
};

const getDateString = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isMealSelectionAllowed = (dateString, mealType) => {
  const current = getCurrentDate();
  
  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get meal date at midnight
  const mealDate = new Date(dateString);
  mealDate.setHours(0, 0, 0, 0);
  
  // If meal date is in the past
  if (mealDate < today) {
    return false;
  }
  
  // If meal date is today, check cutoff times
  if (mealDate.getTime() === today.getTime()) {
    if (mealType === 'lunch' && current.hour >= LUNCH_CUTOFF_HOUR) {
      return false;
    }
    if (mealType === 'dinner' && current.hour >= DINNER_CUTOFF_HOUR) {
      return false;
    }
  }
  
  return true;
};

// Helper function to normalize text for matching
const normalizeText = (text) => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
};

// Helper function to check if item contains allergen
const containsAllergen = (item, allergy) => {
  const itemText = [
    item.name,
    item.description,
    ...(item.ingredients || [])
  ].filter(Boolean).join(' ').toLowerCase();
  
  const allergyLower = allergy.toLowerCase();
  
  // Direct match
  if (itemText.includes(allergyLower)) return true;
  
  // Check against allergen database
  for (const [category, terms] of Object.entries(ALLERGEN_RELATIONSHIPS)) {
    if (category.includes(allergyLower) || allergyLower.includes(category)) {
      if (terms.some(term => itemText.includes(term))) {
        return true;
      }
    }
  }
  
  return false;
};

// Helper function to calculate item score based on preferences
const calculateItemScore = (item, preferences) => {
  let score = 0;
  const { likes = [], dislikes = [], allergies = [] } = preferences;
  
  const itemText = [
    item.name,
    item.description,
    ...(item.ingredients || [])
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Check allergies first (immediate disqualification)
  if (allergies.length > 0) {
    const hasAllergen = allergies.some(allergy => containsAllergen(item, allergy));
    if (hasAllergen) {
      return SCORE_WEIGHTS.MATCH_ALLERGEN;
    }
  }
  
  // Check likes
  if (likes.length > 0) {
    likes.forEach(like => {
      const likeLower = like.toLowerCase();
      if (item.name?.toLowerCase().includes(likeLower)) score += SCORE_WEIGHTS.MATCH_LIKE;
      if (item.description?.toLowerCase().includes(likeLower)) score += 2;
      if (item.ingredients?.some(ing => ing.toLowerCase().includes(likeLower))) score += 3;
    });
  }
  
  // Check dislikes
  if (dislikes.length > 0) {
    dislikes.forEach(dislike => {
      const dislikeLower = dislike.toLowerCase();
      if (item.name?.toLowerCase().includes(dislikeLower)) score += SCORE_WEIGHTS.MATCH_DISLIKE;
      if (item.description?.toLowerCase().includes(dislikeLower)) score += SCORE_WEIGHTS.MATCH_DISLIKE / 2;
      if (item.ingredients?.some(ing => ing.toLowerCase().includes(dislikeLower))) score += SCORE_WEIGHTS.MATCH_DISLIKE * 1.5;
    });
  }
  
  return score;
};

// Main Component
export default function SubscriptionManager({ restaurantId: propRestaurantId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurantId = propRestaurantId || id;
  const [user, setUser] = useState(null);
  const [userPreferences, setUserPreferences] = useState({
    likes: [],
    dislikes: [],
    allergies: []
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log("User loaded:", parsedUser);
        
        // Fetch user preferences from database
        fetchUserPreferences(parsedUser);
        
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
  }, []);

  const fetchUserPreferences = async (user) => {
    if (!user) return;
    
    setLoadingPreferences(true);
    try {
      const userId = user.id || user._id;
      const response = await axiosInstance.get(`/api/auth/preferences/${userId}`);
      
      if (response.data.success && response.data.data) {
        setUserPreferences(response.data.data);
        console.log('User preferences loaded:', response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch user preferences:', err);
      // Try localStorage fallback
      const savedPrefs = localStorage.getItem(`foodPreferences_${user.id || user._id}`);
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs));
      }
    } finally {
      setLoadingPreferences(false);
    }
  };

  const [menuItems, setMenuItems] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState({});
  const [planType, setPlanType] = useState('weekly');
  const [creating, setCreating] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const current = getCurrentDate();
    const today = new Date(current.year, current.month, current.day);
    const day = today.getDay();
    const diff = -day;
    const sunday = new Date(today);
    sunday.setDate(sunday.getDate() + diff);
    return sunday;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const current = getCurrentDate();
    return {
      year: current.year,
      month: current.month
    };
  });

  useEffect(() => {
    fetchSubscriptions();
    if (restaurantId) {
      fetchMenuItems();
    }
  }, [restaurantId, user]);

  const fetchMenuItems = async () => {
    try {
      const { data } = await axiosInstance.get(`/api/menu/restaurant/${restaurantId}`);
      setMenuItems(data.data || []);
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/api/subscriptions');
      // Filter to only show active subscriptions (not cancelled)
      const visibleSubs = restaurantId 
        ? (data.data || []).filter(sub => 
            (sub.restaurantId?._id === restaurantId || sub.restaurantId === restaurantId) &&
            sub.status !== 'cancelled'
          )
        : (data.data || []).filter(sub => sub.status !== 'cancelled');
        
      setSubscriptions(visibleSubs);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysForPlan = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (planType === 'weekly') {
      const weekStart = new Date(currentWeekStart);
      
      const menuByDate = {};
      menuItems.forEach(item => {
        const itemDate = item.date ? new Date(item.date) : new Date();
        const dateString = getDateString(itemDate);
        
        if (!menuByDate[dateString]) {
          menuByDate[dateString] = { lunch: [], dinner: [] };
        }
        
        if (item.mealType === 'lunch') {
          menuByDate[dateString].lunch.push(item);
        } else if (item.mealType === 'dinner') {
          menuByDate[dateString].dinner.push(item);
        }
      });
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateString = getDateString(date);
        
        // Skip past dates
        const dateAtMidnight = new Date(date);
        dateAtMidnight.setHours(0, 0, 0, 0);
        if (dateAtMidnight < today) continue;
        
        const dayIndex = date.getDay();
        const dayName = DAYS[dayIndex];
        const menuForDate = menuByDate[dateString] || { lunch: [], dinner: [] };
        
        // Calculate scores for each menu item based on preferences
        const scoredLunch = menuForDate.lunch.map(item => ({
          ...item,
          score: calculateItemScore(item, userPreferences)
        })).sort((a, b) => b.score - a.score);
        
        const scoredDinner = menuForDate.dinner.map(item => ({
          ...item,
          score: calculateItemScore(item, userPreferences)
        })).sort((a, b) => b.score - a.score);
        
        days.push({
          date: new Date(date),
          dateString,
          day: dayName,
          dayName: DAY_NAMES[dayIndex],
          dateDisplay: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          isToday: isToday(dateString),
          menuItems: {
            lunch: scoredLunch,
            dinner: scoredDinner
          }
        });
      }
    } else {
      const { year, month } = currentMonth;
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const menuByDate = {};
      menuItems.forEach(item => {
        const itemDate = item.date ? new Date(item.date) : new Date();
        const dateString = getDateString(itemDate);
        
        if (!menuByDate[dateString]) {
          menuByDate[dateString] = { lunch: [], dinner: [] };
        }
        
        if (item.mealType === 'lunch') {
          menuByDate[dateString].lunch.push(item);
        } else if (item.mealType === 'dinner') {
          menuByDate[dateString].dinner.push(item);
        }
      });
      
      const startDate = new Date(Math.max(firstDay.getTime(), today.getTime()));
      for (let date = new Date(startDate); date <= lastDay; date.setDate(date.getDate() + 1)) {
        const dateString = getDateString(date);
        const dayIndex = date.getDay();
        const dayName = DAYS[dayIndex];
        
        const menuForDate = menuByDate[dateString] || { lunch: [], dinner: [] };
        
        // Calculate scores for each menu item based on preferences
        const scoredLunch = menuForDate.lunch.map(item => ({
          ...item,
          score: calculateItemScore(item, userPreferences)
        })).sort((a, b) => b.score - a.score);
        
        const scoredDinner = menuForDate.dinner.map(item => ({
          ...item,
          score: calculateItemScore(item, userPreferences)
        })).sort((a, b) => b.score - a.score);
        
        days.push({
          date: new Date(date),
          dateString,
          day: dayName,
          dayName: DAY_NAMES[dayIndex],
          dateDisplay: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          isToday: isToday(dateString),
          menuItems: {
            lunch: scoredLunch,
            dinner: scoredDinner
          }
        });
      }
    }
    
    return days;
  };

  const planDays = getDaysForPlan();

  const getTotalMealsQuantity = () => {
    return Object.values(selectedMeals).reduce((sum, meal) => sum + (meal.quantity || 1), 0);
  };

  const meetsMinimumRequirements = () => {
    const totalQuantity = getTotalMealsQuantity();
    if (planType === 'weekly') {
      return totalQuantity >= WEEKLY_MIN_MEALS;
    } else {
      return totalQuantity >= MONTHLY_MIN_MEALS;
    }
  };

  const handleMealSelect = (dateString, day, mealType, menuItemId, isSelected) => {
    if (!isMealSelectionAllowed(dateString, mealType)) {
      const current = getCurrentDate();
      const currentTime = `${current.hour.toString().padStart(2, '0')}:${current.minute.toString().padStart(2, '0')}`;
      
      if (isToday(dateString)) {
        alert(`Cannot select ${mealType} for today - cutoff time has passed (${currentTime}).\nLunch cutoff: ${LUNCH_CUTOFF_HOUR}:00 AM\nDinner cutoff: ${DINNER_CUTOFF_HOUR}:00 PM`);
      } else {
        alert(`Cannot select ${mealType} for ${dateString} - date is in the past.`);
      }
      return;
    }
    
    const key = `${dateString}_${mealType}_${menuItemId}`;
    
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      if (isSelected) {
        const menuItem = menuItems.find(item => item._id === menuItemId);
        if (!menuItem) return prev;
        
        newSelected[key] = {
          date: dateString,
          day,
          mealType,
          menuItemId,
          quantity: 1,
          price: menuItem.price,
          menuItemName: menuItem.name,
          dateDisplay: new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          score: calculateItemScore(menuItem, userPreferences)
        };
      } else {
        delete newSelected[key];
      }
      
      return newSelected;
    });
  };

  const handleQuantityChange = (key, quantity) => {
    if (quantity < 1) {
      setSelectedMeals(prev => {
        const newSelected = { ...prev };
        delete newSelected[key];
        return newSelected;
      });
      return;
    }
    
    setSelectedMeals(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantity
      }
    }));
  };

  const selectRecommendedMealForDay = (dateString, day, mealType, mealItems) => {
    if (!isMealSelectionAllowed(dateString, mealType)) {
      alert(`Cannot select ${mealType} for this date - cutoff time has passed or date is in the past.`);
      return;
    }
    
    // Get all meals of this type for this day
    const mealsOfType = mealItems[mealType] || [];
    
    if (mealsOfType.length === 0) {
      alert(`No ${mealType} options available for this day.`);
      return;
    }
    
    // Filter out items with allergens
    const safeMeals = mealsOfType.filter(item => {
      if (!userPreferences.allergies || userPreferences.allergies.length === 0) return true;
      return !userPreferences.allergies.some(allergy => containsAllergen(item, allergy));
    });
    
    if (safeMeals.length === 0) {
      alert(`No safe ${mealType} options available based on your allergies.`);
      return;
    }
    
    // Find the highest scoring meal
    const bestMeal = safeMeals.reduce((best, current) => 
      (current.score > best.score) ? current : best, safeMeals[0]);
    
    // Select the best meal
    const key = `${dateString}_${mealType}_${bestMeal._id}`;
    
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      // First, clear any existing selections for this day/mealType
      Object.keys(newSelected).forEach(k => {
        if (k.startsWith(`${dateString}_${mealType}_`)) {
          delete newSelected[k];
        }
      });
      
      // Add the recommended meal
      newSelected[key] = {
        date: dateString,
        day,
        mealType,
        menuItemId: bestMeal._id,
        quantity: 1,
        price: bestMeal.price,
        menuItemName: bestMeal.name,
        dateDisplay: new Date(dateString).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        score: bestMeal.score,
        isRecommended: true
      };
      
      return newSelected;
    });
    
    console.log(`✅ Selected recommended ${mealType}: ${bestMeal.name} (score: ${bestMeal.score})`);
  };

  const selectRecommendedForAllDays = (mealType) => {
    planDays.forEach(dayInfo => {
      const mealsForDay = dayInfo.menuItems[mealType];
      
      if (mealsForDay.length > 0 && isMealSelectionAllowed(dayInfo.dateString, mealType)) {
        // Filter out items with allergens
        const safeMeals = mealsForDay.filter(item => {
          if (!userPreferences.allergies || userPreferences.allergies.length === 0) return true;
          return !userPreferences.allergies.some(allergy => containsAllergen(item, allergy));
        });
        
        if (safeMeals.length > 0) {
          // Find the highest scoring meal
          const bestMeal = safeMeals.reduce((best, current) => 
            (current.score > best.score) ? current : best, safeMeals[0]);
          
          const key = `${dayInfo.dateString}_${mealType}_${bestMeal._id}`;
          
          setSelectedMeals(prev => {
            const newSelected = { ...prev };
            
            // Clear existing for this day/mealType
            Object.keys(newSelected).forEach(k => {
              if (k.startsWith(`${dayInfo.dateString}_${mealType}_`)) {
                delete newSelected[k];
              }
            });
            
            // Add the recommended meal
            newSelected[key] = {
              date: dayInfo.dateString,
              day: dayInfo.day,
              mealType,
              menuItemId: bestMeal._id,
              quantity: 1,
              price: bestMeal.price,
              menuItemName: bestMeal.name,
              dateDisplay: dayInfo.dateDisplay,
              score: bestMeal.score,
              isRecommended: true
            };
            
            return newSelected;
          });
        }
      }
    });
    
    alert(`✅ Selected the best ${mealType} options based on your preferences!`);
  };

  const selectAllMealsForDay = (dateString, day, mealType, mealItems) => {
    if (!isMealSelectionAllowed(dateString, mealType)) {
      alert(`Cannot select ${mealType} for this date - cutoff time has passed or date is in the past.`);
      return;
    }
    
    // Use recommended selection instead of random first item
    selectRecommendedMealForDay(dateString, day, mealType, mealItems);
  };

  const clearAllMealsForDay = (dateString, mealType) => {
    setSelectedMeals(prev => {
      const newSelected = { ...prev };
      
      Object.keys(newSelected).forEach(key => {
        if (key.startsWith(`${dateString}_${mealType}_`)) {
          delete newSelected[key];
        }
      });
      
      return newSelected;
    });
  };

  const selectAllMealsOfType = (mealType) => {
    // Replace with recommended selection
    selectRecommendedForAllDays(mealType);
  };

  const handleCreateSubscription = async () => {
  const totalQuantity = getTotalMealsQuantity();
  if (planType === 'weekly' && totalQuantity < WEEKLY_MIN_MEALS) {
    alert(`Weekly subscription requires at least ${WEEKLY_MIN_MEALS} meals. You have selected ${totalQuantity} meal${totalQuantity !== 1 ? 's' : ''}.`);
    return;
  }
  if (planType === 'monthly' && totalQuantity < MONTHLY_MIN_MEALS) {
    alert(`Monthly subscription requires at least ${MONTHLY_MIN_MEALS} meals. You have selected ${totalQuantity} meal${totalQuantity !== 1 ? 's' : ''}.`);
    return;
  }

  const mealSelections = Object.values(selectedMeals).map(meal => ({
    date: meal.date,
    day: meal.day,
    mealType: meal.mealType,
    menuItemId: meal.menuItemId,
    quantity: meal.quantity || 1,
    price: meal.price,
    itemName: meal.menuItemName,
  }));

  if (mealSelections.length === 0) {
    alert('Please select at least one meal');
    return;
  }

  const today = getDateString(new Date());
  const current = getCurrentDate();
  const todaySelections = mealSelections.filter(meal => meal.date === today);
  
  for (const meal of todaySelections) {
    if (meal.mealType === 'lunch' && current.hour >= LUNCH_CUTOFF_HOUR) {
      alert(`Cannot create subscription with today's lunch - cutoff time has passed (${LUNCH_CUTOFF_HOUR}:00 AM)`);
      return;
    }
    if (meal.mealType === 'dinner' && current.hour >= DINNER_CUTOFF_HOUR) {
      alert(`Cannot create subscription with today's dinner - cutoff time has passed (${DINNER_CUTOFF_HOUR}:00 PM)`);
      return;
    }
  }

  const deliveryAddress = user?.address || user?.deliveryAddress;
  
  if (!deliveryAddress) {
    alert("Please complete your profile with a delivery address before subscribing. 📍");
    if (window.confirm("Would you like to go to your profile to set your address?")) {
      navigate('/profile');
    }
    return;
  }

  try {
    setCreating(true);
    
    const totalPrice = Object.values(selectedMeals).reduce((sum, meal) => {
      return sum + (meal.price * (meal.quantity || 1));
    }, 0);
    
    const discountAmount = planType === 'monthly' ? totalPrice * (MONTHLY_DISCOUNT_PERCENT / 100) : 0;
    const finalPrice = totalPrice - discountAmount;

    if (!user?.name || !user?.email || !user?.phone) {
      alert("Please complete your profile (name, email, phone) before subscribing");
      navigate('/profile');
      return;
    }

    if (finalPrice <= 0) {
      alert("Invalid total amount");
      return;
    }

    console.log("🚀 Creating subscription with orders...");

    // Create subscription with orders (your existing backend call)
    const subscriptionResponse = await axiosInstance.post("/api/subscriptions/create-with-orders", {
      restaurantId,
      planType,
      mealSelections,
      totalAmount: finalPrice,
    });

    if (!subscriptionResponse.data.success) {
      throw new Error(subscriptionResponse.data.message || 'Failed to create subscription');
    }

    const result = subscriptionResponse.data;
    console.log("✅ Subscription and orders created:", result);
    
    const subscriptionId = result.data?._id || result.subscription?._id || result._id;
    
    // Prepare items for payment (same format as cart page)
    const paymentItems = mealSelections.map(meal => ({
      name: meal.itemName,
      price: meal.price,
      quantity: meal.quantity,
      _id: meal.menuItemId,
      restaurant: restaurantId,
      deliveryDate: meal.date,
      deliveryHour: meal.mealType === 'lunch' ? 13 : 20,
      mealType: meal.mealType
    }));
    
    // Store pending payment info for success page
    const pendingPayment = {
      tranId: `SUB_${subscriptionId}_${Date.now()}`,
      type: "subscription_payment",
      subscriptionId: subscriptionId,
      userId: user._id,
      amount: finalPrice,
      planType: planType
    };
    
    localStorage.setItem("pendingPayment", JSON.stringify(pendingPayment));
    
    // Initialize SSLCommerz payment
    console.log("💳 Initializing SSLCommerz payment...");
    
    const paymentResponse = await axiosInstance.post("/api/payment/sslcommerz-init", {
      type: "subscription_payment",
      totalAmount: finalPrice,
      amount: finalPrice,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      address: deliveryAddress,
      planType: planType,
      restaurantId: restaurantId,
      userId: user._id,
      subscriptionId: subscriptionId,
      items: paymentItems,
      mealSelections: mealSelections
    });

    console.log("Payment response:", paymentResponse.data);

    if (paymentResponse.data.success && paymentResponse.data.gatewayUrl) {
      // Update pending payment with actual tranId
      const updatedPendingPayment = {
        ...pendingPayment,
        tranId: paymentResponse.data.tranId
      };
      localStorage.setItem("pendingPayment", JSON.stringify(updatedPendingPayment));
      
      // Close the modal
      setShowCreateModal(false);
      setSelectedMeals({});
      
      // Redirect to SSLCommerz payment page
      window.location.href = paymentResponse.data.gatewayUrl;
    } else {
      throw new Error(paymentResponse.data.message || 'Failed to initiate payment gateway');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    alert(error.response?.data?.message || error.message || 'Failed to create subscription');
    setCreating(false);
  }
};

  const handleCancel = async (subscriptionId) => {
    const confirmMessage = `Cancel this subscription?\n\n⚠️ All future orders will be cancelled\n💰 You will not be charged for cancelled orders\n✅ Today's orders (if any) will still be delivered`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await axiosInstance.delete(`/api/subscriptions/${subscriptionId}`);
      alert('Subscription cancelled successfully!');
      fetchSubscriptions(); // This will refresh and filter out cancelled subscriptions
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handlePrevWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() - 7);
    setCurrentWeekStart(date);
  };

  const handleNextWeek = () => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + 7);
    setCurrentWeekStart(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      return { year: newYear, month: newMonth };
    });
  };

  const getPlanPeriodDisplay = () => {
    if (planDays.length === 0) return '';
    
    if (planType === 'weekly') {
      const firstDay = planDays[0];
      const lastDay = planDays[planDays.length - 1];
      return `${firstDay.dateDisplay} - ${lastDay.dateDisplay}`;
    } else {
      const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-US', { 
        month: 'long' 
      });
      return `${monthName} ${currentMonth.year}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {restaurantId ? 'Manage Subscriptions' : 'Your Active Subscriptions'}
        </h2>
        {restaurantId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-semibold"
          >
            + Create Subscription
          </button>
        )}
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {restaurantId ? (
            <div className="space-y-3">
              <p>No active subscriptions yet. Create one to get started!</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 font-semibold"
              >
                Create Subscription
              </button>
            </div>
          ) : (
            <div>
              <p className="mb-4">You don't have any active subscriptions.</p>
              <button 
                onClick={() => navigate('/restaurants')}
                className="text-violet-600 font-semibold hover:underline"
              >
                Browse Restaurants to Subscribe
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map(sub => (
            <SubscriptionCard
              key={sub._id}
              subscription={sub}
              onCancel={() => handleCancel(sub._id)}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateSubscriptionModal
          menuItems={menuItems}
          selectedMeals={selectedMeals}
          planType={planType}
          planDays={planDays}
          planPeriodDisplay={getPlanPeriodDisplay()}
          onPlanTypeChange={setPlanType}
          onMealSelect={handleMealSelect}
          onQuantityChange={handleQuantityChange}
          onSelectAllMealsForDay={selectAllMealsForDay}
          onSelectRecommendedForDay={selectRecommendedMealForDay}
          onSelectRecommendedForAllDays={selectRecommendedForAllDays}
          onClearAllMealsForDay={clearAllMealsForDay}
          onSelectAllMealsOfType={selectAllMealsOfType}
          onClearAllSelections={() => setSelectedMeals({})}
          onPrevPeriod={planType === 'weekly' ? handlePrevWeek : handlePrevMonth}
          onNextPeriod={planType === 'weekly' ? handleNextWeek : handleNextMonth}
          onCreate={handleCreateSubscription}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedMeals({});
            setCurrentWeekStart(() => {
              const current = getCurrentDate();
              const today = new Date(current.year, current.month, current.day);
              const day = today.getDay();
              const diff = -day;
              const sunday = new Date(today);
              sunday.setDate(sunday.getDate() + diff);
              return sunday;
            });
            setCurrentMonth(() => {
              const current = getCurrentDate();
              return {
                year: current.year,
                month: current.month
              };
            });
          }}
          creating={creating}
          meetsMinimumRequirements={meetsMinimumRequirements()}
          userPreferences={userPreferences}
        />
      )}
    </div>
  );
}

// Sub-components
function SubscriptionCard({ subscription, onCancel, navigate }) {
  const isActive = subscription.status === 'active';
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="border-2 rounded-lg p-4 border-violet-200 bg-violet-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{subscription.restaurantId?.name || 'Restaurant'}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-violet-200 text-violet-800">
              {subscription.status?.toUpperCase() || 'ACTIVE'}
            </span>
            <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
              {subscription.planType === 'weekly' ? 'Weekly Plan' : 'Monthly Plan'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel} 
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold"
          >
            ✕ Cancel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-sm text-gray-600">Start Date</p>
          <p className="font-medium">{formatDate(subscription.startDate)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="font-medium">{subscription.totalAmount?.toFixed(2) || '0.00'} BDT</p>
        </div>
      </div>

      {subscription.mealSelections?.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">Meals Selected:</p>
          <div className="flex flex-wrap gap-2">
            {subscription.mealSelections.slice(0, 3).map((meal, index) => (
              <span 
                key={index}
                className="text-xs bg-white border px-2 py-1 rounded"
              >
                {meal.day?.substring(0, 3)} {meal.mealType === 'lunch' ? '☀️' : '🌙'} ×{meal.quantity || 1}
              </span>
            ))}
            {subscription.mealSelections.length > 3 && (
              <span className="text-xs text-gray-500 self-center">
                + {subscription.mealSelections.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSubscriptionModal({ 
  menuItems, 
  selectedMeals, 
  planType, 
  planDays,
  planPeriodDisplay,
  onPlanTypeChange, 
  onMealSelect, 
  onQuantityChange, 
  onSelectAllMealsForDay,
  onSelectRecommendedForDay,
  onSelectRecommendedForAllDays,
  onClearAllMealsForDay,
  onSelectAllMealsOfType,
  onClearAllSelections, 
  onPrevPeriod,
  onNextPeriod,
  onCreate, 
  onClose, 
  creating,
  meetsMinimumRequirements,
  userPreferences
}) {
  const current = getCurrentDate();
  const currentTime = `${current.hour.toString().padStart(2, '0')}:${current.minute.toString().padStart(2, '0')}`;

  const totalPrice = Object.values(selectedMeals).reduce((sum, meal) => {
    const pricePerMeal = meal.price || 0;
    const quantity = meal.quantity || 1;
    return sum + (pricePerMeal * quantity);
  }, 0);

  const totalQuantity = Object.values(selectedMeals).reduce((sum, meal) => sum + (meal.quantity || 1), 0);
  const discountAmount = planType === 'monthly' ? totalPrice * (MONTHLY_DISCOUNT_PERCENT / 100) : 0;
  const finalPrice = totalPrice - discountAmount;

  const isMealSelected = (dateString, mealType, menuItemId) => {
    const key = `${dateString}_${mealType}_${menuItemId}`;
    return !!selectedMeals[key];
  };

  const getMealQuantity = (dateString, mealType, menuItemId) => {
    const key = `${dateString}_${mealType}_${menuItemId}`;
    return selectedMeals[key]?.quantity || 1;
  };

  const getSelectedCountForDay = (dateString, mealType) => {
    return Object.keys(selectedMeals).filter(key => 
      key.startsWith(`${dateString}_${mealType}_`)
    ).length;
  };

  const getTotalQuantityForDay = (dateString, mealType) => {
    return Object.keys(selectedMeals)
      .filter(key => key.startsWith(`${dateString}_${mealType}_`))
      .reduce((total, key) => total + (selectedMeals[key]?.quantity || 1), 0);
  };

  // Get recommendation badge color based on score
  const getRecommendationBadge = (score) => {
    if (score >= 10) return { text: '🔥 Top Pick', bg: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300' };
    if (score >= 5) return { text: '👍 Great Match', bg: 'bg-green-100 text-green-800', border: 'border-green-300' };
    if (score >= 1) return { text: '👌 Good Match', bg: 'bg-blue-100 text-blue-800', border: 'border-blue-300' };
    if (score <= -999) return { text: '⚠️ Contains Allergen', bg: 'bg-red-100 text-red-800', border: 'border-red-300' };
    return { text: 'Neutral', bg: 'bg-gray-100 text-gray-800', border: 'border-gray-300' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-2xl font-bold">Create {planType === 'weekly' ? 'Weekly' : 'Monthly'} Subscription</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="p-6">
          {/* Plan Type Selection */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-900 mb-3">Choose Subscription Plan:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => onPlanTypeChange('weekly')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  planType === 'weekly' 
                    ? 'border-violet-500 bg-violet-50' 
                    : 'border-gray-200 hover:border-violet-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    planType === 'weekly' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    📅
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Weekly Plan</h5>
                    <p className="text-xs text-gray-600">Minimum {WEEKLY_MIN_MEALS} meals required</p>
                  </div>
                </div>
              </div>
              
              <div 
                onClick={() => onPlanTypeChange('monthly')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  planType === 'monthly' 
                    ? 'border-violet-500 bg-violet-50' 
                    : 'border-gray-200 hover:border-violet-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    planType === 'monthly' ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    📆
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-900">Monthly Plan</h5>
                    <p className="text-xs text-gray-600">Minimum {MONTHLY_MIN_MEALS} meals, {MONTHLY_DISCOUNT_PERCENT}% discount</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cutoff Time Info */}
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <span className="text-lg">🕐</span>
              <div>
                <p className="font-semibold">Cutoff Times (Current: {currentTime})</p>
                <p className="text-xs">Lunch: Before {LUNCH_CUTOFF_HOUR}:00 AM | Dinner: Before {DINNER_CUTOFF_HOUR}:00 PM</p>
              </div>
            </div>
          </div>

          {/* AI Recommendation Banner */}
          {userPreferences && (userPreferences.likes?.length > 0 || userPreferences.dislikes?.length > 0 || userPreferences.allergies?.length > 0) && (
            <div className="mb-6 p-4 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-violet-200 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h4 className="font-semibold text-violet-900">AI-Powered Recommendations</h4>
                  <p className="text-sm text-violet-700">
                    Based on your preferences, we'll highlight the best matches for you!
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                <button
                  onClick={() => onSelectRecommendedForAllDays('lunch')}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-semibold text-sm"
                >
                  🤖 Best Lunches
                </button>
                <button
                  onClick={() => onSelectRecommendedForAllDays('dinner')}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-semibold text-sm"
                >
                  🤖 Best Dinners
                </button>
              </div>
            </div>
          )}

          {/* Minimum Requirements Banner */}
          {!meetsMinimumRequirements && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-amber-600 text-xl">⚠️</div>
                <div>
                  <p className="font-semibold text-amber-800">Minimum Requirements Not Met</p>
                  <p className="text-sm text-amber-700">
                    {planType === 'weekly' 
                      ? `Weekly requires at least ${WEEKLY_MIN_MEALS} meals. You have ${totalQuantity}.`
                      : `Monthly requires at least ${MONTHLY_MIN_MEALS} meals. You have ${totalQuantity}.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Period Navigation */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
              <button
                onClick={onPrevPeriod}
                className="px-4 py-2 border rounded-lg hover:bg-white"
              >
                ← Previous
              </button>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {planPeriodDisplay}
                </div>
                <div className="text-sm text-gray-600">
                  {planDays.length} days available
                </div>
              </div>
              
              <button
                onClick={onNextPeriod}
                className="px-4 py-2 border rounded-lg hover:bg-white"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Quick Select Buttons */}
          {planDays.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              {/* <h4 className="font-semibold text-gray-900 mb-3">Quick Select:</h4> */}
              {/* <div className="flex flex-wrap gap-3"> */}
                {/* <button
                  onClick={() => onSelectAllMealsOfType('lunch')}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-semibold text-sm"
                >
                  ☀️ Select All Lunches
                </button>
                <button
                  onClick={() => onSelectAllMealsOfType('dinner')}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-semibold text-sm"
                >
                  🌙 Select All Dinners
                </button> */}
                <button
                  onClick={onClearAllSelections}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm"
                >
                  Clear All
                </button>
              {/* </div> */}
            </div>
          )}

          {/* Days Grid */}
          <div className="mb-8">
            {planDays.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Menu Available</h3>
                <button
                  onClick={onNextPeriod}
                  className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 font-semibold"
                >
                  Check Next {planType === 'weekly' ? 'Week' : 'Month'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {planDays.map(dayInfo => {
                  const { dateString, day, dayName, dateDisplay, menuItems: dayMenuItems, isToday: isTodayDay } = dayInfo;
                  const lunchAllowed = isMealSelectionAllowed(dateString, 'lunch');
                  const dinnerAllowed = isMealSelectionAllowed(dateString, 'dinner');
                  
                  return (
                    <div key={dateString} className="border rounded-lg overflow-hidden">
                      {/* Day Header */}
                      <div className="bg-gradient-to-r from-violet-50 to-white border-b p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-gray-900">{dayName}</h3>
                              {isTodayDay && (
                                <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded">
                                  TODAY
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-violet-600 font-semibold">{dateDisplay}</p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {dayMenuItems.lunch.length} lunch • {dayMenuItems.dinner.length} dinner
                          </div>
                        </div>
                      </div>
                      
                      {/* Meals */}
                      <div className="p-4">
                        {/* Lunch */}
                        {dayMenuItems.lunch.length > 0 && (
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                  <span className="text-orange-600">☀️</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">Lunch</h4>
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                  {getSelectedCountForDay(dateString, 'lunch')} items • {getTotalQuantityForDay(dateString, 'lunch')} total
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onSelectRecommendedForDay(dateString, day, 'lunch', dayMenuItems)}
                                  disabled={!lunchAllowed}
                                  className={`px-3 py-1 text-xs rounded font-semibold ${
                                    lunchAllowed
                                      ? 'bg-violet-200 text-violet-800 hover:bg-violet-300'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title="Select best match based on your preferences"
                                >
                                  🤖 Best Match
                                </button>
                                <button
                                  onClick={() => onClearAllMealsForDay(dateString, 'lunch')}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            {!lunchAllowed && isTodayDay && (
                              <div className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">
                                ⚠️ Lunch selection closed (after {LUNCH_CUTOFF_HOUR}:00 AM)
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {dayMenuItems.lunch.map(menuItem => {
                                const isSelected = isMealSelected(dateString, 'lunch', menuItem._id);
                                const quantity = getMealQuantity(dateString, 'lunch', menuItem._id);
                                const key = `${dateString}_lunch_${menuItem._id}`;
                                const badge = getRecommendationBadge(menuItem.score);
                                
                                return (
                                  <div 
                                    key={menuItem._id} 
                                    className={`border rounded-lg p-3 ${
                                      isSelected ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                                    } ${!lunchAllowed ? 'opacity-50' : ''} ${menuItem.score <= -999 ? 'border-red-300 bg-red-50' : ''}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onMealSelect(dateString, day, 'lunch', menuItem._id, e.target.checked)}
                                        disabled={!lunchAllowed || menuItem.score <= -999}
                                        className="w-5 h-5 mt-1 rounded"
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <h5 className="font-medium text-gray-900">{menuItem.name}</h5>
                                          <span className="font-semibold">{menuItem.price} BDT</span>
                                        </div>
                                        
                                        {/* Recommendation Badge */}
                                        {menuItem.score > 1 && (
                                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.textColor} border ${badge.border}`}>
                                            {badge.text}
                                          </span>
                                        )}
                                        
                                        {menuItem.score <= -999 && (
                                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                                            ⚠️ Contains Allergen
                                          </span>
                                        )}
                                        
                                        {menuItem.description && (
                                          <p className="text-xs text-gray-500 mt-1">{menuItem.description}</p>
                                        )}
                                        
                                        {isSelected && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <button
                                              onClick={() => onQuantityChange(key, quantity - 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              -
                                            </button>
                                            <span className="font-semibold">{quantity}</span>
                                            <button
                                              onClick={() => onQuantityChange(key, quantity + 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Dinner */}
                        {dayMenuItems.dinner.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-600">🌙</span>
                                </div>
                                <h4 className="font-semibold text-gray-900">Dinner</h4>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                  {getSelectedCountForDay(dateString, 'dinner')} items • {getTotalQuantityForDay(dateString, 'dinner')} total
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => onSelectRecommendedForDay(dateString, day, 'dinner', dayMenuItems)}
                                  disabled={!dinnerAllowed}
                                  className={`px-3 py-1 text-xs rounded font-semibold ${
                                    dinnerAllowed
                                      ? 'bg-violet-200 text-violet-800 hover:bg-violet-300'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title="Select best match based on your preferences"
                                >
                                  🤖 Best Match
                                </button>
                                <button
                                  onClick={() => onClearAllMealsForDay(dateString, 'dinner')}
                                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            
                            {!dinnerAllowed && isTodayDay && (
                              <div className="text-xs text-red-500 mb-2 p-2 bg-red-50 rounded">
                                ⚠️ Dinner selection closed (after {DINNER_CUTOFF_HOUR}:00 PM)
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {dayMenuItems.dinner.map(menuItem => {
                                const isSelected = isMealSelected(dateString, 'dinner', menuItem._id);
                                const quantity = getMealQuantity(dateString, 'dinner', menuItem._id);
                                const key = `${dateString}_dinner_${menuItem._id}`;
                                const badge = getRecommendationBadge(menuItem.score);
                                
                                return (
                                  <div 
                                    key={menuItem._id} 
                                    className={`border rounded-lg p-3 ${
                                      isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                                    } ${!dinnerAllowed ? 'opacity-50' : ''} ${menuItem.score <= -999 ? 'border-red-300 bg-red-50' : ''}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => onMealSelect(dateString, day, 'dinner', menuItem._id, e.target.checked)}
                                        disabled={!dinnerAllowed || menuItem.score <= -999}
                                        className="w-5 h-5 mt-1 rounded"
                                      />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <h5 className="font-medium text-gray-900">{menuItem.name}</h5>
                                          <span className="font-semibold">{menuItem.price} BDT</span>
                                        </div>
                                        
                                        {/* Recommendation Badge */}
                                        {menuItem.score > 1 && (
                                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.textColor} border ${badge.border}`}>
                                            {badge.text}
                                          </span>
                                        )}
                                        
                                        {menuItem.score <= -999 && (
                                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                                            ⚠️ Contains Allergen
                                          </span>
                                        )}
                                        
                                        {menuItem.description && (
                                          <p className="text-xs text-gray-500 mt-1">{menuItem.description}</p>
                                        )}
                                        
                                        {isSelected && (
                                          <div className="flex items-center gap-2 mt-2">
                                            <button
                                              onClick={() => onQuantityChange(key, quantity - 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              -
                                            </button>
                                            <span className="font-semibold">{quantity}</span>
                                            <button
                                              onClick={() => onQuantityChange(key, quantity + 1)}
                                              className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300"
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="p-4 bg-stone-50 rounded-xl border mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Plan</div>
                <div className="font-semibold text-gray-900">{planType === 'weekly' ? 'Weekly' : 'Monthly'}</div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Total Meals</div>
                <div className="font-semibold text-gray-900">
                  {totalQuantity} meals
                  {!meetsMinimumRequirements && (
                    <span className="text-xs text-red-600 ml-2">
                      (Min: {planType === 'weekly' ? WEEKLY_MIN_MEALS : MONTHLY_MIN_MEALS})
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Days</div>
                <div className="font-semibold text-gray-900">
                  {new Set(Object.values(selectedMeals).map(m => m.date)).size} days
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-600 uppercase mb-1">Items</div>
                <div className="font-semibold text-gray-900">
                  {Object.keys(selectedMeals).length} items
                </div>
              </div>
            </div>
            
            <div className="border-t pt-3">
              {/* Price Breakdown */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{totalPrice.toFixed(2)} BDT</span>
                </div>
                
                {planType === 'monthly' && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Monthly Discount ({MONTHLY_DISCOUNT_PERCENT}%):
                    </span>
                    <span className="font-medium text-green-600">-{discountAmount.toFixed(2)} BDT</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-gray-900">
                    {planType === 'weekly' ? 'Weekly Total:' : 'Monthly Total:'}
                  </span>
                  <div className="text-right">
                    {planType === 'monthly' && discountAmount > 0 && (
                      <div className="text-xs text-gray-500 line-through mb-1">
                        {totalPrice.toFixed(2)} BDT
                      </div>
                    )}
                    <span className="text-xl font-bold text-violet-700">{finalPrice.toFixed(2)} BDT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 border rounded-xl hover:bg-stone-50 font-semibold"
            >
              Cancel
            </button>
            <button 
              onClick={onCreate} 
              disabled={creating || !meetsMinimumRequirements || Object.keys(selectedMeals).length === 0}
              className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : `Start ${planType === 'weekly' ? 'Weekly' : 'Monthly'} Subscription`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}