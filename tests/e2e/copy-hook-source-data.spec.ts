import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import type { Bundle } from '../fixtures/bundle';
import { CopyHookSourceDataPage, type CopyHook } from '../fixtures/pages/CopyHookSourceDataPage';

/**
 * DEV-3541 – the private source-data clipboard flavor follows what `beforeCopy` leaves.
 *
 * Every case is a real copy and a real paste between two grids: a trusted event pair, with the data
 * on the real clipboard. Grid B has `parsePastedValue: true`, so it reads the private flavor and an
 * object cell reaches it as an object. Every assertion reads the data SOURCE of grid B, because an
 * object and its string form render alike. Each case copies values carrying a token of its own (a
 * `randomUUID()` per test), and the browser clipboard outlives a test, so a copy that silently did
 * nothing would paste a leftover and fail instead of passing.
 */
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

async function openFixture(page: Page, theme: string, bundle: Bundle, hook: CopyHook) {
  const grid = new CopyHookSourceDataPage(page, theme, bundle, hook);

  await grid.goto();

  return grid;
}

test.describe('source-data flavor and beforeCopy', () => {
  test('does not leak an object cell the hook masked', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'mask');

    await grid.copyBothRows();
    await grid.pasteIntoB();

    await expect.poll(() => grid.sourceAtB(1, 0)).toBe(grid.keptSource());
    expect(await grid.sourceAtB(0, 0)).toBe('string:');
  });

  test('keeps the rows aligned when the hook removes a row', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'splice');

    await grid.copyBothRows();
    await grid.pasteIntoB();

    await expect.poll(() => grid.sourceAtB(0, 0)).toBe(grid.keptSource());
    expect(await grid.sourceAtB(1, 0)).toBe('null');
  });

  test('keeps the untouched object cells when the hook maps rows to new arrays', async({ page, theme, bundle }) => {
    const grid = await openFixture(page, theme, bundle, 'map');

    await grid.copyBothRows();
    await grid.pasteIntoB();

    await expect.poll(() => grid.sourceAtB(1, 0)).toBe(grid.keptSource());
    expect(await grid.sourceAtB(0, 0)).toBe('string:');
  });
});
