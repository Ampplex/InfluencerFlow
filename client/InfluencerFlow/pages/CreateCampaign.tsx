import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Globe, MessageSquare, Tag, User, Check, AlertCircle, Loader2 } from 'lucide-react';
import supabase from '../utils/supabase';
import { useNavigate } from 'react-router-dom';

// Types
interface FormData {
  campaign_name: string;
  description: string;
  platforms: string;
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

interface InputFieldProps {
  icon: React.ComponentType<any>;
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

// Move InputField outside the main component to prevent re-creation on renders
const InputField: React.FC<InputFieldProps> = ({ icon: Icon, label, error, children, required = false }) => (
  <div className="space-y-2">
    <label className="flex items-center text-sm font-medium text-gray-700">
      <Icon className="w-4 h-4 mr-2 text-gray-500" />
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-sm text-red-600 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

const CreateCampaign = () => {
  const [formData, setFormData] = useState<FormData>({
    campaign_name: '',
    description: '',
    platforms: '',
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
  const [isLoadingBrandId, setIsLoadingBrandId] = useState<boolean>(true); // Track loading state
  const navigate = useNavigate();

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fixed handleChange function
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    console.log('Input changed:', e.target.name, e.target.value); // Debug log
    
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getProtectedData = async () => {
    try {
      setIsLoadingBrandId(true);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.error('No session found');
        setIsLoadingBrandId(false);
        return;
      }
      const fetchedBrandId = data.session.user.user_metadata.id || data.session.user.id || '';
      setBrandId(fetchedBrandId);
      console.log("Brand ID fetched:", fetchedBrandId);
    } catch (error) {
      console.error('Error fetching brand ID:', error);
    } finally {
      setIsLoadingBrandId(false);
    }
  };

  useEffect(() => {
    getProtectedData();
  }, []);

  const handleAddCampaign = async (): Promise<void> => {
    console.log('🔍 Starting campaign creation...');
    console.log('📝 Form data to submit:', formData);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    // Check if brand_id is still loading
    if (isLoadingBrandId) {
      console.log('⏳ Still loading brand ID...');
      setErrors({ brand_id: 'Please wait while we load your account information.' });
      return;
    }

    // Check if brand_id is available
    if (!brand_id) {
      console.error('🚨 Brand ID is not available. Cannot create campaign.');
      setErrors({ brand_id: 'Unable to load account information. Please refresh and try again.' });
      return;
    }

    setStatus('loading');
    console.log('⏳ Setting status to loading...');

    try {
      // Prepare campaign data with proper handling of empty fields
      const campaignData = {
        campaign_name: formData.campaign_name,
        description: formData.description,
        platforms: formData.platforms || null,
        preferred_languages: formData.preferred_languages || null,
        budget: parseFloat(formData.budget),
        start_date: formData.start_date,
        end_date: formData.end_date,
        brand_id: brand_id,
        brand_name: formData.brand_name,
        voice_enabled: formData.voice_enabled,
        status: 'draft',
        created_at: new Date().toISOString(),
        matched_creators: [],
        report_id: crypto.randomUUID(),
      };
      
      console.log('📤 Sending to database:', campaignData);
      
      const { default: supabase } = await import('../utils/supabase');
      
      const { error, data } = await supabase.from('campaign').insert([campaignData]);

      if (error) {
        console.error('🚨 Database error:', error.message);
        console.error('🚨 Full error:', error);
        setStatus('error');
      } else {
        console.log('✅ Campaign saved successfully!');
        console.log('💾 Saved data:', data);
        setStatus('success');
        navigate('/match_influencers', {
          state: {
            query: formData.campaign_name + ' ' + formData.description,
            limit: 10, // Default limit for matched influencers
          },
        });
        
        // Reset form after successful submission
        setTimeout(() => {
          console.log('🔄 Resetting form...');
          setFormData({
            campaign_name: '',
            description: '',
            platforms: '',
            preferred_languages: '',
            budget: '',
            start_date: '',
            end_date: '',
            brand_id: '',
            brand_name: '',
            voice_enabled: false,
          });
          setStatus('idle');
        }, 2000);
      }
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Campaign</h1>
            <p className="text-gray-600">Launch your next influencer marketing campaign</p>
          </div>

          {/* Loading Brand ID Message */}
          {isLoadingBrandId && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
              <Loader2 className="w-5 h-5 text-blue-600 mr-3 animate-spin" />
              <span className="text-blue-800 font-medium">Loading account information...</span>
            </div>
          )}

          {/* Success/Error Messages */}
          {status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-green-800 font-medium">Campaign created successfully!</span>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-800 font-medium">Failed to create campaign. Please try again.</span>
            </div>
          )}

          {/* Brand ID Error */}
          {errors.brand_id && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <span className="text-yellow-800 font-medium">{errors.brand_id}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Campaign Name */}
            <InputField icon={Tag} label="Campaign Name" error={errors.campaign_name} required>
              <input
                name="campaign_name"
                placeholder="Enter campaign name"
                value={formData.campaign_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.campaign_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </InputField>

            {/* Description */}
            <InputField icon={MessageSquare} label="Description" error={errors.description} required>
              <textarea
                name="description"
                placeholder="Describe your campaign goals and requirements"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </InputField>

            {/* Brand Name */}
            <InputField icon={User} label="Brand Name" error={errors.brand_name} required>
              <input
                name="brand_name"
                placeholder="Enter your brand name"
                value={formData.brand_name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.brand_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </InputField>

            {/* Grid Layout for smaller fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platforms */}
              <InputField icon={Globe} label="Platforms">
                <input
                  name="platforms"
                  placeholder="Instagram, TikTok, YouTube"
                  value={formData.platforms}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </InputField>

              {/* Languages */}
              <InputField icon={MessageSquare} label="Preferred Languages">
                <input
                  name="preferred_languages"
                  placeholder="English, Spanish, etc."
                  value={formData.preferred_languages}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </InputField>
            </div>

            {/* Budget */}
            <InputField icon={DollarSign} label="Budget" error={errors.budget} required>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="budget"
                  type="number"
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.budget ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
            </InputField>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField icon={Calendar} label="Start Date" error={errors.start_date} required>
                <input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.start_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </InputField>

              <InputField icon={Calendar} label="End Date" error={errors.end_date} required>
                <input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.end_date ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </InputField>
            </div>

            {/* Voice Enabled Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-gray-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Voice Enabled</h3>
                  <p className="text-sm text-gray-600">Enable voice interactions for this campaign</p>
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAddCampaign}
              disabled={status === 'loading' || isLoadingBrandId}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Campaign...</span>
                </>
              ) : isLoadingBrandId ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading Account...</span>
                </>
              ) : (
                <>
                  <Tag className="w-5 h-5" />
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;