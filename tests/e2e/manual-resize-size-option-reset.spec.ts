import { test, expect } from '../fixtures/test';
import { ManualResizeSizeOptionResetPage } from '../fixtures/pages/ManualResizeSizeOptionResetPage';

/**
 * Issue #4371. A row resized by dragging kept its height in an index map that the `rowHeights`
 * option could not reach: `ManualRowResize` returns the stored height from the `modifyRowHeight`
 * hook, and `Core#getRowHeight` runs that hook after reading the option. A later
 * `updateSettings({ rowHeights })` therefore moved every row except the dragged one - the reporter
 * read that partial update as "sometimes it does not work".
 *
 * Re-declaring the sizes now discards the stored ones. `rowHeights` is listed in the plugin's
 * `SETTING_KEYS`, so passing it runs `updatePlugin()`, which clears the map after the re-init - the
 * clear has to run after it, because the plugin replays its saved config on the map's `init` hook
 * and would otherwise resurrect the heights it had just saved.
 *
 * The render-time priority is unchanged: between updates a manual height still wins over the
 * option, which is what `Core#getRowHeight` documents.
 *
 * `ManualColumnResize` and `colWidths` are the twin pair and behave the same way.
 *
 * The sizes are asserted from a real pointer drag on the resize handle, so the stored size is
 * produced the way a user produces it. None of this is checkable in jsdom, where every size is zero.
 */
