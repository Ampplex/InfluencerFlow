// api/contracts/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, role } = req.query;

    if (!user_id || !role) {
      return res.status(400).json({ error: 'user_id and role are required' });
    }

    let query = supabase.from('contracts').select('*');

    if (role === 'brand') {
      query = query.eq('brand_id', user_id);
    } else if (role === 'influencer') {
      query = query.eq('influencer_id', user_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json(data || []);

  } catch (error) {
    console.error('List contracts error:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
}