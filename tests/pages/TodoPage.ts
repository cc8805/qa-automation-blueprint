import { type Page, type Locator } from '@playwright/test';

export class TodoPage {
  readonly page: Page;
  readonly input: Locator;
  readonly todoItems: Locator;
  readonly todoCount: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;
  readonly clearCompletedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.getByTestId('todo-item');
    this.todoCount = page.getByTestId('todo-count');
    this.filterAll = page.getByRole('link', { name: 'All' });
    this.filterActive = page.getByRole('link', { name: 'Active' });
    this.filterCompleted = page.getByRole('link', { name: 'Completed' });
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear completed' });
  }

  async goto(): Promise<void> {
    await this.page.goto('');
  }

  async addTodo(text: string): Promise<void> {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  getTodoItem(text: string): Locator {
    return this.todoItems.filter({ hasText: text });
  }

  getTodoCheckbox(text: string): Locator {
    return this.getTodoItem(text).getByRole('checkbox', { name: 'Toggle Todo' });
  }

  async toggleTodo(text: string): Promise<void> {
    await this.getTodoCheckbox(text).click();
  }

  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton.click();
  }

  async filterBy(filter: 'All' | 'Active' | 'Completed'): Promise<void> {
    if (filter === 'All') {
      await this.filterAll.click();
    } else if (filter === 'Active') {
      await this.filterActive.click();
    } else if (filter === 'Completed') {
      await this.filterCompleted.click();
    }
  }
}

