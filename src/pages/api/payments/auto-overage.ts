import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '../../../utils/db';
import { AUTO_OVERAGE_INCREMENTS } from '../../../lib/overage-pricing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, enabled } = req.body;
  if (!userId || typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'userId and boolean enabled are required' });
  }

  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = snap.data()?.subscription?.plan || 'demo';
    if (enabled && !AUTO_OVERAGE_INCREMENTS[plan]) {
      return res.status(400).json({ error: 'Automatic overage is not available for your plan' });
    }

    await userRef.update({ 'subscription.autoOverageEnabled': enabled });
    return res.status(200).json({ success: true, autoOverageEnabled: enabled });
  } catch (error) {
    console.error('Error updating auto-overage setting:', error);
    return res.status(500).json({
      error: 'Failed to update setting',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
