#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const REPORTS_DIR = path.resolve('reports');
const JSON_REPORT_PATH = path.join(REPORTS_DIR, 'json/test-results.json');
const HISTORY_PATH = path.join(REPORTS_DIR, 'history.json');
const HEALING_LOG_PATH = path.join(REPORTS_DIR, 'healing-log.json');
const BUGS_DIR = path.join(REPORTS_DIR, 'bugs');
const SUMMARY_MD_PATH = path.join(REPORTS_DIR, 'metrics-summary.md');
const DASHBOARD_HTML_PATH = path.join(REPORTS_DIR, 'kpi-dashboard.html');

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(BUGS_DIR, { recursive: true });

// Helper to safely read JSON files
function readJsonSafe(filePath, fallback = []) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
        return fallback;
    }
}

// Helper to escape HTML strings safely
function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// MODE 1: CLI Flag for the AI Agent to Record a Self-Healing Event
// Usage: node parse-metrics.mjs --log-heal "login.spec.ts" "oldLocator" "newLocator" "HEALED|BUG_FILED"
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
if (args[0] === '--log-heal') {
    const [, specFile = 'unknown', oldLocator = '-', newLocator = '-', outcome = 'HEALED'] = args;
    const healingLog = readJsonSafe(HEALING_LOG_PATH, []);
    healingLog.unshift({
        timestamp: new Date().toISOString(),
        specFile,
        oldLocator,
        newLocator,
        outcome, // 'HEALED' or 'BUG_FILED'
    });
    fs.writeFileSync(HEALING_LOG_PATH, JSON.stringify(healingLog.slice(0, 50), null, 2));
    console.log(`Recorded AI healing event (${outcome}) for ${specFile}`);
    process.exit(0);
}

// ---------------------------------------------------------------------------
// MODE 2: Standard Run Parser + History Tracker + HTML Dashboard Generator
// ---------------------------------------------------------------------------
if (!fs.existsSync(JSON_REPORT_PATH)) {
    console.error('No reports/json/test-results.json found. Run "npx playwright test" first.');
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(JSON_REPORT_PATH, 'utf-8'));
const stats = rawData.stats || {};
const passed = stats.expected || 0;
const failed = stats.unexpected || 0;
const flaky = stats.flaky || 0;
const skipped = stats.skipped || 0;
const total = passed + failed + flaky + skipped;
const passRate = total > 0 ? Number((((passed + flaky) / total) * 100).toFixed(1)) : 0;
const durationSec = Number(((stats.duration || 0) / 1000).toFixed(2));
const targetUrl = process.env.BASE_URL || 'http://localhost:3000';
const timestamp = new Date().toISOString();

// Traverse suites to collect failures and individual test durations
const failures = [];
const allTests = [];

function traverseSuites(suites, parentTitle = '') {
    for (const suite of suites || []) {
        const suiteTitle = [parentTitle, suite.title].filter(Boolean).join(' › ');
        for (const spec of suite.specs || []) {
            const lastResult = spec.tests?.[0]?.results?.at(-1);
            const testDurationSec = Number(((lastResult?.duration || 0) / 1000).toFixed(2));

            allTests.push({
                title: `${suiteTitle} › ${spec.title}`,
                file: spec.file,
                durationSec: testDurationSec,
                ok: spec.ok,
            });

            if (!spec.ok) {
                failures.push({
                    title: spec.title,
                    file: spec.file,
                    line: spec.line,
                    error: lastResult?.error?.message?.split('\n').slice(0, 6).join('\n') || 'Unknown failure',
                });
            }
        }
        if (suite.suites) traverseSuites(suite.suites, suiteTitle);
    }
}
traverseSuites(rawData.suites);

const slowestTests = [...allTests].sort((a, b) => b.durationSec - a.durationSec).slice(0, 5);

// Count local Markdown bug reports and read AI healing history
const bugFiles = fs.readdirSync(BUGS_DIR).filter((f) => f.endsWith('.md'));
const healingLog = readJsonSafe(HEALING_LOG_PATH, []);
const healedCount = healingLog.filter((h) => h.outcome === 'HEALED').length;

// Update persistent run history (keep last 30 runs)
const history = readJsonSafe(HISTORY_PATH, []);
history.push({
    timestamp,
    targetUrl,
    total,
    passed,
    failed,
    flaky,
    skipped,
    passRate,
    durationSec,
});
const recentHistory = history.slice(-30);
fs.writeFileSync(HISTORY_PATH, JSON.stringify(recentHistory, null, 2));

// Calculate pass rate delta vs previous run
const prevRun = recentHistory.length > 1 ? recentHistory[recentHistory.length - 2] : null;
const passRateDelta = prevRun ? (passRate - prevRun.passRate).toFixed(1) : null;
const deltaLabel =
    passRateDelta === null
        ? 'First recorded run'
        : Number(passRateDelta) >= 0
            ? `+${passRateDelta}% vs last run`
            : `${passRateDelta}% vs last run`;

