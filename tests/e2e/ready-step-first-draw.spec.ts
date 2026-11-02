import { test, expect } from '../fixtures/test';
import { ReadyStepFirstDrawPage } from '../fixtures/pages/ReadyStepFirstDrawPage';

/**
 * Plugins set up their initial state in the ready step (`onGridReady()`), before the first draw, and a
 * direct `enablePlugin()` on a drawn grid runs that step too. Before, ColumnSorting sorted from an
 * `afterInit` listener, after a first draw of unsorted rows, and CustomBorders applied its declared
 * borders from an `init` listener that never fired again, so a direct disable and enable left the grid
 * with no borders.
 */
test.describe('a sorted grid on its first draw', () => {
  test('draws the sorted rows with its first and only draw', async({ page, theme, bundle }) => {
    const grid = new ReadyStepFirstDrawPage(page, theme, bundle, 'sorted');

    await grid.goto();

    const snapshot = await grid.afterConstruct();

    expect(snapshot.draws).toBe(1);
    expect(snapshot.firstColumnOfFirstDraw).toEqual([
      'Ana García', 'Beatriz Costa', 'James Okafor', 'Li Wei', 'Mia Chen',
    ]);
    await expect(grid.cell(0, 0)).toHaveText('Ana García');
    await expect(grid.cell(4, 0)).toHaveText('Mia Chen');
  });
});

test.describe('declared custom borders after a direct disable and enable', () => {
  test('come back on screen', async({ page, theme, bundle }) => {
    const grid = new ReadyStepFirstDrawPage(page, theme, bundle, 'borders');

    await grid.goto();

    // The start, end and top edges of the one declared border.
    await expect(grid.customBorderEdges()).toHaveCount(3);

    await grid.disableCustomBorders();

    // The control: the disable takes the borders away, so the count below is the enable's work.
    await expect(grid.customBorderEdges()).toHaveCount(0);

    await grid.enableCustomBorders();

    await expect(grid.customBorderEdges()).toHaveCount(3);
  });
});
