import { test, expect } from '../fixtures/test';
import { BottomSlotSizingPage, type BottomSlotPlugin } from '../fixtures/pages/BottomSlotSizingPage';

/**
 * The bottom layout slot (pagination bar, sheets bar) shares the root wrapper with the grid. When
 * the grid has NO `height` option and the container is sized in CSS, the wrapper and the engine
 * used to disagree about the table's footprint: the bar floated over a data row (window scroll
 * inside a fixed CSS box), was clipped out of reach (scrollable ancestor), or ran wider than its
 * container (DEV-2848). The same layouts are measured for both bars, because the fix lives in the
 * shared wrapper/slot sizing, not in either plugin.
 */
const PLUGINS: BottomSlotPlugin[] = ['pagination', 'sheetsBar'];

for (const plugin of PLUGINS) {
  test.describe(`${plugin} bar in a grid without a height option`, () => {
    let grid: BottomSlotSizingPage;

    test.beforeEach(({ page, theme, bundle }) => {
      grid = new BottomSlotSizingPage(page, theme, bundle);
    });

    test('follows the last row inside a fixed CSS box instead of covering a data row', async () => {
      await grid.goto('css-fixed', plugin);

      const geometry = await grid.geometry();

      expect(geometry.verticalByWindow).toBe(true);
      expect(geometry.bar).not.toBeNull();
      // The bar starts where the rendered rows end - never above the lowest row.
      expect(geometry.bar!.top).toBeGreaterThanOrEqual(geometry.lastRowBottom - 1);
      expect(geometry.bar!.top).toBeGreaterThanOrEqual(geometry.holder.bottom - 1);
      // ...and never wider than the CSS-sized container.
      expect(geometry.bar!.width).toBeLessThanOrEqual(geometry.container.width + 1);
      // Only the grid box grew; the wrapper keeps the container's height, so the overlays layer
      // (dialog, notification) still sizes to the container (see the regression guards below).
      expect(Math.abs(geometry.wrapper.height - geometry.container.height)).toBeLessThanOrEqual(1);
      expect(geometry.grid.height).toBeGreaterThan(geometry.container.height);
    });

    test('follows the last row inside a flex-filled parent', async () => {
      await grid.goto('flex-fill', plugin);

      const geometry = await grid.geometry();

      expect(geometry.bar).not.toBeNull();
      expect(geometry.bar!.top).toBeGreaterThanOrEqual(geometry.lastRowBottom - 1);
      expect(geometry.bar!.width).toBeLessThanOrEqual(geometry.container.width + 1);
    });

    // `height: 'auto'` does not clip the root, so it grows out of the fixed CSS box and the page
    // owns the vertical axis (DEV-2789) - the grid box must still follow its content.
    test('follows the last row with `height: "auto"` inside a fixed CSS box', async () => {
      await grid.goto('auto-height', plugin);

      const geometry = await grid.geometry();

      expect(geometry.verticalByWindow).toBe(true);
      expect(geometry.wrapperClasses).toContain('ht-grid-follows-content');
      expect(geometry.bar).not.toBeNull();
      expect(geometry.bar!.top).toBeGreaterThanOrEqual(geometry.lastRowBottom - 1);
      expect(geometry.bar!.top).toBeGreaterThanOrEqual(geometry.root.bottom - 1);
    });

    test('stays inside a scrollable ancestor without scrolling it', async () => {
      await grid.goto('scrollable-ancestor', plugin);

      const geometry = await grid.geometry();

      expect(geometry.verticalByWindow).toBe(false);
      expect(geometry.shellScrollTop).toBe(0);
      expect(geometry.bar).not.toBeNull();
      // Visible inside the ancestor's box: the table gave up the bar's height.
      expect(geometry.bar!.bottom).toBeLessThanOrEqual(geometry.shell.bottom + 1);
      expect(geometry.holder.height + geometry.bar!.height).toBeLessThanOrEqual(geometry.shellClientHeight + 1);
      expect(geometry.bar!.top).toBeGreaterThanOrEqual(geometry.holder.bottom - 1);
    });

    // Playwright scrolls a target into view before clicking, so the click alone would pass on a
    // clipped bar too. The ancestor staying at scrollTop 0 is what proves the bar was reachable.
    test('is usable inside a scrollable ancestor without scrolling it', async () => {
      await grid.goto('scrollable-ancestor', plugin);

      if (plugin === 'pagination') {
        await expect(grid.pageCounter()).toContainText('1 - 25');
        await grid.nextPage();
        await expect(grid.pageCounter()).toContainText('26 - 50');
      } else {
        await expect(grid.activeSheetTab()).toHaveText(/Alpha/);
        await grid.sheetTab('Beta').click();
        await expect(grid.activeSheetTab()).toHaveText(/Beta/);
        await expect(grid.cell(1, 1)).toHaveText('B2C2');
      }

      expect((await grid.geometry()).shellScrollTop).toBe(0);
    });

    for (const variant of ['tiny', 'stretch'] as const) {
      test(`is never wider than its container (${variant})`, async () => {
        await grid.goto(variant, plugin);

        const geometry = await grid.geometry();

        expect(geometry.bar).not.toBeNull();
        expect(geometry.bottomSlot.width).toBeLessThanOrEqual(geometry.container.width + 1);
        expect(geometry.bar!.right).toBeLessThanOrEqual(geometry.container.right + 1);
      });

      // The clamp reads `clientWidth`, whose scrollbar semantics differ under RTL; the slot must
      // still stay inside the container's inline edges there.
      test(`is never wider than its container in RTL (${variant})`, async () => {
        await grid.goto(variant, plugin);
        await grid.rebuild({ layoutDirection: 'rtl' });

        const geometry = await grid.geometry();

        expect(geometry.bar).not.toBeNull();
        expect(geometry.bottomSlot.width).toBeLessThanOrEqual(geometry.container.width + 1);
        expect(geometry.bar!.left).toBeGreaterThanOrEqual(geometry.container.left - 1);
        expect(geometry.bar!.right).toBeLessThanOrEqual(geometry.container.right + 1);
      });
    }

    // With an explicit pixel `height` the root owns the axis and contains no slot, so the engine
    // reserves nothing - core subtracts the slots from the height it writes instead, for BOTH bars.
    // Before, only Pagination did that, and a sheets bar sat 38px below a 400px box.
    test('keeps the grid plus its bar inside an explicit `height` (control)', async () => {
      await grid.goto('explicit-height', plugin);

      const geometry = await grid.geometry();

      expect(geometry.verticalByWindow).toBe(false);
      expect(geometry.bar).not.toBeNull();
      expect(Math.abs(geometry.bar!.top - geometry.root.bottom)).toBeLessThanOrEqual(1);
      // The wrapper (root + every bottom-slot bar) is the declared 400px.
      expect(Math.abs(geometry.wrapper.height - 400)).toBeLessThanOrEqual(1);
      expect(geometry.root.height).toBeLessThan(400);
    });
  });
}

