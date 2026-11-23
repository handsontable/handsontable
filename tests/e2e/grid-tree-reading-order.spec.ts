import { test, expect } from '../fixtures/test';
import { FrozenEdgesPage, type FrozenEdges } from '../fixtures/pages/FrozenEdgesPage';

/**
 * The grid's root lists its row groups in reading order (`aria-owns`): the column headers, the frozen top
 * rows, the rows between, the frozen bottom rows. The headers and the frozen rows are drawn by overlay
 * clones that follow the master table in the DOM, so without the list a screen reader reads the data
 * before the headers that label it (DEV-3652).
 */

const HEADS = ['top_inline_start_corner head', 'top head', 'top_inline_end_corner head'];
const TOP = ['top_inline_start_corner body', 'top body', 'top_inline_end_corner body'];
const MIDDLE = ['inline_start body', 'master body', 'inline_end body'];
const BOTTOM = ['bottom_inline_start_corner body', 'bottom body', 'bottom_inline_end_corner body'];

// The row groups each shape lists, by the clones it builds and the sections that hold rows in them.
const EXPECTED: Record<FrozenEdges, string[]> = {
  none: [HEADS[0], HEADS[1], MIDDLE[0], MIDDLE[1]],
  'top-start': [HEADS[0], HEADS[1], TOP[0], TOP[1], MIDDLE[0], MIDDLE[1]],
  'bottom-end': [...HEADS, ...MIDDLE, ...BOTTOM],
  all: [...HEADS, ...TOP, ...MIDDLE, ...BOTTOM],
};

test.describe('the reading order of the grid\'s row groups', () => {
  let grid: FrozenEdgesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FrozenEdgesPage(page, theme, bundle);
  });

  for (const edges of Object.keys(EXPECTED) as FrozenEdges[]) {
    test(`the root lists the row groups headers first (frozen edges: ${edges})`, async() => {
      await grid.goto(edges);

      const owned = await grid.ownedRowGroups();

      expect(owned.map(item => item.name)).toEqual(EXPECTED[edges]);
      // Every listed id names a row group that holds rows.
      expect(owned.filter(item => item.role !== 'rowgroup' || item.rows === 0)).toEqual([]);

      const tree = await grid.accessibilityTree();

      // What a screen reader gets: the column headers before any data row. In the DOM the master table,
      // which holds the data rows, comes first. A data row holds grid cells and no column header; the
      // corner clone's own head row, the corner cell alone, is no data row.
      const firstHeaderRow = tree.rows.findIndex(row => row.includes('columnheader'));
      const firstDataRow = tree.rows.findIndex(
        row => !row.includes('columnheader') && row.filter(role => role === 'gridcell').length > 1
      );

      expect(firstHeaderRow).toBeGreaterThan(-1);
      expect(firstDataRow).toBeGreaterThan(firstHeaderRow);
      expect(tree.findings).not.toContain('headers-after-data');
    });
  }

  test('a grid without headers lists its body row groups only', async() => {
    await grid.goto('top-start', 'off');

    const owned = await grid.ownedRowGroups();

    expect(owned.map(item => item.name)).toEqual([TOP[0], TOP[1], MIDDLE[0], MIDDLE[1]]);
    expect(owned.filter(item => item.role !== 'rowgroup' || item.rows === 0)).toEqual([]);
  });

  test('the list follows the row groups when the rows and the frozen rows change', async() => {
    await grid.goto('none');

    await expect.poll(async() => (await grid.ownedRowGroups()).map(item => item.name)).toEqual(EXPECTED.none);

    await grid.updateSettings({ fixedRowsTop: 1 });

    await expect.poll(async() => (await grid.ownedRowGroups()).map(item => item.name))
      .toEqual([HEADS[0], HEADS[1], TOP[0], TOP[1], MIDDLE[0], MIDDLE[1]]);

    await grid.loadData([]);

    // No rows: only the head row groups are left.
    await expect.poll(async() => (await grid.ownedRowGroups()).map(item => item.name)).toEqual([HEADS[0], HEADS[1]]);

    await grid.updateSettings({ colHeaders: false, rowHeaders: false });

    // No row group at all: the attribute goes.
    await expect.poll(() => grid.rootOwns()).toBeNull();
  });

  test('a side clone that is turned off leaves the list', async() => {
    await grid.goto('all');
    await grid.updateSettings({ rowHeaders: false, fixedColumnsStart: 0, fixedColumnsEnd: 0 });

    // The start and end clones keep their rows, now without cells: they are no row groups any more.
    await expect.poll(async() => (await grid.ownedRowGroups()).map(item => item.name))
      .toEqual([HEADS[1], TOP[1], MIDDLE[1], BOTTOM[1]]);

    const tree = await grid.accessibilityTree();

    expect(tree.rows.filter(row => row.length === 0)).toEqual([]);
    expect(tree.findings).not.toContain('headers-after-data');
  });

  test('a grid that writes no accessibility attributes lists nothing', async() => {
    await grid.goto('all', 'on', 'off');

    expect(await grid.rootOwns()).toBeNull();
    // The control: the same shape with the attributes on lists its row groups.
    await grid.goto('all');
    expect(await grid.rootOwns()).not.toBeNull();
  });
});
