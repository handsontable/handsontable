import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasMoveCellsPage } from '../fixtures/pages/FormulasMoveCellsPage';

/**
 * DEV-3972: a row order reached by moves (a `manualRowMove` array, a header drag) reaches a freshly loaded
 * engine as moves, so every formula keeps reading the row its data names. The order used to reach it as one
 * `setRowOrder`, which shifts the moved formulas' references: some turned into `#REF!`, others read a row
 * past the data. Each row's `Formula` reads the `ID` of another row, and `Expected` is what it must show.
 */
const CROSS_ROW_DATA = [1, 2, 3, 4, 5].map((id, index) => {
  const target = ((index + 2) % 5) + 1;

  return [id, `=A${target}+1000`, target + 1000];
});

test.describe('Formulas: an order reached by moves keeps formula references', { tag: BUNDLES_TAG }, () => {
  let grid: FormulasMoveCellsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulasMoveCellsPage(page, theme, bundle);
    await grid.goto();
  });

  /**
   * Checks that every visible row shows its expected value.
   */
  async function expectEveryRowReadsItsRecord(): Promise<void> {
    for (let row = 0; row < CROSS_ROW_DATA.length; row += 1) {
      await expect(grid.cell(row, 1)).toHaveText(await grid.cell(row, 2).innerText());
    }
  }

  test('shows every formula against its record with a manualRowMove array at init', async() => {
    await grid.initGrid(CROSS_ROW_DATA, { manualRowMove: [2, 3, 4, 0, 1] });

    await grid.expectCell(0, 0, '3');
    await grid.expectCell(3, 0, '1');
    await expectEveryRowReadsItsRecord();
  });

  test('keeps every formula on its record when the grid re-renders after a drag', async() => {
    await grid.initGrid(CROSS_ROW_DATA, { manualRowMove: true });

    expect(await grid.dragRows([3, 4], 0)).toBe(true);
    await expectEveryRowReadsItsRecord();

    await grid.rerender();
    await grid.rerender();
    await grid.rerender();

    await grid.expectCell(0, 0, '4');
    await grid.expectCell(1, 0, '5');
    await expectEveryRowReadsItsRecord();
  });

  test('writes nothing into the engine when the grid re-renders with the same data after a drag', async() => {
    await grid.initGrid(CROSS_ROW_DATA, { manualRowMove: true });

    expect(await grid.dragRows([3, 4], 0)).toBe(true);
    await grid.countEngineWrites();

    // A React re-render sends the same `data` array with every update.
    await grid.rerenderWithSameData();
    await grid.rerenderWithSameData();

    expect(await grid.engineWriteCount()).toBe(0);
    await grid.expectCell(0, 0, '4');
    await grid.expectCell(1, 0, '5');
    await expectEveryRowReadsItsRecord();
  });

  test('keeps what a second grid reads from the sheet when the grid re-renders after a drag', async() => {
    await grid.initGrid(CROSS_ROW_DATA, { manualRowMove: true });
    await grid.addReaderGrid('A1');

    expect(await grid.readerValue()).toBe(1);

    // The first row goes to the end; the engine keeps the reference on its record.
    expect(await grid.dragRows([0], 5)).toBe(true);
    expect(await grid.readerValue()).toBe(1);

    await grid.rerender();
    await grid.rerender();

    expect(await grid.readerValue()).toBe(1);
    await expectEveryRowReadsItsRecord();
  });
});
