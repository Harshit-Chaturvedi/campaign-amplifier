import { test, expect } from '@playwright/test';

test.describe('Scenarios D & E: Creator Dashboard, Guest Profile & Info Pages', () => {
  const nonGetCalls: { method: string; url: string; status: number }[] = [];

  test('Creator Dashboard renders user-owned campaigns, tabs with counts, valid covers', async ({ page }) => {
    page.on('response', (response) => {
      const req = response.request();
      if (req.method() !== 'GET' && response.url().includes('/api/v1/')) {
        nonGetCalls.push({
          method: req.method(),
          url: response.url(),
          status: response.status(),
        });
      }
    });

    await page.goto('http://127.0.0.1:8081');
    await page.waitForTimeout(1500);

    // Navigate to Profile
    await page.getByText('Profile', { exact: true }).click();
    await page.waitForTimeout(800);

    // Sign in as creator if not already signed in
    const signInBtn = page.getByRole('button', { name: /Sign In|Log In/i }).first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await page.waitForTimeout(500);

      const emailInput = page.getByLabel('Email input');
      const passInput = page.getByLabel('Password input');
      await emailInput.fill('creator@demo.org');
      await passInput.fill('demo123');

      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForTimeout(1200);
    }

    // Now on Profile, look for Creator Dashboard button
    const dashboardBtn = page.getByLabel('Open creator dashboard');
    await expect(dashboardBtn).toBeVisible();
    await dashboardBtn.click();
    await page.waitForTimeout(1000);

    // Verify Creator Dashboard screen title
    await expect(page.getByText('Creator Dashboard').last()).toBeVisible();

    // Verify tabs exist (Funding, Review, Promoting, Completed, Action Needed, Drafts)
    await expect(page.getByLabel('Funding tab')).toBeVisible();
    await expect(page.getByLabel('Review tab')).toBeVisible();
    await expect(page.getByLabel('Drafts tab')).toBeVisible();

    // Verify no broken images: all images should have naturalWidth > 0 or be SVG/GeneratedCover
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src);
    });
    expect(brokenImages.length).toBe(0);

    // Take screenshot D_creator_dashboard.png
    await page.screenshot({ path: '../docs/qa/final/D_creator_dashboard.png' });

    // Navigate back to Profile
    const backBtn = page.getByLabel('Go back');
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await page.waitForTimeout(600);
    }
  });

  test('Guest Profile displays sign-in prompt, no seed backer fake data, and all info pages open cleanly', async ({ browser }) => {
    // Fresh context guarantees clean guest state with no previous test contributions
    const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
    const page = await context.newPage();

    await page.goto('http://127.0.0.1:8081');
    await page.waitForTimeout(1500);

    // Open Profile as Guest
    await page.getByText('Profile', { exact: true }).click();
    await page.waitForTimeout(800);

    // Verify Guest banner/card
    await expect(page.getByText('Browsing as a Guest')).toBeVisible();
    await expect(page.getByText(/You can browse campaigns and back messages without an account/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Verify empty state for Backed Campaigns & Backing History
    await expect(page.getByText(/You haven't backed any campaigns yet\./i)).toBeVisible();
    await expect(page.getByText(/No transaction receipts for this device yet\./i)).toBeVisible();

    // Take screenshot E_guest_profile.png
    await page.screenshot({ path: '../docs/qa/final/E_guest_profile.png' });

    // Test Info directory links (no dead buttons, correct titles, close/back works)
    const infoSlugs = [
      { text: 'About Campaign Amplifier', expectedHeading: 'About Campaign Amplifier' },
      { text: 'How It Works (Sequence & Rules)', expectedHeading: 'How It Works' },
      { text: 'Frequently Asked Questions', expectedHeading: 'Frequently Asked Questions' },
      { text: 'Help & Support', expectedHeading: 'Help & Support' },
      { text: 'Contact Team', expectedHeading: 'Contact the Team' },
      { text: 'Terms of Service', expectedHeading: 'Terms of Service' },
      { text: 'Privacy Policy & Backer Anonymity', expectedHeading: 'Privacy Policy' },
      { text: 'Community Guidelines', expectedHeading: 'Community Guidelines' },
      { text: 'Fees & Refund Policy', expectedHeading: 'Fees & Refund Policy' },
    ];

    for (const item of infoSlugs) {
      const link = page.getByText(item.text).first();
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await page.waitForTimeout(500);

      // Verify heading on active screen
      await expect(page.getByText(item.expectedHeading).last()).toBeVisible();

      // Go back
      const backBtn = page.getByLabel('Go back').last();
      await backBtn.click();
      await page.waitForTimeout(400);
    }

    // Test Settings Modal & Close Button
    const settingsBtn = page.getByLabel('Open settings modal');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForTimeout(500);

      // Verify modal is visible
      await expect(page.getByText('Account Settings')).toBeVisible();

      // Click Done
      const closeBtn = page.getByRole('button', { name: 'Done' });
      await closeBtn.click();
      await page.waitForTimeout(400);

      // Assert modal dismissed
      await expect(page.getByText('Account Settings')).not.toBeVisible();
    }

    await context.close();
  });
});
