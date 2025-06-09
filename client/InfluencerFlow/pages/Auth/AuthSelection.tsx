import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface AuthSelectionProps {}

const AuthSelection: React.FC<AuthSelectionProps> = () => {
  // Track selected user type: 'brand' | 'influencer' | null
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  // Toggle between sign up and sign in modes
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  const navigate = useNavigate();

  // Handle Google OAuth authentication with user type selection
  const handleGoogleAuth = (userType: string) => {
    const authPath = userType === 'brand' ? '/auth/brand' : '/auth/influencer';
    navigate(authPath, { state: { user_type: userType, mode: isSignUp ? 'signup' : 'signin' } });
  };

  // Define structure for user type options
  interface UserType {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactElement;
    gradient: string;
    hoverGradient: string;
    stats: string;
  }

  // Available user types: Brand (companies/marketers) and Influencer (content creators)
  // Available user types: Brand (companies/marketers) and Influencer (content creators)
  const userTypes: UserType[] = [
    {
      id: 'brand',
      title: 'Brand',
      subtitle: 'Scale your marketing',
      description: 'Find and collaborate with top influencers to grow your brand reach.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      gradient: 'from-purple-500 to-blue-600',
      hoverGradient: 'from-purple-600 to-blue-700',
      stats: '50K+ brands trust us'
    },
    {
      id: 'influencer',
      title: 'Influencer',
      subtitle: 'Monetize your influence',
      description: 'Connect with brands and turn your content into profitable partnerships.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      gradient: 'from-pink-500 to-orange-500',
      hoverGradient: 'from-pink-600 to-orange-600',
      stats: '200K+ influencers joined'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 flex items-center justify-center p-6">
      {/* Back Button */}
      <motion.button
        onClick={() => window.history.back()}
        className="absolute top-8 left-8 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 z-20 border border-gray-100"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {/* Main Container */}
      <motion.div 
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
          {/* Left Side - Selection */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">InfluencerFlow</span>
            </div>

            {/* Welcome Text */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {isSignUp ? 'Join InfluencerFlow!' : 'Welcome Back!'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isSignUp 
                  ? 'Choose your role to get started with the perfect experience for you.'
                  : 'Select your account type to access your dashboard.'
                }
              </p>
            </div>

            {/* User Type Selection */}
            <div className="space-y-4 mb-8">
              {userTypes.map((type) => (
                <motion.div
                  key={type.id}
                  className={`relative rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    selectedType === type.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${type.gradient} flex items-center justify-center text-white shadow-lg`}>
                        {type.icon}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{type.title}</h3>
                          <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                            selectedType === type.id 
                              ? 'border-gray-900 bg-gray-900' 
                              : 'border-gray-300'
                          }`}>
                            {selectedType === type.id && (
                              <motion.div
                                className="w-full h-full rounded-full bg-white scale-50"
                                initial={{ scale: 0 }}
                                animate={{ scale: 0.5 }}
                                transition={{ duration: 0.2 }}
                              />
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 font-medium mb-2">{type.subtitle}</p>
                        <p className="text-gray-500 text-sm mb-3">{type.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600 font-medium">{type.stats}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Continue Button */}
            <AnimatePresence>
              {selectedType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 mb-8"
                >
                  <motion.button
                    onClick={() => handleGoogleAuth(selectedType)}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isSignUp ? `Sign up as ${selectedType}` : `Continue as ${selectedType}`}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-semibold text-gray-900 hover:text-gray-700 hover:underline transition-colors"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden flex items-center justify-center p-8">
            {/* Geometric Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-32 h-32 border border-purple-500/30 rotate-45 rounded-xl"></div>
              <div className="absolute bottom-20 right-20 w-24 h-24 border border-blue-500/30 rotate-12 rounded-lg"></div>
              <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-purple-500/50 rounded-full"></div>
              <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-blue-500/40 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-md">
              {/* Animated Icons */}
              <div className="mb-8 relative">
                <motion.div 
                  className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl border border-white/20 flex items-center justify-center backdrop-blur-sm"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-6">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </motion.div>
                    
                    <motion.div
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                    
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center"
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              <h2 className="text-3xl font-bold mb-4">
                {isSignUp ? 'Choose Your Path' : 'Welcome Back'}
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                {isSignUp 
                  ? 'Whether you\'re a brand looking to scale or an influencer ready to monetize, we\'ve got the perfect platform for you.'
                  : 'Select your account type to access your personalized dashboard and continue your influencer marketing journey.'
                }
              </p>
              
              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-1">50K+</div>
                  <div className="text-white/80 text-sm">Active Brands</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-1">200K+</div>
                  <div className="text-white/80 text-sm">Influencers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthSelection;