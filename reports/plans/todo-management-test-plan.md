# Test Plan: Todo Management

## 1. Preconditions & Auth Mode
- **Target Application:** TodoMVC (`https://demo.playwright.dev/todomvc`)
- **Authentication Mode:** Guest / Unauthenticated (no session token or credentials required)
- **State Isolation:** Each test starts from a clean session navigating to `BASE_URL` (local state / localStorage is isolated per browser context).

## 2. Verified Page Object Locators
Elements verified against live accessibility snapshot on `https://demo.playwright.dev/todomvc`:

| Logical Element | Live Role / Tag | Verified Playwright Locator | Notes |
| :--- | :--- | :--- | :--- |
| **New Todo Input** | textbox | `page.getByPlaceholder('What needs to be done?')` | Main task input field |
| **Todo Items List** | listitem | `page.getByRole('listitem')` (or `page.locator('.todo-list li')`) | All rendered todo items |
| **Item Checkbox** | checkbox | `item.getByRole('checkbox', { name: 'Toggle Todo' })` | Checkbox inside each item |
| **Item Label** | generic / label | `item.locator('label')` (or `item.getByText(title)`) | Text title of the item |
| **Item Delete Button** | button | `item.getByRole('button', { name: 'Delete' })` | Delete ("×") button on hover |
| **Active Count Label** | generic / text | `page.locator('.todo-count')` | Contains `<strong>X</strong> item(s) left` |
| **Filter "All"** | link | `page.getByRole('link', { name: 'All' })` | Route: `#/` |
| **Filter "Active"** | link | `page.getByRole('link', { name: 'Active' })` | Route: `#/active` |
| **Filter "Completed"**| link | `page.getByRole('link', { name: 'Completed' })` | Route: `#/completed` |
| **Clear Completed** | button | `page.getByRole('button', { name: 'Clear completed' })` | Hidden when completed count is 0 |

## 3. Live App vs. Truth Matrix Drift Analysis
- **Filter Element Type:** The Truth Matrix refers to filter controls (`All`, `Active`, `Completed`). On the live application, these are implemented as navigation links (`role="link"`, `<a>`), while "Clear completed" is implemented as a button (`role="button"`). Page objects will use `getByRole('link', { name: ... })` for the filter tabs and `getByRole('button', { name: 'Clear completed' })` for the clear action.
- **Drift Alerts:** `None` — The live application on `BASE_URL` matches the Truth Matrix in all functional flows, copy, and behavioral expectations.

## 4. Test Cases

### TC-01: Add New Active Todo Item
- **Requirement:** `REQ-01`
- **Tags:** `@smoke`, `@critical`
- **Description:** Verifies that a user can enter a new task title and submit it via Enter key. The item is displayed in the list with an unchecked checkbox, the input is cleared, and active count updates.
- **Preconditions:** Fresh page visit to `BASE_URL`.
- **Steps:**
  1. Navigate to `BASE_URL`.
  2. Fill input `page.getByPlaceholder('What needs to be done?')` with `"Buy groceries"`.
  3. Press `Enter`.
- **Expected Assertions:**
  - `await expect(todoPage.todoItems).toHaveCount(1)`
  - `await expect(todoPage.todoItems.first()).toHaveText('Buy groceries')`
  - `await expect(todoPage.todoCheckbox(todoPage.todoItems.first())).not.toBeChecked()`
  - `await expect(todoPage.newTodoInput).toBeEmpty()`
  - `await expect(todoPage.todoCount).toHaveText('1 item left')`

---

### TC-02: Ignore Empty and Whitespace-Only Todo Submissions
- **Requirement:** `REQ-01`
- **Tags:** `@regression`
- **Description:** Verifies that submitting empty string or whitespace-only characters does not create any todo item.
- **Preconditions:** Fresh page visit to `BASE_URL`.
- **Steps:**
  1. Navigate to `BASE_URL`.
  2. Focus `page.getByPlaceholder('What needs to be done?')` and press `Enter` with empty value.
  3. Fill input with `"   "` (spaces) and press `Enter`.
- **Expected Assertions:**
  - `await expect(todoPage.todoItems).toHaveCount(0)`
  - `await expect(todoPage.newTodoInput).toBeEmpty()`

---

### TC-03: Complete Active Todo Item
- **Requirement:** `REQ-02`
- **Tags:** `@smoke`
- **Description:** Verifies that toggling the item checkbox marks the item completed with strikethrough styling and decrements the active count in the footer.
- **Preconditions:** At least 2 active items created (`"Buy groceries"`, `"Walk dog"`).
- **Steps:**
  1. Add tasks `"Buy groceries"` and `"Walk dog"`.
  2. Click the checkbox for `"Buy groceries"`.
- **Expected Assertions:**
  - `await expect(todoPage.todoCheckbox(todoPage.todoItems.nth(0))).toBeChecked()`
  - `await expect(todoPage.todoItems.nth(0)).toHaveClass(/completed/)`
  - `await expect(todoPage.todoCheckbox(todoPage.todoItems.nth(1))).not.toBeChecked()`
  - `await expect(todoPage.todoCount).toHaveText('1 item left')`

---

### TC-04: Filter Todo List by All, Active, and Completed
- **Requirement:** `REQ-03`
- **Tags:** `@regression`
- **Description:** Verifies that clicking filter links correctly alters visibility of active vs completed items.
- **Preconditions:** One completed task (`"Buy groceries"`) and one active task (`"Walk dog"`).
- **Steps:**
  1. Setup items: `"Buy groceries"` (completed) and `"Walk dog"` (active).
  2. Click `Active` filter link (`getByRole('link', { name: 'Active' })`).
  3. Verify only `"Walk dog"` is displayed.
  4. Click `Completed` filter link (`getByRole('link', { name: 'Completed' })`).
  5. Verify only `"Buy groceries"` is displayed.
  6. Click `All` filter link (`getByRole('link', { name: 'All' })`).
  7. Verify both `"Buy groceries"` and `"Walk dog"` are displayed.
- **Expected Assertions:**
  - In Active view: `await expect(todoPage.todoItems).toHaveCount(1)`, item text is `"Walk dog"`, filter link has class `selected`.
  - In Completed view: `await expect(todoPage.todoItems).toHaveCount(1)`, item text is `"Buy groceries"`, filter link has class `selected`.
  - In All view: `await expect(todoPage.todoItems).toHaveCount(2)`, filter link has class `selected`.

---

### TC-05: Clear Completed Items Simultaneously
- **Requirement:** `REQ-04`
- **Tags:** `@regression`
- **Description:** Verifies that "Clear completed" button removes all completed items and disappears once all completed items are cleared.
- **Preconditions:** 2 items created, 1 marked completed.
- **Steps:**
  1. Add `"Buy groceries"` and `"Walk dog"`.
  2. Mark `"Buy groceries"` as completed.
  3. Verify `Clear completed` button is visible.
  4. Click `page.getByRole('button', { name: 'Clear completed' })`.
- **Expected Assertions:**
  - `await expect(todoPage.todoItems).toHaveCount(1)`
  - `await expect(todoPage.todoItems.first()).toHaveText('Walk dog')`
  - `await expect(todoPage.clearCompletedButton).toBeHidden()`
  - `await expect(todoPage.todoCount).toHaveText('1 item left')`
