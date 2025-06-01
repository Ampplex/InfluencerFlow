import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './index.css';
import Auth from '../pages/Auth';
import Navbar from '../components/Navbar';
import Dashboard from '../pages/Dashboard';
import CreateCampaign from '../pages/CreateCampaign';
import MatchedInfluencers from '../pages/MatchedInfluencers';
import CreateBrandProf from '../pages/CreateBrandProf';
import supabase from '../utils/supabase';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // If not logged in, redirect to auth
  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide navbar on auth page
  const shouldShowNavbar = () => {
    return location.pathname !== '/auth' && isLoggedIn;
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
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-campaign" 
          element={
            <ProtectedRoute>
              <CreateCampaign />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/match_influencers" 
          element={
            <ProtectedRoute>
              <MatchedInfluencers />
            </ProtectedRoute>
          } 
        />
        
        {/* Root route - redirect based on auth status */}
        <Route 
          path="/" 
          element={
            isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
          } 
        />
        
        {/* Catch all route - redirect to dashboard if logged in, auth if not */}
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
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;