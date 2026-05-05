import { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { 
  FaLeaf, 
  FaClock, 
  FaMobile, 
  FaRecycle,
  FaTruck,
  FaUtensils,
  FaHeart,
  FaArrowRight
} from 'react-icons/fa';

export default function About() {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 30 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const stats = [
    { number: "10K+", label: "Happy Customers", icon: <FaHeart /> },
    { number: "50+", label: "Partner Restaurants", icon: <FaUtensils /> },
    { number: "15K+", label: "Meals Delivered", icon: <FaTruck /> }
  ];

  const values = [
    {
      title: 'Ingredient integrity',
      copy: 'Sourced from trusted restaurants and carefully selected meals to provide nutrition and taste.',
      icon: <FaLeaf className="text-green-500" />,
      color: "from-yellow-500/20 to-yellow-600/20"
    },
    {
      title: 'Timing that works',
      copy: 'You set delivery times, pause and cancel with two taps.',
      icon: <FaClock className="text-blue-500" />,
      color: "from-blue-500/20 to-blue-600/20"
    },
    {
      title: 'Minimalist experience',
      copy: 'No clutter, no gimmicks—every screen prioritizes clarity and action.',
      icon: <FaMobile className="text-purple-500" />,
      color: "from-purple-500/20 to-purple-600/20"
    },
    {
      title: 'Sustainability-first',
      copy: 'Recyclable, insulated packaging engineered to cut waste.',
      icon: <FaRecycle className="text-greem-500" />,
      color: "from-green-500/20 to-green-600/20"
    }
  ];

  return (
    <section 
      className="min-h-screen bg-cover bg-center bg-fixed px-4 pb-24 pt-28 relative overflow-hidden"
      style={{ backgroundImage: `url(/background.png)` }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-200 opacity-20 blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-200 opacity-20 blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-200 opacity-10 blur-3xl"
        />
      </div>

      <div className="mx-auto max-w-5xl relative z-10" ref={ref}>
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-16 space-y-4 text-center"
        >
          <motion.div 
            variants={scaleIn}
            className="bg-white/95 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-200/50 inline-block relative overflow-hidden group"
          >
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative z-10"
            >
              <motion.p 
                whileHover={{ scale: 1.05 }}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 inline-block"
              >
                <span className="relative">
                  Why Us?
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-violet-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
                </span>
              </motion.p>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl mt-4"
              >
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  We make premium food
                </span>
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  subscriptions feel effortless.
                </span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-gray-600 md:text-xl mt-6 max-w-2xl mx-auto"
              >
                No more daily decisions. No more allergy anxiety. Just great food, at home, automatically
              </motion.p>

              {/* Decorative elements */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-8 -right-8 w-16 h-16 opacity-10"
              >
                <FaUtensils className="w-full h-full text-violet-600" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Stats Section - Updated to 3 columns */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              whileHover={{ y: -5, scale: 1.05 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-gray-200/50 group"
            >
              <div className="text-2xl mb-2 text-violet-600 group-hover:scale-110 transition-transform duration-300">
                {stat.icon}
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-800">
                {stat.number}
              </div>
              <div className="text-xs text-gray-600">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission & Vision Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate={controls}
          className="grid gap-8 md:grid-cols-2 mb-12"
        >
          <motion.div 
            variants={fadeInLeft}
            whileHover={{ y: -5 }}
            className="rounded-2xl border border-gray-200/50 bg-white/95 backdrop-blur-lg p-8 shadow-2xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white text-xl">
                  🎯
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Our mission
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Great food should be predictable, never boring. We
                curate rotating menus, source responsibly, and
                deliver with precision so your weeknight dinners and
                weekend gatherings are handled with the same care a
                chef would give.
              </p>
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: "20%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full mt-6"
              />
            </div>
          </motion.div>

          <motion.div 
            variants={fadeInRight}
            whileHover={{ y: -5 }}
            className="rounded-2xl border border-gray-200/50 bg-white/95 backdrop-blur-lg p-8 shadow-2xl group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl">
                  ⚡
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  What we do
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We partner with vetted kitchens to craft
                nutritionally balanced menus, then pair them with
                flexible delivery slots, live tracking, and seamless
                pausing. Every touchpoint is intentional, from
                packaging to plating.
              </p>
              <motion.ul className="mt-6 space-y-3 text-sm text-gray-700">
                {[
                  "Curated, chef-driven recipes",
                  "Precision delivery windows with proactive updates",
                  "Balanced macros",
                  "Support that responds in minutes, not hours"
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 group/item"
                  >
                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 group-hover/item:scale-150 transition-transform duration-300" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        </motion.div>

        {/* Values Section */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate={controls}
          className="rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-50/95 to-purple-50/95 backdrop-blur-lg p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <motion.div 
              variants={fadeInUp}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg">
                <FaHeart />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Why Khudalagse
                </h2>
                <p className="text-sm text-gray-600">
                  The values that drive us every day
                </p>
              </div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
              {values.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={scaleIn}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-xl bg-white/95 backdrop-blur-sm p-6 shadow-lg border border-gray-200/50 group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider">
                        {item.title}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.copy}
                    </p>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute bottom-2 right-2"
                    >
                      <FaArrowRight className="text-violet-400 text-xs" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Mini */}
            <motion.div 
              variants={fadeInUp}
              className="mt-8 text-center"
            >
              
            </motion.div>
          </div>
        </motion.div>

        
      </div>
    </section>
  );
}