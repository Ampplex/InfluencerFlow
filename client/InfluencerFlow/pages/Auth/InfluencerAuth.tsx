import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../../utils/supabase';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../redux/store';
import { setUserType } from '../../redux/userType/userTypeSlice';

const InfluencerFlowAuth: React.FC = () => {
  console.log('InfluencerAuth component is rendering.');
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user_type, mode } = (location.state || {}) as { user_type?: string, mode?: 'signup' | 'signin' };
  const [isSignUp, setIsSignUp] = useState<boolean>(mode === 'signup');
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async () => {
    console.log("=== Starting handleLogin in InfluencerAuth ===");
    console.log("Current location:", window.location.href);
    
    // Clear any previous auth state from Supabase
    await supabase.auth.signOut();
    console.log("Cleared previous auth state");
    
    dispatch(setUserType("influencer"));
    console.log("Dispatched user type to Redux:", "influencer");
    
    // Store user type in multiple persistent locations
    sessionStorage.setItem('user_type', 'influencer');
    localStorage.setItem('user_type', 'influencer');
    console.log("Stored user_type in sessionStorage and localStorage");
    
    // Include a timestamp to debug the flow
    const timestamp = new Date().getTime();
    
    // Use document.location.origin to ensure we get the correct origin
    const redirectUrl = new URL(document.location.origin + '/dashboard');
    redirectUrl.searchParams.append('user_type', 'influencer');
    redirectUrl.searchParams.append('auth_ts', timestamp.toString());
    
    console.log("Redirect URL after OAuth:", redirectUrl.toString());
    
    // Set cookie as another fallback method
    document.cookie = `user_type=influencer; path=/; max-age=3600`;
    document.cookie = `auth_ts=${timestamp}; path=/; max-age=3600`;
    console.log("Set cookies for user_type and auth_ts");
    
    try {
      console.log("Starting OAuth with Google...");
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Force account selection to avoid automatic login with cached credentials
          }
        }
      });
      
    if (error) {
        console.error("OAuth initiation error:", error);
    } else {
        console.log("OAuth initiation successful, data:", data);
      }
    } catch (err) {
      console.error("Exception during OAuth:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        setMessage('Error signing out. Please try again.');
      } else {
        setMessage('You have been signed out successfully.');
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      setMessage('Unexpected error occurred. Please try again.');
    }
  };

  const checkAuthStatus = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      console.log('No active session found.');
      setMessage(isSignUp ? 'Ready to join thousands of marketers?' : 'Please sign in to access your dashboard.');
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }

    setUserData(data.session.user.user_metadata);
    setMessage('Welcome back to InfluencerFlow!');
    setIsLoggedIn(true);
    setIsLoading(false);
    
  };

  useEffect(() => {
    checkAuthStatus();

    // Listen for auth state changes (for OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session) {
        console.log('Session data (onAuthStateChange):', session);
        setUserData(session.user.user_metadata);
        setMessage('Welcome to InfluencerFlow!');
        setIsLoggedIn(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Update message when sign up mode changes
  useEffect(() => {
    if (!isLoggedIn) {
      setMessage(isSignUp ? 'Ready to join thousands of marketers?' : 'Please sign in to access your dashboard.');
    }
  }, [isSignUp, isLoggedIn]);
  
  // Handle redirect after login
  useEffect(() => {
    if (isLoggedIn && userData) {
      console.log("User is logged in, preparing to redirect...");
      
      // Check if the profile needs setup
      const checkProfileNeeded = async () => {
        try {
          const { data } = await supabase.auth.getSession();
          const userId = data.session?.user?.id;
          
          if (userId) {
            console.log("Checking if profile setup is needed for user:", userId);
            
            // Create headers for direct API call
            const headers = {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'prefer': 'return=representation',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODM5NDgsImV4cCI6MjA0MTI1OTk0OH0.cs_yQnvzrK-8CRYyvlbzfbhZhIqdC3X9fO-UugRCGuI',
              'Authorization': `Bearer ${data.session?.access_token}`
            };
            
            try {
              // Make direct fetch call to avoid 406 errors
              const response = await fetch(
                `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers?id=eq.${userId}&select=bio,platforms`,
                { headers }
              );
              
              if (response.ok) {
                const profileData = await response.json();
                console.log("Profile data:", profileData);
                
                const needsSetup = !profileData.length || (!profileData[0]?.bio && !profileData[0]?.platforms);
                console.log("Needs profile setup:", needsSetup);
                
                // After 1.5 seconds for better user experience
                setTimeout(() => {
                  if (needsSetup) {
                    console.log("Redirecting to profile setup");
                    navigate('/influencer-profile-setup');
                  } else {
                    console.log("Redirecting to dashboard");
                    navigate('/dashboard');
                  }
                }, 1500);
              } else {
                console.error("Error fetching profile:", response.statusText);
                // Default to dashboard
                setTimeout(() => navigate('/dashboard'), 1500);
              }
            } catch (error) {
              console.error("Error checking profile:", error);
              setTimeout(() => navigate('/dashboard'), 1500);
            }
          } else {
            // No user ID available, go to dashboard
            setTimeout(() => navigate('/dashboard'), 1500);
          }
        } catch (error) {
          console.error("Session error:", error);
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      };
      
      checkProfileNeeded();
    }
  }, [isLoggedIn, userData, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 flex items-center justify-center p-6">
      {/* Round Back Button - Only show when NOT logged in */}
      {!isLoggedIn && (
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
      )}

      {/* Main Container */}
      <motion.div 
        className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left Side - Auth Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">InfluencerFlow - Influencer</span>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                {isLoggedIn 
                  ? `Welcome back, ${userData?.full_name?.split(' ')[0]}!` 
                  : isSignUp 
                    ? 'Join InfluencerFlow!' 
                    : 'Welcome Back!'
                }
              </h1>
              <p className="text-gray-600">
                {isLoggedIn 
                  ? 'Redirecting to your dashboard...' 
                  : isSignUp 
                    ? 'Create your account to start scaling your influence campaigns.'
                    : 'Please sign in to access your dashboard.'
                }
              </p>
            </div>

            {/* User Profile Section */}
            <AnimatePresence>
              {isLoggedIn && userData && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="mb-8"
                >
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-4">
                      <img 
                        src={userData.avatar_url} 
                        alt={userData.full_name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                      <div>
                        <h3 className="text-gray-900 font-bold text-lg">{userData.full_name}</h3>
                        <p className="text-gray-600">{userData.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600 font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status Message */}
            <div className="mb-8">
              <div className={`p-4 rounded-xl border ${
                isLoggedIn 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    isLoggedIn ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {isLoading ? 'Checking authentication...' : message}
                  </span>
                </div>
              </div>
            </div>

            {/* Auth Actions */}
            <div className="space-y-4 mb-8">
              {!isLoggedIn ? (
                <>
                  {/* Google Sign In/Up Button */}
                  <motion.button
                    onClick={() => {
                      handleLogin();
                    }}
                    disabled={isLoading}
                    className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-300 hover:border-gray-400 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isSignUp ? 'Sign up with Google' : 'Continue with Google'}
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={handleSignOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </motion.button>
              )}
            </div>

            {/* Toggle Sign In / Sign Up */}
            {!isLoggedIn && (
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
            )}
          </div>

          {/* Right Side - Image Placeholder */}
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden flex items-center justify-center p-8">
            {/* Geometric Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-32 h-32 border border-purple-500/30 rotate-45 rounded-xl"></div>
              <div className="absolute bottom-20 right-20 w-24 h-24 border border-blue-500/30 rotate-12 rounded-lg"></div>
              <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-purple-500/50 rounded-full"></div>
              <div className="absolute inset-0 bg-black/40"></div> {/* Dark overlay */}
              <img src="/auth.svg" alt="Illustration" className="w-full h-full object-cover rounded-3xl filter blur-sm opacity-75" /> {/* Added opacity-75 */}
            </div>

            {/* Content */}
            <div className="relative z-10 text-center text-white max-w-md">
              {/* Placeholder for illustration */}
                <div className="mb-8">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl border border-white/20 flex items-center justify-center backdrop-blur-sm">
                  <img src="/auth.svg" alt="Illustration" className="w-full h-full object-cover rounded-3xl" />
                </div>
              </div>

              <h2 className="text-3xl font-bold mb-4">
                {isSignUp ? 'Start Your Influence Journey' : 'Scale Your Influence Anywhere'}
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                {isSignUp 
                  ? 'Join thousands of marketers already using our AI-powered platform to connect with top influencers and scale their brands.'
                  : 'Manage your influencer campaigns on the go with our powerful AI platform built for modern marketers.'
                }
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InfluencerFlowAuth;