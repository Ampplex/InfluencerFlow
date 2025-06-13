import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { motion } from 'framer-motion';
import { getCurrentUserId, upsertBrandProfile, logOnboardingError } from './onboardingUtils';

const BrandProfileSetup: React.FC = () => {
  const navigate = useNavigate();

  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [brandLocation, setBrandLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user on component mount
  useEffect(() => {
    const checkCurrentUser = async () => {
      const id = await getCurrentUserId();
      if (id) {
        setUserId(id);
      } else {
        navigate('/auth/brand');
      }
    };
    checkCurrentUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('User not authenticated. Please login again.');
      console.error('BrandProfileSetup: No userId found');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData.session?.access_token;
      if (!authToken) throw new Error('No authentication token available');
      const body = {
        id: userId,
        brand_name: brandName,
        brand_description: brandDescription,
        location: brandLocation,
        created_at: new Date().toISOString(),
      };
      const response = await upsertBrandProfile(body, authToken);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update brand profile: ${errorText}`);
      }
      sessionStorage.setItem('brandProfileSetupCompleted', 'true');
      navigate('/dashboard', { replace: true });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update brand profile');
      logOnboardingError('BrandProfileSetup', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Brand Profile</h1>
          <p className="mt-2 text-gray-600">Tell us about your brand to get started</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand Description</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={brandDescription}
              onChange={e => setBrandDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Location</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={brandLocation}
              onChange={e => setBrandLocation(e.target.value)}
              required
            />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded font-semibold"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default BrandProfileSetup; 