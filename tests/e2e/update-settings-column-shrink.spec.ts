import { test, expect } from '../fixtures/test';
import { UpdateSettingsColumnShrinkPage } from '../fixtures/pages/UpdateSettingsColumnShrinkPage';

/**
 * A `columns` array shortened through `updateSettings()` (GitHub issue #5543).
 *
 * Removing a non-last column used to render once with the renderer of the column
 * that previously occupied that index, so a renderer was handed a value from
 * another column. A later render repairs the DOM, which is why these tests read
 * the recorded renderer calls rather than cell text - an assertion on the settled
 * grid passes on the broken build too.
 */
test.describe('updateSettings with a shortened columns array', () => {
  test('keeps every renderer on its own column when `data` travels along', async({ page, theme, bundle }) => {
    const grid = new UpdateSettingsColumnShrinkPage(page, theme, bundle);

    await grid.goto();
    await grid.shrinkWithData();

    // Positive control first: an empty recording would make the violation check
    // below pass without exercising anything.
    expect(await grid.rendererCalls()).not.toHaveLength(0);
    expect(await grid.violations()).toEqual([]);

    // Every recorded call belongs to the one surviving column.
    const renderers = new Set((await grid.rendererCalls()).map(call => call.renderer));

    expect([...renderers]).toEqual(['stringRenderer']);

    // The settled grid, which was already correct before the fix.
    expect(await grid.columnCount()).toBe(1);
    await grid.expectSurvivingColumn();
  });

  test('keeps every renderer on its own column when a theme travels along', async({ page, theme, bundle }) => {
    const grid = new UpdateSettingsColumnShrinkPage(page, theme, bundle);

    await grid.goto();
    await grid.shrinkWithTheme();

    // A theme in the payload paints from `useTheme()`, before the data phase. That
    // paint reads the previous columns AND the previous data, so it is
    // self-consistent - this pins that it stays so.
    expect(await grid.rendererCalls()).not.toHaveLength(0);
    expect(await grid.violations()).toEqual([]);
    expect(await grid.columnCount()).toBe(1);
  });

  test('keeps every renderer on its own column when only `columns` changes', async({ page, theme, bundle }) => {
    const grid = new UpdateSettingsColumnShrinkPage(page, theme, bundle);

    await grid.goto();
    await grid.shrinkColumnsOnly();

    // This branch of `updateSettings()` was already correct. The case guards the
    // fix from being narrowed to the payload that carries `data`.
    expect(await grid.rendererCalls()).not.toHaveLength(0);
    expect(await grid.violations()).toEqual([]);
    expect(await grid.columnCount()).toBe(1);
  });
});
