import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';
import Navbar from '../components/Navbar';
import BrandDashboard from '../pages/BrandDashboard';
import CreateCampaign from '../pages/CreateCampaign';
import MatchedInfluencers from '../pages/MatchedInfluencers';
import NegotiationChat from '../pages/NegotiationChat';
import ContractForm from '../pages/ContractForm';
import ContractsPage from '../pages/ContractsPage';
import ContractSigningPage from '../pages/ContractSigningPage';
import InfluencerDashboard from '../pages/InfluencerDashboard';
import CampaignDetails from '../pages/CampaignDetails';
import UserLogin from '../pages/Auth/UserAuth';
import InfluencerProfileSetup from '../pages/InfluencerProfileSetup';
import BrandProfileSetup from '../pages/BrandProfileSetup';
// import { NotFound } from '../pages/NotFound'; // Create this component
import supabase from '../utils/supabase';
import { Provider } from 'react-redux';
import { store, persistor } from "../redux/store";
import { PersistGate } from 'redux-persist/integration/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setUserType } from '../redux/userType/userTypeSlice';
import ResetPassword from '../pages/Auth/ResetPassword';

// Types
type UserType = 'brand' | 'influencer' | null;

// Loading Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 mr-3">
            <img 
              src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
              alt="InfluencerFlow Logo" 
              className="w-full h-full object-contain animate-pulse" 
            />
          </div>
          <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
            InfluencerFlow
          </span>
        </div>
        <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
          Loading your dashboard...
        </p>
      </div>
    </div>
  );
}

// Route Protection Component
function ProtectedRoute({ 
  children, 
  isLoggedIn, 
  isLoading, 
  allowedUserTypes, 
  currentUserType 
}: { 
  children: React.ReactNode;
  isLoggedIn: boolean;
  isLoading: boolean;
  allowedUserTypes?: UserType[];
  currentUserType: UserType;
}) {
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  // // Check user type authorization
  // if (allowedUserTypes && allowedUserTypes.length > 0) {
  //   if (!currentUserType || !allowedUserTypes.includes(currentUserType)) {
  //     return <NotFound />;
  //   }
  // }

  return <>{children}</>;
}

// Smart Dashboard Redirect
function DashboardRedirect({ userType }: { userType: UserType }) {
  if (userType === 'brand') {
    return <Navigate to="/dashboard" replace />;
  } else if (userType === 'influencer') {
    return <Navigate to="/creator/dashboard" replace />;
  } else {
    return <Navigate to="/auth" replace />;
  }
}

