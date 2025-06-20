import supabase from '../utils/supabase';

// Types for influencer and brand profiles
export interface PlatformLink {
  platform: string;
  url: string;
}

export interface InfluencerProfile {
  id: string;
  bio: string;
  phone_num: string;
  platforms: string; // JSON stringified array
}

export interface BrandProfile {
  id: string;
  brand_name: string;
  brand_description: string;
  location: string;
  created_at?: string;
}

/**
 * Get the current user session and userId
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
}

/**
 * Check if influencer profile is complete (bio and platforms must be set)
 */
// Removed the async API-based isInfluencerProfileComplete

/**
 * Check if brand profile is complete (brand_name, brand_description, location must be set)
 */
export async function isBrandProfileComplete(userId: string, authToken: string): Promise<boolean> {
  const headers = getApiHeaders(authToken);
  const response = await fetch(
    `${supabaseUrl()}/rest/v1/brands?id=eq.${userId}&select=brand_name,brand_description,location`,
    { headers }
  );
  if (!response.ok) return false;
  const data = await response.json();
  return !!(data.length && data[0].brand_name && data[0].brand_description && data[0].location);
}

/**
 * Upsert influencer profile
 */
export async function upsertInfluencerProfile(profile: InfluencerProfile, authToken: string): Promise<Response> {
  const headers = getApiHeaders(authToken);
  return fetch(
    `${supabaseUrl()}/rest/v1/influencers?id=eq.${profile.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        bio: profile.bio,
        phone_num: profile.phone_num,
        platforms: profile.platforms,
      })
    }
  );
}

/**
 * Upsert brand profile (POST then PATCH fallback)
 */
export async function upsertBrandProfile(profile: BrandProfile, authToken: string): Promise<Response> {
  const headers = getApiHeaders(authToken);
  // Try POST first
  const postRes = await fetch(
    `${supabaseUrl()}/rest/v1/brands`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(profile)
    }
  );
  if (postRes.ok) return postRes;
  // If POST fails (row exists), PATCH
  return fetch(
    `${supabaseUrl()}/rest/v1/brands?id=eq.${profile.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        brand_name: profile.brand_name,
        brand_description: profile.brand_description,
        location: profile.location,
      })
    }
  );
}

/**
 * Get API headers for direct REST calls
 */
export function getApiHeaders(authToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'prefer': 'return=representation',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODM5NDgsImV4cCI6MjA0MTI1OTk0OH0.cs_yQnvzrK-8CRYyvlbzfbhZhIqdC3X9fO-UugRCGuI',
    'Authorization': `Bearer ${authToken}`
  };
}

/**
 * Get Supabase REST API base URL
 */
export function supabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || 'https://eepxrnqcefpvzxqkpjaw.supabase.co';
}

/**
 * Log errors with context
 */
export function logOnboardingError(context: string, error: any) {
  console.error(`[Onboarding][${context}]`, error);
}

// Utility: Check if influencer profile is complete
export function isInfluencerProfileComplete(profile: any): boolean {
  if (!profile) return false;
  const bioValid = typeof profile.bio === 'string' && profile.bio.trim().length >= 10;
  const usernameValid = typeof profile.influencer_username === 'string' && profile.influencer_username.trim().length >= 3 && !profile.influencer_username.includes(' ');
  const emailValid = typeof profile.influencer_email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.influencer_email);
  const phoneValid = typeof profile.phone_num === 'string' && /^\d{7,20}$/.test(profile.phone_num);
  let platformsValid = false;
  try {
    const platformsArr = JSON.parse(profile.platforms || '[]');
    platformsValid = Array.isArray(platformsArr) && platformsArr.some((p: any) => p.url && p.url.trim() !== '');
  } catch {
    platformsValid = false;
  }
  return bioValid && usernameValid && emailValid && phoneValid && platformsValid;
} 