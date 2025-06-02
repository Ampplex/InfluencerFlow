// api/payments/create-order.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contract_id, amount, currency = 'USD' } = req.body;

    if (!contract_id || !amount) {
      return res.status(400).json({ error: 'contract_id and amount are required' });
    }

    const options = {
      amount: amount, // Amount in cents (for USD)
      currency: currency,
      receipt: `contract_${contract_id}_${Date.now()}`,
      notes: {
        contract_id: contract_id,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
}