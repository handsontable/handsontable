import { test, expect, THEMES_TAG } from '../fixtures/test';
import { RowHeightsPhysicalPage } from '../fixtures/pages/RowHeightsPhysicalPage';

/**
 * `rowHeights` addresses a row by its physical index, so a height stays with its row when rows are
 * collapsed, trimmed, sorted, or moved (DEV-508). Rows P, C1, C2 and Q declare 100, 50, 40 and 70 px.
 */
test.describe('rowHeights by physical row index', { tag: THEMES_TAG }, () => {
  let grid: RowHeightsPhysicalPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new RowHeightsPhysicalPage(page, theme, bundle);
  });

  test('keeps the next parent at its own height when a nested parent is collapsed', async() => {
    await grid.goto('nested');

    await grid.collapse(0);

    expect(await grid.visibleOrder()).toEqual(['P', 'Q']);
    await grid.expectHeight('P', 100);
    // Q now sits where C1 was, and must not take C1's 50px
    await grid.expectHeight('Q', 70);

    await grid.expand(0);

    await grid.expectHeight('C1', 50);
    await grid.expectHeight('C2', 40);
    await grid.expectHeight('Q', 70);
  });

  test('does not give a trimmed row\'s height to the rows below it', async() => {
    await grid.goto('trim');

    await grid.trim([1]);

    expect(await grid.visibleOrder()).toEqual(['P', 'C2', 'Q']);
    await grid.expectHeight('C2', 40);
    await grid.expectHeight('Q', 70);
  });

  test('keeps the heights with their rows after a sort', async() => {
    await grid.goto('sort');

    await grid.sort(1, 'desc');

    expect(await grid.visibleOrder()).toEqual(['Q', 'C2', 'C1', 'P']);
    await grid.expectHeight('Q', 70);
    await grid.expectHeight('C2', 40);
    await grid.expectHeight('C1', 50);
    await grid.expectHeight('P', 100);
  });

  for (const mode of ['move', 'function'] as const) {
    test(`keeps the heights with their rows after a row is moved (${mode === 'move' ? 'array' : 'function'} form)`,
      async() => {
        await grid.goto(mode);

        await grid.moveRow(0, 3);

        expect(await grid.visibleOrder()).toEqual(['C1', 'C2', 'Q', 'P']);
        await grid.expectHeight('C1', 50);
        await grid.expectHeight('P', 100);
      });
  }
});
