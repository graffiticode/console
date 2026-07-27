import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '../../../utils/db';
import { getPlan, overageDollarsToItems, DEFAULT_PLAN } from '../../../lib/plans-config';
import { emitEvent, actor } from '../../../lib/funnel-events';

// Set (or clear) a customer's overage spend cap. The client sends a dollar
// budget; we store it as a number of items using the plan's per-item rate. A
// null/absent limit means unlimited overage (billed in arrears via the meter).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limitUsd } = req.body ?? {};
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plan = userDoc.data()?.subscription?.plan || DEFAULT_PLAN;
    const planConfig = getPlan(plan);
    // null means "no cap" (unlimited), so it is the HIGHEST value, not the
    // lowest — the comparisons below have to treat it that way.
    const prevUsd = userDoc.data()?.subscription?.overageLimitUsd ?? null;

    // Clearing the cap.
    if (limitUsd === null || limitUsd === undefined || limitUsd === '') {
      await db.collection('users').doc(userId).update({
        'subscription.overageLimitItems': null,
        'subscription.overageLimitUsd': null,
      });
      if (prevUsd !== null) {
        emitEvent('overage_limit_raised', { ...actor({ uid: userId }), plan, from: String(prevUsd), to: 'unlimited' });
      }
      return res.status(200).json({ overageLimitItems: null, overageLimitUsd: null });
    }

    const usd = Number(limitUsd);
    if (!Number.isFinite(usd) || usd < 0) {
      return res.status(400).json({ error: 'limitUsd must be a non-negative number or null' });
    }

    // Free / contact-sales tiers have no overage path.
    if (planConfig.overageRatePerItem == null) {
      return res.status(400).json({ error: `Plan "${plan}" does not support overage` });
    }

    const overageLimitItems = overageDollarsToItems(plan, usd) ?? 0;
    await db.collection('users').doc(userId).update({
      'subscription.overageLimitItems': overageLimitItems,
      'subscription.overageLimitUsd': usd,
    });

    // Only an increase is the expansion signal. Coming down from unlimited
    // (prevUsd === null) is a tightening, however large the new number.
    if (prevUsd !== null && usd > prevUsd) {
      emitEvent('overage_limit_raised', { ...actor({ uid: userId }), plan, from: String(prevUsd), to: String(usd) });
    }

    return res.status(200).json({ overageLimitItems, overageLimitUsd: usd });
  } catch (error) {
    console.error('Error setting overage limit:', error);
    return res.status(500).json({
      error: 'Failed to set overage limit',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
