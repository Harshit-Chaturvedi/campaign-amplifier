import { test, expect } from '@playwright/test';

test.describe('Scenario B: Creator Flow - Create Manually, Autosave, Mid-flow Resume, Submit', () => {
  test('Login, Create Manually Steps 1-5, assert POST/PATCH sync, reload resume, and submit', async ({ page }) => {
    // Track network calls to verify POST /drafts and PATCH /drafts/:id
    const nonGetCalls: { method: string; url: string; status: number }[] = [];
    page.on('response', (response) => {
      const request = response.request();
      if (request.method() !== 'GET' && request.url().includes('/api/v1/')) {
        nonGetCalls.push({
          method: request.method(),
          url: request.url(),
          status: response.status(),
        });
      }
    });

    // 1. Start at Home
    await page.goto('http://127.0.0.1:8081');
    await page.waitForLoadState('networkidle');

    // 2. Open Profile -> Login
    await page.getByText('Profile').first().click();
    await page.waitForTimeout(500);

    // Click Sign In
    const signInBtn = page.getByRole('button', { name: 'Sign In' });
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();
    await page.waitForTimeout(500);

    // Fill login credentials
    const emailInput = page.getByLabel('Email input');
    const passwordInput = page.getByLabel('Password input');
    await emailInput.fill('creator@demo.org');
    await passwordInput.fill('demo123');

    // Submit login
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForTimeout(1000);

    // Verify authenticated on Profile
    await expect(page.getByText('creator@demo.org')).toBeVisible();

    // 3. Navigate to Create Tab
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(800);

    await expect(page.getByText('Create Campaign').first()).toBeVisible();

    // Click "Create Manually"
    const createManuallyBtn = page.getByText('Create Manually').first();
    await createManuallyBtn.click();
    await page.waitForTimeout(1000);

    // Verify on Step 1: Basics
    await expect(page.getByText('Step 1 of 5: Basics')).toBeVisible();

    // Assert POST /drafts was called and succeeded
    const postDraftCall = nonGetCalls.find(
      (c) => c.method === 'POST' && c.url.includes('/drafts')
    );
    expect(postDraftCall).toBeDefined();
    expect(postDraftCall?.status).toBe(200);

    // Fill Step 1 Fields
    const titleInput = page.getByLabel('Campaign Title');
    await titleInput.fill('Community Solar for Local Schools');
    await page.waitForTimeout(300);

    const summaryInput = page.getByLabel('Short Summary');
    await summaryInput.fill('Installing community solar panels on rooftops of 15 public schools.');
    await page.waitForTimeout(300);

    // Wait for debounced autosave to trigger PATCH /drafts/:id
    await page.waitForTimeout(1200);

    // Verify autosave status pill shows synced
    await expect(page.getByText('All changes synced')).toBeVisible();

    // Assert PATCH call succeeded with 200
    const patchDraftCall = nonGetCalls.find(
      (c) => c.method === 'PATCH' && c.url.includes('/drafts/')
    );
    expect(patchDraftCall).toBeDefined();
    expect(patchDraftCall?.status).toBe(200);

    // Click Continue to Step 2
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);

    // Step 2: Story & Sources
    await expect(page.getByText('Step 2 of 5: Story')).toBeVisible();

    // Add a source
    const sourceTitle = page.getByPlaceholder('e.g. County Public Health Water Quality Assessment 2025');
    const sourceUrl = page.getByPlaceholder('https://example.gov/report-2025.pdf');
    await sourceTitle.fill('State Energy Commission Solar Feasibility Study 2026');
    await sourceUrl.fill('https://energy.gov/clean-energy/solar-study-2026');
    await page.getByRole('button', { name: 'Add Source' }).click();
    await page.waitForTimeout(400);

    await expect(page.getByText('State Energy Commission Solar Feasibility Study 2026')).toBeVisible();

    // Click Continue to Step 3
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(500);

    // Step 3: Visuals & Ad Creative
    await expect(page.getByText('Step 3 of 5: Visuals')).toBeVisible();

    // Fill Ad Headline & Primary Text
    const headlineInput = page.getByPlaceholder('Defaults to the first 60 characters of your title...');
    await headlineInput.fill('Solar on School Rooftops Saves Tax Dollars');
    await page.waitForTimeout(1200);

    // MID-FLOW RESUME TEST: Reload browser while on Step 3
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Navigate to Create tab to verify draft resumed
    await page.getByText('Create', { exact: true }).click();
    await page.waitForTimeout(800);

    // Click "Resume Draft" or verify draft is preserved
    const resumeBtn = page.getByText(/Resume Draft|Resume Editing/i).first();
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
      await page.waitForTimeout(800);
    }

    // Verify title is still preserved
    await expect(page.getByText(/Community Solar/i).first()).toBeVisible();

    // Navigate forward to Step 4
    while (!(await page.getByText('Step 4 of 5: Reach').isVisible())) {
      const continueBtn = page.getByRole('button', { name: /Continue/i }).first();
      await continueBtn.click();
      await page.waitForTimeout(600);
    }

    // Step 4: Reach & Audience
    await expect(page.getByText('Step 4 of 5: Reach')).toBeVisible();

    // Click Continue to Step 5
    await page.getByRole('button', { name: 'Continue to Submit' }).click();
    await page.waitForTimeout(800);

    // Step 5: Funding Goal & Submit
    await expect(page.getByText('Step 5 of 5: Submit')).toBeVisible();
    await expect(page.getByText('Funding Goal & Submit')).toBeVisible();

    // Type Funding Goal ($5,000)
    const goalInput = page.getByLabel('Campaign funding goal in dollars');
    await goalInput.fill('5000');
    await page.waitForTimeout(500);

    // Verify live estimated reach indicator appears
    await expect(page.getByText(/ESTIMATED REACH \(ESTIMATE, NOT A GUARANTEE\)/i)).toBeVisible();

    // Check submission checkboxes
    const cb1 = page.getByText(/I confirm that all factual claims in this campaign/i);
    await cb1.scrollIntoViewIfNeeded();
    await cb1.click();
    await page.waitForTimeout(200);

    const cb2 = page.getByText(/I agree to the campaign guidelines, fees, and advertising policies/i);
    await cb2.click();
    await page.waitForTimeout(200);

    // Take screenshot of Step 5 before submit
    await page.screenshot({ path: '../docs/qa/B_creator_step5.png' });

    // Click Submit for Review
    const submitBtn = page.getByRole('button', { name: 'Submit for Review' });
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();
    await page.waitForTimeout(1500);

    // Assert Submit Confirmation Modal is visible
    await expect(page.getByText('Submitted for Review')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View in My Campaigns' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Return to Home' })).toBeVisible();

    // Take screenshot of submission confirmation
    await page.screenshot({ path: '../docs/qa/B_creator_submitted.png' });

    // Assert transition/submit endpoint was called with 200
    const submitCall = nonGetCalls.find((c) => c.url.includes('/submit'));
    expect(submitCall).toBeDefined();
    expect(submitCall?.status).toBe(200);
  });
});
