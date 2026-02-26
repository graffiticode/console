#!/usr/bin/env node

import admin from 'firebase-admin';
import { writeFileSync } from 'fs';

// Force connection to production Firestore (bypass emulator)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

// Use GRAFFITICODE_APP_CREDENTIALS for the graffiticode-app project
if (process.env.GRAFFITICODE_APP_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.GRAFFITICODE_APP_CREDENTIALS;
} else {
  console.error('Error: GRAFFITICODE_APP_CREDENTIALS environment variable not set');
  console.error('Set it to the path of your graffiticode-app service account key');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "graffiticode-app"
});
const db = admin.firestore();

function parseArgs(argv: string[]): { period: string; output: string; language?: string } {
  const args = argv.slice(2);
  let period = 'all';
  let output = 'rag-analytics-report.html';
  let language: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--period' && args[i + 1]) {
      period = args[i + 1];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      output = args[i + 1];
      i++;
    } else if (args[i] === '--lang' && args[i + 1]) {
      const raw = args[i + 1].toUpperCase();
      language = /^\d+$/.test(raw) ? `L${raw}` : raw;
      i++;
    }
  }
  if (!['all', 'day', 'hour'].includes(period)) {
    console.error('Error: --period must be "all", "day", or "hour"');
    process.exit(1);
  }
  return { period, output, language };
}

interface RetrievalDoc {
  similarity: number;
  keywordScore?: number;
  combinedScore?: number;
  embeddingText?: string;
  prompt?: string;
  codeSnippet?: string;
  position?: number;
  wasUsedInPrompt?: boolean;
}

interface AnalyticsDoc {
  requestId: string;
  timestamp: FirebaseFirestore.Timestamp;
  query?: { text?: string; language?: string; embeddingText?: string };
  retrieval?: { documents?: RetrievalDoc[]; retrievalLatencyMs?: number };
  generation?: { success?: boolean; latencyMs?: number; model?: string };
  compilation?: { success?: boolean; errorMessage?: string; retryCount?: number };
  response?: { success?: boolean; code?: string };
  feedback?: { score?: number };
  performance?: { totalLatencyMs?: number; stages?: Array<{ stage: string; startTime?: number; endTime?: number; durationMs?: number }> };
  errors?: Array<{ stage: string; message: string }>;
  metadata?: Record<string, any>;
}

function getLanguage(d: AnalyticsDoc): string {
  const raw = (d.metadata?.lang || d.query?.language || 'unknown').toString();
  // Normalize to L-prefixed uppercase form (e.g. "0166" -> "L0166")
  if (/^\d+$/.test(raw)) return `L${raw}`;
  return raw.toUpperCase();
}

function getTimestampMs(d: AnalyticsDoc): number | null {
  // Try the Firestore timestamp first
  const ts = d.timestamp as any;
  if (ts) {
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts._seconds != null) return ts._seconds * 1000;
    if (ts.seconds != null) return ts.seconds * 1000;
  }
  // Fallback: use the request stage startTime from performance data
  const stages = d.performance?.stages as any[];
  if (stages?.length > 0 && stages[0].startTime) return stages[0].startTime;
  return null;
}

function formatTimestamp(d: AnalyticsDoc): string {
  const ms = getTimestampMs(d);
  if (ms == null) return '—';
  return new Date(ms).toISOString();
}

async function fetchDocs(period: string, language?: string): Promise<AnalyticsDoc[]> {
  const snapshot = await db.collection('rag_analytics').get();

  let docs: AnalyticsDoc[] = [];
  snapshot.forEach(doc => {
    docs.push({ requestId: doc.id, ...doc.data() } as AnalyticsDoc);
  });

  // Filter by period using stage startTime (Firestore timestamp field is unreliable)
  if (period !== 'all') {
    const now = Date.now();
    const cutoffMs = now - (period === 'hour' ? 3600000 : 86400000);
    docs = docs.filter(d => {
      const ms = getTimestampMs(d);
      return ms != null && ms >= cutoffMs;
    });
  }

  if (language) {
    docs = docs.filter(d => getLanguage(d) === language);
  }
  return docs;
}

