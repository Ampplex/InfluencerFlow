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
import ResetPassword from '../pages/Auth/ResetPassword';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-gray-600">Loading InfluencerFlow...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, isLoggedIn, isLoading }: { children: React.ReactNode, isLoggedIn: boolean, isLoading: boolean }) {
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

function AppContent() {
  const location = useLocation();
  const dispatch = useDispatch();
  const userTypeRedux = useSelector((state: RootState) => state.userType.type);
  
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [needsBrandProfileSetup, setNeedsBrandProfileSetup] = useState(false);
  const [authFlowCompleted, setAuthFlowCompleted] = useState(false);

  console.log('AppContent render - Current location:', window.location.href);
  console.log('User type from Redux (App.tsx - AppContent):', userTypeRedux);

  useEffect(() => {
    const performInitialAuthCheck = async () => {
      console.log('--- performInitialAuthCheck: START ---');
      
      // Check if profile setup was just completed
      const profileSetupCompleted = sessionStorage.getItem('profileSetupCompleted') === 'true';
      if (profileSetupCompleted) {
        console.log('LOG: Found "profileSetupCompleted" flag in sessionStorage.');
        setNeedsProfileSetup(false);
        console.log('LOG: setNeedsProfileSetup(false) due to sessionStorage flag.');
        sessionStorage.removeItem('profileSetupCompleted');
      }
      
      // Check if brand profile setup was just completed
      const brandProfileSetupCompleted = sessionStorage.getItem('brandProfileSetupCompleted') === 'true';
      if (brandProfileSetupCompleted) {
        setNeedsBrandProfileSetup(false);
        sessionStorage.removeItem('brandProfileSetupCompleted');
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        console.log('performInitialAuthCheck: Session status - ', !!session);

        // Handle influencer data insertion/update during initial load if logged in as influencer
        if (session && userTypeRedux === 'influencer') {
          console.log('performInitialAuthCheck: User is influencer, attempting data handling.');
          const { user } = session;
          const influencerId = user.id;
          const influencerEmail = user.email || user.user_metadata.email;
          const influencerUsername = user.user_metadata.full_name || user.email;
          const influencerFollowers = 0;

          console.log('Prepared influencer data (App.tsx - performInitialAuthCheck):', { influencerId, influencerEmail, influencerUsername, influencerFollowers });

          try {
            console.log("Checking if influencer exists with ID:", influencerId);
            
            const headers = {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'prefer': 'return=representation',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODM5NDgsImV4cCI6MjA0MTI1OTk0OH0.cs_yQnvzrK-8CRYyvlbzfbhZhIqdC3X9fO-UugRCGuI',
              'Authorization': `Bearer ${session.access_token}`
            };
            
            let existingInfluencer = null;
            
            try {
              const response = await fetch(
                `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers?id=eq.${influencerId}&select=*`, 
                { headers }
              );
              
              if (response.ok) {
                const data = await response.json();
                existingInfluencer = data.length > 0 ? data[0] : null;
                console.log("Influencer fetch response:", existingInfluencer);
              }
            } catch (err) {
              console.error("Error in influencer fetch:", err);
            }

            if (existingInfluencer) {
              console.log('LOG: Influencer exists in DB. Data:', JSON.stringify(existingInfluencer));
              const profileSetupCompleted = sessionStorage.getItem('profileSetupCompleted') === 'true';
              // Strict profile completion check
              const isProfileComplete = (profile: any) => {
                const bioValid = profile.bio && profile.bio.trim().length >= 20;
                const phoneValid = profile.phone_num && /^\d{7,20}$/.test(profile.phone_num);
                let platformsValid = false;
                try {
                  const platformsArr = JSON.parse(profile.platforms || '[]');
                  platformsValid = Array.isArray(platformsArr) && platformsArr.length > 0 && platformsArr.every(p => p.url && p.url.trim() !== '');
                } catch {
                  platformsValid = false;
                }
                return bioValid && phoneValid && platformsValid;
              };

              const isCompleteResult = isProfileComplete(existingInfluencer);
              console.log(`LOG: isProfileComplete check returned: ${isCompleteResult}`);

              if (profileSetupCompleted || isCompleteResult) {
                console.log('LOG: Profile is considered complete. Setting needsProfileSetup(false).');
                setNeedsProfileSetup(false);
              } else {
                console.log('LOG: Profile is considered INCOMPLETE. Setting needsProfileSetup(true).');
                setNeedsProfileSetup(true);
              }
            } else {
              console.log('LOG: New influencer, no record in DB. Setting needsProfileSetup(true).');
              setNeedsProfileSetup(true);
            }
          } catch (dbError) {
            console.error('Database operation error:', dbError);
          }
        }

        // Handle brand profile setup check
        if (session && userTypeRedux === 'brand') {
          const { user } = session;
          const brandId = user.id;
          const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'prefer': 'return=representation',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODM5NDgsImV4cCI6MjA0MTI1OTk0OH0.cs_yQnvzrK-8CRYyvlbzfbhZhIqdC3X9fO-UugRCGuI',
            'Authorization': `Bearer ${session.access_token}`
          };
          let brandProfile = null;
          try {
            const response = await fetch(
              `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/brands?id=eq.${brandId}&select=brand_name,brand_description,location`,
              { headers }
            );
            if (response.ok) {
              const data = await response.json();
              brandProfile = data.length > 0 ? data[0] : null;
            }
          } catch (err) {
            // ignore
          }
          
          if (
            brandProfileSetupCompleted ||
            (
              brandProfile &&
              typeof brandProfile.brand_name === 'string' && brandProfile.brand_name.trim().length > 0 &&
              typeof brandProfile.location === 'string' && brandProfile.location.trim().length > 0 &&
              typeof brandProfile.brand_description === 'string' && brandProfile.brand_description.trim().length >= 20
            )
          ) {
            console.log('Brand profile is complete.');
            setNeedsBrandProfileSetup(false);
          } else {
            console.log('Brand profile is INCOMPLETE.');
            setNeedsBrandProfileSetup(true);
          }
        }
      } catch (error) {
        console.error('Error during initial auth session check:', error);
      } finally {
        console.log('--- performInitialAuthCheck: END ---');
        setIsLoading(false);
      }
    };

    performInitialAuthCheck();
  }, [userTypeRedux]); 

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange: Auth state changed.', event, session);
      setIsLoggedIn(!!session);
      
      // Mark auth flow as completed on SIGNED_IN event
      if (event === 'SIGNED_IN') {
        setAuthFlowCompleted(true);
        console.log('onAuthStateChange: Auth flow marked as completed');
      }

      if (session) {
        console.log('onAuthStateChange: Session found, dispatching user type.');
        
        // Get user type with priority order
        const urlParams = new URLSearchParams(window.location.search);
        const userTypeFromUrl = urlParams.get('user_type') as UserType;
        const userTypeFromSessionMetadata = session.user.user_metadata.userType;
        const userTypeFromCookie = getCookie('user_type') as UserType;
        const userTypeFromSessionStorage = sessionStorage.getItem('user_type') as UserType;
        const userTypeFromLocalStorage = localStorage.getItem('user_type') as UserType;
        
        let userTypeToUse = null;
        let userTypeSource = "";
        
        if (userTypeFromUrl) {
          userTypeToUse = userTypeFromUrl;
          userTypeSource = "URL";
        } else if (userTypeFromSessionMetadata) {
          userTypeToUse = userTypeFromSessionMetadata as UserType;
          userTypeSource = "SessionMetadata";
        } else if (userTypeFromCookie) {
          userTypeToUse = userTypeFromCookie;
          userTypeSource = "Cookie";
        } else if (userTypeFromSessionStorage) {
          userTypeToUse = userTypeFromSessionStorage;
          userTypeSource = "SessionStorage";
        } else if (userTypeFromLocalStorage) {
          userTypeToUse = userTypeFromLocalStorage;
          userTypeSource = "LocalStorage";
        } else if (userTypeRedux) {
          userTypeToUse = userTypeRedux;
          userTypeSource = "ReduxState";
        }
        
        if (userTypeToUse) {
          console.log(`onAuthStateChange: Using user type from ${userTypeSource}:`, userTypeToUse);
          dispatch(setUserType(userTypeToUse));
          
          // Clean up URL if needed
          if (userTypeSource === "URL") {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('user_type');
            newUrl.searchParams.delete('auth_ts');
            window.history.replaceState({}, '', newUrl.toString());
          }
        }
      } else {
        console.log('onAuthStateChange: No session found (logged out).');
        dispatch(setUserType(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, userTypeRedux]);

  const shouldShowNavbar = () => {
    return (
      location.pathname !== '/auth' && 
      location.pathname !== '/auth/reset-password' &&
      location.pathname !== '/influencer-profile-setup' &&
      location.pathname !== '/brand-profile-setup' &&
      isLoggedIn
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      {shouldShowNavbar() && <Navbar />}
      
      <Routes>
        {/* ✅ PUBLIC ROUTES */}
        
        {/* Reset Password - Must be accessible without authentication */}
        <Route 
          path="/auth/reset-password" 
          element={<ResetPassword />} 
        />
        
        {/* ✅ Auth Route - Using your new unified UserLogin */}
        <Route 
          path="/auth" 
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <UserLogin />
            )
          } 
        />
        
        {/* ✅ PROFILE SETUP ROUTES */}
        <Route 
          path="/influencer-profile-setup" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <InfluencerProfileSetup />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/brand-profile-setup" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <BrandProfileSetup />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              {needsProfileSetup && userTypeRedux === 'influencer' && authFlowCompleted && location.pathname !== '/influencer-profile-setup'
                ? (() => {
                    console.log("Redirecting to profile setup, needsProfileSetup:", needsProfileSetup, "userTypeRedux:", userTypeRedux, "authFlowCompleted:", authFlowCompleted);
                    return <Navigate to="/influencer-profile-setup" replace />;
                  })()
                : needsBrandProfileSetup && userTypeRedux === 'brand' && authFlowCompleted && location.pathname !== '/brand-profile-setup'
                ? (() => {
                    console.log("Redirecting to brand profile setup, needsBrandProfileSetup:", needsBrandProfileSetup, "userTypeRedux:", userTypeRedux, "authFlowCompleted:", authFlowCompleted);
                    return <Navigate to="/brand-profile-setup" replace />;
                  })()
                : userTypeRedux === 'influencer'
                ? <InfluencerDashboard />
                : <BrandDashboard />
              }
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/create-campaign" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <CreateCampaign />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/matched-influencers" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <MatchedInfluencers />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/negotiation-chat/:campaign_id/:email" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <NegotiationChat />
            </ProtectedRoute>
          } 
        />
        
        {/* Contract Routes */}
        <Route 
          path="/contracts" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <ContractsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contracts/create" 
          element={ 
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <ContractForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/contracts/sign/:id" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <ContractSigningPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/campaign/:id" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <CampaignDetails />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/app/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="/app/create-campaign" element={<Navigate to="/create-campaign" replace />} />
        <Route path="/app/match_influencers" element={<Navigate to="/matched-influencers" replace />} />
        

        <Route 
          path="/" 
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
          } 
        />

        <Route 
          path="*" 
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
          } 
        />
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