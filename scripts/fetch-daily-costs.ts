#!/usr/bin/env node

// Fetch previous day's costs from the Anthropic Admin API and save to a JSON file.
// Usage: npx tsx scripts/fetch-daily-costs.ts
// Requires: ANTHROPIC_ADMIN_KEY environment variable

const ADMIN_KEY = process.env.ANTHROPIC_ADMIN_KEY;
if (!ADMIN_KEY) {
  console.error('Error: ANTHROPIC_ADMIN_KEY environment variable not set');
  process.exit(1);
}

import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

interface CostResult {
  amount: string;
  currency: string;
  cost_type: string | null;
  description: string | null;
  model: string | null;
  token_type: string | null;
  service_tier: string | null;
  context_window: string | null;
  workspace_id: string | null;
  inference_geo: string | null;
  speed: string | null;
}

interface CostBucket {
  starting_at: string;
  ending_at: string;
  results: CostResult[];
}

interface CostReport {
  data: CostBucket[];
  has_more: boolean;
  next_page?: string;
}

async function fetchCostReport(startingAt: string, endingAt: string): Promise<CostReport> {
  const params = new URLSearchParams({
    starting_at: startingAt,
    ending_at: endingAt,
    bucket_width: '1d',
    'group_by[]': 'description',
  });

  const url = `https://api.anthropic.com/v1/organizations/cost_report?${params}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await fetch(url, {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': ADMIN_KEY!,
      },
    });

    if (resp.status === 429) {
      const wait = (attempt + 1) * 15;
      console.log(`Rate limited, waiting ${wait}s...`);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`API error (${resp.status}): ${body}`);
    }

    return await resp.json() as CostReport;
  }

  throw new Error('Failed after 3 retries');
}

async function main() {
  // Previous day: midnight to midnight UTC
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const dateStr = new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const startingAt = dateStr + 'T00:00:00Z';
  const endingAt = today + 'T00:00:00Z';

  console.log(`Fetching costs for ${dateStr}...`);

  const report = await fetchCostReport(startingAt, endingAt);

  // Summarize
  let totalCents = 0;
  const byModel: Record<string, number> = {};
  const byCostType: Record<string, number> = {};

  for (const bucket of report.data) {
    for (const r of bucket.results) {
      const cents = parseFloat(r.amount || '0');
      totalCents += cents;
      if (r.model) byModel[r.model] = (byModel[r.model] || 0) + cents;
      if (r.cost_type) byCostType[r.cost_type] = (byCostType[r.cost_type] || 0) + cents;
    }
  }

  const output = {
    date: dateStr,
    fetched_at: now.toISOString(),
    period: { starting_at: startingAt, ending_at: endingAt },
    total_cost_usd: totalCents / 100,
    by_model: Object.fromEntries(
      Object.entries(byModel)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => [k, v / 100])
    ),
    by_cost_type: Object.fromEntries(
      Object.entries(byCostType)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => [k, v / 100])
    ),
    raw: report,
  };

  // Write to data/ directory
  const dir = resolve(process.cwd(), 'data', 'daily-costs');
  mkdirSync(dir, { recursive: true });
  const filename = `costs-${dateStr}.json`;
  const filepath = resolve(dir, filename);
  writeFileSync(filepath, JSON.stringify(output, null, 2) + '\n', 'utf-8');

  console.log(`Total cost: $${(totalCents / 100).toFixed(2)}`);
  for (const [model, cents] of Object.entries(byModel).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${model}: $${(cents / 100).toFixed(2)}`);
  }
  console.log(`Written to ${filepath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
