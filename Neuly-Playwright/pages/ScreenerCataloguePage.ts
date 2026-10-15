import { type Locator, type Page } from '@playwright/test';

export class ScreenerCataloguePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly myChildButton: Locator;
  readonly myselfButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Screening Questionnaires', level: 1 });
    this.myChildButton = page.getByRole('button', { name: /My child/i });
    this.myselfButton = page.getByRole('button', { name: /Myself/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/screeners');
    await this.heading.waitFor({ state: 'visible', timeout: 30_000 });
  }

  async selectRespondent(respondent: 'My child' | 'Myself'): Promise<void> {
    const button = this.page.getByRole('button', { name: new RegExp(`^${respondent}$`, 'i') });
    await expect(button).toBeVisible({ timeout: 30_000 });
    await button.click();
  }
}
