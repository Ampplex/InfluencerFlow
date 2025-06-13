import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { motion } from 'framer-motion';
import { getCurrentUserId, upsertInfluencerProfile, logOnboardingError, PlatformLink } from './onboardingUtils';

const InfluencerProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  
  // State for form fields
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [platforms, setPlatforms] = useState<PlatformLink[]>([
    { platform: 'Instagram', url: '' },
    { platform: 'Twitter', url: '' },
    { platform: 'TikTok', url: '' },
    { platform: 'LinkedIn', url: '' },
    { platform: 'YouTube', url: '' },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get current user on component mount
  useEffect(() => {
    const checkCurrentUser = async () => {
      const id = await getCurrentUserId();
      if (id) {
        setUserId(id);
      } else {
        navigate('/auth/influencer');
      }
    };
    checkCurrentUser();
  }, [navigate]);
  
  const handlePlatformChange = (index: number, value: string) => {
    const updatedPlatforms = [...platforms];
    updatedPlatforms[index].url = value;
    setPlatforms(updatedPlatforms);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    if (!userId) {
      setError('User not authenticated. Please login again.');
      return;
    }
    // Phone validation: 7-20 digits
    if (!phone || !/^\d{7,20}$/.test(phone)) {
      setPhoneError('Please enter a valid phone number (7-20 digits, numbers only).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData.session?.access_token;
      if (!authToken) throw new Error('No authentication token available');
      const platformsJson = JSON.stringify(platforms.filter(p => p.url.trim() !== ''));
      const profile = {
        id: userId,
        bio,
        phone_num: phone, // Save as string
        platforms: platformsJson,
      };
      const response = await upsertInfluencerProfile(profile, authToken);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update profile: ${errorText}`);
      }
      sessionStorage.setItem('profileSetupCompleted', 'true');
      navigate('/dashboard', { replace: true });
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      logOnboardingError('InfluencerProfileSetup', err);
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
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="mt-2 text-gray-600">Tell brands about yourself and share your social media profiles</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Tell brands about yourself, your content style, and audience..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
            />
          </div>
          
          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              required
              maxLength={20}
            />
            {phoneError && <p className="text-red-600 text-xs mt-1">{phoneError}</p>}
          </div>
          
          {/* Platform Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Your Social Media Profiles</h3>
            
            {platforms.map((platform, index) => (
              <div key={platform.platform} className="flex items-center space-x-3">
                <div className="w-24 flex-shrink-0">
                  <label className="block text-sm font-medium text-gray-700">
                    {platform.platform}
                  </label>
                </div>
                <input
                  type="url"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={`Your ${platform.platform} profile URL`}
                  value={platform.url}
                  onChange={(e) => handlePlatformChange(index, e.target.value)}
                />
              </div>
            ))}
            <p className="text-xs text-gray-500 mt-1">
              Please provide complete URLs (e.g., https://instagram.com/username)
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <motion.button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-md shadow-sm hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Saving..." : "Complete Setup"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default InfluencerProfileSetup; 