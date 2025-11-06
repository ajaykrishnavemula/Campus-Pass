/**
 * E2E Tests for Complete Outpass Workflow
 * 
 * Tests the end-to-end outpass creation, approval, and check-in/out process
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Outpass Workflow', () => {
  test('should complete full outpass lifecycle from creation to check-in', async ({ browser }) => {
    // Create three browser contexts for different users
    const studentContext = await browser.newContext();
    const wardenContext = await browser.newContext();
    const securityContext = await browser.newContext();

    const studentPage = await studentContext.newPage();
    const wardenPage = await wardenContext.newPage();
    const securityPage = await securityContext.newPage();

    try {
      // STEP 1: Student creates outpass request
      await studentPage.goto('/');
      await studentPage.getByLabel(/email/i).fill('student@test.com');
      await studentPage.getByLabel(/password/i).fill('Test@123');
      await studentPage.getByRole('button', { name: /login/i }).click();
      await studentPage.waitForURL(/\/student\/dashboard/);

      // Navigate to create outpass
      await studentPage.getByRole('link', { name: /create outpass/i }).click();
      await expect(studentPage).toHaveURL(/\/student\/outpass\/create/);

      // Fill outpass form
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await studentPage.getByLabel(/reason/i).fill('Medical appointment');
      await studentPage.getByLabel(/destination/i).fill('City Hospital');
      await studentPage.getByLabel(/purpose/i).fill('Regular checkup');
      await studentPage.getByLabel(/from date/i).fill(tomorrow.toISOString().split('T')[0]);
      await studentPage.getByLabel(/to date/i).fill(dayAfter.toISOString().split('T')[0]);
      await studentPage.getByLabel(/contact/i).fill('1234567890');

      // Submit outpass
      await studentPage.getByRole('button', { name: /submit/i }).click();

      // Verify success message
      await expect(studentPage.getByText(/outpass created successfully/i)).toBeVisible();
      await expect(studentPage).toHaveURL(/\/student\/outpass/);

      // Verify outpass appears in list with pending status
      await expect(studentPage.getByText(/medical appointment/i)).toBeVisible();
      await expect(studentPage.getByText(/pending/i)).toBeVisible();

      // STEP 2: Warden reviews and approves outpass
      await wardenPage.goto('/');
      await wardenPage.getByLabel(/email/i).fill('warden@test.com');
      await wardenPage.getByLabel(/password/i).fill('Test@123');
      await wardenPage.getByRole('button', { name: /login/i }).click();
      await wardenPage.waitForURL(/\/warden\/dashboard/);

      // Navigate to pending requests
      await wardenPage.getByRole('link', { name: /pending requests/i }).click();
      await expect(wardenPage).toHaveURL(/\/warden\/requests/);

      // Find the outpass request
      const outpassCard = wardenPage.locator('text=Medical appointment').first();
      await expect(outpassCard).toBeVisible();

      // Click view details
      await outpassCard.locator('..').getByRole('button', { name: /view details/i }).click();

      // Approve the outpass
      await wardenPage.getByRole('button', { name: /approve/i }).click();
      await wardenPage.getByLabel(/remarks/i).fill('Approved for medical reasons');
      await wardenPage.getByRole('button', { name: /confirm/i }).click();

      // Verify approval success
      await expect(wardenPage.getByText(/outpass approved/i)).toBeVisible();

      // STEP 3: Student verifies approval and views QR code
      await studentPage.reload();
      await expect(studentPage.getByText(/approved/i)).toBeVisible();

      // Click to view details
      await studentPage.getByText(/medical appointment/i).click();

      // Verify QR code is displayed
      await expect(studentPage.getByAltText(/qr code/i)).toBeVisible();
      await expect(studentPage.getByRole('button', { name: /download qr/i })).toBeVisible();

      // Download QR code
      const downloadPromise = studentPage.waitForEvent('download');
      await studentPage.getByRole('button', { name: /download qr/i }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('outpass-qr');

      // STEP 4: Security guard checks out student
      await securityPage.goto('/');
      await securityPage.getByLabel(/email/i).fill('security@test.com');
      await securityPage.getByLabel(/password/i).fill('Test@123');
      await securityPage.getByRole('button', { name: /login/i }).click();
      await securityPage.waitForURL(/\/security\/dashboard/);

      // Navigate to QR scanner
      await securityPage.getByRole('link', { name: /scan qr/i }).click();
      await expect(securityPage).toHaveURL(/\/security\/scan/);

      // Simulate QR code scan (in real scenario, would use camera)
      // For testing, we'll use manual entry
      await securityPage.getByRole('button', { name: /manual entry/i }).click();
      
      // Get outpass ID from student page
      const outpassId = await studentPage.locator('[data-outpass-id]').getAttribute('data-outpass-id');
      await securityPage.getByLabel(/outpass id/i).fill(outpassId || '');
      await securityPage.getByRole('button', { name: /verify/i }).click();

      // Verify outpass details are displayed
      await expect(securityPage.getByText(/medical appointment/i)).toBeVisible();
      await expect(securityPage.getByText(/city hospital/i)).toBeVisible();

      // Check out student
      await securityPage.getByRole('button', { name: /check out/i }).click();
      await expect(securityPage.getByText(/student checked out successfully/i)).toBeVisible();

      // Verify in active outpasses list
      await securityPage.getByRole('link', { name: /active outpasses/i }).click();
      await expect(securityPage.getByText(/medical appointment/i)).toBeVisible();
      await expect(securityPage.getByText(/checked out/i)).toBeVisible();

      // STEP 5: Student verifies checked out status
      await studentPage.reload();
      await expect(studentPage.getByText(/checked out/i)).toBeVisible();
      await expect(studentPage.getByText(/check out time/i)).toBeVisible();

      // STEP 6: Security guard checks in student (after return)
      await securityPage.getByText(/medical appointment/i).click();
      await securityPage.getByRole('button', { name: /check in/i }).click();
      await expect(securityPage.getByText(/student checked in successfully/i)).toBeVisible();

      // Verify in history
      await securityPage.getByRole('link', { name: /history/i }).click();
      await expect(securityPage.getByText(/medical appointment/i)).toBeVisible();
      await expect(securityPage.getByText(/checked in/i)).toBeVisible();

      // STEP 7: Student verifies final status
      await studentPage.reload();
      await expect(studentPage.getByText(/checked in/i)).toBeVisible();
      await expect(studentPage.getByText(/check in time/i)).toBeVisible();

      // Verify complete timeline
      await studentPage.getByText(/medical appointment/i).click();
      await expect(studentPage.getByText(/created/i)).toBeVisible();
      await expect(studentPage.getByText(/approved/i)).toBeVisible();
      await expect(studentPage.getByText(/checked out/i)).toBeVisible();
      await expect(studentPage.getByText(/checked in/i)).toBeVisible();

      // STEP 8: Warden views statistics
      await wardenPage.getByRole('link', { name: /dashboard/i }).click();
      
      // Verify statistics are updated
      const totalApproved = await wardenPage.locator('[data-stat="approved"]').textContent();
      expect(parseInt(totalApproved || '0')).toBeGreaterThan(0);

      const completedOutpasses = await wardenPage.locator('[data-stat="completed"]').textContent();
      expect(parseInt(completedOutpasses || '0')).toBeGreaterThan(0);

    } finally {
      // Cleanup
      await studentContext.close();
      await wardenContext.close();
      await securityContext.close();
    }
  });

  test('should handle outpass rejection workflow', async ({ browser }) => {
    const studentContext = await browser.newContext();
    const wardenContext = await browser.newContext();

    const studentPage = await studentContext.newPage();
    const wardenPage = await wardenContext.newPage();

    try {
      // Student creates outpass
      await studentPage.goto('/');
      await studentPage.getByLabel(/email/i).fill('student@test.com');
      await studentPage.getByLabel(/password/i).fill('Test@123');
      await studentPage.getByRole('button', { name: /login/i }).click();
      await studentPage.waitForURL(/\/student\/dashboard/);

      await studentPage.getByRole('link', { name: /create outpass/i }).click();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await studentPage.getByLabel(/reason/i).fill('Insufficient reason');
      await studentPage.getByLabel(/destination/i).fill('Unknown');
      await studentPage.getByLabel(/purpose/i).fill('Not specified');
      await studentPage.getByLabel(/from date/i).fill(tomorrow.toISOString().split('T')[0]);
      await studentPage.getByLabel(/to date/i).fill(dayAfter.toISOString().split('T')[0]);
      await studentPage.getByLabel(/contact/i).fill('1234567890');

      await studentPage.getByRole('button', { name: /submit/i }).click();
      await expect(studentPage.getByText(/outpass created successfully/i)).toBeVisible();

      // Warden rejects outpass
      await wardenPage.goto('/');
      await wardenPage.getByLabel(/email/i).fill('warden@test.com');
      await wardenPage.getByLabel(/password/i).fill('Test@123');
      await wardenPage.getByRole('button', { name: /login/i }).click();
      await wardenPage.waitForURL(/\/warden\/dashboard/);

      await wardenPage.getByRole('link', { name: /pending requests/i }).click();
      await wardenPage.getByText(/insufficient reason/i).click();

      // Reject with reason
      await wardenPage.getByRole('button', { name: /reject/i }).click();
      await wardenPage.getByLabel(/rejection reason/i).fill('Reason not sufficient for outpass');
      await wardenPage.getByRole('button', { name: /confirm/i }).click();

      await expect(wardenPage.getByText(/outpass rejected/i)).toBeVisible();

      // Student verifies rejection
      await studentPage.reload();
      await expect(studentPage.getByText(/rejected/i)).toBeVisible();
      await studentPage.getByText(/insufficient reason/i).click();
      await expect(studentPage.getByText(/reason not sufficient/i)).toBeVisible();

    } finally {
      await studentContext.close();
      await wardenContext.close();
    }
  });

  test('should handle outpass cancellation by student', async ({ page }) => {
    // Login as student
    await page.goto('/');
    await page.getByLabel(/email/i).fill('student@test.com');
    await page.getByLabel(/password/i).fill('Test@123');
    await page.getByRole('button', { name: /login/i }).click();
    await page.waitForURL(/\/student\/dashboard/);

    // Create outpass
    await page.getByRole('link', { name: /create outpass/i }).click();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    await page.getByLabel(/reason/i).fill('Plans changed');
    await page.getByLabel(/destination/i).fill('Home');
    await page.getByLabel(/purpose/i).fill('Visit family');
    await page.getByLabel(/from date/i).fill(tomorrow.toISOString().split('T')[0]);
    await page.getByLabel(/to date/i).fill(dayAfter.toISOString().split('T')[0]);
    await page.getByLabel(/contact/i).fill('1234567890');

    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/outpass created successfully/i)).toBeVisible();

    // Cancel the outpass
    await page.getByText(/plans changed/i).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify cancellation
    await expect(page.getByText(/outpass cancelled/i)).toBeVisible();
    await expect(page.getByText(/cancelled/i)).toBeVisible();
  });

  test('should detect and warn about overdue outpasses', async ({ browser }) => {
    const securityContext = await browser.newContext();
    const securityPage = await securityContext.newPage();

    try {
      // Login as security
      await securityPage.goto('/');
      await securityPage.getByLabel(/email/i).fill('security@test.com');
      await securityPage.getByLabel(/password/i).fill('Test@123');
      await securityPage.getByRole('button', { name: /login/i }).click();
      await securityPage.waitForURL(/\/security\/dashboard/);

      // Navigate to overdue outpasses
      await securityPage.getByRole('link', { name: /overdue/i }).click();
      await expect(securityPage).toHaveURL(/\/security\/overdue/);

      // Check if any overdue outpasses are displayed
      const overdueCount = await securityPage.locator('[data-overdue="true"]').count();
      
      if (overdueCount > 0) {
        // Verify overdue warning is displayed
        await expect(securityPage.getByText(/overdue/i)).toBeVisible();
        await expect(securityPage.getByText(/late return/i)).toBeVisible();

        // Click on first overdue outpass
        await securityPage.locator('[data-overdue="true"]').first().click();

        // Verify overdue details
        await expect(securityPage.getByText(/expected return/i)).toBeVisible();
        await expect(securityPage.getByText(/days overdue/i)).toBeVisible();
      }

    } finally {
      await securityContext.close();
    }
  });
});

// 
