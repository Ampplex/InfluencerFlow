import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { 
  Phone, 
  Instagram, 
  Youtube, 
  Twitter, 
  Linkedin, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Users,
  Edit3
} from 'lucide-react';
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PlatformLink {
  platform: string;
  url: string;
}

interface InfluencerProfile {
  id: string;
  bio: string;
  phone_num: string;
  platforms: string;
  created_at?: string;
  updated_at?: string;
}

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
  const [existingProfile, setExistingProfile] = useState<InfluencerProfile | null>(null);
  const [profileValidation, setProfileValidation] = useState({
    bioValid: false,
    phoneValid: false,
    platformsValid: false
  });
  
  // Get current user and existing profile on component mount
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Get current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        const uid = sessionData.session?.user?.id;
        if (!uid) {
          throw new Error('User not authenticated');
        }
        
        setUserId(uid);
        
        // Fetch existing influencer profile
        const { data: profileData, error: profileError } = await supabase
          .from('influencers')
          .select('*')
          .eq('id', uid)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error fetching profile:', profileError);
          // Don't throw here, profile might not exist yet
        }
        
        if (profileData) {
          setExistingProfile(profileData);
          
          // Pre-populate form with existing data
          if (profileData.bio) setBio(profileData.bio);
          if (profileData.phone_num) setPhone(profileData.phone_num);
          
          if (profileData.platforms) {
            try {
              const existingPlatforms = JSON.parse(profileData.platforms);
              const updatedPlatforms = platforms.map(platform => {
                const existing = existingPlatforms.find((ep: PlatformLink) => ep.platform === platform.platform);
                return existing || platform;
              });
              setPlatforms(updatedPlatforms);
            } catch (e) {
              console.error('Error parsing existing platforms:', e);
            }
          }
        }
        
      } catch (err: any) {
        console.error('Error in fetchUserAndProfile:', err);
        setError(err.message || 'Failed to load user data');
        
        // Redirect to auth if not authenticated
        if (err.message?.includes('not authenticated')) {
          navigate('/auth?tab=influencer');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndProfile();
  }, [navigate]);

  // Real-time profile validation
  useEffect(() => {
    setProfileValidation({
      bioValid: bio.trim().length >= 20,
      phoneValid: /^\d{7,20}$/.test(phone),
      platformsValid: platforms.some(p => p.url.trim() !== '')
    });
  }, [bio, phone, platforms]);
  
  const handlePlatformChange = (index: number, value: string) => {
    const updatedPlatforms = [...platforms];
    updatedPlatforms[index].url = value;
    setPlatforms(updatedPlatforms);
  };
  
  const validateProfileData = (profile: Partial<InfluencerProfile>) => {
    const errors = [];
    
    if (!profile.bio || profile.bio.trim().length < 20) {
      errors.push('Bio must be at least 20 characters long');
    }
    
    if (!profile.phone_num || !/^\d{7,20}$/.test(profile.phone_num)) {
      errors.push('Phone number must be 7-20 digits');
    }
    
    const platformData = JSON.parse(profile.platforms || '[]');
    if (platformData.length === 0) {
      errors.push('At least one social media platform is required');
    }
    
    return errors;
  };
  
  const upsertInfluencerProfile = async (profile: Partial<InfluencerProfile>) => {
    console.log('Updating profile for user:', profile.id);
    console.log('Profile data:', {
      bio: profile.bio ? 'set' : 'empty',
      phone: profile.phone_num ? 'set' : 'empty',
      platforms: profile.platforms ? JSON.parse(profile.platforms).length + ' platforms' : 'no platforms'
    });

    if (!profile.id) {
      throw new Error('User ID is required');
    }

    // Validate profile data before sending
    const validationErrors = validateProfileData(profile);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('. '));
    }

    // Check if profile exists
    const { data: existingData } = await supabase
      .from('influencers')
      .select('id')
      .eq('id', profile.id)
      .single();

    let result;
    if (existingData) {
      // Update existing profile
      const { data, error } = await supabase
        .from('influencers')
        .update({
          bio: profile.bio,
          phone_num: profile.phone_num,
          platforms: profile.platforms,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new profile
      const { data, error } = await supabase
        .from('influencers')
        .insert({
          id: profile.id,
          bio: profile.bio,
          phone_num: profile.phone_num,
          platforms: profile.platforms,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log('Profile updated successfully:', {
      userId: profile.id,
      hasBio: !!profile.bio,
      hasPhone: !!profile.phone_num,
      platformCount: profile.platforms ? JSON.parse(profile.platforms).length : 0
    });

    return result;
  };

  const logOnboardingError = (component: string, error: any) => {
    console.error(`${component} Error:`, error);
    
    // Send error to monitoring service (if available)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
    
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
  };
  
  const handleSubmit = async () => {
    setPhoneError('');
    setError('');
    
    if (!userId) {
      setError('User not authenticated. Please login again.');
      return;
    }
    
    // Phone validation: 7-20 digits
    if (!phone || !/^\d{7,20}$/.test(phone)) {
      setPhoneError('Please enter a valid phone number (7-20 digits, numbers only).');
      return;
    }

    // Bio validation
    if (!bio || bio.trim().length < 20) {
      setError('Bio must be at least 20 characters long.');
      return;
    }

    // Platform validation
    const activePlatforms = platforms.filter(p => p.url.trim() !== '');
    if (activePlatforms.length === 0) {
      setError('Please add at least one social media platform.');
      return;
    }
    
    setLoading(true);
    
    try {
      const platformsJson = JSON.stringify(activePlatforms);
      const profile: Partial<InfluencerProfile> = {
        id: userId,
        bio: bio.trim(),
        phone_num: phone,
        platforms: platformsJson,
      };
      
      // Update profile using real Supabase call
      const result = await upsertInfluencerProfile(profile);
      
      if (result) {
        // Mark profile setup as completed
        sessionStorage.setItem('profileSetupCompleted', 'true');
        
        // Store profile summary for dashboard
        const profileSummary = {
          bio: profile.bio,
          platformCount: activePlatforms.length,
          completedAt: new Date().toISOString()
        };
        sessionStorage.setItem('profileSummary', JSON.stringify(profileSummary));
        
        console.log('Profile setup completed successfully:', profileSummary);
        
        // Redirect to influencer dashboard
        navigate('/creator/dashboard');
      } else {
        throw new Error('Failed to update profile - no data returned');
      }
      
    } catch (err: any) {
      console.error('Profile update error:', err);
      logOnboardingError('InfluencerProfileSetup', err);
      
      // Enhanced error handling based on error type
      if (err.message?.includes('duplicate key')) {
        setError('Profile already exists. Please try updating instead.');
      } else if (err.message?.includes('validation')) {
        setError('Profile validation failed. Please check your inputs.');
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('permission')) {
        setError('Permission denied. Please make sure you are logged in.');
      } else {
        setError(err.message || 'Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Instagram': return <Instagram className="w-5 h-5" />;
      case 'TikTok': return <Globe className="w-5 h-5" />;
      case 'YouTube': return <Youtube className="w-5 h-5" />;
      case 'Twitter': return <Twitter className="w-5 h-5" />;
      case 'LinkedIn': return <Linkedin className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const getPlatformPlaceholder = (platform: string) => {
    switch (platform) {
      case 'Instagram': return 'https://instagram.com/yourusername';
      case 'TikTok': return 'https://tiktok.com/@yourusername';
      case 'YouTube': return 'https://youtube.com/c/yourchannel';
      case 'Twitter': return 'https://twitter.com/yourusername';
      case 'LinkedIn': return 'https://linkedin.com/in/yourprofile';
      default: return `https://${platform.toLowerCase()}.com/yourprofile`;
    }
  };

  const completedPlatforms = platforms.filter(p => p.url.trim() !== '').length;
  const progressPercentage = ((profileValidation.bioValid ? 1 : 0) + (profileValidation.phoneValid ? 1 : 0) + (profileValidation.platformsValid ? 1 : 0)) / 3 * 100;
  const canSubmit = profileValidation.bioValid && profileValidation.phoneValid && profileValidation.platformsValid && !loading;

  // Loading state for initial data fetch
  if (loading && !userId) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Loading Profile Setup</h3>
          <p className="text-slate-600 dark:text-slate-400">Fetching your account data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-8 h-8 mr-3">
              <img 
                src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
                alt="InfluencerFlow Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              InfluencerFlow.in
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
              {existingProfile ? 'Update Your Creator Profile' : 'Complete Your Creator Profile'}
            </h1>
            <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-6">
              // Tell brands about yourself and showcase your social presence
            </p>

            {/* Enhanced Progress Bar with Validation States */}
            <div className="max-w-md mx-auto mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  setup_progress()
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              {/* Validation Indicators */}
              <div className="flex justify-between mt-3 text-xs">
                <div className={`flex items-center gap-1 ${profileValidation.bioValid ? 'text-green-600' : 'text-slate-400'}`}>
                  {profileValidation.bioValid ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                  <span className="font-mono">bio</span>
                </div>
                <div className={`flex items-center gap-1 ${profileValidation.phoneValid ? 'text-green-600' : 'text-slate-400'}`}>
                  {profileValidation.phoneValid ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                  <span className="font-mono">contact</span>
                </div>
                <div className={`flex items-center gap-1 ${profileValidation.platformsValid ? 'text-green-600' : 'text-slate-400'}`}>
                  {profileValidation.platformsValid ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                  <span className="font-mono">social</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="space-y-8">
            
            {/* Bio Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                creator_bio() {"{"}
              </div>
              
              <div className="pl-4 space-y-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    profileValidation.bioValid 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}>
                    {profileValidation.bioValid ? <CheckCircle className="w-5 h-5 text-white" /> : <Edit3 className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      About You
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Tell brands what makes you unique (min. 20 characters)
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm transition-colors ${
                    bio.length > 0 && !profileValidation.bioValid 
                      ? 'border-red-300 dark:border-red-600' 
                      : profileValidation.bioValid 
                        ? 'border-green-300 dark:border-green-600'
                        : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder="I'm a lifestyle content creator focused on authentic brand partnerships. My audience loves fashion, travel, and wellness content..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                    // Describe your content style, audience, and what you're passionate about
                  </p>
                  <span className={`text-xs font-mono ${
                    bio.length >= 20 ? 'text-green-600' : bio.length > 0 ? 'text-orange-600' : 'text-slate-400'
                  }`}>
                    {bio.length}/20
                  </span>
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-4">
                {"}"}
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                contact_info() {"{"}
              </div>
              
              <div className="pl-4 space-y-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    profileValidation.phoneValid 
                      ? 'bg-gradient-to-r from-green-500 to-blue-500' 
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                  }`}>
                    {profileValidation.phoneValid ? <CheckCircle className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Phone Number
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      For important campaign communications (7-20 digits)
                    </p>
                  </div>
                </div>

                <input
                  type="tel"
                  className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                    phone.length > 0 && !profileValidation.phoneValid 
                      ? 'border-red-300 dark:border-red-600' 
                      : profileValidation.phoneValid 
                        ? 'border-green-300 dark:border-green-600'
                        : 'border-slate-300 dark:border-slate-600'
                  }`}
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={20}
                />
                {phoneError && (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-800 dark:text-red-200 font-mono text-sm">
                      {phoneError}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">
                  // Used for contract signing and payment notifications
                </p>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-4">
                {"}"}
              </div>
            </motion.div>

            {/* Social Media Platforms */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-4">
                social_media_profiles() {"{"}
              </div>
              
              <div className="pl-4 space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    profileValidation.platformsValid 
                      ? 'bg-gradient-to-r from-green-500 to-purple-500' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500'
                  }`}>
                    {profileValidation.platformsValid ? <CheckCircle className="w-5 h-5 text-white" /> : <Users className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Your Social Presence
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Connect your platforms to showcase your reach ({completedPlatforms} connected)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platforms.map((platform, index) => (
                    <HoverBorderGradient
                      key={platform.platform}
                      containerClassName="rounded-xl"
                      as="div"
                      className="bg-white dark:bg-slate-800 p-4"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                          {getPlatformIcon(platform.platform)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {platform.platform}
                          </h4>
                          {platform.url && (
                            <Badge variant="outline" className="mt-1">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <input
                        type="url"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                        placeholder={getPlatformPlaceholder(platform.platform)}
                        value={platform.url}
                        onChange={(e) => handlePlatformChange(index, e.target.value)}
                      />
                    </HoverBorderGradient>
                  ))}
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">!</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                        Platform Tips
                      </p>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-mono text-xs">
                        <li>• Provide complete URLs (e.g., https://instagram.com/username)</li>
                        <li>• Connect platforms where you're most active</li>
                        <li>• Public accounts perform better for brand partnerships</li>
                        <li>• You can add more platforms later in settings</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-mono text-sm text-slate-600 dark:text-slate-400 mt-4">
                {"}"}
              </div>
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              className="flex justify-end pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <HoverBorderGradient
                containerClassName="rounded-xl"
                as="button"
                className={`font-mono flex items-center px-8 py-4 text-base font-medium transition-all ${
                  canSubmit 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' 
                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
                onClick={canSubmit ? handleSubmit : undefined}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {existingProfile ? 'updating_profile...' : 'completing_setup...'}
                  </>
                ) : canSubmit ? (
                  <>
                    {existingProfile ? 'update_profile()' : 'complete_profile()'}
                    <ArrowRight className="w-4 h-4 ml-3" />
                  </>
                ) : (
                  <>
                    complete_all_fields()
                    <AlertCircle className="w-4 h-4 ml-3" />
                  </>
                )}
              </HoverBorderGradient>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="font-mono text-xs text-slate-500 dark:text-slate-500">
            // Your profile helps brands find and connect with you
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default InfluencerProfileSetup;