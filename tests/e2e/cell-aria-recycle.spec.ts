import { test, expect } from '../fixtures/test';
import { CellAriaRecyclePage } from '../fixtures/pages/CellAriaRecyclePage';

const DEFAULT_COLUMN_B = {
  role: 'gridcell',
  tabindex: '-1',
  'aria-colindex': '3',
};

/**
 * The grid recycles its cell and header elements: a scroll repaints the same TD and TH with other rows
 * and columns. A renderer may give a cell accessibility attributes of its own, and the element must not
 * carry them onto the next cell it shows. The fixture's column B renderer gives rows 0-19 a `checkbox`
 * role, `aria-checked`, its own `aria-describedby`, a stray `aria-x` and a `data-role`; every other row
 * is plain text. Column C records what each cell carried when its renderer started.
 */
test.describe('accessibility attributes on recycled cells and headers', () => {
  let grid: CellAriaRecyclePage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CellAriaRecyclePage(page, theme, bundle);
  });

  test('a recycled cell that showed a custom-rendered row ends with the default attributes only', async() => {
    await grid.goto();

    expect((await grid.columnCells(1)).filter(cell => cell.customPainted).length).toBeGreaterThan(0);

    await grid.scrollToRow(150);

    // Only elements the custom branch painted before, now showing a plain row: the recycle case itself.
    const recycled = (await grid.columnCells(1)).filter(cell => cell.customPainted && cell.row >= 20);

    expect(recycled.length).toBeGreaterThan(0);

    recycled.forEach((cell) => {
      const { 'aria-describedby': describedBy, ...rest } = cell.attributes;

      expect(rest, `row ${cell.row}`).toEqual(DEFAULT_COLUMN_B);
      expect(describedBy, `row ${cell.row}`).toBeTruthy();
      expect(cell.describedBy, `row ${cell.row}`).toEqual({ count: 1, text: 'B' });
    });
  });

  test('a renderer-set role and description win, also on an element recycled from a plain row', async() => {
    await grid.goto();
    await grid.scrollToRow(150);

    // The elements that show plain rows now are the ones the custom rows get back after the scroll.
    expect((await grid.columnCells(1)).every(cell => cell.row >= 20)).toBe(true);

    await grid.scrollToRow(0);

    const custom = (await grid.columnCells(1)).filter(cell => cell.row < 20);

    expect(custom.length).toBeGreaterThan(0);

    custom.forEach((cell) => {
      expect(cell.attributes, `row ${cell.row}`).toEqual({
        role: 'checkbox',
        tabindex: '-1',
        'aria-checked': 'true',
        'aria-colindex': '3',
        'aria-describedby': 'custom-description',
        'aria-x': 'stray',
        'data-role': 'custom',
      });
    });
  });

  test('a cell renderer starts from the same attributes on a new and on a recycled element', async() => {
    await grid.goto();

    const onNewElements = await grid.takeEntryStates();

    await grid.scrollToRow(150);
    await grid.scrollToColumn(30);
    await grid.scrollToColumn(0);
    await grid.scrollToRow(0);

    const onRecycledElements = await grid.takeEntryStates();
    const { idPrefix } = await grid.masterColumnHeaders();
    const expected = {
      role: 'gridcell',
      tabindex: '-1',
      'aria-colindex': '4',
      'aria-describedby': `${idPrefix}2`,
    };

    expect(onNewElements.length).toBeGreaterThan(0);
    expect(onRecycledElements.length).toBeGreaterThan(0);
    [...onNewElements, ...onRecycledElements].forEach((state) => {
      expect(state.attributes, `row ${state.row}`).toEqual(expected);
    });
  });

  test('a redraw and a vertical scroll write no accessibility attribute that already holds its value', async() => {
    await grid.goto();
    await grid.startAriaMutationCounter();
    await grid.render();
    await grid.scrollToRow(150);

    expect(await grid.takeAriaMutations()).toEqual([]);

    // Positive control: a horizontal scroll moves every element to another column, so the attributes that
    // follow the column are written.
    await grid.startAriaMutationCounter();
    await grid.scrollToColumn(30);

    const horizontal = await grid.takeAriaMutations();

    expect(horizontal.some(mutation => mutation.tag === 'TD' && mutation.attribute === 'aria-colindex')).toBe(true);
    expect(horizontal.some(mutation => mutation.tag === 'TH' && mutation.attribute === 'aria-colindex')).toBe(true);
  });

  test('a plain cell that was never custom-rendered keeps its column header reference after a scroll', async() => {
    await grid.goto();
    await grid.scrollToRow(150);
    await grid.scrollToRow(60);

    const plain = (await grid.columnCells(1)).filter(cell => cell.row >= 20);

    expect(plain.length).toBeGreaterThan(0);

    plain.forEach((cell) => {
      const { 'aria-describedby': describedBy, ...rest } = cell.attributes;

      expect(rest, `row ${cell.row}`).toEqual(DEFAULT_COLUMN_B);
      expect(describedBy, `row ${cell.row}`).toBeTruthy();
      expect(cell.describedBy, `row ${cell.row}`).toEqual({ count: 1, text: 'B' });
    });
  });

  test('recycled column headers, the corner and the row headers keep their attributes after a scroll', async() => {
    await grid.goto();
    await grid.scrollToColumn(40);
    await grid.scrollToRow(150);

    const { idPrefix, headers } = await grid.masterColumnHeaders();

    expect(headers.some(header => header.column >= 40)).toBe(true);

    headers.forEach((header) => {
      expect(header.attributes, header.label).toEqual({
        role: 'columnheader',
        scope: 'col',
        tabindex: '-1',
        'aria-colindex': String(header.column + 2),
        // The master owns every non-frozen column's id.
        id: `${idPrefix}${header.column}`,
      });
    });

    const { corner, rowHeaders } = await grid.cornerAndRowHeaders();

    expect(corner).toEqual({
      role: 'gridcell',
      tabindex: '-1',
      'aria-colindex': '1',
    });
    expect(rowHeaders.length).toBeGreaterThan(0);
    rowHeaders.forEach((attributes) => {
      expect(attributes).toEqual({
        role: 'rowheader',
        scope: 'row',
        tabindex: '-1',
        'aria-colindex': '1',
      });
    });
  });

  test('a header element reused as the corner carries the corner attributes only', async() => {
    await grid.goto();
    // Without row headers, the element in the corner slot is column A's header.
    await grid.updateSettings({ rowHeaders: false });

    expect((await grid.masterCorner())?.role).toBe('columnheader');

    await grid.updateSettings({ rowHeaders: true });

    expect(await grid.masterCorner()).toEqual({
      role: 'gridcell',
      tabindex: '-1',
      'aria-colindex': '1',
    });
  });

  test('a header that stops owning its column id loses it', async() => {
    await grid.goto();

    const before = await grid.columnHeaderReferences();

    expect(before.duplicateIds).toEqual([]);

    // Columns A and B move to the inline-start overlay, which then owns their ids. The master still
    // renders them at scroll offset 0 and must drop the ids its headers carried.
    await grid.updateSettings({ fixedColumnsStart: 2 });

    const after = await grid.columnHeaderReferences();

    expect(after.references).toBeGreaterThan(0);
    expect(after.duplicateIds).toEqual([]);
    expect(after.unresolved.filter(id => id !== 'custom-description')).toEqual([]);
  });

  test('a draw runs the afterGetRowHeaderRenderers hook fewer times than it paints cells', async() => {
    await grid.goto();

    // The cell renderer used to read the row header count once per painted cell; it now reads it once
    // per draw of each table.
    const { hookCalls, masterCells } = await grid.countRowHeaderRenderersHookCalls();

    expect(masterCells).toBeGreaterThan(50);
    expect(hookCalls).toBeGreaterThan(0);
    expect(hookCalls).toBeLessThan(masterCells);
  });

  test('with ariaTags off, no recycled cell or header keeps an accessibility attribute a renderer set', async() => {
    await grid.goto({ ariaTags: false });

    expect((await grid.columnCells(1)).filter(cell => cell.customPainted).length).toBeGreaterThan(0);
    // The header renderer gives columns A-C attributes of their own; those elements show other columns later.
    expect(await grid.ariaAttributeNamesAnywhere('thead th')).toEqual(['aria-x', 'data-role']);

    await grid.scrollToRow(150);

    expect((await grid.columnCells(1)).filter(cell => cell.customPainted && cell.row >= 20).length)
      .toBeGreaterThan(0);

    await grid.scrollToColumn(40);

    expect(await grid.ariaAttributeNamesAnywhere()).toEqual([]);
  });
});
