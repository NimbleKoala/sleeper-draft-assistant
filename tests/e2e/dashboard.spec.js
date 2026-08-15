import { test, expect } from '@playwright/test';

test.describe('Dashboard & Core Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should render main application header and branding', async ({ page }) => {
    await expect(page).toHaveTitle(/Sleeper Fantasy Football Draft Assistant/i);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Sleeper Draft Assistant');

    // Verify season badge
    const badge = page.locator('text=2026 PPR');
    await expect(badge).toBeVisible();
  });

  test('should display active player rankings count and status badges', async ({ page }) => {
    // Check rankings count pill in header
    const rankingsBtn = page.locator('button:has-text("Rankings:")');
    await expect(rankingsBtn).toBeVisible();

    // Verify status text when no Sleeper draft is active
    const statusText = page.locator('text=No active Sleeper draft synced');
    await expect(statusText).toBeVisible();
  });

  test('should render Best Available players section with headers and data', async ({ page }) => {
    const sectionHeading = page.locator('h2#best-available-heading');
    await expect(sectionHeading).toBeVisible();
    await expect(sectionHeading).toContainText('Best Available');

    // Verify either table rows or player cards exist
    const rowsOrCards = page.locator('tbody tr, .glass-panel h3');
    await expect(rowsOrCards.first()).toBeVisible();
    const count = await rowsOrCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render Roster Tracker section', async ({ page }) => {
    const rosterSection = page.locator('text=Roster Tracker');
    await expect(rosterSection).toBeVisible();

    // Check positional target labels
    await expect(page.locator('text=QB').first()).toBeVisible();
    await expect(page.locator('text=RB').first()).toBeVisible();
    await expect(page.locator('text=WR').first()).toBeVisible();
  });

  test('should render Live Draft Board section and empty state connect button', async ({ page }) => {
    const draftBoardHeading = page.locator('h2#draft-board-heading');
    await expect(draftBoardHeading).toBeVisible();
    await expect(draftBoardHeading).toContainText('Live Draft Board');

    // Check connect draft button inside the empty state
    const connectBtn = page.locator('button:has-text("Connect Draft")').first();
    await expect(connectBtn).toBeVisible();
  });
});
