import { test, expect, THEMES_TAG } from '../fixtures/test';
import { SheetsBarPluginLeftoversPage } from '../fixtures/pages/SheetsBarPluginLeftoversPage';

/**
 * A three-line column header made the header row tall, and it stayed tall after the headers went
 * back to one line: the drawn height was written onto the first header cell, measured back from
 * there on the next draw, and never cleared. So a sheet with multi-line headers left the header row
 * tall on every later sheet, and on a plain grid neither `updateSettings()` nor `render()` brought it
 * back.
 */
test.describe('column header height after multi-line headers', { tag: THEMES_TAG }, () => {
  let grid: SheetsBarPluginLeftoversPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SheetsBarPluginLeftoversPage(page, theme, bundle);
  });

  test('a sheet after the tall-header sheet draws its header at single-line height', async() => {
    await grid.goto('tall-header-workbook');

    const single = await grid.headerRowHeights();

    expect(single.master).toBeGreaterThan(0);

    await grid.switchToSheet(1);
    await expect.poll(async() => (await grid.headerRowHeights()).top).toBeGreaterThan(single.top + 10);

    await grid.switchToSheet(2);
    await expect.poll(() => grid.headerRowHeights()).toEqual(single);

    await grid.switchToSheet(0);
    await expect.poll(() => grid.headerRowHeights()).toEqual(single);
  });

  test('a plain grid draws a single-line header at its height again after multi-line headers', async() => {
    await grid.goto('tall-header-plain');

    const single = await grid.headerRowHeights();

    await grid.setColHeaders(['A<br>B<br>C', 'y', 'z']);
    await expect.poll(async() => (await grid.headerRowHeights()).top).toBeGreaterThan(single.top + 10);

    await grid.setColHeaders(['x', 'y', 'z']);
    await expect.poll(() => grid.headerRowHeights()).toEqual(single);

    await grid.render();
    await expect.poll(() => grid.headerRowHeights()).toEqual(single);
  });
});
