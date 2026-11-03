---
name: 4-execute-and-report
description: Runs the Playwright test suite, updates reports/metrics-summary.md and reports/kpi-dashboard.html, and decides whether the suite is complete or needs Stage 5 (5-triage-and-heal).
---

# Stage 4: Execute & Report Skill (The Gatekeeper)

Do NOT edit any test code or Page Objects during this stage. Your sole responsibility is deterministic execution, metric generation, and gate evaluation.

## Step 1: Run the Suite
1. Execute the Playwright test suite in the terminal:
   `npx playwright test`
   *(Note: If re-running after a single-file heal from Stage 5, you may run the full suite or the targeted spec file so `reports/json/test-results.json` is freshly generated).*

## Step 2: Generate Markdown & HTML KPI Reports
1. Immediately run the metrics parser (even if `npx playwright test` exited with a non-zero failure code):
   `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs`
2. Read `reports/metrics-summary.md` (NEVER load raw `reports/json/test-results.json` into context).

## Step 3: Evaluate the Loop Gate
Inspect the **Failed Tests Requiring Triage** section in `reports/metrics-summary.md`:

- **Condition A — Zero Failures (`0 failed`):**
  - The loop is **COMPLETE**.
  - Report the final Pass Rate, total duration, any missing-source/discrepancy notes from Stage 1, and paths to `reports/kpi-dashboard.html` and `reports/html/index.html`.
- **Condition B — Failures Exist, All Accounted For by Bug Reports / 2-Strike Cap:**
  - If every remaining failing test has already been diagnosed as a real application defect (with a `BUG_FILED` entry in `reports/healing-log.json` and a bug report in `reports/bugs/`) or has exhausted its 2 healing strikes, **STOP the loop**.
  - Report the final metrics and list the filed bug reports for the user.
- **Condition C — Unhandled Failures Exist (Under 2 Strikes):**
  - Hand control immediately to Skill **`5-triage-and-heal`**.

## Step 4: Write Stage 4 Handoff File (Mandatory Exit Step)
Before finishing, write `reports/handoffs/stage-4-handoff.json` containing `feature`, `stage: 4`, `passRate`, `failedCount`, `needsHealing` (`true` if unhandled failures remain under the 2-strike cap, otherwise `false`), `failingSpecs`, `summaryPath`, and `dashboardPath`.