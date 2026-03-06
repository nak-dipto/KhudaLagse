import { useState, useEffect } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import MapAddressSelector from "../components/MapAddressSelector";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800";
const DELIVERY_FEE = 30; // Delivery fee in BDT

const CartPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Check user role and redirect
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        if (parsedUser.role !== "customer") {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const removeItem = (index) =>
    setCart((prev) => prev.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity } : item))
    );
  };

 const toggleDeliveryHour = (index) => {
  setCart((prev) =>
    prev.map((item, i) => {
      if (i !== index) return item;
      
      const currentHour = item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20);
      let newHour;
      
      if (item.mealType === "lunch") {
        // Toggle between 1 PM (13) and 2 PM (14)
        newHour = currentHour === 13 ? 14 : 13;
      } else {
        // Toggle between 8 PM (20) and 9 PM (21)
        newHour = currentHour === 20 ? 21 : 20;
      }
      
      return { ...item, deliveryHour: newHour };
    })
  );
};

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const totalPrice = subtotal + DELIVERY_FEE;

  // --- SSLCOMMERZ PAYMENT LOGIC ---
  const handleSSLCommerzCheckout = async () => {
    if (cart.length === 0) return;
    if (!selectedAddress) {
      alert("Please select a delivery address before checkout. 📍");
      return;
    }

    try {
      setLoading(true);

      const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        _id: item._id,
        restaurant: item.restaurant || item.restaurantId,
        deliveryDate: item.date || item.deliveryDate,
        deliveryHour: item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20),
        mealType: item.mealType || "lunch"
      }));

      const { data } = await axiosInstance.post("/api/payment/sslcommerz-init", {
        items: orderItems,
        address: selectedAddress,
        totalAmount: totalPrice,
        customerName: user?.name,
        customerEmail: user?.email,
        customerPhone: user?.phone,
        deliveryFee: DELIVERY_FEE,
        type: "cart_checkout",
        userId: user?._id,
      });

      if (data.success && data.gatewayUrl) {
        localStorage.setItem("pendingPayment", JSON.stringify({
          tranId: data.tranId,
          type: "cart_checkout",
          cartItems: orderItems,
          address: selectedAddress,
          userId: user?._id,
        }));

        window.location.href = data.gatewayUrl;
      } else {
        alert("Failed to initialize payment. Please try again.");
      }
    } catch (err) {
      console.error("SSLCommerz Error:", err);
      alert(`Payment Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- CASH ON DELIVERY LOGIC ---
  const handleCashOnDelivery = async () => {
    if (cart.length === 0 || !selectedAddress) {
      alert("Please check your cart and address! ");
      return;
    }

    if (!window.confirm(`Place order for ${totalPrice} BDT using Cash on Delivery?`)) return;

    try {
      setLoading(true);
      
      const orderPromises = cart.map(item => {
        const deliveryDateTime = new Date(item.date || item.deliveryDate);
        deliveryDateTime.setHours(item.deliveryHour ?? (item.mealType === "lunch" ? 13 : 20), 0, 0, 0);

        return axiosInstance.post("/api/orders", {
          restaurantId: item.restaurant || item.restaurantId,
          items: [{ 
            itemId: item._id, 
            quantity: item.quantity || 1, 
            price: item.price, 
            mealType: item.mealType || "lunch" 
          }],
          total: (item.price * (item.quantity || 1)) + DELIVERY_FEE,
          deliveryDateTime: deliveryDateTime.toISOString(),
          paymentMethod: "cash_on_delivery",  // Changed from "wallet"
          paymentStatus: "unpaid",  // Explicitly set to unpaid
          deliveryAddress: selectedAddress,
          deliveryFee: DELIVERY_FEE,
        });
      });

      await Promise.all(orderPromises);
      alert("Orders placed successfully! 🎉 Please keep cash ready for delivery.");
      clearCart();
      localStorage.removeItem("selectedAddress");
      window.dispatchEvent(new Event("cartUpdated"));
      navigate('/my-orders'); // Redirect to orders page
    } catch (err) {
      console.error("Cash on Delivery failed:", err);
      alert("One or more orders failed. Check console.");
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 pt-24">
        {/* Mascot Image - Black & White */}
        <div className="w-64 h-64 md:w-112 md:h-112 mb-0">
          <img 
            src="/Mascot5.png" 
            alt="Mascot" 
            className="w-full h-full object-contain filter grayscale contrast-75"
          />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-700 mb-6">Your Cart is Empty</h2>
        
        <button 
          onClick={() => navigate('/restaurants')} 
          className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md"
        >
          Back to Browsing
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Cart</h2>

        {/* Address Section */}
        <div className="mb-8 pb-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 font-display">Delivery Address</h3>
          <MapAddressSelector 
            onAddressSelect={(address) => {
              setSelectedAddress(address);
              localStorage.setItem("selectedAddress", JSON.stringify(address));
            }} 
            initialAddress={selectedAddress} 
          />
        </div>

        {/* Items Section */}
        <div className="space-y-6">
          {cart.map((item, index) => (
            <div key={index} className="flex flex-col md:flex-row items-start md:items-center justify-between border border-gray-200 rounded-lg p-4 gap-4 hover:shadow-sm transition">
              <div className="flex items-start gap-4 flex-1">
                <img src={item.imageUrl || FALLBACK_IMAGE} alt={item.name} className="w-24 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  
                  {/* Delivery time section */}
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <span className="text-sm font-medium text-blue-700">Time:</span>
                      <span className="text-blue-900 font-semibold">
                        {item.deliveryHour ?? (item.mealType === 'lunch' ? 13 : 20)}:00
                      </span>
                      <button 
                        onClick={() => toggleDeliveryHour(index)}
                        className="ml-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition font-medium"
                      >
                        Change
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-lg">
                      <span className="text-sm font-medium text-violet-700">Meal:</span>
                      <span className="text-violet-900 font-semibold capitalize">{item.mealType}</span>
                    </div>
                  </div>
                  
                  {/* Quantity controls */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-gray-900">{item.quantity || 1}</span>
                      <button 
                        onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold"
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(index)}
                      className="text-sm text-pink-500 hover:text-pink-600 font-medium flex items-center gap-1"
                    >
                      Remove item
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-2xl font-bold text-violet-700">{(item.price || 0) * (item.quantity || 1)} BDT</p>
                <p className="text-sm text-gray-500 mt-1">{item.price || 0} BDT each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between mb-2"><span>Subtotal</span><span>{subtotal.toFixed(2)} BDT</span></div>
          <div className="flex justify-between mb-2"><span>Delivery Fee</span><span>{DELIVERY_FEE.toFixed(2)} BDT</span></div>
          <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-2">
            <span>Total</span><span>{totalPrice.toFixed(2)} BDT</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <button onClick={clearCart} className="text-pink-500 font-semibold hover:underline">Clear Cart</button>
          
          <div className="flex flex-wrap gap-3">
            {/* Cash on Delivery Button */}
            <button
              onClick={handleCashOnDelivery}
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
            >
              {loading ? "Placing Order..." : "💵 Cash on Delivery"}
            </button>

            {/* Online Payment Button */}
            <button
              onClick={handleSSLCommerzCheckout}
              disabled={loading}
              className="bg-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-pink-700 transition flex items-center gap-2"
            >
              {loading ? "Redirecting..." : "💳 Pay Online"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;