function computeMetrics(docs: AnalyticsDoc[]) {
  const total = docs.length;
  const successful = docs.filter(d => d.response?.success || d.metadata?.success).length;
  const successRate = total > 0 ? successful / total : 0;

  const latencies = docs.map(d => d.performance?.totalLatencyMs).filter((v): v is number => v != null);
  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  const similarities = docs.flatMap(d => d.retrieval?.documents?.map(doc => doc.similarity) || []);
  const avgSimilarity = similarities.length > 0 ? similarities.reduce((a, b) => a + b, 0) / similarities.length : 0;

  const feedbacks = docs.map(d => d.feedback?.score).filter((v): v is number => v != null);
  const avgFeedback = feedbacks.length > 0 ? feedbacks.reduce((a, b) => a + b, 0) / feedbacks.length : 0;

  // Error breakdown
  const errorCounts = new Map<string, number>();
  docs.forEach(d => {
    d.errors?.forEach(e => {
      const key = `${e.stage}: ${e.message.substring(0, 80)}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });
  });
  const errorBreakdown = Array.from(errorCounts.entries())
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count);

  // Requests over time
  const bucketMs = 300000; // 5 min buckets
  const timeBuckets = new Map<number, number>();
  docs.forEach(d => {
    const ms = getTimestampMs(d);
    if (ms != null) {
      const bucket = Math.floor(ms / bucketMs) * bucketMs;
      timeBuckets.set(bucket, (timeBuckets.get(bucket) || 0) + 1);
    }
  });
  const timeSeries = Array.from(timeBuckets.entries())
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => a.time - b.time);

  // Per-language breakdown
  const langMap = new Map<string, { total: number; successful: number; totalLatency: number; latencyCount: number }>();
  docs.forEach(d => {
    const lang = getLanguage(d);
    const entry = langMap.get(lang) || { total: 0, successful: 0, totalLatency: 0, latencyCount: 0 };
    entry.total++;
    if (d.response?.success || d.metadata?.success) entry.successful++;
    if (d.performance?.totalLatencyMs != null) {
      entry.totalLatency += d.performance.totalLatencyMs;
      entry.latencyCount++;
    }
    langMap.set(lang, entry);
  });
  const languageBreakdown = Array.from(langMap.entries())
    .map(([lang, s]) => ({
      language: lang,
      total: s.total,
      successRate: s.total > 0 ? s.successful / s.total : 0,
      avgLatency: s.latencyCount > 0 ? s.totalLatency / s.latencyCount : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return { total, successful, successRate, avgLatency, avgSimilarity, avgFeedback, feedbackCount: feedbacks.length, errorBreakdown, timeSeries, languageBreakdown };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateHtml(docs: AnalyticsDoc[], metrics: ReturnType<typeof computeMetrics>, period: string, language?: string): string {
  const now = new Date().toISOString();
  const langLabel = language ? ` | Language: ${language}` : '';

  // SVG bar chart for time series
  const maxCount = Math.max(...metrics.timeSeries.map(t => t.count), 1);
  const n = metrics.timeSeries.length;
  const barWidth = n > 0 ? Math.max(8, Math.floor(700 / n) - 2) : 20;
  const chartPadLeft = 30;
  const chartPadBottom = 40;
  const chartWidth = Math.max(720, n * (barWidth + 2) + chartPadLeft + 10);
  const chartHeight = 200;
  const barAreaHeight = chartHeight - chartPadBottom - 20;
  const baselineY = chartHeight - chartPadBottom;

  const bars = metrics.timeSeries.map((t, i) => {
    const h = (t.count / maxCount) * barAreaHeight;
    const x = chartPadLeft + i * (barWidth + 2);
    const y = baselineY - h;
    const d = new Date(t.time);
    const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" fill="#3b82f6" rx="2"><title>${label}: ${t.count}</title></rect>`;
  }).join('\n');

  // Time tick labels — pick ~8-12 evenly spaced ticks
  const tickCount = Math.min(n, Math.max(4, Math.floor(chartWidth / 100)));
  const tickStep = n > 1 ? (n - 1) / (tickCount - 1) : 0;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const idx = Math.round(i * tickStep);
    const t = metrics.timeSeries[idx];
    if (!t) return '';
    const x = chartPadLeft + idx * (barWidth + 2) + barWidth / 2;
    const d = new Date(t.time);
    const label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `<line x1="${x}" y1="${baselineY}" x2="${x}" y2="${baselineY + 4}" stroke="#94a3b8" stroke-width="1"/><text x="${x}" y="${baselineY + 16}" text-anchor="middle" font-size="10" fill="#64748b">${label}</text>`;
  }).join('\n');

  // Error table rows
  const errorRows = metrics.errorBreakdown.map(e =>
    `<tr><td>${escapeHtml(e.error)}</td><td>${e.count}</td></tr>`
  ).join('\n');

  // Language breakdown rows
  const langRows = metrics.languageBreakdown.map(l =>
    `<tr><td>${escapeHtml(l.language)}</td><td>${l.total}</td><td>${(l.successRate * 100).toFixed(1)}%</td><td>${Math.round(l.avgLatency)}ms</td></tr>`
  ).join('\n');

  // Sort docs by timestamp descending for detail table
  const sorted = [...docs].sort((a, b) => (getTimestampMs(b) || 0) - (getTimestampMs(a) || 0));

  // Detail table rows with expandable panels
  const detailRows = sorted.map((d, i) => {
    const ts = formatTimestamp(d);
    const lang = getLanguage(d);
    const query = escapeHtml((d.query?.text || '—').substring(0, 60));
    const success = d.response?.success ? 'Yes' : 'No';
    const latency = d.performance?.totalLatencyMs != null ? `${Math.round(d.performance.totalLatencyMs)}ms` : '—';
    const topSim = d.retrieval?.documents?.length
      ? Math.max(...d.retrieval.documents.map(doc => doc.similarity)).toFixed(3)
      : '—';
    const compilation = d.compilation
      ? (d.compilation.success ? 'Pass' : `Fail${d.compilation.retryCount ? ` (${d.compilation.retryCount} retries)` : ''}`)
      : '—';
    const successClass = d.response?.success ? 'success' : 'failure';

    // Build expandable detail content
    const fullQuery = escapeHtml(d.query?.text || '—');
    const responseCode = escapeHtml(d.response?.code || '—');
    const embeddingText = escapeHtml(d.query?.embeddingText || '—');

    // Top match from retrieval
    const topMatch = d.retrieval?.documents?.length
      ? [...d.retrieval.documents].sort((a, b) => b.similarity - a.similarity)[0]
      : null;
    const matchEmbeddingText = topMatch ? escapeHtml(topMatch.embeddingText || '—') : '—';
    const matchPrompt = topMatch ? escapeHtml(topMatch.prompt || '—') : '—';
    const matchCode = topMatch ? escapeHtml(topMatch.codeSnippet || '—') : '—';
    const matchSim = topMatch ? topMatch.similarity.toFixed(4) : '—';

    // Build markdown for clipboard
    const rawQuery = d.query?.text || '—';
    const rawCode = d.response?.code || '—';
    const rawEmbedding = d.query?.embeddingText || '—';
    const rawMatchPrompt = topMatch?.prompt || '—';
    const rawMatchEmbedding = topMatch?.embeddingText || '—';
    const rawMatchCode = topMatch?.codeSnippet || '—';
    const md = [
      `## RAG Request ${d.requestId}`,
      '',
      `- **Timestamp:** ${ts}`,
      `- **Language:** ${lang}`,
      `- **Success:** ${success}`,
      `- **Latency:** ${latency}`,
      `- **Compilation:** ${compilation}`,
      '',
      `### Prompt`,
      '```', rawQuery, '```',
      '',
      `### Generated Code`,
      '```', rawCode, '```',
      '',
      `### Embedding Text (query)`,
      '```', rawEmbedding, '```',
      '',
      `### Top Match (similarity: ${matchSim})`,
      '',
      `**Prompt:**`,
      '```', rawMatchPrompt, '```',
      '',
      `**Embedding Text:**`,
      '```', rawMatchEmbedding, '```',
      '',
      `**Code Snippet:**`,
      '```', rawMatchCode, '```',
    ].join('\n');
    const mdAttr = escapeHtml(md);

    const summaryRow = `<tr class="${successClass} clickable" onclick="toggle(${i})"><td class="ts">${ts}</td><td>${lang}</td><td>${query}</td><td>${success}</td><td>${latency}</td><td>${topSim}</td><td>${compilation}</td></tr>`;
    const detailRow = `<tr class="detail-row" id="detail-${i}"><td colspan="7"><div class="detail-panel">
<div class="detail-actions"><button class="copy-btn" onclick="copyMd(this)" data-md="${mdAttr}">Copy as Markdown</button></div>
<div class="detail-section"><div class="detail-label">Prompt</div><pre class="detail-pre">${fullQuery}</pre></div>
<div class="detail-section"><div class="detail-label">Generated Code</div><pre class="detail-pre">${responseCode}</pre></div>
<div class="detail-section"><div class="detail-label">Embedding Text (query)</div><pre class="detail-pre">${embeddingText}</pre></div>
<div class="detail-section"><div class="detail-label">Top Match (similarity: ${matchSim})</div>
<div class="detail-sublabel">Prompt</div><pre class="detail-pre">${matchPrompt}</pre>
<div class="detail-sublabel">Embedding Text</div><pre class="detail-pre">${matchEmbeddingText}</pre>
<div class="detail-sublabel">Code Snippet</div><pre class="detail-pre">${matchCode}</pre>
</div>
</div></td></tr>`;
    return summaryRow + '\n' + detailRow;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RAG Analytics Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; }
  h1 { font-size: 1.5rem; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 0.875rem; margin-bottom: 24px; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .card { background: #fff; border-radius: 8px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.5rem; font-weight: 600; margin-top: 4px; }
  .section { margin-bottom: 32px; }
  .section h2 { font-size: 1.1rem; margin-bottom: 12px; }
  svg { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); font-size: 0.85rem; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
  th { background: #f1f5f9; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; }
  tr.failure td { background: #fef2f2; }
  tr.success td { }
  td.ts { font-family: monospace; font-size: 0.8rem; white-space: nowrap; }
  .empty { color: #94a3b8; text-align: center; padding: 32px; }
  .chart-container { overflow-x: auto; }
  tr.clickable { cursor: pointer; }
  tr.clickable:hover td { background: #f1f5f9; }
  tr.detail-row { display: none; }
  tr.detail-row.open { display: table-row; }
  .detail-panel { padding: 12px 4px; }
  .detail-section { margin-bottom: 12px; }
  .detail-label { font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; margin-bottom: 4px; }
  .detail-sublabel { font-weight: 600; font-size: 0.7rem; color: #64748b; margin: 8px 0 2px 8px; }
  .detail-pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; font-size: 0.8rem; white-space: pre-wrap; word-break: break-word; max-height: 300px; overflow-y: auto; margin-left: 8px; }
  .detail-actions { margin-bottom: 12px; }
  .copy-btn { background: #3b82f6; color: #fff; border: none; border-radius: 4px; padding: 6px 12px; font-size: 0.8rem; cursor: pointer; }
  .copy-btn:hover { background: #2563eb; }
  .copy-btn.copied { background: #22c55e; }
</style>
<script>
function toggle(i) {
  document.getElementById('detail-' + i).classList.toggle('open');
}
function copyMd(btn) {
  var md = btn.getAttribute('data-md');
  navigator.clipboard.writeText(md).then(function() {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(function() { btn.textContent = 'Copy as Markdown'; btn.classList.remove('copied'); }, 2000);
  });
}
</script>
</head>
<body>
<h1>RAG Analytics Report</h1>
<p class="subtitle">Period: last ${period}${langLabel} | Generated: ${now}</p>

<div class="cards">
  <div class="card"><div class="label">Total Requests</div><div class="value">${metrics.total}</div></div>
  <div class="card"><div class="label">Success Rate</div><div class="value">${(metrics.successRate * 100).toFixed(1)}%</div></div>
  <div class="card"><div class="label">Avg Latency</div><div class="value">${Math.round(metrics.avgLatency)}ms</div></div>
  <div class="card"><div class="label">Avg Similarity</div><div class="value">${metrics.avgSimilarity.toFixed(3)}</div></div>
  <div class="card"><div class="label">Feedback Score</div><div class="value">${metrics.feedbackCount > 0 ? metrics.avgFeedback.toFixed(1) : '—'}</div></div>
</div>

<div class="section">
  <h2>Requests Over Time</h2>
  ${metrics.timeSeries.length > 0 ? `
  <div class="chart-container">
  <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}">
    <line x1="${chartPadLeft - 2}" y1="${baselineY}" x2="${chartWidth}" y2="${baselineY}" stroke="#e2e8f0" stroke-width="1"/>
    ${bars}
    ${ticks}
  </svg>
  </div>` : '<p class="empty">No time series data</p>'}
</div>

<div class="section">
  <h2>By Language</h2>
  ${metrics.languageBreakdown.length > 0 ? `
  <table>
    <thead><tr><th>Language</th><th>Requests</th><th>Success Rate</th><th>Avg Latency</th></tr></thead>
    <tbody>${langRows}</tbody>
  </table>` : '<p class="empty">No language data</p>'}
</div>

<div class="section">
  <h2>Error Breakdown</h2>
  ${metrics.errorBreakdown.length > 0 ? `
  <table>
    <thead><tr><th>Error</th><th>Count</th></tr></thead>
    <tbody>${errorRows}</tbody>
  </table>` : '<p class="empty">No errors recorded</p>'}
</div>

<div class="section">
  <h2>Request Details</h2>
  ${docs.length > 0 ? `
  <div style="overflow-x:auto">
  <table>
    <thead><tr><th>Timestamp</th><th>Language</th><th>Query</th><th>Success</th><th>Latency</th><th>Top Similarity</th><th>Compilation</th></tr></thead>
    <tbody>${detailRows}</tbody>
  </table>
  </div>` : '<p class="empty">No requests in this period</p>'}
</div>

</body>
</html>`;
}

async function main() {
  const { period, output, language } = parseArgs(process.argv);

  console.log(`Fetching RAG analytics for the last ${period}${language ? ` (lang: ${language})` : ''}...`);
  const docs = await fetchDocs(period, language);
  console.log(`Found ${docs.length} records`);

  const metrics = computeMetrics(docs);
  const html = generateHtml(docs, metrics, period, language);

  writeFileSync(output, html, 'utf-8');
  console.log(`Report written to ${output}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
