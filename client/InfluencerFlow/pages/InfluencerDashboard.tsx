import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import axios from 'axios';

// Types
interface Campaign {
  id: number;
  campaign_name: string;
  description: string;
  start_date: string;
  end_date: string;
  status?: string;
  platforms?: string;
  budget?: number;
  brand_name?: string;
}

interface PromoPost {
  id: number;
  campaign_id: number;
  influencer_id: string;
  post_url: string;
  platform: string;
  created_at: string;
}

interface OutreachCampaign {
  id: string;
  campaign_id: number;
  influencer_id: string;
  influencer_username: string;
  influencer_email: string;
  influencer_followers: number;
  brand_id: string;
  email_subject: string;
  email_body: string;
  status: 'sent' | 'pending' | 'replied' | 'declined' | 'completed';
  sent_at: string;
  replied_at?: string;
  agreed_price?: number;
  contract_id?: string;
  created_at?: string;
  updated_at?: string;
  campaign?: Campaign;
}

const InfluencerDashboard = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promoPosts, setPromoPosts] = useState<PromoPost[]>([]);
  const [postUrl, setPostUrl] = useState('');
  const [platform, setPlatform] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Metrics
  const [totalReach, setTotalReach] = useState<number>(0);
  const [outreachCampaigns, setOutreachCampaigns] = useState<OutreachCampaign[]>([]);

  // Add state for influencer profile and Instagram posts
  const [ setInfluencerProfile] = useState<any>(null);
  const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  const [igPosts, setIgPosts] = useState<any[]>([]);
  const [igLoading, setIgLoading] = useState(false);
  const [igError, setIgError] = useState<string | null>(null);
  const [selectedIgPost, setSelectedIgPost] = useState<string>('');

  // Fetch campaigns and promo posts for this influencer
  useEffect(() => {
    const fetchUserAndData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (!uid) throw new Error('User not authenticated');
        setUserId(uid);
        
        // Fetch outreach records for this influencer (without embedding)
        const { data: outreachData, error: outreachError } = await supabase
          .from('outreach')
          .select('*')
          .eq('influencer_id', uid);
        if (outreachError) throw outreachError;
        
        setOutreachCampaigns(outreachData || []);
        
        // Get unique campaign IDs from outreach data
        const campaignIds = [...new Set((outreachData || []).map(o => o.campaign_id))];
        
        // Fetch campaigns separately using the campaign IDs
        if (campaignIds.length > 0) {
          const { data: campaignData, error: campaignError } = await supabase
            .from('campaign')
            .select('id, campaign_name, description, start_date, end_date, status, platforms, budget, brand_name')
            .in('id', campaignIds);
          if (campaignError) throw campaignError;
          
          setCampaigns(campaignData || []);
        } else {
          setCampaigns([]);
        }
        
        // Fetch promo posts for this influencer
        const { data: postData, error: postError } = await supabase
          .from('promo_posts')
          .select('*')
          .eq('influencer_id', uid);
        if (postError) throw postError;
        setPromoPosts(postData || []);
        
        // Calculate total reach (dummy: 25k per post)
        setTotalReach((postData?.length || 0) * 25000);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndData();
  }, []);

  // Fetch influencer profile (including platforms) on load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id;
        if (!uid) return;
        // Fetch influencer profile
        const { data, error } = await supabase
          .from('influencers')
          .select('platforms')
          .eq('id', uid)
          .single();
        if (error) return;
        setInfluencerProfile(data);
        // Parse Instagram username from platforms
        if (data && data.platforms) {
          try {
            const platformsArr = JSON.parse(data.platforms);
            const ig = platformsArr.find((p: any) => p.platform === 'Instagram' && p.url);
            if (ig && ig.url) {
              // Extract username from URL (e.g. https://instagram.com/username)
              const match = ig.url.match(/instagram.com\/(.+?)(\/|$)/);
              setInstagramUsername(match ? match[1] : null);
            } else {
              setInstagramUsername(null);
            }
          } catch (e) {
            setInstagramUsername(null);
          }
        } else {
          setInstagramUsername(null);
        }
      } catch (e) {
        setInfluencerProfile(null);
        setInstagramUsername(null);
      }
    };
    fetchProfile();
  }, []);

  // Fetch Instagram posts/reels if Instagram is selected and username exists
  useEffect(() => {
    console.log('DEBUG: useEffect triggered. platform:', platform, 'instagramUsername:', instagramUsername);
    const fetchInstagramPosts = async () => {
      if (platform !== 'Instagram' || !instagramUsername) {
        console.log('DEBUG: Not fetching IG posts. platform:', platform, 'instagramUsername:', instagramUsername);
        setIgPosts([]);
        return;
      }
      setIgLoading(true);
      setIgError(null);
      try {
        console.log('DEBUG: Fetching IG posts for username:', instagramUsername);
        const response = await axios.get(`/api/monitor/instagram-posts?username=${instagramUsername}`);
        console.log('DEBUG: Full IG posts response:', response.data);
        // Defensive: handle both { posts: [...] } and [...] directly
        let posts = [];
        if (Array.isArray(response.data)) {
          posts = response.data;
        } else if (response.data && Array.isArray(response.data.posts)) {
          posts = response.data.posts;
        } else if (typeof response.data === 'string' && response.data.startsWith('<!doctype html>')) {
          setIgError('Could not fetch Instagram posts. Please check your connection or try again later.');
          setIgPosts([]);
          console.error('DEBUG: Received HTML instead of JSON:', response.data);
          return;
        } else {
          setIgError('Unexpected response from server.');
          setIgPosts([]);
          console.error('DEBUG: Unexpected IG posts response:', response.data);
          return;
        }
        setIgPosts(posts || []);
        if (!posts || posts.length === 0) {
          setIgError('No posts found. Make sure your Instagram account is a business/creator account and is connected to the platform.');
        }
        console.log('DEBUG: IG posts fetched:', posts);
      } catch (err: any) {
        setIgError('Failed to fetch Instagram posts. Please check your connection or try again later.');
        setIgPosts([]);
        console.log('DEBUG: Error fetching IG posts:', err);
      } finally {
        setIgLoading(false);
      }
    };
    fetchInstagramPosts();
  }, [platform, instagramUsername]);

  // Submit a new promo post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    // If Instagram, require a selected post; else require postUrl
    if (!selectedCampaign || !platform || (platform === 'Instagram' ? !selectedIgPost : !postUrl)) {
      setError('Please select a campaign, platform, and enter/select the post.');
      return;
    }
    try {
      // For Instagram, store the post ID; for others, store the URL
      let postValue = '';
      if (platform === 'Instagram') {
        // selectedIgPost is the post ID
        postValue = selectedIgPost;
      } else {
        postValue = postUrl;
      }
      const { error: insertError } = await supabase
        .from('promo_posts')
        .insert([
          {
            campaign_id: selectedCampaign,
            influencer_id: userId,
            post_url: postValue, // If you have a post_id field, use that instead
            platform,
          },
        ]);
      if (insertError) throw insertError;
      setSuccess('Promotional post link submitted!');
      setPostUrl('');
      setPlatform('');
      setSelectedCampaign(null);
      setSelectedIgPost('');
      // Refresh posts
      const { data: postData } = await supabase
        .from('promo_posts')
        .select('*')
        .eq('influencer_id', userId);
      setPromoPosts(postData || []);
      setTotalReach((postData?.length || 0) * 25000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit post link');
    }
  };

  // Metrics for dashboard cards
  const metrics = [
    {
      title: 'Active Campaigns',
      value: campaigns.length,
      icon: '📢',
      color: 'from-blue-500 to-blue-600',
      subtitle: `${outreachCampaigns.length} total outreach received`,
    },
    {
      title: 'Posts Submitted',
      value: promoPosts.length,
      icon: '🔗',
      color: 'from-purple-500 to-purple-600',
      subtitle: 'Promotional posts submitted',
    },
    {
      title: 'Total Reach',
      value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : totalReach,
      icon: '👥',
      color: 'from-green-500 to-green-600',
      subtitle: 'Estimated audience reached',
    },
  ];

  // UI
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 mr-3">
              <img 
                src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
                alt="InfluencerFlow Logo" 
                className="w-full h-full object-contain animate-pulse" 
              />
            </div>
            <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
              InfluencerFlow
            </span>
          </div>
          <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-8 max-w-md mx-auto text-center">
          <div className="text-red-600 dark:text-red-400 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 dark:text-red-200 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 mr-3">
                <img 
                  src="https://assets.influencerflow.in/logos/png/if-bg-w.png" 
                  alt="InfluencerFlow Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                InfluencerFlow.in
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Creator Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">
              // Track your campaigns and submit promotional content
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              onClick={() => navigate('/contracts')}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg font-mono font-medium hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              view_contracts()
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/influencer-profile-setup')}
              className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 py-3 rounded-lg font-mono font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              edit_profile()
            </motion.button>
          </div>
        </motion.div>

        {/* Metrics Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {metrics.map((stat, idx) => (
            <motion.div
              key={idx}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">{stat.value}</span>
              </div>
              <h3 className="text-slate-700 dark:text-slate-300 font-medium mb-1">{stat.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{stat.subtitle}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Campaigns List */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">your_campaigns()</h2>
              </div>
              {campaigns.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {campaigns.map((campaign) => {
                    const progress = (() => {
                      const start = new Date(campaign.start_date);
                      const end = new Date(campaign.end_date);
                      const now = new Date();
                      if (now < start) return 0;
                      if (now > end) return 100;
                      const total = end.getTime() - start.getTime();
                      const elapsed = now.getTime() - start.getTime();
                      return Math.floor((elapsed / total) * 100);
                    })();
                    return (
                      <motion.div 
                        key={campaign.id} 
                        className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 bg-white dark:bg-slate-800"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{campaign.campaign_name}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">{campaign.brand_name || ''}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-xs font-mono font-medium border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                              {campaign.status || 'active'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {(() => {
                                const end = new Date(campaign.end_date);
                                const now = new Date();
                                const diff = end.getTime() - now.getTime();
                                if (diff <= 0) return 'completed';
                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                return `${days} days left`;
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">platforms</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{campaign.platforms || 'All'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">budget</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{campaign.budget ? `$${campaign.budget}` : '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">start_date</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{campaign.start_date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">end_date</p>
                            <p className="font-bold text-slate-900 dark:text-slate-100">{campaign.end_date}</p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
                          <div
                            className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-300 dark:to-slate-100 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{progress}% complete</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 font-mono">no_campaigns_yet()</h3>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">// You are not assigned to any campaigns yet</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit Post Link & Submitted Posts */}
          <div className="space-y-6">
            {/* Submit Post Link Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-mono">submit_promotional_post()</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 font-mono">select_campaign</label>
                    <select
                      value={selectedCampaign || ''}
                      onChange={e => setSelectedCampaign(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="" disabled>Select a campaign</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.campaign_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 font-mono">platform</label>
                    <select
                      value={platform}
                      onChange={e => {
                        setPlatform(e.target.value);
                        setSelectedIgPost('');
                        console.log('DEBUG: Platform changed to', e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="" disabled>Select platform</option>
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Twitter">Twitter</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {/* If Instagram is selected and username exists, show IG post dropdown */}
                  {platform === 'Instagram' && instagramUsername ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 font-mono">select_instagram_post</label>
                      {igLoading ? (
                        <div className="text-slate-500 dark:text-slate-400 text-sm font-mono">loading_posts...</div>
                      ) : igError ? (
                        <div className="text-red-500 dark:text-red-400 text-sm font-mono">{igError}</div>
                      ) : igPosts.length > 0 ? (
                        <select
                          value={selectedIgPost}
                          onChange={e => setSelectedIgPost(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="" disabled>Select a post</option>
                          {igPosts.map((post: any) => (
                            <option key={post.id} value={post.id}>{post.caption ? post.caption.substring(0, 50) : post.id}</option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  ) : (
                    // Fallback: regular URL input for other platforms or if no IG username
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 font-mono">post_url</label>
                      <input
                        type="url"
                        value={postUrl}
                        onChange={e => setPostUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://instagram.com/your-post"
                        required
                      />
                    </div>
                  )}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <div className="text-red-600 dark:text-red-400 text-sm font-mono">{error}</div>
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="text-green-600 dark:text-green-400 text-sm font-mono">{success}</div>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-3 rounded-lg font-mono font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    disabled={loading || (platform === 'Instagram' && !selectedIgPost)}
                  >
                    submit_post_link()
                  </button>
                </form>
              </div>
            </motion.div>

            {/* List of Submitted Posts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100 font-mono">submitted_posts()</h2>
                {promoPosts.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">// No posts submitted yet</p>
                ) : (
                  <div className="space-y-3">
                    {promoPosts.map(post => (
                      <div key={post.id} className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-4 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        <div className="flex flex-col space-y-2">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{campaigns.find(c => c.id === post.campaign_id)?.campaign_name || 'Campaign'}</div>
                          <div className="text-slate-700 dark:text-slate-300 text-sm font-mono">{post.platform}</div>
                          {post.platform === 'Instagram' ? (
                            <a
                              href={`https://instagram.com/p/${post.post_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline break-all text-sm font-mono hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              view_instagram_post() // ID: {post.post_url}
                            </a>
                          ) : (
                            <a
                              href={post.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline break-all text-sm font-mono hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              {post.post_url}
                            </a>
                          )}
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            // Submitted: {new Date(post.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluencerDashboard;