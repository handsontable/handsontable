import { test, expect } from '../fixtures/test';
import { FrozenEdgesPage, type FrozenEdges, type TableSection } from '../fixtures/pages/FrozenEdgesPage';

/**
 * A table section (`thead`, `tbody`) carries the `rowgroup` role only while it holds rows. Every overlay
 * clone has both sections, and most clones leave one empty: the top clone's body without frozen top rows,
 * a corner's body, a bottom clone's head. A `rowgroup` with no `row` in it is an invalid structure that
 * a screen reader meets as an empty group, and axe reports as "needs review" (DEV-3652).
 */

const EDGES: FrozenEdges[] = ['none', 'top-start', 'bottom-end', 'all'];

/**
 * The sections that carry the `rowgroup` role without holding a row.
 *
 * @param sections The sections.
 * @returns The offending ones, as `table tag`.
 */
function emptyRowGroups(sections: TableSection[]): string[] {
  return sections.filter(item => item.role === 'rowgroup' && item.rows === 0).map(item => `${item.table} ${item.tag}`);
}

/**
 * The sections that hold rows without carrying the `rowgroup` role.
 *
 * @param sections The sections.
 * @returns The offending ones, as `table tag`.
 */
function unnamedRowGroups(sections: TableSection[]): string[] {
  return sections.filter(item => item.role !== 'rowgroup' && item.rows > 0).map(item => `${item.table} ${item.tag}`);
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

    expect(sections.filter(item => item.tag === 'thead').map(item => [item.rows, item.role])).toEqual(
      sections.filter(item => item.tag === 'thead').map(() => [0, null])
    );
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
