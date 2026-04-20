import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const setAuthUser = async (page, user) => {
	await page.addInitScript((authUser) => {
		localStorage.setItem('token', 'e2e-test-token');
		localStorage.setItem(
			'user',
			JSON.stringify({
				...authUser,
				token: 'e2e-test-token',
			})
		);
	}, user);
};

test.describe('Book Management - CSV Upload', () => {
	test('admin can upload a CSV file and see success feedback', async ({ page }) => {
		await setAuthUser(page, {
			_id: 'admin-1',
			name: 'E2E Admin',
			email: 'admin@smartlib.lk',
			role: 'admin',
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

test.describe('Book Management - Core Flow', () => {
	test('admin can search, add, and delete books', async ({ page }) => {
		await setAuthUser(page, {
			_id: 'admin-1',
			name: 'E2E Admin',
			email: 'admin@smartlib.lk',
			role: 'admin',
		});

		let books = [
			{
				_id: 'book-1',
				title: 'Alpha Book',
				author: 'Author One',
				isbn: 'IT1010',
				category: 'Computing',
				totalCopies: 3,
				availableCopies: 2,
			},
			{
				_id: 'book-2',
				title: 'Beta Systems',
				author: 'Author Two',
				isbn: 'BM1020',
				category: 'Business',
				totalCopies: 4,
				availableCopies: 0,
			},
		];

		await page.route('**/api/books**', async (route) => {
			const request = route.request();
			const url = new URL(request.url());

			if (request.method() === 'GET') {
				const search = (url.searchParams.get('search') || '').toLowerCase();
				const category = url.searchParams.get('category') || '';
				const filtered = books.filter((book) => {
					const matchesSearch =
						!search ||
						book.title.toLowerCase().includes(search) ||
						book.author.toLowerCase().includes(search) ||
						(book.isbn || '').toLowerCase().includes(search);
					const matchesCategory = !category || book.category === category;
					return matchesSearch && matchesCategory;
				});

				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(filtered),
				});
				return;
			}

			if (request.method() === 'POST') {
				const newBook = {
					_id: 'book-3',
					title: 'New Test Book',
					author: 'QA Author',
					isbn: 'IT3030',
					category: 'Computing',
					totalCopies: 5,
					availableCopies: 5,
				};
				books = [...books, newBook];
				await route.fulfill({
					status: 201,
					contentType: 'application/json',
					body: JSON.stringify(newBook),
				});
				return;
			}

			await route.fallback();
		});

		await page.route('**/api/books/*', async (route) => {
			const request = route.request();
			if (request.method() === 'DELETE') {
				const id = request.url().split('/').pop();
				books = books.filter((book) => book._id !== id);
				await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deleted' }) });
				return;
			}

			await route.fallback();
		});

		await page.goto(`${FRONTEND_URL}/admin/books`);

		await expect(page.getByRole('heading', { name: /Book Management/i })).toBeVisible();
		await expect(page.getByText('Alpha Book')).toBeVisible();

		await page.getByPlaceholder(/Search by title, author or course code/i).fill('Alpha');
		await page.getByRole('button', { name: /^Search$/ }).click();
		await expect(page.getByText('Alpha Book')).toBeVisible();
		await expect(page.getByText('Beta Systems')).not.toBeVisible();

		await page.getByRole('button', { name: /Add Book/i }).click();
		const modal = page.locator('.modal');
		await modal.locator('label.form-label:has-text("Title") + input').fill('New Test Book');
		await modal.locator('label.form-label:has-text("Author") + input').fill('QA Author');
		await modal.locator('label.form-label:has-text("Category") + select').selectOption('Computing');
		await modal.locator('label.form-label:has-text("Total Copies") + input').fill('5');
		await page.getByRole('button', { name: /Save Book/i }).click();

		await expect(page.getByText('Book added!')).toBeVisible();
		await page.getByPlaceholder(/Search by title, author or course code/i).fill('New Test Book');
		await page.getByRole('button', { name: /^Search$/ }).click();
		await expect(page.getByText('New Test Book')).toBeVisible();

		page.once('dialog', (dialog) => dialog.accept());
		await page.getByRole('button', { name: 'Delete' }).first().click();
		await expect(page.getByText('Book removed')).toBeVisible();
	});
});

test.describe('Search Books - Trending Tab', () => {
	test('student can view trending books with metrics', async ({ page }) => {
		await setAuthUser(page, {
			_id: 'student-1',
			name: 'E2E Student',
			email: 'student@smartlib.lk',
			role: 'student',
		});

		const allBooks = [
			{
				_id: 'book-1',
				title: 'Intro to Programming',
				author: 'Alice',
				category: 'Computing',
				availableCopies: 3,
				totalCopies: 5,
				isbn: 'IT1001',
			},
		];

		const trendingBooks = [
			{
				_id: 'book-99',
				title: 'Trending Data Structures',
				author: 'Bob',
				category: 'Computing',
				availableCopies: 1,
				totalCopies: 4,
				isbn: 'IT2200',
				weeklyBorrowCount: 7,
				favoriteCount: 12,
			},
		];

		await page.route('**/api/books/favourites', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([{ _id: 'book-99' }]),
			});
		});

		await page.route('**/api/books/trending**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ books: trendingBooks }),
			});
		});

		await page.route('**/api/books**', async (route) => {
			const request = route.request();
			const url = new URL(request.url());
			if (request.method() === 'GET' && url.pathname.endsWith('/api/books')) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(allBooks),
				});
				return;
			}

			await route.fallback();
		});

		await page.goto(`${FRONTEND_URL}/books`);

		await expect(page.getByRole('heading', { name: /Search Books/i })).toBeVisible();
		await page.getByRole('button', { name: /Trending Books/i }).click();

		await expect(page.getByText('Trending Data Structures')).toBeVisible();
		await expect(page.getByText(/Weekly borrows:/i)).toContainText('7');
		await expect(page.getByText(/Favourites:/i)).toContainText('12');
	});
});

