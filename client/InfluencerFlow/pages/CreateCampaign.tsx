import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

// Types
interface FormData {
  campaign_name: string;
  description: string;
  platforms: string[];
  preferred_languages: string;
  budget: string;
  start_date: string;
  end_date: string;
  brand_id: string;
  brand_name: string;
  voice_enabled: boolean;
}

interface FormErrors {
  [key: string]: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    campaign_name: '',
    description: '',
    platforms: [],
    preferred_languages: '',
    budget: '',
    start_date: '',
    end_date: '',
    brand_id: '',
    brand_name: '',
    voice_enabled: false,
  });

  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FormErrors>({});
  const [brand_id, setBrandId] = useState<string>('');
  const [isLoadingBrandId, setIsLoadingBrandId] = useState<boolean>(true);

  const platformOptions = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'youtube', name: 'YouTube', icon: '📺' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'facebook', name: 'Facebook', icon: '👥' }
  ];

  // Calculate estimated metrics
  const calculateEstimates = () => {
    const budget = parseFloat(formData.budget) || 0;
    const avgCostPerInfluencer = 75; // Average cost per influencer across platforms
    
    const estimatedInfluencers = Math.floor(budget / avgCostPerInfluencer);
    const estimatedReach = estimatedInfluencers * 25000; // Avg 25k reach per influencer
    const estimatedEngagement = Math.floor(estimatedReach * 0.08); // 8% engagement rate
    
    return {
      influencers: estimatedInfluencers,
      reach: estimatedReach,
      engagement: estimatedEngagement,
      duration: formData.start_date && formData.end_date 
        ? Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.campaign_name.trim()) {
      newErrors.campaign_name = 'Campaign name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.brand_name.trim()) {
      newErrors.brand_name = 'Brand name is required';
    }

    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date';
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = 'Select at least one platform';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePlatformChange = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));

    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: '' }));
    }
  };

  const getProtectedData = async () => {
    try {
      setIsLoadingBrandId(true);
      const { data, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setErrors({ brand_id: 'Authentication error. Please log in again.' });
        return;
      }
      
      if (!data.session) {
        console.error('No session found');
        setErrors({ brand_id: 'No active session. Please log in again.' });
        return;
      }
      
      // Use the user's ID as brand_id
      const userId = data.session.user.id;
      setBrandId(userId);
      console.log("Using user ID as brand ID:", userId);
      
    } catch (error) {
      console.error('Error fetching brand ID:', error);
      setErrors({ brand_id: 'Error loading account information. Please refresh and try again.' });
    } finally {
      setIsLoadingBrandId(false);
    }
  };

  useEffect(() => {
    getProtectedData();
  }, []);

  const handleAddCampaign = async (): Promise<void> => {
    if (!validateForm()) return;

    if (isLoadingBrandId) {
      setErrors({ brand_id: 'Please wait while we load your account information.' });
      return;
    }

    if (!brand_id) {
      setErrors({ brand_id: 'Unable to load account information. Please refresh and try again.' });
      return;
    }

    setStatus('loading');

    try {
      const campaignData = {
        campaign_name: formData.campaign_name,
        description: formData.description,
        platforms: formData.platforms.join(', '),
        preferred_languages: formData.preferred_languages || null,
        budget: parseFloat(formData.budget),
        start_date: formData.start_date,
        end_date: formData.end_date,
        brand_id: brand_id,
        brand_name: formData.brand_name,
        voice_enabled: formData.voice_enabled,
        status: 'draft',
        report_id: crypto.randomUUID(),
      };
      
      const { error, data } = await supabase
        .from('campaign')
        .insert([campaignData])
        .select();

      if (error) {
        console.error('Database error:', error.message);
        setStatus('error');
        setErrors({ submit: error.message });
      } else {
        console.log('Campaign saved successfully!', data);
        setStatus('success');
        
        // Redirect after success - FIXED PATH
        setTimeout(() => {
          navigate('/match_influencers', {
            state: {
              campaignId: data[0].id,
              query: formData.campaign_name + ' ' + formData.description,
              limit: 10,
            },
          });
        }, 2000);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setErrors({ submit: err.message || 'An unexpected error occurred' });
    }
  };

  const estimates = calculateEstimates();
  const selectedPlatformNames = platformOptions.filter(p => formData.platforms.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 flex items-center justify-center p-6">
      {/* Main Container */}
      <motion.div 
        className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[800px]">
          {/* Left Side - Form (3/5) */}
          <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">InfluencerFlow</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Create Campaign
              </h1>
              <p className="text-gray-600">
                Launch your next influencer marketing campaign with AI-powered precision.
              </p>
            </div>

            {/* Status Messages */}
            <AnimatePresence>
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Campaign created successfully! Redirecting to find influencers...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        {errors.submit || 'Failed to create campaign. Please try again.'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {(isLoadingBrandId || errors.brand_id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <div className={`border rounded-xl p-4 ${
                    errors.brand_id 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        errors.brand_id ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {errors.brand_id || 'Loading account information...'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields */}
            <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Campaign Name *
                </label>
                <input
                  name="campaign_name"
                  placeholder="e.g., Summer Fashion Collection 2024"
                  value={formData.campaign_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium ${
                    errors.campaign_name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {errors.campaign_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.campaign_name}</p>
                )}
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Brand Name *
                </label>
                <input
                  name="brand_name"
                  placeholder="Your brand name"
                  value={formData.brand_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium ${
                    errors.brand_name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {errors.brand_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.brand_name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Campaign Description *
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your campaign objectives, target audience, and key messaging..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none bg-gray-50 focus:bg-white text-gray-900 ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description}</p>
                )}
              </div>

              {/* Platforms Multi-Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Target Platforms *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {platformOptions.map(platform => (
                    <label key={platform.id} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform.id)}
                        onChange={() => handlePlatformChange(platform.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-lg">{platform.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{platform.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.platforms && (
                  <p className="text-sm text-red-600 mt-1">{errors.platforms}</p>
                )}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Budget (USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    name="budget"
                    type="number"
                    placeholder="10000"
                    value={formData.budget}
                    onChange={handleChange}
                    min="0"
                    step="100"
                    className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium ${
                      errors.budget ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                </div>
                {errors.budget && (
                  <p className="text-sm text-red-600 mt-1">{errors.budget}</p>
                )}
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Start Date *
                  </label>
                  <input
                    name="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white ${
                      errors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    End Date *
                  </label>
                  <input
                    name="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white ${
                      errors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Preferred Languages
                </label>
                <input
                  name="preferred_languages"
                  placeholder="English, Spanish, French"
                  value={formData.preferred_languages}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white hover:border-gray-300"
                />
              </div>

              {/* AI Voice Toggle */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">AI Voice Interactions</h4>
                      <p className="text-sm text-gray-600">Enable voice-powered campaign features</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="voice_enabled"
                      checked={formData.voice_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleAddCampaign}
              disabled={status === 'loading' || isLoadingBrandId}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3 shadow-lg"
              whileHover={{ scale: status === 'loading' || isLoadingBrandId ? 1 : 1.02 }}
              whileTap={{ scale: status === 'loading' || isLoadingBrandId ? 1 : 0.98 }}
            >
              {status === 'loading' ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Campaign...</span>
                </>
              ) : isLoadingBrandId ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading Account...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Create Campaign & Find Influencers</span>
                </>
              )}
            </motion.button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Right Side - Practical Summary & Insights (2/5) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 relative overflow-hidden p-8">
            {/* Background Effects */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-32 h-32 border border-purple-500/30 rotate-45 rounded-xl"></div>
              <div className="absolute bottom-20 right-20 w-24 h-24 border border-blue-500/30 rotate-12 rounded-lg"></div>
              <div className="absolute top-1/2 left-10 w-4 h-4 bg-green-400 rounded-full"></div>
              <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-yellow-400 rounded-full"></div>
              <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-purple-500/50 rounded-full"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-white h-full flex flex-col">
              {/* Campaign Summary */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Campaign Overview
                </h3>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Name:</span>
                      <span className="font-medium truncate ml-2">
                        {formData.campaign_name || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Brand:</span>
                      <span className="font-medium">
                        {formData.brand_name || 'Not set'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Duration:</span>
                      <span className="font-medium">
                        {estimates.duration ? `${estimates.duration} days` : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Budget Analysis
                </h3>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-300">
                        {formData.budget ? `$${parseFloat(formData.budget).toLocaleString()}` : '$0'}
                      </div>
                      <div className="text-xs text-white/70">Total Budget</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-300">
                        {estimates.influencers || 0}
                      </div>
                      <div className="text-xs text-white/70">Est. Influencers</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated Results */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Expected Results
                </h3>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Estimated Reach:</span>
                      <span className="font-bold text-lg text-blue-300">
                        {estimates.reach > 0 ? `${(estimates.reach / 1000).toFixed(0)}K` : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Expected Engagement:</span>
                      <span className="font-bold text-lg text-purple-300">
                        {estimates.engagement > 0 ? `${(estimates.engagement / 1000).toFixed(1)}K` : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm">Cost per Engagement:</span>
                      <span className="font-bold text-lg text-blue-300">
                        {estimates.engagement > 0 ? `$${(parseFloat(formData.budget || '0') / estimates.engagement).toFixed(2)}` : '$0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selected Platforms */}
              {formData.platforms.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Selected Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlatformNames.map(platform => (
                      <div key={platform.id} className="bg-white/20 rounded-lg px-3 py-1 text-sm backdrop-blur-sm">
                        {platform.icon} {platform.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tips */}
              <div className="mt-auto">
                <h3 className="text-lg font-bold mb-3">💡 Pro Tips</h3>
                <div className="space-y-2 text-sm text-white/80">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2 flex-shrink-0"></div>
                    <span>Micro-influencers (1K-100K) often have better engagement rates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2 flex-shrink-0"></div>
                    <span>Allow 1-2 weeks for content creation and approvals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 bg-white rounded-full mt-2 flex-shrink-0"></div>
                    <span>Multi-platform campaigns increase overall reach by 40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateCampaign;