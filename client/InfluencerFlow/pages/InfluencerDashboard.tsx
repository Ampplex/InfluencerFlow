import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';

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
        // Fetch campaigns assigned to this influencer (future: join table)
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaign')
          .select('id, campaign_name, description, start_date, end_date, status, platforms, budget, brand_name');
        if (campaignError) throw campaignError;
        setCampaigns(campaignData || []);
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

  // Submit a new promo post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!selectedCampaign || !postUrl || !platform) {
      setError('Please select a campaign, platform, and enter the post URL.');
      return;
    }
    try {
      const { error: insertError } = await supabase
        .from('promo_posts')
        .insert([
          {
            campaign_id: selectedCampaign,
            influencer_id: userId,
            post_url: postUrl,
            platform,
          },
        ]);
      if (insertError) throw insertError;
      setSuccess('Promotional post link submitted!');
      setPostUrl('');
      setPlatform('');
      setSelectedCampaign(null);
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
      title: 'Total Campaigns',
      value: campaigns.length,
      icon: '📢',
      color: 'from-blue-500 to-blue-600',
      subtitle: 'Campaigns you can participate in',
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h3>
          <p className="text-gray-600">Fetching your campaign data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Influencer Dashboard</h1>
            <p className="text-gray-600">Track your campaigns, submit posts, and monitor your reach.</p>
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
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-2xl`}>
                  {stat.icon}
                </div>
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <h3 className="text-gray-600 font-medium mb-1">{stat.title}</h3>
              <p className="text-xs text-gray-500">{stat.subtitle}</p>
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Your Campaigns</h2>
              </div>
              {campaigns.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
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
                      <div key={campaign.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                            <p className="text-sm text-gray-600">{campaign.brand_name || ''}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium border border-blue-200 bg-blue-50 text-blue-800">
                              {campaign.status || 'active'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                const end = new Date(campaign.end_date);
                                const now = new Date();
                                const diff = end.getTime() - now.getTime();
                                if (diff <= 0) return 'Completed';
                                const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                return `${days} days left`;
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500">Platforms</p>
                            <p className="font-semibold">{campaign.platforms || 'All'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="font-semibold">{campaign.budget ? `$${campaign.budget}` : '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Start</p>
                            <p className="font-semibold">{campaign.start_date}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">End</p>
                            <p className="font-semibold">{campaign.end_date}</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">{progress}% complete</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                  <p className="text-gray-600 mb-4">You are not assigned to any campaigns yet.</p>
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Promotional Post</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Campaign</label>
                    <select
                      value={selectedCampaign || ''}
                      onChange={e => setSelectedCampaign(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="" disabled>Select a campaign</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.campaign_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                    <select
                      value={platform}
                      onChange={e => setPlatform(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Post URL</label>
                    <input
                      type="url"
                      value={postUrl}
                      onChange={e => setPostUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://instagram.com/your-post"
                      required
                    />
                  </div>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  {success && <div className="text-green-600 text-sm">{success}</div>}
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md font-semibold shadow hover:from-indigo-700 hover:to-purple-700"
                    disabled={loading}
                  >
                    Submit Post Link
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
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4">Your Submitted Promotional Posts</h2>
                {promoPosts.length === 0 ? (
                  <p className="text-gray-500">No posts submitted yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {promoPosts.map(post => (
                      <li key={post.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{campaigns.find(c => c.id === post.campaign_id)?.campaign_name || 'Campaign'}</div>
                          <div className="text-gray-700 text-sm">{post.platform}</div>
                          <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all text-sm">{post.post_url}</a>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 md:mt-0">Submitted: {new Date(post.created_at).toLocaleString()}</div>
                      </li>
                    ))}
                  </ul>
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

// Integration steps:
// 1. Link campaigns to influencers (assignments table or join logic)
// 2. Show only assigned campaigns to influencer
// 3. Notify brand in real time (subscription or polling)
// 4. Show post analytics to brand (fetch from platform APIs)
// 5. Add approval/review flow for brands 