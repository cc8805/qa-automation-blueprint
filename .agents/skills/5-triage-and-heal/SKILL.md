---
name: 5-triage-and-heal
description: Diagnoses failing tests from reports/metrics-summary.md against the Truth Matrix and sacred-assertions.md, heals broken locators (max 2 strikes) or files bug reports, and loops back to 4-execute-and-report.
---

# Stage 5: Triage & Heal Skill (With Mandatory Re-Execution Loop)

You are invoked only when `4-execute-and-report` detects failing tests in `reports/metrics-summary.md`. You must strictly obey `.agents/rules/sacred-assertions.md`.

## Step 1: Check Strike Count & Context
1. Read `reports/metrics-summary.md`, `reports/healing-log.json` (if it exists), and `reports/plans/<feature>-truth-matrix.md`.
2. Count how many `HEALED` attempts have already been logged for the failing spec in this session:
   - **0 or 1 prior attempts:** You may proceed with diagnosis and healing (Strike 1 or Strike 2).
   - **2 prior attempts failed:** You have hit the **2-Strike Healing Cap**. Do NOT attempt a 3rd code change—jump directly to **Case B (File a Bug Report)** below.

## Step 2: Diagnose Against Live URL & Truth Matrix
Use the `playwright` MCP tools (`browser_navigate`, `browser_snapshot`) to inspect the live page at `BASE_URL` where the failure occurred, and classify each failure into **Case A** or **Case B**:

### Case A — Locator or Synchronization Drift (Heal Allowed)
- **Criteria:** The application at `BASE_URL` still satisfies the business logic and Figma functional state in `<feature>-truth-matrix.md`, but a locator path, ARIA role, or timing wait in `tests/pages/<Feature>Page.ts` was inaccurate.
- **Action:**
  1. Update the locator or synchronization wait in `tests/pages/<Feature>Page.ts` (NEVER weaken or alter business `expect()` values in `tests/e2e/`).
  2. Log the heal to the KPI ledger:
     `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs --log-heal "<specFile>" "<oldLocator>" "<newLocator>" "HEALED"`

### Case B — Real Application Defect or Spec/Design Violation (Stop Healing & File Bug)
- **Criteria:** The live application at `BASE_URL` violates `<feature>-truth-matrix.md` (wrong calculation, missing Figma UI state/button, broken validation, HTTP 500 error) OR the test has failed after 2 healing strikes.
- **Action:**
  1. Revert any experimental test edits so the test remains an honest red indicator of the defect.
  2. Create a local Markdown bug report at `reports/bugs/BUG-<feature>-<YYYYMMDD-HHMM>.md` containing:
     - **Violated Source:** Jira Issue ID, Local Spec file, or Figma Frame name
     - **Steps to Reproduce on `BASE_URL`**
     - **Expected Result** (from Truth Matrix) vs. **Actual Result** (on `BASE_URL`)
     - **Evidence:** Error trace and screenshot path from `reports/html/`
  3. Log the filed bug to the KPI ledger:
     `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs --log-heal "<specFile>" "<failedExpectation>" "reports/bugs/BUG-<feature>-<YYYYMMDD-HHMM>.md" "BUG_FILED"`

## Step 3: Mandatory Loop Back to Stage 4 (`4-execute-and-report`)
You are **never** allowed to end the workflow inside Stage 5.
Immediately after completing Case A or Case B, invoke Skill **`4-execute-and-report`** so that:
1. Any healed test is actually executed and proven green (or caught if it fails on Strike 2).
2. `parse-metrics.mjs` runs again and refreshes `reports/kpi-dashboard.html` and `reports/metrics-summary.md` with the latest pass rate and healing ledger entries.

## Step 4: Write Stage 5 Handoff File (Mandatory Exit Step)
Before handing back to Stage 4, write `reports/handoffs/stage-5-handoff.json` containing `feature`, `stage: 5`, `strikeCount`, `actionTaken` (`"HEALED"` or `"BUG_FILED"`), `targetSpec`, `bugReportPath`, and `rerunRequired: true`.