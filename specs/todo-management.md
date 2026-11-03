# Feature Spec: Todo Management (PROJ-101)

## 1. Overview
Users need to manage their daily task list efficiently by adding items, marking them as completed, filtering lists, and clearing completed tasks.

## 2. Requirements & Acceptance Criteria (Jira PROJ-101)
- **REQ-01 (Add Task):** A user can type a task in the main input box and press Enter to add it to the top/bottom of the active list. The input must clear immediately after submission. Empty tasks or whitespace-only strings must not be added.
- **REQ-02 (Complete Task):** Clicking a task's checkbox marks it as completed with a strikethrough style. The item count footer must decrement active items by 1.
- **REQ-03 (Filter List):** Users can switch between three filter views:
  - "All": Displays all items.
  - "Active" (Design also labels this "Active items"): Displays only uncompleted items.
  - "Completed": Displays only completed items.
- **REQ-04 (Clear Completed):** Clicking the "Clear completed" button removes all completed items from the list simultaneously. If no items are completed, the button should be hidden or disabled.

## 3. Design / UI Copy Notes (Figma Frame: Todo-Main-v2)
- Input placeholder text: `"What needs to be done?"`
- Filter buttons exact text: `All`, `Active`, `Completed`
- Clear button exact text: `Clear completed`