// Profile Setup Guard
function ProfileSetupGuard({ 
  children, 
  userType, 
  needsProfileSetup,
  needsBrandProfileSetup 
}: { 
  children: React.ReactNode;
  userType: UserType;
  needsProfileSetup: boolean;
  needsBrandProfileSetup: boolean;
}) {
  const location = useLocation();
  
  // Skip profile setup check for profile setup pages themselves
  if (location.pathname === '/influencer-profile-setup' || 
      location.pathname === '/brand-profile-setup') {
    return <>{children}</>;
  }

  // Redirect to appropriate profile setup if needed
  if (userType === 'influencer' && needsProfileSetup) {
    return <Navigate to="/influencer-profile-setup" replace />;
  }
  
  if (userType === 'brand' && needsBrandProfileSetup) {
    return <Navigate to="/brand-profile-setup" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const dispatch = useDispatch();
  const userTypeRedux = useSelector((state: RootState) => state.userType.type);
  
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [needsBrandProfileSetup, setNeedsBrandProfileSetup] = useState(false);

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  };

  // Check if current path is reset password
  const isResetPasswordPath = () => {
    return location.pathname === '/auth/reset-password';
  };

  // Check profile setup status with improved error handling
  const checkProfileSetupStatus = async (session: any, userType: UserType) => {
    console.log('Checking profile setup status for:', userType);
    
    const { user } = session;
    
    // Check if Supabase environment variables are available
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
      
      // Don't fail the app, just set conservative defaults
      if (userType === 'influencer') {
        setNeedsProfileSetup(true);
      } else if (userType === 'brand') {
        setNeedsBrandProfileSetup(true);
      }
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${session.access_token}`
    };

    try {
      if (userType === 'influencer') {
        console.log('Checking influencer profile for user:', user.id);
        
        // Check influencer profile completeness
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/influencers?id=eq.${user.id}&select=bio,platforms`,
          { 
            method: 'GET',
            headers,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Failed to fetch influencer profile:', response.status, response.statusText);
          // Don't fail the app, just assume profile setup is needed
          setNeedsProfileSetup(true);
          return;
        }
        
        const data = await response.json();
        console.log('Influencer profile data:', data);
        
        const profile = data[0];
        
        // Check if profile setup was just completed
        const profileSetupCompleted = sessionStorage.getItem('profileSetupCompleted') === 'true';
        
        if (profileSetupCompleted || (profile?.bio && profile?.platforms)) {
          console.log('Influencer profile is complete');
          setNeedsProfileSetup(false);
          sessionStorage.removeItem('profileSetupCompleted');
        } else {
          console.log('Influencer profile needs setup');
          setNeedsProfileSetup(true);
        }
        
      } else if (userType === 'brand') {
        console.log('Checking brand profile for user:', user.id);
        
        // Check brand profile completeness
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/brands?id=eq.${user.id}&select=brand_name,brand_description,location`,
          { 
            method: 'GET',
            headers,
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error('Failed to fetch brand profile:', response.status, response.statusText);
          // Don't fail the app, just assume profile setup is needed
          setNeedsBrandProfileSetup(true);
          return;
        }
        
        const data = await response.json();
        console.log('Brand profile data:', data);
        
        const profile = data[0];
        
        // Check if profile setup was just completed
        const brandProfileSetupCompleted = sessionStorage.getItem('brandProfileSetupCompleted') === 'true';
        
        if (brandProfileSetupCompleted || (profile?.brand_name && profile?.brand_description && profile?.location)) {
          console.log('Brand profile is complete');
          setNeedsBrandProfileSetup(false);
          sessionStorage.removeItem('brandProfileSetupCompleted');
        } else {
          console.log('Brand profile needs setup');
          setNeedsBrandProfileSetup(true);
        }
      }
    } catch (error: unknown) {
      console.error('Error checking profile setup status:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Profile check timed out');
        } else if (error.message?.includes('fetch')) {
          console.error('Network error during profile check');
        }
      }
      
      // Don't fail the app - set conservative defaults
      if (userType === 'influencer') {
        setNeedsProfileSetup(true);
      } else if (userType === 'brand') {
        setNeedsBrandProfileSetup(true);
      }
    }
  };

  // Enhanced initial authentication check
  useEffect(() => {
    const performInitialAuthCheck = async () => {
      console.log('Starting initial auth check...');
      
      // Skip auth check if we're on the reset password page
      if (isResetPasswordPath()) {
        console.log('On reset password page, skipping auth check');
        setIsLoading(false);
        return;
      }
      
      try {
        // Check if Supabase is properly configured first
        if (!supabase) {
          console.error('Supabase client is not initialized');
          setIsLoading(false);
          return;
        }
        
        console.log('Getting session from Supabase...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setIsLoggedIn(false);
          setIsLoading(false);
          return;
        }
        
        const hasSession = !!session;
        console.log('Session found:', hasSession);
        setIsLoggedIn(hasSession);
        
        if (session) {
          console.log('Session found, checking user type and profile status...');
          console.log('User metadata:', session.user.user_metadata);
          
          // Determine user type from various sources
          const urlParams = new URLSearchParams(window.location.search);
          const userTypeFromUrl = urlParams.get('user_type') as UserType;
          const userTypeFromMetadata = session.user.user_metadata?.userType as UserType;
          const userTypeFromCookie = getCookie('user_type') as UserType;
          
          console.log('User type sources:', {
            fromUrl: userTypeFromUrl,
            fromMetadata: userTypeFromMetadata,
            fromCookie: userTypeFromCookie,
            fromRedux: userTypeRedux
          });
          
          const userType = userTypeFromUrl || userTypeFromMetadata || userTypeFromCookie || userTypeRedux;
          
          if (userType) {
            console.log('Setting user type to:', userType);
            dispatch(setUserType(userType));
            
            // Check profile setup status (with error handling)
            await checkProfileSetupStatus(session, userType);
          } else {
            console.warn('No user type found, user may need to complete setup');
          }
        }
      } catch (error) {
        console.error('Critical error during initial auth check:', error);
        
        // Don't leave the app in loading state
        setIsLoggedIn(false);
      } finally {
        console.log('Initial auth check completed');
        setIsLoading(false);
      }
    };

    performInitialAuthCheck();
  }, [dispatch, userTypeRedux, location.pathname]);

  // Listen to auth state changes with improved error handling
  useEffect(() => {
    // Skip auth listener setup if we're on reset password page
    if (isResetPasswordPath()) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setIsLoggedIn(!!session);
      
      if (session && event === 'SIGNED_IN') {
        try {
          // Handle user type detection on sign in
          const userTypeFromMetadata = session.user.user_metadata?.userType as UserType;
          if (userTypeFromMetadata) {
            dispatch(setUserType(userTypeFromMetadata));
            await checkProfileSetupStatus(session, userTypeFromMetadata);
          }
        } catch (error) {
          console.error('Error handling sign in:', error);
        }
      } else if (!session) {
        // Clear user type on sign out
        dispatch(setUserType(null));
        setNeedsProfileSetup(false);
        setNeedsBrandProfileSetup(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, location.pathname]);

  // Show/hide navbar logic
  const shouldShowNavbar = () => {
    const authPaths = ['/auth', '/auth/brand', '/auth/influencer', '/auth/reset-password'];
    const setupPaths = ['/influencer-profile-setup', '/brand-profile-setup'];
    
    return isLoggedIn && 
           !authPaths.includes(location.pathname) && 
           !setupPaths.includes(location.pathname);
  };

  if (isLoading && !isResetPasswordPath()) {
    return <LoadingScreen />;
  }

  return (
    <>
      {shouldShowNavbar() && <Navbar />}
      
      <Routes>
        {/* PUBLIC ROUTES - These should come FIRST and don't require authentication */}
        
        {/* Reset Password - Must be accessible without authentication */}
        <Route 
          path="/auth/reset-password" 
          element={<ResetPassword />} 
        />
        
        {/* Auth Route */}
        <Route 
          path="/auth" 
          element={isLoggedIn ? <DashboardRedirect userType={userTypeRedux} /> : <UserLogin />} 
        />
        
        {/* PROFILE SETUP ROUTES - Require basic authentication but special handling */}
        <Route 
          path="/influencer-profile-setup" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['influencer']}
              currentUserType={userTypeRedux}
            >
              <InfluencerProfileSetup />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/brand-profile-setup" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['brand']}
              currentUserType={userTypeRedux}
            >
              <BrandProfileSetup />
            </ProtectedRoute>
          } 
        />

        {/* BRAND PROTECTED ROUTES - Only accessible by brands with complete profiles */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['brand']}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <BrandDashboard />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/create-campaign" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['brand']}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <CreateCampaign />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/matched-influencers/:campaignId" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['brand']}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <MatchedInfluencers />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />

        {/* CREATOR PROTECTED ROUTES - Only accessible by influencers with complete profiles */}
        <Route 
          path="/creator/dashboard" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['influencer']}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <InfluencerDashboard />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/creator/campaigns" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['influencer']}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <CampaignDetails />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/creator/campaign/:campaignId" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              allowedUserTypes={['influencer']}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <CampaignDetails />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />

        {/* SHARED PROTECTED ROUTES - Accessible by both user types with complete profiles */}
        <Route 
          path="/negotiation-chat/:campaign_id/:email" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <NegotiationChat />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/contract/:campaignId/:influencerId" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <ContractForm />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/contracts" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <ContractsPage />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/contract-signing/:contractId" 
          element={
            <ProtectedRoute 
              isLoggedIn={isLoggedIn} 
              isLoading={isLoading}
              currentUserType={userTypeRedux}
            >
              <ProfileSetupGuard 
                userType={userTypeRedux}
                needsProfileSetup={needsProfileSetup}
                needsBrandProfileSetup={needsBrandProfileSetup}
              >
                <ContractSigningPage />
              </ProfileSetupGuard>
            </ProtectedRoute>
          } 
        />

        {/* ROOT AND FALLBACK ROUTES */}
        
        {/* Root redirect */}
        <Route 
          path="/" 
          element={isLoggedIn ? <DashboardRedirect userType={userTypeRedux} /> : <Navigate to="/auth" replace />} 
        />

        {/* Legacy redirects for backward compatibility */}
        <Route path="/auth/brand" element={<Navigate to="/auth?tab=brand" replace />} />
        <Route path="/auth/influencer" element={<Navigate to="/auth?tab=influencer" replace />} />
        
        {/* 404 - Must be last */}
        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <Router>
          <AppContent />
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;