import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from '../../../utils/db';
import admin from '../../../utils/db';

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

    // Get current billing period (monthly)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Query usage data for the current billing period
    const usageRef = db.collection('usage').doc(userId);
    const usageDoc = await usageRef.get();

    let totalUsage = 0;
    let dailyUsage: DailyUsage[] = [];
    let lastUpdate: string | null = null;

    if (usageDoc.exists) {
      const data = usageDoc.data();
      totalUsage = data?.currentMonthTotal || 0;
      lastUpdate = data?.lastUpdate || null;

      // Get daily breakdown if available
      const dailyRef = await db
        .collection('usage')
        .doc(userId)
        .collection('daily')
        .where('timestamp', '>=', firstDayOfMonth)
        .where('timestamp', '<=', lastDayOfMonth)
        .orderBy('timestamp', 'asc')
        .get();

      dailyUsage = dailyRef.docs.map(doc => {
        const data = doc.data();
        return {
          date: data.timestamp.toDate().toISOString().split('T')[0],
          count: data.count || 0,
        };
      });
    }

    // Get subscription info to determine limits
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Determine plan limits
    let planUnits = 1000; // Default free tier
    let overageUnits = 0;

    if (userData?.subscription?.plan === 'pro') {
      planUnits = 50000;
    } else if (userData?.subscription?.plan === 'teams') {
      planUnits = 1000000;
    }

    overageUnits = userData?.subscription?.overageUnits || 0;

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
      const daysElapsed = Math.ceil((now.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
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
      allocatedUnits: planUnits,
      overageUnits: overageUnits,
      lastResetDate: firstDayOfMonth.toISOString(),
      currentPeriodEnd: lastDayOfMonth.toISOString(),
      // Additional data for potential future use
      extended: {
        currentPeriod: {
          start: firstDayOfMonth.toISOString(),
          end: lastDayOfMonth.toISOString(),
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