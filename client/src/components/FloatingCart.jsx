import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800";

export default function FloatingCart() {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Default to closed for better UX

  // 1. Load User on Mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  // 2. OPTIMIZED Cart Synchronization (No more setInterval lag!)
  useEffect(() => {
    const loadCart = () => {
      const saved = localStorage.getItem("cart");
      setCart(saved ? JSON.parse(saved) : []);
    };

    // Load immediately
    loadCart();

    // Listen for updates from other components
    window.addEventListener('cartUpdated', loadCart);
    window.addEventListener('storage', loadCart);

    return () => {
      window.removeEventListener('cartUpdated', loadCart);
      window.removeEventListener('storage', loadCart);
    };
  }, []);

  // 3. Helper to update storage and notify other components
  const broadcastChange = (newCart) => {
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    // This event tells KitchenProfile to update immediately
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    broadcastChange(newCart);
  };

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) {
      removeItem(index);
      return;
    }
    const newCart = cart.map((item, i) =>
      i === index ? { ...item, quantity } : item
    );
    broadcastChange(newCart);
  };

  // Don't render if not a customer
  if (!user || user.role !== 'customer') return null;

  // Don't render if cart is empty (Optional: Remove this line if you want empty cart to show)
  // if (cart.length === 0) return null; 

  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      {/* Toggle Button (Visible when closed) */}
      <div className={`fixed bottom-4 right-4 z-[9999] ${isOpen ? 'hidden' : 'block'}`}>
        <button 
            onClick={() => setIsOpen(true)}
            className="bg-violet-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative hover:bg-violet-700 transition transform hover:scale-105 active:scale-95"
        >
            <span className="text-2xl">🛒</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce-in">
                {totalItems}
              </span>
            )}
        </button>
      </div>

      {/* Cart Panel */}
      <div className={`fixed right-4 bottom-4 md:bottom-auto md:top-24 z-[9999] w-[calc(100vw-2rem)] md:w-96 max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200 transition-all duration-300 transform origin-bottom-right md:origin-top-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}>
        
        {/* Header */}
        <div 
            onClick={() => setIsOpen(false)}
            className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-5 rounded-t-2xl flex justify-between items-center shadow-md cursor-pointer hover:bg-violet-700 transition-colors group select-none"
        >
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <span className="text-xl">🛒</span>
             </div>
             <div>
                <h3 className="font-bold text-lg leading-tight">Your Cart</h3>
                <p className="text-violet-100 text-xs font-medium">{totalItems} items • {totalPrice} BDT</p>
             </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 text-white w-8 h-8 rounded-full flex items-center justify-center transition">✕</button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50 min-h-[200px] max-h-[50vh]">
            {cart.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-stone-400">
                  <span className="text-4xl mb-2">🍽️</span>
                  <p>Your cart is empty</p>
               </div>
            ) : (
               cart.map((item, index) => (
                 <div
                   key={`${item._id}-${index}`} // Unique key fix
                   className="bg-white p-3 rounded-xl border border-stone-100 shadow-sm flex gap-3 group hover:border-violet-200 transition-colors"
                 >
                   <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden shrink-0 relative">
                     <img
                       src={item.imageUrl || FALLBACK_IMAGE}
                       alt={item.name}
                       className="w-full h-full object-cover"
                       onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                     />
                   </div>
                   
                   <div className="flex-1 min-w-0 flex flex-col justify-between">
                       <div>
                           <div className="flex justify-between items-start">
                               <h4 className="font-bold text-stone-800 text-sm truncate">{item.name}</h4>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); removeItem(index); }} 
                                 className="text-stone-300 hover:text-red-500 transition px-1 -mr-1"
                               >✕</button>
                           </div>
                           <p className="text-xs text-stone-500 truncate capitalize">{item.mealType}</p>
                       </div>

                       <div className="flex items-center justify-between mt-2">
                           <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                               <button 
                                   onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
                                   className="w-6 h-6 flex items-center justify-center text-stone-500 hover:bg-white hover:text-violet-600 rounded-md transition font-bold"
                               >-</button>
                               <span className="text-xs font-bold text-stone-700 w-6 text-center">{item.quantity}</span>
                               <button 
                                   onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
                                   className="w-6 h-6 flex items-center justify-center text-stone-500 hover:bg-white hover:text-violet-600 rounded-md transition font-bold"
                               >+</button>
                           </div>
                           <span className="font-bold text-violet-700 text-sm">{(item.price || 0) * (item.quantity || 1)} ৳</span>
                       </div>
                   </div>
                 </div>
               ))
            )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-stone-100 bg-white rounded-b-2xl shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <div className="flex justify-between items-end mb-4">
              <span className="text-stone-500 text-sm font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-stone-800">
                {totalPrice.toFixed(0)} <span className="text-sm text-stone-400 font-normal">BDT</span>
              </span>
            </div>
            <Link
              to="/cart"
              className="block w-full bg-violet-600 text-white text-center py-3.5 rounded-xl hover:bg-violet-700 active:scale-95 transition font-bold shadow-lg shadow-violet-200"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}