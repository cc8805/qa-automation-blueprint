---
trigger: model_decision
description: Apply whenever generating, refactoring, reviewing, or healing Playwright Page Object Models (tests/pages/) and E2E test specifications (tests/e2e/)
---

---

## 2. `.agents/rules/playwright-standards.md`

This file enforces deterministic, maintainable Playwright TypeScript code. Because its frontmatter uses `trigger: model_decision`, it costs almost zero tokens when the agent is doing non-coding tasks, and automatically activates whenever the agent generates or edits files in `tests/`.

```markdown
---
trigger: model_decision
description: Apply whenever generating, refactoring, reviewing, or healing Playwright Page Object Models (tests/pages/) and E2E test specifications (tests/e2e/).
---

# Playwright TypeScript Coding & Architecture Standards

Every test and Page Object generated in this repository must follow these deterministic coding standards to eliminate flakiness and maximize readability across projects.

## 1. Strict Locator Priority Hierarchy

Always select elements using user-facing accessibility attributes verified via the Playwright MCP accessibility snapshot. Follow this exact order of preference:

1. **Role + Accessible Name (Default):** `page.getByRole('button', { name: 'Create Account' })`
2. **Form Label:** `page.getByLabel('Email address')`
3. **Placeholder (Fallback for inputs without labels):** `page.getByPlaceholder('Search items...')`
4. **Visible Text (For non-interactive content):** `page.getByText('Order confirmed')`
5. **Test ID (Resilient fallback for dynamic widgets):** `page.getByTestId('cart-item-row')`

### Banned Selectors
- **NEVER** use raw XPath expressions (`//div[@id='main']/span[2]`).
- **NEVER** use brittle CSS class chains, auto-generated framework hashes, or positional selectors (`.css-1dbjc4n > div:nth-child(3)`).
- **NEVER** use `page.$()` or `page.$$()`—always use the lazy `Locator` API (`page.locator()`, `page.getByRole()`).

## 2. Page Object Model (POM) Separation of Concerns

All tests must separate **how to interact with a page** (`tests/pages/`) from **what business behavior is being verified** (`tests/e2e/`).

- **Page Objects (`tests/pages/<Feature>Page.ts`):**
  - Declare `readonly page: Page` and `readonly` `Locator` properties initialized in the constructor.
  - Expose high-level user action methods (e.g., `async submitShippingForm(data: ShippingData)`).
  - Do **not** hide business assertions inside Page Objects unless checking that a page navigation completed.
- **Test Specs (`tests/e2e/<feature>.spec.ts`):**
  - Import Page Objects and orchestrate the user journey (`Arrange -> Act -> Assert`).
  - Keep all business `await expect(...)` checks clearly visible inside the `test()` block.
  - Tag every test title or annotation (`@smoke`, `@regression`, `@critical`) so suites can be filtered via CLI (`npx playwright test --grep @smoke`).

## 3. Zero Flakiness & Synchronization Rules

- **Hard Sleeps Are Banned:** Never write `await page.waitForTimeout(3000)`.
- **Web-First Assertions Only:** Always use auto-retrying async matchers:
  - Good: `await expect(dashboardPage.welcomeBanner).toBeVisible();`
  - Bad: `expect(await dashboardPage.welcomeBanner.isVisible()).toBe(true);`
- **Network Synchronization:** When an action triggers an asynchronous API call before updating the UI, synchronize explicitly with `Promise.all` and `page.waitForResponse()` if auto-waiting assertions are insufficient.

## 4. Test Isolation & State Setup

- Every `test()` block must be 100% independent and able to pass when run alone or in parallel (`fullyParallel: true`).
- Never depend on data created by a previous `test()` block in the same file.
- Use `request` fixture in `test.beforeEach` for fast API data seeding when endpoints are available, and `page.route()` to mock unreliable third-party services (payment gateways, analytics, CAPTCHAs).

## 5. Golden Code Reference

### Page Object (`tests/pages/LoginPage.ts`)
```typescript
import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.errorAlert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}