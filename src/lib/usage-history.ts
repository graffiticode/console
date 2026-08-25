// Assembling per-cycle usage history out of Stripe invoices + Firestore rows.
//
// Pure on purpose: no Firestore, no HTTP, no Stripe client. The caller fetches,
// this decides. That split exists because the repo has no unit-test runner — a
// tsx script is the only way to exercise this logic, and it can only reach it if
// the logic lives outside the Next handler.
//
// The subtlety this module encodes: a paid subscription carries a BASE price
// billed in advance and a METERED price billed in arrears. On a renewal invoice
// created at T, the base line covers [T, T+1mo) — the cycle just STARTING — and
// the metered line covers the cycle that just CLOSED. So a cycle's money comes
// from two different invoices, and `invoice.period_start`/`period_end` (which
// are degenerate on renewals) are never the right boundaries.
import type Stripe from "stripe";
import { PLANS, includedItemsFor, overageRateFor, getPlan, priceIdToPlan, type PlanId } from "./plans-config";

/**
 * When item-level usage data begins.
 *
 * Item-based pricing went live 2026-07-23 and the earliest `item_created` row in
 * Firestore is that same day; before it, billing counted compile units and there
 * is no item history to show. Cycles older than this render "—" rather than "0",
 * because a confident zero is a lie.
 */
export const ITEM_DATA_START = Date.UTC(2026, 6, 23);

export interface UsageCycle {
  /** Invoice whose base line OPENED the cycle. Stable React key. */
  id: string;
  /** ISO. Half-open: [start, end). */
  start: string;
  end: string;
  plan: PlanId | null;
  planName: string | null;
  /** False when the cycle predates or straddles ITEM_DATA_START. */
  dataAvailable: boolean;
  /** Billable items — equals what Stripe was told. Null when !dataAvailable. */
  itemsUsed: number | null;
  /** Free items in a sponsored language. NOT included in itemsUsed. */
  sponsoredItems: number | null;
  includedItems: number | null;
  overageItems: number | null;
  /** Quantity Stripe actually billed, for reconciliation against itemsUsed. */
  meteredQuantity: number | null;
  baseAmountUsd: number;
  overageAmountUsd: number;
  /** base + overage + any prorations attributed to this cycle. */
  amountUsd: number;
  invoiceIds: string[];
  invoiceUrl: string | null;
  status: string;
  isCurrent: boolean;
  /** itemsUsed agrees with what Stripe billed. */
  reconciles: boolean;
}

/** One usage row, already normalized by the caller. */
export interface UsageRow {
  createdAtMs: number;
  units: number;
  sponsored: boolean;
}

type LineKind = "base" | "metered" | "other";

/**
 * Recover a plan from what the base line CHARGED, when its price id doesn't
 * resolve.
 *
 * priceIdToPlan() only knows the price ids currently in env, so any cycle billed
 * on a RETIRED price — a renamed tier, a re-created price — comes back
 * undefined. That isn't a rare edge: the Silver base price has already been
 * replaced once, so the two most recent paid cycles on a real account resolve to
 * nothing without this.
 *
 * Amounts come from PLANS, never a literal. Interval matters because the annual
 * ladder overlaps the monthly one (Starter annual and Silver monthly are both
 * $100), so the two are never compared against each other.
 */
function planByBaseAmount(usd: number, interval?: string): PlanId | null {
  const annual = interval === "year";
  for (const p of Object.values(PLANS)) {
    if ((annual ? p.basePriceAnnual : p.basePriceMonthly) === usd) return p.id;
  }
  return null;
}

/** Resolve a line's price id, whether Stripe expanded the price or not. */
export function linePriceId(line: any): string | undefined {
  const p = line?.pricing?.price_details?.price;
  if (!p) return undefined;
  return typeof p === "string" ? p : p.id;
}

/**
 * Classify an invoice line.
 *
 * Reads `usage_type` off the resolved Price. Note the line itself has NO `price`
 * property in Stripe SDK v22 — it moved to `pricing.price_details.price` — so
 * the obvious `line.price.recurring.usage_type` silently yields undefined.
 *
 * The fallback is not just for missing prices: it is a second opinion expressed
 * purely in billing semantics, independent of env-configured price ids. A line
 * whose period STARTS at the invoice date was billed in advance (base); one
 * whose period ENDS there was billed in arrears (metered).
 */
