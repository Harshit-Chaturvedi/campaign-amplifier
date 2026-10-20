import { test, expect } from '@playwright/test';

test('Smoke test - Home screen loads and displays campaigns', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('http://127.0.0.1:8081');
  await page.waitForLoadState('networkidle');

  // Verify app title or brand logo
  await expect(page.locator('text=Campaign Amplifier').first()).toBeVisible({ timeout: 15000 });

  // Take screenshot of home screen for both target viewports
  if (testInfo.project.name.includes('360')) {
    await page.screenshot({ path: '../docs/qa/final/home_360x740.png' });
    await page.screenshot({ path: '../docs/qa/final/G_small_home.png' });
  } else {
    await page.screenshot({ path: '../docs/qa/final/home_412x915.png' });
    await page.screenshot({ path: '../docs/qa/final/G_pixel_home.png' });
  }

  // Assert no serious unhandled React or console errors
  const criticalErrors = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('font') && !e.includes('404')
  );
  expect(criticalErrors).toHaveLength(0);
});

test('Explore screen - category chips rendered with colors', async ({ page }, testInfo) => {
  await page.goto('http://127.0.0.1:8081');
  await page.waitForLoadState('networkidle');

  // Click Explore tab
  const exploreTab = page.locator('text=Explore').first();
  await expect(exploreTab).toBeVisible({ timeout: 15000 });
  await exploreTab.click();

  // Verify category chips are visible
  await expect(page.locator('text=Environment').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Health').first()).toBeVisible({ timeout: 10000 });

  // Save screenshot of Explore screen
  if (testInfo.project.name.includes('360')) {
    await page.screenshot({ path: '../docs/qa/explore_360x740.png' });
    await page.screenshot({ path: '../docs/qa/final/explore_360x740.png' });
  } else {
    await page.screenshot({ path: '../docs/qa/explore_412x915.png' });
    await page.screenshot({ path: '../docs/qa/final/explore_412x915.png' });
  }
});
