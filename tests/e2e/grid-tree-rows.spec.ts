import { test, expect } from '../fixtures/test';
import { FrozenEdgesPage, type FrozenEdges } from '../fixtures/pages/FrozenEdgesPage';

/**
 * The grid is one tree of rows for assistive technology (DEV-3652). The headers and the frozen panes are
 * drawn by overlay clones, separate tables over the master table, so a cell can be drawn up to four times
 * and a grid row is spread over up to three tables. Exactly one copy of each cell is exposed (the one the
 * user sees, which takes the focus), and each grid row is one row that holds its row header and every
 * cell, in column order.
 */

const EDGES: FrozenEdges[] = ['none', 'top-start', 'bottom-end', 'all'];
const COLUMNS = ['A', 'B', 'C', 'D', 'E'];
// The fixture's grid as a screen reader should meet it: the head row, then each row with its row header.
const FULL_GRID = [
  ['Select whole grid', ...COLUMNS],
  ...[1, 2, 3, 4, 5, 6].map(row => [String(row), ...COLUMNS.map(column => `${column}${row}`)]),
];

test.describe('the grid as one tree of rows', () => {
  let grid: FrozenEdgesPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FrozenEdgesPage(page, theme, bundle);
  });

  for (const edges of EDGES) {
    test(`reads as the grid it shows: every row whole, every cell once (frozen edges: ${edges})`, async() => {
      await grid.goto(edges);

      const tree = await grid.accessibilityTree();

      expect(tree.names).toEqual(FULL_GRID);
      expect(tree.rows[0]).toEqual(['gridcell', ...COLUMNS.map(() => 'columnheader')]);
      expect(tree.rows[1]).toEqual(['rowheader', ...COLUMNS.map(() => 'gridcell')]);
      expect(tree.orphanCells).toBe(0);
      expect(tree.findings).toEqual([]);
    });
  }

  test('a grid without headers reads as its rows of cells', async() => {
    await grid.goto('all', 'off');

    const tree = await grid.accessibilityTree();

    expect(tree.names).toEqual(FULL_GRID.slice(1).map(row => row.slice(1)));
    expect(tree.orphanCells).toBe(0);
    expect(tree.findings).toEqual([]);
  });

  test('stays one tree when the frozen edges and the headers change', async() => {
    await grid.goto('none');
    await grid.updateSettings({ fixedColumnsStart: 2, fixedRowsBottom: 2 });

    await expect.poll(async() => (await grid.accessibilityTree()).names).toEqual(FULL_GRID);

    await grid.updateSettings({ fixedColumnsStart: 0, fixedRowsBottom: 0, fixedRowsTop: 1, fixedColumnsEnd: 2 });

    await expect.poll(async() => (await grid.accessibilityTree()).names).toEqual(FULL_GRID);

    // The row headers go: the master's rows lead, and take the frozen end columns.
    await grid.updateSettings({ rowHeaders: false });

    const tree = await grid.accessibilityTree();

    expect(tree.names).toEqual(FULL_GRID.map(row => row.slice(1)));
    expect(tree.orphanCells).toBe(0);
    expect(tree.findings).toEqual([]);
  });

  test('a cell that keeps its content still changes its owner (renderMode: onChange)', async() => {
    await grid.goto('bottom-end');
    await grid.updateSettings({ renderMode: 'onChange' });
    // Rows 5 and 6 are frozen at the bottom now; row 6 was the only one before the change of the count.
    await grid.updateSettings({ fixedRowsBottom: 2 });

    await expect.poll(async() => (await grid.accessibilityTree()).names).toEqual(FULL_GRID);

    await grid.updateSettings({ fixedRowsBottom: 0, fixedColumnsStart: 2 });

    const tree = await grid.accessibilityTree();

    expect(tree.names).toEqual(FULL_GRID);
    expect(tree.orphanCells).toBe(0);
    expect(tree.findings).toEqual([]);
  });

  test('a scrolled grid reads the rendered rows whole, in order, with the frozen cells', async() => {
    await grid.goto('all');
    await grid.makeScrollableAndScrollTo(200, 30, { row: 120, col: 18 });

    const tree = await grid.accessibilityTree();
    const [head, ...body] = tree.names;

    expect(tree.orphanCells).toBe(0);
    expect(tree.findings).toEqual([]);
    // The head row: the corner, the frozen first column, the rendered columns, the frozen last column.
    expect(head[0]).toBe('Select whole grid');
    expect(head[1]).toBe('A');
    expect(head.at(-1)).toBe('AD');
    // Every row is as long as the head row and holds its own row's cells under the head row's columns.
    expect(body.length).toBeGreaterThan(3);
    for (const row of body) {
      expect(row).toEqual([row[0], ...head.slice(1).map(column => `${column}${row[0]}`)]);
    }
    // The frozen top row first, the frozen bottom row last, the scrolled rows between in order.
    expect(body[0][0]).toBe('1');
    expect(body.at(-1)![0]).toBe('200');
    expect(body.map(row => Number(row[0]))).toEqual([...body.map(row => Number(row[0]))].sort((a, b) => a - b));
    expect(body.map(row => row[0])).toContain('121');
  });

  test('a merged block that crosses a freeze line is one cell, in the row it starts in', async() => {
    await grid.goto('all');
    await grid.updateSettings({
      mergeCells: [{ row: 0, col: 0, rowspan: 2, colspan: 2 }, { row: 3, col: 3, rowspan: 3, colspan: 2 }],
    });

    const tree = await grid.accessibilityTree();

    expect(tree.names).toEqual([
      ['Select whole grid', ...COLUMNS],
      ['1', 'A1', 'C1', 'D1', 'E1'],
      ['2', 'C2', 'D2', 'E2'],
      ['3', 'A3', 'B3', 'C3', 'D3', 'E3'],
      ['4', 'A4', 'B4', 'C4', 'D4'],
      ['5', 'A5', 'B5', 'C5'],
      ['6', 'A6', 'B6', 'C6'],
    ]);
    expect(tree.orphanCells).toBe(0);
  });

  test('the keyboard never puts the focus on a hidden copy of a cell', async({ page }) => {
    await grid.goto('all');
    await grid.selectCell(0, 0);

    const visited: string[] = [];

    // Along the top row across both freeze lines, down the last column across both, and back.
    for (const key of [
      'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight',
      'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowUp',
    ]) {
      await page.keyboard.press(key);

      const focused = await grid.focused();

      expect(focused.hidden, `after ${key} the focus is on ${focused.text}`).toBe(false);
      visited.push(focused.text);
    }

    expect(visited).toEqual(['B1', 'C1', 'D1', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'D6', 'C6', 'B6', 'A6', 'A5']);
  });
});
