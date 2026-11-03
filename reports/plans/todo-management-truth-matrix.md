# Feature Truth Matrix: Todo Management

## 1. Source Coverage & Missing-Source Alerts
- **Jira Ticket:** MISSING — Not provided (referenced as PROJ-101 in local spec; Jira MCP not connected)
- **Local Spec (`specs/`):** Included (`specs/todo-management.md`)
- **Figma Design:** MISSING — Not provided (referenced Frame Todo-Main-v2 notes in local spec; Figma MCP not connected)
- **Impact Note:** Gracefully adapted using the local specification in `specs/todo-management.md`. Jira acceptance criteria and Figma UI copy notes embedded within the local spec were synthesized according to the Hierarchy of Truth. Direct live Jira issues and Figma frames could not be independently queried.

## 2. Discrepancies Between Requirements & Design
- **Filter Button Label (REQ-03):** Requirement text mentions alternate label "Active items", but Figma copy notes specify exact text `Active`. Applying Hierarchy of Truth (Figma wins on UI copy and button labels), the expected button label is `Active`.

## 3. Reconciled Requirements & UI States (Master Checklist)
| ID | Requirement / Flow | Expected Business Logic (Jira/Spec) | Expected UI Copy & States (Figma) |
| :--- | :--- | :--- | :--- |
| REQ-01 | Add Task | User types task into input box and presses Enter. Task is added to the list. Input clears immediately upon submission. Empty tasks or whitespace-only strings are ignored / not added. | Input placeholder text: `"What needs to be done?"`. New items render with an unselected toggle checkbox. |
| REQ-02 | Complete Task | Clicking the task's toggle checkbox marks it as completed (strikethrough styling). The item count footer decrements active count by 1. | Checkbox marked checked; task label shows completed strikethrough styling; footer reflects active count (e.g. `"1 item left"`). |
| REQ-03 | Filter List | Switching between filter views updates list visibility: "All" displays all items, "Active" displays only uncompleted items, "Completed" displays only completed items. | Filter button controls with exact text: `All`, `Active`, `Completed`. Selected filter is highlighted. |
| REQ-04 | Clear Completed | Clicking "Clear completed" removes all completed items simultaneously. When no items are completed, the button should be hidden or disabled. | Clear button with exact text: `Clear completed`. Only visible/active when ≥1 completed item is present. |
