import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  :root {
    --v50:  #f5f0ff;
    --v100: #ede9ff;
    --v200: #d9d0ff;
    --v300: #bba8ff;
    --v400: #9d7eff;
    --v500: #7c4dff;
    --v600: #6c35f5;
    --v700: #443174ff;
    --v800: #3d0fba;
    --dark: #6938a5ff;
    --ink:  #1e1030;
    --muted: #7c6e9a;
    --border: #e8e0f5;
    --surface: #ffffff;
    --bg: #f7f4ff;
    --success: #22c78e;
    --danger: #e8445a;
    --warning: #f59e0b;
    --r: 18px;
    --r-sm: 12px;
    --sh: 0 4px 24px rgba(108,53,245,.09);
    --sh-lg: 0 12px 48px rgba(108,53,245,.18);
  }

  .rr-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    padding-top: 72px;
    -webkit-font-smoothing: antialiased;
    background-image: linear-gradient(rgba(45, 23, 110, 0.49), rgba(72, 24, 131, 0.44)), url(/gray.jpg);
    background-size: cover;
    background-position: center;
    background-attachment: fixed;
    position: relative;
  }

  .rr-root *, .rr-root *::before, .rr-root *::after {
    box-sizing: border-box;
  }

  .rr-root::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, #c4b0ff28 1px, transparent 1px);
    background-size: 28px 28px; z-index: 0;
  }

  .rr-wrap {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px 80px; position: relative; z-index: 1;
  }

  /* Hero Section */
  .rr-hero {
    border-radius: var(--r); padding: 32px 40px;
    margin: 0 0 32px; position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--dark) 0%, #3b1680 55%, var(--v700) 100%);
    box-shadow: var(--sh-lg);
  }

  .rr-hero-content {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 24px;
  }

  .rr-hero-left {
    display: flex; align-items: center; gap: 20px;
  }

  .rr-hero-icon {
    width: 64px; height: 64px;
    background: rgba(255,255,255,0.15);
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; color: white;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
  }

  .rr-hero-text {
    color: white;
  }

  .rr-hero-eyebrow {
    font-size: 12px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--v300); margin-bottom: 4px;
  }

  .rr-hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 700; color: white; line-height: 1.2;
  }

  .rr-hero-sub {
    font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 4px;
  }

  .rr-hero-stats {
    display: flex; gap: 24px;
  }

  .rr-hero-stat {
    text-align: center;
  }

  .rr-hero-stat-value {
    font-size: 28px; font-weight: 700; color: white;
    line-height: 1; margin-bottom: 4px;
  }

  .rr-hero-stat-label {
    font-size: 12px; color: rgba(255,255,255,0.5);
    text-transform: uppercase; letter-spacing: 0.05em;
  }

  .rr-back-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white; padding: 10px 20px;
    border-radius: var(--r-sm); font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all .2s;
    display: inline-flex; align-items: center; gap: 8px;
    backdrop-filter: blur(8px);
  }

  .rr-back-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: translateX(-4px);
  }

  /* Stats Grid */
  .rr-stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 20px; margin-bottom: 32px;
  }

  @media (max-width: 768px) { .rr-stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .rr-stats-grid { grid-template-columns: 1fr; } }

  .rr-stat-card {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 24px; position: relative; overflow: hidden;
  }

  .rr-stat-card::before {
    content: ''; position: absolute; top: -24px; right: -24px;
    width: 100px; height: 100px; border-radius: 50%;
    background: var(--v100); opacity: 0.4;
  }

  .rr-stat-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  }

  .rr-stat-icon {
    width: 48px; height: 48px; background: var(--v100);
    border-radius: 14px; display: flex; align-items: center;
    justify-content: center; font-size: 24px; color: var(--v600);
  }

  .rr-stat-label {
    font-size: 13px; color: var(--muted); font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.05em;
  }

  .rr-stat-value {
    font-family: 'Fraunces', serif;
    font-size: 36px; font-weight: 700; color: var(--ink);
    line-height: 1; margin-bottom: 8px;
  }

  .rr-stat-progress {
    height: 6px; background: var(--v100); border-radius: 999px;
    overflow: hidden; margin-top: 12px;
  }

  .rr-stat-progress-bar {
    height: 100%; background: linear-gradient(90deg, var(--v500), var(--v600));
    border-radius: 999px; transition: width 0.3s ease;
  }

  /* Distribution Section */
  .rr-distribution {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 28px; margin-bottom: 32px;
  }

  .rr-section-title {
    font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700;
    color: var(--ink); margin-bottom: 24px; display: flex; align-items: center; gap: 12px;
  }

  .rr-section-icon {
    width: 36px; height: 36px; background: var(--v100);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; font-size: 18px; color: var(--v600);
  }

  .rr-distribution-item {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 12px; padding: 4px 0;
  }

  .rr-distribution-label {
    width: 40px; font-size: 14px; font-weight: 600; color: var(--ink);
  }

  .rr-distribution-stars {
    width: 70px; color: #fbbf24; font-size: 14px;
  }

  .rr-distribution-bar {
    flex: 1; height: 10px; background: var(--v100);
    border-radius: 999px; overflow: hidden;
  }

  .rr-distribution-fill {
    height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b);
    border-radius: 999px; transition: width 0.3s ease;
  }

  .rr-distribution-count {
    width: 40px; font-size: 14px; font-weight: 600; color: var(--muted);
    text-align: right;
  }

  /* Reviews Grid */
  .rr-reviews-grid {
    display: grid; gap: 20px;
  }

  .rr-review-card {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 28px; transition: all .3s;
  }

  .rr-review-card:hover {
    transform: translateY(-4px); box-shadow: var(--sh-lg);
    border-color: var(--v300);
  }

  .rr-review-header {
    display: flex; justify-content: space-between;
    align-items: flex-start; margin-bottom: 20px;
    flex-wrap: wrap; gap: 16px;
  }

  .rr-review-user {
    display: flex; align-items: center; gap: 16px;
  }

  .rr-user-avatar {
    width: 56px; height: 56px; background: var(--v100);
    border-radius: 18px; display: flex; align-items: center;
    justify-content: center; font-size: 24px; color: var(--v600);
  }

  .rr-user-info h4 {
    font-size: 18px; font-weight: 700; color: var(--ink);
    margin-bottom: 4px;
  }

  .rr-user-info .rr-date {
    font-size: 12px; color: var(--muted);
    display: flex; align-items: center; gap: 6px;
  }

  .rr-rating {
    display: flex; gap: 4px; color: #fbbf24; font-size: 18px;
  }

  .rr-rating-number {
    font-size: 14px; font-weight: 600; color: var(--muted);
    margin-left: 8px;
  }

  .rr-review-content {
    padding-left: 72px;
  }

  .rr-review-quote {
    position: relative; padding: 16px 20px;
    background: var(--v50); border-radius: var(--r-sm);
    border: 1px solid var(--border);
  }

  .rr-review-quote::before {
    content: '"'; position: absolute; top: -10px; left: 20px;
    font-size: 40px; color: var(--v300); font-family: serif;
  }

  .rr-review-text {
    font-size: 15px; color: var(--ink); line-height: 1.6;
    margin-bottom: 12px;
  }

  .rr-review-meta {
    display: flex; align-items: center; gap: 16px;
    margin-top: 12px; font-size: 12px;
  }

  .rr-verified-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; background: #e6f7ef; color: #0a7c5f;
    border-radius: 999px; font-weight: 600;
  }

  .rr-order-id {
    color: var(--v400); font-family: monospace;
  }

  /* Loading State */
  .rr-loading {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
  }

  .rr-spinner {
    width: 52px; height: 52px; border: 3.5px solid var(--v200);
    border-top-color: var(--v500); border-radius: 50%;
    animation: rr-spin 1s linear infinite;
  }

  @keyframes rr-spin { to{transform:rotate(360deg)} }

  /* Empty State */
  .rr-empty {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 60px 40px; text-align: center;
  }

  .rr-empty-icon {
    font-size: 64px; margin-bottom: 20px; color: var(--v300);
  }

  .rr-empty-title {
    font-family: 'Fraunces', serif; font-size: 24px;
    font-weight: 700; color: var(--ink); margin-bottom: 12px;
  }

  .rr-empty-text {
    color: var(--muted); margin-bottom: 28px;
  }

  .rr-btn {
    background: linear-gradient(135deg, var(--v500), var(--v600));
    color: white; border: none; border-radius: var(--r-sm);
    padding: 12px 30px; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: all .2s;
  }

  .rr-btn:hover {
    opacity: 0.9; transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(108,53,245,.3);
  }

  /* Error State */
  .rr-error {
    background: #fee2e2; border: 1.5px solid #fecaca;
    border-radius: var(--r); padding: 24px; text-align: center;
    max-width: 480px; margin: 0 auto;
  }

  .rr-error-icon {
    font-size: 48px; margin-bottom: 16px;
  }

  .rr-error-title {
    font-size: 20px; font-weight: 700; color: #b91c1c;
    margin-bottom: 8px;
  }

  .rr-error-text {
    color: #7f1d1d; margin-bottom: 20px;
  }

  @media (max-width: 640px) {
    .rr-hero-content { flex-direction: column; align-items: flex-start; }
    .rr-hero-stats { width: 100%; justify-content: space-between; }
    .rr-review-header { flex-direction: column; }
    .rr-review-content { padding-left: 0; }
  }
