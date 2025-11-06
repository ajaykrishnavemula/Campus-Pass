/**
 * E2E Tests for Authentication Flow
 * 
 * Tests the complete authentication user journey
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Login', () => {
    test('should display login page', async ({ page }) => {
      // ASSERT
      await expect(page).toHaveTitle(/CampusPass/i);
      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /login/i })).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      // ACT
      await page.getByRole('button', { name: /login/i }).click();

      // ASSERT
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // ACT
      await page.getByLabel(/email/i).fill('wrong@test.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /login/i }).click();

      // ASSERT
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      // ACT
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();

      // ASSERT
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });

    test('should redirect to appropriate dashboard based on role', async ({ page }) => {
      // Student login
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await expect(page).toHaveURL(/\/student\/dashboard/);

      // Logout
      await page.getByRole('button', { name: /logout/i }).click();

      // Warden login
      await page.getByLabel(/email/i).fill('warden@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await expect(page).toHaveURL(/\/warden\/dashboard/);
    });

    test('should remember user with "Remember Me" checkbox', async ({ page, context }) => {
      // ACT
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByLabel(/remember me/i).check();
      await page.getByRole('button', { name: /login/i }).click();

      // Wait for navigation
      await page.waitForURL(/\/dashboard/);

      // Close and reopen browser
      await page.close();
      const newPage = await context.newPage();
      await newPage.goto('/');

      // ASSERT - Should be logged in
      await expect(newPage).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Registration', () => {
    test('should navigate to registration page', async ({ page }) => {
      // ACT
      await page.getByRole('link', { name: /sign up/i }).click();

      // ASSERT
      await expect(page).toHaveURL(/\/register/);
      await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
    });

    test('should register student successfully', async ({ page }) => {
      // Navigate to registration
      await page.goto('/register');

      // Fill student registration form
      await page.getByLabel(/name/i).fill('John Doe');
      await page.getByLabel(/email/i).fill('john.doe@test.com');
      await page.getByLabel(/password/i).first().fill('Test@123');
      await page.getByLabel(/confirm password/i).fill('Test@123');
      await page.getByLabel(/role/i).selectOption('student');
      await page.getByLabel(/roll number/i).fill('ST001');
      await page.getByLabel(/hostel/i).selectOption('Hostel A');
      await page.getByLabel(/room number/i).fill('101');
      await page.getByLabel(/phone/i).fill('1234567890');

      // Submit
      await page.getByRole('button', { name: /register/i }).click();

      // ASSERT
      await expect(page).toHaveURL(/\/student\/dashboard/);
      await expect(page.getByText(/registration successful/i)).toBeVisible();
    });

    test('should register warden successfully', async ({ page }) => {
      // Navigate to registration
      await page.goto('/register');

      // Fill warden registration form
      await page.getByLabel(/name/i).fill('Dr. Smith');
      await page.getByLabel(/email/i).fill('smith@test.com');
      await page.getByLabel(/password/i).first().fill('Test@123');
      await page.getByLabel(/confirm password/i).fill('Test@123');
      await page.getByLabel(/role/i).selectOption('warden');
      await page.getByLabel(/employee id/i).fill('W001');
      await page.getByLabel(/hostel/i).selectOption('Hostel A');
      await page.getByLabel(/phone/i).fill('9876543210');

      // Submit
      await page.getByRole('button', { name: /register/i }).click();

      // ASSERT
      await expect(page).toHaveURL(/\/warden\/dashboard/);
    });

    test('should show error for duplicate email', async ({ page }) => {
      // Navigate to registration
      await page.goto('/register');

      // Try to register with existing email
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).first().fill('Test@123');
      await page.getByRole('button', { name: /register/i }).click();

      // ASSERT
      await expect(page.getByText(/email already exists/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');

      // Try weak password
      await page.getByLabel(/password/i).first().fill('weak');

      // ASSERT
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto('/register');

      // Enter mismatched passwords
      await page.getByLabel(/password/i).first().fill('Test@123');
      await page.getByLabel(/confirm password/i).fill('Test@456');

      // ASSERT
      await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    });
  });

  test.describe('Forgot Password', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      // ACT
      await page.getByRole('link', { name: /forgot password/i }).click();

      // ASSERT
      await expect(page).toHaveURL(/\/forgot-password/);
      await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
    });

    test('should send reset email for valid email', async ({ page }) => {
      await page.goto('/forgot-password');

      // ACT
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // ASSERT
      await expect(page.getByText(/reset link sent/i)).toBeVisible();
    });

    test('should show generic message for non-existent email', async ({ page }) => {
      await page.goto('/forgot-password');

      // ACT
      await page.getByLabel(/email/i).fill('nonexistent@test.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // ASSERT - Should show same message for security
      await expect(page.getByText(/reset link sent/i)).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/\/dashboard/);

      // ACT - Logout
      await page.getByRole('button', { name: /logout/i }).click();

      // ASSERT
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    });

    test('should clear session data on logout', async ({ page, context }) => {
      // Login
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/\/dashboard/);

      // Logout
      await page.getByRole('button', { name: /logout/i }).click();

      // Try to access protected route
      await page.goto('/student/dashboard');

      // ASSERT - Should redirect to login
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without auth', async ({ page }) => {
      // ACT
      await page.goto('/student/dashboard');

      // ASSERT
      await expect(page).toHaveURL('/');
      await expect(page.getByText(/please login/i)).toBeVisible();
    });

    test('should prevent access to wrong role dashboard', async ({ page }) => {
      // Login as student
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/\/student\/dashboard/);

      // Try to access warden dashboard
      await page.goto('/warden/dashboard');

      // ASSERT - Should redirect or show error
      await expect(page).not.toHaveURL(/\/warden\/dashboard/);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page refreshes', async ({ page }) => {
      // Login
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/\/dashboard/);

      // Refresh page
      await page.reload();

      // ASSERT - Should still be logged in
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByText(/welcome/i)).toBeVisible();
    });

    test('should handle expired token gracefully', async ({ page }) => {
      // Login
      await page.getByLabel(/email/i).fill('student@test.com');
      await page.getByLabel(/password/i).fill('Test@123');
      await page.getByRole('button', { name: /login/i }).click();
      await page.waitForURL(/\/dashboard/);

      // Simulate token expiration by clearing localStorage
      await page.evaluate(() => {
        localStorage.removeItem('token');
      });

      // Try to make an authenticated request
      await page.reload();

      // ASSERT - Should redirect to login
      await expect(page).toHaveURL('/');
    });
  });
});

// 
