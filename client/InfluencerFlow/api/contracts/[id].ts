// api/contracts/[id].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.status(200).json(data);

    } catch (error) {
      console.error('Get contract error:', error);
      res.status(500).json({ error: 'Failed to fetch contract' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}