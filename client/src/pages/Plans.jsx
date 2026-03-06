import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaShoppingCart, 
  FaCreditCard, 
  FaTruck, 
  FaUtensils, 
  FaStar,
  FaClock,
  FaCheckCircle,
  FaRegCalendarCheck,
  FaArrowRight,
  FaPlay
} from 'react-icons/fa';

export default function Plans() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  // Fallback images in case local images don't load
  const fallbackImages = {
    step1: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop",
    step2: "https://images.unsplash.com/photo-1547592180-85f173990554?w=500&auto=format&fit=crop",
    step3: "https://images.unsplash.com/photo-1586769852044-5e4c91e1c8d6?w=500&auto=format&fit=crop",
    step4: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b4?w=500&auto=format&fit=crop",
    step5: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop",
    benefit: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop",
    plan: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop",
    restaurant: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop",
    menu: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&auto=format&fit=crop",
    subscribe: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b4?w=200&auto=format&fit=crop"
  };

  const handleImageError = (e, fallbackKey) => {
    e.target.src = fallbackImages[fallbackKey] || fallbackImages.benefit;
  };

  const steps = [
    { number: 1, title: "Browse & Select", icon: <FaCalendarAlt /> },
    { number: 2, title: "Add to Cart", icon: <FaShoppingCart /> },
    { number: 3, title: "Checkout", icon: <FaCreditCard /> },
    { number: 4, title: "Delivery", icon: <FaTruck /> },
    { number: 5, title: "Enjoy!", icon: <FaUtensils /> }
  ];

  const subscriptionPlans = [
    {
      name: "Casual Eater",
      price: "399",
      period: "week",
      description: "Perfect for trying out different restaurants",
      features: [
        "3 meals per week",
        "Free delivery",
        "Choose between lunch/dinner",
        "Flexible scheduling",
        "Cancel anytime"
      ],
      popular: false,
      color: "bg-violet-50 border-violet-200",
      image: "/ss1.png",
      fallbackKey: "plan"
    },
    {
      name: "Regular Foodie",
      price: "699",
      period: "week",
      description: "For those who love variety in their meals",
      features: [
        "7 meals per week",
        "Free priority delivery",
        "Mix & match restaurants",
        "Early access to new menus",
        "10% discount on extras",
        "Cancel anytime"
      ],
      popular: true,
      color: "bg-violet-100 border-violet-300",
      image: "/ss2.png",
      fallbackKey: "plan"
    },
    {
      name: "Ultimate Gourmet",
      price: "2499",
      period: "month",
      description: "Unlimited access to premium dining experience",
      features: [
        "Unlimited meals (2 per day)",
        "Free express delivery",
        "Access to all premium restaurants",
        "Personalized meal planning",
        "20% discount on all orders",
        "Priority customer support",
        "Free weekly dessert"
      ],
      popular: false,
      color: "bg-violet-50 border-violet-200",
      image: "/ss3.png",
      fallbackKey: "plan"
    }
  ];

  const orderingInstructions = [
    {
      step: 1,
      title: "Browse Restaurants & Menus",
      description: "Explore our curated list of restaurants. View their weekly/monthly menus, read reviews, and check ratings.",
      details: [
        "Click on 'Restaurants' in the navigation",
        "Browse different cuisines and chefs",
        "Check the 'Today', 'Weekly', or 'Monthly' menu view",
        "Read customer reviews and ratings"
      ],
      tip: "Use the filter options to find restaurants near you or by cuisine type.",
      image: "/ss1.png",
      fallbackKey: "step1"
    },
    {
      step: 2,
      title: "Select Your Meals",
      description: "Choose your preferred meals for specific dates. Remember our ordering deadlines!",
      details: [
        "Lunch orders must be placed before 10:00 AM",
        "Dinner orders must be placed before 4:00 PM",
        "You can order for future dates anytime",
        "Add multiple items from different restaurants"
      ],
      warning: "⚠️ Orders placed after deadlines will be scheduled for the next available day.",
      image: "/ss2.png",
      fallbackKey: "step2"
    },
    {
      step: 3,
      title: "Review Your Cart",
      description: "Check your selected items, quantities, and delivery dates before proceeding.",
      details: [
        "Review all items in your cart",
        "Check delivery dates and times",
        "Modify quantities if needed",

      ],
      tip: "The floating cart icon shows your current order total and item count.",
      image: "/ss3.png",
      fallbackKey: "step3"
    },
    {
      step: 4,
      title: "Subscribe to Meals",
      description: "Let AI choose based on your preferences or customize your meal selections manually.",
      details: [
        "🤖 AI will analyze your taste preferences, allergies, and past orders",
        "✓ AI-selected meals are optimized for your satisfaction",
        "🔄 You can override any AI choice and select manually",
        "⚡ Quick-select buttons for AI to choose all lunches or dinners",
        "💰 Review total with monthly discount applied"
      ],
      note: "Wallet balance can be topped up in your dashboard for faster checkout.",
      image: "/ss4.png",
      fallbackKey: "step4"
    },
    {
      step: 5,
      title: "Track & Enjoy",
      description: "Track your order status and get ready for delicious food delivery!",
      details: [
        "Receive order confirmation",
        "Track delivery in real-time",
        "Rate your meals after enjoying",
        "Save favorite restaurants for next time"
      ],
      tip: "Enable notifications for order updates and delivery status.",
      image: "/ss5.png",
      fallbackKey: "step5"
    }
  ];

  const benefits = [
    {
      icon: <FaClock className="text-violet-600" />,
      title: "Save Time",
      description: "No more daily meal decisions. Plan your meals in advance.",
      image: "/time.jpg",
      fallbackKey: "benefit"
    },
    {
      icon: <FaStar className="text-amber-500" />,
      title: "Quality Guaranteed",
      description: "All restaurants are vetted for quality and hygiene standards.",
      image: "/quality.jpeg",
      fallbackKey: "benefit"
    },
    {
      icon: <FaRegCalendarCheck className="text-green-600" />,
      title: "Flexible Scheduling",
      description: "Order for specific dates or set up automatic subscriptions.",
      image: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=200&auto=format&fit=crop",
      fallbackKey: "benefit"
    },
    {
      icon: <FaCheckCircle className="text-blue-600" />,
      title: "Hassle-Free",
      description: "No cooking, no cleaning, just delicious food delivered.",
      image: "/hassle.jpg",
      fallbackKey: "benefit"
    }
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-fixed"
      style={{ backgroundImage: `url(/background.png)` }}
    >
      <div className="pt-28 pb-16 px-4 max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-100/20 to-purple-200/20 rounded-3xl -m-4"></div>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-lg border border-white/30 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white text-3xl shadow-lg">
                  <FaUtensils />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Simple Plans, <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Delicious Results</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Choose from flexible subscription plans or order à la carte. Either way, 
                you get fresh, home-cooked meals delivered right to your door.
              </p>
            </div>
          </div>
        </div>

        {/* How to Order Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-16 border border-gray-200">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">How to Order</h2>
            <p className="text-gray-600">Follow these simple steps to get your delicious meals</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10"></div>
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold mb-3 transition-all duration-300 ${
                    activeStep >= step.number 
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>
                <span className={`text-sm font-medium ${
                  activeStep >= step.number ? 'text-violet-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Step Navigation */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveStep(prev => prev > 1 ? prev - 1 : 1)}
              disabled={activeStep === 1}
              className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition flex items-center gap-2"
            >
              <FaArrowRight className="rotate-180" /> Previous Step
            </button>
            <button
              onClick={() => setActiveStep(prev => prev < 5 ? prev + 1 : 5)}
              disabled={activeStep === 5}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition flex items-center gap-2"
            >
              Next Step <FaArrowRight />
            </button>
          </div>

          {/* Step Details with Image */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-xl text-white shadow-md">
                    {orderingInstructions[activeStep - 1].step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {orderingInstructions[activeStep - 1].title}
                    </h3>
                    <p className="text-gray-600">
                      {orderingInstructions[activeStep - 1].description}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">What to do:</h4>
                  <ul className="space-y-3">
                    {orderingInstructions[activeStep - 1].details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-green-600 text-xs">✓</span>
                        </div>
                        <span className="text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-500">💡</span> 
                    Pro Tip
                  </h4>
                  <p className="text-gray-600 text-sm">
                    {orderingInstructions[activeStep - 1].tip}
                  </p>
                  
                  {orderingInstructions[activeStep - 1].warning && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <span>⚠️</span> Important Note
                      </div>
                      <p className="text-amber-600 text-sm mt-1">
                        {orderingInstructions[activeStep - 1].warning}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Image Container */}
              <div className="relative rounded-xl overflow-hidden shadow-lg group bg-gray-100 h-[400px]">
                <img 
                  src={orderingInstructions[activeStep - 1].image}
                  alt={`Step ${activeStep}`}
                  className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => handleImageError(e, orderingInstructions[activeStep - 1].fallbackKey)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <FaPlay className="text-white text-xs ml-0.5" />
                    </div>
                    <span className="text-xs font-medium">Watch how it works</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Demo */}
            {activeStep === 1 && (
              <div className="mt-8 p-6 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl border border-violet-200">
                <h4 className="font-semibold text-gray-700 mb-4">Quick Demo:</h4>
                <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white border-2 border-violet-300 flex items-center justify-center text-2xl mb-2 mx-auto">
                      🏠
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">Browse Restaurants</p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white border-2 border-violet-300 flex items-center justify-center text-2xl mb-2 mx-auto">
                      📅
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">View Menus</p>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-white border-2 border-violet-300 flex items-center justify-center text-2xl mb-2 mx-auto">
                      ⭐
                    </div>
                    <p className="text-xs md:text-sm text-gray-600">Check Reviews</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        

        {/* Subscription Plans */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-3">Flexible Subscription Plans</h2>
              <p className="text-gray-600">Choose how often you want delicious meals delivered</p>
            </div>
            <div className="bg-violet-50 rounded-xl p-4 max-w-2xl mx-auto border border-violet-200">
              <p className="text-sm text-violet-700">
                💡 <span className="font-semibold">Note:</span> Subscription prices vary by restaurant. 
                Each restaurant sets their own subscription prices based on their menu and quality.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Daily Plan */}
            <div className="relative rounded-2xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden group">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Most Flexible
                </span>
              </div>
              
              <div className="p-8 pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl mb-4 mx-auto border-4 border-white shadow-lg">
                    📅
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Daily Orders</h3>
                  <p className="text-gray-600 text-sm mb-4">Perfect for spontaneous cravings</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-800">Restaurant</span>
                    <span className="text-gray-500">Pricing</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Pay per meal, no commitment</p>
                  <p className="text-xs text-gray-500 mt-2">Pay Minimal Delivery Fee</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {subscriptionPlans[0].features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 rounded-lg font-semibold transition bg-amber-100 text-amber-700 hover:bg-amber-200"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Weekly Plan */}
            <div className="relative rounded-2xl border-2 border-violet-500 shadow-lg bg-gradient-to-b from-violet-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden group">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Most Popular
                </span>
              </div>
              
              <div className="p-8 pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl mb-4 mx-auto border-4 border-white shadow-lg">
                    📦
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Weekly Subscription</h3>
                  <p className="text-gray-600 text-sm mb-4">Save time with weekly meal planning</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-800">Free Delivery</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Per restaurant weekly pricing</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {subscriptionPlans[1].features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 rounded-lg font-semibold transition bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Monthly Plan */}
            <div className="relative rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-2 overflow-hidden group">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Best Value
                </span>
              </div>
              
              <div className="p-8 pt-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl mb-4 mx-auto border-4 border-white shadow-lg">
                    🏆
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Monthly Subscription</h3>
                  <p className="text-gray-600 text-sm mb-4">Maximum savings for regular customers</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-800">10%</span>
                    <span className="text-gray-500">Discount</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Per restaurant monthly pricing</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {subscriptionPlans[2].features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 text-xs">✓</span>
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-3 rounded-lg font-semibold transition bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>

          
        </div>

        
        {/* FAQ Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4 flex gap-3 group">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  ❓
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Can I change my order after placing it?</h4>
                  <p className="text-gray-600 text-sm">
                    Yes, you can modify or cancel your order up to 2 hours before the delivery time.
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-200 pb-4 flex gap-3 group">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  🏠
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">What if I'm not home for delivery?</h4>
                  <p className="text-gray-600 text-sm">
                    Our delivery partners will contact you. You can reschedule or leave delivery instructions.
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-200 pb-4 flex gap-3 group">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  📋
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">How do subscriptions work?</h4>
                  <p className="text-gray-600 text-sm">
                    Choose a plan, select your meals, and we'll deliver on your schedule. Pause or cancel anytime.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4 flex gap-3 group">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  🚚
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Are there any delivery fees?</h4>
                  <p className="text-gray-600 text-sm">
                    Subscriptions include free delivery. À la carte orders may have minimal delivery charges.
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-200 pb-4 flex gap-3 group">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  🍽️
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Can I order from multiple restaurants?</h4>
                  <p className="text-gray-600 text-sm">
                    Absolutely! You can mix and match from different restaurants in the same order.
                  </p>
                </div>
              </div>
              <div className="border-b border-gray-200 pb-4 flex gap-3 group">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-violet-200 transition-colors">
                  💳
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">What payment methods do you accept?</h4>
                  <p className="text-gray-600 text-sm">
                    We accept credit/debit cards, mobile banking, and cash on delivery for most areas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}