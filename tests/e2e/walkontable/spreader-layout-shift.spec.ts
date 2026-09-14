import { test, expect } from '../../fixtures/test';
import { SpreaderLayoutShiftPage } from '../../fixtures/pages/walkontable/SpreaderLayoutShiftPage';

/**
 * DEV-54 - the spreader must not register as a layout shift while the grid scrolls.
 *
 * The spreader (`div.wtSpreader`) holds the rendered rows and is repositioned on every scroll
 * draw. Written as a `top`/`left` inset, that move is a layout move: the browser subtracts the
 * scroll distance, but the spreader can only sit on a row boundary, so a sub-row remainder is
 * reported on every frame and the page's CLS grows without bound (10.4 after 25 wheel steps,
 * where 0.1 is "good"). Written as a transform, the same move is exempt.
 *
 * Nothing about this is visible - the cells land in the same place either way - so the
 * browser's own `layout-shift` entries are the observable contract, and the positive control
 * exists so a zero cannot be read from an observer that saw nothing.
 */
test.describe('walkontable spreader layout shift', { tag: '@walkontable' }, () => {
  let wt: SpreaderLayoutShiftPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    wt = new SpreaderLayoutShiftPage(page, theme, bundle);
  });

  test.describe('without frozen panes', () => {
    test.beforeEach(async() => {
      await wt.goto();

      // Only Chromium reports layout shifts, and every project here runs it. A precondition rather
      // than a skip: on a browser without the entry type every assertion below would pass on nothing.
      expect(await wt.layoutShiftsSupported(), 'layout-shift entries must be reported by this browser').toBe(true);
    });

    test('reports a layout shift for a box moved with an inset (positive control)', async() => {
      await wt.resetLayoutShifts();
      await wt.moveControlBox();

      // The observer path works: a real layout move on this page IS seen and IS blamed correctly.
      await expect.poll(() => wt.shiftValueBlamedOn('cls-control'), {
        message: 'the control box moved by 200px, so the observer must report it',
      }).toBeGreaterThan(0);
    });

    test('a vertical wheel scroll moves no layout', async() => {
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaY: 600 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      // Well under the 0.1 "good" line, and 200× under what the inset write measured.
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });

    test('a horizontal wheel scroll moves no layout', async() => {
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaX: 400 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });

    test('the editor opens over its cell after a scroll', async() => {
      // The editor is placed from the cell's document position, which the layout chain no longer
      // carries once the spreader moves by a transform - this pins that the offset is added back.
      await wt.wheelScroll({ deltaY: 600 });

      const row = (await wt.masterFirstRenderedRow()) + 4;
      const cellBox = await wt.cell(row, 3).boundingBox();
      const editor = await wt.openEditor(row, 3);
      const editorBox = await editor.boundingBox();

      expect(cellBox).not.toBeNull();
      expect(editorBox).not.toBeNull();
      // A pixel of border compensation either way is by design; anything larger is a misplaced editor.
      expect(Math.abs(editorBox!.y - cellBox!.y)).toBeLessThanOrEqual(2);
      expect(Math.abs(editorBox!.x - cellBox!.x)).toBeLessThanOrEqual(2);
    });

    test('the fill handle sits at the selection corner after a scroll', async() => {
      // The corner is positioned from `offset(TD) - offset(TABLE)`, both inside the spreader, so this
      // pins that the transform cancels out of that difference. (The separate anchor that decides
      // whether the handle is pulled inside the grid's last row/column is not exercised here - that
      // decision only changes at the grid's edge, where the band-relative coordinate already exceeds
      // the viewport, so it cannot flip either way.)
      await wt.wheelScroll({ deltaY: 600 });

      const row = (await wt.masterFirstRenderedRow()) + 4;

      await wt.selectCell(row, 3);

      const cellBox = await wt.cell(row, 3).boundingBox();
      const handleBox = await wt.fillHandle().boundingBox();

      expect(cellBox).not.toBeNull();
      expect(handleBox).not.toBeNull();

      const handleCenterX = handleBox!.x + handleBox!.width / 2;
      const handleCenterY = handleBox!.y + handleBox!.height / 2;

      // The handle straddles the cell's bottom-right corner.
      expect(Math.abs(handleCenterX - (cellBox!.x + cellBox!.width))).toBeLessThanOrEqual(4);
      expect(Math.abs(handleCenterY - (cellBox!.y + cellBox!.height))).toBeLessThanOrEqual(4);
    });
  });

  test.describe('with frozen rows and columns', () => {
    test.beforeEach(async() => {
      await wt.goto({ frozen: true });
      expect(await wt.layoutShiftsSupported(), 'layout-shift entries must be reported by this browser').toBe(true);
    });

    test('the overlay clones move no layout either', async() => {
      // Each clone has a spreader of its own, offset on the axis it does not freeze.
      await wt.resetLayoutShifts();
      await wt.wheelScroll({ deltaY: 600 });
      await wt.wheelScroll({ deltaX: 400 });

      expect(await wt.shiftValueBlamedOn('wtSpreader')).toBe(0);
      expect(await wt.totalShiftValue()).toBeLessThan(0.05);
    });
  });
});
