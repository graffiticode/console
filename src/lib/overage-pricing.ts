export const OVERAGE_PRICING: Record<string, {
  pricePerUnit: number;
  blockSize: number;
  minBlocks: number;
  description: string;
}> = {
  starter: {
    pricePerUnit: 0.002,
    blockSize: 1000,
    minBlocks: 1,
    description: '$2 per 1,000 units'
  },
  pro: {
    pricePerUnit: 0.001,
    blockSize: 10000,
    minBlocks: 1,
    description: '$10 per 10,000 units'
  },
  max: {
    pricePerUnit: 0.0005,
    blockSize: 20000,
    minBlocks: 1,
    description: '$10 per 20,000 units'
  },
  teams: {
    pricePerUnit: 0.0005,
    blockSize: 20000,
    minBlocks: 1,
    description: '$10 per 20,000 units'
  },
};

// Fixed-size automatic overage top-ups (one charge per increment when a user
// with auto-overage enabled exhausts their units). Only plans listed here
// support auto-overage. Units = amountUsd / pricePerUnit for the plan.
export const AUTO_OVERAGE_INCREMENTS: Record<string, { amountUsd: number; units: number }> = {
  pro: { amountUsd: 10, units: 10000 }, // $10 @ $0.001/unit
  teams: { amountUsd: 100, units: 200000 }, // $100 @ $0.0005/unit
};
