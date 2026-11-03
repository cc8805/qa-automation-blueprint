import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.resolve('.auth/user.json');

setup('authenticate test user', async ({ page }) => {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    const loginPath = process.env.LOGIN_PATH || '/login';

    // 1. Public App Mode: If no credentials are set in .env, save an empty guest state
    if (!email || !password) {
        console.log('No TEST_USER_EMAIL set in .env — running in unauthenticated guest mode.');
        await page.context().storageState({ path: authFile });
        return;
    }

    // 2. Authenticated App Mode: Log in once via the UI
    await page.goto(loginPath);

    await page.getByLabel(/email|username/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in|log in|submit/i }).click();

    // Wait until the browser navigates away from the login URL
    await expect(page).not.toHaveURL(new RegExp(`${loginPath}$`, 'i'));

    // 3. Save cookies and localStorage tokens to .auth/user.json
    await page.context().storageState({ path: authFile });
});