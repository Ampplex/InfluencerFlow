import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supabase from '../utils/supabase';
import axios from 'axios';
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
    async function fetchPosts() {
      if (!id) return;
      setPostsLoading(true);
      setPostsError(null);
      setPosts([]);
      try {
        const { data: promoPosts, error: promoError } = await supabase
          .from('promo_posts')
          .select('*')
          .eq('campaign_id', id);
        if (promoError) throw promoError;
        const enrichedPosts = await Promise.all(
          (promoPosts || []).map(async (post: any) => {
            if (post.platform === 'Instagram') {
              // Fetch influencer username and Instagram username
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
              const displayName = influencer?.influencer_username || '-';
              if (igUsername) {
                try {
                  const igResp = await axios.post('/api/monitor/instagram/by-username-and-id', {
                    username: igUsername,
                    postId: post.post_url,
                  });
                  return { ...post, realTime: igResp.data, influencerUsername: displayName };
                } catch (e: any) {
                  return { ...post, realTime: null, influencerUsername: displayName, error: e?.response?.data?.error || 'Failed to fetch IG data' };
                }
              } else {
                return { ...post, realTime: null, influencerUsername: displayName, error: 'No IG username' };
              }
            } else if (post.platform === 'YouTube') {
              try {
                const ytResp = await axios.post('/api/monitor/youtube/monitor', {
                  videoUrl: post.post_url,
                });
                // Fetch influencer_username for YouTube as well
                const { data: influencer } = await supabase
                  .from('influencers')
                  .select('influencer_username')
                  .eq('id', post.influencer_id)
                  .single();
                const displayName = influencer?.influencer_username || '-';
                return { ...post, realTime: ytResp.data, influencerUsername: displayName };
              } catch (e: any) {
                return { ...post, realTime: null, error: e?.response?.data?.error || 'Failed to fetch YT data' };
              }
            } else {
              // Fetch influencer_username for other platforms as well
              const { data: influencer } = await supabase
                .from('influencers')
                .select('influencer_username')
                .eq('id', post.influencer_id)
                .single();
              const displayName = influencer?.influencer_username || '-';
              return { ...post, realTime: null, influencerUsername: displayName };
            }
          })
        );
        setPosts(enrichedPosts);
      } catch (err: any) {
        setPostsError(err.message || 'Failed to fetch campaign posts');
      } finally {
        setPostsLoading(false);
      }
    }
    fetchPosts();
  }, [id]);

  // Prepare data for charts
  const engagementData = posts.map(post => ({
    name: post.realTime?.caption || post.realTime?.title || 'Post',
    likes: Number(post.realTime?.like_count || post.realTime?.likes || 0),
    comments: Number(post.realTime?.comments_count || post.realTime?.comments || 0),
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
      acc[name] = acc[name] || { name, likes: 0, comments: 0 };
      acc[name].likes += likes;
      acc[name].comments += comments;
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
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No promo posts found for this campaign.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border rounded-xl overflow-hidden bg-white">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-left">
                          <th className="py-3 px-4">Platform</th>
                          <th className="py-3 px-4">Influencer</th>
                          <th className="py-3 px-4">Preview</th>
                          <th className="py-3 px-4">Likes</th>
                          <th className="py-3 px-4">Comments</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map((post, idx) => (
                          <tr key={idx} className="border-b hover:bg-blue-50 transition">
                            <td className="py-3 px-4 font-medium">{post.platform}</td>
                            <td className="py-3 px-4">{post.influencerUsername || '-'}</td>
                            <td className="py-3 px-4">
                              {post.platform === 'Instagram' && post.realTime ? (
                                post.realTime.media_type === 'IMAGE' || post.realTime.media_type === 'CAROUSEL_ALBUM' ? (
                                  <img src={post.realTime.media_url} alt="Instagram Post" className="w-20 h-20 object-cover rounded" />
                                ) : post.realTime.media_type === 'VIDEO' ? (
                                  <video src={post.realTime.media_url} controls className="w-20 h-20 rounded" />
                                ) : null
                              ) : post.platform === 'YouTube' && post.realTime ? (
                                post.realTime.thumbnailUrl ? (
                                  <img src={post.realTime.thumbnailUrl} alt="YouTube Thumbnail" className="w-20 h-20 object-cover rounded" />
                                ) : (
                                  <span className="font-semibold">{post.realTime.title}</span>
                                )
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {post.platform === 'Instagram'
                                ? post.realTime?.like_count ?? '-'
                                : post.platform === 'YouTube'
                                ? post.realTime?.likes ?? '-'
                                : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {post.platform === 'Instagram'
                                ? post.realTime?.comments_count ?? '-'
                                : post.platform === 'YouTube'
                                ? post.realTime?.comments ?? '-'
                                : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {post.platform === 'Instagram'
                                ? post.realTime?.timestamp
                                  ? new Date(post.realTime.timestamp).toLocaleDateString()
                                  : '-'
                                : post.platform === 'YouTube'
                                ? post.realTime?.publishedAt
                                  ? new Date(post.realTime.publishedAt).toLocaleDateString()
                                  : '-'
                                : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {post.platform === 'Instagram' && post.realTime ? (
                                <a href={post.realTime.permalink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Instagram</a>
                              ) : post.platform === 'YouTube' && post.realTime ? (
                                <a href={`https://www.youtube.com/watch?v=${post.realTime.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">YouTube</a>
                              ) : (
                                <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 underline">Link</a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                            {platformData.map((entry, idx) => (
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
                        <BarChart data={influencerEngagement} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="likes" fill="#f59e42" name="Likes" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="comments" fill="#f43f5e" name="Comments" radius={[4, 4, 0, 0]} />
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