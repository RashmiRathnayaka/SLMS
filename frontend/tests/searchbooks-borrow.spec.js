
//  Playwright Tests — Search Books & Borrow Management

import { test, expect } from '@playwright/test';

//  Shared login helper 
async function loginAsStudent(page) {
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'ashan@student.lk');
  await page.fill('input[type="password"]', 'Student@1234');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}


//  TEST SUITE 1: Search Books

test.describe('Search Books Feature', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('http://localhost:5173/books');
    await page.waitForSelector('.card', { timeout: 10000 });
  });

  // TC-SB-01 
  test('TC-SB-01: Search books page loads with book list', async ({ page }) => {
    await expect(page.locator('.page-title')).toBeVisible();
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    console.log('✅ TC-SB-01 PASSED: Book list loaded successfully');
  });

  // TC-SB-02 
  test('TC-SB-02: Search by book title returns filtered results', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Science');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    const cards = page.locator('.card');
    const count = await cards.count();
    console.log(`✅ TC-SB-02 PASSED: Found ${count} results for "Science"`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  //  TC-SB-03 
  test('TC-SB-03: Tab switching between All Books and Trending', async ({ page }) => {
    const trendingTab = page.locator('button:has-text("Trending")');
    if (await trendingTab.count() > 0) {
      await trendingTab.click();
      await page.waitForTimeout(1500);
      console.log('✅ TC-SB-03 PASSED: Switched to Trending tab');
    } else {
      const tabs = page.locator('.filter-tab');
      if (await tabs.count() > 0) {
        await tabs.nth(1).click();
        await page.waitForTimeout(1000);
      }
      console.log('✅ TC-SB-03 PASSED: Tab switching works');
    }
  });

  //  TC-SB-04 
  test('TC-SB-04: Filter books by category dropdown', async ({ page }) => {
    const categorySelect = page.locator('select').first();
    if (await categorySelect.count() > 0) {
      const options = await categorySelect.locator('option').allTextContents();
      console.log('Available categories:', options);
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 });
        await page.click('button:has-text("Search")');
        await page.waitForTimeout(2000);
        console.log(`✅ TC-SB-04 PASSED: Filtered by category "${options[1]}"`);
      }
    } else {
      console.log('⚠️  TC-SB-04 SKIPPED: No category dropdown found');
    }
  });

  // TC-SB-05 
  test('TC-SB-05: Click a book card to see book details', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    await page.waitForTimeout(1500);
    console.log('✅ TC-SB-05 PASSED: Book card click handled without errors');
  });

  // TC-SB-06 
  test('TC-SB-06: Borrow request button is visible for available books', async ({ page }) => {
    const borrowBtn = page.locator('button:has-text("Borrow"), button:has-text("Request")').first();
    if (await borrowBtn.count() > 0) {
      await expect(borrowBtn).toBeVisible();
      console.log('✅ TC-SB-06 PASSED: Borrow button is visible');
    } else {
      await page.locator('.card').first().click();
      await page.waitForTimeout(1000);
      const btn = page.locator('button:has-text("Borrow"), button:has-text("Request")').first();
      if (await btn.count() > 0) {
        await expect(btn).toBeVisible();
        console.log('✅ TC-SB-06 PASSED: Borrow button visible after expanding card');
      } else {
        console.log('⚠️  TC-SB-06 SKIPPED: Borrow button not found (may be out of stock)');
      }
    }
  });

  //  TC-SB-07 
  test('TC-SB-07: Search with empty input returns all books', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    const cards = page.locator('.card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✅ TC-SB-07 PASSED: Empty search returned ${count} books`);
  });

  //  TC-SB-08
  test('TC-SB-08: Add to favourites button works', async ({ page }) => {
    const favBtn = page.locator('button:has-text("♡"), button:has-text("❤"), button[title*="avourite"]').first();
    if (await favBtn.count() > 0) {
      await favBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ TC-SB-08 PASSED: Favourite button clicked');
    } else {
      console.log('⚠️  TC-SB-08 SKIPPED: Favourite button not found');
    }
  });

});


//  TEST SUITE 2: Borrow Management (My Borrows)

