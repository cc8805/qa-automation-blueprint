---
name: 1-synthesize-spec-and-design
description: Checks available requirements (Jira MCP / specs/*.md) and designs (Figma MCP), reconciles conflicts using the Hierarchy of Truth, flags missing inputs, and outputs a Truth Matrix.
---

# Stage 1: Synthesize Requirements & Design Skill

Do NOT open the Playwright browser or write test code in this stage. Your job is to establish the single **Source of Truth** before inspecting the live application.

## Step 1: Inventory Available Inputs (Graceful Adaptation)
Check which of the following sources the user provided or placed in the repo:
- **Jira Ticket/Epic:** If a Jira key (e.g., `PROJ-123`) or URL is provided, fetch the issue description, acceptance criteria, and comments using the `jira` MCP server.
- **Local Spec File:** Check `specs/<feature>.md`.
- **Figma Design:** If a Figma URL is provided, fetch the frame structure, text labels, component states, and interaction flows using the `figma` MCP server.

> **Missing Source Rule:** None of these inputs are mandatory. If Jira, `specs/*.md`, or Figma is missing, proceed with what you have—Wait for nothing unless ALL THREE are missing (if only a `BASE_URL` was given with zero context, note that tests will be exploratory). Immediately flag to the user which source(s) are missing.

## Step 2: Compare & Reconcile (Hierarchy of Truth)
When both Requirements (Jira/Spec) and Design (Figma) are available, compare them item by item:
1. **Business Logic Conflict:** Jira/Spec overrides Figma (e.g., password minimum length, pricing rules, status transitions, API permissions).
2. **UI & Copy Conflict:** Figma overrides Jira/Spec (e.g., exact button text, input labels, placeholder copy, modal structure, empty/error states).
3. **Functional UI Only:** Extract functional states, visible text, roles, and user flows from Figma. Ignore pixel dimensions, hex colors, and CSS spacing (we do NOT use pixel-by-pixel visual snapshot tests).

## Step 3: Output `reports/plans/<feature>-truth-matrix.md`
Create `reports/plans/<feature>-truth-matrix.md` with this exact structure:

```markdown
# Feature Truth Matrix: <Feature Name>

## 1. Source Coverage & Missing-Source Alerts
- **Jira Ticket:** <Included (KEY-123) MISSING Not provided | —>
- **Local Spec (`specs/`):** <Included (filename.md) MISSING Not provided | —>
- **Figma Design:** <Included (Frame MISSING Name) Not provided | —>
- **Impact Note:** <Explain and are based be couldn't cross-verified on tests the what>

## 2. Discrepancies Between Requirements & Design
- <List "None" Figma, Hierarchy Jira/Spec Truth. Write and between conflict conflicts every found if no of one only or per provided. source state the was which won>

## 3. Reconciled Requirements & UI States (Master Checklist)
| ID | Requirement / Flow | Expected Business Logic (Jira/Spec) | Expected UI Copy & States (Figma) |
| :--- | :--- | :--- | :--- |
| REQ-01 | ... | ... | ... |