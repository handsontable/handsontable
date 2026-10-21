import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { NestedHeadersMouseSelectionPage } from '../fixtures/pages/NestedHeadersMouseSelectionPage';

const FLAT_HEADERS = [['A', 'B', 'C', 'D', 'E']];

const GROUP_HEADERS = [[{ label: 'AB', colspan: 2 }, 'C', 'D', 'E']];

const ROWSPAN_HEADERS = [
  [{ label: 'AB', rowspan: 2, colspan: 2 }, 'C', 'D'],
  ['C2', 'D2'],
];

test.describe('nested header mouse selection', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: NestedHeadersMouseSelectionPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new NestedHeadersMouseSelectionPage(page, theme, bundle);
    await grid.goto();
  });

  test('a Ctrl click on a sortable header focuses the same header as a plain click', async() => {
    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
      navigableHeaders: true,
      multiColumnSorting: true,
    });

    await grid.clickHeader(0, 2);
    const plain = await grid.selection();

    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
      navigableHeaders: true,
      multiColumnSorting: true,
    });
    await grid.clickHeader(0, 0);
    await grid.clickHeader(0, 2, ['ControlOrMeta']);

    const withCtrl = await grid.selection();

    expect(withCtrl.highlight).toEqual(plain.highlight);
    expect(withCtrl.selected).toEqual(plain.selected);
    expect(withCtrl).toEqual({
      selected: [[-1, 2, 9, 2]],
      highlight: { row: -1, col: 2 },
    });
    expect(await grid.sortConfig()).toEqual([
      { column: 0, sortOrder: 'asc' },
      { column: 2, sortOrder: 'asc' },
    ]);
  });

  test('a Ctrl click on a sortable header selects the same columns when headers are not navigable', async() => {
    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
      navigableHeaders: false,
      multiColumnSorting: true,
    });

    await grid.clickHeader(0, 2);
    const plain = await grid.selection();

    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
      navigableHeaders: false,
      multiColumnSorting: true,
    });
    await grid.clickHeader(0, 0);
    await grid.clickHeader(0, 2, ['ControlOrMeta']);

    expect(await grid.selection()).toEqual(plain);
    expect(plain).toEqual({
      selected: [[-1, 2, 9, 2]],
      highlight: { row: 0, col: 2 },
    });
  });

  test('a Ctrl click on a rowspan sortable header keeps the clicked header level', async() => {
    await grid.configure({
      nestedHeaders: ROWSPAN_HEADERS,
      navigableHeaders: true,
      multiColumnSorting: true,
    });

    await grid.clickHeader(0, 0);
    const plain = await grid.selection();

    await grid.configure({
      nestedHeaders: ROWSPAN_HEADERS,
      navigableHeaders: true,
      multiColumnSorting: true,
    });
    await grid.clickHeader(0, 2);
    await grid.clickHeader(0, 0, ['ControlOrMeta']);

    expect(await grid.selection()).toEqual(plain);
    expect(plain).toEqual({
      selected: [[-2, 0, 9, 1]],
      highlight: { row: -2, col: 0 },
    });
  });

  test('a Ctrl click on a rowspan sortable header keeps the clicked level when headers are not navigable', async() => {
    await grid.configure({
      nestedHeaders: ROWSPAN_HEADERS,
      navigableHeaders: false,
      multiColumnSorting: true,
    });

    await grid.clickHeader(0, 0);
    const plain = await grid.selection();

    await grid.configure({
      nestedHeaders: ROWSPAN_HEADERS,
      navigableHeaders: false,
      multiColumnSorting: true,
    });
    await grid.clickHeader(0, 2);
    await grid.clickHeader(0, 0, ['ControlOrMeta']);

    expect(await grid.selection()).toEqual(plain);
    expect(plain).toEqual({
      selected: [[-2, 0, 9, 1]],
      highlight: { row: 0, col: 0 },
    });
  });

  test('a Ctrl click adds another sorted column without selecting that header twice', async() => {
    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
      multiColumnSorting: true,
    });

    await grid.clickHeader(0, 0);
    await grid.clickHeader(0, 2, ['ControlOrMeta']);

    expect((await grid.selection()).selected).toEqual([[-1, 2, 9, 2]]);
    expect(await grid.sortConfig()).toEqual([
      { column: 0, sortOrder: 'asc' },
      { column: 2, sortOrder: 'asc' },
    ]);

    await grid.configure({
      nestedHeaders: GROUP_HEADERS,
      multiColumnSorting: true,
    });

    await grid.clickHeader(0, 2);
    await grid.clickHeader(0, 0, ['ControlOrMeta']);

    expect((await grid.selection()).selected).toEqual([[-1, 0, 9, 1]]);
    expect(await grid.sortConfig()).toEqual([
      { column: 2, sortOrder: 'asc' },
      { column: 0, sortOrder: 'asc' },
    ]);
  });

  test('a Ctrl click on an already selected header adds a layer', async() => {
    await grid.configure({
      nestedHeaders: GROUP_HEADERS,
      navigableHeaders: true,
    });

    await grid.clickHeader(0, 0);
    await grid.clickHeader(0, 0, ['ControlOrMeta']);

    expect(await grid.selection()).toEqual({
      selected: [[-1, 0, 9, 1], [-1, 0, 9, 1]],
      highlight: { row: -1, col: 0 },
    });
  });

  test('a Ctrl click still selects the header span when an earlier hook selects a cell', async() => {
    await grid.configure({
      nestedHeaders: GROUP_HEADERS,
      navigableHeaders: true,
    });
    await grid.selectCellBeforeHeaderSelection();

    await grid.clickHeader(0, 0, ['ControlOrMeta']);

    expect(await grid.selection()).toEqual({
      selected: [[0, 0, 0, 0], [-1, 0, 9, 1]],
      highlight: { row: -1, col: 0 },
    });
  });

  test('a header click leaves focus on the cell an afterOnCellMouseUp hook selects', async() => {
    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
      navigableHeaders: true,
    });
    await grid.selectCellOnHeaderMouseUp();

    await grid.clickHeader(0, 2);

    expect(await grid.selection()).toEqual({
      selected: [[0, 2, 0, 2]],
      highlight: { row: 0, col: 2 },
    });
  });

  test('a drag from a cell into a nested header keeps the cell selection', async() => {
    await grid.configure({
      nestedHeaders: FLAT_HEADERS,
    });

    await grid.dragCellToHeader(0, 0, 0, 0);

    expect((await grid.selection()).selected).toEqual([[0, 0, 0, 0]]);

    await grid.dragCellToHeader(0, 0, 0, 1);

    expect((await grid.selection()).selected).toEqual([[0, 0, 0, 1]]);

    await grid.pressHeaderAndReleaseOutside(0, 0);
    await grid.dragCellToHeader(0, 0, 0, 0);

    expect((await grid.selection()).selected).toEqual([[0, 0, 0, 0]]);
  });
});
