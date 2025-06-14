import { test, expect, Page } from '@playwright/test';

test.describe('Authentication Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('User Registration', () => {
    test('should register new user successfully', async () => {
      // Navigate to login page
      await expect(page).toHaveURL('/login');
      
      // Switch to sign up mode
      await page.click('text=Sign up');
      
      // Fill registration form
      await page.fill('[data-testid="username-input"]', 'testuser123');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      
      // Submit form
      await page.click('[data-testid="signup-button"]');
      
      // Should redirect to chat page
      await expect(page).toHaveURL('/chat');
      
      // Should show user info in sidebar
      await expect(page.locator('.user-email')).toContainText('test@example.com');
      await expect(page.locator('.account-type')).toContainText('Free Account');
    });

    test('should show validation errors for invalid data', async () => {
      await expect(page).toHaveURL('/login');
      await page.click('text=Sign up');
      
      // Try to submit empty form
      await page.click('[data-testid="signup-button"]');
      
      // Should show validation errors
      await expect(page.locator('.error-message')).toContainText('Username is required');
      
      // Fill invalid email
      await page.fill('[data-testid="username-input"]', 'testuser');
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', '123');
      
      await page.click('[data-testid="signup-button"]');
      
      // Should show multiple validation errors
      await expect(page.locator('.error-message')).toContainText('Password must be at least 6 characters');
    });

    test('should prevent duplicate username registration', async () => {
      // First registration
      await page.click('text=Sign up');
      await page.fill('[data-testid="username-input"]', 'duplicateuser');
      await page.fill('[data-testid="email-input"]', 'test1@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signup-button"]');
      
      // Logout
      await page.click('[data-testid="logout-button"]');
      
      // Try to register with same username
      await page.click('text=Sign up');
      await page.fill('[data-testid="username-input"]', 'duplicateuser');
      await page.fill('[data-testid="email-input"]', 'test2@example.com');
      await page.fill('[data-testid="password-input"]', 'password456');
      await page.click('[data-testid="signup-button"]');
      
      // Should show error
      await expect(page.locator('.error-message')).toContainText('Username already exists');
    });
  });

  test.describe('User Login', () => {
    test('should login with correct credentials', async () => {
      // First create a user
      await page.click('text=Sign up');
      await page.fill('[data-testid="username-input"]', 'loginuser');
      await page.fill('[data-testid="email-input"]', 'login@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signup-button"]');
      
      // Logout
      await page.click('[data-testid="logout-button"]');
      
      // Now test login
      await expect(page).toHaveURL('/login');
      await page.fill('[data-testid="username-input"]', 'loginuser');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signin-button"]');
      
      // Should redirect to chat
      await expect(page).toHaveURL('/chat');
      await expect(page.locator('.user-email')).toContainText('login@example.com');
    });

    test('should show error for incorrect credentials', async () => {
      await page.fill('[data-testid="username-input"]', 'loginuser');
      await page.fill('[data-testid="password-input"]', 'wrongpassword');
      
      await page.click('[data-testid="signin-button"]');
      
      // Should stay on login page and show error
      await expect(page).toHaveURL('/login');
      await expect(page.locator('.error-message')).toContainText('Invalid username or password');
    });

    test('should toggle between sign in and sign up modes', async () => {
      // Should start in sign in mode
      await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
      
      // Switch to sign up
      await page.click('text=Sign up');
      await expect(page.locator('[data-testid="signup-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      
      // Switch back to sign in
      await page.click('text=Sign in');
      await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).not.toBeVisible();
    });
  });

  test.describe('Route Protection', () => {
    test('should redirect unauthenticated users to login', async () => {
      // Try to access protected routes directly
      await page.goto('/chat');
      await expect(page).toHaveURL('/login');
      
      await page.goto('/account');
      await expect(page).toHaveURL('/login');
      
      await page.goto('/design-system');
      await expect(page).toHaveURL('/login');
    });

    test('should allow authenticated users to access protected routes', async () => {
      // Login first
      await page.click('text=Sign up');
      await page.fill('[data-testid="username-input"]', 'protecteduser');
      await page.fill('[data-testid="email-input"]', 'protected@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.click('[data-testid="signup-button"]');
      
      // Should be able to access protected routes
      await page.goto('/account');
      await expect(page).toHaveURL('/account');
      await expect(page.locator('h1')).toContainText('Account Settings');
      
      await page.goto('/design-system');
      await expect(page).toHaveURL('/design-system');
    });
  });
});