// ---------------------------------------------------------------------------
// 1. Write Compact Markdown Digest for the AI Agent (reports/metrics-summary.md)
// ---------------------------------------------------------------------------
const markdown = `# Test Execution Metrics Summary
- **Target URL:** \`${targetUrl}\`
- **Timestamp:** ${timestamp}
- **Pass Rate:** **${passRate}%** (${deltaLabel}) — ${passed} passed, ${failed} failed, ${flaky} flaky, ${skipped} skipped
- **Total Duration:** ${durationSec}s
- **AI Self-Healing Stats:** ${healedCount} locators auto-healed | ${bugFiles.length} active bug reports in \`reports/bugs/\`
- **Executive KPI Dashboard:** Open \`reports/kpi-dashboard.html\`
- **Playwright Trace Report:** Run \`npx playwright show-report reports/html\`

## Failed Tests Requiring Triage (${failures.length})
${failures.length === 0
        ? 'All tests passed!'
        : failures
            .map(
                (f, i) => `### ${i + 1}. ${f.title} (\`${f.file}:${f.line}\`)
\`\`\`text
${f.error}
\`\`\``
            )
            .join('\n\n')
    }
`;

fs.writeFileSync(SUMMARY_MD_PATH, markdown);

// ---------------------------------------------------------------------------
// 2. Build Standalone SVG Trend Chart for HTML Dashboard
// ---------------------------------------------------------------------------
function buildTrendSvg(runs) {
    const width = 760;
    const height = 200;
    const padX = 40;
    const padY = 24;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    if (runs.length === 0) return '<p>No run history yet.</p>';

    const points = runs.map((r, idx) => {
        const x = runs.length === 1 ? padX + plotW / 2 : padX + (idx / (runs.length - 1)) * plotW;
        const y = padY + plotH - (r.passRate / 100) * plotH;
        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), r };
    });

    const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
    const areaPoints = `${points[0].x},${padY + plotH} ${polyline} ${points.at(-1).x},${padY + plotH}`;

    return `
  <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;overflow:visible;">
    <defs>
      <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
      </linearGradient>
    </defs>
    <!-- Horizontal Grid Lines (0%, 50%, 100%) -->
    <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="#334155" stroke-dasharray="4"/>
    <text x="6" y="${padY + 4}" fill="#94a3b8" font-size="11">100%</text>
    <line x1="${padX}" y1="${padY + plotH / 2}" x2="${width - padX}" y2="${padY + plotH / 2}" stroke="#334155" stroke-dasharray="4"/>
    <text x="12" y="${padY + plotH / 2 + 4}" fill="#94a3b8" font-size="11">50%</text>
    <line x1="${padX}" y1="${padY + plotH}" x2="${width - padX}" y2="${padY + plotH}" stroke="#334155"/>
    <text x="18" y="${padY + plotH + 4}" fill="#94a3b8" font-size="11">0%</text>

    <!-- Area & Line -->
    <polygon points="${areaPoints}" fill="url(#passGrad)" />
    <polyline fill="none" stroke="#10b981" stroke-width="3" points="${polyline}" />

    <!-- Data Nodes -->
    ${points
            .map(
                (p, idx) => `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${p.r.failed > 0 ? '#f43f5e' : '#10b981'}" stroke="#0f172a" stroke-width="2">
        <title>Run #${idx + 1} (${p.r.timestamp.slice(0, 16).replace('T', ' ')}): ${p.r.passRate}% Pass (${p.r.passed}/${p.r.total})</title>
      </circle>`
            )
            .join('')}
  </svg>`;
}

// ---------------------------------------------------------------------------
// 3. Write Standalone Executive HTML Dashboard (reports/kpi-dashboard.html)
// ---------------------------------------------------------------------------
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QA Executive KPI & AI Healing Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --green: #10b981;
      --red: #f43f5e;
      --amber: #f59e0b;
      --blue: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 2rem;
      line-height: 1.5;
    }
    .container { max-width: 1240px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.75rem;
    }
    h1 { font-size: 1.6rem; font-weight: 700; }
    .meta { color: var(--muted); font-size: 0.9rem; margin-top: 0.25rem; }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
    }
    .badge-pass { background: rgba(16,185,129,0.15); color: var(--green); }
    .badge-fail { background: rgba(244,63,94,0.15); color: var(--red); }
    .badge-warn { background: rgba(245,158,11,0.15); color: var(--amber); }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.75rem;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      padding: 1.25rem;
    }
    .card-label { color: var(--muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .card-value { font-size: 2rem; font-weight: 700; margin: 0.35rem 0; }
    .card-sub { color: var(--muted); font-size: 0.85rem; }

    .grid-2 {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.75rem;
    }
    @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

    h2 { font-size: 1.05rem; margin-bottom: 1rem; color: #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td {
      text-align: left;
      padding: 0.65rem 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    th { color: var(--muted); font-weight: 600; }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.8rem;
    }
    pre {
      background: #090d16;
      padding: 0.75rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      color: #fda4af;
      margin-top: 0.4rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>QA Executive KPI &amp; AI Self-Healing Dashboard</h1>
        <div class="meta">Target URL: <strong>${escapeHtml(targetUrl)}</strong> &bull; Last Run: ${escapeHtml(timestamp)}</div>
      </div>
      <div>
        <span class="badge ${failed === 0 ? 'badge-pass' : 'badge-fail'}">
          ${failed === 0 ? 'SUITE PASSING' : `${failed} TEST(S) FAILING`}
        </span>
      </div>
    </header>

    <!-- KPI Row -->
    <section class="kpi-grid">
      <div class="card">
        <div class="card-label">Pass Rate</div>
        <div class="card-value" style="color: ${passRate >= 90 ? 'var(--green)' : passRate >= 70 ? 'var(--amber)' : 'var(--red)'}">
          ${passRate}%
        </div>
        <div class="card-sub">${escapeHtml(deltaLabel)}</div>
      </div>

      <div class="card">
        <div class="card-label">Test Execution Breakdown</div>
        <div class="card-value">${total} <span style="font-size:1rem;font-weight:400;color:var(--muted)">tests</span></div>
        <div class="card-sub">
          <span style="color:var(--green)">${passed} passed</span> &bull;
          <span style="color:var(--red)">${failed} failed</span> &bull;
          <span style="color:var(--amber)">${flaky} flaky</span>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Suite Duration</div>
        <div class="card-value" style="color: var(--blue)">${durationSec}s</div>
        <div class="card-sub">Across ${recentHistory.length} recorded run(s)</div>
      </div>

      <div class="card">
        <div class="card-label">AI Self-Healing &amp; Bugs</div>
        <div class="card-value">${healedCount} <span style="font-size:1rem;font-weight:400;color:var(--muted)">healed</span></div>
        <div class="card-sub">
          <span style="color:var(--red)">${bugFiles.length} Bug Report(s)</span> in <code>reports/bugs/</code>
        </div>
      </div>
    </section>

    <!-- Trend Chart + Slowest Tests -->
    <section class="grid-2">
      <div class="card">
        <h2>Pass Rate Trend (Last ${recentHistory.length} Runs)</h2>
        ${buildTrendSvg(recentHistory)}
      </div>

      <div class="card">
        <h2>Slowest Tests (Bottlenecks)</h2>
        <table>
          <thead>
            <tr><th>Test</th><th>Time</th></tr>
          </thead>
          <tbody>
            ${slowestTests.length === 0
        ? '<tr><td colspan="2" style="color:var(--muted)">No tests recorded</td></tr>'
        : slowestTests
            .map(
                (t) => `
              <tr>
                <td>${escapeHtml(t.title)}</td>
                <td><strong>${t.durationSec}s</strong></td>
              </tr>`
            )
            .join('')
    }
          </tbody>
        </table>
      </div>
    </section>

    <!-- Active Failures + AI Healing Log -->
    <section class="grid-2">
      <div class="card">
        <h2>Failed Tests Requiring Triage (${failures.length})</h2>
        ${failures.length === 0
        ? '<p style="color:var(--green)">Zero failing tests on the latest execution.</p>'
        : failures
            .map(
                (f) => `
          <div style="margin-bottom:1rem;">
            <div><strong>${escapeHtml(f.title)}</strong> <code style="color:var(--muted)">(${escapeHtml(f.file)}:${f.line})</code></div>
            <pre>${escapeHtml(f.error)}</pre>
          </div>`
            )
            .join('')
    }
      </div>

      <div class="card">
        <h2>AI Self-Healing &amp; Bug Triage Ledger</h2>
        <table>
          <thead>
            <tr><th>Spec</th><th>Action</th><th>Details</th></tr>
          </thead>
          <tbody>
            ${healingLog.length === 0
        ? '<tr><td colspan="3" style="color:var(--muted)">No AI healing events logged yet.</td></tr>'
        : healingLog
            .slice(0, 8)
            .map(
                (h) => `
              <tr>
                <td><code>${escapeHtml(h.specFile)}</code></td>
                <td>
                  <span class="badge ${h.outcome === 'HEALED' ? 'badge-pass' : 'badge-fail'}">
                    ${escapeHtml(h.outcome)}
                  </span>
                </td>
                <td><code>${escapeHtml(h.oldLocator)}</code> &rarr; <code>${escapeHtml(h.newLocator)}</code></td>
              </tr>`
            )
            .join('')
    }
          </tbody>
        </table>
      </div>
    </section>
  </div>
</body>
</html>`;

fs.writeFileSync(DASHBOARD_HTML_PATH, html);
console.log(markdown);
console.log(`Executive KPI Dashboard updated: ${DASHBOARD_HTML_PATH}`);