import { test, expect } from '@playwright/test';

test.describe('Scenario A: Guest Backing Flow & Outcomes', () => {
  test('Search, sort, filter, back as guest with preset, fee review, checkout states, and receipt', async ({ page }) => {
    // 1. Start at Home
    await page.goto('http://127.0.0.1:8081');
    await page.waitForLoadState('networkidle');

    // Verify Home loaded
    await expect(page.getByText('Campaign Amplifier').first()).toBeVisible();
    await expect(page.getByText('Explore Active Campaigns').first()).toBeVisible();

    // 2. Navigate to Explore via bottom tab or button
    await page.getByText('Explore').first().click();
    await page.waitForTimeout(500);

    // Verify on Explore Screen
    await expect(page.getByText('Explore').first()).toBeVisible();

    // Test Search input
    const searchInput = page.getByPlaceholder('Search by title, topic, creator...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('water');
    await page.waitForTimeout(500);

    // Assert filtered campaign appears
    const waterCard = page.getByText('Clean drinking water in every public school').first();
    await expect(waterCard).toBeVisible();

    // 3. Open campaign detail for Clean drinking water
    await waterCard.click({ force: true });
    await page.waitForTimeout(800);

    // Verify on Campaign Detail
    await expect(page.getByText('Clean drinking water in every public school').first()).toBeVisible();
    // Verify "Estimate" reach label is present
    await expect(page.getByText(/estimate/i).first()).toBeVisible();

    // 4. Click Back This Campaign / Message button
    const backButton = page.getByRole('button', { name: /back this/i }).first();
    await backButton.click();
    await page.waitForTimeout(800);

    // Step 1: Select Contribution Amount
    await expect(page.getByText('Select Contribution Amount')).toBeVisible();

    // Click preset $25
    const preset25 = page.getByRole('button', { name: 'Preset $25', exact: true });
    await expect(preset25).toBeVisible();
    await preset25.click();
    await page.waitForTimeout(300);

    // Click "Review $25"
    const reviewBtn = page.getByRole('button', { name: /review \$25/i });
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();
    await page.waitForTimeout(500);

    // Step 2: Review & Fees
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    // Check fee calculation breakdown: 2.9% + $0.30
    await expect(page.getByText('2.9% + $0.30 standard gateway fee')).toBeVisible();
    await expect(page.getByText('Total Charged to Card')).toBeVisible();

    // Proceed to Checkout
    const proceedBtn = page.getByRole('button', { name: /proceed to checkout/i });
    await proceedBtn.click();
    await page.waitForTimeout(500);

    // Step 3: Simulated Checkout
    await expect(page.getByText('Step 3 of 3')).toBeVisible();
    await expect(page.getByText('Test mode - no real payment')).toBeVisible();

    // Enter guest email
    const emailInput = page.getByLabel('Guest email address for digital receipt');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('guest@civic.org');

    // Take screenshot of checkout
    await page.screenshot({ path: '../docs/qa/A_guest_checkout.png' });

    // Test Pending Simulation
    const pendingBtn = page.getByRole('button', { name: 'Simulate pending payment' });
    await pendingBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/STATE: PENDING/i)).toBeVisible();

    // Test Failed Simulation
    const failedBtn = page.getByRole('button', { name: 'Simulate payment failure' });
    await failedBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/STATE: FAILED/i)).toBeVisible();

    // Test Cancelled Simulation
    const cancelBtn = page.getByRole('button', { name: 'Simulate cancelled payment' });
    await cancelBtn.click();
    await page.waitForTimeout(600);
    await expect(page.getByText(/STATE: CANCELLED/i)).toBeVisible();

    // Test Success Simulation
    const successBtn = page.getByRole('button', { name: /simulate successful payment/i });
    await successBtn.click();
    await page.waitForTimeout(1500);

    // Thank You / Receipt Screen
    await expect(page.getByText('Contribution Confirmed')).toBeVisible();
    await expect(page.getByText('$25').first()).toBeVisible();
    await expect(page.getByText(/rec-2026/i).first()).toBeVisible();

    // Capture screenshot of receipt
    await page.screenshot({ path: '../docs/qa/A_guest_receipt.png' });
  });
});
