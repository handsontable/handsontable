import { test, expect } from '../fixtures/test';
import { FrozenEdgesPage, type FrozenEdges, type TableSection } from '../fixtures/pages/FrozenEdgesPage';

/**
 * A table section (`thead`, `tbody`) carries the `rowgroup` role only while it holds rows. Every overlay
 * clone has both sections, and most clones leave one empty: the top clone's body without frozen top rows,
 * a top corner's body without frozen top rows, a bottom clone's head. A `rowgroup` with no `row` in it is an invalid structure that
 * a screen reader meets as an empty group, and axe reports as "needs review" (DEV-3652).
 */

const EDGES: FrozenEdges[] = ['none', 'top-start', 'bottom-end', 'all'];

/**
 * The sections that carry the `rowgroup` role, or hold a `row`, without holding a cell.
 *
 * @param sections The sections.
 * @returns The offending ones, as `table tag`.
 */
function emptyRowGroups(sections: TableSection[]): string[] {
  return sections
    .filter(item => item.cells === 0 && (item.role === 'rowgroup' || item.rowRoles > 0))
    .map(item => `${item.table} ${item.tag}`);
}

/**
 * The sections whose rows hold cells without the section being a `rowgroup` of `row` elements.
 *
 * @param sections The sections.
 * @returns The offending ones, as `table tag`.
 */
function unnamedRowGroups(sections: TableSection[]): string[] {
  return sections
    .filter(item => item.cells > 0 && (item.role !== 'rowgroup' || item.rowRoles !== item.rows))
    .map(item => `${item.table} ${item.tag}`);
}

test.describe('the rowgroup role of the table sections', () => {
  let grid: FrozenEdgesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FrozenEdgesPage(page, theme, bundle);
  });

  for (const edges of EDGES) {
    test(`only a section that holds rows is a rowgroup (frozen edges: ${edges})`, async() => {
      await grid.goto(edges);

      const sections = await grid.sections();

      // The control: the shape has sections of both kinds, so neither list below is empty by accident.
      expect(sections.filter(item => item.rows > 0).length).toBeGreaterThan(0);
      expect(sections.filter(item => item.rows === 0).length).toBeGreaterThan(0);

      expect(emptyRowGroups(sections)).toEqual([]);
      expect(unnamedRowGroups(sections)).toEqual([]);
      // What a screen reader gets: no row group without a row in it.
      expect(await grid.ariaSnapshot()).not.toMatch(/^\s*- rowgroup$/m);
    });
  }

  test('a grid without headers has no rowgroup on its empty head sections', async() => {
    await grid.goto('all', 'off');

    const sections = await grid.sections();
    const heads = sections.filter(item => item.tag === 'thead');

    // The control: the page has head sections, so the comparison below is not of two empty lists.
    expect(heads.length).toBeGreaterThan(0);
    expect(heads.map(item => [item.rows, item.role])).toEqual(heads.map(() => [0, null]));
    expect(emptyRowGroups(sections)).toEqual([]);
    expect(unnamedRowGroups(sections)).toEqual([]);
  });

  test('the role follows the rows when frozen rows are turned off and on again', async() => {
    await grid.goto('top-start');

    await expect.poll(() => grid.section('clone_top', 'tbody')).toMatchObject({ rows: 1, role: 'rowgroup' });

    await grid.updateSettings({ fixedRowsTop: 0 });

    await expect.poll(() => grid.section('clone_top', 'tbody')).toMatchObject({ rows: 0, role: null });
    expect(emptyRowGroups(await grid.sections())).toEqual([]);

    await grid.updateSettings({ fixedRowsTop: 2 });

    await expect.poll(() => grid.section('clone_top', 'tbody')).toMatchObject({ rows: 2, role: 'rowgroup' });
    expect(unnamedRowGroups(await grid.sections())).toEqual([]);
  });

  test('the role follows the rows when the column headers are turned off and on again', async() => {
    await grid.goto('none');

    await expect.poll(() => grid.section('clone_top', 'thead')).toMatchObject({ rows: 1, role: 'rowgroup' });

    await grid.updateSettings({ colHeaders: false });

    expect(emptyRowGroups(await grid.sections())).toEqual([]);
    expect((await grid.sections()).filter(item => item.tag === 'thead' && item.role === 'rowgroup')).toEqual([]);

    await grid.updateSettings({ colHeaders: true });

    await expect.poll(() => grid.section('clone_top', 'thead')).toMatchObject({ rows: 1, role: 'rowgroup' });
    expect(unnamedRowGroups(await grid.sections())).toEqual([]);
  });

  test('a side clone that is turned off leaves no row group and no row without cells', async() => {
    await grid.goto('all');

    // The row headers and the frozen columns go: the start and end clones are drawn one last time with
    // the master's rows and none of their columns.
    await grid.updateSettings({ rowHeaders: false, fixedColumnsStart: 0, fixedColumnsEnd: 0 });

    const sections = await grid.sections();

    // The control: the side clones still hold their rows, now without a cell.
    expect(sections.filter(item => item.table === 'clone_inline_start' && item.rows > 0 && item.cells === 0))
      .not.toEqual([]);
    expect(sections.filter(item => item.table === 'clone_inline_end' && item.rows > 0 && item.cells === 0))
      .not.toEqual([]);
    expect(emptyRowGroups(sections)).toEqual([]);
    expect(unnamedRowGroups(sections)).toEqual([]);
    // The row index goes with the `row` role.
    expect(sections.filter(item => item.cells === 0 && item.rowIndexes > 0)).toEqual([]);

    // The clones come back with their cells, and with the roles.
    await grid.updateSettings({ rowHeaders: true, fixedColumnsStart: 1, fixedColumnsEnd: 1 });

    await expect.poll(() => grid.section('clone_inline_start', 'tbody'))
      .toMatchObject({ rows: 6, rowRoles: 6, rowIndexes: 6, role: 'rowgroup' });
    await expect.poll(() => grid.section('clone_inline_end', 'tbody'))
      .toMatchObject({ rows: 6, rowRoles: 6, rowIndexes: 6, role: 'rowgroup' });
    expect(emptyRowGroups(await grid.sections())).toEqual([]);
    expect(unnamedRowGroups(await grid.sections())).toEqual([]);
  });

  test('the body loses the role when the grid has no rows, and gets it back with them', async() => {
    await grid.goto('none');

    await expect.poll(() => grid.section('master', 'tbody')).toMatchObject({ rows: 6, role: 'rowgroup' });

    await grid.loadData([]);

    await expect.poll(() => grid.section('master', 'tbody')).toMatchObject({ rows: 0, role: null });
    expect(emptyRowGroups(await grid.sections())).toEqual([]);

    await grid.loadData([['a', 'b'], ['c', 'd']]);

    await expect.poll(() => grid.section('master', 'tbody')).toMatchObject({ rows: 2, role: 'rowgroup' });
    expect(unnamedRowGroups(await grid.sections())).toEqual([]);
  });
});
