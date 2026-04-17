import { expect, test } from '@playwright/test'

test.describe('Public Auth Flows', () => {
  test('unauthorized user accessing deckbuilder is redirected to login', async ({ page }) => {
    // Attempt to access a protected route
    await page.goto('/deckbuilder');

    // Should redirect to login with the original path as redirect param
    await expect(page).toHaveURL(/\/login\?redirect=\/deckbuilder/);
    
    // Ensure the login form is visible
    await expect(page.getByRole('heading', { name: /accesso costruttori/i })).toBeVisible();
  });

  test('successful user login redirects to dashboard immediately', async ({ page }) => {
    // Mock standard normal user login (not admin)
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'valid-user-jwt-token',
          username: 'ChronosMaster',
          isAdmin: false,
        }),
      });
    });

    // Mock the user profile fetch that happens post-login
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'ChronosMaster',
          email: 'chronos@joule.com',
          created_at: '2026-04-17T00:00:00.000Z'
        }),
      });
    });

    // Go to login page
    await page.goto('/login');

    // Fill the credentials
    await page.getByPlaceholder(/frequenza temporale/i).fill('chronos@joule.com');
    await page.getByPlaceholder(/passphrase/i).fill('password123');
    
    // Click login
    await page.getByRole('button', { name: /sincronizzazione/i }).click();

    // Verify it navigates to HOME
    await expect(page).toHaveURL('http://127.0.0.1:4173/');

    // Verify localStorage token
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('token'))).toBe('valid-user-jwt-token');
    
    // The username should be visible on the main page (if your header displays it or logout button exists)
    // We check that matrix state is visible
    await expect(page.getByText(/stato matrice/i)).toBeVisible();
  });
});
