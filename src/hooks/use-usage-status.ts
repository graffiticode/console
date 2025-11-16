import useSWR from 'swr';
import axios from 'axios';

interface UsageData {
  currentPeriodUnits: number;
  allocatedUnits: number;
  overageUnits: number;
  extended?: {
    usage?: {
      total: number;
      limit: number;
      remaining: number;
      percentage: number;
    };
  };
}

interface UsageStatus {
  isOverLimit: boolean;
  isNearLimit: boolean;
  remainingUnits: number;
  percentageUsed: number;
  totalUnits: number;
  usedUnits: number;
  loading: boolean;
  error: any;
}

const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export function useUsageStatus(userId: string | undefined): UsageStatus {
  // Refresh every 30 seconds when over limit, otherwise every 60 seconds
  const { data, error, mutate } = useSWR<UsageData>(
    userId ? `/api/payments/usage?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data) return 60000; // 60 seconds default
        const remaining = data.extended?.usage?.remaining || 0;
        return remaining < 0 ? 30000 : 60000; // 30s when over, 60s otherwise
      },
      revalidateOnFocus: true,
    }
  );

  // Calculate usage status
  const totalUnits = data ? (data.allocatedUnits + data.overageUnits) : 0;
  const usedUnits = data?.currentPeriodUnits || 0;
  const remainingUnits = totalUnits - usedUnits;
  const percentageUsed = totalUnits > 0 ? (usedUnits / totalUnits) * 100 : 0;

  const isNearLimit = percentageUsed >= 80 && percentageUsed < 100;
  const isOverLimit = remainingUnits < 0;

  return {
    isOverLimit,
    isNearLimit,
    remainingUnits,
    percentageUsed: Math.min(percentageUsed, 999), // Cap at 999% for display
    totalUnits,
    usedUnits,
    loading: !error && !data,
    error,
  };
}