import type { Page } from '@playwright/test';

/** Dismiss Neuly cookie banner when it blocks the screener UI. */
export async function dismissCookieBannerIfPresent(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: /^Accept all$/i });
  const essential = page.getByRole('button', { name: /^Essential only$/i });
  const banner = accept.or(essential).first();
  try {
    await banner.click({ timeout: 4_000 });
  } catch {
    // Banner not shown (already accepted or region without banner).
  }
}
