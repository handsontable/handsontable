import { test, expect, BUNDLES_TAG } from '../fixtures/test';
import { FormulasMoveCellsPage } from '../fixtures/pages/FormulasMoveCellsPage';

/**
 * With `sortEmptyCells: true` a sort can put a blank row ahead of rows that hold content. The engine
 * ends its sheet at the last row with content, so the sort has to give it that blank row for every
 * formula below it to keep reading the cell it was written against.
 */
test.describe('Formulas: sorting a blank row ahead of content', { tag: BUNDLES_TAG }, () => {
  let grid: FormulasMoveCellsPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new FormulasMoveCellsPage(page, theme, bundle);
    await grid.goto();
    await grid.initGrid(
      [[3, '=A1*2'], [1, '=A2*2'], [2, '=A3*2'], [null, null]],
      { columnSorting: { sortEmptyCells: true } },
    );
  });

  test('shows every formula against its own row when the blank row sorts first and then last', async() => {
    await grid.sortByHeader('A');

    await grid.expectCell(0, 0, '');
    await grid.expectCell(0, 1, '');
    await grid.expectCell(1, 0, '1');
    await grid.expectCell(1, 1, '2');
    await grid.expectCell(2, 0, '2');
    await grid.expectCell(2, 1, '4');
    await grid.expectCell(3, 0, '3');
    await grid.expectCell(3, 1, '6');

    await grid.sortByHeader('A');

    await grid.expectCell(0, 0, '3');
    await grid.expectCell(0, 1, '6');
    await grid.expectCell(1, 0, '2');
    await grid.expectCell(1, 1, '4');
    await grid.expectCell(2, 0, '1');
    await grid.expectCell(2, 1, '2');
    await grid.expectCell(3, 0, '');
    await grid.expectCell(3, 1, '');
  });
});
