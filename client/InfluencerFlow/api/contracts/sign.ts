// api/contracts/sign.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    const contractId = Array.isArray(fields.contract_id) ? fields.contract_id[0] : fields.contract_id;
    const userId = Array.isArray(fields.user_id) ? fields.user_id[0] : fields.user_id;
    const signatureFile = Array.isArray(files.signature_file) ? files.signature_file[0] : files.signature_file;

    if (!contractId || !userId || !signatureFile) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real implementation, you'd upload the signature file to storage
    const signatureUrl = `https://storage.example.com/signatures/${contractId}_${Date.now()}.png`;

    // Update contract with signature
    const { data, error } = await supabase
      .from('contracts')
      .update({
        status: 'SIGNED',
        signed_by: userId,
        signed_at: new Date().toISOString(),
        signature_url: signatureUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Contract signing error:', error);
    res.status(500).json({ error: 'Failed to sign contract' });
  }
}