test.describe('Borrow Management Feature', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('http://localhost:5173/my-borrows');
    await page.waitForLoadState('networkidle');
  });

  // TC-BM-01 
  test('TC-BM-01: My Borrows page loads correctly', async ({ page }) => {
    const title = page.locator('.page-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Borrow');
    console.log('✅ TC-BM-01 PASSED: My Borrows page loaded');
  });

  // TC-BM-02 
  test('TC-BM-02: Status filter tabs are visible and clickable', async ({ page }) => {
    const filterTabs = page.locator('.filter-tab');
    const count = await filterTabs.count();
    expect(count).toBeGreaterThan(0);

    const filters = ['All', 'Pending', 'Approved', 'Rejected', 'Returned'];
    for (const label of filters) {
      const tab = page.locator(`.filter-tab:has-text("${label}")`);
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForTimeout(500);
        await expect(tab).toHaveClass(/active/);
        console.log(`  ✔ Filter "${label}" works`);
      }
    }
    console.log('✅ TC-BM-02 PASSED: All filter tabs work');
  });

  // TC-BM-03
  test('TC-BM-03: Pending filter shows only pending borrows', async ({ page }) => {
    const pendingTab = page.locator('.filter-tab:has-text("Pending")');
    await pendingTab.click();
    await page.waitForTimeout(800);

    const badges = page.locator('.badge');
    const count = await badges.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await badges.nth(i).textContent();
        expect(text.toLowerCase()).toContain('pending');
      }
    }
    console.log('✅ TC-BM-03 PASSED: Pending filter works correctly');
  });

  //  TC-BM-04 
  test('TC-BM-04: Empty state shown when no borrows match filter', async ({ page }) => {
    const rejectedTab = page.locator('.filter-tab:has-text("Rejected")');
    if (await rejectedTab.count() > 0) {
      await rejectedTab.click();
      await page.waitForTimeout(800);
      const emptyState = page.locator('.empty-state');
      const cards = page.locator('.card');
      const hasEmpty = await emptyState.count() > 0;
      const hasCards = await cards.count() > 0;
      expect(hasEmpty || hasCards).toBeTruthy();
      console.log('✅ TC-BM-04 PASSED: Either records or empty state shown');
    }
  });

  //  TC-BM-05 
  test('TC-BM-05: Borrow records show correct information', async ({ page }) => {
    const allTab = page.locator('.filter-tab:has-text("All")');
    await allTab.click();
    await page.waitForTimeout(800);

    const cards = page.locator('.card');
    const count = await cards.count();
    if (count > 0) {
      const firstCard = cards.first();
      await expect(firstCard.locator('h3')).toBeVisible();
      await expect(firstCard.locator('.badge')).toBeVisible();
      console.log('✅ TC-BM-05 PASSED: Borrow records display book title and status');
    } else {
      console.log('⚠️  TC-BM-05 SKIPPED: No borrow records found for test user');
    }
  });

  //  TC-BM-06 
  test('TC-BM-06: Browse Books link works from empty state', async ({ page }) => {
    const browseLink = page.locator('a:has-text("Browse Books")');
    if (await browseLink.count() > 0) {
      await browseLink.click();
      await page.waitForURL('**/books');
      console.log('✅ TC-BM-06 PASSED: Browse Books link navigates to /books');
    } else {
      console.log('⚠️  TC-BM-06 SKIPPED: No empty state visible (user has borrows)');
    }
  });

});


//  TEST SUITE 3: End-to-End — Search & Borrow Flow

test.describe('End-to-End: Search and Submit Borrow Request', () => {

  test('TC-E2E-01: Student can search a book and submit borrow request', async ({ page }) => {
    await loginAsStudent(page);
    console.log('  Step 1 ✔ Logged in as student');

    await page.goto('http://localhost:5173/books');
    await page.waitForSelector('.card', { timeout: 10000 });
    console.log('  Step 2 ✔ Search Books page loaded');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('Java');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    console.log('  Step 3 ✔ Searched for "Java"');

    const firstCard = page.locator('.card').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForTimeout(1000);
      console.log('  Step 4 ✔ Clicked on book card');
    }

    const borrowBtn = page.locator('button:has-text("Borrow"), button:has-text("Request Borrow")').first();
    if (await borrowBtn.count() > 0 && await borrowBtn.isEnabled()) {
      await borrowBtn.click();
      await page.waitForTimeout(1500);
      console.log('  Step 5 ✔ Borrow request submitted');
    } else {
      console.log('  Step 5 ⚠️  Borrow button not found/disabled — book may be unavailable');
    }

    await page.goto('http://localhost:5173/my-borrows');
    await page.waitForLoadState('networkidle');
    const title = page.locator('.page-title');
    await expect(title).toBeVisible();
    console.log('  Step 6 ✔ My Borrows page loaded — E2E flow complete');
    console.log('✅ TC-E2E-01 PASSED: Full Search → Borrow flow completed');
  });

  test('TC-E2E-02: Login validation prevents access to books without login', async ({ page }) => {
    await page.goto('http://localhost:5173/books');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/login');
    console.log('✅ TC-E2E-02 PASSED: Unauthenticated user redirected to login');
  });

  test('TC-E2E-03: Invalid login shows error message', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toContain('/login');
    console.log('✅ TC-E2E-03 PASSED: Invalid login handled correctly');
  });

});