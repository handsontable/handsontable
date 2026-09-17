import { test, expect } from '../fixtures/test';
import { ManualResizeDragInterruptionPage } from '../fixtures/pages/ManualResizeDragInterruptionPage';

/**
 * DEV-2719, fourth trap. `updateSettings()` carrying a resize plugin's OWN key runs
 * `disablePlugin(); enablePlugin();` – which is what a framework wrapper sends on every re-render.
 * That cycle shares its teardown with the real disable path, so resetting the plugin's drag state
 * there looks like tidying up. It is not: the `mouseup` ending an in-flight drag then takes the
 * idle branch, and the drag is dropped with no `afterRowResize`/`afterColumnResize` and the size
 * never confirmed. The reset therefore lives at the context-menu call site only.
 *
 * Nothing pinned that before this spec. `manual-resize-teardown.spec.ts` covers the other three
 * traps thoroughly, but every one of its tests completes or abandons the drag BEFORE it changes an
 * option, so the drag state is already idle by the time the update lands. And no spec in the
 * Playwright suite asserted either resize hook fires at all – they are pinned only in the frozen
 * Jasmine suite.
 *
 * These tests are GREEN on today's code. They are characterization tests: they exist to go red if
 * the reset is ever moved into the shared teardown, which is the single most likely mistake when
 * the two plugins' duplicated gesture is collapsed into one module.
 *
 * Each case carries a positive control – the same drag without the interruption – because the
 * failure this spec watches for is a hook that does NOT fire, and an assertion that something is
 * absent passes just as happily when the recorder itself is broken.
 */
test.describe('Manual resize drag interrupted by updateSettings', () => {
  let grid: ManualResizeDragInterruptionPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualResizeDragInterruptionPage(page, theme, bundle);
    await grid.goto();
  });

  test('completes a row drag when the plugin is re-stated mid-drag', async () => {
    const startHeight = await grid.renderedRowHeight(2);

    // The control. A plain drag fires the hook, so a later assertion that the hook is MISSING
    // cannot be satisfied by a recorder that never worked.
    await grid.startRowDrag(2, 30);
    await grid.releaseDrag();
    await expect.poll(async () => (await grid.resizeHooks()).length).toBe(1);

    await grid.clearResizeHooks();

    const heightAfterControl = await grid.renderedRowHeight(2);

    expect(heightAfterControl).toBeGreaterThan(startHeight + 20);

    // The case under test: the update lands BETWEEN mousedown and mouseup.
    await grid.startRowDrag(2, 40);
    await grid.restateResizeOption('manualRowResize', true);
    await grid.releaseDrag();

    // The drag must still be confirmed. If the drag state were reset by the re-initialization's
    // teardown, this release takes the idle branch and the log stays empty.
    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);

    const [call] = await grid.resizeHooks();

    expect(call.hook).toBe('afterRowResize');
    expect(call.index).toBe(2);
    expect(call.isDoubleClick).toBe(false);

    // ...and the size actually applied, not just announced.
    await expect.poll(() => grid.renderedRowHeight(2))
      .toBeGreaterThan(heightAfterControl + 20);
  });

  test('completes a column drag when the plugin is re-stated mid-drag', async () => {
    const startWidth = await grid.renderedColumnWidth(2);

    await grid.startColumnDrag(2, 40);
    await grid.releaseDrag();
    await expect.poll(async () => (await grid.resizeHooks()).length).toBe(1);

    await grid.clearResizeHooks();

    const widthAfterControl = await grid.renderedColumnWidth(2);

    expect(widthAfterControl).toBeGreaterThan(startWidth + 30);

    await grid.startColumnDrag(2, 50);
    await grid.restateResizeOption('manualColumnResize', true);
    await grid.releaseDrag();

    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);

    const [call] = await grid.resizeHooks();

    expect(call.hook).toBe('afterColumnResize');
    expect(call.index).toBe(2);
    expect(call.isDoubleClick).toBe(false);

    await expect.poll(() => grid.renderedColumnWidth(2))
      .toBeGreaterThan(widthAfterControl + 30);
  });

  test('completes a row drag across an update that touches neither resize plugin', async () => {
    // Isolates the failure. If this one ever goes red alongside the re-statement case, the cause is
    // `updateSettings()` or the render it triggers – not the plugin re-initialization the fourth
    // trap is about.
    const startHeight = await grid.renderedRowHeight(2);

    await grid.startRowDrag(2, 40);
    await grid.updateUnrelatedOption();
    await grid.releaseDrag();

    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);
    await expect.poll(() => grid.renderedRowHeight(2)).toBeGreaterThan(startHeight + 20);
  });

  test('re-stating the other axis does not disturb an open row drag', async () => {
    // The column plugin's re-initialization runs the same shared teardown. If that teardown ever
    // reaches state it does not own, this is where it shows: the ROW drag is the one in flight.
    const startHeight = await grid.renderedRowHeight(2);

    await grid.startRowDrag(2, 40);
    await grid.restateResizeOption('manualColumnResize', true);
    await grid.releaseDrag();

    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);

    const [call] = await grid.resizeHooks();

    expect(call.hook).toBe('afterRowResize');

    await expect.poll(() => grid.renderedRowHeight(2)).toBeGreaterThan(startHeight + 20);
  });
});

