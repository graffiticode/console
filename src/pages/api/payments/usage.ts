import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '../../../utils/db';
import admin from '../../../utils/db';
import Stripe from 'stripe';

// Initialize Stripe only if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-08-01',
  });
}

// Map Stripe product/price IDs to our plan names
const PLAN_MAPPING: Record<string, 'free' | 'pro' | 'teams'> = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_TEAMS_MONTHLY_PRICE_ID || '']: 'teams',
  [process.env.STRIPE_TEAMS_ANNUAL_PRICE_ID || '']: 'teams',
};

interface UsageData {
  compilations: number;
  timestamp: string;
}

interface DailyUsage {
  date: string;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const db = getFirestore();
    const now = new Date();

    // Get user's subscription to determine billing period
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    let firstDayOfPeriod: Date;
    let lastDayOfPeriod: Date;
    let billingInterval: 'monthly' | 'annual' | null = null;
    let currentPlan: 'free' | 'pro' | 'teams' = 'free';

    // Try to get billing period and plan from Stripe subscription
    if (stripeCustomerId && stripe) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          // Use Stripe billing period
          firstDayOfPeriod = new Date(subscription.current_period_start * 1000);
          lastDayOfPeriod = new Date(subscription.current_period_end * 1000);

          // Get billing interval and plan
          const priceId = subscription.items.data[0]?.price.id;
          const priceInterval = subscription.items.data[0]?.price.recurring?.interval;
          billingInterval = priceInterval === 'year' ? 'annual' : priceInterval === 'month' ? 'monthly' : null;
          currentPlan = PLAN_MAPPING[priceId] || 'free';
        } else {
          // No active subscription, use calendar month
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          firstDayOfPeriod = new Date(currentYear, currentMonth, 1);
          lastDayOfPeriod = new Date(currentYear, currentMonth + 1, 0);
        }
      } catch (error) {
        console.error('Error fetching Stripe subscription for billing period:', error);
        // Fall back to calendar month on error
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        firstDayOfPeriod = new Date(currentYear, currentMonth, 1);
        lastDayOfPeriod = new Date(currentYear, currentMonth + 1, 0);
      }
    } else {
      // No Stripe customer - free users don't have billing periods normally
      // But check if there's a preserved renewal date from a downgrade
      const preservedRenewalDate = userData?.subscription?.renewalDate;
      const preservedUntil = userData?.subscription?.preservedUntil;

      if (preservedRenewalDate || preservedUntil) {
        // Use the preserved dates from the downgrade
        const renewalDate = preservedUntil || preservedRenewalDate;
        lastDayOfPeriod = new Date(renewalDate);

        // Calculate the start of the period (assuming monthly for now)
        firstDayOfPeriod = new Date(lastDayOfPeriod);
        firstDayOfPeriod.setMonth(firstDayOfPeriod.getMonth() - 1);
      } else {
        // No preserved dates - use account creation date as the start
        const accountCreated = userData?.created ? new Date(userData.created) : now;
        firstDayOfPeriod = accountCreated;
        lastDayOfPeriod = new Date('2099-12-31'); // Far future date (no reset for free users)
      }
    }

    // Query usage data for the current billing period
    const usageRef = db.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();

    let totalUsage = 0;
    let compileUsage = 0;
    let codeGenerationUsage = 0;
    let dailyUsage: DailyUsage[] = [];
    let lastUpdate: string | null = null;

    if (usageDoc.exists) {
      const data = usageDoc.data();

      // Check if we need to reset monthly usage (new billing period)
      const lastReset = data?.lastReset ? new Date(data.lastReset) : null;
      const needsReset = lastReset && lastReset < firstDayOfPeriod;

      if (needsReset) {
        // The stored total is from a previous period, so we should reset it
        console.log('Monthly usage needs reset - using 0 for stored total');
        totalUsage = 0;
      } else {
        // For free users (no Stripe customer), use lifetime total
        // For paid users, use current period total
        if (!stripeCustomerId) {
          totalUsage = data?.lifetimeTotal || data?.currentMonthTotal || 0;
        } else {
          totalUsage = data?.currentMonthTotal || 0;
        }
      }
      lastUpdate = data?.lastUpdate || null;

      // Get usage breakdown by type from individual usage records
      try {
        const usageRecordsSnapshot = await db
          .collection('usage')
          .where('userId', '==', userId)
          .where('createdAt', '>=', firstDayOfPeriod)
          .where('createdAt', '<=', lastDayOfPeriod)
          .get();

        compileUsage = 0;
        codeGenerationUsage = 0;
        let calculatedTotal = 0;

        usageRecordsSnapshot.docs.forEach(doc => {
          const record = doc.data();
          const units = record.units || 0;
          calculatedTotal += units;
          if (record.type === 'compile') {
            compileUsage += units;
          } else if (record.type === 'ai_generation') {
            codeGenerationUsage += units;
          }
        });

        // Use the calculated total from actual records if it's higher than stored total
        // This handles cases where the stored total might be out of sync
        if (calculatedTotal > totalUsage) {
          console.log(`Using calculated total (${calculatedTotal}) instead of stored total (${totalUsage})`);
          totalUsage = calculatedTotal;
        }
      } catch (breakdownError) {
        console.error('Error fetching usage breakdown (may need Firestore index):', breakdownError);
        // Fall back to using total usage as compile usage when breakdown is not available
        // This prevents showing an "Other" category when we can't determine the breakdown
        compileUsage = totalUsage;
        codeGenerationUsage = 0;
      }

      // Get daily breakdown if available
      try {
        const dailyRef = await db
          .collection('usage')
          .doc(userId)
          .collection('daily')
          .where('timestamp', '>=', firstDayOfPeriod)
          .where('timestamp', '<=', lastDayOfPeriod)
          .orderBy('timestamp', 'asc')
          .get();

        dailyUsage = dailyRef.docs.map(doc => {
          const data = doc.data();
          return {
            date: data.timestamp.toDate().toISOString().split('T')[0],
            count: data.count || 0,
          };
        });
      } catch (dailyError) {
        console.error('Error fetching daily usage breakdown:', dailyError);
        // Continue without daily breakdown
        dailyUsage = [];
      }
    }

    // Determine plan limits from Stripe subscription
    // Base units are monthly - multiply by 12 for annual plans
    const baseUnitAllocation = {
      free: 2000,      // Updated to match Starter plan
      pro: 100000,     // Updated to match current Pro plan
      teams: 2000000,  // Updated to match current Teams plan
    };

    // Check if we should use preserved allocation (from a downgrade)
    const preservedUntil = userData?.subscription?.preservedUntil;
    const preservedAllocation = userData?.subscription?.preservedAllocation;
    const hasPreservedAllocation = preservedUntil && preservedAllocation && new Date(preservedUntil) > now;

    let planUnits;
    if (hasPreservedAllocation) {
      // Use the preserved allocation from the previous plan
      planUnits = preservedAllocation;
      console.log('Using preserved allocation:', {
        preservedAllocation,
        preservedUntil,
        originalPlan: currentPlan
      });
    } else {
      // Use the normal plan allocation
      planUnits = baseUnitAllocation[currentPlan];

      // Multiply by 12 for annual billing cycles
      if (billingInterval === 'annual') {
        planUnits = planUnits * 12;
      }
    }

    const overageUnits = userData?.subscription?.overageUnits || 0;

    const totalUnits = planUnits + overageUnits;
    const remainingUnits = Math.max(0, totalUnits - totalUsage);
    const percentageUsed = totalUnits > 0 ? (totalUsage / totalUnits) * 100 : 0;

    // Calculate usage trend (last 7 days average vs previous 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const lastWeekUsage = dailyUsage
      .filter(d => new Date(d.date) >= sevenDaysAgo)
      .reduce((sum, d) => sum + d.count, 0);

    const previousWeekUsage = dailyUsage
      .filter(d => new Date(d.date) >= fourteenDaysAgo && new Date(d.date) < sevenDaysAgo)
      .reduce((sum, d) => sum + d.count, 0);

    let trend = 'stable';
    if (lastWeekUsage > previousWeekUsage * 1.1) trend = 'increasing';
    if (lastWeekUsage < previousWeekUsage * 0.9) trend = 'decreasing';

    // Calculate estimated end date based on current usage rate
    let estimatedEndDate = null;
    if (totalUsage > 0 && remainingUnits > 0) {
      const daysElapsed = Math.ceil((now.getTime() - firstDayOfPeriod.getTime()) / (1000 * 60 * 60 * 24));
      const averageDailyUsage = totalUsage / daysElapsed;
      if (averageDailyUsage > 0) {
        const daysRemaining = Math.ceil(remainingUnits / averageDailyUsage);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + daysRemaining);
        estimatedEndDate = endDate.toISOString();
      }
    }

    // Return data in the format expected by UsageMonitor component
    return res.status(200).json({
      currentPeriodUnits: totalUsage,
      compileUnits: compileUsage,
      codeGenerationUnits: codeGenerationUsage,
      allocatedUnits: planUnits,
      overageUnits: overageUnits,
      lastResetDate: firstDayOfPeriod.toISOString(),
      currentPeriodEnd: lastDayOfPeriod.toISOString(),
      // Additional data for potential future use
      extended: {
        currentPeriod: {
          start: firstDayOfPeriod.toISOString(),
          end: lastDayOfPeriod.toISOString(),
        },
        usage: {
          total: totalUsage,
          limit: totalUnits,
          remaining: remainingUnits,
          percentage: Math.round(percentageUsed * 10) / 10,
        },
        dailyUsage,
        trend,
        estimatedEndDate,
        lastUpdate,
      }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return res.status(500).json({
      error: 'Failed to fetch usage data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}