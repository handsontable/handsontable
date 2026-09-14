import { test, expect } from '../fixtures/test';
import { AutofillAbortedInitPage } from '../fixtures/pages/AutofillAbortedInitPage';

/**
 * The Autofill plugin measured the table on every document `mousemove`, whether or not a fill
 * gesture was in progress. Its `documentElement` listeners are registered while `beforeInit` runs,
 * before the grid's `TableView` assigns `hot.table`, so an init that aborts in between leaves live
 * global listeners on an instance whose `hot.table` stays `undefined` forever - and the constructor
 * threw, so nothing can `destroy()` it. Every later pointer move on the page then threw
 * `Cannot read properties of undefined (reading 'ownerDocument')` out of `offset()`, once per
 * leaked instance (DEV-2874, Sentry DEMOS-6J).
 */
test.describe('autofill after an aborted grid init', () => {
  let grid: AutofillAbortedInitPage;
  let pageErrors: string[];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    grid = new AutofillAbortedInitPage(page, theme, bundle);
    await grid.goto();
  });

  test('does not throw on a pointer move after an init aborted before the view existed', async () => {
    // Positive control: without it the assertion below would pass on a fixture that quietly
    // stopped aborting, and the spec would be green forever.
    expect(await grid.abortGridInit()).toContain('The "rows" setting is no longer supported');

    await grid.movePointerAcrossPage();

    // The healthy grid is untouched by the leak, so it is the pointer move that has to stay silent.
    await expect(grid.cell(0, 0)).toHaveText('A1');
    expect(pageErrors).toEqual([]);
  });

  test('measures the table only while the fill handle is actually held', async () => {
    // The invariant behind the fix, stated directly: the drag-outside measurement reads
    // `hot.table`, so it belongs to a live corner gesture and nothing else.
    await grid.instrumentDragOutsideCheck();

    await grid.movePointerAcrossPage();

    expect(await grid.dragOutsideCheckCount()).toBe(0);

    // Positive control for the counter itself: a real drag still takes the measurement, so a zero
    // above means "not called", not "instrumentation missed it".
    await grid.selectCell(0, 0);
    await grid.dragFillHandleTo(2, 0);

    expect(await grid.dragOutsideCheckCount()).toBeGreaterThan(0);
    await expect(grid.cell(2, 0)).toHaveText('A1');
    expect(pageErrors).toEqual([]);
  });
});
