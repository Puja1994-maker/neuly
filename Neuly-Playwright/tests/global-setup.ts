import { chromium, type FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(__dirname, '../test-data/.auth/storage-state.json');

async function globalSetup(_config: FullConfig): Promise<void> {
  const baseURL = process.env.NEULY_BASE_URL ?? 'https://demo.neuly.ai';
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}/screeners/gad_7_anxiety`, {
    waitUntil: 'domcontentloaded',
    timeout: 90_000,
  });
  const accept = page.getByRole('button', { name: /^Accept all$/i });
  try {
    await accept.click({ timeout: 8_000 });
  } catch {
    // Cookie banner not shown.
  }
  await context.storageState({ path: storagePath });
  await browser.close();
}

export default globalSetup;