/**
 * DEV-1038 + the fourth trap together. `afterMouseDownTimeout()` writes `#pressed = false` on a
 * still second press, and that callback is armed through `hot._registerTimeout`, which only
 * `Core#destroy()` clears. A framework re-render mid-window therefore runs
 * `disablePlugin(); enablePlugin();` while the timer is still pending. `isActive()` (the runtime
 * `enabled` flag, not the settings `isEnabled()`) still gates the path, so a re-init that leaves
 * the plugin on must not throw, must not leave the guide `active`, and must still autosize.
 *
 * The clock is what makes the 500ms boundary an assertion rather than a sleep, and it has to be
 * installed before the page loads – same reason the pending-autoresize describe in
 * `manual-resize-teardown.spec.ts` is its own block.
 */
test.describe('Manual resize second-press hold interrupted mid-timer', () => {
  let grid: ManualResizeDragInterruptionPage;
  let pageErrors: string[] = [];

  test.beforeEach(async ({ page, theme, bundle }) => {
    pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.clock.install();

    grid = new ManualResizeDragInterruptionPage(page, theme, bundle);
    await grid.goto();
  });

  test.afterEach(async () => {
    expect(pageErrors).toEqual([]);
  });

  test('autosizes a held row second press when the plugin is re-stated mid-timer', async ({ page }) => {
    await grid.dblclickHoldRowHandle(2);

    // Premise: the second press attached the guide and left it active. Without this a gesture
    // that never reached `#onMouseDown` would make the hide assertion pass on nothing.
    await expect(grid.rowGuide).toHaveCount(1);
    await expect(grid.rowGuide).toHaveClass(/active/);

    await grid.restateResizeOption('manualRowResize', true);

    // The gate `afterMouseDownTimeout()` reads. A re-init that left the plugin on must keep it
    // true, or the pending timer would bail and this test would stay green on a dead autosize.
    await expect.poll(() => grid.isResizePluginActive('manualRowResize')).toBe(true);

    await page.clock.runFor(1500);

    await expect.poll(() => grid.isResizePluginActive('manualRowResize')).toBe(true);
    await expect(grid.rowGuide).toHaveCount(0);

    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);

    const [call] = await grid.resizeHooks();

    expect(call.hook).toBe('afterRowResize');
    expect(call.index).toBe(2);
    expect(call.isDoubleClick).toBe(true);

    await grid.releaseDrag();

    // Still hold: `#pressed` was cleared, so mouseup takes the idle branch.
    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);
  });

  test('autosizes a held column second press when the plugin is re-stated mid-timer', async ({ page }) => {
    await grid.dblclickHoldColumnHandle(2);

    await expect(grid.columnGuide).toHaveCount(1);
    await expect(grid.columnGuide).toHaveClass(/active/);

    await grid.restateResizeOption('manualColumnResize', true);

    await expect.poll(() => grid.isResizePluginActive('manualColumnResize')).toBe(true);

    await page.clock.runFor(1500);

    await expect.poll(() => grid.isResizePluginActive('manualColumnResize')).toBe(true);
    await expect(grid.columnGuide).toHaveCount(0);

    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);

    const [call] = await grid.resizeHooks();

    expect(call.hook).toBe('afterColumnResize');
    expect(call.index).toBe(2);
    expect(call.isDoubleClick).toBe(true);

    await grid.releaseDrag();

    await expect.poll(async () => await grid.resizeHooks()).toHaveLength(1);
  });
});