`;

export default function ViewReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get(`/api/reviews/${id}`);
        const reviewsData = res.data;
        setReviews(reviewsData);
        
        // Calculate statistics
        if (reviewsData.length > 0) {
          const total = reviewsData.length;
          const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
          const avg = sum / total;
          
          // Calculate distribution
          const dist = {
            5: reviewsData.filter(r => r.rating === 5).length,
            4: reviewsData.filter(r => r.rating === 4).length,
            3: reviewsData.filter(r => r.rating === 3).length,
            2: reviewsData.filter(r => r.rating === 2).length,
            1: reviewsData.filter(r => r.rating === 1).length
          };
          
          setStats({
            averageRating: Number(avg.toFixed(1)),
            totalReviews: total,
            distribution: dist
          });

          // Get restaurant name from first review
          if (reviewsData[0]?.restaurantId?.name) {
            setRestaurantName(reviewsData[0].restaurantId.name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setError(err.response?.data?.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i}>{i < rating ? '★' : '☆'}</span>
    ));
  };

  if (loading) {
    return (
      <>
        <style>{CSS}</style>
        <div className="rr-root">
          <div className="rr-loading">
            <div className="rr-spinner" />
            <p className="rr-loading-txt">Loading reviews…</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{CSS}</style>
        <div className="rr-root">
          <div className="rr-wrap" style={{ paddingTop: '40px' }}>
            <div className="rr-error">
              <div className="rr-error-icon">⚠️</div>
              <div className="rr-error-title">Error Loading Reviews</div>
              <div className="rr-error-text">{error}</div>
              <button className="rr-btn" onClick={() => navigate('/dashboard/restaurant')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (reviews.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <div className="rr-root">
          <div className="rr-wrap" style={{ paddingTop: '40px' }}>
            <div className="rr-empty">
              <div className="rr-empty-icon">⭐</div>
              <div className="rr-empty-title">No Reviews Yet</div>
              <div className="rr-empty-text">
                {restaurantName ? `${restaurantName} hasn't received any reviews yet.` : 'No reviews to display.'}
              </div>
              <button className="rr-btn" onClick={() => navigate('/restaurant-dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="rr-root">
        <div className="rr-wrap">
          {/* Hero Section */}
          <div className="rr-hero">
            <div className="rr-hero-content">
              <div className="rr-hero-left">
                <div className="rr-hero-icon">
                  <img 
                    src="/Mascot5.png" 
                    alt="Mascot" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                    }} 
                  />
                </div>
                <div className="rr-hero-text">
                  <div className="rr-hero-eyebrow">Reviews & Ratings</div>
                  <div className="rr-hero-title">{restaurantName || 'Customer Reviews'}</div>
                  <div className="rr-hero-sub">See what customers are saying</div>
                </div>
              </div>
              <div className="rr-hero-stats">
                <div className="rr-hero-stat">
                  <div className="rr-hero-stat-value">{stats.averageRating}</div>
                  <div className="rr-hero-stat-label">Avg Rating</div>
                </div>
                <div className="rr-hero-stat">
                  <div className="rr-hero-stat-value">{stats.totalReviews}</div>
                  <div className="rr-hero-stat-label">Total Reviews</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="rr-stats-grid">
            <div className="rr-stat-card">
              <div className="rr-stat-header">
                <div className="rr-stat-icon">⭐</div>
                <div className="rr-stat-label">5 Star</div>
              </div>
              <div className="rr-stat-value">{stats.distribution[5]}</div>
              <div className="rr-stat-progress">
                <div className="rr-stat-progress-bar" style={{ width: `${(stats.distribution[5] / stats.totalReviews) * 100}%` }} />
              </div>
            </div>

            <div className="rr-stat-card">
              <div className="rr-stat-header">
                <div className="rr-stat-icon">👍</div>
                <div className="rr-stat-label">4 Star</div>
              </div>
              <div className="rr-stat-value">{stats.distribution[4]}</div>
              <div className="rr-stat-progress">
                <div className="rr-stat-progress-bar" style={{ width: `${(stats.distribution[4] / stats.totalReviews) * 100}%` }} />
              </div>
            </div>

            <div className="rr-stat-card">
              <div className="rr-stat-header">
                <div className="rr-stat-icon">😐</div>
                <div className="rr-stat-label">3 Star</div>
              </div>
              <div className="rr-stat-value">{stats.distribution[3]}</div>
              <div className="rr-stat-progress">
                <div className="rr-stat-progress-bar" style={{ width: `${(stats.distribution[3] / stats.totalReviews) * 100}%` }} />
              </div>
            </div>

            <div className="rr-stat-card">
              <div className="rr-stat-header">
                <div className="rr-stat-icon">👎</div>
                <div className="rr-stat-label">1-2 Star</div>
              </div>
              <div className="rr-stat-value">{stats.distribution[2] + stats.distribution[1]}</div>
              <div className="rr-stat-progress">
                <div className="rr-stat-progress-bar" style={{ width: `${((stats.distribution[2] + stats.distribution[1]) / stats.totalReviews) * 100}%` }} />
              </div>
            </div>
          </div>

  
      

          {/* Reviews List */}
          <div className="rr-reviews-grid">
            {reviews.map((review, index) => (
              <div key={review._id} className="rr-review-card">
                <div className="rr-review-header">
                  <div className="rr-review-user">
                    <div className="rr-user-avatar">
                      {review.user?.name?.charAt(0) || '👤'}
                    </div>
                    <div className="rr-user-info">
                      <h4>{review.user?.name || 'Anonymous Customer'}</h4>
                      <div className="rr-date">
                        <span>📅</span>
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="rr-rating">
                    {renderStars(review.rating)}
                    <span className="rr-rating-number">({review.rating}.0)</span>
                  </div>
                </div>

                <div className="rr-review-content">
                  <div className="rr-review-quote">
                    <p className="rr-review-text">
                      {review.comment || 'No comment provided.'}
                    </p>
                    
                    <div className="rr-review-meta">
                      <span className="rr-verified-badge">
                        <span>✓</span>
                        Verified Purchase
                      </span>
                      {review.orderId && (
                        <span className="rr-order-id">
                          Order #{review.orderId.slice(-6).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Back Button */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <button 
              className="rr-back-btn" 
              onClick={() => navigate('/dashboard/restaurant')}
              style={{ background: 'var(--surface)', color: 'var(--ink)' }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}