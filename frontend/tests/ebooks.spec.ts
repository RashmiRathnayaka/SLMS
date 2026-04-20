import { test, expect } from '@playwright/test';

// Login helper - runs before each test
async function loginAsStudent(page: any) {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'ashan@student.lk');
  await page.fill('input[type="password"]', 'Student@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

// Test 1 - E-Book page loads correctly
test('ebook library page loads', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('http://localhost:5173/ebooks');
  await expect(page.locator('h1')).toContainText('E-Books Library');
});

// Test 2 - Search works
test('search ebooks by title', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('http://localhost:5173/ebooks');
  await page.fill('input.search-input', 'Mathematics');
  await page.click('button.btn-primary');
  await page.waitForTimeout(1000);
  const cards = page.locator('.card');
  await expect(cards.first()).toBeVisible();
});

// Test 3 - Switch to Leaderboard tab
test('leaderboard tab displays', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('http://localhost:5173/ebooks');
  await page.click('button.filter-tab:has-text("Leaderboard")');
  await expect(page.locator('text=This Week\'s Leaderboard')).toBeVisible();
});

// Test 4 - Switch to Favourites tab
test('favourites tab displays', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('http://localhost:5173/ebooks');
  await page.click('button.filter-tab:has-text("Favourites")');
  await expect(page.locator('.filter-tab.active')).toContainText('Favourites');
});

// Test 5 - All ebooks tab is default
test('all ebooks tab is active by default', async ({ page }) => {
  await loginAsStudent(page);
  await page.goto('http://localhost:5173/ebooks');
  await expect(page.locator('.filter-tab.active')).toContainText('All E-Books');
});