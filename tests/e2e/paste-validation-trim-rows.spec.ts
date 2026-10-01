import { test, expect } from '../fixtures/test';
import { PasteValidationTrimRowsPage } from '../fixtures/pages/PasteValidationTrimRowsPage';

// Four invalid values pasted at visual row 2. The grid shows three rows, so rows 3, 4 and 5 do not
// exist yet when the paste is validated and are created only after the validation settles.
const PASTE_BLOCK = 'bad1\nbad2\nbad3\nbad4';

/**
 * DEV-155: a paste that grows the grid validates the rows it is about to create. With `trimRows`
 * the source holds more records than the grid shows, so a created row takes a physical index larger
 * than its visual one. The validation result has to be stored under the physical index the row will
 * get, or the created rows come out unvalidated while the results land on other records.
 */
test.describe('paste validation with trimRows', () => {
  test('validates every pasted row, including the rows the paste creates', async({ page, theme, bundle }) => {
    const grid = new PasteValidationTrimRowsPage(page, theme, bundle);

    await grid.goto();
    await grid.pasteAt(2, 0, PASTE_BLOCK);

    // The paste really grew the grid: a poll on the flags alone could settle on the first sample.
    await expect.poll(() => grid.countRows()).toBe(6);

    for (const row of [2, 3, 4, 5]) {
      await expect(grid.cell(row, 0)).toHaveClass(/htInvalid/);
      expect(await grid.validState(row, 0)).toBe('invalid');
    }
  });

  test('validates every pasted row when no row is trimmed', async({ page, theme, bundle }) => {
    const grid = new PasteValidationTrimRowsPage(page, theme, bundle, { trimmed: false });

    await grid.goto();
    await grid.pasteAt(2, 0, PASTE_BLOCK);

    await expect.poll(() => grid.countRows()).toBe(6);

    for (const row of [2, 3, 4, 5]) {
      await expect(grid.cell(row, 0)).toHaveClass(/htInvalid/);
    }
  });
});
