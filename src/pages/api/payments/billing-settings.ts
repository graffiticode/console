import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '../../../utils/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-08-01',
});

interface BillingSettings {
  autoRecharge: {
    enabled: boolean;
    threshold: number; // Percentage (0-100)
    amount: number; // Number of units to purchase
  };
  notifications: {
    emailOnLowBalance: boolean;
    emailOnPurchase: boolean;
    lowBalanceThreshold: number; // Percentage (0-100)
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const db = getFirestore();

  try {
    if (req.method === 'GET') {
      // Get billing settings
      const settingsDoc = await db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('billing')
        .get();

      const defaultSettings = {
        autoRecharge: false,
        autoRechargeLimit: 3,
        overageBlocksUsedThisPeriod: 0,
        // Extended settings for future use
        extended: {
          autoRecharge: {
            enabled: false,
            threshold: 20, // 20% remaining
            amount: 10000, // 10,000 units
          },
          notifications: {
            emailOnLowBalance: true,
            emailOnPurchase: true,
            lowBalanceThreshold: 25, // 25% remaining
          },
        }
      };

      // Get settings or use defaults
      let settings = defaultSettings;
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        settings = {
          autoRecharge: data?.autoRecharge || false,
          autoRechargeLimit: data?.autoRechargeLimit || 3,
          overageBlocksUsedThisPeriod: data?.overageBlocksUsedThisPeriod || 0,
          extended: data?.extended || defaultSettings.extended,
        };
      }

      return res.status(200).json(settings);
    } else if (req.method === 'PUT' || req.method === 'PATCH' || req.method === 'POST') {
      // Update billing settings - support both simple and extended formats
      const updates = req.body;

      // Handle simple format from UsageMonitor component
      if ('autoRecharge' in updates && typeof updates.autoRecharge === 'boolean') {
        // Simple format update
        const simpleUpdate = {
          autoRecharge: updates.autoRecharge,
          autoRechargeLimit: updates.autoRechargeLimit || 3,
          overageBlocksUsedThisPeriod: updates.overageBlocksUsedThisPeriod || 0,
        };

        // Save the updated settings
        const settingsRef = db
          .collection('users')
          .doc(userId)
          .collection('settings')
          .doc('billing');

        await settingsRef.set({
          ...simpleUpdate,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return res.status(200).json({
          success: true,
          ...simpleUpdate,
        });
      }

      // Handle extended format (for future use)
      if (updates.extended?.autoRecharge) {
        const { enabled, threshold, amount } = updates.extended.autoRecharge;

        if (enabled !== undefined && typeof enabled !== 'boolean') {
          return res.status(400).json({ error: 'autoRecharge.enabled must be a boolean' });
        }

        if (threshold !== undefined && (threshold < 0 || threshold > 100)) {
          return res.status(400).json({ error: 'autoRecharge.threshold must be between 0 and 100' });
        }

        if (amount !== undefined && amount < 1000) {
          return res.status(400).json({ error: 'autoRecharge.amount must be at least 1000 units' });
        }
      }

      // Save the updated settings
      const settingsRef = db
        .collection('users')
        .doc(userId)
        .collection('settings')
        .doc('billing');

      const currentDoc = await settingsRef.get();
      const currentSettings = currentDoc.exists ? currentDoc.data() : {};

      const mergedSettings = {
        ...currentSettings,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (currentDoc.exists) {
        await settingsRef.update(mergedSettings);
      } else {
        await settingsRef.set(mergedSettings);
      }

      // If auto-recharge is being enabled, verify payment method exists
      if (updates.autoRecharge?.enabled) {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (userData?.stripeCustomerId) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: userData.stripeCustomerId,
            type: 'card',
            limit: 1,
          });

          if (!paymentMethods.data.length) {
            return res.status(400).json({
              error: 'Cannot enable auto-recharge without a payment method',
              requiresPaymentMethod: true,
            });
          }
        } else {
          return res.status(400).json({
            error: 'Cannot enable auto-recharge without a payment method',
            requiresPaymentMethod: true,
          });
        }
      }

      return res.status(200).json({
        success: true,
        settings: mergedSettings,
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling billing settings:', error);
    return res.status(500).json({
      error: 'Failed to process billing settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}