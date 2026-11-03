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
- **Mandatory Missing-Source Alert:** Whenever one or more sources (Jira, local `specs/*.md`, or Figma) are not provided or not found, explicitly notify the user in chat and in the generated artifacts which sources were missing and which available sources were used.
- **Conflict Resolution (Hierarchy of Truth):** When Jira/Specs and Figma contradict each other:
  - **Jira / Written Spec wins** for business logic, calculations, permissions, and validation rules.
  - **Figma wins** for UI layout, button copy, field labels, and modal/component states.
  - Always flag every discrepancy explicitly to the user in chat and in the Truth Matrix.

## Mandatory 5-Stage Pipeline & Execute-Heal Loop
Execute work across isolated stages using the skills in `.agents/skills/`:

1. **Stage 1 — Synthesize Spec & Design (`1-synthesize-spec-and-design`):**
   - Check available inputs (Jira MCP, `specs/<feature>.md`, Figma MCP).
   - Apply the Hierarchy of Truth, flag missing sources or conflicts, and output `reports/plans/<feature>-truth-matrix.md`.
2. **Stage 2 — Explore Live App & Plan Cases (`2-explore-and-plan-cases`):**
   - Read ONLY `reports/plans/<feature>-truth-matrix.md`.
   - Inspect `BASE_URL` via the `playwright` MCP accessibility tree and output `reports/plans/<feature>-test-plan.md`.
3. **Stage 3 — Audit & Generate Code (`3-generate-tests`):**
   - Cross-check `<feature>-test-plan.md` against `<feature>-truth-matrix.md` to ensure 100% coverage of available requirements and Figma functional states (NO pixel-by-pixel screenshot assertions).
   - Generate Page Objects in `tests/pages/` and specs in `tests/e2e/` adhering to `.agents/rules/playwright-standards.md`.
4. **Stage 4 — Execute & Report (`4-execute-and-report`):**
   - Run `npx playwright test` and `node .agents/skills/4-execute-and-report/scripts/parse-metrics.mjs`.
   - Read `reports/metrics-summary.md`.
   - **Gate Decision:** If `failed == 0` (or all remaining failures have already hit the 2-strike cap and have bug reports filed), STOP and present the final report. If unhandled failures exist, trigger **Stage 5**.
5. **Stage 5 — Triage & Heal (`5-triage-and-heal`):**
   - Inspect failures from `reports/metrics-summary.md` against `<feature>-truth-matrix.md` and `.agents/rules/sacred-assertions.md`.
   - Apply at most 1 healing adjustment per failing test (up to the 2-strike cap) OR file a bug report in `reports/bugs/` if the live app violates the Truth Matrix.
   - Record the action with `--log-heal` and **immediately loop back to Stage 4 (`4-execute-and-report`)** to verify the fix and update `reports/kpi-dashboard.html`.