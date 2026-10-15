import { test, expect } from '@playwright/test';
import { ScreenerCataloguePage } from '../../pages/ScreenerCataloguePage';

test.describe('Neuly catalogue @smoke', () => {
  test('catalogue page loads and shows respondent options', async ({ page }) => {
    const catalogue = new ScreenerCataloguePage(page);
    await catalogue.goto();

    await expect(catalogue.heading).toBeVisible();
    await expect(catalogue.myChildButton).toBeVisible();
    await expect(catalogue.myselfButton).toBeVisible();
  });
});
