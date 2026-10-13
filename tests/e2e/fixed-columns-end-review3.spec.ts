import { test, expect } from '../fixtures/test';
import { FixedColumnsEndReview3Page } from '../fixtures/pages/FixedColumnsEndReview3Page';

/**
 * Review 3 follow-ups for `fixedColumnsEnd`:
 *
 * - the editor of a scrolling cell must not grow under the end band,
 * - the freeze line at the inline end is one border wide, as it is at the inline start,
 * - the resize handle of an end header sits on the header's own edge when the columns do not fill the grid,
 * - a merge that reaches into the band is drawn from the right extent on the end clone.
 *
 * Every case runs in LTR and RTL, and in every theme and bundle leg (the projects).
 */
for (const rtl of [false, true]) {
  const direction = rtl ? 'RTL' : 'LTR';

  test.describe(`fixedColumnsEnd editor next to the end band (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview3Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview3Page(page, theme, bundle);
    });

    test('does not grow the editor of a scrolling cell under the end band', async () => {
      await grid.open({ rtl, cols: 30, fixedColumnsEnd: 2, longText: true });
      await grid.openEditor(1, 3);

      const editor = await grid.editorBox();
      const band = await grid.endCloneBox();

      // The value is far longer than the room left before the band, so the editor fills that room and stops there.
      expect(editor.right - editor.left).toBeGreaterThan(60);

      if (rtl) {
        expect(editor.left).toBeGreaterThanOrEqual(band.right - 1);
      } else {
        expect(editor.right).toBeLessThanOrEqual(band.left + 1);
      }

      expect(await grid.isEditorOnTop()).toBe(true);
    });

    test('does not narrow the editor when no column is frozen at the end', async () => {
      // The control of the case above: without a band the same editor may use the whole room.
      await grid.open({ rtl, cols: 30, longText: true });
      await grid.openEditor(1, 3);

      const editor = await grid.editorBox();
      const holder = await grid.holderClientBox();

      if (rtl) {
        expect(editor.left).toBeLessThan(holder.left + 40);
      } else {
        expect(editor.right).toBeGreaterThan(holder.right - 40);
      }
    });
  });

  test.describe(`fixedColumnsEnd freeze line (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview3Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview3Page(page, theme, bundle);
    });

    test('draws the freeze line at the inline end as one border, as at the inline start', async () => {
      await grid.open({ rtl, cols: 30, fixedColumnsStart: 2, fixedColumnsEnd: 2 });

      const start = await grid.startFreezeLine(1);
      const end = await grid.endFreezeLine(27);

      expect(start.before + start.after).toBe(1);
      expect(end.before + end.after).toBe(start.before + start.after);
    });

    test('draws the header freeze line at the inline end as one border too', async () => {
      await grid.open({ rtl, cols: 30, fixedColumnsEnd: 2 });

      const { before, after } = await grid.endHeaderFreezeLine(27);

      expect(before + after).toBe(1);
    });
  });

  test.describe(`fixedColumnsEnd resize handle without a horizontal scroll (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview3Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview3Page(page, theme, bundle);
    });

    test('puts the handle of the last header on its own inline-end edge', async () => {
      await grid.open({ rtl, cols: 5, width: 800, fixedColumnsEnd: 1, manualColumnResize: true });

      const { header, handle } = await grid.hoverEndHeaderHandle();
      const edge = rtl ? header.left : header.right;
      const handleCenter = (handle.left + handle.right) / 2;

      expect(Math.abs(handleCenter - edge)).toBeLessThanOrEqual(6);
    });

    test('does not stack the handle of the last header on the handle of the previous one', async () => {
      await grid.open({ rtl, cols: 5, width: 800, fixedColumnsEnd: 1, manualColumnResize: true });

      const previous = await grid.hoverMasterHeaderHandle(3);
      const { handle } = await grid.hoverEndHeaderHandle();

      expect(Math.abs((handle.left + handle.right) / 2 - (previous.left + previous.right) / 2)).toBeGreaterThan(40);
    });

    test('widens the last column when the handle is dragged towards the inline end', async () => {
      await grid.open({ rtl, cols: 5, width: 800, fixedColumnsEnd: 1, manualColumnResize: true });
      await grid.hoverEndHeaderHandle();

      await grid.dragHandle(rtl ? -40 : 40);

      expect(await grid.colWidth(4)).toBe(112);
    });

    test('still anchors the last header to the grid edge when the columns overflow it', async () => {
      // The control of the cases above: with a horizontal scroll the band stands at the grid edge and a wider
      // column grows towards the inline start.
      await grid.open({ rtl, cols: 30, fixedColumnsEnd: 1, manualColumnResize: true });

      const { header, handle } = await grid.hoverEndHeaderHandle();
      const edge = rtl ? header.right : header.left;

      expect(Math.abs((handle.left + handle.right) / 2 - edge)).toBeLessThanOrEqual(6);

      await grid.dragHandle(rtl ? 30 : -30);

      expect(await grid.colWidth(29)).toBe(102);
    });
  });

  test.describe(`fixedColumnsEnd and a virtualized merge (${direction})`, { tag: '@core' }, () => {
    let grid: FixedColumnsEndReview3Page;

    test.beforeEach(async ({ page, theme, bundle }) => {
      grid = new FixedColumnsEndReview3Page(page, theme, bundle);
    });

    test('extends the merge to its last column on the end clone when the master is scrolled to the start', async () => {
      // The merge covers columns 8 to 10, the band is 9 to 11 and the master renders no further than column 4.
      await grid.open({ rtl, cols: 12, fixedColumnsEnd: 3, merge: '0,8,1,3', virtualized: true });
      expect(await grid.scrollLeft()).toBe(0);

      // The end clone starts at column 9 and ends with the merge at column 10. A reversed extent such as
      // [9, 8] puts the selection border's start edge on the freeze line and the fill handle on column 8.
      expect(await grid.mergeExtentWhileRendering('inline_end', 0, 8)).toEqual([0, 9, 0, 10]);
    });

    test('puts the fill handle of a merge reaching into the band on its last column', async () => {
      // The merge covers columns 8 to 10, the band is 9 to 11 and the master stays scrolled to the start.
      await grid.open({ rtl, cols: 12, fixedColumnsEnd: 3, merge: '0,8,1,3', virtualized: true });
      await grid.selectCellWithoutScrolling(0, 8);
      expect(await grid.scrollLeft()).toBe(0);

      const cell = await grid.mergedCellBoxInEndClone();
      const corners = await grid.endCloneFillHandleCenters();

      expect(corners).toHaveLength(1);

      // The corner stands on the end-bottom corner of the cell: its inline-end edge, whichever way that points.
      const [corner] = corners;

      expect(Math.abs(corner.x - (rtl ? cell.left : cell.right))).toBeLessThanOrEqual(6);
      expect(Math.abs(corner.y - cell.bottom)).toBeLessThanOrEqual(6);
    });
  });
}
