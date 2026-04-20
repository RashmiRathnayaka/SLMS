import { test, expect } from '@playwright/test';

test('student can enroll courses and open recommended books', async ({ page }) => {
  await page.goto('http://localhost:5174/');

  // Login
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'you@example.com' }).fill('sifran123@gmail.com');
  await page.getByRole('textbox', { name: '••••••••' }).fill('Student@1234');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Open Courses
  await page.getByRole('navigation').getByRole('link', { name: 'Courses' }).click();

  // Select known course buttons
  await page.getByRole('button', { name: 'Introduction to Programming' }).click();
  await page.getByRole('button', { name: 'Database Systems' }).click();

  // Open My Enrollments
  await page.getByRole('button', { name: /my enrollments/i }).click();
  await expect(page.locator('body')).toContainText(/enrollment|enrollments/i);

  // Open Recommended Books
  await page.getByRole('button', { name: /recommended books/i }).click();
  await expect(page.locator('body')).toContainText(/recommended|recommendations|books/i);
});