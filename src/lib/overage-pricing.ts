export const OVERAGE_PRICING: Record<string, {
  pricePerUnit: number;
  blockSize: number;
  minBlocks: number;
  description: string;
}> = {
  starter: {
    pricePerUnit: 0.005,
    blockSize: 1000,
    minBlocks: 1,
    description: '$5 per 1,000 units'
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
