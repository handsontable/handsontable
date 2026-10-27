import { test, expect, THEMES_TAG } from '../fixtures/test';
import { EditorRowHeaderBorderPage, type GridName } from '../fixtures/pages/EditorRowHeaderBorderPage';

const ON_THE_CELL_EDGE = { start: 0, width: 0 };
const COVERS_THE_GRIDLINE = { start: 1, width: 1 };

/**
 * The editor covers the gridline its inline-start neighbor draws, by starting 1px before the cell.
 * That pixel is no use, and is not even shown, when the cell draws a start border of its own or when
 * an inline-start overlay is painted over it: the master table's editor holder sits under the overlay,
 * so an editor that reached into the overlay's last pixel would show 1px of its 2px start border.
 * Those cells have to sit exactly on the cell's start edge and be exactly as wide as the cell:
 *
 *  - column A behind the row headers, with or without a frozen column;
 *  - the first column the master table draws after an overlay: the first visible column of a scrolled
 *    grid, and the first one past `fixedColumnsStart`.
 *
 * Every other cell keeps the overlap.
 */
test.describe('Editor start edge behind the row headers', { tag: THEMES_TAG }, () => {
  let grid: EditorRowHeaderBorderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorRowHeaderBorderPage(page, theme, bundle);
    await grid.goto();
  });

  const BEHIND_ROW_HEADER: GridName[] = ['row-headers', 'frozen', 'rtl'];

  for (const name of BEHIND_ROW_HEADER) {
    test(`column A editor sits on the cell edge on the first row (${name})`, async() => {
      await grid.openEditor(name, 0, 0);

      await expect.poll(() => grid.overhang(name)).toEqual(ON_THE_CELL_EDGE);
    });

    test(`column A editor sits on the cell edge below the first row (${name})`, async() => {
      await grid.openEditor(name, 3, 0);

      await expect.poll(() => grid.overhang(name)).toEqual(ON_THE_CELL_EDGE);
    });
  }

  // These guard against a fix that drops the overlap for every cell of a grid with row headers.
  for (const name of BEHIND_ROW_HEADER) {
    test(`column B editor still covers the gridline on its start side (${name})`, async() => {
      await grid.openEditor(name, 0, 1);

      await expect.poll(() => grid.overhang(name)).toEqual(COVERS_THE_GRIDLINE);
    });
  }

  test('the first master column past the frozen columns sits on the cell edge', async() => {
    await grid.openEditor('frozen', 0, 2);

    // The cell is in the master table: its holder is under the frozen clone, which ends at its edge.
    expect(await grid.editedCellStandsBehindRowHeader('frozen')).toBe(false);
    await expect.poll(() => grid.overhang('frozen')).toEqual(ON_THE_CELL_EDGE);
  });

  test('the next master column keeps the overlap', async() => {
    await grid.openEditor('frozen', 0, 3);

    await expect.poll(() => grid.overhang('frozen')).toEqual(COVERS_THE_GRIDLINE);
  });

  test('the first visible column of a scrolled grid sits on the cell edge', async() => {
    const column = await grid.scrollToFirstVisibleColumn('row-headers');

    await grid.openEditor('row-headers', 0, column);

    // The default overscan renders a column behind the row header, so the cell next to the header
    // is a hidden one and this cell has a data cell as its previous sibling.
    expect(column).toBeGreaterThan(0);
    expect(await grid.editedCellStandsBehindRowHeader('row-headers')).toBe(false);
    await expect.poll(() => grid.overhang('row-headers')).toEqual(ON_THE_CELL_EDGE);
  });

  test('the column after the first visible one of a scrolled grid keeps the overlap', async() => {
    const column = await grid.scrollToFirstVisibleColumn('row-headers');

    await grid.openEditor('row-headers', 0, column + 1);

    await expect.poll(() => grid.overhang('row-headers')).toEqual(COVERS_THE_GRIDLINE);
  });

  test('the first rendered column of a grid with no column overscan sits on the cell edge', async() => {
    const column = await grid.scrollToFirstVisibleColumn('scrolled');

    await grid.openEditor('scrolled', 0, column);

    // The precondition: the edited cell is not column 0, and it is the one next to the row header.
    expect(column).toBeGreaterThan(0);
    expect(await grid.editedCellStandsBehindRowHeader('scrolled')).toBe(true);
    await expect.poll(() => grid.overhang('scrolled')).toEqual(ON_THE_CELL_EDGE);
  });

  test('column A editor without row headers is unchanged', async() => {
    await grid.openEditor('no-row-headers', 0, 0);

    await expect.poll(() => grid.overhang('no-row-headers')).toEqual(ON_THE_CELL_EDGE);
  });
});

/**
 * Above 100% zoom the browser computes a 1px border as 0.8px. A read that truncates it takes the
 * cell for one that draws no border, and the editor then starts 1px outside the grid.
 */
test.describe('Editor start edge above 100% zoom', { tag: THEMES_TAG }, () => {
  let grid: EditorRowHeaderBorderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorRowHeaderBorderPage(page, theme, bundle, '1.25');
    await grid.goto();
  });

  test('column A editor without row headers sits on the cell edge', async() => {
    await grid.openEditor('no-row-headers', 0, 0);

    await expect.poll(() => grid.overhang('no-row-headers')).toEqual(ON_THE_CELL_EDGE);
  });

  test('column A editor behind the row headers sits on the cell edge', async() => {
    await grid.openEditor('row-headers', 0, 0);

    await expect.poll(() => grid.overhang('row-headers')).toEqual(ON_THE_CELL_EDGE);
  });
});
