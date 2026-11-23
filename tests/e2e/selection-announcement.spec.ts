import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SelectionAnnouncementPage } from '../fixtures/pages/SelectionAnnouncementPage';

/**
 * A selection the user makes is announced once through the polite live region: a range by its two
 * corners, a whole row, column, or grid by what it covers, and a layer added with Ctrl/Cmd by its
 * fragment and the layer count. Keyboard selections are announced once, after the key presses stop;
 * a mouse selection once, on release. A single cell, a selection made through the API, a grid built
 * with `ariaTags: false`, and the context menu's own navigation announce nothing.
 *
 * The clock is frozen for every test, so "exactly one" and "none" are read from the full log after
 * the pending timers have run. Fixture data is a 10 x 6 grid; cell (row, col) holds e.g. `B2`.
 */
const SETTLE_MS = 1000;
const BEFORE_DEBOUNCE_MS = 100;

test.describe('Selection announcements', () => {
  let grid: SelectionAnnouncementPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SelectionAnnouncementPage(page, theme, bundle);
  });

  /**
   * Opens the fixture, starts the announcement log, and freezes the clock.
   *
   * @param {Parameters<SelectionAnnouncementPage['goto']>[0]} options The fixture's query options.
   */
  async function open(options: Parameters<SelectionAnnouncementPage['goto']>[0] = {}): Promise<void> {
    await grid.goto(options);
    await grid.recordAnnouncements();
    await grid.freezeTime();
  }

  test('Shift+ArrowRight pressed twice announces the range once, after the presses stop',
    { tag: CROSS_BROWSER_TAG }, async({ page }) => {
      await open();
      await grid.cell(1, 1).click();

      await page.keyboard.press('Shift+ArrowRight');
      await grid.advance(BEFORE_DEBOUNCE_MS);
      await page.keyboard.press('Shift+ArrowRight');
      await grid.advance(BEFORE_DEBOUNCE_MS);
      expect(await grid.announcements()).toEqual([]);

      await grid.advance(SETTLE_MS);
      expect(await grid.selected()).toEqual([[1, 1, 1, 3]]);
      expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column D, row 2']);
    });

  test('a mouse drag announces nothing while the button is held and the range once on release',
    { tag: CROSS_BROWSER_TAG }, async() => {
      await open();

      await grid.pressAndDrag(grid.cell(1, 1), grid.cell(3, 2));
      await grid.advance(SETTLE_MS);
      expect(await grid.selected()).toEqual([[1, 1, 3, 2]]);
      expect(await grid.announcements()).toEqual([]);

      await grid.release();
      await grid.advance(SETTLE_MS);
      expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column C, row 4']);
    });

  test('Ctrl/Cmd+A and the corner click announce all cells', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open();
    await grid.cell(1, 1).click();

    await page.keyboard.press('ControlOrMeta+A');
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['All cells selected']);

    await grid.cell(2, 2).click();
    await grid.corner().click();
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['All cells selected', 'All cells selected']);
  });

  test('a column header click and Shift+click announce the columns', { tag: CROSS_BROWSER_TAG }, async() => {
    await open();

    await grid.columnHeader(0).click();
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Column A selected']);

    await grid.columnHeader(2).click({ modifiers: ['Shift'] });
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Column A selected', 'Columns A to C selected']);
  });

  test('a row header click and Shift+click announce the rows', { tag: CROSS_BROWSER_TAG }, async() => {
    await open();

    await grid.rowHeader(4).click();
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Row 5 selected']);

    await grid.rowHeader(8).click({ modifiers: ['Shift'] });
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Row 5 selected', 'Rows 5 to 9 selected']);
  });

  test('Shift+Space announces the row and Ctrl+Space the column', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open();
    await grid.cell(4, 2).click();

    await page.keyboard.press('Shift+Space');
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Row 5 selected']);

    await grid.cell(2, 1).click();
    await page.keyboard.press('Control+Space');
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Row 5 selected', 'Column B selected']);
  });

  test('a layer added with Ctrl/Cmd announces its fragment and the layer count',
    { tag: CROSS_BROWSER_TAG }, async() => {
      await open();

      await grid.drag(grid.cell(1, 1), grid.cell(2, 2));
      await grid.advance(SETTLE_MS);
      expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column C, row 3']);

      await grid.cell(3, 3).click({ modifiers: ['ControlOrMeta'] });
      await grid.advance(SETTLE_MS);
      expect((await grid.announcements()).slice(1)).toEqual(['Selection added: column D, row 4. 2 selections']);

      await grid.dragAddingLayer(grid.cell(5, 1), grid.cell(7, 2));
      await grid.advance(SETTLE_MS);
      expect(await grid.selected()).toEqual([[1, 1, 2, 2], [3, 3, 3, 3], [5, 1, 7, 2]]);
      expect((await grid.announcements()).slice(2))
        .toEqual(['Selection added: column B, row 6 to column C, row 8. 3 selections']);
    });

  test('a click on one cell and an arrow move announce nothing', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open();

    await grid.cell(1, 1).click();
    await page.keyboard.press('ArrowDown');
    await grid.advance(SETTLE_MS);

    expect(await grid.selected()).toEqual([[2, 1, 2, 1]]);
    expect(await grid.announcements()).toEqual([]);
  });

  test('a range shrunk back to one cell announces nothing more', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open();
    await grid.cell(1, 1).click();

    await page.keyboard.press('Shift+ArrowRight');
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column C, row 2']);

    await page.keyboard.press('Shift+ArrowLeft');
    await grid.advance(SETTLE_MS);
    expect(await grid.selected()).toEqual([[1, 1, 1, 1]]);
    expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column C, row 2']);
  });

  test('custom column headers name the columns', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open({ headers: 'custom' });
    await grid.cell(0, 0).click();

    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await grid.advance(SETTLE_MS);

    expect(await grid.announcements()).toEqual(['Selection from column Name, row 1 to column Total, row 1']);
  });

  test('a grid built with ariaTags off announces nothing', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open({ aria: 'off' });
    await grid.cell(1, 1).click();

    await page.keyboard.press('Shift+ArrowRight');
    await grid.columnHeader(0).click();
    await grid.advance(SETTLE_MS);

    expect(await grid.selected()).toEqual([[-1, 0, 9, 0]]);
    expect(await grid.announcements()).toEqual([]);
  });

  test('a range the grid deselects before the delay ends is not announced', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open();
    await grid.cell(1, 1).click();

    await page.keyboard.press('Shift+ArrowRight');
    await grid.advance(BEFORE_DEBOUNCE_MS);
    await grid.outside().click();
    await grid.advance(SETTLE_MS);
    expect(await grid.selected()).toEqual([]);
    expect(await grid.announcements()).toEqual([]);

    await grid.cell(2, 1).click();
    await page.keyboard.press('Shift+ArrowRight');
    await grid.advance(SETTLE_MS);
    expect(await grid.announcements()).toEqual(['Selection from column B, row 3 to column C, row 3']);
  });

  test('a layer added with Ctrl/Cmd and then extended with Shift+Arrow announces the range, not another layer',
    { tag: CROSS_BROWSER_TAG }, async({ page }) => {
      await open();

      await grid.drag(grid.cell(1, 1), grid.cell(2, 2));
      await grid.advance(SETTLE_MS);
      await grid.cell(3, 3).click({ modifiers: ['ControlOrMeta'] });
      await grid.advance(SETTLE_MS);
      expect((await grid.announcements()).slice(1)).toEqual(['Selection added: column D, row 4. 2 selections']);

      await page.keyboard.press('Shift+ArrowRight');
      await grid.advance(SETTLE_MS);
      expect(await grid.selected()).toEqual([[1, 1, 2, 2], [3, 3, 3, 4]]);
      expect((await grid.announcements()).slice(2)).toEqual(['Selection from column D, row 4 to column E, row 4']);
    });

  test('column headers selected in a grid with no rows announce the columns', { tag: CROSS_BROWSER_TAG }, async() => {
    await open({ data: 'empty' });

    await grid.columnHeader(0).click();
    await grid.advance(SETTLE_MS);
    await grid.columnHeader(2).click({ modifiers: ['Shift'] });
    await grid.advance(SETTLE_MS);

    expect((await grid.announcements()).at(-1)).toBe('Columns A to C selected');
  });

  test('a row header click on a nested row announces the row once, and no level', { tag: CROSS_BROWSER_TAG }, async() => {
    await open({ plugin: 'nestedRows' });

    await grid.rowHeader(2).click();
    await grid.advance(SETTLE_MS);

    const log = await grid.announcements();

    expect(log).toEqual(['Row 3 selected']);
    expect(log.filter(text => text.startsWith('Level '))).toEqual([]);
  });

  test('an announcement of another grid in the middle of a key sequence does not silence the range',
    { tag: CROSS_BROWSER_TAG }, async({ page }) => {
      await open({ companion: 'pagination' });
      await grid.cell(1, 1).click();

      await page.keyboard.press('Shift+ArrowDown');
      await grid.advance(SETTLE_MS);
      expect(await grid.announcements()).toEqual(['Selection from column B, row 2 to column B, row 3']);

      await grid.cell(1, 1).click();
      await page.keyboard.press('Shift+ArrowRight');
      await grid.advance(BEFORE_DEBOUNCE_MS);
      await grid.turnCompanionPage(2);
      await page.keyboard.press('Shift+ArrowRight');
      await grid.advance(SETTLE_MS);

      await expect(grid.assertiveAnnouncer()).toHaveText('Page 2 of 3');
      expect(await grid.selected()).toEqual([[1, 1, 1, 3]]);
      expect((await grid.announcements()).at(-1)).toBe('Selection from column B, row 2 to column D, row 2');
    });

  test('a selection made through the API announces nothing', async() => {
    await open();

    await grid.selectThroughApi('cells');
    await grid.advance(SETTLE_MS);
    expect(await grid.selected()).toEqual([[1, 1, 3, 3]]);

    await grid.selectThroughApi('all');
    await grid.advance(SETTLE_MS);
    expect(await grid.selected()).toEqual([[-1, -1, 9, 5]]);

    expect(await grid.announcements()).toEqual([]);
  });

  test('a header click on a sortable column announces the sort, not the column', { tag: CROSS_BROWSER_TAG }, async() => {
    await open({ plugin: 'columnSorting' });

    await grid.columnHeader(0).click();
    await grid.advance(SETTLE_MS);

    expect(await grid.announcements()).toEqual(['Sorted by A, ascending']);
  });

  test('navigating the context menu with arrows announces no selection', { tag: CROSS_BROWSER_TAG }, async({ page }) => {
    await open({ plugin: 'contextMenu' });

    await grid.cell(1, 1).click({ button: 'right' });
    await expect(grid.contextMenu()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await grid.advance(SETTLE_MS);

    expect(await grid.contextMenuHighlightedRow()).toBeGreaterThan(0);
    expect((await grid.announcements()).filter(text => text.startsWith('Selection') || text.includes('selected')))
      .toEqual([]);
  });
});
