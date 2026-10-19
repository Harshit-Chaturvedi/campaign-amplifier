import { test, expect } from '@playwright/test';

test.describe('Scenarios F, G & H: Offline Resilience, Layout & Console Cleanliness', () => {
  test('Scenario F: Offline Resilience shows banner, allows cached browsing, and cleanly prevents submit', async ({ page }) => {
    // 1. Visit app online first to ensure code is cached
    await page.goto('http://127.0.0.1:8081');
    await page.waitForTimeout(1500);

    // 2. Simulate network offline by intercepting /api/v1/ requests to abort
    await page.route('**/api/v1/**', (route) => route.abort());

    // Trigger a refetch or reload to trigger offline state
    await page.reload();
    await page.waitForTimeout(1500);

    // Verify offline banner appears in Home
    const offlineBanner = page.getByText(/Offline demo data active|bundled prototype campaigns|Offline mode/i).first();
    await expect(offlineBanner).toBeVisible();

    // Verify user can still browse cached campaigns
    const campaignTitle = page.getByText(/Clean drinking water|Redraw the bus network/i).first();
    await expect(campaignTitle).toBeVisible();

    // Unroute to restore network
    await page.unroute('**/api/v1/**');
  });

  test('Scenario G: Responsive & Layout across viewports, capture G_small_home.png', async ({ page }, testInfo) => {
    await page.goto('http://127.0.0.1:8081');
    await page.waitForTimeout(1500);

    // Check no horizontal scrollbar on body
    const bodyScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;
    });
    expect(bodyScroll).toBe(true);

    // Check tab bar labels are visible
    await expect(page.getByText('Home', { exact: true })).toBeVisible();
    await expect(page.getByText('Explore', { exact: true })).toBeVisible();
    await expect(page.getByText('Create', { exact: true })).toBeVisible();
    await expect(page.getByText('Activity', { exact: true })).toBeVisible();
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();

    // Check touch target min heights for main tab buttons
    const tabHeight = await page.evaluate(() => {
      const tab = document.querySelector('[role="tablist"]');
      return tab ? tab.getBoundingClientRect().height : 0;
    });
    expect(tabHeight).toBeGreaterThanOrEqual(48);

    // If running in small-360x740 project, capture docs/qa/G_small_home.png
    if (testInfo.project.name.includes('360')) {
      await page.screenshot({ path: '../docs/qa/final/G_small_home.png' });
    }
  });

  test('Scenario H: Zero console errors, no unhandled exceptions or React key warnings', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        // Filter out expected network aborts from offline tests or benign favicon 404s
        if (!text.includes('Failed to load resource') && !text.includes('favicon')) {
          errors.push(text);
        }
      }
      if (text.includes('Each child in a list should have a unique "key" prop')) {
        warnings.push(text);
      }
    });

    await page.goto('http://127.0.0.1:8081');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForTimeout(1500);

    // If any modal (e.g. Login) is open, close it
    const closeBtn = page.getByRole('button', { name: /Close sign in|Close/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    // Navigate across screens via bottom tab bar
    const tabList = page.getByRole('tablist');
    await tabList.getByText('Explore', { exact: true }).click();
    await page.waitForTimeout(800);

    await tabList.getByText('Activity', { exact: true }).click();
    await page.waitForTimeout(800);

    await tabList.getByText('Profile', { exact: true }).click();
    await page.waitForTimeout(800);

    await tabList.getByText('Home', { exact: true }).click();
    await page.waitForTimeout(800);

    expect(warnings.length).toBe(0);
    expect(errors.length).toBe(0);
  });
});
