// pages/admin/Overview.jsx
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axios';
import { motion } from 'framer-motion';

export default function Overview() {
	const [overview, setOverview] = useState(null);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadOverview();
	}, []);

	const loadOverview = async () => {
		setError('');
		setLoading(true);
		try {
			const res = await axiosInstance.get('/api/admin/dashboard');
			setOverview(res.data.data);
		} catch (err) {
			setError(
				err.response?.data?.message ||
					err.message ||
					'Failed to load data'
			);
		} finally {
			setLoading(false);
		}
	};

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2
			}
		}
	};

	const cardVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { 
			opacity: 1, 
			y: 0,
			transition: { 
				type: "spring",
				stiffness: 100,
				damping: 12
			}
		}
	};

	// Card colors and gradients
	const cardStyles = [
		{ 
			bg: 'from-violet-500 to-purple-600',
			lightBg: 'from-violet-50 to-purple-50',
			iconBg: 'bg-violet-100',
			iconColor: 'text-violet-600'
		},
		{ 
			bg: 'from-blue-500 to-cyan-500',
			lightBg: 'from-blue-50 to-cyan-50',
			iconBg: 'bg-blue-100',
			iconColor: 'text-blue-600'
		},
		{ 
			bg: 'from-green-500 to-emerald-500',
			lightBg: 'from-green-50 to-emerald-50',
			iconBg: 'bg-green-100',
			iconColor: 'text-green-600'
		},
		{ 
			bg: 'from-yellow-500 to-amber-500',
			lightBg: 'from-yellow-50 to-amber-50',
			iconBg: 'bg-yellow-100',
			iconColor: 'text-yellow-600'
		},
		{ 
			bg: 'from-orange-500 to-red-500',
			lightBg: 'from-orange-50 to-red-50',
			iconBg: 'bg-orange-100',
			iconColor: 'text-orange-600'
		},
		{ 
			bg: 'from-pink-500 to-rose-500',
			lightBg: 'from-pink-50 to-rose-50',
			iconBg: 'bg-pink-100',
			iconColor: 'text-pink-600'
		},
	];

	const cards = [
		{ 
			label: 'Total Users', 
			value: overview?.userCount?.total || overview?.userCount || 0, 
			icon: '👥',
			subtext: 'Active accounts'
		},
		{ 
			label: 'Total Orders', 
			value: overview?.orderCount || 0, 
			icon: '📦',
			subtext: 'All time orders'
		},
		{ 
			label: 'Active Deliveries', 
			value: overview?.deliveryCount || 0, 
			icon: '🚚',
			subtext: 'Ongoing deliveries'
		},
		{ 
			label: 'Active Subscriptions', 
			value: overview?.subscriptionCount || 0, 
			icon: '⭐',
			subtext: 'Recurring customers'
		},
		{ 
			label: 'Total Meals', 
			value: overview?.mealCount || 0, 
			icon: '🍽️',
			subtext: 'Menu items available'
		},
		{ 
			label: 'Total Revenue', 
			value: `৳${overview?.revenue?.toLocaleString() || '0'}`, 
			icon: '💰',
			subtext: 'Lifetime earnings'
		},
	];

	if (loading) {
		return (
			<div className="min-h-[400px] flex items-center justify-center">
				<div className="text-center">
					<div className="relative">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-600 mx-auto mb-4"></div>
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="h-8 w-8 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full animate-pulse"></div>
						</div>
					</div>
					<p className="text-gray-600 font-medium mt-4">Loading dashboard data...</p>
					<p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<motion.div 
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"
			>
				<div className="text-5xl mb-4">⚠️</div>
				<h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
				<p className="text-red-600 text-sm mb-4">{error}</p>
				<button 
					onClick={loadOverview}
					className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
				>
					Try Again
				</button>
			</motion.div>
		);
	}

	return (
		<motion.div 
			className="space-y-6"
			variants={containerVariants}
			initial="hidden"
			animate="visible"
		>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
					<p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening with your platform today.</p>
				</div>
				<div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg">
					<span className="text-sm text-gray-600">Last updated:</span>
					<span className="text-sm font-semibold text-gray-900">
						{new Date().toLocaleDateString('en-US', { 
							month: 'short', 
							day: 'numeric', 
							hour: '2-digit', 
							minute: '2-digit' 
						})}
					</span>
				</div>
			</div>

			{/* Stats Cards Grid */}
			<div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
				{cards.map((card, index) => (
					<motion.div
						key={card.label}
						variants={cardVariants}
						whileHover={{ 
							y: -4,
							transition: { type: "spring", stiffness: 300 }
						}}
						className="group relative rounded-2xl bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
					>
						{/* Gradient overlay on hover */}
						<div className={`absolute inset-0 bg-gradient-to-br ${cardStyles[index].bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
						
						{/* Decorative circle */}
						<div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full ${cardStyles[index].lightBg} opacity-50 group-hover:scale-150 transition-transform duration-500`} />
						
						<div className="relative">
							<div className="flex items-start justify-between">
								<div>
									<div className="flex items-center gap-2 mb-2">
										<div className={`w-10 h-10 rounded-xl ${cardStyles[index].iconBg} flex items-center justify-center text-xl ${cardStyles[index].iconColor} group-hover:scale-110 transition-transform duration-300`}>
											{card.icon}
										</div>
										<span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
											{card.label}
										</span>
									</div>
									
									<div className="mt-2">
										<div className="text-3xl font-bold text-gray-900">
											{card.value}
										</div>
										<p className="text-xs text-gray-500 mt-1">
											{card.subtext}
										</p>
									</div>
								</div>
								
								{/* Mini trend indicator */}
								<div className="flex items-center gap-1">
									<span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
										+{Math.floor(Math.random() * 20 + 5)}%
									</span>
								</div>
							</div>
							
							{/* Progress bar */}
							<div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
								<motion.div 
									initial={{ width: 0 }}
									animate={{ width: `${Math.random() * 40 + 60}%` }}
									transition={{ delay: 0.5, duration: 1 }}
									className={`h-full rounded-full bg-gradient-to-r ${cardStyles[index].bg}`}
								/>
							</div>
						</div>
					</motion.div>
				))}
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<motion.div 
					variants={cardVariants}
					whileHover={{ scale: 1.02 }}
					className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
				>
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
							📊
						</div>
						<div>
							<h3 className="font-semibold text-gray-900">View Reports</h3>
							<p className="text-xs text-gray-500">Download detailed analytics</p>
						</div>
					</div>
				</motion.div>

				<motion.div 
					variants={cardVariants}
					whileHover={{ scale: 1.02 }}
					className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
				>
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
							⚙️
						</div>
						<div>
							<h3 className="font-semibold text-gray-900">System Settings</h3>
							<p className="text-xs text-gray-500">Configure platform</p>
						</div>
					</div>
				</motion.div>

				<motion.div 
					variants={cardVariants}
					whileHover={{ scale: 1.02 }}
					className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
				>
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
							📧
						</div>
						<div>
							<h3 className="font-semibold text-gray-900">Send Notification</h3>
							<p className="text-xs text-gray-500">Message all users</p>
						</div>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}