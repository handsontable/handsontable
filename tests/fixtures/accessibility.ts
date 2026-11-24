import { type Page } from '@playwright/test';

/**
 * The name and the description Chromium's own accessibility tree gives an element, which is what a screen
 * reader on Chromium reads from it (Playwright's `toHaveAccessibleName()` and `toHaveAccessibleDescription()`
 * compute them from the DOM instead). Chromium only: it reads the tree over CDP. Every run of white space is
 * collapsed to one space; the ends are left as Chromium gives them.
 *
 * @param {Page} page The Playwright page.
 * @param {string} selector A CSS selector for the element, resolved with `document.querySelector()`.
 * @returns {Promise<{ name: string, description: string }>}
 */
export async function chromiumAccessibility(page: Page, selector: string): Promise<{ name: string; description: string }> {
  const client = await page.context().newCDPSession(page);

  try {
    await client.send('Accessibility.enable');

    const { result } = await client.send('Runtime.evaluate', {
      expression: `document.querySelector(${JSON.stringify(selector)})`,
    });
    const { nodes } = await client.send('Accessibility.getPartialAXTree', {
      objectId: result.objectId,
      fetchRelatives: false,
    });
    const collapse = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ');

    return { name: collapse(nodes[0]?.name?.value), description: collapse(nodes[0]?.description?.value) };
  } finally {
    await client.detach();
  }
}
