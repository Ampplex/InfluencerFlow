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
import { NotFound } from '../pages/NotFound'; // Create this component
import supabase from '../utils/supabase';
import { Provider } from 'react-redux';
import { store, persistor } from "../redux/store";
import { PersistGate } from 'redux-persist/integration/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setUserType } from '../redux/userType/userTypeSlice';

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

  // Check user type authorization
  if (allowedUserTypes && allowedUserTypes.length > 0) {
    if (!currentUserType || !allowedUserTypes.includes(currentUserType)) {
      return <NotFound />;
    }
  }

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

  // Initial authentication check
  useEffect(() => {
    const performInitialAuthCheck = async () => {
      console.log('Starting initial auth check...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        
        if (session) {
          console.log('Session found, checking user type and profile status...');
          
          // Determine user type from various sources
          const urlParams = new URLSearchParams(window.location.search);
          const userTypeFromUrl = urlParams.get('user_type') as UserType;
          const userTypeFromMetadata = session.user.user_metadata?.userType as UserType;
          const userTypeFromCookie = getCookie('user_type') as UserType;
          
          const userType = userTypeFromUrl || userTypeFromMetadata || userTypeFromCookie || userTypeRedux;
          
          if (userType) {
            dispatch(setUserType(userType));
            
            // Check profile setup status
            await checkProfileSetupStatus(session, userType);
          }
        }
      } catch (error) {
        console.error('Error during initial auth check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performInitialAuthCheck();
  }, []);

  // Check profile setup status
  const checkProfileSetupStatus = async (session: any, userType: UserType) => {
    const { user } = session;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`
    };

    try {
      if (userType === 'influencer') {
        // Check influencer profile completeness
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/influencers?id=eq.${user.id}&select=bio,platforms`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          const profile = data[0];
          
          // Check if profile setup was just completed
          const profileSetupCompleted = sessionStorage.getItem('profileSetupCompleted') === 'true';
          
          if (profileSetupCompleted || (profile?.bio && profile?.platforms)) {
            setNeedsProfileSetup(false);
            sessionStorage.removeItem('profileSetupCompleted');
          } else {
            setNeedsProfileSetup(true);
          }
        }
      } else if (userType === 'brand') {
        // Check brand profile completeness
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/brands?id=eq.${user.id}&select=brand_name,brand_description,location`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          const profile = data[0];
          
          // Check if profile setup was just completed
          const brandProfileSetupCompleted = sessionStorage.getItem('brandProfileSetupCompleted') === 'true';
          
          if (brandProfileSetupCompleted || (profile?.brand_name && profile?.brand_description && profile?.location)) {
            setNeedsBrandProfileSetup(false);
            sessionStorage.removeItem('brandProfileSetupCompleted');
          } else {
            setNeedsBrandProfileSetup(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking profile setup status:', error);
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setIsLoggedIn(!!session);
      
      if (session && event === 'SIGNED_IN') {
        // Handle user type detection on sign in
        const userTypeFromMetadata = session.user.user_metadata?.userType as UserType;
        if (userTypeFromMetadata) {
          dispatch(setUserType(userTypeFromMetadata));
          await checkProfileSetupStatus(session, userTypeFromMetadata);
        }
      } else if (!session) {
        // Clear user type on sign out
        dispatch(setUserType(null));
        setNeedsProfileSetup(false);
        setNeedsBrandProfileSetup(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  // Show/hide navbar logic
  const shouldShowNavbar = () => {
    const authPaths = ['/auth', '/auth/brand', '/auth/influencer'];
    const setupPaths = ['/influencer-profile-setup', '/brand-profile-setup'];
    
    return isLoggedIn && 
           !authPaths.includes(location.pathname) && 
           !setupPaths.includes(location.pathname);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {shouldShowNavbar() && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/auth" 
          element={isLoggedIn ? <DashboardRedirect userType={userTypeRedux} /> : <UserLogin />} 
        />
        
        {/* Profile Setup Routes */}
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

        {/* Brand Routes - Only accessible by brands */}
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

        {/* Creator Routes - Only accessible by influencers */}
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

        {/* Shared Protected Routes - Accessible by both user types */}
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