test.describe('regression guards around the wrapper and slot sizing', () => {
  let grid: BottomSlotSizingPage;

  test.beforeEach(({ page, theme, bundle }) => {
    grid = new BottomSlotSizingPage(page, theme, bundle);
  });

  // The grid-box change must leave the plain window-scroll layout alone: the rows still belong to
  // the page and stay virtualized. The license notification is the only slot content here.
  test('a grid with no plugin keeps window scroll and virtualization inside a fixed CSS box', async () => {
    await grid.goto('css-fixed', 'none');

    const geometry = await grid.geometry();
    const renderedRows = await grid.renderedRowCount();

    expect(geometry.verticalByWindow).toBe(true);
    expect(renderedRows).toBeGreaterThan(0);
    expect(renderedRows).toBeLessThan(300);
    expect(geometry.bottomSlot.top).toBeGreaterThanOrEqual(geometry.lastRowBottom - 1);
  });

  // `.ht-overlay` sizes against the wrapper. Had the wrapper followed the content, a dialog would
  // have been thousands of pixels tall and a bottom toast would have landed below the fold.
  test('keeps the overlays layer at the container height while the grid overflows it', async () => {
    await grid.goto('css-fixed', 'sheetsBar');

    const geometry = await grid.geometry();
    const dialog = await grid.openDialogBox();

    expect(geometry.grid.height).toBeGreaterThan(geometry.container.height);
    expect(Math.abs(dialog.height - geometry.container.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(dialog.top - geometry.container.top)).toBeLessThanOrEqual(1);
  });

  // The wrapper's `height: 100%` is what lets a `height: '100%'` option resolve through the
  // `.ht-grid` chain. That option clips the root, so the root owns the vertical axis and the
  // grid box must keep shrinking to the container.
  test('keeps a `height: "100%"` grid filling its CSS-sized container', async () => {
    await grid.goto('css-fixed', 'pagination');
    await grid.rebuild({ height: '100%' });

    const geometry = await grid.geometry();

    expect(geometry.verticalByWindow).toBe(false);
    expect(geometry.wrapperClasses).not.toContain('ht-grid-follows-content');
    expect(Math.abs(geometry.wrapper.height - geometry.container.height)).toBeLessThanOrEqual(1);
    expect(geometry.root.height).toBeLessThanOrEqual(geometry.container.height);
    expect(geometry.bar!.bottom).toBeLessThanOrEqual(geometry.container.bottom + 1);
  });

  // A definite `width` wider than its container is the user's explicit choice: the root owns the
  // horizontal axis, and the bar keeps following the grid's box, not the container.
  test('keeps the bar as wide as an explicit `width` that overflows its container', async () => {
    await grid.goto('tiny', 'pagination');
    await grid.rebuild({ width: 900 });

    const geometry = await grid.geometry();

    expect(geometry.horizontalByWindow).toBe(false);
    expect(Math.abs(geometry.bottomSlot.width - geometry.root.width)).toBeLessThanOrEqual(1);
  });

  // In a shrink-to-fit host the wrapper sizes to its widest child - the slots included - so a slot
  // width written once could feed back into the clamp and latch there. It must keep following the
  // table downwards when columns go away.
  test('keeps the slot tracking the table width inside a shrink-to-fit host', async () => {
    await grid.goto('inline-block-host', 'pagination');

    const before = await grid.geometry();

    expect(before.horizontalByWindow).toBe(true);
    expect(before.bottomSlot.width).toBeLessThanOrEqual(before.wrapper.width + 1);

    await grid.removeColumns(6);

    const after = await grid.geometry();

    expect(after.table.width).toBeLessThan(before.table.width);
    expect(Math.abs(after.bottomSlot.width - after.table.width)).toBeLessThanOrEqual(1);
  });

  // The grid box follows the table's content in window mode, so a data change grows it. The
  // wrapper must not move (nothing observes it), and no observer loop or error may follow.
  test('grows the grid box with inserted rows without a resize loop or console error', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await grid.goto('css-fixed', 'sheetsBar');

    const before = await grid.geometry();

    await grid.insertRows(100);

    const after = await grid.geometry();

    expect(after.grid.height).toBeGreaterThan(before.grid.height);
    expect(Math.abs(after.wrapper.height - before.wrapper.height)).toBeLessThanOrEqual(1);
    expect(after.bar!.top).toBeGreaterThanOrEqual(after.holder.bottom - 1);
    expect(errors).toEqual([]);
  });

  // A bar that mounts AFTER the first draw changes the reservation without the owner or the hider
  // resizing, so neither engine observer notices. Core watches the slots and re-renders; the
  // master table's trimming-cache fingerprint then re-measures instead of replaying the full box.
  test('reserves room for a bar that mounts after the first draw inside a scrollable ancestor', async () => {
    await grid.goto('scrollable-ancestor', 'none');

    const before = await grid.geometry();

    expect(before.bar).toBeNull();

    await grid.updateSettings({ pagination: { pageSize: 25 } });

    await expect(grid.pageCounter()).toContainText('1 - 25');
    await expect.poll(async () => {
      const geometry = await grid.geometry();

      return geometry.bar !== null && geometry.bar.bottom <= geometry.shell.bottom + 1
        && geometry.bar.top >= geometry.holder.bottom - 1;
    }).toBe(true);

    expect((await grid.geometry()).shellScrollTop).toBe(0);
  });
});
