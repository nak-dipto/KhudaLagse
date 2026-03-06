import { User } from '../models/User.js';

export const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					address: user.address,
					vehicleType: user.vehicleType,
					foodPreferences: user.foodPreferences || { likes: [], dislikes: [], allergies: [] },
				},
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { name, email, phone, address, vehicleType, foodPreferences } = req.body;
		const fieldsToUpdate = {};

		if (name) fieldsToUpdate.name = name;
		if (email) fieldsToUpdate.email = email;
		if (phone) fieldsToUpdate.phone = phone;
		if (address) fieldsToUpdate.address = address;
		if (vehicleType) fieldsToUpdate.vehicleType = vehicleType;
		if (foodPreferences) fieldsToUpdate.foodPreferences = foodPreferences;

		// Check if email is already taken by another user
		if (email) {
			const existingUser = await User.findOne({
				email,
				_id: { $ne: req.user.id },
			});
			if (existingUser) {
				return res.status(400).json({
					success: false,
					message: 'Email is already taken by another user',
				});
			}
		}

		const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
			new: true,
			runValidators: true,
		});

		res.status(200).json({
			success: true,
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					phone: user.phone,
					role: user.role,
					address: user.address,
					vehicleType: user.vehicleType,
					foodPreferences: user.foodPreferences || { likes: [], dislikes: [], allergies: [] },
				},
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get user's food preferences
export const getFoodPreferences = async (req, res) => {
	try {
		const { userId } = req.params;
		
		// Ensure the requesting user is either the user themselves or an admin
		if (req.user.id !== userId && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to view these preferences'
			});
		}

		const user = await User.findById(userId).select('foodPreferences');
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found'
			});
		}

		res.status(200).json({
			success: true,
			data: user.foodPreferences || { likes: [], dislikes: [], allergies: [] }
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message
		});
	}
};

// Save/Update user's food preferences
// Save/Update user's food preferences
export const updateFoodPreferences = async (req, res) => {
	try {
		const userId = req.user.id; // Get user ID from authenticated token

		// Accept multiple possible payload formats for robustness
		let preferences = req.body.preferences;

		// Fallbacks in case the client sends a different shape
		if (!preferences && req.body.foodPreferences) {
			preferences = req.body.foodPreferences;
		}
		if (!preferences && (req.body.likes || req.body.dislikes || req.body.allergies)) {
			preferences = {
				likes: req.body.likes,
				dislikes: req.body.dislikes,
				allergies: req.body.allergies,
			};
		}

		// Validate preferences structure
		if (!preferences || typeof preferences !== 'object') {
			return res.status(400).json({
				success: false,
				message: 'Invalid preferences format',
			});
		}

		// Normalize to arrays and also accept singular keys (like/dislike/allergy)
		const likes =
			Array.isArray(preferences.likes)
				? preferences.likes
				: preferences.like
				? [preferences.like]
				: [];

		const dislikes =
			Array.isArray(preferences.dislikes)
				? preferences.dislikes
				: preferences.dislike
				? [preferences.dislike]
				: [];

		const allergies =
			Array.isArray(preferences.allergies)
				? preferences.allergies
				: preferences.allergy
				? [preferences.allergy]
				: [];

		const validatedPreferences = { likes, dislikes, allergies };

		// Load the user document, assign preferences, and save,
		// to guarantee the change is persisted on the actual user doc.
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		// Ensure foodPreferences object exists
		if (!user.foodPreferences) {
			user.foodPreferences = { likes: [], dislikes: [], allergies: [] };
		}

		user.foodPreferences.likes = likes;
		user.foodPreferences.dislikes = dislikes;
		user.foodPreferences.allergies = allergies;

		// Explicitly mark modified and save to be extra safe
		user.markModified('foodPreferences');
		await user.save();

		res.status(200).json({
			success: true,
			data: user.foodPreferences || { likes: [], dislikes: [], allergies: [] },
			message: 'Food preferences updated successfully',
		});
	} catch (error) {
		console.error('Error updating food preferences:', error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
// Add a single like preference
export const addLike = async (req, res) => {
	try {
		const { userId, like } = req.body;
		
		if (req.user.id !== userId && req.user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'Not authorized' });
		}

		if (!like || typeof like !== 'string') {
			return res.status(400).json({ success: false, message: 'Invalid like value' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (!user.foodPreferences) {
			user.foodPreferences = { likes: [], dislikes: [], allergies: [] };
		}

		if (!user.foodPreferences.likes.includes(like)) {
			user.foodPreferences.likes.push(like);
			await user.save();
		}

		res.status(200).json({
			success: true,
			data: user.foodPreferences
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

// Remove a like preference
export const removeLike = async (req, res) => {
	try {
		const { userId, like } = req.body;
		
		if (req.user.id !== userId && req.user.role !== 'admin') {
			return res.status(403).json({ success: false, message: 'Not authorized' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ success: false, message: 'User not found' });
		}

		if (user.foodPreferences?.likes) {
			user.foodPreferences.likes = user.foodPreferences.likes.filter(l => l !== like);
			await user.save();
		}

		res.status(200).json({
			success: true,
			data: user.foodPreferences
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const addFavorite = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		const restaurantId = req.params.restaurantId;
		if (!user.favorites.includes(restaurantId)) {
			user.favorites.push(restaurantId);
			await user.save();
		}

		res.status(200).json({ success: true, favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const removeFavorite = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		const restaurantId = req.params.restaurantId;
		user.favorites = user.favorites.filter(
			(id) => id.toString() !== restaurantId
		);
		await user.save();

		res.status(200).json({ success: true, favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const getFavorites = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		if (!user)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		// Return just the array of IDs, not populated objects
		res.status(200).json({ success: true, favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};