import { test, expect } from '@playwright/test';

test.describe('Manually Entered Draft Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should open Connect modal and display Manual Draft tab', async ({ page }) => {
    // Open connect modal
    const connectBtn = page.locator('button:has-text("Connect Draft")').first();
    await connectBtn.click();

    // Verify modal is open
    const modalHeading = page.locator('#connect-modal-title');
    await expect(modalHeading).toBeVisible();

    // Click Manual Draft tab
    const manualTab = page.locator('button[role="tab"]:has-text("Manual Draft")');
    await expect(manualTab).toBeVisible();
    await manualTab.click();

    // Verify manual draft configuration form elements exist
    await expect(page.locator('#modal-manual-league-name')).toBeVisible();
    await expect(page.locator('#modal-manual-teams-count')).toBeVisible();
    await expect(page.locator('#modal-manual-rounds-count')).toBeVisible();
    await expect(page.locator('#modal-manual-draft-type')).toBeVisible();
    await expect(page.locator('#modal-manual-my-slot')).toBeVisible();
  });

  test('should create a new manual draft and display on-the-clock cockpit controls', async ({ page }) => {
    // Open connect modal
    const connectBtn = page.locator('button:has-text("Connect Draft")').first();
    await connectBtn.click();

    // Click Manual Draft tab
    const manualTab = page.locator('button[role="tab"]:has-text("Manual Draft")');
    await manualTab.click();

    // Fill form
    const nameInput = page.locator('#modal-manual-league-name');
    await nameInput.fill('Playwright Test League');

    const startBtn = page.locator('button:has-text("Start Manual Draft")');
    await startBtn.click();

    // Verify manual draft cockpit controls appear
    const cockpit = page.locator('div[role="region"][aria-label="Manual Draft Cockpit Controls"]');
    await expect(cockpit).toBeVisible();
    await expect(cockpit).toContainText('ON THE CLOCK:');
    await expect(cockpit).toContainText('Round 1, Pick 1 (#1)');

    // Verify status badge in header shows MANUAL DRAFT
    const headerBadge = page.locator('header span:has-text("MANUAL DRAFT")');
    await expect(headerBadge).toBeVisible();
  });

  test('should draft a player using Best Available Draft button and advance the clock', async ({ page }) => {
    // Start manual draft via quick Header button or modal
    const manualHeaderBtn = page.locator('header button:has-text("Manual")');
    if (await manualHeaderBtn.isVisible()) {
      await manualHeaderBtn.click();
      const submitBtn = page.locator('button:has-text("Start Manual Draft")');
      await submitBtn.click();
    } else {
      const connectBtn = page.locator('button:has-text("Connect Draft")').first();
      await connectBtn.click();
      await page.locator('button[role="tab"]:has-text("Manual Draft")').click();
      await page.locator('button:has-text("Start Manual Draft")').click();
    }

    // Verify initial clock
    const cockpit = page.locator('div[role="region"][aria-label="Manual Draft Cockpit Controls"]');
    await expect(cockpit).toContainText('Round 1, Pick 1 (#1)');

    // Click Draft on the first available player
    const firstDraftBtn = page.locator('section[aria-labelledby="best-available-heading"] tbody tr button:has-text("Draft"), section[aria-labelledby="best-available-heading"] button:has-text("Draft")').first();
    await expect(firstDraftBtn).toBeVisible();
    await firstDraftBtn.click();

    // Clock should advance to Pick 2
    await expect(cockpit).toContainText('Round 1, Pick 2 (#2)');

    // Pick 1 should appear in Draft Board
    const draftBoard = page.locator('section[aria-labelledby="draft-board-heading"]');
    await expect(draftBoard).toContainText('1 of');

    // Test Undo
    const undoBtn = page.locator('button:has-text("Undo Pick")');
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();

    // Clock should rewind back to Pick 1
    await expect(cockpit).toContainText('Round 1, Pick 1 (#1)');
  });

  test('should immediately remove drafted player from Best Available list when Hide Drafted is checked', async ({ page }) => {
    // Start manual draft
    const connectBtn = page.locator('button:has-text("Connect Draft")').first();
    await connectBtn.click();
    await page.locator('button[role="tab"]:has-text("Manual Draft")').click();
    await page.locator('button:has-text("Start Manual Draft")').click();

    // Search for a specific player (e.g. Kenneth Walker or Gibbs)
    const searchInput = page.locator('input[aria-label="Search players by name, team, or position"]');
    await searchInput.fill('Gibbs');

    // Verify Jahmyr Gibbs is present in Best Available section
    const bestAvailableSection = page.locator('section[aria-labelledby="best-available-heading"]');
    const gibbsRow = bestAvailableSection.locator('tbody tr:has-text("Jahmyr Gibbs"), div.glass-panel:has-text("Jahmyr Gibbs")').first();
    await expect(gibbsRow).toBeVisible();

    // Click Draft on Gibbs
    const draftBtn = gibbsRow.locator('button:has-text("Draft")');
    await draftBtn.click();

    // Gibbs should be immediately removed from Best Available list (since Hide Drafted is on by default)
    await expect(gibbsRow).not.toBeVisible();

    // Clear search
    await searchInput.fill('');

    // Quick search in manual draft cockpit for another player (e.g. Kenneth Walker)
    const quickInput = page.locator('input[aria-label="Quick search and draft player"]');
    await quickInput.fill('Walker');
    await page.keyboard.press('Enter');

    // Search in Best Available table for Walker
    await searchInput.fill('Kenneth Walker');
    const walkerRow = bestAvailableSection.locator('tbody tr:has-text("Walker"), div.glass-panel:has-text("Walker")').first();
    await expect(walkerRow).not.toBeVisible();

    // Uncheck Hide Drafted to verify they appear with drafted line-through status
    const hideDraftedCheckbox = page.locator('input[aria-label="Hide drafted players"]');
    await hideDraftedCheckbox.uncheck();

    await expect(walkerRow).toBeVisible();
    await expect(walkerRow).toContainText('Picked #2');
  });

  test('should open export modal and allow downloading CSV and copying summary', async ({ page }) => {
    // Start manual draft
    const connectBtn = page.locator('button:has-text("Connect Draft")').first();
    await connectBtn.click();
    await page.locator('button[role="tab"]:has-text("Manual Draft")').click();
    await page.locator('button:has-text("Start Manual Draft")').click();

    // Make 1 pick
    const firstDraftBtn = page.locator('section[aria-labelledby="best-available-heading"] tbody tr button:has-text("Draft")').first();
    if (await firstDraftBtn.isVisible()) {
      await firstDraftBtn.click();
    }

    // Open Export modal
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Verify modal elements
    const exportModal = page.locator('#export-modal-title');
    await expect(exportModal).toBeVisible();
    await expect(page.locator('button:has-text("Download CSV Spreadsheet")')).toBeVisible();
    await expect(page.locator('button:has-text("Copy CSV to Clipboard")')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });
});
