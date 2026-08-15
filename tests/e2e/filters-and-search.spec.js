import { test, expect } from '@playwright/test';

test.describe('Search, Filtering & Sorting Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should filter players by search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();

    // Type "Gibbs" into search box
    await searchInput.fill('Gibbs');
    await page.waitForTimeout(300);

    // Expect Jahmyr Gibbs to be visible in either table row or card
    const gibbsPlayer = page.locator('text=Jahmyr Gibbs');
    await expect(gibbsPlayer.first()).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
  });

  test('should filter players by position tabs', async ({ page }) => {
    // Click "RB" tab
    const rbTab = page.locator('button[role="tab"]:has-text("RB")').first();
    await rbTab.click();
    await page.waitForTimeout(300);

    // Verify visible player position badges
    const rbBadges = page.locator('.badge-pos-RB, span:has-text("RB")');
    const badgeCount = await rbBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // Click "WR" tab
    const wrTab = page.locator('button[role="tab"]:has-text("WR")').first();
    await wrTab.click();
    await page.waitForTimeout(300);

    const wrBadges = page.locator('.badge-pos-WR, span:has-text("WR")');
    const wrCount = await wrBadges.count();
    expect(wrCount).toBeGreaterThan(0);

    // Click "ALL" tab to reset
    const allTab = page.locator('button[role="tab"]:has-text("ALL")').first();
    await allTab.click();
  });

  test('should toggle between Table View and Cards Grid View', async ({ page }) => {
    const cardsBtn = page.locator('button[aria-label="Switch to Cards View"]');
    await cardsBtn.scrollIntoViewIfNeeded();
    await cardsBtn.click({ force: true });
    await page.waitForTimeout(300);

    // Verify cards layout container is visible
    const cardGrid = page.locator('div.grid');
    await expect(cardGrid.first()).toBeVisible();

    // Switch back to Table View
    const tableBtn = page.locator('button[aria-label="Switch to Table View"]');
    await tableBtn.scrollIntoViewIfNeeded();
    await tableBtn.click({ force: true });
    await page.waitForTimeout(300);

    await expect(page.locator('tbody tr, h3').first()).toBeVisible();
  });
});