test.describe('Admin Analytics - Purchase Recommendations', () => {
	test('admin can view recommendation rows with computed priority', async ({ page }) => {
		await setAuthUser(page, {
			_id: 'admin-1',
			name: 'E2E Admin',
			email: 'admin@smartlib.lk',
			role: 'admin',
		});

		await page.route('**/api/books/analytics', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					totalBooks: 20,
					totalCopies: 80,
					availableCopies: 30,
					borrowedCopies: 50,
					lowStock: 4,
					availability: [
						{ name: 'Available', value: 30 },
						{ name: 'Borrowed', value: 50 },
					],
					categoryData: [
						{ name: 'Computing', count: 10 },
						{ name: 'Business', count: 5 },
					],
					priorityThresholds: {
						urgent: 6,
						high: 3,
					},
					recommendations: [
						{
							_id: 'rec-1',
							title: 'Clean Architecture',
							author: 'Robert Martin',
							category: 'Computing',
							availableCopies: 0,
							totalCopies: 4,
							waitingCount: 5,
							borrowCount: 8,
							lowStockBonus: 2,
							recommendationScore: 8,
						},
						{
							_id: 'rec-2',
							title: 'Business Analysis Basics',
							author: 'Laura N.',
							category: 'Business',
							availableCopies: 1,
							totalCopies: 3,
							waitingCount: 1,
							borrowCount: 2,
							lowStockBonus: 1,
							recommendationScore: 4,
						},
					],
				}),
			});
		});

		await page.goto(`${FRONTEND_URL}/admin/analytics`);

		await expect(page.getByRole('heading', { name: /Inventory Analytics/i })).toBeVisible();
		await expect(page.locator('.card-title', { hasText: /Purchase Recommendations/i })).toBeVisible();

		await expect(page.getByText('Clean Architecture')).toBeVisible();
		await expect(page.getByText('Business Analysis Basics')).toBeVisible();
		await expect(page.getByText('🔴 Urgent')).toBeVisible();
		await expect(page.getByText('🟡 High')).toBeVisible();
	});
});