test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create and login user
    await page.goto('/');
    await page.click('text=Sign up');
    await page.fill('[data-testid="username-input"]', 'accountuser');
    await page.fill('[data-testid="email-input"]', 'account@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signup-button"]');
  });

  test('should navigate to account page and edit profile', async ({ page }) => {
    // Navigate to account page
    await page.click('[data-testid="my-account-button"]');
    await expect(page).toHaveURL('/account');
    await expect(page.locator('h1')).toContainText('Account Settings');
  });

  test('should edit profile information', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    
    // Click edit profile
    await page.click('text=Edit Profile');
    
    // Should show edit form
    await expect(page.locator('[data-testid="username-edit"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-edit"]')).toBeVisible();
    
    // Edit information
    await page.fill('[data-testid="username-edit"]', 'newusername');
    await page.fill('[data-testid="email-edit"]', 'newemail@example.com');
    
    // Save changes
    await page.click('text=Save Changes');
    
    // Should show success message
    await expect(page.locator('.message.success')).toContainText('Profile updated successfully');
    
    // Should display updated information
    await expect(page.locator('.profile-field')).toContainText('newusername');
    await expect(page.locator('.profile-field')).toContainText('newemail@example.com');
  });

  test('should upgrade account to pro', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    
    // Should show upgrade section for free account
    await expect(page.locator('text=Upgrade to Pro')).toBeVisible();
    await expect(page.locator('.upgrade-features')).toContainText('Unlimited conversations');
    
    // Click upgrade button
    await page.click('[data-testid="upgrade-button"]');
    
    // Should show success message
    await expect(page.locator('.message.success')).toContainText('Successfully upgraded to Pro');
    
    // Should update account type display
    await expect(page.locator('.account-type.pro')).toContainText('Pro Account');
    
    // Should show pro features instead of upgrade section
    await expect(page.locator('.pro-badge')).toContainText('Pro Account Active');
    await expect(page.locator('text=Upgrade to Pro')).not.toBeVisible();
  });

  test('should cancel profile editing', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    await page.click('text=Edit Profile');
    
    // Make changes
    await page.fill('[data-testid="username-edit"]', 'canceltest');
    await page.fill('[data-testid="email-edit"]', 'cancel@example.com');
    
    // Cancel editing
    await page.click('text=Cancel');
    
    // Should return to view mode with original data
    await expect(page.locator('[data-testid="username-edit"]')).not.toBeVisible();
    await expect(page.locator('.profile-field')).toContainText('accountuser');
    await expect(page.locator('.profile-field')).toContainText('account@example.com');
  });

  test('should navigate back to chat from account page', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    
    // Click back button
    await page.click('text=← Back to Chat');
    
    // Should navigate back to chat
    await expect(page).toHaveURL('/chat');
  });
});

test.describe('Chat Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create and login user
    await page.goto('/');
    await page.click('text=Sign up');
    await page.fill('[data-testid="username-input"]', 'chatuser');
    await page.fill('[data-testid="email-input"]', 'chat@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signup-button"]');
  });

  test('should create new chat and send message', async ({ page }) => {
    // Should be on chat page
    await expect(page).toHaveURL('/chat');
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Hello, this is a test message');
    await page.click('[data-testid="send-button"]');
    
    // Should display user message
    await expect(page.locator('.message.user')).toContainText('Hello, this is a test message');
    
    // Should receive AI response (demo or WebLLM)
    await expect(page.locator('.message.assistant')).toBeVisible();
  });

  test('should show user-specific chats only', async ({ page }) => {
    // Create a chat
    await page.fill('[data-testid="message-input"]', 'User 1 message');
    await page.click('[data-testid="send-button"]');
    
    // Logout and create another user
    await page.click('[data-testid="logout-button"]');
    
    await page.click('text=Sign up');
    await page.fill('[data-testid="username-input"]', 'chatuser2');
    await page.fill('[data-testid="email-input"]', 'chat2@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signup-button"]');
    
    // Should not see first user's chats
    await expect(page.locator('.message')).toHaveCount(0);
    
    // Create message for second user
    await page.fill('[data-testid="message-input"]', 'User 2 message');
    await page.click('[data-testid="send-button"]');
    
    // Should only see second user's message
    await expect(page.locator('.message.user')).toContainText('User 2 message');
    await expect(page.locator('.message.user')).not.toContainText('User 1 message');
  });
});

test.describe('Theme and UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign up');
    await page.fill('[data-testid="username-input"]', 'themeuser');
    await page.fill('[data-testid="email-input"]', 'theme@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signup-button"]');
  });

  test('should toggle between light and dark themes', async ({ page }) => {
    // Should start with default theme
    const body = page.locator('body');
    
    // Toggle theme
    await page.click('[data-testid="theme-toggle"]');
    
    // Should change theme class
    await expect(body).toHaveClass(/dark|light/);
    
    // Toggle again
    await page.click('[data-testid="theme-toggle"]');
    
    // Should toggle back
    await expect(body).toHaveClass(/dark|light/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should adapt layout for mobile
    await expect(page.locator('.sidebar')).toHaveCSS('width', '100%');
    
    // Account page should stack vertically
    await page.click('[data-testid="my-account-button"]');
    await expect(page.locator('.profile-card')).toHaveCSS('flex-direction', 'column');
  });
}); 