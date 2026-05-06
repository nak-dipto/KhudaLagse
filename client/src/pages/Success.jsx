import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const tranId = searchParams.get("tran_id");
  const valId = searchParams.get("val_id");
  
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Clear any pending payment data
    localStorage.removeItem("pendingPayment");
    localStorage.removeItem("cart");
    localStorage.removeItem("selectedAddress");
    
    // Dispatch event to update cart in other components
    window.dispatchEvent(new Event("cartUpdated"));
    
    // Countdown timer for redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard/customer');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-24">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-4">
          Your transaction has been completed successfully.
        </p>
        
        {tranId && (
          <p className="text-sm text-gray-500 mb-4">
            Transaction ID: {tranId}
          </p>
        )}
        
        <div className="bg-violet-50 rounded-lg p-4 mb-4">
          <p className="text-violet-800 font-semibold">
            🎉 Subscription Activated!
          </p>
          <p className="text-sm text-violet-600 mt-1">
            Your subscription is now active. You can view it in your dashboard.
          </p>
        </div>
        
        <p className="text-gray-500 text-sm">
          Redirecting to dashboard in {countdown} seconds...
        </p>
        
        <button
          onClick={() => navigate('/dashboard/customer')}
          className="mt-4 w-full px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
};

export default Success;