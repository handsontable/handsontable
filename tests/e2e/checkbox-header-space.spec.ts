import { test, expect } from '../fixtures/test';
import { CheckboxHeaderSpacePage } from '../fixtures/pages/CheckboxHeaderSpacePage';

/**
 * DEV-928: with `navigableHeaders`, selecting a column or row header selects its cells but parks the
 * focus on the header, and Space did nothing there. It toggles the selected checkboxes from a header
 * selection as it does from a cell selection. A lone header cell holds no cell, so Space leaves the data
 * alone there.
 */
test.describe('Space on a selected header with navigableHeaders', () => {
  const INITIAL = [
    ['a', true, false],
    ['b', false, true],
    ['c', true, true],
    ['d', false, false],
  ];

  test('toggles the checkboxes of a column selected by its header, and back', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).click();
    await page.keyboard.press('Space');

    // Mixed column: the toggle writes the checked template to every box, and the text column is untouched.
    await expect.poll(() => grid.data()).toEqual([
      ['a', true, false],
      ['b', true, true],
      ['c', true, true],
      ['d', true, false],
    ]);

    await page.keyboard.press('Space');

    await expect.poll(() => grid.data()).toEqual([
      ['a', false, false],
      ['b', false, true],
      ['c', false, true],
      ['d', false, false],
    ]);
  });

  test('toggles the checkboxes of a row selected by its header', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.rowHeader(0).click();
    await page.keyboard.press('Space');

    // Row 0 holds true and false, a mixed state, so both boxes end up checked.
    await expect.poll(() => grid.data()).toEqual([
      ['a', true, true],
      ['b', false, true],
      ['c', true, true],
      ['d', false, false],
    ]);
  });

  test('toggles every checkbox column of a header range selected with Shift+click', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).click();
    await grid.columnHeader(2).click({ modifiers: ['Shift'] });
    await page.keyboard.press('Space');

    await expect.poll(() => grid.data()).toEqual([
      ['a', true, true],
      ['b', true, true],
      ['c', true, true],
      ['d', true, true],
    ]);
  });

  test('toggles every checkbox of the grid after a corner click', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.corner().click();
    await page.keyboard.press('Space');

    await expect.poll(() => grid.data()).toEqual([
      ['a', true, true],
      ['b', true, true],
      ['c', true, true],
      ['d', true, true],
    ]);
  });

  test('toggles the checkboxes of two columns selected by Ctrl+clicking their headers', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.columnHeader(1).click();
    await grid.columnHeader(2).click({ modifiers: ['ControlOrMeta'] });

    expect(await grid.focus()).toEqual({ row: -1, col: 2, layers: 2 });

    await page.keyboard.press('Space');

    await expect.poll(() => grid.data()).toEqual([
      ['a', true, true],
      ['b', true, true],
      ['c', true, true],
      ['d', true, true],
    ]);
  });

  for (const key of ['Space', 'Delete']) {
    test(`leaves the cell under a leftover header-cell layer alone on ${key}`, async({ page, theme, bundle }) => {
      const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

      await grid.goto();
      // The first layer is the header cell above the checkbox column, reached with the keyboard.
      await grid.cell(1, 0).click();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowRight');

      expect(await grid.focus()).toEqual({ row: -1, col: 1, layers: 1 });

      // The second layer, and the focus, is a text cell.
      await grid.cell(2, 0).click({ modifiers: ['ControlOrMeta'] });
      await grid.countChanges();
      await grid.countSpaceShortcutCalls();
      await page.keyboard.press(key);

      // The selection holds no checkbox, so the key writes nothing to one: the header cell's layer is not a cell.
      expect(await grid.data()).toEqual(key === 'Space' ? INITIAL : INITIAL.map(row => row.map((value, col) => (
        row[0] === 'c' && col === 0 ? null : value))));
      // Space is not consumed, so a shortcut registered after the checkbox one still receives it.
      expect(await grid.spaceShortcutCalls()).toBe(key === 'Space' ? 1 : 0);
    });
  }

  test('leaves a header-selected text column alone and opens no editor', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.countChanges();
    await grid.columnHeader(0).click();
    await page.keyboard.press('Space');

    await expect(page.locator('.handsontableInput')).toBeHidden();
    expect(await grid.changeCount()).toBe(0);
    expect(await grid.data()).toEqual(INITIAL);
  });

  test('writes nothing when only a header cell is selected', async({ page, theme, bundle }) => {
    const grid = new CheckboxHeaderSpacePage(page, theme, bundle);

    await grid.goto();
    await grid.countChanges();
    await grid.selectCell(-1, 1);
    await page.keyboard.press('Space');

    // A header cell holds no checkbox, so the grid writes nothing for the key.
    expect(await grid.changeCount()).toBe(0);
    expect(await grid.data()).toEqual(INITIAL);
  });
});
