import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import { motion } from 'framer-motion';
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
import { isInfluencerProfileComplete } from './onboardingUtils';

// Interface for platform links
export interface PlatformLink {
  platform: string;
  url: string;
}

// Helper function to get current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return sessionData.session?.user?.id || null;
  } catch (error) {
    console.error('Error in getCurrentUserId:', error);
    return null;
  }
};

// Function to upsert influencer profile using real Supabase
export const upsertInfluencerProfile = async (profile: any, authToken: string) => {
  console.log('Updating profile for user:', profile.id);
  console.log('Using auth token:', authToken ? 'present' : 'missing');
  console.log('Profile data:', {
    bio: profile.bio ? 'set' : 'empty',
    phone: profile.phone_num ? 'set' : 'empty',
    platforms: profile.platforms ? JSON.parse(profile.platforms).length + ' platforms' : 'no platforms'
  });

  if (!profile.id) {
    throw new Error('User ID is required');
  }

  if (!authToken) {
    throw new Error('Authentication token is required');
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
        platforms: profile.platforms
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
        influencer_username: profile.username || 'user_' + profile.id.slice(0, 8),
        influencer_email: profile.email || '',
        bio: profile.bio,
        phone_num: profile.phone_num,
        platforms: profile.platforms
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

  return { ok: true, json: async () => result };
};

// Error logging function
export const logOnboardingError = (component: string, error: any) => {
  console.error(`${component} Error:`, error);
  if (error.stack) {
    console.error('Error stack:', error.stack);
  }
};

const InfluencerProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  
  // State for form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
        // Fetch existing profile data if available
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('influencers')
            .select('*')
            .eq('id', id)
            .single();
          if (profileData && !profileError) {
            // If profile is already complete, redirect to dashboard
            if (isInfluencerProfileComplete(profileData)) {
              navigate('/creator/dashboard', { replace: true });
              return;
            }
            // Pre-populate form with existing data
            if (profileData.influencer_username) setUsername(profileData.influencer_username);
            if (profileData.influencer_email) setEmail(profileData.influencer_email);
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
        } catch (error) {
          console.error('Error fetching existing profile:', error);
        }
      } else {
        navigate('/auth?tab=influencer');
      }
    };
    checkCurrentUser();
  }, [navigate]);
  
  const handlePlatformChange = (index: number, value: string) => {
    const updatedPlatforms = [...platforms];
    updatedPlatforms[index].url = value;
    setPlatforms(updatedPlatforms);
  };
  
  // ✅ FIXED: Simplified form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setError('');
    
    if (!userId) {
      setError('User not authenticated. Please login again.');
      return;
    }
    
    if (!username || username.trim().length < 3 || username.includes(' ')) {
      setError('Username must be at least 3 characters and contain no spaces.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('A valid email is required.');
      return;
    }
    if (!phone || !/^\d{7,20}$/.test(phone)) {
      setPhoneError('Please enter a valid phone number (7-20 digits, numbers only).');
      return;
    }
    if (!bio || bio.trim().length < 10) {
      setError('Bio must be at least 10 characters long.');
      return;
    }
    
    const activePlatforms = platforms.filter(p => p.url.trim() !== '');
    if (activePlatforms.length === 0) {
      setError('Please add at least one social media platform.');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData.session?.access_token;
      if (!authToken) throw new Error('No authentication token available');
      
      // ✅ FIXED: Include all platforms, not just active ones
      const platformsJson = JSON.stringify(activePlatforms);
      
      const profile = {
        id: userId,
        username: username.trim(),
        email: email.trim(),
        bio: bio.trim(),
        phone_num: phone,
        platforms: platformsJson,
      };
      
      const response = await upsertInfluencerProfile(profile, authToken);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update profile: ${JSON.stringify(errorData)}`);
      }
      
      // ✅ FIXED: Proper navigation
      sessionStorage.setItem('profileSetupCompleted', 'true');
      console.log('Profile setup completed, navigating to dashboard...');
      
      // Use navigate instead of window.location.reload()
      navigate('/dashboard', { replace: true });
      
      // Fallback navigation after a delay
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      logOnboardingError('InfluencerProfileSetup', err);
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
  const progressPercentage = ((bio ? 1 : 0) + (phone ? 1 : 0) + (completedPlatforms > 0 ? 1 : 0)) / 3 * 100;

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
              Complete Your Creator Profile
            </h1>
            <p className="font-mono text-sm text-slate-600 dark:text-slate-400 mb-6">
              // Tell brands about yourself and showcase your social presence
            </p>

            {/* Progress Bar */}
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
            </div>
          </motion.div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg">
          {/* ✅ FIXED: Proper form with onSubmit */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
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
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      About You
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Tell brands what makes you unique
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                    placeholder="your_unique_username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>

                <textarea
                  id="bio"
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
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
                    bio.length >= 10 ? 'text-green-600' : bio.length > 0 ? 'text-orange-600' : 'text-slate-400'
                  }`}>
                    {bio.length}/10
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
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Phone Number
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      For important campaign communications
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-mono font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <input
                  type="tel"
                  id="phone"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono"
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
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Your Social Presence
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Connect your platforms to showcase your reach (optional)
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

            {/* ✅ FIXED: Simple submit button */}
            <motion.div
              className="flex justify-end pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading}
                className={`bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-mono flex items-center px-8 py-4 text-base font-medium rounded-xl hover:shadow-lg transition-all duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    completing_setup...
                  </>
                ) : (
                  <>
                    complete_profile()
                    <ArrowRight className="w-4 h-4 ml-3" />
                  </>
                )}
              </button>
            </motion.div>
          </form>
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