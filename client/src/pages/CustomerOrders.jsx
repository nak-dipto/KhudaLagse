import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import RatingModal from "../components/RatingModal";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [tracking, setTracking] = useState({});
  
  // Filter state
  const [activeFilter, setActiveFilter] = useState("active");
  
  // Rating Modal State
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    staff: null,
    orderId: null,
  });

  // Cancel Confirmation Modal State
  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    orderId: null,
  });

  const formatDeliveryAddress = (address) => {
    if (!address) return "";
    if (address.fullAddress) {
      return address.fullAddress;
    }
    const house = String(address.house ?? "").trim();
    const road = String(address.road ?? "").trim();
    const area = String(address.area ?? "").trim();
    const city = String(address.city ?? "").trim();
    return [house, road, area, city].filter(Boolean).join(", ");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          axiosInstance.get("/api/orders/my"),
          axiosInstance.get("/api/auth/profile"),
        ]);
        setOrders(ordersRes.data || []);
        if (profileRes.data.success) {
          setUser(profileRes.data.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load your orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  // Filter orders based on active filter using delivery date
  const getFilteredOrders = () => {
    // For active orders: pending, accepted, preparing, ready, on_the_way
    // AND delivery is today or in the future
    const activeOrders = orders.filter((o) =>
      ["pending", "accepted", "preparing", "ready", "on_the_way"].includes(o.status) &&
      !isDeliveryInPast(o) // Not delivered in the past
    );
    
    // For past orders: completed, delivered, cancelled
    // OR any order with delivery date in the past
    const pastOrders = orders.filter((o) =>
      ["completed", "delivered", "cancelled"].includes(o.status) ||
      isDeliveryInPast(o)
    );

    switch (activeFilter) {
      case "active":
        return activeOrders;
      case "past":
        return pastOrders;
      case "today":
        // Orders delivered today regardless of status
        return orders.filter((o) => isDeliveryFromToday(o));
      default:
        return activeOrders;
    }
  };

  const handleCancelClick = (orderId) => {
    setCancelModal({ isOpen: true, orderId });
  };

  const confirmCancelOrder = async () => {
    const orderId = cancelModal.orderId;
    if (!orderId) return;

    setUpdatingId(orderId);
    try {
      await axiosInstance.patch(`/api/orders/${orderId}/status`, {
        status: "cancelled",
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "cancelled" } : o))
      );
      setCancelModal({ isOpen: false, orderId: null });
    } catch (err) {
      alert("Failed to cancel order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchTracking = async (orderId) => {
    try {
      const { data } = await axiosInstance.get(
        `/api/deliveries/${orderId}/track`
      );
      setTracking((prev) => ({ ...prev, [orderId]: data }));
    } catch (err) {
      alert("Tracking information not available yet.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
          </div>
          <p className="text-stone-600 text-lg font-medium">Loading your orders...</p>
          <p className="text-stone-400 text-sm mt-2">Please wait</p>
        </div>
      </div>
    );

  const filteredOrders = getFilteredOrders();
  
  // Count active orders (for badge)
  const activeOrdersCount = orders.filter((o) =>
    ["pending", "accepted", "preparing", "ready", "on_the_way"].includes(o.status) &&
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
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
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
                  <p className="text-violet-600 text-xs sm:text-sm font-bold mb-1">Your Orders</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">My Orders</h1>
                  <p className="text-violet-600 font-bold text-xs sm:text-sm">
                    Track current orders and view history
                  </p>
                </div>
              </div>
              
              <Link
                to="/dashboard/customer"
                className="bg-white hover:bg-violet-50 text-violet-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border border-gray-200 hover:border-violet-200"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50/90 backdrop-blur-sm border border-red-100 text-red-600 p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveFilter("active")}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all transform hover:scale-105 ${
              activeFilter === "active"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200"
                : "bg-white/90 backdrop-blur-sm text-stone-600 border border-stone-200/60 hover:border-violet-300 hover:text-violet-600 hover:shadow-md"
            }`}
          >
            <FaBolt className={activeFilter === "active" ? "animate-pulse" : ""} />
            Active Orders
            {activeOrdersCount > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeFilter === "active"
                  ? "bg-white/20 text-white"
                  : "bg-violet-100 text-violet-600"
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
            Delivering Today
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

        {/* Orders Display */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className={`w-2 h-8 rounded-full ${
              activeFilter === "active" ? "bg-violet-500" :
              activeFilter === "past" ? "bg-stone-400" :
              "bg-sky-500"
            }`}></span>
            {activeFilter === "active" && "Active Orders"}
            {activeFilter === "past" && "Past Orders"}
            {activeFilter === "today" && "Today's Deliveries"}
          </h2>

          {filteredOrders.length > 0 ? (
            <div className="grid gap-6">
              {filteredOrders.map((order) => {
                const deliveryDate = getDeliveryDate(order);
                
                return (
                  <OrderCard
                    key={order._id}
                    order={order}
                    deliveryDate={deliveryDate}
                    isUpcoming={["pending", "accepted", "preparing", "ready", "on_the_way"].includes(order.status) && !isDeliveryInPast(order)}
                    onCancelClick={handleCancelClick}
                    updatingId={updatingId}
                    fetchTracking={fetchTracking}
                    tracking={tracking[order._id]}
                    formatDeliveryAddress={formatDeliveryAddress}
                    userAddress={user?.address}
                    onRateDriver={(staff, oid) =>
                      setRatingModal({ isOpen: true, staff, orderId: oid })
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-12 text-center shadow-lg">
              <div className="w-24 h-24 mx-auto mb-4">
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
                {activeFilter === "active" && "Hungry? Explore kitchens near you!"}
                {activeFilter === "past" && "Your order history will appear here"}
                {activeFilter === "today" && "You don't have any deliveries scheduled for today"}
              </p>
              {activeFilter !== "past" && (
                <Link
                  to="/restaurants"
                  className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:from-violet-700 hover:to-purple-700 transition shadow-md hover:shadow-lg"
                >
                  Browse Kitchens →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        {cancelModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border-t-4 border-red-500 scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4">
                  <img 
                    src="/Mascot5.png" 
                    alt="Mascot" 
                    className="w-full h-full object-contain opacity-75"
                  />
                </div>
                <h3 className="text-lg font-bold text-stone-800 mb-2">
                  Cancel Order?
                </h3>
                <p className="text-stone-500 text-sm mb-6">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setCancelModal({ isOpen: false, orderId: null })}
                    className="flex-1 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition"
                  >
                    No, Keep it
                  </button>
                  <button
                    onClick={confirmCancelOrder}
                    disabled={updatingId === cancelModal.orderId}
                    className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-md"
                  >
                    {updatingId === cancelModal.orderId ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Yes, Cancel"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={() =>
            setRatingModal({ isOpen: false, staff: null, orderId: null })
          }
          staff={ratingModal.staff}
          orderId={ratingModal.orderId}
          onSubmitSuccess={() => {
            setOrders((prev) =>
              prev.map((o) =>
                o._id === ratingModal.orderId ? { ...o, isReviewed: true } : o
              )
            );
            alert("Thank you for your feedback!");
          }}
        />
      </div>
    </div>
  );
};

// --- OrderCard Component with delivery date display ---
const OrderCard = ({
  order,
  deliveryDate,
  isUpcoming,
  onCancelClick,
  updatingId,
  fetchTracking,
  tracking,
  formatDeliveryAddress,
  userAddress,
  onRateDriver,
}) => {
  const statusColors = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    accepted: "bg-blue-100 text-blue-700 border-blue-200",
    preparing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ready: "bg-purple-100 text-purple-700 border-purple-200",
    on_the_way: "bg-orange-100 text-orange-700 border-orange-200",
    completed: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200",
    delivered: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 border-violet-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const statusIcons = {
    pending: <FaClock className="text-amber-600" />,
    accepted: <FaCheckCircle className="text-blue-600" />,
    preparing: <FaStore className="text-indigo-600" />,
    on_the_way: <FaMotorcycle className="text-orange-600" />,
    completed: <FaCheckCircle className="text-violet-600" />,
    delivered: <FaCheckCircle className="text-violet-600" />,
    cancelled: <FaTimesCircle className="text-red-600" />,
  };

  const isTrackingAvailable = [
    "accepted",
    "preparing",
    "ready",
    "on_the_way",
  ].includes(order.status);

  // Format delivery date for display
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  const formattedDeliveryTime = deliveryDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm rounded-2xl border ${
        isUpcoming
          ? "border-violet-200 shadow-lg shadow-violet-100/50 hover:shadow-violet-200/50"
          : "border-stone-200/60 hover:border-violet-200"
      } overflow-hidden transition-all hover:shadow-md group`}
    >
      {/* Header with purple accent for active orders */}
      <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
        {isUpcoming && (
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-purple-500"></div>
        )}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-600 font-bold text-xl border-2 border-violet-200">
            {order.restaurantId?.name?.charAt(0) || <FaStore />}
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-lg group-hover:text-violet-600 transition">
              {order.restaurantId?.name || "Unknown Kitchen"}
            </h3>
            <p className="text-stone-400 text-xs font-mono">
              #{order._id.slice(-6).toUpperCase()} • Ordered: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 border ${
            statusColors[order.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {statusIcons[order.status]}
          {order.status.replace("_", " ")}
        </div>
      </div>

      {/* Delivery Date Badge */}
      <div className="px-4 sm:px-6 pt-2">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-semibold">
          <FaCalendarDay />
          Delivery: {formattedDeliveryDate} at {formattedDeliveryTime}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">
            Order Items
          </h4>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li
                key={i}
                className="flex justify-between text-sm text-stone-700 font-medium"
              >
                <span className="flex items-center gap-2">
                  <span className="bg-violet-100 text-violet-600 text-xs w-5 h-5 flex items-center justify-center rounded">
                    {item.quantity}x
                  </span>
                  {item.itemId?.name || "Item"}
                </span>
                <span className="text-stone-500">
                  {item.price * item.quantity} ৳
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
            <span className="font-bold text-stone-800">Total Amount</span>
            <span className="font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent text-lg">
              {order.total} ৳
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-stone-50 to-violet-50/30 rounded-xl p-4 text-sm">
          <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">
            Delivery Details
          </h4>
          <p className="flex items-start gap-2 mb-2 text-stone-600">
            <FaMapMarkerAlt className="mt-1 text-violet-500 flex-shrink-0" />
            <span className="break-words">
              {order.deliveryAddress
                ? formatDeliveryAddress(order.deliveryAddress)
                : userAddress
                ? formatDeliveryAddress(userAddress)
                : order.delivery?.address
                ? formatDeliveryAddress(order.delivery.address)
                : "No address provided"}
            </span>
          </p>
          {order.deliveryAddress?.coordinates?.coordinates && (
            <p className="flex items-center gap-2 text-stone-500 text-xs mt-2">
              <span className="font-mono bg-white/80 px-2 py-1 rounded border border-violet-100">
                {order.deliveryAddress.coordinates.coordinates[1]?.toFixed(6) ||
                  "N/A"}
                ,{" "}
                {order.deliveryAddress.coordinates.coordinates[0]?.toFixed(6) ||
                  "N/A"}
              </span>
            </p>
          )}
          {order.delivery?.deliveryStaff ? (
            <p className="flex items-center gap-2 text-stone-600 mt-3 pt-3 border-t border-violet-200">
              <FaMotorcycle className="text-violet-500" />
              <span>
                Staff:{" "}
                <span className="font-bold text-violet-600">
                  {order.delivery.deliveryStaff.name}
                </span>
              </span>
            </p>
          ) : (
            order.status !== "cancelled" && (
              <p className="text-amber-500 text-xs italic mt-3 pt-3 border-t border-violet-200">
                Assigning delivery staff...
              </p>
            )
          )}
        </div>
      </div>

      {/* Actions Footer */}
      {isUpcoming &&
        order.status !== "cancelled" &&
        order.status !== "delivered" && (
          <div className="p-4 bg-gradient-to-r from-stone-50 to-violet-50/30 border-t border-violet-100 flex flex-wrap gap-3 justify-end">
            {order.status === "pending" && (
              <button
                onClick={() => onCancelClick(order._id)}
                disabled={updatingId === order._id}
                className="text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition border border-transparent hover:border-red-200"
              >
                Cancel Order
              </button>
            )}

            {isTrackingAvailable && (
              <button
                onClick={() => fetchTracking(order._id)}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold px-5 py-2 rounded-lg shadow-sm hover:from-violet-700 hover:to-purple-700 transition flex items-center gap-2 transform hover:scale-105"
              >
                <FaMotorcycle className="animate-pulse" /> Track Order
              </button>
            )}
          </div>
        )}

      {/* Past Orders Review Action */}
      {!isUpcoming &&
        (order.status === "delivered" || order.status === "completed") &&
        order.delivery?.deliveryStaff &&
        !order.isReviewed && (
          <div className="p-4 bg-gradient-to-r from-violet-50/50 to-purple-50/50 border-t border-violet-100 flex justify-end">
            <button
              onClick={() =>
                onRateDriver(order.delivery.deliveryStaff, order._id)
              }
              className="bg-white text-violet-600 border-2 border-violet-200 text-sm font-bold px-5 py-2 rounded-lg shadow-sm hover:bg-gradient-to-r hover:from-violet-600 hover:to-purple-600 hover:text-white hover:border-transparent transition-all flex items-center gap-2 transform hover:scale-105"
            >
              <FaStar className="text-yellow-400" /> Rate Driver
            </button>
          </div>
        )}

      {/* Tracking Info Panel */}
      {tracking && (
        <div className="bg-gradient-to-r from-stone-900 to-violet-900 text-stone-300 p-4 text-sm animate-in slide-in-from-top-2 border-t-2 border-violet-500">
          <div className="flex items-center gap-2 mb-2 text-violet-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            Live Tracking
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs uppercase text-violet-400">
                Status
              </span>
              <span className="text-white capitalize font-semibold">
                {tracking.status?.replace("_", " ")}
              </span>
            </div>
            {tracking.deliveryStaff && (
              <div>
                <span className="block text-xs uppercase text-violet-400">
                  Courier
                </span>
                <span className="text-white font-semibold">
                  {tracking.deliveryStaff.name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;