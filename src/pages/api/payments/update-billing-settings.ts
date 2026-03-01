import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '../../../utils/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, autoRecharge, autoRechargeLimit } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getFirestore();

    // Save the updated settings
    const settingsRef = db
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('billing');

    const updates: Record<string, any> = {
      autoRecharge: autoRecharge || false,
      autoRechargeLimit: autoRechargeLimit || 1,
      updatedAt: new Date().toISOString(),
    };

    // Clear disabled reason when re-enabling auto-recharge
    if (autoRecharge) {
      updates.autoRechargeDisabledReason = null;
      updates.autoRechargeDisabledAt = null;
    }

    const currentDoc = await settingsRef.get();

    if (currentDoc.exists) {
      await settingsRef.update(updates);
    } else {
      await settingsRef.set({
        ...updates,
        overageBlocksUsedThisPeriod: 0,
      });
    }

    return res.status(200).json({
      success: true,
      ...updates,
    });
  } catch (error) {
    console.error('Error updating billing settings:', error);
    return res.status(500).json({
      error: 'Failed to update billing settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}