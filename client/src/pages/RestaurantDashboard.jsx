import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

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
    --dark: #1a0a2e;
    --ink:  #1e1030;
    --muted: #7c6e9a;
    --border: #e8e0f5;
    --surface: #ffffff;
    --bg: #f7f4ff;
    --success: #22c78e;
    --danger: #e8445a;
    --r: 18px;
    --r-sm: 12px;
    --sh: 0 4px 24px rgba(108,53,245,.09);
    --sh-lg: 0 12px 48px rgba(108,53,245,.18);
  }

  .rd-root {
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

  .rd-root *, .rd-root *::before, .rd-root *::after {
    box-sizing: border-box;
  }

  .rd-root::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle, #c4b0ff28 1px, transparent 1px);
    background-size: 28px 28px; z-index: 0;
  }

  .rd-wrap {
    max-width: 1200px; margin: 0 auto;
    padding: 0 24px 80px; position: relative; z-index: 1;
  }

  /* ── Hero ── */
  .rd-hero {
    border-radius: var(--r); padding: 40px 48px; margin: 36px 0 28px;
    position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: space-between; gap: 24px;
    background: linear-gradient(135deg, var(--dark) 0%, #3b1680 55%, var(--v700) 100%);
    box-shadow: var(--sh-lg);
  }
  .rd-hero::before {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 10% 50%, rgba(155,100,255,.3) 0%, transparent 55%),
      radial-gradient(ellipse at 90% 20%, rgba(200,160,255,.18) 0%, transparent 50%);
  }
  .rd-hero-ring {
    position: absolute; border-radius: 50%;
    border: 1.5px solid rgba(255,255,255,.08);
  }
  .rd-hero-ring.r1 { width: 320px; height: 320px; top: -100px; right: -60px; }
  .rd-hero-ring.r2 { width: 180px; height: 180px; bottom: -70px; right: 80px; border-color: rgba(155,100,255,.15); }

  .rd-hero-left { position: relative; z-index: 1; }
  .rd-hero-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--v300); margin-bottom: 8px;
  }
  .rd-hero-name {
    font-family: 'Fraunces', serif;
    font-size: clamp(26px, 4vw, 42px);
    font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 10px;
  }
  .rd-hero-sub { font-size: 14px; color: rgba(255,255,255,.5); }

  .rd-hero-right { position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; }

  .rd-status-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 16px; border-radius: 999px;
    font-size: 13px; font-weight: 700; letter-spacing: .02em;
    border: 1.5px solid transparent;
  }
  .rd-status-badge.open {
    background: rgba(34,199,142,.15); color: #22c78e;
    border-color: rgba(34,199,142,.25);
  }
  .rd-status-badge.closed {
    background: rgba(232,68,90,.12); color: #e8445a;
    border-color: rgba(232,68,90,.2);
  }
  .rd-status-dot {
    width: 7px; height: 7px; border-radius: 50%;
  }
  .rd-status-badge.open .rd-status-dot { background: #22c78e; }
  .rd-status-badge.closed .rd-status-dot { background: #e8445a; opacity: .7; }

  .rd-btn-toggle {
    padding: 9px 20px; border-radius: var(--r-sm); font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; transition: all .2s;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .rd-btn-toggle.close-btn { background: rgba(232,68,90,.9); color: #fff; }
  .rd-btn-toggle.close-btn:hover { background: #e8445a; box-shadow: 0 4px 14px rgba(232,68,90,.4); }
  .rd-btn-toggle.open-btn { background: rgba(34,199,142,.9); color: #fff; }
  .rd-btn-toggle.open-btn:hover { background: #22c78e; box-shadow: 0 4px 14px rgba(34,199,142,.35); }
  .rd-btn-toggle:disabled { opacity: .5; cursor: not-allowed; }

  .rd-btn-signout {
    background: rgba(255,255,255,.1); color: rgba(255,255,255,.7);
    border: 1px solid rgba(255,255,255,.15); padding: 9px 18px;
    border-radius: var(--r-sm); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .2s; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .rd-btn-signout:hover { background: rgba(255,255,255,.18); color: #fff; }

  /* ── Stats grid ── */
  .rd-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 16px; margin-bottom: 24px;
  }
  @media (max-width: 768px) { .rd-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .rd-stats { grid-template-columns: 1fr; } }

  .rd-stat {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 22px 24px; position: relative; overflow: hidden;
  }
  .rd-stat::before {
    content: ''; position: absolute; top: -24px; right: -24px;
    width: 80px; height: 80px; border-radius: 50%;
    background: var(--v100); opacity: .6;
  }
  .rd-stat-icon { font-size: 24px; margin-bottom: 12px; position: relative; }
  .rd-stat-value {
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 32px; font-weight: 700;
    color: var(--ink); line-height: 1; margin-bottom: 4px; position: relative;
  }
  .rd-stat-label { font-size: 13px; color: var(--muted); font-weight: 500; position: relative; }
  .rd-stat.clickable { cursor: pointer; transition: transform .2s, box-shadow .2s, border-color .2s; }
  .rd-stat.clickable:hover { transform: translateY(-3px); box-shadow: var(--sh-lg); border-color: var(--v300); }

  /* ── Quick actions ── */
  .rd-actions {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 16px; margin-bottom: 28px;
  }
  @media (max-width: 640px) { .rd-actions { grid-template-columns: 1fr; } }

  .rd-action-btn {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 24px; cursor: pointer; text-align: left;
    transition: transform .2s, box-shadow .2s, border-color .2s;
  }
  .rd-action-btn:hover { transform: translateY(-4px); box-shadow: var(--sh-lg); border-color: var(--v300); }

  .rd-action-icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: var(--v100); display: flex; align-items: center;
    justify-content: center; font-size: 22px; margin-bottom: 14px;
    transition: background .2s;
  }
  .rd-action-btn:hover .rd-action-icon { background: var(--v200); }
  .rd-action-title {
    font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700;
    color: var(--ink); margin-bottom: 4px; transition: color .2s;
  }
  .rd-action-btn:hover .rd-action-title { color: var(--v600); }
  .rd-action-desc { font-size: 13px; color: var(--muted); }

  /* ── Admin comments ── */
  .rd-panel {
    background: var(--surface); border-radius: var(--r);
    border: 1.5px solid var(--border); box-shadow: var(--sh);
    padding: 28px; margin-bottom: 24px;
  }
  .rd-panel-title {
    font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700;
    color: var(--ink); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
  }
  .rd-panel-title-icon {
    width: 32px; height: 32px; background: var(--v100);
    border-radius: 8px; display: flex; align-items: center;
    justify-content: center; font-size: 16px;
  }
  .rd-comment-item {
    padding: 14px 16px; border-radius: var(--r-sm);
    border: 1px solid var(--border); margin-bottom: 10px;
    background: var(--v50);
  }
  .rd-comment-item:last-child { margin-bottom: 0; }
  .rd-comment-dish { font-weight: 700; font-size: 14px; color: var(--ink); margin-bottom: 4px; }
  .rd-comment-text { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .rd-comment-meta { font-size: 11px; color: var(--v400); margin-top: 6px; font-weight: 600; }
  .rd-empty-state { text-align: center; padding: 32px 0; color: var(--muted); font-size: 14px; }

  /* ── Info panel ── */
  .rd-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  }
  @media (max-width: 580px) { .rd-info-grid { grid-template-columns: 1fr; } }
  .rd-info-col-span { grid-column: 1 / -1; }
  .rd-info-label {
    font-size: 11px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 5px;
  }
  .rd-info-value { font-size: 15px; font-weight: 500; color: var(--ink); }
  .rd-info-value.empty { color: #ccc; font-style: italic; }
  .rd-divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* ── Settings Modal ── */
  .rd-modal-backdrop {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(26,10,46,.6); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }

  .rd-modal {
    background: var(--surface); border-radius: var(--r);
    box-shadow: var(--sh-lg); padding: 36px;
    width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  }

  .rd-modal-title {
    font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700;
    color: var(--ink); margin-bottom: 24px;
  }

  .rd-form-group { margin-bottom: 16px; }
  .rd-form-group label {
    display: block; font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em;
    color: var(--muted); margin-bottom: 7px;
  }
  .rd-form-group input {
    width: 100%; border: 1.5px solid var(--border); border-radius: var(--r-sm);
    padding: 11px 14px; font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif; color: var(--ink);
    background: var(--v50); outline: none;
    transition: border-color .2s, box-shadow .2s;
  }
  .rd-form-group input:focus {
    border-color: var(--v500); box-shadow: 0 0 0 3px rgba(124,77,255,.12); background: #fff;
  }

  .rd-form-section-label {
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .08em; color: var(--v600); margin: 20px 0 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .rd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 480px) { .rd-form-grid { grid-template-columns: 1fr; } }

  .rd-alert {
    padding: 12px 16px; border-radius: var(--r-sm);
    font-size: 13px; margin-bottom: 16px;
  }
  .rd-alert.error { background: #fff0f2; border: 1px solid #ffd6dc; color: var(--danger); }
  .rd-alert.success { background: #f0fdf8; border: 1px solid #b0f0e2; color: #1a7a66; }

  .rd-modal-actions { display: flex; gap: 12px; margin-top: 28px; }
  .rd-btn-primary {
    flex: 1; background: linear-gradient(135deg, var(--v500), var(--v500));
    color: #fff; border: none; border-radius: var(--r-sm);
    padding: 12px; font-size: 14px; font-weight: 700; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: opacity .2s, transform .15s, box-shadow .2s;
  }
  .rd-btn-primary:hover { opacity: .9; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(108,53,245,.35); }
  .rd-btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  .rd-btn-ghost {
    flex: 1; background: none; border: 1.5px solid var(--border); color: var(--ink-2);
    border-radius: var(--r-sm); padding: 12px; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: border-color .2s, background .2s;
  }
  .rd-btn-ghost:hover { border-color: var(--muted); background: var(--v50); }
  .rd-btn-ghost:disabled { opacity: .5; cursor: not-allowed; }

  /* Loading */
  .rd-loading {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px; background: var(--bg);
  }
  .rd-spinner {
    width: 52px; height: 52px; border: 3.5px solid var(--v200);
    border-top-color: var(--v500); border-right-color: var(--v300);
    border-radius: 50%; animation: rd-spin 1s linear infinite;
  }
  @keyframes rd-spin { to{transform:rotate(360deg)} }
  .rd-loading-txt { font-size: 15px; color: var(--muted); font-weight: 600; }

  @media (max-width: 640px) {
    .rd-hero { padding: 28px 24px; flex-direction: column; align-items: flex-start; }
    .rd-hero-right { flex-wrap: wrap; }
  }
`;

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminMealComments, setAdminMealComments] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '', phone: '',
    locationHouse: '', locationRoad: '', locationArea: '', locationCity: '',
    cuisineTypes: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [togglingStatus, setTogglingStatus] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }

    const fetchRestaurantData = async () => {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'restaurant') { navigate('/'); return; }
        setUser(parsedUser);

        try {
          const menuRes = await axiosInstance.get('/api/menu');
          const items = menuRes.data.data || [];
          setAdminMealComments(
            items
              .filter(m => String(m.adminComment || '').trim().length > 0)
              .sort((a, b) => {
                const aT = a.adminCommentedAt ? new Date(a.adminCommentedAt).getTime() : 0;
                const bT = b.adminCommentedAt ? new Date(b.adminCommentedAt).getTime() : 0;
                return bT - aT;
              })
          );
        } catch { setAdminMealComments([]); }

        const response = await axiosInstance.get('/api/restaurants');
        const found = response.data.find(r => r._id === parsedUser.id || r.email === parsedUser.email);
        const rest = found || {
          _id: parsedUser.id, name: parsedUser.name,
          email: parsedUser.email, phone: parsedUser.phone,
          location: {}, cuisineTypes: [], menu: [], isOpen: false,
        };
        setRestaurant(rest);
        initForm(rest);
      } catch (err) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const fallback = { name: parsedUser.name, email: parsedUser.email, phone: parsedUser.phone };
        setRestaurant(fallback);
        initForm(fallback);
      } finally { setLoading(false); }
    };

    fetchRestaurantData();
  }, [navigate]);

  const initForm = (r) => setSettingsForm({
    name: r?.name || '', phone: r?.phone || '',
    locationHouse: r?.location?.house || '', locationRoad: r?.location?.road || '',
    locationArea: r?.location?.area || '', locationCity: r?.location?.city || '',
    cuisineTypes: Array.isArray(r?.cuisineTypes) ? r.cuisineTypes.join(', ') : '',
  });

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.dispatchEvent(new Event('userLogout')); navigate('/');
  };

  const handleSettingsChange = e => setSettingsForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveSettings = async () => {
    setSettingsError(''); setSettingsSuccess(''); setSavingSettings(true);
    try {
      const cuisineTypesArray = settingsForm.cuisineTypes.split(',').map(c => c.trim()).filter(Boolean);
      const payload = {
        _id: restaurant._id, name: settingsForm.name, phone: settingsForm.phone,
        location: { house: settingsForm.locationHouse, road: settingsForm.locationRoad, area: settingsForm.locationArea, city: settingsForm.locationCity },
        cuisineTypes: cuisineTypesArray,
      };
      const res = await axiosInstance.put('/api/auth/update-restaurant', payload);
      if (res.data.success || res.status === 200) {
        const updatedUser = { ...user, name: settingsForm.name, phone: settingsForm.phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setRestaurant({ ...restaurant, ...payload });
        setSettingsSuccess('Settings updated successfully!');
        setTimeout(() => { setShowSettingsModal(false); setSettingsSuccess(''); }, 1500);
      }
    } catch (err) {
      setSettingsError(err.response?.data?.message || err.message || 'Failed to update settings');
    } finally { setSavingSettings(false); }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const newStatus = !restaurant?.isOpen;
      const res = await axiosInstance.put('/api/auth/update-restaurant-status', { isOpen: newStatus });
      if (res.data.success) setRestaurant({ ...restaurant, isOpen: newStatus });
    } catch (err) {
      setSettingsError(err.response?.data?.message || 'Failed to update status');
    } finally { setTogglingStatus(false); }
  };

  const formatAddr = (loc) => {
    if (!loc) return null;
    return [loc.house && `House ${loc.house}`, loc.road, loc.area, loc.city].filter(Boolean).join(', ') || null;
  };

  if (loading) return (
    <><style>{CSS}</style>
    <div className="rd-loading"><div className="rd-spinner"/><p className="rd-loading-txt">Loading your dashboard…</p></div></>
  );

  return (
    <><style>{CSS}</style>
    <div className="rd-root">
      <div className="rd-wrap">

        {/* Hero */}
       
		<div className="relative rounded-2xl p-6 text-white shadow-lg overflow-hidden bg-cover bg-center mb-8"
		style={{ backgroundImage: `url(/white.png)` }}
		>
		{/* Overlay for better text readability */}
		<div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-violet-50"></div>
		
		<div className="relative z-10 flex justify-between items-start">
			<div className="flex items-center gap-6" style={{ paddingLeft: '40px' }}>
			{/* Mascot Image */}
			<div className="w-25 h-25 flex-shrink-0" style={{ marginLeft: '-50px' }}>
				<img 
				src="/Mascot5.png" 
				alt="Mascot" 
				className="w-full h-full object-contain"
				/>
			</div>
			
			{/* Text Content */}
			<div style={{ marginLeft: '-30px' }}>
				<p className="text-violet-600 text-sm font-bold mb-1">Restaurant Dashboard</p>
				<h1 className="text-3xl font-bold text-gray-700 mb-2">{restaurant?.name || user?.name}</h1>
				<p className="text-violet-600 font-bold text-sm">Manage your menu, orders, and restaurant settings</p>
			</div>
			</div>
			
			<div className="flex items-center gap-3">
			{/* Status Badge */}
			<span className={`px-4 py-2 rounded-lg text-sm font-medium ${
				restaurant?.isOpen 
				? 'bg-blue-100 text-blue-700' 
				: 'bg-pink-100 text-pink-700'
			}`}>
				<span className={`w-2 h-2 rounded-full ${
					restaurant?.isOpen ? 'bg-blue-200' : 'bg-pink-200'
				}`}></span>
				{restaurant?.isOpen ? 'Open' : 'Closed'}
			</span>
			
			{/* Toggle Button */}
			<button
				onClick={handleToggleStatus}
				disabled={togglingStatus}
				className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border ${
				restaurant?.isOpen 
					? 'bg-pink-500 hover:bg-pink-600 text-white border-pink-600' 
					: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600'
				} disabled:opacity-50 disabled:cursor-not-allowed`}
			>
				{togglingStatus ? '...' : restaurant?.isOpen ? 'Close' : 'Open'}
			</button>
			
			{/* Sign Out Button */}
			<button
				onClick={handleLogout}
				className="bg-white hover:bg-violet-50 text-violet-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border border-gray-200 hover:border-violet-200"
			>
				Sign Out
			</button>
			</div>
		</div>
		</div>

        {/* Stats */}
        <div className="rd-stats">
          <div className="rd-stat">
            <div className="rd-stat-icon">⭐</div>
            <div className="rd-stat-value">{restaurant?.rating?.toFixed(1) || '0.0'}</div>
            <div className="rd-stat-label">Average Rating</div>
          </div>
          <div
            className="rd-stat clickable"
            onClick={() => restaurant?._id && navigate(`/restaurants/${restaurant._id}/reviews`)}
          >
            <div className="rd-stat-icon">📊</div>
            <div className="rd-stat-value">{restaurant?.totalRatings || 0}</div>
            <div className="rd-stat-label">Total Reviews</div>
          </div>
          <div className="rd-stat">
			<div className="rd-stat-icon">🍽️</div>
			<div className="rd-stat-value" style={{fontSize: 18, paddingTop: 6}}>
				{restaurant?.cuisineTypes?.slice(0, 2).join(', ')}
				{restaurant?.cuisineTypes?.length > 2 && '...'}
			</div>
			<div className="rd-stat-label">
				{restaurant?.cuisineTypes?.length === 1 ? 'Cuisine' : 'Cuisines'}
			</div>
		</div>
          <div className="rd-stat">
            <div className="rd-stat-icon">📍</div>
            <div className="rd-stat-value" style={{fontSize: 18, paddingTop: 6}}>
              {restaurant?.location?.city || <span style={{color:'#ccc', fontStyle:'italic', fontSize:14}}>Not set</span>}
            </div>
            <div className="rd-stat-label">City</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rd-actions">
          <button className="rd-action-btn" onClick={() => navigate('/restaurant/manage-menu')}>
            <div className="rd-action-icon">📝</div>
            <div className="rd-action-title">Manage Menu</div>
            <div className="rd-action-desc">Add, edit, or remove menu items</div>
          </button>
          <button className="rd-action-btn" onClick={() => navigate('/orders')}>
            <div className="rd-action-icon">📦</div>
            <div className="rd-action-title">Orders</div>
            <div className="rd-action-desc">View and manage incoming orders</div>
          </button>
          <button className="rd-action-btn" onClick={() => setShowSettingsModal(true)}>
            <div className="rd-action-icon">⚙️</div>
            <div className="rd-action-title">Settings</div>
            <div className="rd-action-desc">Update restaurant info & location</div>
          </button>
        </div>

        {/* Admin comments */}
        {adminMealComments.length > 0 && (
          <div className="rd-panel">
            <h2 className="rd-panel-title">
              <span className="rd-panel-title-icon">💬</span>
              Admin Notes on Menu Items
            </h2>
            {adminMealComments.map(item => (
              <div key={item._id} className="rd-comment-item">
                <div className="rd-comment-dish">{item.name}</div>
                <div className="rd-comment-text">{item.adminComment}</div>
                {item.adminCommentedAt && (
                  <div className="rd-comment-meta">
                    {new Date(item.adminCommentedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Restaurant info */}
        <div className="rd-panel">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 20, flexWrap:'wrap', gap:12}}>
            <h2 className="rd-panel-title" style={{marginBottom:0}}>
              <span className="rd-panel-title-icon">👤</span>
              Restaurant Information
            </h2>
            <button
              className="rd-btn-primary"
              style={{flex:'none', padding:'10px 20px', width:'auto'}}
              onClick={() => setShowSettingsModal(true)}
            >
              Edit Info
            </button>
          </div>
          <div className="rd-divider"/>
          <div className="rd-info-grid">
            <div>
              <div className="rd-info-label">Restaurant Name</div>
              <div className={`rd-info-value ${!restaurant?.name ? 'empty' : ''}`}>{restaurant?.name || 'Not set'}</div>
            </div>
            <div>
              <div className="rd-info-label">Email</div>
              <div className={`rd-info-value ${!user?.email ? 'empty' : ''}`}>{user?.email || 'Not set'}</div>
            </div>
            <div>
              <div className="rd-info-label">Phone</div>
              <div className={`rd-info-value ${!user?.phone ? 'empty' : ''}`}>{user?.phone || 'Not set'}</div>
            </div>
            <div>
              <div className="rd-info-label">Cuisine Types</div>
              <div className={`rd-info-value ${!restaurant?.cuisineTypes?.length ? 'empty' : ''}`}>
                {restaurant?.cuisineTypes?.join(', ') || 'Not set'}
              </div>
            </div>
            <div className="rd-info-col-span">
              <div className="rd-info-label">Address</div>
              <div className={`rd-info-value ${!formatAddr(restaurant?.location) ? 'empty' : ''}`}>
                {formatAddr(restaurant?.location) || 'Not set'}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    {/* Settings Modal */}
    {showSettingsModal && (
      <div className="rd-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowSettingsModal(false)}>
        <div className="rd-modal">
          <h2 className="rd-modal-title">Restaurant Settings</h2>

          {settingsError && <div className="rd-alert error">⚠️ {settingsError}</div>}
          {settingsSuccess && <div className="rd-alert success">✓ {settingsSuccess}</div>}

          <div className="rd-form-group">
            <label>Restaurant Name</label>
            <input name="name" value={settingsForm.name} onChange={handleSettingsChange} placeholder="Your restaurant name"/>
          </div>
          <div className="rd-form-group">
            <label>Phone Number</label>
            <input name="phone" value={settingsForm.phone} onChange={handleSettingsChange} placeholder="+880 ..."/>
          </div>

          <div className="rd-form-section-label">📍 Location</div>
          <div className="rd-form-grid">
            <div className="rd-form-group" style={{margin:0}}>
              <label>House / Apt</label>
              <input name="locationHouse" value={settingsForm.locationHouse} onChange={handleSettingsChange} placeholder="e.g. 12A"/>
            </div>
            <div className="rd-form-group" style={{margin:0}}>
              <label>Road / Street</label>
              <input name="locationRoad" value={settingsForm.locationRoad} onChange={handleSettingsChange} placeholder="e.g. Mirpur Road"/>
            </div>
            <div className="rd-form-group" style={{margin:0}}>
              <label>Area / District</label>
              <input name="locationArea" value={settingsForm.locationArea} onChange={handleSettingsChange} placeholder="e.g. Banani"/>
            </div>
            <div className="rd-form-group" style={{margin:0}}>
              <label>City</label>
              <input name="locationCity" value={settingsForm.locationCity} onChange={handleSettingsChange} placeholder="e.g. Dhaka"/>
            </div>
          </div>

          <div className="rd-form-group" style={{marginTop:16}}>
            <label>Cuisine Types (comma-separated)</label>
            <input name="cuisineTypes" value={settingsForm.cuisineTypes} onChange={handleSettingsChange} placeholder="e.g. Bengali, Chinese, BBQ"/>
          </div>

          <div className="rd-modal-actions">
            <button className="rd-btn-ghost" onClick={() => setShowSettingsModal(false)} disabled={savingSettings}>Cancel</button>
            <button className="rd-btn-primary" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}