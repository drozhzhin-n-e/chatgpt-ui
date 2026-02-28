import { test, expect } from '@playwright/test';

/**
 * Helper: register a fresh user and land on /chat.
 * Uses a unique suffix so tests don't collide.
 */
async function registerAndLogin(
  page: import('@playwright/test').Page,
  suffix: string,
  opts?: { email?: string }
) {
  await page.goto('/');
  await expect(page).toHaveURL('/login');

  // Switch to Sign up
  await page.click('button.link-button:has-text("Sign up")');

  // Fill registration form
  await page.fill('[data-testid="username-input"]', `user_${suffix}`);
  if (opts?.email) {
    await page.fill('[data-testid="email-input"]', opts.email);
  }
  await page.fill('[data-testid="password-input"]', 'pass1234');
  await page.fill('#confirmPassword', 'pass1234');

  // Submit
  await page.click('[data-testid="signup-button"]');

  // After register there is a 1 s redirect delay
  await expect(page).toHaveURL('/chat', { timeout: 5000 });
}

// ──────────────────────────────────────────────────────────────
// 1. AUTH FLOW
// ──────────────────────────────────────────────────────────────
test.describe('Auth Flow', () => {
  test('register, logout, login', async ({ page }) => {
    const id = Date.now().toString(36);
    await registerAndLogin(page, `auth_${id}`, { email: `auth_${id}@test.io` });

    // Verify sidebar shows email
    await expect(page.locator('.user-email')).toContainText(`auth_${id}@test.io`);

    // Logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/login');

    // Login again
    await page.fill('[data-testid="username-input"]', `user_auth_${id}`);
    await page.fill('[data-testid="password-input"]', 'pass1234');
    await page.click('[data-testid="signin-button"]');
    await expect(page).toHaveURL('/chat', { timeout: 5000 });

    // Sidebar still shows the email
    await expect(page.locator('.user-email')).toContainText(`auth_${id}@test.io`);
  });

  test('wrong credentials show error', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="username-input"]', 'nonexistent');
    await page.fill('[data-testid="password-input"]', 'wrong');
    await page.click('[data-testid="signin-button"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('toggle between sign in and sign up modes', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();

    await page.click('button.link-button:has-text("Sign up")');
    await expect(page.locator('[data-testid="signup-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible();

    await page.click('button.link-button:has-text("Sign in")');
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
  });

  test('route protection: unauthenticated → /login', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL('/login');
    await page.goto('/account');
    await expect(page).toHaveURL('/login');
  });
});

// ──────────────────────────────────────────────────────────────
// 2. MULTI-CHAT & SWITCHING
// ──────────────────────────────────────────────────────────────
test.describe('Multi-chat', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `mc_${Date.now().toString(36)}`);
  });

  test('create multiple chats and switch between them', async ({ page }) => {
    // Send first message → creates first chat
    await page.fill('.message-input', 'First chat message');
    await page.click('.send-button');

    // Wait for AI response
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    // Sidebar should have a chat titled "First chat message"
    await expect(page.locator('.chat-title').first()).toContainText('First chat message');

    // Create second chat
    await page.click('.new-chat-btn');
    await page.fill('.message-input', 'Second chat message');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    // Sidebar should now have 2 chats
    await expect(page.locator('.chat-item')).toHaveCount(2);

    // Switch back to first chat
    await page.locator('.chat-title', { hasText: 'First chat message' }).click();

    // Verify first chat's messages are preserved
    await expect(page.locator('.message.user')).toContainText('First chat message');

    // Switch to second chat
    await page.locator('.chat-title', { hasText: 'Second chat message' }).click();
    await expect(page.locator('.message.user')).toContainText('Second chat message');
  });
});

// ──────────────────────────────────────────────────────────────
// 3. CHAT RENAME
// ──────────────────────────────────────────────────────────────
test.describe('Chat Rename', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `rn_${Date.now().toString(36)}`);
  });

  test('rename a chat via inline edit', async ({ page }) => {
    // Create a chat
    await page.fill('.message-input', 'Chat to rename');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    // Hover to reveal action buttons, click edit
    await page.locator('.chat-item').first().hover();
    await page.locator('.edit-btn').first().click();

    // Inline input should appear
    const input = page.locator('.chat-title-input');
    await expect(input).toBeVisible();

    // Clear and type new name
    await input.fill('Renamed Chat');
    await input.press('Enter');

    // Title should be updated
    await expect(page.locator('.chat-title').first()).toContainText('Renamed Chat');
  });
});

