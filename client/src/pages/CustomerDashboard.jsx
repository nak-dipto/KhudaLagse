import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import MealCalendar from '../components/MealCalendar';
import SubscriptionManager from '../components/SubscriptionManager';
import FoodPreferences from '../components/FoodPreferences';

export default function CustomerDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [favorites, setFavorites] = useState([]);
	const [showFavorites, setShowFavorites] = useState(false);
	const [activeTab, setActiveTab] = useState('calendar');
	const [walletBalance, setWalletBalance] = useState(0);
	const [subscriptions, setSubscriptions] = useState([]);
	
	// Food preferences state
	const [foodPreferences, setFoodPreferences] = useState({
		likes: [],
		dislikes: [],
		allergies: []
	});
	const [showPreferencesModal, setShowPreferencesModal] = useState(false);
	const [suggestedFoods, setSuggestedFoods] = useState([]);
	const [savingPreferences, setSavingPreferences] = useState(false);
	const [preferencesError, setPreferencesError] = useState('');
	const [preferencesLoaded, setPreferencesLoaded] = useState(false);
	
	// New state for collapsible section
	const [showRecommendations, setShowRecommendations] = useState(true);

	// ------------------ Load user ------------------
	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (!userData) {
			navigate('/login');
			return;
		}

		try {
			const parsedUser = JSON.parse(userData);
			if (parsedUser.role !== 'customer') {
				navigate('/');
				return;
			}
			setUser(parsedUser);
			setWalletBalance(parsedUser.walletBalance || 0);
		} catch (err) {
			console.error('Error parsing user data:', err);
			navigate('/login');
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	// Load food preferences when user is set
	useEffect(() => {
		if (user && !preferencesLoaded) {
			loadFoodPreferencesFromDB();
		}
	}, [user, preferencesLoaded]);

	// Fetch wallet balance and subscriptions
	useEffect(() => {
		if (user) {
			fetchWalletBalance();
			fetchSubscriptions();
		}
	}, [user]);

	// Fetch suggestions when preferences change
	useEffect(() => {
		if (user && preferencesLoaded && Object.values(foodPreferences).flat().length > 0) {
			fetchSuggestedFoods();
		}
	}, [foodPreferences, user, preferencesLoaded]);

	const loadFoodPreferencesFromDB = async () => {
		if (!user) return;

		const userId = user.id || user._id;
		
		try {
			console.log('Loading preferences for user:', userId);
			const response = await axiosInstance.get(`/api/auth/preferences/${userId}`);
			
			if (response.data.success && response.data.data) {
				setFoodPreferences(response.data.data);
				localStorage.setItem(`foodPreferences_${userId}`, JSON.stringify(response.data.data));
				console.log('Preferences loaded from DB:', response.data.data);
			}
		} catch (err) {
			console.error('Failed to load food preferences from DB:', err);
			const savedPrefs = localStorage.getItem(`foodPreferences_${userId}`);
			if (savedPrefs) {
				setFoodPreferences(JSON.parse(savedPrefs));
				console.log('Preferences loaded from localStorage (fallback)');
			}
		} finally {
			setPreferencesLoaded(true);
		}
	};

	const saveFoodPreferencesToDB = async (newPreferences) => {
		setSavingPreferences(true);
		setPreferencesError('');
		
		try {
			console.log('Saving preferences:', newPreferences);
			
			const response = await axiosInstance.post('/api/auth/preferences', {
				preferences: newPreferences
			});

			if (response.data.success) {
				setFoodPreferences(newPreferences);
				const userId = user?.id || user?._id;
				if (userId) {
					localStorage.setItem(`foodPreferences_${userId}`, JSON.stringify(newPreferences));
				}
				setShowPreferencesModal(false);
				fetchSuggestedFoods();
				console.log('Preferences saved successfully');
			} else {
				setPreferencesError(response.data.message || 'Failed to save preferences');
			}
		} catch (err) {
			console.error('Failed to save preferences to DB:', err);
			setPreferencesError(
				err.response?.data?.message || 
				err.message || 
				'Failed to save preferences to database'
			);
		} finally {
			setSavingPreferences(false);
		}
	};

	const fetchSuggestedFoods = async () => {
	  try {
		console.log('🍽️ Fetching menu items...');
		const res = await axiosInstance.get('/api/menu/featured');
		const allMenuItems = res.data.data || [];
		
		if (allMenuItems.length === 0) {
		  console.log('⚠️ No menu items found');
		  setSuggestedFoods([]);
		  return;
		}
		
		console.log(`📦 Found ${allMenuItems.length} menu items to analyze`);
		console.log('👤 User preferences:', foodPreferences);
		
		// Show loading state
		setSuggestedFoods([]); // Clear previous suggestions
		
		// Call Gemini for personalized recommendations
		try {
		  console.log('🧠 Calling Gemini for personalized recommendations...');
		  const geminiRes = await axiosInstance.post('/api/recommendations/personalized', {
			items: allMenuItems,
			preferences: foodPreferences
		  });
		  
		  if (geminiRes.data.success) {
			const recommendations = geminiRes.data.data;
			const source = geminiRes.data.source || 'gemini';
			const goodRecommendations = geminiRes.data.goodRecommendations || [];
			
			console.log(`📊 Analysis source: ${source}`);
			console.log(`📊 Found ${goodRecommendations.length} good recommendations`);
			
			// Map recommendations back to full item details
			const recommendedItems = recommendations
			  .filter(rec => rec.shouldRecommend && !rec.allergenDetected)
			  .sort((a, b) => b.finalScore - a.finalScore)
			  .slice(0, 6)
			  .map(rec => {
				const fullItem = allMenuItems.find(item => item._id === rec.id);
				return {
				  ...fullItem,
				  ...rec,
				  score: rec.finalScore
				};
			  });
			
			console.log('🎯 Top recommendations:', 
			  recommendedItems.map(r => `${r.name} (score: ${r.finalScore}) - ${r.reason}`));
			
			setSuggestedFoods(recommendedItems);
			
			if (recommendedItems.length === 0) {
			  console.log('⚠️ No recommendations found. Your preferences may be too restrictive:', 
				foodPreferences);
			  
			  // Show a message to user
			 // alert('No recommendations found based on your current preferences. Try adjusting your likes/dislikes or checking back later.');
			}
		  }
		} catch (geminiErr) {
		  console.error('❌ Gemini API failed:', geminiErr);
		  
		  // Fallback to simple filtering
		  console.log('⚠️ Using fallback filtering');
		  const fallbackItems = allMenuItems
			.filter(item => {
			  // Simple allergen check
			  if (foodPreferences.allergies?.length) {
				const itemText = `${item.name} ${item.description} ${item.ingredients?.join(' ')}`.toLowerCase();
				const hasAllergen = foodPreferences.allergies.some(allergy => 
				  allergy && itemText.includes(allergy.toLowerCase())
				);
				if (hasAllergen) return false;
			  }
			  return true;
			})
			.map(item => {
			  let score = 50;
			  
			  // Simple like scoring
			  if (foodPreferences.likes?.length) {
				foodPreferences.likes.forEach(like => {
				  if (item.name?.toLowerCase().includes(like.toLowerCase())) score += 15;
				  if (item.description?.toLowerCase().includes(like.toLowerCase())) score += 10;
				});
			  }
			  
			  // Simple dislike scoring
			  if (foodPreferences.dislikes?.length) {
				foodPreferences.dislikes.forEach(dislike => {
				  if (item.name?.toLowerCase().includes(dislike.toLowerCase())) score -= 15;
				});
			  }
			  
			  return { ...item, score: Math.min(100, Math.max(0, score)) };
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 6);
		  
		  setSuggestedFoods(fallbackItems);
		}
		
	  } catch (err) {
		console.error('Failed to fetch suggestions:', err);
		setSuggestedFoods([]);
	  }
	};

	const fetchWalletBalance = async () => {
		try {
			const res = await axiosInstance.get('/api/wallet');
			if (res.data.success) {
				setWalletBalance(res.data.walletBalance || 0);
			}
		} catch (err) {
			console.error('Failed to fetch wallet balance', err);
		}
	};

	const fetchSubscriptions = async () => {
		try {
			const res = await axiosInstance.get('/api/subscriptions');
			if (res.data.success) {
				setSubscriptions(res.data.data || []);
			}
		} catch (err) {
			console.error('Failed to fetch subscriptions', err);
		}
	};

	const handleUserUpdate = (updatedUser) => {
		setUser(updatedUser);
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		window.dispatchEvent(new Event('userLogout'));
		navigate('/');
	};

	const fetchFavorites = async () => {
		try {
			const res = await axiosInstance.get('/api/auth/favorites');
			const favoriteIds = res.data.favorites || [];

			const favoriteRestaurants = await Promise.all(
				favoriteIds.map((id) =>
					axiosInstance
						.get(`/api/restaurants/${id}`)
						.then((res) => res.data)
				)
			);

			setFavorites(favoriteRestaurants);
		} catch (err) {
			console.error('Failed to fetch favorites', err);
		}
	};

	useEffect(() => {
		if (user && showFavorites) fetchFavorites();
	}, [user, showFavorites]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-violet-50 to-stone-50 flex items-center justify-center">
				<div className="text-center">
					<div className="relative">
						<div className="animate-spin rounded-full h-20 w-20 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
					</div>
					<p className="text-stone-600 text-lg font-medium">Loading your dashboard...</p>
					<p className="text-stone-400 text-sm mt-2">Please wait</p>
				</div>
			</div>
		);
	}

	return (
		<div 
			className="min-h-screen bg-cover bg-center bg-fixed pt-12 relative"
			style={{ 
				backgroundImage: `linear-gradient(rgba(45, 23, 110, 0.49), rgba(72, 24, 131, 0.44)), url(/gray.jpg)`
			}}
		>
			<div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
				<div className="space-y-8">
					{/* Header Section */}
					<div className="mb-8">
						<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
							{/* Welcome Card */}
							<div 
								className="flex-1 relative rounded-2xl p-6 shadow-lg overflow-hidden bg-cover bg-center"
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
											<p className="text-violet-600 text-xs sm:text-sm font-bold mb-1">Welcome back,</p>
											<h1 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2">{user?.name}</h1>
											<p className="text-violet-600 font-bold text-xs sm:text-sm">Manage your meals, subscriptions, and account</p>
										</div>
									</div>
									
									<button
										onClick={handleLogout}
										className="bg-white hover:bg-violet-50 text-violet-600 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border border-gray-200 hover:border-violet-200"
									>
										Sign Out
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Food Preferences Banner */}
					<div className="mb-6">
						<FoodPreferencesBanner
							foodPreferences={foodPreferences}
							preferencesLoaded={preferencesLoaded}
							onOpenModal={() => setShowPreferencesModal(true)}
						/>
					</div>

					{/* Suggested Foods Section with Collapsible Header */}
					{suggestedFoods.length > 0 && (
						<div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
							{/* Collapsible Header */}
							<div 
								className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
								onClick={() => setShowRecommendations(!showRecommendations)}
							>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-lg">
										🎯
									</div>
									<div>
										<h2 className="text-xl font-bold text-white">Recommended for You</h2>
										<p className="text-white/70 text-sm">
											{showRecommendations ? 'Click to hide' : `${suggestedFoods.length} personalized picks waiting for you`}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<button 
										onClick={(e) => {
											e.stopPropagation();
											fetchSuggestedFoods();
										}}
										className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1"
									>
										<span>🔄</span>
										<span className="hidden sm:inline">Refresh</span>
									</button>
									<div className="text-white text-2xl font-bold w-8 h-8 flex items-center justify-center">
										{showRecommendations ? '▲' : '▼'}
									</div>
								</div>
							</div>
							
							{/* Collapsible Content */}
							{showRecommendations && (
								<div className="p-4 pt-0 animate-slideDown">
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
										{suggestedFoods.map((food, index) => (
											<SuggestedFoodCard key={food._id} food={food} navigate={navigate} />
										))}
									</div>
									
									{/* View All Link */}
									<div className="text-center mt-4">
										<button 
											onClick={() => navigate('/restaurants')}
											className="text-white/80 hover:text-white text-sm font-medium inline-flex items-center gap-1"
										>
											View all restaurants
											<span>→</span>
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Quick Actions Grid */}
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
						<QuickActionCard
							icon="📦"
							title="My Orders"
							color="bg-violet-100 text-violet-600"
							onClick={() => navigate('/my-orders')}
						/>
						
						<QuickActionCard
							icon="❤️"
							title="Favorites"
							color="bg-rose-100 text-rose-600"
							onClick={() => setShowFavorites(!showFavorites)}
							active={showFavorites}
						/>
						
						<QuickActionCard
							icon="🎁"
							title="Referrals"
							color="bg-purple-100 text-purple-600"
							onClick={() => navigate('/referrals')}
						/>
					</div>

					{/* Favorites List */}
					{showFavorites && (
						<FavoritesList favorites={favorites} navigate={navigate} />
					)}

					{/* Main Content Tabs */}
					<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-200/60 overflow-hidden">
						<div className="border-b border-stone-200 bg-stone-50/50">
							<nav className="flex">
								<button
									onClick={() => setActiveTab('calendar')}
									className={`flex-1 px-6 py-4 text-sm font-semibold transition border-b-2 ${
										activeTab === 'calendar'
											? 'border-violet-500 text-violet-600 bg-white'
											: 'border-transparent text-stone-500 hover:text-stone-600 hover:bg-stone-100/50'
									}`}
								>
									<span className="mr-2">📅</span>
									Meal Calendar
								</button>
								<button
									onClick={() => setActiveTab('subscriptions')}
									className={`flex-1 px-6 py-4 text-sm font-semibold transition border-b-2 ${
										activeTab === 'subscriptions'
											? 'border-violet-500 text-violet-600 bg-white'
											: 'border-transparent text-stone-500 hover:text-stone-600 hover:bg-stone-100/50'
									}`}
								>
									<span className="mr-2">📦</span>
									Manage Subscriptions
								</button>
							</nav>
						</div>

						<div className="p-6">
							{activeTab === 'calendar' ? (
								<MealCalendar />
							) : (
								<SubscriptionManager />
							)}
						</div>
					</div>

					{/* Account Info */}
					<AccountInfo user={user} onUserUpdate={handleUserUpdate} />
				</div>
			</div>

			{/* Food Preferences Modal */}
			{showPreferencesModal && (
				<FoodPreferences
					initialPreferences={foodPreferences}
					onSave={saveFoodPreferencesToDB}
					onClose={() => setShowPreferencesModal(false)}
					isSaving={savingPreferences}
					error={preferencesError}
				/>
			)}
		</div>
	);
}

// ------------------ Food Preferences Banner Component ------------------
const FoodPreferencesBanner = ({ foodPreferences, preferencesLoaded, onOpenModal }) => (
	<div className="bg-gradient-to-r from-violet-900 to-purple-900 rounded-2xl p-6 text-white shadow-lg">
		<div className="flex items-center justify-between flex-wrap gap-4">
			<div className="flex items-center gap-4">
				<div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
					🍽️
				</div>
				<div>
					<h3 className="font-bold text-lg">Your Food Preferences</h3>
					<p className="text-white/80 text-sm">Tell us what you like and we'll suggest personalized meals</p>
				</div>
			</div>
			<button
				onClick={onOpenModal}
				className="bg-white text-violet-600 px-6 py-2 rounded-full font-semibold hover:bg-violet-50 transition shadow-md"
			>
				{Object.values(foodPreferences).flat().length > 0 ? 'Update Preferences' : 'Set Preferences'}
			</button>
		</div>
	</div>
);

// ------------------ Suggested Food Card Component ------------------
const SuggestedFoodCard = ({ food, navigate }) => {
	// Determine badge color based on score
	const getBadgeInfo = (score) => {
		if (score >= 80) return { text: '🔥 Perfect Match', bg: 'bg-pink-400', textColor: 'text-yellow-900' };
		if (score >= 65) return { text: '👍 Great Match', bg: 'bg-violet-400', textColor: 'text-green-900' };
		if (score >= 50) return { text: '👌 Good Match', bg: 'bg-blue-400', textColor: 'text-blue-900' };
		return { text: '⚠️ Low Match', bg: 'bg-gray-400', textColor: 'text-gray-900' };
	};
	
	const badge = getBadgeInfo(food.finalScore || food.score || 0);
	
	return (
		<div
			onClick={() => navigate(`/menu/${food._id}`)}
			className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group relative"
		>
			{/* Allergen Warning Badge */}
			{food.allergens && food.allergens.length > 0 && (
				<div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
					<span>⚠️</span>
					<span>Allergen: {food.allergens.join(', ')}</span>
				</div>
			)}
			
			{/* Dislike Warning Badge */}
			{food.dislikeDetected && food.dislikes?.length > 0 && (
				<div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
					<span>👎</span>
					<span>Contains: {food.dislikes.join(', ')}</span>
				</div>
			)}
			
			<div className="h-40 bg-gradient-to-br from-violet-200 to-purple-200 relative overflow-hidden">
				<img 
					src={food.imageUrl || '/default-food.jpg'} 
					alt={food.name}
					className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
				/>
				{/* Score Badge */}
				<div className={`absolute top-2 right-2 ${badge.bg} ${badge.textColor} text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
					{badge.text}
				</div>
			</div>
			
			<div className="p-4">
				<div className="flex justify-between items-start mb-2">
					<h3 className="font-bold text-gray-800">{food.name}</h3>
					<span className="text-violet-600 font-bold">৳{food.price}</span>
				</div>
				
				
				
				<p className="text-sm text-gray-600 mb-3 line-clamp-2">{food.description}</p>
				
				<div className="flex items-center justify-between">
					<span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
						{food.mealType || 'Various'}
					</span>
					
				</div>
			</div>
		</div>
	);
};

// ------------------ Quick Action Card Component ------------------
const QuickActionCard = ({ icon, title, color, onClick, active }) => (
	<button
		onClick={onClick}
		className={`relative flex items-center gap-3 p-4 rounded-xl border overflow-hidden transition ${
			active
				? "border-violet-300 shadow-lg bg-white"
				: "border-stone-200/60 hover:border-stone-300 shadow-sm hover:shadow-md bg-white"
		}`}
	>
		<div className="relative flex items-center gap-3">
			<div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
				<span className="text-xl">{icon}</span>
			</div>
			<span className="font-medium text-stone-700">{title}</span>
		</div>
	</button>
);

// ------------------ Favorites List Component ------------------
const FavoritesList = ({ favorites, navigate }) => (
	<div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-stone-200/60 p-6 mb-8">
		<h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
			<span className="text-rose-500">❤️</span>
			Favorite Restaurants
		</h2>
		{favorites.length === 0 ? (
			<div className="text-center py-8">
				<p className="text-stone-500 mb-3">You haven't added any favorites yet.</p>
				<button
					onClick={() => navigate('/restaurants')}
					className="text-violet-500 font-medium hover:text-violet-600"
				>
					Discover restaurants →
				</button>
			</div>
		) : (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{favorites.map((r) => (
					<div
						key={r._id}
						onClick={() => navigate(`/restaurants/${r._id}`)}
						className="group p-4 rounded-xl border border-stone-200 hover:border-violet-300 hover:shadow-md cursor-pointer transition-all bg-white"
					>
						<div className="flex items-center gap-4">
							<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-2xl">
								🍽️
							</div>
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-stone-800 truncate group-hover:text-violet-600 transition">
									{r.name}
								</h3>
								{r.location && (
									<p className="text-sm text-stone-500 truncate">
										📍 {r.location.area}, {r.location.city}
									</p>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		)}
	</div>
);

// ------------------ Account Info Component ------------------
const AccountInfo = ({ user, onUserUpdate }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({
		phone: '',
		address: {
			house: '',
			road: '',
			area: '',
			city: '',
		},
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		setEditForm({
			phone: user?.phone || '',
			address: user?.address || {
				house: '',
				road: '',
				area: '',
				city: '',
			},
		});
	}, [user]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		if (name.startsWith('address.')) {
			const addressField = name.split('.')[1];
			setEditForm((prev) => ({
				...prev,
				address: {
					...prev.address,
					[addressField]: value,
				},
			}));
		} else if (name === 'phone') {
			setEditForm((prev) => ({
				...prev,
				phone: value,
			}));
		}
	};

	const handleSave = async () => {
		setLoading(true);
		setError('');

		try {
			const response = await axiosInstance.put('/api/auth/profile', {
				phone: editForm.phone,
				address: editForm.address,
			});

			if (response.data.success) {
				const updatedUser = {
					...user,
					phone: editForm.phone,
					address: editForm.address,
				};
				localStorage.setItem('user', JSON.stringify(updatedUser));
				onUserUpdate(updatedUser);
				setIsEditing(false);
			} else {
				setError(response.data.message || 'Failed to update profile');
			}
		} catch (err) {
			setError(err.response?.data?.message || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	const formatAddress = (address) => {
		if (!address) return 'Not set';
		const parts = [
			address.house && `House ${address.house}`,
			address.road,
			address.area,
			address.city,
		].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : 'Not set';
	};

	if (isEditing) {
		return (
			<div className="bg-white rounded-2xl shadow-lg border border-stone-200/60 p-6">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold text-stone-800">Edit Profile</h2>
					<button
						onClick={() => setIsEditing(false)}
						className="text-stone-400 hover:text-stone-500 text-xl"
					>
						✕
					</button>
				</div>

				{error && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
						{error}
					</div>
				)}

				<div className="space-y-6">
					<div>
						<label className="block text-sm font-medium text-stone-500 mb-1.5">Phone Number</label>
						<input
							type="tel"
							name="phone"
							value={editForm.phone}
							onChange={handleInputChange}
							className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
							placeholder="e.g., 017XXXXXXXX"
						/>
					</div>

					<div>
						<h3 className="text-sm font-semibold text-stone-700 mb-3">Delivery Address</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-stone-500 mb-1.5">House/Apartment</label>
								<input
									type="text"
									name="address.house"
									value={editForm.address.house}
									onChange={handleInputChange}
									className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
									placeholder="Enter house"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-stone-500 mb-1.5">Road/Street</label>
								<input
									type="text"
									name="address.road"
									value={editForm.address.road}
									onChange={handleInputChange}
									className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
									placeholder="Enter road"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-stone-500 mb-1.5">Area/District</label>
								<input
									type="text"
									name="address.area"
									value={editForm.address.area}
									onChange={handleInputChange}
									className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
									placeholder="Enter area"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-stone-500 mb-1.5">City</label>
								<input
									type="text"
									name="address.city"
									value={editForm.address.city}
									onChange={handleInputChange}
									className="w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
									placeholder="Enter city"
								/>
							</div>
						</div>
					</div>

					<div className="flex gap-3">
						<button
							onClick={handleSave}
							disabled={loading}
							className="flex-1 bg-violet-500 text-white py-2.5 rounded-lg font-semibold hover:bg-violet-600 disabled:opacity-50"
						>
							{loading ? 'Saving...' : 'Save Changes'}
						</button>
						<button
							onClick={() => setIsEditing(false)}
							className="flex-1 border border-stone-300 text-stone-600 py-2.5 rounded-lg font-semibold hover:bg-stone-50"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="relative bg-white rounded-2xl shadow-lg border border-stone-200/60 p-6 overflow-hidden"
			style={{
				backgroundImage: "url('/gray.jpg')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="absolute inset-0 bg-white/70 rounded-2xl" />
			
			<div className="relative">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
						<span className="text-stone-400">👤</span>
						Account Information
					</h2>
					<button
						onClick={() => setIsEditing(true)}
						className="bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-violet-600"
					>
						Edit Profile
					</button>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
					<InfoRow label="Name" value={user?.name} />
					<InfoRow label="Email" value={user?.email} />
					<InfoRow label="Phone" value={user?.phone} />
					<div className="md:col-span-2">
						<InfoRow label="Delivery Address" value={formatAddress(user?.address)} />
					</div>
				</div>
			</div>
		</div>
	);
};

// ------------------ Info Row Component ------------------
const InfoRow = ({ label, value, capitalize }) => (
	<div className="flex flex-col">
		<span className="text-sm text-stone-500 mb-0.5">{label}</span>
		<span className={`font-medium text-stone-800 ${capitalize ? 'capitalize' : ''}`}>
			{value || <span className="text-stone-400">Not set</span>}
		</span>
	</div>
);