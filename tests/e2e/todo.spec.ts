/**
 * Feature: Todo Management (PROJ-101)
 *
 * Sources Used:
 * - Jira Ticket: PROJ-101 (Embedded in local spec; Jira MCP not linked)
 * - Local Spec: specs/todo-management.md
 * - Figma Design: Frame Todo-Main-v2 (Embedded in local spec; Figma MCP not linked)
 *
 * Discrepancies & Synthesis:
 * - REQ-03 mentions alternate button label "Active items", but Figma copy notes specify "Active".
 *   Hierarchy of Truth: Figma wins for UI button copy -> "Active".
 * - REQ-04 Clear Completed button is conditionally visible only when completed items exist.
 */

import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';

test.describe('Todo Management', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('TC-01: should add tasks and clear input field @smoke @critical', async () => {
    // REQ-01: User adds a task; input clears immediately
    await todoPage.addTodo('Buy groceries');
    await expect(todoPage.input).toHaveValue('');
    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.getTodoItem('Buy groceries')).toBeVisible();

    // REQ-01: Add second task to list
    await todoPage.addTodo('Walk the dog');
    await expect(todoPage.input).toHaveValue('');
    await expect(todoPage.todoItems).toHaveCount(2);
    await expect(todoPage.todoItems).toHaveText(['Buy groceries', 'Walk the dog']);
    await expect(todoPage.todoCount).toHaveText('2 items left');
  });

  test('TC-02: should ignore empty and whitespace-only submissions @regression', async () => {
    // REQ-01: Empty tasks or whitespace-only strings must not be added
    await todoPage.input.press('Enter');
    await expect(todoPage.todoItems).toHaveCount(0);

    await todoPage.addTodo('   ');
    await expect(todoPage.todoItems).toHaveCount(0);
  });

  test('TC-03: should mark task as completed and update counter @smoke @critical', async () => {
    // Setup 2 tasks
    await todoPage.addTodo('Task 1');
    await todoPage.addTodo('Task 2');
    await expect(todoPage.todoCount).toHaveText('2 items left');

    // REQ-02: Clicking checkbox marks as completed with strikethrough class
    await todoPage.toggleTodo('Task 1');
    await expect(todoPage.getTodoCheckbox('Task 1')).toBeChecked();
    await expect(todoPage.getTodoItem('Task 1')).toHaveClass(/completed/);

    // REQ-02: Item count decrements active items by 1
    await expect(todoPage.todoCount).toHaveText('1 item left');
  });

  test('TC-04: should filter list by All, Active, and Completed views @smoke @regression', async () => {
    // REQ-03: Setup one active and one completed item
    await todoPage.addTodo('Active Task');
    await todoPage.addTodo('Completed Task');
    await todoPage.toggleTodo('Completed Task');

    // Filter: Active
    await todoPage.filterBy('Active');
    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.getTodoItem('Active Task')).toBeVisible();
    await expect(todoPage.getTodoItem('Completed Task')).not.toBeVisible();

    // Filter: Completed
    await todoPage.filterBy('Completed');
    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.getTodoItem('Completed Task')).toBeVisible();
    await expect(todoPage.getTodoItem('Active Task')).not.toBeVisible();

    // Filter: All
    await todoPage.filterBy('All');
    await expect(todoPage.todoItems).toHaveCount(2);
    await expect(todoPage.getTodoItem('Active Task')).toBeVisible();
    await expect(todoPage.getTodoItem('Completed Task')).toBeVisible();
  });

  test('TC-05: should clear completed items @smoke @regression', async () => {
    // Setup
    await todoPage.addTodo('Task A');
    await todoPage.addTodo('Task B');

    // REQ-04: "Clear completed" should be hidden when no items are completed
    await expect(todoPage.clearCompletedButton).not.toBeVisible();

    // Mark Task A complete
    await todoPage.toggleTodo('Task A');
    await expect(todoPage.clearCompletedButton).toBeVisible();

    // REQ-04: Clicking "Clear completed" removes completed items simultaneously
    await todoPage.clearCompleted();
    await expect(todoPage.todoItems).toHaveCount(1);
    await expect(todoPage.getTodoItem('Task B')).toBeVisible();
    await expect(todoPage.getTodoItem('Task A')).not.toBeVisible();

    // REQ-04: Button is hidden again once no completed items remain
    await expect(todoPage.clearCompletedButton).not.toBeVisible();
  });
});