// ──────────────────────────────────────────────────────────────
// 4. CHAT DELETE
// ──────────────────────────────────────────────────────────────
test.describe('Chat Delete', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `del_${Date.now().toString(36)}`);
  });

  test('delete a chat with confirmation dialog', async ({ page }) => {
    // Create a chat
    await page.fill('.message-input', 'Chat to delete');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.chat-item')).toHaveCount(1);

    // Set up dialog handler to accept the confirmation
    page.on('dialog', dialog => dialog.accept());

    // Hover over chat, click delete
    await page.locator('.chat-item').first().hover();
    await page.locator('.delete-btn').first().click();

    // Chat should be removed
    await expect(page.locator('.chat-item')).toHaveCount(0);

    // Welcome screen should appear
    await expect(page.locator('.welcome-screen')).toBeVisible();
  });

  test('cancel delete keeps chat', async ({ page }) => {
    await page.fill('.message-input', 'Chat to keep');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    // Dismiss the dialog
    page.on('dialog', dialog => dialog.dismiss());

    await page.locator('.chat-item').first().hover();
    await page.locator('.delete-btn').first().click();

    // Chat should still be present
    await expect(page.locator('.chat-item')).toHaveCount(1);
  });
});

// ──────────────────────────────────────────────────────────────
// 5. WELCOME SCREEN EXAMPLE PROMPTS
// ──────────────────────────────────────────────────────────────
test.describe('Welcome Screen', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `ws_${Date.now().toString(36)}`);
  });

  test('displays welcome screen with Examples, Capabilities, Limitations', async ({ page }) => {
    await expect(page.locator('.welcome-screen')).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Examples' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Capabilities' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Limitations' })).toBeVisible();
  });

  test('clicking example prompt sends it as a message', async ({ page }) => {
    await expect(page.locator('.welcome-screen')).toBeVisible();

    // Click the first example
    await page.locator('.capability-item', { hasText: 'Explain quantum computing' }).click();

    // Should send as user message
    await expect(page.locator('.message.user')).toContainText('Explain quantum computing in simple terms');

    // AI response should appear
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    // Chat should appear in sidebar
    await expect(page.locator('.chat-title').first()).toContainText('Explain quantum');
  });
});

// ──────────────────────────────────────────────────────────────
// 6. SPECIAL AI KEYWORD RESPONSES
// ──────────────────────────────────────────────────────────────
test.describe('AI Keyword Responses', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `kw_${Date.now().toString(36)}`);
  });

  test('keyword "квантов" triggers quantum physics response', async ({ page }) => {
    await page.fill('.message-input', 'Расскажи про квантовую физику');
    await page.click('.send-button');

    const assistantMsg = page.locator('.message.assistant');
    await expect(assistantMsg).toBeVisible({ timeout: 5000 });
    await expect(assistantMsg).toContainText('Квантовая физика — это удивительная область науки!');
  });

  test('generic message gets default response', async ({ page }) => {
    await page.fill('.message-input', 'Hello world');
    await page.click('.send-button');

    const assistantMsg = page.locator('.message.assistant');
    await expect(assistantMsg).toBeVisible({ timeout: 5000 });
    await expect(assistantMsg).toContainText('Отличный вопрос! Чем могу помочь?');
  });
});

// ──────────────────────────────────────────────────────────────
// 7. DARK / LIGHT THEME TOGGLE
// ──────────────────────────────────────────────────────────────
test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `th_${Date.now().toString(36)}`);
  });

  test('toggle dark mode and back', async ({ page }) => {
    // Should start in light mode
    await expect(page.locator('[data-testid="theme-toggle"]')).toContainText('Dark mode');

    // Toggle to dark
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('[data-testid="theme-toggle"]')).toContainText('Light mode');

    // The body or container should have a dark class
    await expect(page.locator('body')).toHaveClass(/dark/);

    // Toggle back to light
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('[data-testid="theme-toggle"]')).toContainText('Dark mode');
  });
});

