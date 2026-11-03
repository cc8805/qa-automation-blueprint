# Bug Report: Todo Item Counter Mismatch on Completion

- **Bug ID:** `BUG-todo-management-20261103-1545`
- **Feature Spec:** `specs/todo-management.md` (Jira: PROJ-101)
- **Target App URL:** `https://demo.playwright.dev/todomvc`
- **Date/Time:** 2026-11-03 15:45:22 UTC
- **Severity:** High / Blockers

---

## 1. Summary of Defect
When a user marks an active todo item as completed, the active items footer counter fails to decrement immediately. The UI state does not reflect the acceptance criteria defined in REQ-02.

---

## 2. Violated Requirement / Truth Matrix Source
- **Requirement:** REQ-02 (Complete Task) in `reports/plans/todo-management-truth-matrix.md`
- **Expected Behavior (from Spec):** "Clicking a task's checkbox marks it as completed with a strikethrough style. The item count footer must decrement active items by 1."
- **Actual Behavior (on Live App):** Checkbox toggles strikethrough styling, but the footer text still reads "3 items left" instead of "2 items left".

---

## 3. Steps to Reproduce on `BASE_URL`
1. Navigate to `https://demo.playwright.dev/todomvc`.
2. Add 3 distinct tasks ("Buy milk", "Walk dog", "Write code").
3. Observe the footer displaying `"3 items left"`.
4. Click the checkbox for "Buy milk".
5. Observe the footer counter text.

---

## 4. Evidence & Diagnostics
- **Failing Spec File:** `tests/e2e/todo.spec.ts` (Line 42)
- **Failing Expectation:** `expect(footerCount).toHaveText('2 items left')`
- **Trace & Screenshot Artifacts:** 
  - Trace Viewer path: `reports/html/index.html` (Trace attached for `todo-management > complete task updates footer`)
  - Screenshot captured at failure: `reports/html/data/failure-screenshot-1.png`

---

## 5. Healing & Triage Audit Trail
- **Strike Count Attempted:** 2 / 2 (Locator verified correct via Playwright MCP DOM tree inspection; bug confirmed as application-side defect; anti-bug-masking rule applied to prevent test assertion mutation).
- **Ledger Status:** Logged as `BUG_FILED` in `reports/healing-log.json`.