// api/contracts/generate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contractData = req.body;
    const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save contract to database
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        id: contractId,
        template_id: `template_${Date.now()}`,
        influencer_id: contractData.influencer_id,
        brand_id: contractData.brand_id,
        status: 'PENDING_SIGNATURE',
        contract_data: contractData,
        payment_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);

  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
}