export function classifyLine(
  line: any,
  priceOf: (id: string) => Stripe.Price | undefined,
): LineKind {
  const isProration = line?.parent?.subscription_item_details?.proration === true;
  if (isProration) return "other";

  const id = linePriceId(line);
  const price = id ? priceOf(id) : undefined;
  const usageType = price?.recurring?.usage_type;
  if (usageType === "metered") return "metered";
  if (usageType === "licensed") return "base";

  const created = line?.__invoiceCreated as number | undefined;
  const period = line?.period;
  if (created && period) {
    const HOUR = 3600;
    if (Math.abs(period.start - created) < HOUR) return "base";
    if (Math.abs(period.end - created) < HOUR) return "metered";
  }
  return "other";
}

export interface BuildOptions {
  invoices: Stripe.Invoice[];
  priceOf: (id: string) => Stripe.Price | undefined;
  rows: UsageRow[];
  limit?: number;
  includeCurrent?: boolean;
  nowMs?: number;
}

export function buildUsageCycles({
  invoices,
  priceOf,
  rows,
  limit = 12,
  includeCurrent = false,
  // Defaulted rather than left to a constant: a wrong "now" mis-flags which
  // cycle is open, and every caller passes one anyway.
  nowMs = Date.now(),
}: BuildOptions): UsageCycle[] {
  const usable = invoices
    .filter(inv => inv.status !== "draft" && inv.status !== "void")
    .sort((a, b) => a.created - b.created);

  // Tag lines with their invoice's created time so classifyLine's fallback can
  // reason about advance-vs-arrears without a second lookup.
  for (const inv of usable) {
    for (const line of inv.lines?.data ?? []) (line as any).__invoiceCreated = inv.created;
  }

  interface Draft {
    id: string;
    startSecs: number;
    endSecs: number;
    basePriceId?: string;
    baseAmountUsd: number;
    overageAmountUsd: number;
    otherAmountUsd: number;
    meteredQuantity: number;
    invoiceIds: Set<string>;
    invoiceUrl: string | null;
    status: string;
  }

  // 1) Every invoice with a base line opens a cycle.
  const drafts: Draft[] = [];
  for (const inv of usable) {
    const baseLines = (inv.lines?.data ?? []).filter(l => classifyLine(l, priceOf) === "base");
    if (!baseLines.length) continue;
    const starts = baseLines.map((l: any) => l.period?.start).filter(Boolean) as number[];
    const ends = baseLines.map((l: any) => l.period?.end).filter(Boolean) as number[];
    if (!starts.length) continue;
    drafts.push({
      id: inv.id!,
      startSecs: Math.min(...starts),
      endSecs: ends.length ? Math.max(...ends) : Math.min(...starts),
      basePriceId: linePriceId(baseLines[0]),
      baseAmountUsd: baseLines.reduce((a, l) => a + (l.amount || 0), 0) / 100,
      overageAmountUsd: 0,
      otherAmountUsd: 0,
      meteredQuantity: 0,
      invoiceIds: new Set([inv.id!]),
      invoiceUrl: null,
      status: inv.status || "unknown",
    });
  }
  drafts.sort((a, b) => a.startSecs - b.startSecs);

  // 2) A cycle ends where the next one begins. Using the NEXT invoice's base
  // start rather than this line's period.end is what makes a mid-cycle upgrade
  // tile without a gap — Stripe re-anchors the period on a plan change.
  for (let i = 0; i < drafts.length - 1; i++) {
    drafts[i].endSecs = drafts[i + 1].startSecs;
  }

  const cycleFor = (secs: number) =>
    drafts.find(d => secs >= d.startSecs && secs < d.endSecs);

  // 3) Attribute every non-base line to the cycle containing its period start.
  for (const inv of usable) {
    for (const line of (inv.lines?.data ?? []) as any[]) {
      const kind = classifyLine(line, priceOf);
      if (kind === "base") continue;
      const at = line.period?.start;
      const target = at ? cycleFor(at) : undefined;
      if (!target) continue;
      target.invoiceIds.add(inv.id!);
      const usd = (line.amount || 0) / 100;
      if (kind === "metered") {
        target.overageAmountUsd += usd;
        const q = line.quantity ?? Number(line.quantity_decimal ?? 0);
        target.meteredQuantity += Number.isFinite(q) ? q : 0;
        // The invoice that carries the metered line is the one that CLOSED the
        // cycle, which is the receipt a customer wants to open for it.
        target.invoiceUrl = (inv as any).hosted_invoice_url || target.invoiceUrl;
        target.status = inv.status || target.status;
      } else {
        target.otherAmountUsd += usd;
      }
    }
  }

  // 4) Bucket usage rows.
  const out: UsageCycle[] = drafts.map(d => {
    const startMs = d.startSecs * 1000;
    const endMs = d.endSecs * 1000;
    const isCurrent = nowMs >= startMs && nowMs < endMs;

    const price = d.basePriceId ? priceOf(d.basePriceId) : undefined;
    // An annual base line covers 12 months while the allowance resets monthly.
    // Showing a year's usage against one month's bucket reads as a catastrophic
    // overage, so withhold the item columns rather than print a wrong ratio.
    const isAnnual = price?.recurring?.interval === "year";

    let plan = d.basePriceId ? priceIdToPlan(d.basePriceId) ?? null : null;
    // Falls back to the charged amount for retired price ids. A prorated partial
    // cycle matches no plan amount and stays null, which renders as "—" — the
    // honest answer for a 5-day stub.
    if (!plan) plan = planByBaseAmount(d.baseAmountUsd, price?.recurring?.interval);

    const dataAvailable = startMs >= ITEM_DATA_START && !isAnnual;

    let itemsUsed: number | null = null;
    let sponsoredItems: number | null = null;
    if (dataAvailable) {
      itemsUsed = 0;
      sponsoredItems = 0;
      for (const r of rows) {
        if (r.createdAtMs < startMs || r.createdAtMs >= endMs) continue;
        itemsUsed += r.units || 0;
        if (r.sponsored) sponsoredItems += 1;
      }
    }

    const includedItems = dataAvailable && plan ? includedItemsFor(plan) : null;
    const overageItems =
      itemsUsed !== null && includedItems !== null
        ? Math.max(0, itemsUsed - includedItems)
        : null;

    return {
      id: d.id,
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      plan,
      planName: plan ? getPlan(plan).displayName : null,
      dataAvailable,
      itemsUsed,
      sponsoredItems,
      includedItems,
      overageItems,
      meteredQuantity: d.meteredQuantity,
      baseAmountUsd: d.baseAmountUsd,
      overageAmountUsd: d.overageAmountUsd,
      amountUsd: d.baseAmountUsd + d.overageAmountUsd + d.otherAmountUsd,
      invoiceIds: Array.from(d.invoiceIds),
      invoiceUrl: d.invoiceUrl,
      status: d.status,
      isCurrent,
      // Only meaningful once the cycle has closed and been metered.
      //
      // A difference that could not have changed the bill is not a divergence
      // worth flagging: when both our count and the invoiced quantity sit under
      // the allowance, nothing was owed either way. Without this the mid-cycle
      // metered-price attach (which left one historical cycle invoiced for 5 of
      // its 31 days) would flag that row forever, for no billing consequence.
      reconciles:
        itemsUsed === null || isCurrent
          ? true
          : itemsUsed === d.meteredQuantity ||
            (includedItems !== null &&
              itemsUsed <= includedItems &&
              d.meteredQuantity <= includedItems),
    };
  });

  return out
    .filter(c => includeCurrent || !c.isCurrent)
    .sort((a, b) => (a.start < b.start ? 1 : -1))
    .slice(0, limit);
}

/** Per-item overage rate for a cycle's plan, for display. */
export function cycleOverageRate(cycle: UsageCycle): number | null {
  return cycle.plan ? overageRateFor(cycle.plan) : null;
}
