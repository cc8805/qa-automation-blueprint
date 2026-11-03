---

### 2. `.agents/skills/2-explore-and-plan-cases/SKILL.md`
Create this file to explore `BASE_URL` against the Truth Matrix:

---
name: 2-explore-and-plan-cases
description: Reads the reconciled Truth Matrix and inspects the live BASE_URL via Playwright MCP to create a verified Test Plan with real accessible locators.
---

# Stage 2: Explore Live App & Plan Test Cases Skill

## Step 1: Load the Reconciled Truth Matrix
1. Read `reports/plans/<feature>-truth-matrix.md` and check `BASE_URL` in `.env`.
2. If `<feature>-truth-matrix.md` does not exist yet, run Skill `1-synthesize-spec-and-design` first.

## Step 2: Explore `BASE_URL` via Playwright MCP
1. Use the `playwright` MCP tools (`browser_navigate`, `browser_snapshot`, `browser_click`) to navigate the live application at `BASE_URL`.
2. Inspect the live **accessibility tree** (`role`, `name`, `label`, `placeholder`) for every flow listed in the Truth Matrix (`REQ-01`, `REQ-02`, etc.).
3. Compare what is built on `BASE_URL` against the Truth Matrix:
   - If the live app is missing a required button, state, or label defined in the Truth Matrix, **do NOT drop the test case**. Record the expected locator from the Truth Matrix and mark it as `[POTENTIAL APP DEFECT — Missing on Live URL]` so the test suite catches the bug!

## Step 3: Output `reports/plans/<feature>-test-plan.md`
Write `reports/plans/<feature>-test-plan.md` containing:
1. **Preconditions & Auth Mode:** Whether the feature requires authenticated state (`.auth/user.json`) or guest state.
2. **Verified Page Object Locators:** Exact Playwright locators (`getByRole`, `getByLabel`, `getByTestId`) mapped to each UI element.
3. **Live App vs. Truth Matrix Drift:** Any discrepancies spotted between the live `BASE_URL` and the Truth Matrix.
4. **Test Cases (`TC-01`, `TC-02`, ...):**
   - Mapped to `REQ-ID` from the Truth Matrix
   - Tag (`@smoke`, `@regression`, `@critical`)
   - Step-by-step actions and explicit `expect()` business/functional UI assertions (never pixel screenshot assertions).