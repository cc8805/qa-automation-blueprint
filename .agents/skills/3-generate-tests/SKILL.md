---
name: 3-generate-tests
description: Audits the Test Plan against the Truth Matrix (Jira/Spec/Figma) and generates Playwright Page Objects (tests/pages/) and E2E specs (tests/e2e/).
---

# Stage 3: Pre-Flight Audit & Playwright Code Generation Skill

## Step 1: Mandatory Pre-Flight Coverage Audit
Before writing any TypeScript code, read BOTH:
- `reports/plans/<feature>-truth-matrix.md`
- `reports/plans/<feature>-test-plan.md`

Verify the following:
1. **Source Check:** Confirm whether Jira, local `specs/*.md`, and Figma were checked in Stage 1. If the user provided a new Figma or Jira link that is not in `<feature>-truth-matrix.md`, stop and run `1-synthesize-spec-and-design` first.
2. **100% Requirement Traceability:** Check that every single `REQ-ID` in the Truth Matrix has at least one corresponding `TC-ID` in the Test Plan. If any requirement or Figma functional UI state was skipped, add it to the Test Plan before generating code.
3. **No Pixel Snapshots:** Confirm no test uses `toHaveScreenshot()`. All Figma checks must use functional DOM assertions (`toBeVisible()`, `toHaveText()`, `toHaveAttribute()`, `toBeEnabled()`).

## Step 2: Generate Page Object Models (`tests/pages/<Feature>Page.ts`)
1. Load `.agents/rules/playwright-standards.md`.
2. Create or update the Page Object class in `tests/pages/<Feature>Page.ts` using the verified accessible locators from the Test Plan.

## Step 3: Generate E2E Test Specs (`tests/e2e/<feature>.spec.ts`)
1. Create `tests/e2e/<feature>.spec.ts` implementing every test case (`TC-01`, `TC-02`, etc.).
2. Add a comment header at the top of the `.spec.ts` file documenting:
   - Sources used (e.g., `Jira: PROJ-123 | Figma: Checkout Frame | Spec: Missing`)
   - Discrepancies noted during synthesis
3. Keep all `expect()` assertions inside the `test()` blocks.

## Step 4: Write Stage 3 Handoff File (Mandatory Exit Step)
First read `reports/handoffs/stage-2-handoff.json` if not injected. Before finishing, write `reports/handoffs/stage-3-handoff.json` containing `feature`, `stage: 3`, `status: "COMPLETED"`, `truthMatrixPath`, `pageObjectPath`, `specFilePath`, and `testCount`.