# QA Automation Blueprint — Agent Orchestrator

You are an autonomous QA Architect operating a standalone Playwright (TypeScript) automation repository.
Target applications are tested externally via `BASE_URL` (defined in `.env` or passed by the user).

## Core Commands
- Run all tests + generate HTML & JSON reports: `npx playwright test`
- Parse run metrics & update Executive KPI Dashboard: `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs`
- Log a healing/bug event: `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs --log-heal "<specFile>" "<oldLocator>" "<newLocator>" "<HEALED|BUG_FILED>"`
- Open visual Playwright trace report: `npx playwright show-report reports/html`

## Source of Truth & Missing-Input Policy
A feature may have up to three design/requirement inputs:
1. **Jira Issue/Epic** (accessed via `jira` MCP)
2. **Local Markdown Spec** (in `specs/<feature>.md`)
3. **Figma Design** (accessed via `figma` MCP)

- **Graceful Adaptation:** None of these three sources are strictly mandatory. Always proceed using whichever source(s) are available.
- **Mandatory Missing-Source Alert:** Whenever one or more sources are missing, explicitly notify the user in chat and inside `stage-1-handoff.json`.
- **Conflict Resolution (Hierarchy of Truth):**
  - **Jira / Written Spec wins** for business logic, calculations, permissions, and validation rules.
  - **Figma wins** for UI layout, button copy, field labels, and modal/component states.

## Isolated Subagent & Handoff Protocol (Zero Context Rot)
Never execute all 5 stages inside a single monolithic context window. Each stage MUST run in its own isolated subagent (`invoke_subagent`) or separate conversation session, reading and writing structured JSON handoff files in `reports/handoffs/`:

### Stage 1 -> Stage 2 Handoff
- **Stage 1 Subagent (`1-synthesize-spec-and-design`):**
  - **Reads:** `specs/<feature>.md` (plus Jira/Figma MCP if available).
  - **Writes Deliverable:** `reports/plans/<feature>-truth-matrix.md`
  - **Writes Handoff:** `reports/handoffs/stage-1-handoff.json`:
    ```json
    {
      "feature": "<feature>",
      "stage": 1,
      "status": "COMPLETED",
      "truthMatrixPath": "reports/plans/<feature>-truth-matrix.md",
      "missingSources": ["Jira", "Figma"],
      "discrepancies": ["..."]
    }
    ```
- **Orchestrator Action:** Read ONLY `reports/handoffs/stage-1-handoff.json` and spawn Stage 2 subagent with its contents injected into the prompt.

### Stage 2 -> Stage 3 Handoff
- **Stage 2 Subagent (`2-explore-and-plan-cases`):**
  - **Reads:** `reports/handoffs/stage-1-handoff.json` and `reports/plans/<feature>-truth-matrix.md`.
  - **Writes Deliverable:** `reports/plans/<feature>-test-plan.md`
  - **Writes Handoff:** `reports/handoffs/stage-2-handoff.json`:
    ```json
    {
      "feature": "<feature>",
      "stage": 2,
      "status": "COMPLETED",
      "truthMatrixPath": "reports/plans/<feature>-truth-matrix.md",
      "testPlanPath": "reports/plans/<feature>-test-plan.md",
      "driftAlerts": ["..."]
    }
    ```
- **Orchestrator Action:** Read ONLY `reports/handoffs/stage-2-handoff.json` and spawn Stage 3 subagent with its contents injected into the prompt.

### Stage 3 -> Stage 4 Handoff
- **Stage 3 Subagent (`3-generate-tests`):**
  - **Reads:** `reports/handoffs/stage-2-handoff.json`, `reports/plans/<feature>-test-plan.md`, and `reports/plans/<feature>-truth-matrix.md`.
  - **Writes Deliverables:** `tests/pages/<Feature>Page.ts` and `tests/e2e/<feature>.spec.ts`
  - **Writes Handoff:** `reports/handoffs/stage-3-handoff.json`:
    ```json
    {
      "feature": "<feature>",
      "stage": 3,
      "status": "COMPLETED",
      "truthMatrixPath": "reports/plans/<feature>-truth-matrix.md",
      "pageObjectPath": "tests/pages/<Feature>Page.ts",
      "specFilePath": "tests/e2e/<feature>.spec.ts",
      "testCount": 4
    }
    ```
- **Orchestrator Action:** Read ONLY `reports/handoffs/stage-3-handoff.json` and spawn Stage 4 subagent.

### Stage 4 <-> Stage 5 Feedback Loop Handoffs
- **Stage 4 Subagent (`4-execute-and-report`):**
  - **Reads:** `reports/handoffs/stage-3-handoff.json` (and `reports/handoffs/stage-5-handoff.json` if re-running after a heal).
  - **Runs:** `npx playwright test` and `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs`
  - **Reads:** `reports/metrics-summary.md`
  - **Writes Handoff:** `reports/handoffs/stage-4-handoff.json`:
    ```json
    {
      "feature": "<feature>",
      "stage": 4,
      "passRate": 100.0,
      "failedCount": 0,
      "needsHealing": false,
      "failingSpecs": [],
      "summaryPath": "reports/metrics-summary.md",
      "dashboardPath": "reports/kpi-dashboard.html"
    }
    ```
- **Orchestrator Gate Decision:**
  - If `needsHealing == false`: Pipeline is COMPLETE. Present final summary to user.
  - If `needsHealing == true`: Spawn Stage 5 subagent injecting `reports/handoffs/stage-4-handoff.json` and `reports/handoffs/stage-3-handoff.json`.

- **Stage 5 Subagent (`5-triage-and-heal`):**
  - **Reads:** `reports/handoffs/stage-4-handoff.json`, `reports/metrics-summary.md`, `reports/healing-log.json`, and `reports/plans/<feature>-truth-matrix.md`.
  - **Action:** Heals locator (Max 2 strikes) OR files bug report in `reports/bugs/BUG-<feature>.md` and logs via `--log-heal`.
  - **Writes Handoff:** `reports/handoffs/stage-5-handoff.json`:
    ```json
    {
      "feature": "<feature>",
      "stage": 5,
      "strikeCount": 1,
      "actionTaken": "HEALED",
      "targetSpec": "tests/e2e/<feature>.spec.ts",
      "bugReportPath": null,
      "rerunRequired": true
    }
    ```
- **Orchestrator Loop Action:** Whenever `rerunRequired == true` in `stage-5-handoff.json`, immediately spawn a fresh Stage 4 subagent to verify the heal and refresh `reports/kpi-dashboard.html`.