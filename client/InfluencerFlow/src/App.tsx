import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';
import Auth from '../pages/Auth/BrandAuth';
import Navbar from '../components/Navbar';
import Dashboard from '../pages/Dashboard';
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
import { Provider } from 'react-redux';
import {store, persistor} from "../redux/store"
import { PersistGate } from 'redux-persist/integration/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { setUserType } from '../redux/userType/userTypeSlice';

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

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const userTypeRedux = useSelector((state: RootState) => state.userType.type);

  console.log('User type from Redux (App.tsx - AppContent):', userTypeRedux);

  // useEffect for initial authentication check and setting global loading state
  useEffect(() => {
    const performInitialAuthCheck = async () => {
      console.log('performInitialAuthCheck: Starting initial auth check...');
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
            const { data: existingInfluencer, error: fetchError } = await supabase
              .from('influencers')
              .select('id')
              .eq('id', influencerId)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 'no rows found'
              console.error('Error checking existing influencer (App.tsx - performInitialAuthCheck):', fetchError);
            }

            if (existingInfluencer) {
              console.log('Influencer exists, attempting to update (App.tsx - performInitialAuthCheck)...');
              const { error: updateError } = await supabase
                .from('influencers')
                .update({
                  influencer_username: influencerUsername,
                  influencer_email: influencerEmail,
                  updated_at: new Date().toISOString()
                })
                .eq('id', influencerId);
              if (updateError) {
                console.error('Error updating influencer (App.tsx - performInitialAuthCheck):', updateError);
              } else {
                console.log('Influencer updated successfully (App.tsx - performInitialAuthCheck).');
              }
            } else {
              console.log('Influencer does not exist, attempting to insert (App.tsx - performInitialAuthCheck)...');
              const { error: insertError } = await supabase
                .from('influencers')
                .insert({
                  id: influencerId,
                  influencer_username: influencerUsername,
                  influencer_email: influencerEmail,
                  influencer_followers: influencerFollowers,
                });
              if (insertError) {
                console.error('Error inserting new influencer (App.tsx - performInitialAuthCheck):', insertError);
              } else {
                console.log('New influencer inserted successfully (App.tsx - performInitialAuthCheck).');
              }
            }
          } catch (dbError) {
            console.error('Unexpected database operation error (App.tsx - performInitialAuthCheck):', dbError);
          }
        } else if (session && userTypeRedux !== 'influencer') {
          console.log('performInitialAuthCheck: Logged in but not an influencer, skipping data handling.');
        } else if (!session) {
          console.log('performInitialAuthCheck: No session found, skipping data handling.');
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
      setIsLoggedIn(!!session);

      if (session) {
        console.log('onAuthStateChange: Session found, dispatching user type.');
        // Attempt to get user_type from session metadata for dispatching to Redux
        const userTypeFromSessionMetadata = session.user.user_metadata.user_type;
        if (userTypeFromSessionMetadata) {
          dispatch(setUserType(userTypeFromSessionMetadata as 'brand' | 'influencer'));
        } else {
          console.log('onAuthStateChange: user_type not found in session metadata for dispatch.');
          // If not in metadata, Redux Persist should handle rehydration or userType will be null.
        }
      } else {
        console.log('onAuthStateChange: No session found (logged out).');
        // Clear user type from Redux on logout
        dispatch(setUserType(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]); // Dependency only on dispatch

  // Hide navbar on auth page
  const shouldShowNavbar = () => {
    return location.pathname !== '/auth/brand' && location.pathname !== '/auth/influencer' && location.pathname !== '/auth' && isLoggedIn;
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
        
        {/* 🆕 NEW: Payment Test (Public - No auth needed) */}
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <Dashboard />
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