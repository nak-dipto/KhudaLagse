import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
    --v700: #5520e0;
    --v800: #3d0fba;
    --v900: #2a0080;
    --dark: #1a0a2e;
    --ink:  #1e1030;
    --muted: #7c6e9a;
    --border: #e8e0f5;
    --surface: #ffffff;
    --bg: #f7f4ff;
    --r: 18px;
    --r-sm: 12px;
    --sh: 0 4px 24px rgba(108,53,245,.09);
    --sh-lg: 0 12px 48px rgba(108,53,245,.18);
  }

  /* Toggle Switch */
  .rp-toggle-container {
    display: flex;
    justify-content: flex-end;
    margin: 8px 0 16px;
  }

  .rp-toggle {
    background: rgba(255,255,255,0.6);
    backdrop-filter: blur(8px);
    border-radius: 40px;
    padding: 3px;
    display: inline-flex;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border: 1px solid rgba(124,77,255,0.15);
  }

  .rp-toggle-btn {
    padding: 6px 16px;
    border-radius: 40px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
    color: var(--muted);
    letter-spacing: 0.2px;
  }

  .rp-toggle-btn.active {
    background: white;
    color: var(--v600);
    box-shadow: 0 2px 6px rgba(124,77,255,0.12);
    font-weight: 600;
  }

  .rp-toggle-btn:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .rp-toggle-btn:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }

  .rp-toggle-btn i, .rp-toggle-btn svg {
    margin-right: 4px;
    font-size: 14px;
  }

  /* AI Recommendation Banner */
  .rp-ai-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: var(--r);
    padding: 16px 24px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: white;
    box-shadow: var(--sh-lg);
  }

  .rp-ai-badge {
    background: rgba(255,255,255,0.2);
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .rp-ai-score {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(124,77,255,0.9);
    color: white;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    z-index: 3;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3);
  }

  .rp-ai-score.high {
    background: linear-gradient(135deg, #22c55e, #16a34a);
  }

  .rp-ai-score.medium {
    background: linear-gradient(135deg, #eab308, #ca8a04);
  }

  .rp-ai-tag {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(236, 72, 153, 0.9);
    color: white;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    z-index: 3;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .rp-recommended-badge {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 6px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 12px;
  }

  .rp-empty-recommendations {
    text-align: center;
    padding: 60px 20px;
    background: var(--surface);
    border-radius: var(--r);
    border: 1.5px solid var(--border);
    box-shadow: var(--sh);
  }

  .rp-empty-recommendations h3 {
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
    margin: 16px 0 8px;
  }

  .rp-empty-recommendations p {
    color: var(--muted);
    margin-bottom: 20px;
  }

  .rp-set-preferences-btn {
    background: linear-gradient(135deg, var(--v500), var(--v700));
    color: white;
    border: none;
    border-radius: var(--r-sm);
    padding: 12px 28px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity .2s, transform .15s;
  }

  .rp-set-preferences-btn:hover {
    opacity: .9;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(108,53,245,.4);
  }

  /* All existing CSS remains the same */
  .rp-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
    padding-top: 12px;
    -webkit-font-smoothing: antialiased;
  }

  .rp-root *, .rp-root *::before, .rp-root *::after {
    box-sizing: border-box;
  }

  .rp-root::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, #c4b0ff28 1px, transparent 1px);
    background-size: 28px 28px; z-index: 0;
  }

  .rp-wrap {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 28px 80px;
    position: relative;
    z-index: 1;
  }

  .rp-hero {
    border-radius: var(--r);
    padding: 8px 12px;
    margin: 24px 0 32px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 3px;
    min-height: 120px;
    background: linear-gradient(135deg, var(--dark) 0%, #3b1680 50%, var(--v700) 100%);
    box-shadow: var(--sh-lg);
  }
  .rp-hero::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 15% 60%, rgba(155,100,255,.35) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 20%, rgba(200,160,255,.2) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 90%, rgba(124,77,255,.25) 0%, transparent 45%);
  }
  .rp-ring {
    position: absolute; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,.1);
  }
  .rp-ring.r1 { width: 340px; height: 340px; top: -120px; right: -80px; }
  .rp-ring.r2 { width: 200px; height: 200px; bottom: -80px; right: 60px; border-color: rgba(155,100,255,.2); }

  .rp-hero-img {
    width: 100px; height: 100px; flex-shrink: 0;
    position: relative; z-index: 1;
    filter: drop-shadow(0 8px 24px rgba(0,0,0,.3));
  }
  .rp-hero-img img { width: 100%; height: 100%; object-fit: contain; }

  .rp-hero-text { flex: 1; position: relative; z-index: 1; }
  .rp-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--v300); margin-bottom: 10px;
  }
  .rp-hero-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(30px, 4.5vw, 50px);
    font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 14px;
  }
  .rp-hero-title em { font-style: italic; color: var(--v300); }
  .rp-loc {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.15);
    color: rgba(255,255,255,.8); font-size: 13px; font-weight: 600;
    padding: 6px 16px; border-radius: 999px; backdrop-filter: blur(8px);
  }
  .rp-loc-dot {
    width: 7px; height: 7px; background: #a78bfa;
    border-radius: 50%; animation: rp-blink 2.5s ease-in-out infinite;
  }
  @keyframes rp-blink { 0%,100%{opacity:1} 50%{opacity:.3} }

  .rp-guest { text-align: center; margin: 36px 0 28px; }
  .rp-guest-title {
    font-family: 'Fraunces', serif;
    font-size: clamp(36px, 6vw, 60px); font-weight: 900;
    color: var(--ink); margin-bottom: 8px;
  }
  .rp-guest-title span { color: var(--v600); }
  .rp-guest-sub { color: var(--muted); font-size: 16px; margin-bottom: 20px; }
  .rp-guest-pill {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--v100); border: 1.5px solid var(--v200);
    color: var(--v700); font-size: 13px; font-weight: 600;
    padding: 8px 18px; border-radius: 999px;
  }

  .rp-tip {
    display: flex; align-items: flex-start; gap: 12px;
    background: var(--v50); border: 1.5px solid var(--v200);
    border-left: 4px solid var(--v500);
    border-radius: var(--r-sm); padding: 14px 18px;
    margin-bottom: 28px; font-size: 13px; color: var(--ink);
  }
  .rp-tip-icon { font-size: 18px; flex-shrink: 0; }

  .rp-search {
    background: var(--surface); border-radius: var(--r);
    padding: 16px; box-shadow: var(--sh); border: 1px solid var(--border);
    display: flex; gap: 12px; margin-bottom: 36px; flex-wrap: wrap;
  }
  .rp-search-field { flex: 1; min-width: 200px; position: relative; }
  .rp-filter-field { width: 220px; min-width: 160px; position: relative; }

  .rp-search-field .rp-icon,
  .rp-filter-field .rp-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); font-size: 16px;
    pointer-events: none; z-index: 1;
  }
  .rp-search-field input,
  .rp-filter-field select {
    width: 100%; border: 1.5px solid var(--border);
    border-radius: var(--r-sm); padding: 12px 14px 12px 42px;
    font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--ink); background: var(--v50); outline: none;
    transition: border-color .2s, box-shadow .2s;
    margin: 0; appearance: none;
  }
  .rp-search-field input:focus,
  .rp-filter-field select:focus {
    border-color: var(--v500);
    box-shadow: 0 0 0 3px rgba(124,77,255,.12);
    background: #fff;
  }
  .rp-filter-field select { cursor: pointer; padding-right: 36px; }
  .rp-filter-arrow {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%); color: var(--muted);
    font-size: 11px; pointer-events: none;
  }

  .rp-section-header {
    display: flex; align-items: baseline;
    justify-content: space-between; margin-bottom: 24px;
    flex-wrap: wrap; gap: 8px;
  }
  .rp-section-title {
    font-family: 'Fraunces', serif; font-size: 26px;
    font-weight: 700; color: var(--ink);
  }
  .rp-count {
    font-size: 13px; font-weight: 600; color: var(--v600);
    background: var(--v100); padding: 4px 14px;
    border-radius: 999px; border: 1px solid var(--v200);
  }

  .rp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 24px;
  }

  .rp-card {
    background: var(--surface); border-radius: var(--r);
    overflow: hidden; border: 1.5px solid var(--border);
    box-shadow: var(--sh); cursor: pointer;
    display: flex; flex-direction: column;
    transition: transform .25s, box-shadow .25s, border-color .25s;
    animation: rp-cardIn .4s ease both;
  }
  .rp-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--sh-lg);
    border-color: var(--v300);
  }
  @keyframes rp-cardIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .rp-card:nth-child(1){animation-delay:.05s}
  .rp-card:nth-child(2){animation-delay:.10s}
  .rp-card:nth-child(3){animation-delay:.15s}
  .rp-card:nth-child(4){animation-delay:.20s}
  .rp-card:nth-child(5){animation-delay:.25s}
  .rp-card:nth-child(6){animation-delay:.30s}
  .rp-card:nth-child(7){animation-delay:.35s}
  .rp-card:nth-child(8){animation-delay:.40s}
  .rp-card:nth-child(9){animation-delay:.45s}

  .rp-card-img { height: 200px; position: relative; overflow: hidden; }
  .rp-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .5s; display: block; }
  .rp-card:hover .rp-card-img img { transform: scale(1.07); }
  .rp-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(26,10,46,.6) 0%, transparent 55%);
  }

  .rp-badge-rating {
    position: absolute; top: 12px; left: 12px;
    background: rgba(255,255,255,.92); backdrop-filter: blur(6px);
    border-radius: 999px; padding: 4px 10px;
    display: flex; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 700; color: var(--ink);
    box-shadow: 0 2px 8px rgba(0,0,0,.12);
  }
  .rp-badge-rating .rp-star { color: #f5a623; font-size: 13px; }
  .rp-badge-rating .rp-cnt { color: var(--muted); font-weight: 500; }

  .rp-btn-fav {
    position: absolute; top: 12px; right: 12px;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,.88); backdrop-filter: blur(6px);
    border: none; cursor: pointer; padding: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; transition: transform .2s, background .2s;
    box-shadow: 0 2px 8px rgba(0,0,0,.12); z-index: 2;
  }
  .rp-btn-fav:hover { transform: scale(1.15); background: #fff; }
  .rp-heart.off { filter: grayscale(1); opacity: .4; }
  .rp-heart.on  { filter: none; opacity: 1; }

  .rp-badge-cuisine {
    position: absolute; bottom: 12px; left: 12px;
    background: rgba(124,77,255,.88); color: #fff;
    font-size: 11px; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; padding: 4px 12px;
    border-radius: 999px; backdrop-filter: blur(4px);
  }

  .rp-card-body { padding: 20px 22px; flex: 1; display: flex; flex-direction: column; }
  .rp-card-name {
    font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700;
    color: var(--ink); margin-bottom: 8px; line-height: 1.2; transition: color .2s;
  }
  .rp-card:hover .rp-card-name { color: var(--v600); }
  .rp-card-addr {
    font-size: 13px; color: var(--muted);
    display: flex; align-items: flex-start; gap: 6px;
    margin-bottom: 16px; line-height: 1.45;
  }

  .rp-matches-label {
    font-size: 11px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: var(--v500); margin-bottom: 8px;
  }
  .rp-matches-list { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
  .rp-match-pill {
    background: var(--v100); border: 1px solid var(--v200);
    color: var(--v700); font-size: 12px; font-weight: 600;
    padding: 3px 10px; border-radius: 999px;
  }

  .rp-card-footer {
    margin-top: auto; padding-top: 16px;
    border-top: 1.5px solid var(--border);
  }
  .rp-btn-view {
    width: 100%; padding: 12px; border-radius: var(--r-sm);
    background: linear-gradient(135deg, var(--v400) 0%, var(--v500) 100%);
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .2s, transform .15s, box-shadow .2s;
    letter-spacing: .02em; margin: 0;
  }
  .rp-btn-view:hover {
    opacity: .9; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(108,53,245,.4);
  }
  .rp-arr { transition: transform .2s; display: inline-block; }
  .rp-btn-view:hover .rp-arr { transform: translateX(4px); }

  .rp-state {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); padding: 60px 32px;
    text-align: center; box-shadow: var(--sh);
  }
  .rp-state-emoji { font-size: 56px; margin-bottom: 20px; }
  .rp-state-title {
    font-family: 'Fraunces', serif; font-size: 26px;
    font-weight: 700; color: var(--ink); margin-bottom: 10px;
  }
  .rp-state-msg { color: var(--muted); font-size: 15px; margin-bottom: 28px; }
  .rp-btn-clear {
    background: linear-gradient(135deg, var(--v500), var(--v700));
    color: #fff; border: none; border-radius: var(--r-sm);
    padding: 12px 28px; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: opacity .2s, transform .15s; margin: 0;
  }
  .rp-btn-clear:hover { opacity: .9; transform: translateY(-1px); }

  .rp-loading {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px; background: var(--bg);
  }
  .rp-spinner {
    width: 52px; height: 52px;
    border: 3.5px solid var(--v200);
    border-top-color: var(--v500); border-right-color: var(--v300);
    border-radius: 50%; animation: rp-spin 1s linear infinite;
  }
  @keyframes rp-spin { to { transform: rotate(360deg); } }
  .rp-loading-txt { font-size: 15px; color: var(--muted); font-weight: 600; }

  @media (max-width: 640px) {
    .rp-hero { padding: 36px 24px; flex-direction: column; text-align: center; }
    .rp-hero-img { margin: 0 auto; }
    .rp-search { flex-direction: column; }
    .rp-filter-field { width: 100%; }
    .rp-toggle-btn { padding: 8px 16px; font-size: 13px; }
  }
`;

const CUISINE_IMGS = {
  Bengali:'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop',
  Italian:'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=600&auto=format&fit=crop',
  Chinese:'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&auto=format&fit=crop',
  Japanese:'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&auto=format&fit=crop',
  Thai:'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=600&auto=format&fit=crop',
  Indian:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop',
  Mexican:'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&auto=format&fit=crop',
  American:'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&auto=format&fit=crop',
  Mediterranean:'https://images.unsplash.com/photo-1544378730-8b5104a5fe7f?w=600&auto=format&fit=crop',
  Korean:'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&auto=format&fit=crop',
  Vietnamese:'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop',
  Turkish:'https://images.unsplash.com/photo-1613565943-3e724a61764f?w=600&auto=format&fit=crop',
  'Fast Food':'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=600&auto=format&fit=crop',
  Seafood:'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop',
  Vegetarian:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop',
  BBQ:'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop',
  Desserts:'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&auto=format&fit=crop',
  Default:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
};

const getCuisineImage = (types) => CUISINE_IMGS[types?.[0]] || CUISINE_IMGS.Default;

// AI Recommendation Engine
const calculateRestaurantScore = (restaurant, userPreferences, menuItems = []) => {
  if (!userPreferences) return 0;
  
  let score = 0;
  const { likes = [], dislikes = [], allergies = [] } = userPreferences;
  
  // Check cuisine types (weight: 3)
  if (restaurant.cuisineTypes && restaurant.cuisineTypes.length > 0) {
    restaurant.cuisineTypes.forEach(cuisine => {
      if (likes.some(like => cuisine.toLowerCase().includes(like.toLowerCase()))) {
        score += 3;
      }
      if (dislikes.some(dislike => cuisine.toLowerCase().includes(dislike.toLowerCase()))) {
        score -= 2;
      }
    });
  }
  
  // Check menu items (weight: 2 per item)
  if (menuItems.length > 0) {
    menuItems.forEach(item => {
      // Check allergies first (negative weight: -5)
      if (allergies.some(allergy => 
        item.name?.toLowerCase().includes(allergy.toLowerCase()) ||
        (item.ingredients && item.ingredients.some(ing => 
          ing.toLowerCase().includes(allergy.toLowerCase())
        ))
      )) {
        score -= 5;
      }
      
      // Check likes
      if (likes.some(like => 
        item.name?.toLowerCase().includes(like.toLowerCase()) ||
        (item.ingredients && item.ingredients.some(ing => 
          ing.toLowerCase().includes(like.toLowerCase())
        ))
      )) {
        score += 2;
      }
      
      // Check dislikes
      if (dislikes.some(dislike => 
        item.name?.toLowerCase().includes(dislike.toLowerCase()) ||
        (item.ingredients && item.ingredients.some(ing => 
          ing.toLowerCase().includes(dislike.toLowerCase())
        ))
      )) {
        score -= 1.5;
      }
    });
  }
  
  // Rating boost (weight: 0.5 per star)
  if (restaurant.rating) {
    score += restaurant.rating * 0.5;
  }
  
  return Math.max(0, score);
};

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [menuMatches, setMenuMatches] = useState([]);
  const [userCity, setUserCity] = useState("");
  const [userPreferences, setUserPreferences] = useState(null);
  const [restaurantScores, setRestaurantScores] = useState({});
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'recommended'

  useEffect(() => { 
    fetchUserData(); 
    fetchRestaurants(); 
    fetchFavorites(); 
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (term.length < 2) { setMenuMatches([]); return; }
    const t = setTimeout(() => fetchMenuMatches(term), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (restaurants.length > 0 && userPreferences) {
      calculateAllScores();
    }
  }, [restaurants, userPreferences]);

  const fetchUserData = () => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u) { 
        setUser(u); 
        setUserCity(u.address?.city || u.city || ""); 
      }
    } catch {}
  };

  const fetchUserPreferences = async () => {
    if (!user) return;
    
    setLoadingPreferences(true);
    try {
      const userId = user.id || user._id;
      const response = await axiosInstance.get(`/api/auth/preferences/${userId}`);
      if (response.data.success && response.data.data) {
        setUserPreferences(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch user preferences:", err);
      // Try localStorage fallback
      const savedPrefs = localStorage.getItem(`foodPreferences_${user.id || user._id}`);
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs));
      }
    } finally {
      setLoadingPreferences(false);
    }
  };

  const calculateAllScores = async () => {
    const scores = {};
    
    // Fetch menu items for each restaurant (in batches to avoid too many requests)
    const batchSize = 5;
    for (let i = 0; i < restaurants.length; i += batchSize) {
      const batch = restaurants.slice(i, i + batchSize);
      await Promise.all(batch.map(async (restaurant) => {
        try {
          const menuRes = await axiosInstance.get(`/api/menu/restaurant/${restaurant._id}`);
          const menuItems = menuRes.data.data || [];
          scores[restaurant._id] = calculateRestaurantScore(restaurant, userPreferences, menuItems);
        } catch (err) {
          console.error(`Failed to fetch menu for ${restaurant._id}:`, err);
          scores[restaurant._id] = calculateRestaurantScore(restaurant, userPreferences, []);
        }
      }));
    }
    
    setRestaurantScores(scores);
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/restaurants");
      const data = res.data;
      const reviews = await Promise.all(data.map(r => axiosInstance.get(`/api/reviews/${r._id}`).then(r => r.data)));
      setRestaurants(data.map((r, i) => {
        const rv = reviews[i];
        const avg = rv.length ? rv.reduce((s, x) => s + x.rating, 0) / rv.length : 0;
        return { ...r, totalRatings: rv.length, rating: avg };
      }));
    } catch (e) { setError(e.response?.data?.error || e.message || "Failed to load"); }
    finally { setLoading(false); }
  };

  const fetchMenuMatches = async (term) => {
    try {
      const res = await axiosInstance.get("/api/menu/search", { params: { query: term } });
      setMenuMatches(res.data?.data || []);
    } catch { setMenuMatches([]); }
  };

  const fetchFavorites = async () => {
    try {
      const res = await axiosInstance.get("/api/auth/favorites");
      setFavorites((res.data.favorites || []).map(f => typeof f === "string" ? f : f._id?.toString() || f.toString()));
    } catch { setFavorites([]); }
  };

  const toggleFavorite = async (id, e) => {
    e.stopPropagation();
    const isFav = favorites.includes(id);
    try {
      if (isFav) { await axiosInstance.delete(`/api/auth/favorites/${id}`); setFavorites(p => p.filter(x => x !== id)); }
      else { await axiosInstance.post(`/api/auth/favorites/${id}`); setFavorites(p => [...p, id]); }
    } catch { alert("Failed to update favourites."); }
  };

  const allCuisines = [...new Set(restaurants.flatMap(r => r.cuisineTypes || []))].sort();
  const matchedMenuMap = menuMatches.reduce((acc, entry) => {
    const id = entry.restaurant?._id;
    if (id) acc[id] = entry.menuItems || [];
    return acc;
  }, {});

  const tl = searchTerm.toLowerCase();
  
  // Filter restaurants by city and search
  const baseFiltered = restaurants
    .filter(r => {
      if (userCity && (r.location?.city || r.city || "").toLowerCase() !== userCity.toLowerCase()) return false;
      const matchSearch = !tl || r.name?.toLowerCase().includes(tl) ||
        r.location?.city?.toLowerCase().includes(tl) ||
        r.location?.area?.toLowerCase().includes(tl) ||
        matchedMenuMap[r._id]?.some(i => i.name?.toLowerCase().includes(tl));
      return matchSearch && (!selectedCuisine || r.cuisineTypes?.includes(selectedCuisine));
    });

  // Get recommended restaurants (score > 5)
  const recommendedRestaurants = useMemo(() => {
    if (!userPreferences || Object.keys(restaurantScores).length === 0) return [];
    
    return baseFiltered
      .map(r => ({
        ...r,
        score: restaurantScores[r._id] || 0
      }))
      .filter(r => r.score > 5) // Only show good matches
      .sort((a, b) => b.score - a.score);
  }, [baseFiltered, restaurantScores, userPreferences]);

  // Get all restaurants (sorted by rating)
  const allRestaurants = baseFiltered
    .map(r => ({
      ...r,
      score: restaurantScores[r._id] || 0
    }))
    .sort((a, b) => {
      if (!a.totalRatings && !b.totalRatings) return 0;
      if (!a.totalRatings) return 1; 
      if (!b.totalRatings) return -1;
      return b.rating !== a.rating ? b.rating - a.rating : b.totalRatings - a.totalRatings;
    });

  const formatAddr = loc => loc
    ? [loc.house, loc.road, loc.area, loc.city].filter(Boolean).join(", ")
    : "Address unavailable";

  const getScoreClass = (score) => {
    if (score >= 15) return "high";
    if (score >= 8) return "medium";
    return "low";
  };

  const handleSetPreferences = () => {
    // Navigate to dashboard where preferences modal can be opened
    navigate('/dashboard/customer');
  };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="rp-loading">
        <div className="rp-spinner"/>
        <p className="rp-loading-txt">Finding great food near you…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="rp-root">
        <div className="rp-wrap">

          {/* Hero */}
          {user ? (
          <div className="relative rounded-2xl p-6 mb-8 overflow-hidden"
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(152, 137, 196, 0.95), rgba(72, 24, 131, 0.9)), url(/gray.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute w-[340px] h-[340px] rounded-full border border-white/10 -top-20 -right-20"></div>
            <div className="absolute w-[200px] h-[200px] rounded-full border border-white/5 -bottom-16 right-20"></div>
            
            <div className="relative z-10 flex items-center gap-1">
              <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                <img 
                  src="/Mascot5.png" 
                  alt="Mascot" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              
              <div className="flex-1">
                <p className="text-amber-300 text-sm font-bold uppercase tracking-wider mb-1">✦ Fresh & local</p>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-1">
                  Discover <span className="text-amber-200">delicious</span><br/>food near you
                </h1>
                {userCity && (
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                    {userCity}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl p-10 text-center mb-8 overflow-hidden"
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(45, 23, 110, 0.95), rgba(72, 24, 131, 0.9)), url(/gray.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute w-[400px] h-[400px] rounded-full border border-white/10 -top-32 -right-32"></div>
            <div className="absolute w-[250px] h-[250px] rounded-full border border-white/5 -bottom-20 -left-20"></div>
            
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Find Your Next <span className="text-violet-300">Favourite</span>
              </h1>
              <p className="text-white/80 text-lg mb-6">Curated kitchens delivering fresh to your door.</p>
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white border border-white/20">
                <span>🔒</span>
                Log in to see restaurants in your city
              </span>
            </div>
          </div>
        )}

          {/* City tip */}
          {user && !userCity && (
            <div className="rp-tip">
              <span className="rp-tip-icon">💡</span>
              <span><strong>Tip:</strong> Add your city in profile settings to see restaurants near you.</span>
            </div>
          )}

          {/* Toggle Switch for View Mode */}
          {user && userPreferences && (
            <div className="rp-toggle-container">
              <div className="rp-toggle">
                <button
                  className={`rp-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                  onClick={() => setViewMode('all')}
                >
                  All Restaurants
                </button>
                <button
                  className={`rp-toggle-btn ${viewMode === 'recommended' ? 'active' : ''}`}
                  onClick={() => setViewMode('recommended')}
                >
                  Recommended for You
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="rp-search">
            <div className="rp-search-field">
              <span className="rp-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name, area, or dish…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="rp-filter-field">
              <span className="rp-icon">🥘</span>
              <select value={selectedCuisine} onChange={e => setSelectedCuisine(e.target.value)}>
                <option value="">All Cuisines</option>
                {allCuisines.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <span className="rp-filter-arrow">▼</span>
            </div>
          </div>

          {/* Section header */}
          {(viewMode === 'all' ? allRestaurants : recommendedRestaurants).length > 0 && (
            <div className="rp-section-header">
              <h2 className="rp-section-title">
                {viewMode === 'all' 
                  ? (userCity ? `Restaurants in ${userCity}` : "All Restaurants")
                  : ` Recommended for You (${recommendedRestaurants.length})`
                }
              </h2>
              <span className="rp-count">
                {(viewMode === 'all' ? allRestaurants : recommendedRestaurants).length} found
              </span>
            </div>
          )}

          {/* Empty Recommendations State */}
          {user && viewMode === 'recommended' && recommendedRestaurants.length === 0 && !loadingPreferences && (
            <div className="rp-empty-recommendations">
              <div className="text-6xl mb-4">🤔</div>
              <h3>No Recommendations Yet</h3>
              <p>
                {!userPreferences || Object.values(userPreferences).every(arr => arr.length === 0)
                  ? "You haven't set any food preferences yet. Tell us what you like to get personalized recommendations!"
                  : "We couldn't find any restaurants matching your preferences. Try adding more likes or adjusting your filters."
                }
              </p>
              <button
                onClick={handleSetPreferences}
                className="rp-set-preferences-btn"
              >
                {!userPreferences || Object.values(userPreferences).every(arr => arr.length === 0)
                  ? "Set Your Preferences"
                  : "Update Preferences"
                }
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rp-state" style={{marginBottom: 28}}>
              <div className="rp-state-emoji">⚠️</div>
              <h2 className="rp-state-title">Something went wrong</h2>
              <p className="rp-state-msg">{error}</p>
              <button className="rp-btn-clear" onClick={fetchRestaurants}>Try Again</button>
            </div>
          )}

          {/* Empty Search State */}
          {!error && (viewMode === 'all' ? allRestaurants : recommendedRestaurants).length === 0 && viewMode === 'all' && (
            <div className="rp-state">
              <div className="rp-state-emoji">🔍</div>
              <h2 className="rp-state-title">
                {userCity ? `Nothing found in ${userCity}` : "No results"}
              </h2>
              <p className="rp-state-msg">
                {userCity ? "Try a different search — new restaurants join all the time." : "Try adjusting your filters."}
              </p>
              {(searchTerm || selectedCuisine) && (
                <button className="rp-btn-clear" onClick={() => { setSearchTerm(""); setSelectedCuisine(""); }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {(viewMode === 'all' ? allRestaurants : recommendedRestaurants).length > 0 && (
            <div className="rp-grid">
              {(viewMode === 'all' ? allRestaurants : recommendedRestaurants).map(r => (
                <div key={r._id} className="rp-card" onClick={() => navigate(`/restaurants/${r._id}`)}>

                  <div className="rp-card-img">
                    <img src={getCuisineImage(r.cuisineTypes)} alt={r.cuisineTypes?.[0] || "food"}/>
                    <div className="rp-img-overlay"/>
                    
                    {/* AI Match Score Tag for recommended view */}
                    {viewMode === 'recommended' && r.score > 0 && (
                      <div className={`rp-ai-score ${getScoreClass(r.score)}`}>
                        Match: {Math.min(100, Math.round((r.score / 20) * 100))}%
                      </div>
                    )}
                    
                    <div className="rp-badge-rating">
                      <span className="rp-star">★</span>
                      <span>{r.rating.toFixed(1)}</span>
                      <span className="rp-cnt">({r.totalRatings})</span>
                    </div>
                    <button className="rp-btn-fav" onClick={e => toggleFavorite(r._id, e)}>
                      <span className={`rp-heart ${favorites.includes(r._id) ? 'on' : 'off'}`}>❤️</span>
                    </button>
                    {r.cuisineTypes?.[0] && (
                      <span className="rp-badge-cuisine">{r.cuisineTypes[0]}</span>
                    )}
                  </div>

                  <div className="rp-card-body">
                    <h2 className="rp-card-name">{r.name}</h2>
                    <p className="rp-card-addr">
                      <span>📍</span>
                      <span>{formatAddr(r.location)}</span>
                    </p>

                    {matchedMenuMap[r._id]?.length > 0 && (
                      <>
                        <p className="rp-matches-label">✦ Matching dishes</p>
                        <div className="rp-matches-list">
                          {matchedMenuMap[r._id].slice(0, 3).map(item => (
                            <span key={item._id} className="rp-match-pill">{item.name}</span>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="rp-card-footer">
                      <button className="rp-btn-view">
                        View Menu <span className="rp-arr">→</span>
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}