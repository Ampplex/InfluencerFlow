import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';
import Auth from '../pages/Auth/BrandAuth';
import Navbar from '../components/Navbar';
import BrandDashboard from '../pages/BrandDashboard';
import CreateCampaign from '../pages/CreateCampaign';
import MatchedInfluencers from '../pages/MatchedInfluencers';
import NegotiationChat from '../pages/NegotiationChat';
import ContractForm from '../pages/ContractForm';
import ContractsPage from '../pages/ContractsPage';
import ContractSigningPage from '../pages/ContractSigningPage';
import supabase from '../utils/supabase';
import InfluencerFlowAuth from '../pages/Auth/InfluencerAuth';
import BrandAuth from '../pages/Auth/BrandAuth';
import AuthSelection from '../pages/Auth/AuthSelection';
import InfluencerProfileSetup from '../pages/InfluencerProfileSetup';
import BrandProfileSetup from '../pages/BrandProfileSetup';
import { Provider } from 'react-redux';
import {store, persistor} from "../redux/store"
import { PersistGate } from 'redux-persist/integration/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setUserType } from '../redux/userType/userTypeSlice';
import InfluencerDashboard from '../pages/InfluencerDashboard';
import CampaignDetails from '../pages/CampaignDetails';

// Protected Route Component
function ProtectedRoute({ children, isLoggedIn, isLoading }: { children: React.ReactNode, isLoggedIn: boolean, isLoading: boolean }) {
  // No internal isLoggedIn or isLoading state needed here, relying on props from AppContent

  if (isLoading) {
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

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

// Helper function to get cookie value
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [authFlowCompleted, setAuthFlowCompleted] = useState(false);
  const [needsBrandProfileSetup, setNeedsBrandProfileSetup] = useState(false);
  const dispatch = useDispatch();
  const userTypeRedux = useSelector((state: RootState) => state.userType.type);

  console.log('AppContent render - Current location:', window.location.href);
  console.log('User type from Redux (App.tsx - AppContent):', userTypeRedux);

  // useEffect for initial authentication check and setting global loading state
  useEffect(() => {
    const performInitialAuthCheck = async () => {
      console.log('performInitialAuthCheck: Starting initial auth check...');
      
      // Check if profile setup was just completed
      const profileSetupCompleted = sessionStorage.getItem('profileSetupCompleted') === 'true';
      if (profileSetupCompleted) {
        console.log('Profile setup was completed, overriding needsProfileSetup flag');
        setNeedsProfileSetup(false);
        // Clear the flag after using it
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

        // Also handle influencer data insertion/update during initial load if logged in as influencer
        // Access userTypeRedux directly as this useEffect runs only once
        if (session && userTypeRedux === 'influencer') {
          console.log('performInitialAuthCheck: User is influencer, attempting data handling.');
          const { user } = session;
          const influencerId = user.id;
          const influencerEmail = user.email || user.user_metadata.email;
          const influencerUsername = user.user_metadata.full_name || user.email;
          const influencerFollowers = 0; // Default to 0

          console.log('Prepared influencer data (App.tsx - performInitialAuthCheck):', { influencerId, influencerEmail, influencerUsername, influencerFollowers });

          try {
            // Check if influencer exists and if profile is complete
            console.log("Checking if influencer exists with ID:", influencerId);
            
            // Use direct REST API call to avoid 406 error
            const headers = {
              'Content-Type': 'application/json',
              'Accept': '*/*',
              'prefer': 'return=representation',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODM5NDgsImV4cCI6MjA0MTI1OTk0OH0.cs_yQnvzrK-8CRYyvlbzfbhZhIqdC3X9fO-UugRCGuI',
              'Authorization': `Bearer ${session.access_token}`
            };
            
            let existingInfluencer = null;
            let fetchError = null;
            
            try {
              // Make direct fetch call to avoid 406 errors
              const response = await fetch(
                `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers?id=eq.${influencerId}&select=*`, 
                { headers }
              );
              
              if (response.ok) {
                const data = await response.json();
                existingInfluencer = data.length > 0 ? data[0] : null;
                console.log("Influencer fetch response:", existingInfluencer);
              } else {
                fetchError = { message: `API error: ${response.status} ${response.statusText}` };
                console.error("Error fetching influencer:", fetchError);
              }
            } catch (err) {
              console.error("Error in influencer fetch:", err);
              fetchError = err;
            }

            if (fetchError) {
              console.error('Error checking existing influencer (App.tsx - performInitialAuthCheck):', fetchError);
            }

            if (existingInfluencer) {
              console.log('Influencer exists, checking if profile is complete...');
              // Check if profile needs setup (no bio or platforms)
              // Also respect the profile setup completion flag
              const profileSetupCompleted = sessionStorage.getItem('profileSetupCompleted') === 'true';
              
              if (profileSetupCompleted || (existingInfluencer.bio || existingInfluencer.platforms)) {
                console.log('Influencer profile is already complete or was just completed');
                setNeedsProfileSetup(false);
              } else {
                console.log('Influencer profile incomplete, needs setup');
                setNeedsProfileSetup(true);
              }
              
              // Update basic info regardless
              try {
                const updateResponse = await fetch(
                  `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers?id=eq.${influencerId}`,
                  {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({
                      influencer_username: influencerUsername,
                      influencer_email: influencerEmail,
                    })
                  }
                );
                
                if (updateResponse.ok) {
                console.log('Influencer updated successfully (App.tsx - performInitialAuthCheck).');
                } else {
                  const updateError = await updateResponse.text();
                  console.error('Error updating influencer (App.tsx - performInitialAuthCheck):', updateError);
                }
              } catch (updateErr) {
                console.error('Exception updating influencer:', updateErr);
              }
            } else {
              // First try to check if the email exists
              let emailCheck = null;
              
              try {
                const emailCheckResponse = await fetch(
                  `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers?influencer_email=eq.${encodeURIComponent(influencerEmail)}&select=id,bio,platforms`,
                  { headers }
                );
                
                if (emailCheckResponse.ok) {
                  const data = await emailCheckResponse.json();
                  emailCheck = data.length > 0 ? data[0] : null;
                  console.log("Email check response:", emailCheck);
                }
              } catch (emailErr) {
                console.error("Error checking email:", emailErr);
              }
                
              if (emailCheck) {
                console.log('Influencer exists with this email, checking if profile is complete...');
                // Check if profile needs setup (no bio or platforms)
                if (!emailCheck.bio && !emailCheck.platforms) {
                  console.log('Influencer profile incomplete, needs setup');
                  setNeedsProfileSetup(true);
                } else {
                  console.log('Influencer profile is already complete');
                  setNeedsProfileSetup(false);
                }
                
                // Update the record with the new user ID
                try {
                  const updateResponse = await fetch(
                    `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers?influencer_email=eq.${encodeURIComponent(influencerEmail)}`,
                    {
                      method: 'PATCH',
                      headers,
                      body: JSON.stringify({
                        id: influencerId,
                        influencer_username: influencerUsername,
                      })
                    }
                  );
                  
                  if (updateResponse.ok) {
                    console.log('Influencer updated with new ID successfully.');
                  } else {
                    const updateError = await updateResponse.text();
                    console.error('Error updating influencer with new ID:', updateError);
                  }
                } catch (updateErr) {
                  console.error('Exception updating influencer:', updateErr);
                }
              } else {
                // Truly new influencer
                console.log('Influencer does not exist, attempting to insert...');
                
                try {
                  const insertResponse = await fetch(
                    `https://eepxrnqcefpvzxqkpjaw.supabase.co/rest/v1/influencers`,
                    {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({
                  id: influencerId,
                  influencer_username: influencerUsername,
                  influencer_email: influencerEmail,
                  influencer_followers: influencerFollowers,
                      })
                    }
                  );
                  
                  if (insertResponse.ok) {
                    console.log('New influencer inserted successfully.');
                    // New influencer always needs profile setup
                    setNeedsProfileSetup(true);
              } else {
                    const insertError = await insertResponse.text();
                    console.error('Error inserting new influencer:', insertError);
                  }
                } catch (insertErr) {
                  console.error('Exception inserting influencer:', insertErr);
                }
              }
            }
          } catch (dbError) {
            console.error('Unexpected database operation error (App.tsx - performInitialAuthCheck):', dbError);
          }
        } else if (session && userTypeRedux !== 'influencer') {
          console.log('performInitialAuthCheck: Logged in but not an influencer, skipping data handling.');
          setNeedsProfileSetup(false);
        } else if (!session) {
          console.log('performInitialAuthCheck: No session found, skipping data handling.');
          setNeedsProfileSetup(false);
        }

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
          // Also respect the sessionStorage flag
          if (
            brandProfileSetupCompleted ||
            (brandProfile && brandProfile.brand_name && brandProfile.brand_description && brandProfile.location)
          ) {
            setNeedsBrandProfileSetup(false);
          } else {
            setNeedsBrandProfileSetup(true);
          }
        }
      } catch (error) {
        console.error('performInitialAuthCheck: Error during initial auth session check or data handling:', error);
      } finally {
        console.log('performInitialAuthCheck: Setting isLoading to false.');
        setIsLoading(false); // Crucially, ensure isLoading is set to false here after initial check
      }
    };

    performInitialAuthCheck();
  }, []); // Empty dependency array means this runs only once on mount

  // useEffect for listening to authentication state changes (login/logout events)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('onAuthStateChange: Auth state changed.', event, session);
      console.log('onAuthStateChange: Current location:', window.location.href);
      console.log('onAuthStateChange: Current search params:', window.location.search);
      console.log('onAuthStateChange: Current hash:', window.location.hash);
      setIsLoggedIn(!!session);
      
      // Mark auth flow as completed on SIGNED_IN event to prevent future redirects
      if (event === 'SIGNED_IN') {
        setAuthFlowCompleted(true);
        console.log('onAuthStateChange: Auth flow marked as completed');
        
        // Add a long string to make it easy to find in the logs
        console.log('*************** AUTH FLOW COMPLETED ***************');
        console.log('*************** USER TYPE:', userTypeRedux);
        console.log('*************** SESSION DATA:', session?.user);
      }

      if (session) {
        console.log('onAuthStateChange: Session found, dispatching user type.');
        
        // Try to get user_type in this priority:
        // 1. From URL parameters
        // 2. From session metadata
        // 3. From cookies
        // 4. From sessionStorage
        // 5. From localStorage
        // 6. Fall back to Redux persisted state
        
        // Priority 1: Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userTypeFromUrl = urlParams.get('user_type') as 'brand' | 'influencer' | null;
        console.log('onAuthStateChange: URL params user_type:', userTypeFromUrl);
        
        // Priority 2: Attempt to get user_type from session metadata
        const userTypeFromSessionMetadata = session.user.user_metadata.user_type;
        console.log('onAuthStateChange: Session metadata user_type:', userTypeFromSessionMetadata);
        
        // Priority 3: Check cookies
        const userTypeFromCookie = getCookie('user_type') as 'brand' | 'influencer' | null;
        console.log('onAuthStateChange: Cookie user_type:', userTypeFromCookie);
        
        // Priority 4: Check sessionStorage for user_type
        const userTypeFromSessionStorage = sessionStorage.getItem('user_type') as 'brand' | 'influencer' | null;
        console.log('onAuthStateChange: SessionStorage user_type:', userTypeFromSessionStorage);
        
        // Priority 5: Check localStorage for user_type
        const userTypeFromLocalStorage = localStorage.getItem('user_type') as 'brand' | 'influencer' | null;
        console.log('onAuthStateChange: LocalStorage user_type:', userTypeFromLocalStorage);
        
        // Determine which user type to use
        let userTypeToUse = null;
        let userTypeSource = "";
        
        if (userTypeFromUrl) {
          userTypeToUse = userTypeFromUrl;
          userTypeSource = "URL";
        } else if (userTypeFromSessionMetadata) {
          userTypeToUse = userTypeFromSessionMetadata as 'brand' | 'influencer';
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
          
          // If we found the user type in URL, clean it up
          if (userTypeSource === "URL") {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('user_type');
            newUrl.searchParams.delete('auth_ts');
            window.history.replaceState({}, '', newUrl.toString());
            console.log('onAuthStateChange: Cleaned up URL parameters');
          }
        } else {
          console.log('onAuthStateChange: Could not determine user type from any source');
        }
        
        // Clean up stored user types after successful restoration to Redux
        if (event === 'SIGNED_IN' && userTypeToUse) {
          // Don't clear it yet - wait for Redux to be updated
          setTimeout(() => {
            try {
              sessionStorage.removeItem('user_type');
              localStorage.removeItem('user_type');
              document.cookie = 'user_type=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'auth_ts=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              console.log('onAuthStateChange: Cleared user_type from all storage after restoring to Redux');
            } catch (e) {
              console.error('Error clearing storage:', e);
            }
          }, 1000);
        }
      } else {
        console.log('onAuthStateChange: No session found (logged out).');
        // Clear user type from Redux on logout
        dispatch(setUserType(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]); // Dependency only on dispatch

  // Hide navbar on auth page and profile setup page
  const shouldShowNavbar = () => {
    return (
      location.pathname !== '/auth/brand' && 
      location.pathname !== '/auth/influencer' && 
      location.pathname !== '/auth' && 
      location.pathname !== '/influencer-profile-setup' &&
      isLoggedIn
    );
  };

  if (isLoading) {
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

  return (
    <>
      {shouldShowNavbar() && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/auth" element={<AuthSelection />} />
        <Route path="/auth/influencer" element={<InfluencerFlowAuth />} /> 
        <Route path="/auth/brand" element={<BrandAuth />} />
        
        {/* Influencer Profile Setup */}
        <Route path="/influencer-profile-setup" element={
          <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
            <InfluencerProfileSetup />
          </ProtectedRoute>
        } />
        
        {/* 🆕 NEW: Payment Test (Public - No auth needed) */}
        
        {/* Protected Routes */}
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
        
        {/* 🆕 NEW: Payment Test (Protected version) */}
        
        {/* Legacy routes for backward compatibility */}
        <Route
          path="/app/dashboard" 
          element={<Navigate to="/dashboard" replace />}
        />
        <Route 
          path="/app/create-campaign" 
          element={<Navigate to="/create-campaign" replace />}
        />
        <Route
          path="/app/match_influencers" 
          element={<Navigate to="/match_influencers" replace />}
        />
        
        {/* Root route - redirect based on auth status */}
        <Route 
          path="/" 
          element={
            isLoading ? null : (isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />)
          } 
        />
        
        {/* Catch all route - redirect to dashboard if logged in, auth if not */}
        <Route 
          path="*" 
          element={
            isLoading ? null : (isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />)
          } 
        />

        <Route path="/brand-profile-setup" element={
          <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
            <BrandProfileSetup />
          </ProtectedRoute>
        } />

        <Route path="/campaign/:id" element={<ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}><CampaignDetails /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <Router>
          <AppContent />
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;