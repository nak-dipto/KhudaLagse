import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import {
	FaMapMarkerAlt,
	FaStar,
	FaTruck,
	FaChevronDown,
	FaCalendarDay,
	FaCalendarWeek,
	FaCalendar,
	FaClock,
	FaExclamationTriangle,
} from 'react-icons/fa';
import FloatingCart from '../components/FloatingCart';
import SubscriptionManager from '../components/SubscriptionManager';

const FALLBACK_IMAGE = '/bgrnd.webp';
const DAYS = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Time restrictions
const ORDER_DEADLINES = {
	lunch: {
		hour: 10,
		minute: 0,
		label: '10:00 AM'
	},
	dinner: {
		hour: 16,
		minute: 0,
		label: '4:00 PM'
	}
};

// Helper function to check if ordering is allowed for a meal type
const canOrderMeal = (mealType, itemDate = null) => {
	const now = new Date();
	const deadline = ORDER_DEADLINES[mealType];
	
	if (!deadline) return true;
	
	// Create deadline time for today
	const deadlineTime = new Date();
	deadlineTime.setHours(deadline.hour, deadline.minute, 0, 0);
	
	// If itemDate is provided, check if it's for today
	if (itemDate) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		const itemDateObj = new Date(itemDate);
		itemDateObj.setHours(0, 0, 0, 0);
		
		// If item is not for today, allow ordering
		if (itemDateObj.getTime() !== today.getTime()) {
			return true;
		}
	}
	
	// Check if current time is before deadline
	return now < deadlineTime;
};

// Helper function to get date for a specific day in current week
const getDateForDay = (dayName) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get day index (0 = Sunday, 1 = Monday, etc.)
    const targetDayIndex = DAYS.indexOf(dayName);
    const currentDayIndex = today.getDay();
    
    // Calculate days difference
    let daysDiff = targetDayIndex - currentDayIndex;
    
    // Create date object for the target day
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysDiff);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate;
};

// Helper function to get start and end of current week
const getWeekRange = () => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	// Get start of week (Sunday)
	const startOfWeek = new Date(today);
	const day = today.getDay();
	const diff = today.getDate() - day;
	startOfWeek.setDate(diff);
	
	// Get end of week (Saturday)
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setDate(startOfWeek.getDate() + 6);
	endOfWeek.setHours(23, 59, 59, 999);
	
	return { start: startOfWeek, end: endOfWeek };
};

// Helper function to get next 30 days
const getNext30Days = () => {
	const days = [];
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	for (let i = 0; i < 30; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() + i);
		
		// Create dateString using local date components to avoid timezone shift
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const dateString = `${year}-${month}-${day}`;
		
		days.push({
			date: date,
			dateString: dateString,
			displayDate: date.toLocaleDateString('en-US', { 
				weekday: 'short', 
				month: 'short', 
				day: 'numeric' 
			}),
			dayName: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
		});
	}
	
	return days;
};

