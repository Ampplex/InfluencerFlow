import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../utils/supabase';

interface NavbarProps {
  hideOnAuth?: boolean;
}

function Navbar({ hideOnAuth = false }: NavbarProps) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Campaigns', href: '/create-campaign' },
    { name: 'Influencers', href: '/match_influencers' },
    { name: 'Analytics', href: '/analytics' }
  ];


  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        setUserData(session.user.user_metadata);
        
        // Navigate after successful sign in
        // navigate('/create-brand-profile', {
        //   state: {
        //     id: session.user.id,
        //     email: session.user.email,
        //     full_name: session.user.user_metadata.full_name || session.user.user_metadata.username,
        //   }
        // });
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserData(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuthStatus = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
        setUserData(data.session.user.user_metadata);
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsLoggedIn(false);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      // Method 1: Simple OAuth redirect (recommended)
      await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/create-brand-profile`
        }
      });
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  // Alternative method if you need to handle navigation differently
  const handleLoginAlternative = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google'
      });
      
      if (error) {
        console.error('OAuth error:', error);
        return;
      }

      // Don't try to get session immediately - let the auth state change handler do it
      // The navigation will happen in the onAuthStateChange callback above
      
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      } else {
        // Redirect to auth page after sign out
        navigate('/auth');
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    }
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    setIsMenuOpen(false); // Close mobile menu after navigation
  };

  const handleNewCampaign = () => {
    navigate('/create-campaign');
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userData?.full_name) {
      return userData.full_name.split(' ').map((name: string) => name[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  // Get first name for display
  const getFirstName = () => {
    if (userData?.full_name) {
      return userData.full_name.split(' ')[0];
    }
    return 'User';
  };

  // Check if current route is active
  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  // Hide navbar if hideOnAuth is true and user is not logged in
  if (hideOnAuth && !isLoggedIn) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={handleLogoClick}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">InfluencerFlow</span>
          </motion.div>

          {/* Desktop Navigation - Only show when logged in */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`font-medium transition-colors relative group ${
                    isActiveRoute(item.href) 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  whileHover={{ y: -1 }}
                >
                  {item.name}
                  <span 
                    className={`absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
                      isActiveRoute(item.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  ></span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    {/* Profile */}
                    <motion.button 
                      className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-2 transition-colors group"
                      whileHover={{ scale: 1.02 }}
                      onClick={() => navigate('/profile')} // Add profile route if you have one
                    >
                      <img 
                        src={userData?.avatar_url || `https://ui-avatars.com/api/?name=${getUserInitials()}&background=3b82f6&color=fff`}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {getFirstName()}
                      </span>
                    </motion.button>

                    {/* CTA Button */}
                    <motion.button 
                      onClick={handleNewCampaign}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      New Campaign
                    </motion.button>

                    {/* Sign Out */}
                    <motion.button
                      onClick={handleSignOut}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      title="Sign Out"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </motion.button>
                  </>
                ) : (
                  /* Login Button for non-authenticated users */
                  <motion.button
                    onClick={handleLogin}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign In
                  </motion.button>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200"
          >
            <div className="px-6 py-4 space-y-3">
              {/* Only show nav items when logged in */}
              {isLoggedIn && navItems.map((item, index) => (
                <motion.button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`block w-full text-left py-2 font-medium transition-colors ${
                    isActiveRoute(item.href) 
                      ? 'text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {item.name}
                </motion.button>
              ))}
              
              {!isLoading && (
                <>
                  {isLoggedIn ? (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3 py-2">
                          <img 
                            src={userData?.avatar_url || `https://ui-avatars.com/api/?name=${getUserInitials()}&background=3b82f6&color=fff`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                          <div>
                            <p className="font-semibold text-gray-800">{userData?.full_name || 'User'}</p>
                            <p className="text-sm text-gray-600">{userData?.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleNewCampaign}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                      >
                        New Campaign
                      </button>

                      <button
                        onClick={handleSignOut}
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Sign In with Google
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;