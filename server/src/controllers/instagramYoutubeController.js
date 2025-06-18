const axios = require('axios');
const { google } = require('googleapis');
require('dotenv/config');

const IG_BUSINESS_ID = process.env.IG_BUSINESS_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const MEDIA_FIELDS = [
  'id',
  'caption',
  'media_type',
  'media_url',
  'thumbnail_url',
  'timestamp',
  'permalink',
  'like_count',
  'comments_count',
  'media_product_type',
].join(',');

// In-memory cache for Instagram post responses
// For production, replace this with Redis or another persistent cache
const igPostCache = {};
const IG_CACHE_TTL = 10 * 600 * 1000; // 10 minutes in ms

function getMediaIdFromUrl(url) {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function getVideoIdFromUrl(url) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

module.exports = class InstagramYoutubeController {
  // POST /api/instagram/monitor
  async monitorInstagramPost(req, res) {
    const { postUrl } = req.body;
    if (!postUrl) {
      return res.status(400).json({ error: 'Missing postUrl' });
    }
    // Extract media code from the URL
    const mediaCode = getMediaIdFromUrl(postUrl);
    if (!mediaCode) {
      return res.status(400).json({ error: 'Invalid Instagram post URL' });
    }
    try {
      // Fetch all media for the business account
      const url = `https://graph.facebook.com/v19.0/${IG_BUSINESS_ID}?fields=media{caption,media_type,media_url,timestamp,permalink,like_count,comments_count}&access_token=${ACCESS_TOKEN}`;
      const response = await axios.get(url);
      const mediaList = (response.data.media && response.data.media.data) || [];
      // Find the post or reel by matching the code in the permalink
      const targetPost = mediaList.find(post => post.permalink.includes(mediaCode));
      if (!targetPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
      // Return only the required fields
      return res.json({
        id: targetPost.id,
        caption: targetPost.caption,
        mediaType: targetPost.media_type,
        mediaUrl: targetPost.media_url,
        timestamp: targetPost.timestamp,
        permalink: targetPost.permalink,
        likeCount: targetPost.like_count,
        commentCount: targetPost.comments_count
      });
    } catch (err) {
      console.error('Error fetching post info:', err.message);
      return res.status(500).json({ error: 'Failed to fetch Instagram post info', details: (err.response && err.response.data) || err.message });
    }
  }

  // POST /api/youtube/monitor
  async monitorYoutubeVideo(req, res) {
    const { videoUrl } = req.body;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing videoUrl' });
    }
    const videoId = getVideoIdFromUrl(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    try {
      const youtube = google.youtube({
        version: 'v3',
        auth: YOUTUBE_API_KEY,
      });
      const yt = youtube;
      const { data } = await yt.videos.list({
        part: 'snippet,contentDetails,statistics,liveStreamingDetails',
        id: videoId,
      });
      if (!data.items || !data.items.length) {
        return res.status(404).json({ error: 'Video not found' });
      }
      const info = data.items[0];
      return res.json({
        id: info.id,
        title: info.snippet.title,
        description: info.snippet.description,
        channelTitle: info.snippet.channelTitle,
        publishedAt: info.snippet.publishedAt,
        duration: info.contentDetails.duration,
        views: info.statistics.viewCount,
        likes: info.statistics.likeCount,
        comments: info.statistics.commentCount,
        thumbnailUrl: info.snippet.thumbnails && info.snippet.thumbnails.default && info.snippet.thumbnails.default.url,
      });
    } catch (err) {
      console.error('Error fetching YouTube video info:', err.message);
      return res.status(500).json({ error: 'Failed to fetch YouTube video info', details: err.message });
    }
  }

  // GET /api/instagram-posts?username=USERNAME
  async getInstagramPosts(req, res) {
    console.log('GET /api/monitor/instagram-posts', req.query);
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Missing username' });
    }
    try {
      const url = `https://graph.facebook.com/v19.0/${IG_BUSINESS_ID}?fields=business_discovery.username(${username}){media.limit(20){${MEDIA_FIELDS}}}&access_token=${ACCESS_TOKEN}`;
      const response = await axios.get(url);
      const media = (response.data.business_discovery && response.data.business_discovery.media && response.data.business_discovery.media.data) || [];
      console.log('Business Discovery API response:', JSON.stringify(response.data, null, 2));
      // Return only the required fields for dropdown
      const posts = media.map(item => ({
        id: item.id,
        caption: item.caption || '',
        media_type: item.media_type,
        thumbnail_url: item.thumbnail_url,
        timestamp: item.timestamp,
        permalink: item.permalink,
        like_count: item.like_count,
        comments_count: item.comments_count,
        media_product_type: item.media_product_type || '',
      }));
      return res.json({ posts });
    } catch (err) {
      console.error('Error fetching Instagram posts:', (err.response && err.response.data) || err.message);
      return res.status(500).json({ error: 'Failed to fetch Instagram posts', details: (err.response && err.response.data) || err.message });
    }
  }

  // Add new method to fetch a specific Instagram post by username and postId
  async getInstagramPostByUsernameAndId(req, res) {
    const { username, postId } = req.body;
    if (!username || !postId) {
      return res.status(400).json({ error: 'Missing username or postId' });
    }
    // Cache key per username+postId
    const cacheKey = `${username}:${postId}`;
    const now = Date.now();
    // Check cache
    if (
      igPostCache[cacheKey] &&
      (now - igPostCache[cacheKey].timestamp < IG_CACHE_TTL)
    ) {
      // Return cached response
      return res.json(igPostCache[cacheKey].data);
    }
    try {
      const url = `https://graph.facebook.com/v19.0/${IG_BUSINESS_ID}?fields=business_discovery.username(${username}){media.limit(100){${MEDIA_FIELDS}}}&access_token=${ACCESS_TOKEN}`;
      const response = await axios.get(url);
      const media = (response.data.business_discovery && response.data.business_discovery.media && response.data.business_discovery.media.data) || [];
      const post = media.find(m => m.id === postId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found for this user' });
      }
      // Cache the response
      igPostCache[cacheKey] = {
        data: post,
        timestamp: now,
      };
      return res.json(post);
    } catch (err) {
      return res.status(500).json({
        error: 'Failed to fetch Instagram post',
        details: (err.response && err.response.data) || err.message,
      });
    }
  }
}; 