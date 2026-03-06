import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axios";
import {
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaTimesCircle,
  FaStore,
  FaReceipt,
  FaStar,
  FaExclamationTriangle,
  FaCalendarDay,
  FaHistory,
  FaBolt,
  FaUtensils,
  FaSortAmountDown,
} from "react-icons/fa";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState("active"); // "active", "past", "today"
  
  // Sort direction state
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" for earliest first, "desc" for latest first

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const restaurantId = user?.id;

        if (!restaurantId) {
          setError("User ID missing. Please log in again.");
          setLoading(false);
          return;
        }

        // Also get restaurant name from user data
        setRestaurantName(user?.name || "Your Kitchen");

        const token = localStorage.getItem("token");
        const { data } = await axiosInstance.get(
          `/api/orders/restaurant/${restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOrders(data);

      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to fetch orders. Try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Helper function to get delivery date from order
  const getDeliveryDate = (order) => {
    // First try to get from deliveryDateTime
    if (order.deliveryDateTime) {
      return new Date(order.deliveryDateTime);
    }
    // Fallback to createdAt if no delivery date
    return new Date(order.createdAt);
  };

  // Check if order delivery is from today
  const isDeliveryFromToday = (order) => {
    const today = new Date();
    const deliveryDate = getDeliveryDate(order);
    
    return (
      deliveryDate.getDate() === today.getDate() &&
      deliveryDate.getMonth() === today.getMonth() &&
      deliveryDate.getFullYear() === today.getFullYear()
    );
  };

  // Check if order delivery is in the past
  const isDeliveryInPast = (order) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveryDate = getDeliveryDate(order);
    deliveryDate.setHours(0, 0, 0, 0);
    
    return deliveryDate < today;
  };

  // Check if order delivery is in the future
  const isDeliveryInFuture = (order) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveryDate = getDeliveryDate(order);
    deliveryDate.setHours(0, 0, 0, 0);
    
    return deliveryDate > today;
  };

  // Sort orders by fulfillment date (deliveryDateTime or createdAt)
  const sortOrdersByFulfillmentDate = (ordersToSort) => {
    return [...ordersToSort].sort((a, b) => {
      const dateA = getDeliveryDate(a);
      const dateB = getDeliveryDate(b);
      
      if (sortDirection === "asc") {
        return dateA - dateB; // Earliest first
      } else {
        return dateB - dateA; // Latest first
      }
    });
  };

  // Filter orders based on active filter using delivery date
  const getFilteredAndSortedOrders = () => {
    // Active orders: pending, accepted, cooking, ready, on_the_way AND delivery not in the past
    const activeOrders = orders.filter((o) =>
      ["pending", "accepted", "cooking", "ready", "on_the_way"].includes(o.status) &&
      !isDeliveryInPast(o) // Not delivered in the past
    );
    
    // Past orders: completed, delivered, cancelled OR delivery date in the past
    const pastOrders = orders.filter((o) =>
      ["completed", "delivered", "cancelled"].includes(o.status) ||
      isDeliveryInPast(o)
    );

    let filteredOrders;
    switch (activeFilter) {
      case "active":
        filteredOrders = activeOrders;
        break;
      case "past":
        filteredOrders = pastOrders;
        break;
      case "today":
        // Orders being delivered today regardless of status
        filteredOrders = orders.filter((o) => isDeliveryFromToday(o));
        break;
      default:
        filteredOrders = activeOrders;
    }

    return sortOrdersByFulfillmentDate(filteredOrders);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "accepted": return "bg-blue-100 text-blue-700 border-blue-200";
      case "cooking": return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "ready": return "bg-purple-100 text-purple-700 border-purple-200";
      case "on_the_way": return "bg-orange-100 text-orange-700 border-orange-200";
      case "completed": return "bg-violet-100 text-violet-700 border-violet-200";
      case "delivered": return "bg-violet-100 text-violet-700 border-violet-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <FaClock className="text-amber-600" />;
      case "accepted": return <FaCheckCircle className="text-blue-600" />;
      case "cooking": return <FaUtensils className="text-indigo-600" />;
      case "ready": return <FaStore className="text-purple-600" />;
      case "on_the_way": return <FaMotorcycle className="text-orange-600" />;
      case "completed": return <FaCheckCircle className="text-violet-600" />;
      case "delivered": return <FaCheckCircle className="text-violet-600" />;
      case "cancelled": return <FaTimesCircle className="text-red-600" />;
      default: return <FaClock className="text-stone-600" />;
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const token = localStorage.getItem("token");

    try {
      await axiosInstance.patch(
        `/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.message || "Failed to update status. Try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const rejectOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to reject this order?")) return;

    setUpdatingId(orderId);
    const token = localStorage.getItem("token");

    try {
      await axiosInstance.delete(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      alert("Order rejected and deleted.");
    } catch (err) {
      console.error("Failed to reject order:", err);
      alert("Failed to reject order. Try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed pt-12 relative"
        style={{ 
          backgroundImage: `linear-gradient(rgba(45, 23, 110, 0.49), rgba(72, 24, 131, 0.44)), url(/gray.jpg)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
              </div>
              <p className="text-white text-lg font-medium">Loading your orders...</p>
              <p className="text-white/70 text-sm mt-2">Please wait</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed pt-12 relative"
        style={{ 
          backgroundImage: `linear-gradient(rgba(45, 23, 110, 0.49), rgba(72, 24, 131, 0.44)), url(/gray.jpg)`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-red-50/90 backdrop-blur-sm text-red-600 p-6 rounded-xl border border-red-100 max-w-md text-center">
              <FaExclamationTriangle className="text-3xl mx-auto mb-3 text-red-500" />
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredAndSortedOrders = getFilteredAndSortedOrders();
  
  // Count active orders (for badge) - based on status AND future delivery
  const activeOrdersCount = orders.filter((o) =>
    ["pending", "accepted", "cooking", "ready", "on_the_way"].includes(o.status) &&
    !isDeliveryInPast(o)
  ).length;
  
  // Count today's deliveries (for badge)
  const todayOrdersCount = orders.filter((o) => isDeliveryFromToday(o)).length;

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed pt-12 relative"
      style={{ 
        backgroundImage: `linear-gradient(rgba(45, 23, 110, 0.49), rgba(72, 24, 131, 0.44)), url(/gray.jpg)`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header with Mascot */}
        <div className="mb-8">
          <div 
            className="relative rounded-2xl p-6 shadow-lg overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `url(/white.png)` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-violet-50"></div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
                  <img 
                    src="/Mascot5.png" 
                    alt="Mascot" 
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                </div>
                
                <div>
                  <p className="text-violet-600 text-xs sm:text-sm font-bold mb-1">Kitchen Dashboard</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">{restaurantName}</h1>
                  <p className="text-violet-600 font-bold text-xs sm:text-sm">
                    Manage your orders and track preparation
                  </p>
                </div>
              </div>
              
              <Link
                to="/dashboard/restaurant"
                className="bg-white hover:bg-violet-50 text-violet-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border border-gray-200 hover:border-violet-200"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveFilter("active")}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-105 ${
                activeFilter === "active"
                  ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-200"
                  : "bg-white/90 backdrop-blur-sm text-stone-600 border border-stone-200/60 hover:border-violet-300 hover:text-violet-600 hover:shadow-md"
              }`}
            >
              <FaBolt className={activeFilter === "active" ? "animate-pulse" : ""} />
              Active Orders
              {activeOrdersCount > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === "active"
                    ? "bg-white/20 text-white"
                    : "bg-violet-100 text-violet-700"
                }`}>
                  {activeOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter("past")}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-105 ${
                activeFilter === "past"
                  ? "bg-gradient-to-r from-stone-700 to-stone-800 text-white shadow-lg shadow-stone-200"
                  : "bg-white/90 backdrop-blur-sm text-stone-600 border border-stone-200/60 hover:border-stone-400 hover:text-stone-700 hover:shadow-md"
              }`}
            >
              <FaHistory />
              Past Orders
            </button>

            <button
              onClick={() => setActiveFilter("today")}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-105 ${
                activeFilter === "today"
                  ? "bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-lg shadow-sky-200"
                  : "bg-white/90 backdrop-blur-sm text-stone-600 border border-stone-200/60 hover:border-sky-300 hover:text-sky-600 hover:shadow-md"
              }`}
            >
              <FaCalendarDay />
              Today's Deliveries
              {todayOrdersCount > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeFilter === "today"
                    ? "bg-white/20 text-white"
                    : "bg-sky-100 text-sky-600"
                }`}>
                  {todayOrdersCount}
                </span>
              )}
            </button>
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="px-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border border-stone-200/60 hover:border-violet-300 transition-all flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-violet-600"
          >
            <FaSortAmountDown className={`transition-transform ${sortDirection === "desc" ? "rotate-180" : ""}`} />
            <span className="hidden sm:inline">
              {sortDirection === "asc" ? "Earliest Delivery" : "Latest Delivery"}
            </span>
            <span className="sm:hidden">Sort</span>
          </button>
        </div>

        {/* Orders Display */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-white font-bold text-lg mb-2">
            <span className={`w-2 h-8 rounded-full ${
              activeFilter === "active" ? "bg-violet-500" :
              activeFilter === "past" ? "bg-stone-400" :
              "bg-sky-500"
            }`}></span>
            {activeFilter === "active" && "Active Orders"}
            {activeFilter === "past" && "Past Orders"}
            {activeFilter === "today" && "Today's Deliveries"}
            <span className="ml-2 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">
              {filteredAndSortedOrders.length}
            </span>
            <span className="ml-auto text-xs text-white/60">
              Sorted by: {sortDirection === "asc" ? "Earliest delivery" : "Latest delivery"}
            </span>
          </div>

          {filteredAndSortedOrders.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-16 text-center shadow-lg">
              <div className="w-32 h-32 mx-auto mb-4">
                <img 
                  src="/Mascot5.png" 
                  alt="Mascot" 
                  className="w-full h-full object-contain opacity-50"
                />
              </div>
              <h3 className="font-bold text-stone-600 text-lg mb-2">
                {activeFilter === "active" && "No active orders"}
                {activeFilter === "past" && "No past orders"}
                {activeFilter === "today" && "No deliveries today"}
              </h3>
              <p className="text-stone-400">
                {activeFilter === "active" && "When customers place orders, they'll appear here"}
                {activeFilter === "past" && "Your completed orders will appear here"}
                {activeFilter === "today" && "You don't have any deliveries scheduled for today"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedOrders.map((order) => {
                const deliveryDate = getDeliveryDate(order);
                
                return (
                  <OrderCard
                    key={order._id}
                    order={order}
                    deliveryDate={deliveryDate}
                    isActive={["pending", "accepted", "cooking", "ready", "on_the_way"].includes(order.status) && !isDeliveryInPast(order)}
                    updatingId={updatingId}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    updateOrderStatus={updateOrderStatus}
                    rejectOrder={rejectOrder}
                    sortDirection={sortDirection}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- OrderCard Component with prominent items display ---
const OrderCard = ({
  order,
  deliveryDate,
  isActive,
  updatingId,
  getStatusColor,
  getStatusIcon,
  updateOrderStatus,
  rejectOrder,
  sortDirection,
}) => {
  // Get fulfillment date for display
  const fulfillmentDate = deliveryDate || new Date(order.deliveryDateTime || order.createdAt);
  const isUrgent = () => {
    const now = new Date();
    const timeDiff = fulfillmentDate - now;
    // Less than 30 minutes away
    return timeDiff > 0 && timeDiff < 30 * 60 * 1000;
  };

  // Helper function to get item name safely
  const getItemName = (item) => {
    // Try to get name from itemId if it exists and is populated
    if (item.itemId) {
      if (typeof item.itemId === 'object') {
        return item.itemId.name || 'Unknown Item';
      }
      // If itemId is just an ID, we might not have the name
      return `Item ID: ${item.itemId}`;
    }
    // Fallback to item.name if it exists directly on the item
    return item.name || 'Unknown Item';
  };

  // Helper function to get item description safely
  const getItemDescription = (item) => {
    if (item.itemId && typeof item.itemId === 'object') {
      return item.itemId.description;
    }
    return item.description;
  };

  // Helper function to get item allergens safely
  const getItemAllergens = (item) => {
    if (item.itemId && typeof item.itemId === 'object') {
      return item.itemId.allergens;
    }
    return item.allergens;
  };

  // Format delivery date for display
  const formattedDeliveryDate = fulfillmentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedDeliveryTime = fulfillmentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-2xl border ${
        isActive
          ? "border-violet-200 shadow-lg shadow-violet-100/50 hover:shadow-violet-200/50"
          : "border-stone-200/60 hover:border-violet-200"
      } overflow-hidden transition-all hover:shadow-md group flex flex-col h-full`}
    >
      {/* Header with status and urgent indicator */}
      <div className="p-4 border-b border-stone-100 flex justify-between items-start gap-4 relative">
        {isActive && (
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-500"></div>
        )}
        <div className="flex items-center gap-2">
          <div className="bg-stone-50 p-2 rounded-xl border border-stone-100">
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Order ID</div>
            <div className="text-xs font-mono text-stone-600">#{order._id.slice(-6)}</div>
          </div>
          {isActive && isUrgent() && (
            <div className="bg-red-100 text-red-700 text-[8px] font-bold px-2 py-1 rounded-full animate-pulse">
              🔴 URGENT
            </div>
          )}
        </div>
        <div
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(order.status)}`}
        >
          {getStatusIcon(order.status)}
          {order.status.replace("_", " ")}
        </div>
      </div>

      {/* Delivery Time - Prominently displayed */}
      <div className="px-4 pt-2">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
          <FaCalendarDay />
          Delivery: {formattedDeliveryDate} at {formattedDeliveryTime}
        </div>
        <div className={`flex items-center justify-between p-2 rounded-lg ${
          isActive && isUrgent() 
            ? "bg-red-50 border border-red-200" 
            : "bg-stone-50 border border-stone-200"
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {sortDirection === "asc" ? "⏰ Prepare by" : "📅 Scheduled for"}
          </span>
          <span className={`text-xs font-bold ${
            isActive && isUrgent() ? "text-red-700" : "text-violet-700"
          }`}>
            {formattedDeliveryDate} at {formattedDeliveryTime}
          </span>
        </div>
      </div>

      {/* ITEMS SECTION - PROMINENT DISPLAY */}
      <div className="p-4 bg-gradient-to-r from-violet-50/50 to-purple-50/50 border-b border-stone-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
            <FaUtensils />
          </div>
          <h3 className="font-bold text-stone-800">Items to Prepare</h3>
          <span className="ml-auto bg-violet-200 text-violet-800 text-xs font-bold px-2 py-1 rounded-full">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        
        <div className="space-y-3">
          {order.items.map((item, i) => {
            const itemName = getItemName(item);
            const itemDescription = getItemDescription(item);
            const itemAllergens = getItemAllergens(item);
            
            return (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-violet-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-violet-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
                    <span className="font-bold text-stone-800">
                      {itemName}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-violet-600">
                    {item.price * item.quantity}৳
                  </span>
                </div>
                
                {/* Item Details - Show if available */}
                {itemDescription && (
                  <p className="text-xs text-stone-500 ml-8 mb-2">
                    {itemDescription}
                  </p>
                )}
                
                {/* Special Instructions */}
                {item.specialInstructions && (
                  <div className="ml-8 mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block mb-1">
                      📝 Special Instructions
                    </span>
                    <p className="text-xs text-amber-800">
                      {item.specialInstructions}
                    </p>
                  </div>
                )}
                
                {/* Allergens Warning */}
                {itemAllergens && itemAllergens.length > 0 && (
                  <div className="ml-8 mt-2 flex flex-wrap gap-1">
                    {itemAllergens.map((allergen, idx) => (
                      <span key={idx} className="text-[8px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ {allergen}
                      </span>
                    ))}
                  </div>
                )}

                {/* Debug info - remove in production */}
                {(!item.itemId || (typeof item.itemId === 'string')) && (
                  <div className="ml-8 mt-2 text-[8px] text-amber-600 bg-amber-50 p-1 rounded">
                    Item ID: {item.itemId || 'Not provided'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg">
            <FaReceipt />
          </div>
          <div>
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Total Amount</div>
            <div className="text-sm font-bold text-stone-800">{order.total} BDT</div>
          </div>
        </div>

        {/* Customer Info */}
        {order.customerId && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-lg">
              👤
            </div>
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Customer</div>
              <div className="text-xs font-semibold text-stone-700">
                {order.customerId.name || order.customerId.phone || 'Customer'}
              </div>
            </div>
          </div>
        )}

        {order.isSubscription && (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${order.paymentStatus === 'paid' ? 'bg-violet-50 text-violet-600' : 'bg-amber-50 text-amber-600'}`}>
              {order.paymentStatus === 'paid' ? '✅' : '⏳'}
            </div>
            <div>
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Payment Status</div>
              <div className={`text-xs font-bold ${order.paymentStatus === 'paid' ? 'text-violet-700' : 'text-amber-700'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting Daily Processing'}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Address - if available */}
        {order.deliveryAddress && (
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-start gap-2">
              <FaMapMarkerAlt className="text-violet-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Delivery Address</div>
                <p className="text-xs text-stone-600">
                  {order.deliveryAddress.house && `House ${order.deliveryAddress.house}, `}
                  {order.deliveryAddress.road && `Road ${order.deliveryAddress.road}, `}
                  {order.deliveryAddress.area && `${order.deliveryAddress.area}, `}
                  {order.deliveryAddress.city}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {isActive && (
        <div className="p-4 bg-gradient-to-r from-stone-50 to-violet-50/30 border-t border-stone-100">
          {order.status === "pending" && (
            <div className="flex flex-col gap-2">
              {order.isSubscription && order.paymentStatus === 'unpaid' && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-[10px] text-amber-800 text-center font-medium">
                  <FaExclamationTriangle className="inline mr-1 text-amber-600" />
                  Subscription payment processing...
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateOrderStatus(order._id, "cooking")}
                  disabled={updatingId === order._id || (order.isSubscription && order.paymentStatus === 'unpaid')}
                  className="px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition font-bold text-xs shadow-md disabled:opacity-50 disabled:grayscale"
                >
                  🍳 Start Cooking
                </button>
                <button
                  onClick={() => rejectOrder(order._id)}
                  disabled={updatingId === order._id}
                  className="px-3 py-2 bg-stone-100 text-stone-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition font-bold text-xs disabled:opacity-50"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          )}
          
          {order.status === "cooking" && (
            <button
              onClick={() => updateOrderStatus(order._id, "ready")}
              disabled={updatingId === order._id}
              className="w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-bold text-xs shadow-md disabled:opacity-50"
            >
              📦 Mark Ready for Pickup
            </button>
          )}

          {order.status === "ready" && (
            <div className="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 border-dashed">
              <span className="text-xs font-bold text-indigo-700 animate-pulse flex items-center gap-1">
                <FaMotorcycle className="animate-bounce" />
                Waiting for Driver...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;