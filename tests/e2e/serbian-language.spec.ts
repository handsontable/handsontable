import { test, expect } from '../fixtures/test';
import { SerbianLanguagePage } from '../fixtures/pages/SerbianLanguagePage';

/**
 * DEV-1090. The Serbian language is registered as `sr-RS`. The old `sr-SP` code stays a deprecated
 * alias: it keeps translating and prints a one-time deprecation warning, and `sr-RS` prints none.
 */
test.describe('Serbian language codes', () => {
  test('translates the context menu with the `sr-RS` code and logs no warning', async ({ page, theme, bundle }) => {
    const grid = new SerbianLanguagePage(page, theme, bundle);

    await grid.goto('sr-RS');
    await grid.openContextMenu();

    await expect(grid.contextMenuItems().filter({ hasText: 'Unesi kolonu desno' })).toHaveCount(1);
    expect(await grid.warnings()).toEqual([]);
  });

  test('keeps translating with the deprecated `sr-SP` code and warns about it once', async ({ page, theme, bundle }) => {
    const grid = new SerbianLanguagePage(page, theme, bundle);

    await grid.goto('sr-SP');
    await grid.openContextMenu();

    await expect(grid.contextMenuItems().filter({ hasText: 'Unesi kolonu desno' })).toHaveCount(1);

    const warnings = (await grid.warnings()).filter(message => message.includes('sr-SP'));

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^Deprecated: .*sr-RS/);
  });
});