// ──────────────────────────────────────────────────────────────
// 8. ACCOUNT MANAGEMENT
// ──────────────────────────────────────────────────────────────
test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `acc_${Date.now().toString(36)}`, {
      email: `acc_${Date.now().toString(36)}@test.io`,
    });
  });

  test('navigate to account page and see profile', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    await expect(page).toHaveURL('/account');
    await expect(page.locator('h1')).toContainText('Account Settings');
    await expect(page.locator('.profile-field .field-value').first()).toBeVisible();
  });

  test('edit profile: change username and save', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    await expect(page).toHaveURL('/account');

    await page.click('button:has-text("Edit Profile")');

    // Edit form visible
    const usernameInput = page.locator('.profile-edit input[name="username"]');
    await expect(usernameInput).toBeVisible();

    await usernameInput.fill('updated_user');
    await page.click('button:has-text("Save Changes")');

    // Success message appears (save is simulated with 1s delay)
    await expect(page.locator('.message.success')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.message.success')).toContainText('Profile updated successfully');

    // Edit mode should be closed
    await expect(usernameInput).not.toBeVisible();
  });

  test('edit profile: cancel reverts changes', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');

    // Get original username
    const originalUsername = await page.locator('.profile-field .field-value').first().textContent();

    await page.click('button:has-text("Edit Profile")');
    const usernameInput = page.locator('.profile-edit input[name="username"]');
    await usernameInput.fill('should_not_save');
    await page.click('button:has-text("Cancel")');

    // Should revert to original
    await expect(page.locator('.profile-field .field-value').first()).toContainText(originalUsername!.trim());
  });

  test('upgrade to Pro', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    await expect(page).toHaveURL('/account');

    // Should show upgrade section
    await expect(page.locator('.upgrade-button')).toBeVisible();
    await expect(page.locator('.upgrade-features')).toContainText('Unlimited conversations');

    // Click upgrade
    await page.click('.upgrade-button');

    // Success message
    await expect(page.locator('.message.success')).toBeVisible({ timeout: 3000 });

    // Account type shows Pro (scoped to account page to avoid sidebar duplicate)
    await expect(page.locator('.account-content .account-type.pro')).toContainText('Pro Account');

    // Pro features section visible
    await expect(page.locator('.pro-badge')).toContainText('Pro Account Active');

    // Upgrade section gone
    await expect(page.locator('.upgrade-button')).not.toBeVisible();
  });

  test('navigate back to chat', async ({ page }) => {
    await page.click('[data-testid="my-account-button"]');
    await expect(page).toHaveURL('/account');
    await page.click('.back-button');
    await expect(page).toHaveURL('/chat');
  });
});

// ──────────────────────────────────────────────────────────────
// 9. MESSAGE INPUT: Enter key & empty message
// ──────────────────────────────────────────────────────────────
test.describe('Message Input', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `inp_${Date.now().toString(36)}`);
  });

  test('send message with Enter key', async ({ page }) => {
    await page.fill('.message-input', 'Sent with Enter');
    await page.press('.message-input', 'Enter');

    await expect(page.locator('.message.user')).toContainText('Sent with Enter');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });
  });

  test('empty message is not sent', async ({ page }) => {
    // Send button should be inactive (no .active class) when input is empty
    await expect(page.locator('.send-button')).not.toHaveClass(/active/);

    // Try clicking send with empty input
    await page.click('.send-button');

    // No messages should appear
    await expect(page.locator('.message')).toHaveCount(0);

    // Welcome screen still visible
    await expect(page.locator('.welcome-screen')).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────
// 10. LOCAL STORAGE PERSISTENCE
// ──────────────────────────────────────────────────────────────
test.describe('LocalStorage Persistence', () => {
  test('chats survive page reload', async ({ page }) => {
    const id = Date.now().toString(36);
    await registerAndLogin(page, `ls_${id}`);

    // Create a chat
    await page.fill('.message-input', 'Persistent message');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    // Reload the page
    await page.reload();

    // Should still be on /chat (auth persisted)
    await expect(page).toHaveURL('/chat', { timeout: 5000 });

    // Chat should still be in sidebar
    await expect(page.locator('.chat-title', { hasText: 'Persistent message' })).toBeVisible();

    // Click on it and verify messages
    await page.locator('.chat-title', { hasText: 'Persistent message' }).click();
    await expect(page.locator('.message.user')).toContainText('Persistent message');
    await expect(page.locator('.message.assistant')).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────
// 11. AUTO-TITLE GENERATION
// ──────────────────────────────────────────────────────────────
test.describe('Auto-Title Generation', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, `at_${Date.now().toString(36)}`);
  });

  test('chat title is auto-generated from first message (truncated to 30 chars)', async ({ page }) => {
    const longMsg = 'This is a very long message that should be truncated in the title';
    await page.fill('.message-input', longMsg);
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    const titleText = await page.locator('.chat-title').first().textContent();
    // Title should be max 33 chars (30 + "...")
    expect(titleText!.trim().length).toBeLessThanOrEqual(33);
    expect(titleText!.trim()).toContain('...');
  });

  test('short message becomes full title without truncation', async ({ page }) => {
    await page.fill('.message-input', 'Short title');
    await page.click('.send-button');
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('.chat-title').first()).toHaveText('Short title');
  });
});