test.describe('Manual resize versus the size option', () => {
  let grid: ManualResizeSizeOptionResetPage;

  // Both well above every theme's default row height (26 / 29 / 37), so a fallback to the default
  // can never be mistaken for a hit.
  const TALL = 150;
  const SHORT = 50;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new ManualResizeSizeOptionResetPage(page, theme, bundle);
    await grid.goto();
  });

  test('applies rowHeights to a row that was resized by dragging', async () => {
    await grid.applySettings('rows', { rowHeights: new Array(5).fill(SHORT) });
    expect(await grid.rowHeights()).toEqual(new Array(5).fill(SHORT));

    await grid.dragRowHandle(0, 70);

    const dragged = (await grid.rowHeights())[0];

    // The drag has to have moved the row, or the rest of the test proves nothing.
    expect(dragged).toBeGreaterThan(SHORT);

    // The whole of issue #4371: row 0 used to stay at its dragged height while rows 1-4 followed.
    await grid.applySettings('rows', { rowHeights: new Array(5).fill(TALL) });
    expect(await grid.rowHeights()).toEqual(new Array(5).fill(TALL));

    // The shrink direction too - `Math.max`-style clamping would leave the dragged row alone here.
    await grid.applySettings('rows', { rowHeights: new Array(5).fill(SHORT) });
    expect(await grid.rowHeights()).toEqual(new Array(5).fill(SHORT));
  });

  test('keeps a dragged row height when the update does not re-declare rowHeights', async () => {
    await grid.dragRowHandle(0, 70);

    const dragged = (await grid.rowHeights())[0];

    await grid.applySettings('rows', { colHeaders: ['A', 'B', 'C', 'D', 'E'] });

    expect((await grid.rowHeights())[0]).toBe(dragged);
  });

  test('lets an explicit manualRowResize array win over rowHeights in the same call', async () => {
    await grid.dragRowHandle(0, 70);

    // The array states the manual heights, so it is kept rather than discarded.
    await grid.applySettings('rows', {
      manualRowResize: new Array(5).fill(90),
      rowHeights: new Array(5).fill(SHORT),
    });

    expect(await grid.rowHeights()).toEqual(new Array(5).fill(90));
  });

  test('keeps the heights of a grid built with a manualRowResize array', async () => {
    const ARRAY_HEIGHT = 90;

    expect(await grid.rowHeights('rows-array')).toEqual(new Array(5).fill(ARRAY_HEIGHT));

    // The array states the manual heights and the plugin replays it on every map init, so clearing
    // here would only leave the stored heights and the option disagreeing until the next replay.
    await grid.applySettings('rowsArray', { rowHeights: SHORT });

    expect(await grid.rowHeights('rows-array')).toEqual(new Array(5).fill(ARRAY_HEIGHT));
  });

  test('keeps a dragged height on a manualRowResize array grid when rowHeights is re-declared', async () => {
    const ARRAY_HEIGHT = 90;

    await grid.dragRowHandle(0, 60, 'rows-array');

    const dragged = (await grid.rowHeights('rows-array'))[0];

    expect(dragged).toBeGreaterThan(ARRAY_HEIGHT);

    // The array states the manual heights, so `rowHeights` does not discard them. The drag has to
    // survive as it did before: re-initializing the plugin here would replay the declared array and
    // silently revert the row to 90 - neither the dragged height nor the requested one.
    await grid.applySettings('rowsArray', { rowHeights: SHORT });

    const heights = await grid.rowHeights('rows-array');

    expect(heights[0]).toBe(dragged);
    expect(heights.slice(1)).toEqual(new Array(4).fill(ARRAY_HEIGHT));
  });

  test('applies colWidths to a column that was resized by dragging', async () => {
    await grid.applySettings('cols', { colWidths: new Array(5).fill(80) });
    expect(await grid.colWidths()).toEqual(new Array(5).fill(80));

    await grid.dragColumnHandle(0, 70);

    const dragged = (await grid.colWidths())[0];

    expect(dragged).toBeGreaterThan(80);

    await grid.applySettings('cols', { colWidths: new Array(5).fill(120) });
    expect(await grid.colWidths()).toEqual(new Array(5).fill(120));
  });

  test('applies rowHeights to a grid built with an empty manualRowResize array', async () => {
    // `manualRowResize: []` presets nothing, so it must not stop the reset the way a real array does.
    await grid.dragRowHandle(0, 70, 'rows-empty-array');

    expect((await grid.rowHeights('rows-empty-array'))[0]).toBeGreaterThan(SHORT);

    await grid.applySettings('rowsEmptyArray', { rowHeights: SHORT });

    expect(await grid.rowHeights('rows-empty-array')).toEqual(new Array(5).fill(SHORT));
  });

  test('applies minRowHeights, the documented alias, to a dragged row', async () => {
    // `Core#_getRowHeightFromSettings` reads `rowHeights ?? minRowHeights`, so the alias states the
    // heights just as `rowHeights` does.
    await grid.dragRowHandle(0, 70);

    expect((await grid.rowHeights())[0]).toBeGreaterThan(SHORT);

    await grid.applySettings('rows', { minRowHeights: TALL });

    expect(await grid.rowHeights()).toEqual(new Array(5).fill(TALL));
  });

  test('clears one dragged row height with clearManualSize()', async () => {
    await grid.applySettings('rows', { rowHeights: SHORT });
    await grid.dragRowHandle(0, 70);
    await grid.dragRowHandle(2, 70);

    const dragged = await grid.rowHeights();

    expect(dragged[0]).toBeGreaterThan(SHORT);
    expect(dragged[2]).toBeGreaterThan(SHORT);

    // What the guides tell users to call when the option cannot reset the sizes.
    await grid.callPluginMethod('rows', 'manualRowResize', 'clearManualSize', [0]);

    const cleared = await grid.rowHeights();

    expect(cleared[0]).toBe(SHORT);
    // Only the named row is cleared.
    expect(cleared[2]).toBe(dragged[2]);
  });

  test('clears every dragged row height with clearManualSizes()', async () => {
    await grid.applySettings('rows', { rowHeights: SHORT });
    await grid.dragRowHandle(0, 70);

    expect((await grid.rowHeights())[0]).toBeGreaterThan(SHORT);

    await grid.callPluginMethod('rows', 'manualRowResize', 'clearManualSizes');

    expect(await grid.rowHeights()).toEqual(new Array(5).fill(SHORT));
  });

  test('does nothing when clearManualSize() is given an out-of-range index', async () => {
    await grid.applySettings('rows', { rowHeights: SHORT });
    await grid.dragRowHandle(0, 70);

    const dragged = (await grid.rowHeights())[0];

    expect(dragged).toBeGreaterThan(SHORT);

    // `toPhysicalRow` returns null out here, and writing that would store an entry under the
    // string "null" and invalidate the size cache for nothing.
    await grid.callPluginMethod('rows', 'manualRowResize', 'clearManualSize', [999]);
    await grid.callPluginMethod('cols', 'manualColumnResize', 'clearManualSize', [999]);

    expect((await grid.rowHeights())[0]).toBe(dragged);
  });

  test('applies colWidths to a grid built with an empty manualColumnResize array', async () => {
    // The column twin of the empty-array row case: `[]` presets nothing, so the reset still runs.
    await grid.dragColumnHandle(0, 70, 'cols-empty-array');

    expect((await grid.colWidths('cols-empty-array'))[0]).toBeGreaterThan(60);

    await grid.applySettings('colsEmptyArray', { colWidths: 60 });

    expect(await grid.colWidths('cols-empty-array')).toEqual(new Array(5).fill(60));
  });

  test('does nothing when clearManualSizes() runs on a disabled plugin', async () => {
    await grid.applySettings('rows', { rowHeights: SHORT, manualRowResize: false });

    // The map only exists while the plugin is enabled, so the call must be a no-op, not a throw.
    await grid.callPluginMethod('rows', 'manualRowResize', 'clearManualSizes');
    await grid.callPluginMethod('rows', 'manualRowResize', 'clearManualSize', [0]);

    expect(await grid.rowHeights()).toEqual(new Array(5).fill(SHORT));
  });

  test('lets a taller rowHeights win over a dragged height when AutoRowSize is on', async () => {
    // With AutoRowSize enabled the plugin takes `Math.max(stored, incoming)`, so the option wins
    // whenever it asks for more. That is why the option docs scope the "keeps its height" rule to
    // AutoRowSize being disabled.
    await grid.dragRowHandle(0, 40, 'rows-auto');

    const dragged = (await grid.rowHeights('rows-auto'))[0];

    expect(dragged).toBeLessThan(TALL);

    await grid.applySettings('rowsAuto', { rowHeights: TALL });

    expect((await grid.rowHeights('rows-auto'))[0]).toBe(TALL);
  });

  test('keeps a dragged width on a manualColumnResize array grid when colWidths is re-declared',
    async () => {
      const ARRAY_WIDTH = 90;

      await grid.dragColumnHandle(0, 60, 'cols-array');

      const dragged = (await grid.colWidths('cols-array'))[0];

      expect(dragged).toBeGreaterThan(ARRAY_WIDTH);

      // The column twin of the row case: re-initializing here would replay the declared array and
      // revert the column to 90, which is neither the dragged width nor the requested one.
      await grid.applySettings('colsArray', { colWidths: 60 });

      const widths = await grid.colWidths('cols-array');

      expect(widths[0]).toBe(dragged);
      expect(widths.slice(1)).toEqual(new Array(4).fill(ARRAY_WIDTH));
    });

  test('clears every dragged column width with clearManualSizes()', async () => {
    await grid.applySettings('cols', { colWidths: 80 });
    await grid.dragColumnHandle(0, 70);

    expect((await grid.colWidths())[0]).toBeGreaterThan(80);

    await grid.callPluginMethod('cols', 'manualColumnResize', 'clearManualSizes');

    expect(await grid.colWidths()).toEqual(new Array(5).fill(80));
  });

  test('keeps a dragged column width when the update does not re-declare colWidths', async () => {
    await grid.dragColumnHandle(0, 70);

    const dragged = (await grid.colWidths())[0];

    await grid.applySettings('cols', { rowHeaders: true });

    expect((await grid.colWidths())[0]).toBe(dragged);
  });
});
