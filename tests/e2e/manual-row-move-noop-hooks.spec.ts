import { test, expect, CROSS_BROWSER_TAG, THEMES_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * A row header pressed and released without moving the pointer is a click, not a move, so
 * `beforeRowMove` and `afterRowMove` stay silent, as they did before 8.0.0. A drag fires both, even one
 * dropped back where it started, which is the positive control of the silent case.
 */
test.describe('pressing a row header without dragging it', { tag: [CROSS_BROWSER_TAG, THEMES_TAG] }, () => {
  let grid: SharedDemoGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
    // The API selects the row: a header click followed by a press on the same point would read as a double click.
    await grid.selectRow(3);
    await grid.trackRowMoveHooks();
  });

  test('fires no move hook when the header is pressed and released in place', async() => {
    await grid.pressRowHeaderAndRelease(3);

    expect(await grid.rowMoveHookCalls()).toEqual({ beforeRowMove: 0, afterRowMove: 0 });
    expect(await grid.physicalRows(5)).toEqual([0, 1, 2, 3, 4]);
    expect(await grid.selected()).toEqual([[3, -1, 3, 8]]);
  });

  test('fires no move hook when the pointer jitters within the drag tolerance', async() => {
    await grid.pressRowHeaderAndRelease(3, 2);

    expect(await grid.rowMoveHookCalls()).toEqual({ beforeRowMove: 0, afterRowMove: 0 });
    expect(await grid.physicalRows(5)).toEqual([0, 1, 2, 3, 4]);
  });

  test('fires both move hooks once the pointer travels past the drag tolerance', async() => {
    await grid.pressRowHeaderAndRelease(3, 5);

    expect(await grid.rowMoveHookCalls()).toEqual({ beforeRowMove: 1, afterRowMove: 1 });
    expect(await grid.physicalRows(5)).toEqual([0, 1, 2, 3, 4]);
  });

  test('still fires both move hooks when the header is dragged away and dropped back where it started', async() => {
    await grid.dragRowHeaderAwayAndBack(3, 1);

    expect(await grid.rowMoveHookCalls()).toEqual({ beforeRowMove: 1, afterRowMove: 1 });
    expect(await grid.lastAfterRowMove()).toEqual({ movePossible: true, orderChanged: false });
    expect(await grid.physicalRows(5)).toEqual([0, 1, 2, 3, 4]);
  });

  test('fires both move hooks once when the drag changes the order', async() => {
    await grid.dragRowHeaderOnto(3, 1);

    expect(await grid.physicalRows(5)).toEqual([0, 3, 1, 2, 4]);
    expect(await grid.rowMoveHookCalls()).toEqual({ beforeRowMove: 1, afterRowMove: 1 });
    expect(await grid.lastAfterRowMove()).toEqual({ movePossible: true, orderChanged: true });
  });
});
