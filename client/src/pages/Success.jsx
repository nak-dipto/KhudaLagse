import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // SSLCommerz returns these parameters
  const tranId = searchParams.get("tran_id");
  const valId = searchParams.get("val_id");
  
  const [status, setStatus] = useState("success"); // Always success
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    const verify = async () => {
      // For SSLCommerz flows we store pending payment info in localStorage.
      // On success redirect, we must call backend `/api/payment/verify-payment`
      // so orders/subscriptions are actually created.
      const pendingPaymentRaw = localStorage.getItem("pendingPayment");
      if (!tranId || !valId || !pendingPaymentRaw) {
        // Nothing to verify; fallback behavior
        const timer = setTimeout(() => navigate('/dashboard/customer'), 3000);
        return () => clearTimeout(timer);
      }

      let pendingPayment;
      try {
        pendingPayment = JSON.parse(pendingPaymentRaw);
      } catch {
        localStorage.removeItem("pendingPayment");
        const timer = setTimeout(() => navigate('/dashboard/customer'), 3000);
        return () => clearTimeout(timer);
      }

      // Ensure this success page corresponds to the stored transaction
      if (pendingPayment.tranId && pendingPayment.tranId !== tranId) {
        const timer = setTimeout(() => navigate('/dashboard/customer'), 3000);
        return () => clearTimeout(timer);
      }

      try {
        setVerifying(true);
        setVerifyError("");

        const payload = {
          tranId,
          valId,
          type: pendingPayment.type,
        };

        // Cart checkout verification needs cartItems + address
        if (pendingPayment.type === "cart_checkout") {
          payload.cartItems = pendingPayment.cartItems || [];
          payload.address = pendingPayment.address;
          payload.userId = pendingPayment.userId;
        }

        // Subscription verification can be done via subscriptionId (preferred)
        if (pendingPayment.type === "subscription_payment") {
          payload.subscriptionId = pendingPayment.subscriptionId;
          payload.userId = pendingPayment.userId;
        }

        await axiosInstance.post("/api/payment/verify-payment", payload);

        // Clear pending payment and any cart/address remnants
        localStorage.removeItem("pendingPayment");
        localStorage.removeItem("cart");
        localStorage.removeItem("selectedAddress");
        window.dispatchEvent(new Event("cartUpdated"));

        const timer = setTimeout(() => {
          navigate('/dashboard/customer');
        }, 2000);

        return () => clearTimeout(timer);
      } catch (err) {
        console.error("Payment verification failed:", err);
        setVerifyError(err.response?.data?.message || err.message || "Payment verification failed");

        // Keep pendingPayment for retry/debug, but still navigate away after a bit
        const timer = setTimeout(() => {
          navigate('/dashboard/customer');
        }, 5000);

        return () => clearTimeout(timer);
      } finally {
        setVerifying(false);
      }
    };

    return verify();
  }, [navigate]);

  // --- STYLES ---
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f9fafb'
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '500px',
    width: '100%'
  };

  const buttonStyle = {
    marginTop: '24px',
    width: '100%',
    padding: '14px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* SUCCESS STATE */}
        <div>
          <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>🎉</div>

          <h1 style={{ color: '#111827', fontWeight: '800', fontSize: '2.25rem', marginBottom: '16px' }}>
            Payment Successful!
          </h1>

          <p style={{ color: '#4b5563', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px' }}>
            Your transaction has been completed successfully.
            <br />
            <span style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '10px', display: 'block' }}>
              Transaction ID: {tranId}
            </span>
          </p>

          {verifying && (
            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '10px' }}>
              Verifying payment and creating your order/subscription...
            </p>
          )}

          {verifyError && (
            <p style={{ color: '#b91c1c', fontSize: '0.95rem', marginBottom: '10px' }}>
              {verifyError}
            </p>
          )}

          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '10px' }}>
            Redirecting to dashboard...
          </p>

          <button 
            style={buttonStyle} 
            onClick={() => navigate('/dashboard/customer')}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Success;
