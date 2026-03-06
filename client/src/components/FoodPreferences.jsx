import { useState } from 'react';

export default function FoodPreferences({ 
	initialPreferences, 
	onSave, 
	onClose, 
	isSaving, 
	error 
}) {
	const [foodPreferences, setFoodPreferences] = useState(initialPreferences);
	const [preferenceInput, setPreferenceInput] = useState({
		like: '',
		dislike: '',
		allergy: ''
	});

	const addPreference = (type) => {
		const value = preferenceInput[type].trim();
		if (!value) return;
		
		const typeKeyMap = {
			like: 'likes',
			dislike: 'dislikes',
			allergy: 'allergies',
		};

		const preferencesKey = typeKeyMap[type];
		if (!preferencesKey) return;

		setFoodPreferences(prev => ({
			...prev,
			[preferencesKey]: [...(prev[preferencesKey] || []), value],
		}));
		
		setPreferenceInput(prev => ({ ...prev, [type]: '' }));
	};

	const removePreference = (type, index) => {
		setFoodPreferences(prev => ({
			...prev,
			[type]: prev[type].filter((_, i) => i !== index)
		}));
	};

	const handleSave = () => {
		onSave(foodPreferences);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			>
				<div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
					<h2 className="text-2xl font-bold text-gray-800">Your Food Preferences</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-2xl"
					>
						✕
					</button>
				</div>

				{error && (
					<div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
						{error}
					</div>
				)}

				<div className="p-6 space-y-8">
					{/* Likes Section */}
					<PreferenceSection
						title="What do you like?"
						icon="👍"
						color="pink"
						items={foodPreferences.likes}
						inputValue={preferenceInput.like}
						onInputChange={(value) => setPreferenceInput(prev => ({ ...prev, like: value }))}
						onAdd={() => addPreference('like')}
						onRemove={(index) => removePreference('likes', index)}
						placeholder="e.g., Pizza, Pasta, Spicy food"
					/>

					{/* Dislikes Section */}
					<PreferenceSection
						title="What do you dislike?"
						icon="👎"
						color="violet"
						items={foodPreferences.dislikes}
						inputValue={preferenceInput.dislike}
						onInputChange={(value) => setPreferenceInput(prev => ({ ...prev, dislike: value }))}
						onAdd={() => addPreference('dislike')}
						onRemove={(index) => removePreference('dislikes', index)}
						placeholder="e.g., Mushrooms, Onions, Seafood"
					/>

					{/* Allergies Section */}
					<PreferenceSection
						title="Do you have any allergies?"
						icon="⚠️"
						color="blue"
						items={foodPreferences.allergies}
						inputValue={preferenceInput.allergy}
						onInputChange={(value) => setPreferenceInput(prev => ({ ...prev, allergy: value }))}
						onAdd={() => addPreference('allergy')}
						onRemove={(index) => removePreference('allergies', index)}
						placeholder="e.g., Peanuts, Gluten, Lactose"
					/>
				</div>

				<div className="p-6 border-t sticky bottom-0 bg-white flex gap-3">
					<button
						onClick={onClose}
						disabled={isSaving}
						className="flex-1 px-6 py-3 border rounded-xl hover:bg-gray-50 font-semibold disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={isSaving}
						className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-semibold disabled:opacity-50"
					>
						{isSaving ? 'Saving...' : 'Save Preferences'}
					</button>
				</div>
			</div>
		</div>
	);
}

// ------------------ Preference Section Component ------------------
const PreferenceSection = ({ title, icon, color, items, inputValue, onInputChange, onAdd, onRemove, placeholder }) => {
	const colorClasses = {
		pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
		violet: 'bg-violet-100 text-violet-800 hover:bg-violet-200',
		blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
	};

	const buttonColors = {
		pink: 'bg-pink-500 hover:bg-pink-600',
		violet: 'bg-violet-500 hover:bg-violet-600',
		blue: 'bg-blue-500 hover:bg-blue-600'
	};

	return (
		<div>
			<label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
				<span>{icon}</span> {title}
			</label>
			<div className="flex flex-wrap gap-2 mb-3">
				{items.map((item, index) => (
					<span
						key={index}
						className={`${colorClasses[color]} px-3 py-1.5 rounded-full text-sm flex items-center gap-2`}
					>
						{item}
						<button
							onClick={() => onRemove(index)}
							className="ml-1 hover:opacity-70"
						>
							✕
						</button>
					</span>
				))}
			</div>
			<div className="flex gap-2">
				<input
					type="text"
					value={inputValue}
					onChange={(e) => onInputChange(e.target.value)}
					placeholder={placeholder}
					className="flex-1 px-4 py-2 border rounded-lg focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
					onKeyPress={(e) => e.key === 'Enter' && onAdd()}
				/>
				<button
					onClick={onAdd}
					className={`px-6 py-2 ${buttonColors[color]} text-white rounded-lg transition`}
				>
					Add
				</button>
			</div>
		</div>
	);
};