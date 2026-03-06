import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Cancel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Get the 'type' from the URL query params (e.g., ?type=cart_checkout)
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get('type');

  // 2. Determine where "Try Again" should take the user
  const redirectPath = useMemo(() => {
    if (type === 'cart_checkout') return '/cart';
    if (type === 'wallet_recharge') return '/wallet';
    return '/dashboard/customer'; // Default fallback
  }, [type]);

  // 3. Dynamic Text based on type
  const title = type === 'cart_checkout' ? 'Order Cancelled' : 'Recharge Cancelled';
  const message = type === 'cart_checkout' 
    ? "You cancelled the payment process. Your items are still safely in your cart."
    : "No worries! Your wallet hasn't been charged. You can try again whenever you're ready.";

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fbf5ffff', 
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '35px', 
        borderRadius: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)', 
        textAlign: 'center',
        maxWidth: '380px', 
        width: '100%'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '15px' }}>🚫</div>
        
        <h1 style={{ 
          color: '#c82d2dff', 
          marginBottom: '10px', 
          fontWeight: '700',
          fontSize: '26px' 
        }}>
          {title}
        </h1>
        
        <p style={{ color: '#59606d', lineHeight: '1.5', fontSize: '15px' }}>
          {message}
        </p>

        <button 
          onClick={() => navigate(redirectPath)} 
          style={{
            marginTop: '25px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#ba64fcff',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Try Again
        </button>

        <p 
          onClick={() => navigate('/dashboard/customer')}
          style={{ 
            marginTop: '18px', 
            color: '#9ca3af', 
            fontSize: '13px', 
            cursor: 'pointer', 
            textDecoration: 'underline' 
          }}
        >
          Return to Dashboard
        </p>
      </div>
    </div>
  );
};

export default Cancel;