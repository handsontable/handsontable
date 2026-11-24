import { type Page } from '@playwright/test';

/**
 * Clipboard access shared by page objects.
 */

/**
 * Reads the text on the browser clipboard. The spec grants the `clipboard-read` permission
 * (`test.use({ permissions: ['clipboard-read', 'clipboard-write'] })`).
 *
 * @param {Page} page The page whose clipboard is read.
 * @returns {Promise<string>}
 */
export async function readClipboardText(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
