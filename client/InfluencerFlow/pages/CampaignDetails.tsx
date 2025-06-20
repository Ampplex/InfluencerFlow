import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import axios from 'axios';
import monitoringApi from '../services/monitoringService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

interface Campaign {
  id: number;
  campaign_name: string;
  description: string;
  platforms: string;
  preferred_languages: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: string;
  brand_name: string;
}

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const fetchPostStats = async (post: any) => {
    let realTimeData = null;
    let fetchError = null;

    if (post.platform === 'Instagram') {
      const { data: influencer } = await supabase
        .from('influencers')
        .select('platforms, influencer_username')
        .eq('id', post.influencer_id)
        .single();
      let igUsername = null;
      if (influencer && influencer.platforms) {
        try {
          const platformsArr = JSON.parse(influencer.platforms);
          const ig = platformsArr.find((p: any) => p.platform === 'Instagram' && p.url);
          if (ig && ig.url) {
            const match = ig.url.match(/instagram.com\/(.+?)(\/|$)/);
            igUsername = match ? match[1] : null;
          }
        } catch {}
      }
      if (igUsername) {
        try {
          const igResp = await monitoringApi.post('/instagram/by-username-and-id', {
            username: igUsername,
            postId: post.post_url,
          });
          realTimeData = igResp.data;
        } catch (e: any) {
          fetchError = e?.response?.data?.error || 'Failed to fetch IG data';
        }
      } else {
        fetchError = 'No IG username';
      }
    } else if (post.platform === 'YouTube') {
      try {
        const ytResp = await monitoringApi.post('/youtube/monitor', {
          videoUrl: post.post_url,
        });
        realTimeData = ytResp.data;
      } catch (e: any) {
        fetchError = e?.response?.data?.error || 'Failed to fetch YT data';
      }
    }

    if (realTimeData) {
      const { error: updateError } = await supabase
        .from('promo_posts')
        .update({
          views: realTimeData.view_count || realTimeData.views || null,
          likes: realTimeData.like_count || realTimeData.likes || null,
          comments: realTimeData.comments_count || realTimeData.comments || null,
          last_monitored: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) {
        console.error('Failed to update post stats in DB', updateError);
        // We can still show the data, but maybe show a small warning
      }
    }
    
    // Update the state for the specific post
    setPosts(currentPosts => 
      currentPosts.map(p => 
        p.id === post.id 
          ? { ...p, realTime: realTimeData, error: fetchError } 
          : p
      )
    );
    return { ...post, realTime: realTimeData, error: fetchError };
  };

  useEffect(() => {
    async function fetchCampaign() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('campaign')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setCampaign(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch campaign');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCampaign();
  }, [id]);

  useEffect(() => {
    async function fetchInitialPosts() {
      if (!id) return;
      setPostsLoading(true);
      setPostsError(null);
      setPosts([]);
      try {
        const { data: promoPosts, error: promoError } = await supabase
          .from('promo_posts')
          .select('*, influencers(influencer_username)')
          .eq('campaign_id', id);

        if (promoError) throw promoError;
        
        const enrichedPosts = (promoPosts || []).map((post: any) => ({
          ...post,
          influencerUsername: post.influencers?.influencer_username || 'Unknown',
          realTime: {
            views: post.views,
            likes: post.likes,
            comments: post.comments,
          },
        }));

        setPosts(enrichedPosts);

        // Now, fetch live data for all posts
        enrichedPosts.forEach(post => fetchPostStats(post));

      } catch (err: any) {
        setPostsError(err.message || 'Failed to fetch campaign posts');
      } finally {
        setPostsLoading(false);
      }
    }
    fetchInitialPosts();
  }, [id]);

  // Prepare data for charts
  const engagementData = posts.map(post => ({
    name: post.influencerUsername || 'Post',
    likes: Number(post.realTime?.like_count || post.realTime?.likes || 0),
    comments: Number(post.realTime?.comments_count || post.realTime?.comments || 0),
    views: Number(post.realTime?.view_count || post.realTime?.views || 0),
    platform: post.platform,
    influencer: post.influencerUsername,
    date: post.realTime?.timestamp || post.realTime?.publishedAt || '-',
  }));

  const platformData = Object.entries(
    posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {})
  ).map(([platform, value]) => ({ name: platform, value }));

  const influencerEngagement = Object.values(
    posts.reduce((acc, post) => {
      const name = post.influencerUsername || 'Unknown';
      const likes = Number(post.realTime?.like_count || post.realTime?.likes || 0);
      const comments = Number(post.realTime?.comments_count || post.realTime?.comments || 0);
      const views = Number(post.realTime?.view_count || post.realTime?.views || 0);
      acc[name] = acc[name] || { name, likes: 0, comments: 0, views: 0 };
      acc[name].likes += likes;
      acc[name].comments += comments;
      acc[name].views += views;
      return acc;
    }, {})
  );

  const COLORS = ['#6366f1', '#06b6d4', '#f59e42', '#f43f5e', '#10b981', '#fbbf24'];

  return (
    <div className="space-y-8">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium"
          >
            ← Back to Dashboard
          </button>
          {loading ? (
            <div className="animate-pulse text-center py-16 text-lg text-gray-500">Loading campaign details...</div>
          ) : error ? (
            <div className="text-center py-16 text-red-600">{error}</div>
          ) : campaign ? (
            <div>
              <div className="mb-8 p-6 bg-white rounded-2xl shadow flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.campaign_name}</h1>
                  <div className="text-gray-600 mb-2">{campaign.description}</div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <span>Status: <span className="font-semibold capitalize">{campaign.status}</span></span>
                    <span>Platforms: <span className="font-semibold">{campaign.platforms}</span></span>
                    <span>Budget: <span className="font-semibold">${campaign.budget}</span></span>
                    <span>Start: <span className="font-semibold">{new Date(campaign.start_date).toLocaleDateString()}</span></span>
                    <span>End: <span className="font-semibold">{new Date(campaign.end_date).toLocaleDateString()}</span></span>
                    <span>Brand: <span className="font-semibold">{campaign.brand_name}</span></span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-2xl font-bold mb-4">Promo Posts</h2>
                {postsLoading ? (
                  <div className="animate-pulse text-center py-8 text-lg text-gray-500">Loading posts...</div>
                ) : postsError ? (
                  <div className="text-center py-8 text-red-600">{postsError}</div>
                ) : posts.length > 0 ? (
                  <ul className="space-y-4">
                    {posts.map(post => (
                      <li key={post.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex-grow">
                          <p className="font-semibold">{post.influencerUsername}</p>
                          <a
                            href={
                              post.platform === 'Instagram'
                                ? `https://www.instagram.com/p/${post.post_url}`
                                : post.post_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline truncate"
                          >
                            {post.platform === 'Instagram'
                              ? `instagram.com/p/${post.post_url}`
                              : post.post_url}
                          </a>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                            <span>Likes: {post.realTime?.likes ?? 'N/A'}</span>
                            <span>Comments: {post.realTime?.comments ?? 'N/A'}</span>
                            <span>Views: {post.realTime?.views ?? 'N/A'}</span>
                          </div>
                          {post.error && <p className="text-xs text-red-500 mt-1">{post.error}</p>}
                          {post.last_monitored && <p className="text-xs text-gray-400 mt-1">Last updated: {new Date(post.last_monitored).toLocaleString()}</p>}
                        </div>
                        <button
                          onClick={() => fetchPostStats(post)}
                          className="px-3 py-1.5 bg-indigo-500 text-white rounded-md text-sm hover:bg-indigo-600 disabled:bg-indigo-300"
                        >
                          Refresh Stats
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-gray-500">No promotional posts submitted for this campaign yet.</div>
                )}
              </div>
              {/* Charts Section - only show when data is loaded and posts exist */}
              {!loading && posts.length > 0 && (
                <>
                  {/* Show warning if any Instagram rate limit error is present */}
                  {posts.some(post => post.realTime && post.realTime.error && post.realTime.error.details && post.realTime.error.details.error && post.realTime.error.details.error.code === 4) && (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
                      Instagram data is temporarily unavailable due to API rate limits. Please try again later.
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                    {/* Engagement by Post */}
                    <div className="bg-white rounded-xl shadow p-6">
                      <h3 className="font-bold mb-4 text-lg text-gray-800">Engagement by Post</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={engagementData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" hide />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="likes" fill="#6366f1" name="Likes" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="comments" fill="#06b6d4" name="Comments" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="views" fill="#f59e42" name="Views" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Posts by Platform */}
                    <div className="bg-white rounded-xl shadow p-6">
                      <h3 className="font-bold mb-4 text-lg text-gray-800">Posts by Platform</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={platformData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label
                          >
                            {platformData.map((_, idx) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Top Influencers by Engagement */}
                    <div className="bg-white rounded-xl shadow p-6">
                      <h3 className="font-bold mb-4 text-lg text-gray-800">Top Influencers by Engagement</h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={influencerEngagement as any[]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="likes" fill="#8884d8" />
                          <Bar dataKey="comments" fill="#82ca9d" />
                          <Bar dataKey="views" fill="#ffc658" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
              {/* Optionally, show a loading spinner for charts if loading */}
              {loading && (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
} 