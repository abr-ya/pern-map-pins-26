import { expect, test, type Route } from '@playwright/test';

type PublicPoint = {
  id: string;
  title: string;
  description: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  authorId: string;
  visibility: 'public' | 'group_only';
  groupId: string | null;
  folderId: string | null;
  averageRating: number | null;
  myRating: number | null;
};

const AUTHOR = '00000000-0000-4000-8000-000000000099';

function point(over: Partial<PublicPoint>): PublicPoint {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    title: 'Spot',
    description: null,
    photoUrl: null,
    latitude: 0,
    longitude: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    authorId: AUTHOR,
    visibility: 'public',
    groupId: null,
    folderId: null,
    averageRating: null,
    myRating: null,
    ...over,
  };
}

async function mockLatest(route: Route, items: PublicPoint[]) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ items }),
  });
}

test.describe('US1: Guest map and latest five public points', () => {
  test('shows the empty state when API returns no items', async ({ page }) => {
    await page.route('**/api/public/latest', (route) => mockLatest(route, []));
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Latest public/i })).toBeVisible();
    await expect(page.getByText(/No public points yet/i)).toBeVisible();
    await expect(page.locator('[data-testid="map-pin"]')).toHaveCount(0);
  });

  test('renders up to five list items and matching map pins, newest first', async ({ page }) => {
    const points: PublicPoint[] = [
      point({ id: '00000000-0000-4000-8000-000000000005', title: 'Newest', latitude: 50, longitude: 30, createdAt: '2024-05-05T00:00:00.000Z' }),
      point({ id: '00000000-0000-4000-8000-000000000004', title: 'Fourth', latitude: 51, longitude: 31, createdAt: '2024-04-04T00:00:00.000Z' }),
      point({ id: '00000000-0000-4000-8000-000000000003', title: 'Third',  latitude: 52, longitude: 32, createdAt: '2024-03-03T00:00:00.000Z' }),
      point({ id: '00000000-0000-4000-8000-000000000002', title: 'Second', latitude: 53, longitude: 33, createdAt: '2024-02-02T00:00:00.000Z' }),
      point({ id: '00000000-0000-4000-8000-000000000001', title: 'Oldest', latitude: 54, longitude: 34, createdAt: '2024-01-01T00:00:00.000Z' }),
    ];
    await page.route('**/api/public/latest', (route) => mockLatest(route, points));
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Latest public/i })).toBeVisible();

    const titles = page.locator('aside li .font-medium');
    await expect(titles).toHaveCount(5);
    const renderedTitles = await titles.allTextContents();
    expect(renderedTitles).toEqual(points.map((p) => p.title));

    await expect(page.locator('[data-testid="map-pin"]')).toHaveCount(5);
    for (const p of points) {
      await expect(page.locator(`[data-testid="map-pin"][data-point-id="${p.id}"]`)).toHaveCount(1);
    }
  });

  test('caps the rendered list at five even if API returns more', async ({ page }) => {
    const items = Array.from({ length: 7 }, (_, i) =>
      point({
        id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
        title: `P${i}`,
        latitude: 10 + i,
        longitude: 20 + i,
        createdAt: new Date(Date.UTC(2024, 0, i + 1)).toISOString(),
      }),
    );
    await page.route('**/api/public/latest', (route) => mockLatest(route, items.slice(0, 5)));
    await page.goto('/');
    await expect(page.locator('aside li')).toHaveCount(5);
    await expect(page.locator('[data-testid="map-pin"]')).toHaveCount(5);
  });
});
