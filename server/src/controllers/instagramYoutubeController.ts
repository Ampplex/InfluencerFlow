import { Request, Response } from 'express';
import axios from 'axios';
import { google } from 'googleapis';
import 'dotenv/config';

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

function getMediaIdFromUrl(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function getVideoIdFromUrl(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export class InstagramYoutubeController {
  // POST /api/instagram/monitor
  async monitorInstagramPost(req: Request, res: Response) {
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
      const mediaList = response.data.media?.data || [];
      // Find the post or reel by matching the code in the permalink
      const targetPost = mediaList.find((post: any) => post.permalink.includes(mediaCode));
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
    } catch (err: any) {
      console.error('Error fetching post info:', err.message);
      return res.status(500).json({ error: 'Failed to fetch Instagram post info', details: err.response?.data || err.message });
    }
  }

  // POST /api/youtube/monitor
  async monitorYoutubeVideo(req: Request, res: Response) {
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
      const yt: any = youtube;
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
      });
    } catch (err: any) {
      console.error('Error fetching YouTube video info:', err.message);
      return res.status(500).json({ error: 'Failed to fetch YouTube video info', details: err.message });
    }
  }
} 