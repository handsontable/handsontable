import { test, expect, THEMES_TAG } from '../fixtures/test';
import { EditorRowHeaderBorderPage, type GridName } from '../fixtures/pages/EditorRowHeaderBorderPage';

/**
 * A cell that stands behind a row header draws no start border of its own: the row header owns
 * that gridline. The editor then has to sit exactly on the cell's start edge and be exactly as
 * wide as the cell. One pixel further out lands under the inline-start overlay, which paints
 * above the editor holder, so the editor shows 1px of its 2px start border.
 *
 * Every other cell keeps the 1px overlap that covers the gridline its neighbor draws.
 */
test.describe('Editor start edge behind the row headers', { tag: THEMES_TAG }, () => {
  let grid: EditorRowHeaderBorderPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new EditorRowHeaderBorderPage(page, theme, bundle);
    await grid.goto();
  });

  const ON_THE_CELL_EDGE = { start: 0, width: 0 };
  const COVERS_THE_GRIDLINE = { start: 1, width: 1 };

  const BEHIND_ROW_HEADER: GridName[] = ['row-headers', 'frozen', 'rtl'];

  for (const name of BEHIND_ROW_HEADER) {
    test(`column A editor sits on the cell edge on the first row (${name})`, async() => {
      await grid.openEditor(name, 0, 0);

      expect(await grid.overhang(name)).toEqual(ON_THE_CELL_EDGE);
    });

    test(`column A editor sits on the cell edge below the first row (${name})`, async() => {
      await grid.openEditor(name, 3, 0);

      expect(await grid.overhang(name)).toEqual(ON_THE_CELL_EDGE);
    });
  }

  // These guard against a fix that drops the overlap for every cell of a grid with row headers.
  for (const name of BEHIND_ROW_HEADER) {
    test(`column B editor still covers the gridline on its start side (${name})`, async() => {
      await grid.openEditor(name, 0, 1);

      expect(await grid.overhang(name)).toEqual(COVERS_THE_GRIDLINE);
    });
  }

  test('the second frozen column keeps the overlap, though it is drawn by the frozen clone', async() => {
    await grid.openEditor('frozen', 0, 1);

    expect(await grid.overhang('frozen')).toEqual(COVERS_THE_GRIDLINE);
  });

  test('the first rendered column of a scrolled grid sits on the cell edge', async() => {
    const column = await grid.scrollToFirstRenderedColumn('scrolled');

    await grid.openEditor('scrolled', 0, column);

    // The precondition: the edited cell is not column 0, and it is the one next to the row header.
    expect(column).toBeGreaterThan(0);
    expect(await grid.editedCellStandsBehindRowHeader('scrolled')).toBe(true);
    expect(await grid.overhang('scrolled')).toEqual(ON_THE_CELL_EDGE);
  });

  test('the column after the first rendered one of a scrolled grid keeps the overlap', async() => {
    const column = await grid.scrollToFirstRenderedColumn('scrolled');

    await grid.openEditor('scrolled', 0, column + 1);

    expect(await grid.editedCellStandsBehindRowHeader('scrolled')).toBe(false);
    expect(await grid.overhang('scrolled')).toEqual(COVERS_THE_GRIDLINE);
  });

  test('column A editor without row headers is unchanged', async() => {
    await grid.openEditor('no-row-headers', 0, 0);

    expect(await grid.overhang('no-row-headers')).toEqual(ON_THE_CELL_EDGE);
  });
});
