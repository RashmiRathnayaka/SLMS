import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Book Management - CSV Upload', () => {
	test('admin can upload a CSV file and see success feedback', async ({ page }) => {
		await page.addInitScript(() => {
			localStorage.setItem('token', 'e2e-test-token');
			localStorage.setItem(
				'user',
				JSON.stringify({
					_id: 'admin-1',
					name: 'E2E Admin',
					email: 'admin@smartlib.lk',
					role: 'admin',
					token: 'e2e-test-token',
				})
			);
		});

		let booksRequestCount = 0;

		await page.route('**/api/books?**', async (route) => {
			booksRequestCount += 1;
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([]),
			});
		});

		await page.route('**/api/books', async (route) => {
			if (route.request().method() === 'GET') {
				booksRequestCount += 1;
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([]),
				});
				return;
			}
			await route.fallback();
		});

		await page.route('**/api/books/import/csv', async (route) => {
			expect(route.request().method()).toBe('POST');
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ imported: 2, errors: [] }),
			});
		});

		await page.goto(`${FRONTEND_URL}/admin/books`);

		await expect(page.getByRole('heading', { name: /Book Management/i })).toBeVisible();

		const csvInput = page.locator('input[type="file"][accept=".csv"]');
		await csvInput.setInputFiles({
			name: 'books.csv',
			mimeType: 'text/csv',
			buffer: Buffer.from(
				'title,author,isbn,category,description,totalCopies,publisher,publishYear,language\n' +
					'CSV Test Book One,Author One,IT1010,Computing,Intro,5,SmartPub,2024,English\n' +
					'CSV Test Book Two,Author Two,IT1020,Business,Advanced,3,SmartPub,2022,English\n'
			),
		});

		await expect(page.getByRole('button', { name: /Upload CSV/i })).toBeVisible();
		await page.getByRole('button', { name: /Upload CSV/i }).click();

		await expect(page.getByText('Imported 2 books. Errors: 0.')).toBeVisible();
		await expect.poll(() => booksRequestCount).toBeGreaterThan(1);
	});
});
