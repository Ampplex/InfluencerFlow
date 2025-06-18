// netlify/functions/lib/supabase.ts - Minimal update for invitation codes
import { createClient } from '@supabase/supabase-js';
import type { EarlyAccessRequest } from './types';

// Use SERVICE ROLE key for server-side operations (bypasses RLS)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Create client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Keep your existing earlyAccessService - it's fine!
export const earlyAccessService = {
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('early_access_requests')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Failed to check email exists:', error);
      throw error;
    }
  },

  async create(data: {
    name: string;
    email: string;
    brand: string;
    business_help?: string;
    origin_domain: string;
    user_agent?: string;
    ip_address?: string;
    request_fingerprint?: string;
  }): Promise<EarlyAccessRequest> {
    try {
      console.log('Inserting data:', {
        name: data.name,
        email: data.email,
        brand: data.brand,
        origin_domain: data.origin_domain
      });

      const { data: result, error } = await supabase
        .from('early_access_requests')
        .insert([{
          name: data.name,
          email: data.email.toLowerCase(), // 🔥 Ensure lowercase for consistency
          brand: data.brand,
          business_help: data.business_help || null,
          origin_domain: data.origin_domain,
          user_agent: data.user_agent || null,
          ip_address: data.ip_address || null,
          request_fingerprint: data.request_fingerprint || null,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        
        if (error.code === '23505') {
          throw new Error('This email has already been registered for early access.');
        }
        
        if (error.code === '42501') {
          throw new Error('Database permission error. Please contact support.');
        }
        
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Successfully inserted:', result.id);
      return result as EarlyAccessRequest;
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }
};

// 🔥 Add helper function for masking IPs (used by admin-data.ts)
export const maskIP = (ip: string): string => {
  if (!ip || ip === 'unknown') return 'unknown';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return 'masked';
};