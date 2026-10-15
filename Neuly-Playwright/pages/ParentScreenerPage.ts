import { type Locator, type Page, expect } from '@playwright/test';
import path from 'path';
import { dismissCookieBannerIfPresent } from '../helpers/cookies';
import { isSubmissionEnabled } from '../helpers/report-gate';

export type ScreenerOutcome = {
  screener: string;
  route: string;
  allQuestionsCompleted: boolean;
  resultScreenVisible: boolean;
  reportAttempted: boolean;
  reportConfirmed: boolean;
  evidenceDir: string;
  notes: string;
};

export class ParentScreenerPage {
  readonly page: Page;
  readonly completionText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.completionText = page.getByText(/All Questions Answered|You’ve completed all/i);
  }

  async goto(route: string): Promise<void> {
    await this.page.goto(`/screeners/${route}`, { waitUntil: 'networkidle' });
    await dismissCookieBannerIfPresent(this.page);
  }

  private async questionIndex(): Promise<number> {
    const text = await this.page.locator('body').innerText();
    const match = text.match(/Question\s+(\d+)\s+of\s+(\d+)/i);
    return match ? Number.parseInt(match[1], 10) : 0;
  }

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async pickVisibleOption(optionLabel: string): Promise<void> {
    const labelPattern = new RegExp(`^${this.escapeRegex(optionLabel)}$`, 'i');

    const byRole = this.page.getByRole('radio', { name: labelPattern }).first();
    const byText = this.page.locator('label').filter({ hasText: labelPattern }).first();
    const byTextNode = this.page.getByText(labelPattern, { exact: false }).first();

    const target = (await byRole.count()) > 0 ? byRole : (await byText.count()) > 0 ? byText : byTextNode;

    await expect(target).toBeVisible({ timeout: 30_000 });
    await target.click();
    await this.page.waitForTimeout(800);
  }

  private async advanceIfRequired(): Promise<boolean> {
    const nextButton = this.page.getByRole('button', { name: /Next question|Next/i }).first();
    if ((await nextButton.count()) === 0) {
      return false;
    }

    const enabled = await nextButton.isEnabled().catch(() => false);
    if (!enabled) {
      return false;
    }

    await nextButton.click();
    await this.page.waitForTimeout(800);
    return true;
  }

  async completeWithPattern(pattern: string[], maxQuestions = 200): Promise<void> {
    for (let i = 0; i < maxQuestions; i++) {
      const bodyText = await this.page.locator('body').innerText();
      if (/all questions answered|you’ve completed all/i.test(bodyText)) {
        return;
      }

      const currentIndex = await this.questionIndex();
      const labels = await this.page.getByRole('radio').allTextContents();
      const actualLabels = labels.map((label) => label.trim()).filter(Boolean);
      const requestedChoice = pattern[i % pattern.length] ?? pattern[0];
      const requestedMatch = actualLabels.find((label) => new RegExp(`^${this.escapeRegex(requestedChoice)}$`, 'i').test(label));
      const fallbackChoice = pattern.find((candidate) => actualLabels.some((label) => new RegExp(`^${this.escapeRegex(candidate)}$`, 'i').test(label))) ?? actualLabels[0] ?? requestedChoice;
      const choice = requestedMatch ?? fallbackChoice;

      const before = currentIndex;
      await this.pickVisibleOption(choice);
      const nextUsed = await this.advanceIfRequired();

      for (let j = 0; j < 12; j++) {
        const updatedBody = await this.page.locator('body').innerText();
        if (/all questions answered|you’ve completed all/i.test(updatedBody)) {
          return;
        }

        const afterIndex = await this.questionIndex();
        if (afterIndex !== before || nextUsed) {
          break;
        }

        await this.page.waitForTimeout(1000);
      }

      const finalCheck = await this.page.locator('body').innerText();
      if (/all questions answered|you’ve completed all/i.test(finalCheck)) {
        return;
      }

      const stillSame = await this.questionIndex();
      if (stillSame === before) {
        throw new Error(`Question did not advance after selecting "${choice}". Current question index remains ${before}.`);
      }
    }

    throw new Error(`Reached maximum question steps without seeing completion screen.`);
  }

  async waitForCompletionScreen(): Promise<void> {
    await expect(this.page.getByText(/All Questions Answered|You’ve completed all/i).first()).toBeVisible({ timeout: 90_000 });
    await expect(this.page.getByRole('button', { name: /Send My Report|Send report/i })).toBeVisible({ timeout: 30_000 });
  }

  async submitReportEmail(email: string, evidenceDir: string): Promise<boolean> {
    // Safety gate: do not attempt UI submission when disabled
    if (!isSubmissionEnabled()) return false;

    const emailInput = this.page.getByLabel(/email/i, { exact: false }).or(this.page.locator('input[type="email"]'));
    await expect(emailInput.first()).toBeVisible({ timeout: 30_000 });
    await emailInput.first().fill(email);

    const consent = this.page.getByRole('checkbox', { name: /I agree to Neuly storing my answers and email address to send me my results/i });
    if (await consent.count()) {
      await consent.first().check({ force: true });
    }

    const send = this.page.getByRole('button', { name: /Send My Report|Send report/i });
    await send.first().click();

    await this.page.screenshot({ path: path.join(evidenceDir, '03-report-confirmation.png'), fullPage: true });

    await expect(this.page.getByText(/report.*sent|email.*sent|sent to your email|your report.*sent|we.*sent/i)).toBeVisible({ timeout: 60_000 });
    return true;
  }

  async getCompletionSummary(): Promise<{ bodyText: string; scoreText: string | null; classificationText: string | null; }> {
    const bodyText = await this.page.locator('body').innerText();
    const scoreMatch = bodyText.match(/(\d{1,2})\s*(?:\/\s*\d+|out of \d+)/i);
    const classificationMatch = bodyText.match(/\b(Minimal|Mild|Moderate|Severe|Low|Medium|High)\b/i);
    return {
      bodyText,
      scoreText: scoreMatch?.[1] ?? null,
      classificationText: classificationMatch?.[1] ?? null,
    };
  }
}