export default function KitchenProfile() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [kitchen, setKitchen] = useState(null);
	const [menuItems, setMenuItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [selectedItem, setSelectedItem] = useState(null);
	const [showItemModal, setShowItemModal] = useState(false);
	const [user, setUser] = useState(null);
	const [currentTime, setCurrentTime] = useState(new Date());
	const [userPreferences, setUserPreferences] = useState(null);
	const [loadingPreferences, setLoadingPreferences] = useState(false);
	
	// Reviews state
	const [reviews, setReviews] = useState([]);
	const [showAllReviews, setShowAllReviews] = useState(false);
	const [showReviewForm, setShowReviewForm] = useState(false);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState('');
	const [reviewLoading, setReviewLoading] = useState(false);

	// Subscription state
	const [showSubscription, setShowSubscription] = useState(false);

	// Menu view state
	const [menuView, setMenuView] = useState('today');
	const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay()]);

	const [cart, setCart] = useState(() => {
		const saved = localStorage.getItem('cart');
		return saved ? JSON.parse(saved) : [];
	});

	// Update current time every minute
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);
		
		return () => clearInterval(timer);
	}, []);

	// Load user data and fetch preferences from database
	useEffect(() => {
		const userData = localStorage.getItem('user');
		if (userData) {
			try {
				const parsedUser = JSON.parse(userData);
				setUser(parsedUser);
				
				// Fetch preferences from database
				fetchUserPreferencesFromDB(parsedUser);
				
			} catch (err) {
				console.error('Error parsing user data:', err);
			}
		}
	}, []);

	// Function to fetch preferences from database
	const fetchUserPreferencesFromDB = async (user) => {
		if (!user) return;
		
		setLoadingPreferences(true);
		try {
			const userId = user.id || user._id;
			console.log('📡 Fetching preferences from DB for user:', userId);
			
			const response = await axiosInstance.get(`/api/auth/preferences/${userId}`);
			console.log('📥 DB Response:', response.data);
			
			if (response.data.success && response.data.data) {
				const preferences = response.data.data;
				setUserPreferences(preferences);
				console.log('✅ Preferences loaded from DB:', preferences);
				
				// Also save to localStorage as backup
				localStorage.setItem(`foodPreferences_${userId}`, JSON.stringify(preferences));
			} else {
				console.log('❌ No preferences found in DB');
				
				// Fallback to localStorage
				const savedPrefs = localStorage.getItem(`foodPreferences_${userId}`);
				if (savedPrefs) {
					setUserPreferences(JSON.parse(savedPrefs));
					console.log('📦 Loaded from localStorage fallback');
				}
			}
		} catch (err) {
			console.error('❌ Failed to fetch preferences from DB:', err);
			
			// Fallback to localStorage
			const savedPrefs = localStorage.getItem(`foodPreferences_${user.id || user._id}`);
			if (savedPrefs) {
				setUserPreferences(JSON.parse(savedPrefs));
				console.log('📦 Loaded from localStorage fallback after error');
			}
		} finally {
			setLoadingPreferences(false);
		}
	};

	// Persist cart
	useEffect(() => {
		localStorage.setItem('cart', JSON.stringify(cart));
		window.dispatchEvent(new Event('cartUpdated'));
	}, [cart]);

	// Fetch Data
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [kitchenRes, menuRes, reviewsRes] = await Promise.all([
					axiosInstance.get(`/api/restaurants/${id}`),
					axiosInstance.get(`/api/menu/restaurant/${id}`),
					axiosInstance.get(`/api/reviews/${id}`),
				]);

				setKitchen(kitchenRes.data);
				setMenuItems(menuRes.data.data || []);
				setReviews(reviewsRes.data || []);
			} catch (err) {
				console.error('Failed to fetch data:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [id]);

	// Debug effect to log preferences and menu items
	useEffect(() => {
		if (userPreferences) {
			console.log('👤 Current user preferences:', userPreferences);
			console.log('🚫 Allergies to check:', userPreferences.allergies || []);
		}
		if (menuItems.length > 0) {
			console.log('🍽️ Menu items loaded:', menuItems.length);
		}
	}, [userPreferences, menuItems]);

	const addToCart = (item) => {
		if (!canOrderMeal(item.mealType, item.date)) {
			const deadline = ORDER_DEADLINES[item.mealType];
			alert(`Sorry! ${item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} ordering is closed after ${deadline.label}.`);
			return;
		}
		
		const itemDate = new Date(item.date);
		
		const itemWithDelivery = {
			...item,
			quantity: 1,
			date: itemDate.toISOString(),
			deliveryDate: itemDate.toISOString(),
			restaurant: id,
			restaurantId: id,
		};

		const exists = cart.some(
			(ci) =>
				ci._id === item._id &&
				ci.date === itemWithDelivery.date &&
				ci.mealType === item.mealType
		);
		
		if (exists) {
			return alert(`${item.name} is already in your cart for this time.`);
		}

		setCart((prev) => [...prev, itemWithDelivery]);
		alert(`${item.name} added to cart!`);
	};

	const submitReview = async () => {
		if (!reviewComment.trim()) return alert('Please write a comment');
		setReviewLoading(true);
		try {
			const { data } = await axiosInstance.post(`/api/reviews/${id}`, {
				rating: reviewRating,
				comment: reviewComment,
			});
			
			const newReview = data.review;
			setReviews((prev) => [newReview, ...prev.filter(r => r._id !== newReview._id)]);
			
			setReviewComment('');
			setReviewRating(5);
			setShowReviewForm(false);
			alert('Review submitted!');
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.message || 'Failed to submit review');
		} finally {
			setReviewLoading(false);
		}
	};

	const formatAddress = (loc) => {
		if (!loc) return 'Address not available';
		const parts = [loc.house, loc.road, loc.area, loc.city].filter(Boolean);
		return parts.length ? parts.join(', ') : 'Address not available';
	};

	// Helper function to format date to YYYY-MM-DD
	const formatDateString = (date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// Get today's items
	const getTodayItems = () => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const todayString = formatDateString(today);
		
		return menuItems.filter(item => {
			if (!item.date) return false;
			const itemDate = new Date(item.date);
			const itemDateString = formatDateString(itemDate);
			return itemDateString === todayString;
		});
	};

	// Get weekly items (only current week)
	const getWeeklyItems = () => {
		const { start: weekStart, end: weekEnd } = getWeekRange();
		
		// Create date strings for the entire week to avoid timezone issues
		const weekDateStrings = [];
		const weekDates = [];
		
		for (let i = 0; i < 7; i++) {
			const date = new Date(weekStart);
			date.setDate(weekStart.getDate() + i);
			weekDates.push(date);
			weekDateStrings.push(formatDateString(date));
		}
		
		// Group by day
		const grouped = {};
		DAYS.forEach((day, index) => {
			const dateString = weekDateStrings[index];
			const date = weekDates[index];
			
			// Initialize day structure
			grouped[day] = {
				lunch: [],
				dinner: [],
				date: date,
				dateString: dateString
			};
		});
		
		// Populate with menu items
		menuItems.forEach(item => {
			if (!item.date) return;
			
			// Get date string from item
			const itemDate = new Date(item.date);
			const itemDateString = formatDateString(itemDate);
			
			// Find which day this date belongs to
			const dayIndex = weekDateStrings.indexOf(itemDateString);
			if (dayIndex !== -1) {
				const day = DAYS[dayIndex];
				
				// Add to appropriate meal type
				if (item.mealType === 'lunch') {
					grouped[day].lunch.push(item);
				} else if (item.mealType === 'dinner') {
					grouped[day].dinner.push(item);
				}
			}
		});
		
		return grouped;
	};

	// Get monthly items
	const getMonthlyItems = () => {
		const next30Days = getNext30Days();
		const itemsByDate = {};
		
		next30Days.forEach(day => {
			// Use the same formatDateString helper
			itemsByDate[day.dateString] = menuItems.filter(item => {
				if (!item.date) return false;
				const itemDateString = formatDateString(new Date(item.date));
				return itemDateString === day.dateString;
			});
		});
		
		return { next30Days, itemsByDate };
	};

	if (loading) return (
		<div className="min-h-screen flex items-center justify-center pt-20 bg-stone-50">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
				<p className="text-stone-600">Loading kitchen...</p>
			</div>
		</div>
	);

	if (!kitchen) return (
		<div className="min-h-screen flex items-center justify-center pt-20 bg-stone-50">
			<p>Kitchen not found.</p>
		</div>
	);

	const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

	return (
		<div className="min-h-screen bg-stone-50 pt-20 pb-24">
			{/* Hero Section */}
			<div className="relative h-[40vh] min-h-[300px] w-full bg-stone-900 overflow-hidden">
				<img 
					src={kitchen.imageUrl || FALLBACK_IMAGE} 
					alt={kitchen.name}
					className="w-full h-full object-cover opacity-60 scale-105"
					style={{ filter: 'brightness(0.7)' }}
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
				<div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
					<div className="text-white relative z-10">
						<div className="flex items-center gap-3 mb-3">
							<span className="bg-violet-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
								{kitchen.cuisineTypes?.[0] || 'Home Cooked'}
							</span>
							<div className="flex items-center gap-1 text-amber-400 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
								<FaStar />
								<span className="font-bold text-white">{kitchen.rating?.toFixed(1) || '0.0'}</span>
								<span className="text-stone-300 text-xs">({kitchen.totalRatings || 0})</span>
							</div>
						</div>
						<h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight text-white drop-shadow-lg">{kitchen.name}</h1>
						<div className="flex flex-wrap items-center gap-6 text-stone-200 text-sm font-medium">
							<span className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg"><FaMapMarkerAlt className="text-violet-400" /> {formatAddress(kitchen.location)}</span>
							<span className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg"><FaTruck className="text-violet-400" /> Free Delivery</span>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-12">
				
				{/* About Section */}
				<div className="mb-12 max-w-3xl">
					<h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">About the Kitchen</h2>
					<p className="text-stone-700 leading-relaxed text-xl font-light">
						{kitchen.about || "Welcome to our kitchen! We prepare fresh, healthy, and delicious home-cooked meals daily."}
					</p>
				</div>

				{/* Order Deadline Banner */}
				<div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
							<FaClock />
						</div>
						<div>
							<h3 className="font-bold text-amber-900">Order Deadlines</h3>
							<p className="text-sm text-amber-700">Order in advance to ensure availability</p>
						</div>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div className={`p-3 rounded-lg border ${canOrderMeal('lunch') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-stone-800">Lunch</span>
								<span className={`text-xs px-2 py-1 rounded-full ${canOrderMeal('lunch') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
									{canOrderMeal('lunch') ? 'Open' : 'Closed'}
								</span>
							</div>
							<p className="text-sm text-stone-600 mt-1">Closes at {ORDER_DEADLINES.lunch.label}</p>
						</div>
						<div className={`p-3 rounded-lg border ${canOrderMeal('dinner') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
							<div className="flex justify-between items-center">
								<span className="font-semibold text-stone-800">Dinner</span>
								<span className={`text-xs px-2 py-1 rounded-full ${canOrderMeal('dinner') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
									{canOrderMeal('dinner') ? 'Open' : 'Closed'}
								</span>
							</div>
							<p className="text-sm text-stone-600 mt-1">Closes at {ORDER_DEADLINES.dinner.label}</p>
						</div>
					</div>
				</div>

				{/* Reviews & Subscription */}
				<div className="mb-12 space-y-8">
					
					{/* Reviews Section */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-stone-800">What People Say</h2>
							<div className="flex gap-3">
								<button 
									onClick={() => setShowReviewForm(!showReviewForm)}
									className="text-violet-700 font-bold hover:text-violet-800 transition text-xs uppercase tracking-wide"
								>
									Write Review
								</button>
								{reviews.length > 3 && (
									<button 
										onClick={() => setShowAllReviews(!showAllReviews)}
										className="text-stone-400 hover:text-stone-600 font-medium transition text-xs"
									>
										{showAllReviews ? 'Show Less' : 'View All'}
									</button>
								)}
							</div>
						</div>

						{showReviewForm && (
							<div className="bg-white p-4 rounded-xl border border-stone-200 mb-6 shadow-sm">
								<div className="flex gap-2 mb-3">
									{[1, 2, 3, 4, 5].map((star) => (
										<button
											key={star}
											onClick={() => setReviewRating(star)}
											className={`text-xl transition ${star <= reviewRating ? 'text-amber-400' : 'text-stone-300'}`}
										>
											★
										</button>
									))}
								</div>
								<textarea
									value={reviewComment}
									onChange={(e) => setReviewComment(e.target.value)}
									placeholder="Describe your experience..."
									className="w-full rounded-lg border border-stone-200 p-3 mb-3 focus:border-violet-500 focus:outline-none text-sm"
									rows="2"
								/>
								<div className="flex justify-end gap-2">
									<button 
										onClick={() => setShowReviewForm(false)}
										className="px-3 py-1.5 text-stone-500 hover:bg-stone-50 rounded-lg transition text-xs font-medium"
									>
										Cancel
									</button>
									<button
										onClick={submitReview}
										disabled={reviewLoading}
										className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-violet-700 transition"
									>
										Post
									</button>
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{reviews.length === 0 ? (
								<div className="col-span-full bg-stone-50 rounded-xl p-6 text-center text-stone-500 italic text-sm">
									No reviews yet. Be the first to try their food!
								</div>
							) : (
								displayedReviews.map((review) => (
									<div key={review._id || Math.random()} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition duration-300 relative overflow-hidden">
										{review.status === 'pending' && (
											<div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider z-10">
												Pending Approval
											</div>
										)}
										<div className="flex justify-between items-start mb-2">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs uppercase">
													{review.user?.name?.charAt(0) || 'U'}
												</div>
												<div className="min-w-0">
													<h4 className="font-bold text-stone-800 text-xs truncate max-w-[100px]">{review.user?.name || 'Verified User'}</h4>
													<p className="text-[10px] text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</p>
												</div>
											</div>
											<div className="flex text-amber-400 text-xs">
												{[...Array(5)].map((_, i) => (
													<span key={i}>{i < review.rating ? '★' : '☆'}</span>
												))}
											</div>
										</div>
										<p className="text-stone-600 text-xs leading-relaxed line-clamp-3 italic">"{review.comment}"</p>
									</div>
								))
							)}
						</div>
					</div>

					{/* Subscription */}
					<div>
						<div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden group">
							<button 
								onClick={() => setShowSubscription(!showSubscription)}
								className="w-full flex items-center justify-between p-4 bg-violet-50/50 hover:bg-violet-50 transition duration-300"
							>
								<div className="text-left flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-xl">📅</div>
									<div>
										<h3 className="font-bold text-violet-900 text-base">Subscription Plans</h3>
										<p className="text-violet-700/70 text-xs font-medium">Automate your meals & save</p>
									</div>
								</div>
								<div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-violet-600 transition-transform duration-300 shadow-sm ${showSubscription ? 'rotate-180' : ''}`}>
									<FaChevronDown />
								</div>
							</button>
							
							{showSubscription && (
								<div className="p-6 border-t border-violet-100 bg-white animate-in slide-in-from-top-2 duration-300">
									<SubscriptionManager restaurantId={id} />
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Menu Section */}
				<div id="menu">
					<div className="flex items-center justify-center mb-10">
						<div className="h-px bg-stone-200 w-24"></div>
						<h2 className="text-3xl font-bold text-stone-800 mx-6 tracking-tight">Menu</h2>
						<div className="h-px bg-stone-200 w-24"></div>
					</div>

					{/* Menu View Toggle */}
					<div className="flex justify-center mb-10">
						<div className="inline-flex bg-white p-1.5 rounded-2xl shadow-lg border border-stone-100">
							<button
								onClick={() => setMenuView('today')}
								className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
									menuView === 'today'
										? 'bg-violet-600 text-white shadow-md'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
								}`}
							>
								<FaCalendarDay />
								Today
							</button>
							<button
								onClick={() => setMenuView('weekly')}
								className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
									menuView === 'weekly'
										? 'bg-violet-600 text-white shadow-md'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
								}`}
							>
								<FaCalendarWeek />
								Weekly
							</button>
							<button
								onClick={() => setMenuView('monthly')}
								className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
									menuView === 'monthly'
										? 'bg-violet-600 text-white shadow-md'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
								}`}
							>
								<FaCalendar />
								Monthly
							</button>
						</div>
					</div>

					{/* Menu Content */}
					<div className="min-h-[400px]">
						{menuView === 'today' && (
							<TodayMenu 
								items={getTodayItems()}
								openItemModal={(item) => {
									setSelectedItem(item);
									setShowItemModal(true);
								}}
								addToCart={addToCart}
								isCustomer={user?.role === 'customer'}
								userPreferences={userPreferences}
							/>
						)}

						{menuView === 'weekly' && (
							<WeeklyMenu 
								weeklyData={getWeeklyItems()}
								activeDay={activeDay}
								setActiveDay={setActiveDay}
								openItemModal={(item) => {
									setSelectedItem(item);
									setShowItemModal(true);
								}}
								addToCart={addToCart}
								isCustomer={user?.role === 'customer'}
								userPreferences={userPreferences}
							/>
						)}

						{menuView === 'monthly' && (
							<MonthlyMenu 
								data={getMonthlyItems()}
								openItemModal={(item) => {
									setSelectedItem(item);
									setShowItemModal(true);
								}}
								addToCart={addToCart}
								isCustomer={user?.role === 'customer'}
								userPreferences={userPreferences}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Item Modal */}
			{showItemModal && selectedItem && (
				<ItemModal
					item={selectedItem}
					closeModal={() => setShowItemModal(false)}
					addToCart={addToCart}
					isCustomer={user?.role === 'customer'}
					userPreferences={userPreferences}
				/>
			)}

			<FloatingCart />
		</div>
	);
}

// Today Menu Component
const TodayMenu = ({ items, openItemModal, addToCart, isCustomer, userPreferences }) => {
	const lunchItems = items.filter(item => item.mealType === 'lunch');
	const dinnerItems = items.filter(item => item.mealType === 'dinner');
	
	const canOrderLunch = canOrderMeal('lunch');
	const canOrderDinner = canOrderMeal('dinner');

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed mx-4">
				<div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-4xl mb-4 opacity-50">📅</div>
				<h3 className="text-xl font-bold text-stone-400">No menu for today</h3>
				<p className="text-stone-400 text-sm mt-1">Check back later or view weekly/monthly menu</p>
			</div>
		);
	}

	return (
		<div className="space-y-16 animate-in fade-in duration-500">
			{lunchItems.length > 0 && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-sm">☀️</span>
						<h3 className="text-2xl font-bold text-stone-800">Lunch</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderLunch && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed until tomorrow</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{lunchItems.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderLunch}
								userPreferences={userPreferences}
							/>
						))}
					</div>
					{!canOrderLunch && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Lunch ordering is closed after {ORDER_DEADLINES.lunch.label}. 
								You can still order lunch for future dates.
							</p>
						</div>
					)}
				</div>
			)}

			{dinnerItems.length > 0 && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">🌙</span>
						<h3 className="text-2xl font-bold text-stone-800">Dinner</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderDinner && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed until tomorrow</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{dinnerItems.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderDinner}
								userPreferences={userPreferences}
							/>
						))}
					</div>
					{!canOrderDinner && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Dinner ordering is closed after {ORDER_DEADLINES.dinner.label}. 
								You can still order dinner for future dates.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

// Weekly Menu Component
const WeeklyMenu = ({ weeklyData, activeDay, setActiveDay, openItemModal, addToCart, isCustomer, userPreferences }) => {
	const today = new Date();
	const todayDayName = DAYS[today.getDay()];
	
	return (
		<>
			{/* Day Selector with Dates */}
			<div className="flex justify-center mb-8">
				<div className="inline-flex bg-stone-100 p-1.5 rounded-full shadow-inner overflow-x-auto max-w-full">
					{DAYS.map((day) => {
						const dayData = weeklyData[day];
						const isToday = day === todayDayName;
						const dateDisplay = dayData?.date 
							? dayData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
							: '';
						
						return (
							<button
								key={day}
								onClick={() => setActiveDay(day)}
								className={`px-4 py-2.5 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-all duration-300 flex flex-col items-center ${
									activeDay === day
										? 'bg-white text-violet-700 shadow-md ring-1 ring-black/5'
										: 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
								}`}
							>
								<span>{day.slice(0, 3)}</span>
								<span className={`text-xs mt-1 ${isToday ? 'text-violet-600 font-bold' : 'text-stone-400'}`}>
									{dateDisplay}
									{isToday && ' (Today)'}
								</span>
							</button>
						);
					})}
				</div>
			</div>
			
			{/* Day Menu */}
			<DayMenu 
				day={activeDay}
				dayData={weeklyData[activeDay]}
				openItemModal={openItemModal}
				addToCart={addToCart}
				isCustomer={isCustomer}
				userPreferences={userPreferences}
			/>
		</>
	);
};

// Day Menu Component
const DayMenu = ({ day, dayData, openItemModal, addToCart, isCustomer, userPreferences }) => {
	if (!dayData) {
		return (
			<div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-stone-200 border-dashed mx-4">
				<div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-4xl mb-4 opacity-50">👨‍🍳</div>
				<h3 className="text-xl font-bold text-stone-400">No menu available</h3>
				<p className="text-stone-400 text-sm mt-1">No meals scheduled for {day}</p>
			</div>
		);
	}

	const { lunch, dinner, date } = dayData;
	const hasLunch = lunch.length > 0;
	const hasDinner = dinner.length > 0;
	const isToday = date.toDateString() === new Date().toDateString();
	
	const canOrderLunch = isToday ? canOrderMeal('lunch') : true;
	const canOrderDinner = isToday ? canOrderMeal('dinner') : true;

	return (
		<div className="space-y-16 animate-in fade-in duration-500">
			{/* Day header with date */}
			<div className="text-center mb-8">
				<h2 className="text-3xl font-bold text-stone-800 capitalize">{day}</h2>
				<p className="text-stone-600 mt-2">
					{date.toLocaleDateString('en-US', { 
						weekday: 'long', 
						month: 'long', 
						day: 'numeric',
						year: 'numeric'
					})}
					{isToday && <span className="ml-2 text-sm bg-violet-100 text-violet-700 px-2 py-1 rounded-full">Today</span>}
				</p>
			</div>

			{hasLunch && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl shadow-sm">☀️</span>
						<h3 className="text-2xl font-bold text-stone-800">Lunch</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderLunch && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{lunch.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderLunch}
								userPreferences={userPreferences}
							/>
						))}
					</div>
					{isToday && !canOrderLunch && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Today's lunch ordering is closed after {ORDER_DEADLINES.lunch.label}. 
								You can still order lunch for future days.
							</p>
						</div>
					)}
				</div>
			)}

			{hasDinner && (
				<div>
					<div className="flex items-center gap-4 mb-8">
						<span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">🌙</span>
						<h3 className="text-2xl font-bold text-stone-800">Dinner</h3>
						<div className="h-px bg-stone-200 flex-1 ml-4"></div>
						{!canOrderDinner && (
							<div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
								<FaExclamationTriangle />
								<span>Ordering closed</span>
							</div>
						)}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{dinner.map((item) => (
							<MenuItemCard
								key={item._id}
								item={item}
								onClick={() => openItemModal(item)}
								onAdd={() => addToCart(item)}
								isCustomer={isCustomer}
								canOrder={canOrderDinner}
								userPreferences={userPreferences}
							/>
						))}
					</div>
					{isToday && !canOrderDinner && (
						<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
							<p className="text-red-700 text-sm font-medium">
								Today's dinner ordering is closed after {ORDER_DEADLINES.dinner.label}. 
								You can still order dinner for future days.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

// Monthly Menu Component
const MonthlyMenu = ({ data, openItemModal, addToCart, isCustomer, userPreferences }) => {
	const { next30Days, itemsByDate } = data;

	return (
		<div className="space-y-4">
			{next30Days.map(day => {
				const dayItems = itemsByDate[day.dateString] || [];
				const lunchItems = dayItems.filter(item => item.mealType === 'lunch');
				const dinnerItems = dayItems.filter(item => item.mealType === 'dinner');
				
				const isToday = day.dateString === new Date().toISOString().split('T')[0];
				const canOrderLunch = isToday ? canOrderMeal('lunch') : true;
				const canOrderDinner = isToday ? canOrderMeal('dinner') : true;

				return (
					<div key={day.dateString} className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm hover:shadow-md transition">
						<div className="flex items-center justify-between mb-4">
							<div>
								<h3 className="font-bold text-stone-900 text-lg">
									{day.displayDate}
									{isToday && <span className="ml-2 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">Today</span>}
								</h3>
								<p className="text-sm text-stone-500 capitalize">{day.dayName}</p>
							</div>
							<span className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-bold">
								{dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
							</span>
						</div>

						{dayItems.length === 0 ? (
							<p className="text-sm text-stone-400 italic py-4">No meals scheduled</p>
						) : (
							<div className="space-y-6">
								{lunchItems.length > 0 && (
									<div>
										<div className="flex items-center gap-2 mb-3">
											<span className="text-lg">☀️</span>
											<span className="font-semibold text-stone-700">Lunch</span>
											{isToday && !canOrderLunch && (
												<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Ordering closed</span>
											)}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{lunchItems.map(item => (
												<MonthlyMenuItem
													key={item._id}
													item={item}
													openItemModal={() => openItemModal(item)}
													addToCart={() => addToCart(item)}
													isCustomer={isCustomer}
													canOrder={canOrderLunch}
													userPreferences={userPreferences}
												/>
											))}
										</div>
									</div>
								)}

								{dinnerItems.length > 0 && (
									<div>
										<div className="flex items-center gap-2 mb-3">
											<span className="text-lg">🌙</span>
											<span className="font-semibold text-stone-700">Dinner</span>
											{isToday && !canOrderDinner && (
												<span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Ordering closed</span>
											)}
										</div>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
											{dinnerItems.map(item => (
												<MonthlyMenuItem
													key={item._id}
													item={item}
													openItemModal={() => openItemModal(item)}
													addToCart={() => addToCart(item)}
													isCustomer={isCustomer}
													canOrder={canOrderDinner}
													userPreferences={userPreferences}
												/>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

// LLM Allergen Detection Hook
// LLM Allergen Detection Hook
const useLLMAllergenDetection = (item, userPreferences) => {
  const [allergenData, setAllergenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const detectAllergens = async () => {
      // If no allergies, return safe result
      if (!userPreferences?.allergies?.length) {
        setAllergenData({
          allergenDetected: false,
          detectedAllergens: [],
          crossContamination: [],
          summary: 'No allergies specified'
        });
        return;
      }

      // If no item, return
      if (!item) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`🤖 Checking allergens for: ${item.name}`);
        console.log(`👤 User allergies: ${userPreferences.allergies.join(', ')}`);
        
        const response = await axiosInstance.post('/api/allergen/detect', {
          item: {
            name: item.name,
            description: item.description || '',
            ingredients: item.ingredients || []
          },
          allergies: userPreferences.allergies
        });

        console.log('📥 API Response:', response.data);

        if (response.data.success) {
          const result = response.data.data;
          console.log(`✅ Allergen check complete for ${item.name}:`, result);
          
          // Double-check for nuts/cashews if user is allergic to nuts
          if (userPreferences.allergies.some(a => a.toLowerCase().includes('nut'))) {
            const itemText = `${item.name} ${item.description} ${item.ingredients?.join(' ')}`.toLowerCase();
            if (itemText.includes('cashew') || itemText.includes('cashews')) {
              console.log('⚠️ Manual override: Cashews detected!');
              result.allergenDetected = true;
              if (!result.detectedAllergens.some(d => d.allergen === 'nuts')) {
                result.detectedAllergens.push({
                  allergen: 'nuts',
                  trigger: 'cashews in ingredients',
                  confidence: 'high',
                  message: 'Contains cashews (tree nuts)'
                });
              }
              result.summary = 'This item contains cashews which you are allergic to (nuts).';
            }
          }
          
          setAllergenData(result);
        } else {
          console.error('API returned error:', response.data);
          setAllergenData({
            allergenDetected: false,
            detectedAllergens: [],
            crossContamination: [],
            summary: 'Error analyzing allergens'
          });
        }
      } catch (err) {
        console.error('❌ Failed to detect allergens:', err);
        setError(err.message);
        
        // Fallback manual detection
        if (userPreferences.allergies.some(a => a.toLowerCase().includes('nut'))) {
          const itemText = `${item.name} ${item.description} ${item.ingredients?.join(' ')}`.toLowerCase();
          if (itemText.includes('cashew') || itemText.includes('cashews')) {
            console.log('⚠️ Fallback: Cashews detected!');
            setAllergenData({
              allergenDetected: true,
              detectedAllergens: [{
                allergen: 'nuts',
                trigger: 'cashews in ingredients',
                confidence: 'high',
                message: 'Contains cashews (tree nuts)'
              }],
              crossContamination: [],
              summary: 'This item contains cashews which you are allergic to (nuts).'
            });
            setLoading(false);
            return;
          }
        }
        
        setAllergenData({
          allergenDetected: false,
          detectedAllergens: [],
          crossContamination: [],
          summary: 'Error analyzing allergens'
        });
      } finally {
        setLoading(false);
      }
    };

    detectAllergens();
  }, [item, userPreferences]);

  return { allergenData, loading, error };
};

// Menu Item Card Component with LLM Allergen Detection
const MenuItemCard = ({ item, isCustomer, onAdd, onClick, canOrder = true, userPreferences }) => {
	const itemDate = new Date(item.date);
	const dateDisplay = itemDate.toLocaleDateString('en-US', { 
		month: 'short', 
		day: 'numeric' 
	});
	
	const [showAllergenWarning, setShowAllergenWarning] = useState(false);
	const { allergenData, loading } = useLLMAllergenDetection(item, userPreferences);

	const hasAllergens = allergenData?.allergenDetected || false;
	const detectedAllergens = allergenData?.detectedAllergens || [];
	const crossContamination = allergenData?.crossContamination || [];

	const handleAddToCart = (e) => {
		e.stopPropagation();
		if (canOrder) {
			if (hasAllergens) {
				const allergenList = detectedAllergens.map(a => a.allergen).join(', ');
				if (window.confirm(`⚠️ Allergen Warning: This item contains ${allergenList}. ${allergenData?.summary}\n\nAre you sure you want to add it to your cart?`)) {
					onAdd();
				}
			} else {
				onAdd();
			}
		} else {
			const deadline = ORDER_DEADLINES[item.mealType];
			alert(`Sorry! ${item.mealType} ordering is closed after ${deadline.label}.`);
		}
	};

	return (
		<div 
			className={`group bg-white rounded-2xl border border-stone-100 p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden ${
				!canOrder ? 'opacity-80' : ''
			} ${hasAllergens ? 'border-l-4 border-l-red-500' : ''}`}
			onClick={onClick}
			onMouseEnter={() => setShowAllergenWarning(true)}
			onMouseLeave={() => setShowAllergenWarning(false)}
		>
			{/* Loading Indicator */}
			{loading && (
				<div className="absolute top-2 right-2 z-10">
					<div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500 border-t-transparent"></div>
				</div>
			)}
			
			{/* Allergen Warning Overlay on Hover */}
			{hasAllergens && showAllergenWarning && allergenData && (
				<div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 animate-fade-in">
					<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-2xl mb-3">
						⚠️
					</div>
					<h4 className="font-bold text-red-800 text-sm mb-2">Allergen Alert</h4>
					<div className="space-y-2 text-center max-h-40 overflow-y-auto px-2">
						{detectedAllergens.map((warning, idx) => (
							<div key={idx} className="text-xs">
								<span className="font-bold text-red-700">{warning.allergen}</span>
								<p className="text-red-600 text-[10px] mt-0.5">{warning.message}</p>
								{warning.trigger && (
									<p className="text-red-500 text-[8px] mt-0.5 italic">Found in: {warning.trigger}</p>
								)}
							</div>
						))}
						{crossContamination.length > 0 && (
							<div className="mt-2 pt-2 border-t border-red-200">
								<p className="text-xs font-bold text-red-700">⚠️ Cross Contamination Risk:</p>
								{crossContamination.map((warning, idx) => (
									<p key={idx} className="text-red-600 text-[10px]">{warning}</p>
								))}
							</div>
						)}
					</div>
					<p className="text-[10px] text-red-500 mt-3 font-medium">{allergenData?.summary || 'Please proceed with caution'}</p>
				</div>
			)}
			
			{/* Allergen Indicator Badge */}
			{hasAllergens && (
				<div className="absolute top-2 left-2 z-10">
					<div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
						<span>⚠️</span>
						<span>Allergen</span>
					</div>
				</div>
			)}
			
			
			
			<div className="flex gap-4">
				<div className="w-24 h-24 flex-shrink-0">
					<img
						src={item.imageUrl || FALLBACK_IMAGE}
						alt={item.name}
						className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
						onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
					/>
				</div>
				
				<div className="flex-1 flex flex-col justify-between min-w-0 py-1">
					<div>
						<div className="flex justify-between items-start mb-1">
							<div>
								<h4 className="font-bold text-stone-800 group-hover:text-violet-700 transition line-clamp-1 text-lg">{item.name}</h4>
								<p className="text-xs text-stone-500 mt-1">{dateDisplay}</p>
							</div>
							<span className="font-bold text-violet-600 shrink-0 ml-2 bg-violet-50 px-2 py-0.5 rounded-lg">{item.price} ৳</span>
						</div>
						<div className="flex flex-wrap gap-1 mb-2">
							{item.calories && <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded uppercase tracking-wide">{item.calories} CAL</span>}
							<span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded uppercase tracking-wide">{item.mealType}</span>
							{!canOrder && (
								<span className="text-[10px] font-bold text-red-400 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wide">Closed</span>
							)}
						</div>
						<p className="text-stone-500 text-sm line-clamp-2 pr-4 leading-relaxed">{item.description}</p>
						
						{/* Detected Allergens Summary */}
						{hasAllergens && !showAllergenWarning && (
							<div className="mt-2">
								<p className="text-red-600 text-xs">
									⚠️ Contains: {detectedAllergens.map(a => a.allergen).join(', ')}
								</p>
							</div>
						)}
					</div>
				</div>
				
				{isCustomer && (
					<button
						onClick={handleAddToCart}
						className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm group-hover:scale-110 ${
							canOrder 
								? hasAllergens
									? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white'
									: 'bg-stone-100 text-stone-600 hover:bg-violet-600 hover:text-white'
								: 'bg-gray-100 text-gray-400 cursor-not-allowed'
						}`}
						title={canOrder ? (hasAllergens ? "Contains allergens - add with caution" : "Add to Cart") : "Ordering closed"}
						disabled={!canOrder}
					>
						<span className="font-bold text-xl mb-0.5">+</span>
					</button>
				)}
			</div>
			
			{!canOrder && (
				<div className="mt-3 pt-3 border-t border-stone-100">
					<p className="text-xs text-red-500 flex items-center gap-1">
						<FaExclamationTriangle className="text-xs" />
						Ordering closed for today's {item.mealType}
					</p>
				</div>
			)}
		</div>
	);
};

// Monthly Menu Item Component with LLM Allergen Detection
const MonthlyMenuItem = ({ item, openItemModal, addToCart, isCustomer, canOrder, userPreferences }) => {
	const [showAllergenWarning, setShowAllergenWarning] = useState(false);
	const { allergenData, loading } = useLLMAllergenDetection(item, userPreferences);

	const hasAllergens = allergenData?.allergenDetected || false;
	const detectedAllergens = allergenData?.detectedAllergens || [];

	const handleAddToCart = (e) => {
		e.stopPropagation();
		if (canOrder) {
			if (hasAllergens) {
				const allergenList = detectedAllergens.map(a => a.allergen).join(', ');
				if (window.confirm(`⚠️ Allergen Warning: This item contains ${allergenList}. ${allergenData?.summary}\n\nAre you sure you want to add it to your cart?`)) {
					addToCart();
				}
			} else {
				addToCart();
			}
		}
	};

	return (
		<div 
			className={`relative flex gap-3 border rounded-lg p-3 transition ${
				canOrder 
					? 'hover:shadow-sm cursor-pointer' 
					: 'opacity-50 cursor-not-allowed bg-gray-50'
			} ${hasAllergens ? 'border-l-4 border-l-red-500' : 'border-stone-100'}`}
			onClick={canOrder ? openItemModal : undefined}
			onMouseEnter={() => setShowAllergenWarning(true)}
			onMouseLeave={() => setShowAllergenWarning(false)}
		>
			{/* Loading Indicator */}
			{loading && (
				<div className="absolute top-1 right-1 z-10">
					<div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-500 border-t-transparent"></div>
				</div>
			)}
			
			{/* Allergen Warning Overlay on Hover */}
			{hasAllergens && showAllergenWarning && allergenData && (
				<div className="absolute inset-0 bg-red-50/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-3 rounded-lg animate-fade-in">
					<div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm mb-1">
						⚠️
					</div>
					<h4 className="font-bold text-red-800 text-xs mb-1">Allergen Alert</h4>
					<div className="space-y-0.5 text-center">
						{detectedAllergens.map((warning, idx) => (
							<div key={idx} className="text-[10px]">
								<span className="font-bold text-red-700">{warning.allergen}</span>
							</div>
						))}
					</div>
				</div>
			)}
			
			{/* Allergen Indicator Badge */}
			{hasAllergens && (
				<div className="absolute top-1 left-1 z-10">
					<div className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg">
						<span>⚠️</span>
					</div>
				</div>
			)}
			
			
			
			<img
				src={item.imageUrl || FALLBACK_IMAGE}
				alt={item.name}
				className="w-16 h-16 object-cover rounded flex-shrink-0"
				onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
			/>
			<div className="flex-1 min-w-0">
				<div className="font-medium text-sm truncate">{item.name}</div>
				<div className="text-xs text-stone-500 line-clamp-1">{item.description}</div>
				<div className="flex items-center justify-between mt-1">
					<span className="text-sm font-bold text-violet-700">{item.price} ৳</span>
					{isCustomer && (
						<button
							onClick={handleAddToCart}
							className={`px-2 py-1 rounded text-xs font-semibold transition ${
								canOrder 
									? hasAllergens
										? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
										: 'bg-violet-100 text-violet-700 hover:bg-violet-200'
									: 'bg-gray-100 text-gray-400 cursor-not-allowed'
							}`}
							disabled={!canOrder}
						>
							{canOrder ? (hasAllergens ? '⚠️ Add' : 'Add') : 'Closed'}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};

// Item Modal Component with LLM Allergen Detection
const ItemModal = ({ item, isCustomer, addToCart, closeModal, userPreferences }) => {
	if (!item) return null;
	
	const itemDate = new Date(item.date);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	itemDate.setHours(0, 0, 0, 0);
	const isToday = itemDate.getTime() === today.getTime();
	const canOrder = isToday ? canOrderMeal(item.mealType, item.date) : true;
	
	const { allergenData, loading } = useLLMAllergenDetection(item, userPreferences);

	const hasAllergens = allergenData?.allergenDetected || false;
	const detectedAllergens = allergenData?.detectedAllergens || [];
	const crossContamination = allergenData?.crossContamination || [];

	const handleAddToCart = () => {
		if (canOrder) {
			if (hasAllergens) {
				const allergenList = detectedAllergens.map(a => a.allergen).join(', ');
				if (window.confirm(`⚠️ Allergen Warning: This item contains ${allergenList}. ${allergenData?.summary}\n\nAre you sure you want to add it to your cart?`)) {
					addToCart(item);
					closeModal();
				}
			} else {
				addToCart(item);
				closeModal();
			}
		} else {
			alert(`Sorry! ${item.mealType} ordering is closed for today after ${ORDER_DEADLINES[item.mealType].label}.`);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
			<div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
				<div className="relative">
					<img
						src={item.imageUrl || FALLBACK_IMAGE}
						alt={item.name}
						className="w-full h-64 object-cover"
						onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
					/>
					<button
						onClick={closeModal}
						className="absolute top-4 right-4 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"
					>
						×
					</button>
					
					{/* Allergen Warning Badge */}
					{hasAllergens && (
						<div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
							<span>⚠️</span>
							<span>Contains Allergens</span>
						</div>
					)}
					
					
					
					{/* Loading Indicator */}
					{loading && (
						<div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
							<div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500 border-t-transparent"></div>
							<span>Analyzing...</span>
						</div>
					)}
				</div>
				
				<div className="p-8">
					<div className="mb-6">
						<div className="flex justify-between items-start mb-2">
							<h3 className="text-2xl font-bold text-stone-900">{item.name}</h3>
							<span className="text-2xl font-bold text-violet-700">{item.price} ৳</span>
						</div>
						<div className="flex gap-2 flex-wrap">
							{item.calories && <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded">{item.calories} CAL</span>}
							<span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded capitalize">{item.mealType}</span>
							{item.day && <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded capitalize">{item.day}</span>}
							{isToday && !canOrder && (
								<span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded">Ordering Closed</span>
							)}
						</div>
					</div>

					{/* Allergen Warning Section */}
					{hasAllergens && allergenData && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="flex items-center gap-2 text-red-700 font-medium mb-2">
								<FaExclamationTriangle />
								<span>Allergen Alert</span>
							</div>
							<div className="space-y-2">
								{detectedAllergens.map((warning, idx) => (
									<div key={idx} className="text-red-600 text-sm">
										• <span className="font-bold">{warning.allergen}</span>: {warning.message}
										{warning.trigger && (
											<p className="text-red-500 text-xs ml-4">Found in: {warning.trigger}</p>
										)}
									</div>
								))}
								{crossContamination.length > 0 && (
									<div className="mt-2 pt-2 border-t border-red-200">
										<p className="text-xs font-bold text-red-700">⚠️ Cross Contamination Risk:</p>
										{crossContamination.map((warning, idx) => (
											<p key={idx} className="text-red-600 text-xs ml-2">• {warning}</p>
										))}
									</div>
								)}
							</div>
							<p className="text-xs text-red-600 mt-3 italic">{allergenData.summary}</p>
						</div>
					)}

					{/* Safe Message */}
					{!hasAllergens && userPreferences?.allergies?.length > 0 && !loading && allergenData && (
						<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
							<div className="flex items-center gap-2 text-green-700 font-medium mb-2">
								<span>✅</span>
								<span>Safe for You</span>
							</div>
							<p className="text-green-600 text-sm">No allergens detected in this item based on your preferences.</p>
						</div>
					)}

					{item.description && (
						<div className="mb-8">
							<h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">About this meal</h4>
							<p className="text-stone-700 leading-relaxed text-lg font-light">{item.description}</p>
						</div>
					)}

					{item.ingredients?.length > 0 && (
						<div className="mb-8">
							<h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Ingredients</h4>
							<div className="flex flex-wrap gap-2">
								{item.ingredients.map((ing, i) => {
									// Check if this ingredient triggers any allergen
									const isAllergen = detectedAllergens.some(w => 
										ing.toLowerCase().includes(w.allergen.toLowerCase()) ||
										w.trigger?.toLowerCase().includes(ing.toLowerCase())
									);
									return (
										<span
											key={i}
											className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
												isAllergen 
													? 'bg-red-100 text-red-700 border-red-200' 
													: 'bg-stone-100 text-stone-600 border-stone-200'
											}`}
										>
											{ing}
											{isAllergen && <span className="ml-1 text-xs">⚠️</span>}
										</span>
									);
								})}
							</div>
						</div>
					)}

					{isToday && !canOrder && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="flex items-center gap-2 text-red-700 font-medium mb-2">
								<FaExclamationTriangle />
								<span>Ordering Closed</span>
							</div>
							<p className="text-red-600 text-sm">
								{item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)} ordering is closed after {ORDER_DEADLINES[item.mealType].label} for today.
							</p>
						</div>
					)}

					{isCustomer ? (
						<button
							onClick={handleAddToCart}
							className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
								canOrder 
									? hasAllergens
										? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-200'
										: 'bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'
							}`}
							disabled={!canOrder}
						>
							<span>{canOrder ? (hasAllergens ? 'Add with Caution' : 'Add to Cart') : 'Ordering Closed'}</span>
							<span className={`px-2 py-0.5 rounded text-sm ${
								canOrder 
									? hasAllergens ? 'bg-amber-600/50' : 'bg-violet-700/50'
									: 'bg-gray-400'
							}`}>{item.price} ৳</span>
						</button>
					) : (
						<div className="w-full bg-stone-100 text-stone-400 py-4 rounded-xl font-bold text-center">
							Login to Order
						</div>
					)}
				</div>
			</div>
		</div>
	);
};