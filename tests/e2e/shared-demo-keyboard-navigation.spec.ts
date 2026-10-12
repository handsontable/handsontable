import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { SharedDemoGridPage } from '../fixtures/pages/SharedDemoGridPage';

/**
 * Where Tab, Shift+Tab and the arrow keys move the focus on the visual suite's shared `/` grid: row and
 * column headers, `navigableHeaders` on, and the grid the only focusable thing on the page.
 *
 * These are real key presses. The Jasmine tab-navigation suite asserts the same coordinates with
 * synthetic events, which pick the next focusable element and call `focus()` themselves, so the
 * browser's own Tab never runs there; and `tab-navigation-two-grids.spec.ts` walks grids without
 * headers. The walks here were checked by screenshots only until DEV-3351: three captures each of the
 * `tab-navigation` and `shift-tab-navigation` visual specs (corner, last header, grid left) and one of
 * `navigable-headers` (the corner reached with the arrows), on every js variant and copied to the
 * three wrappers, all taken right after the key presses with nothing asserted.
 *
 * A focused header draws no selection border elements: its ring is the stylesheet's inset
 * `box-shadow` on `th.current`, in `--ht-cell-selection-border-color`, which is what the captures
 * showed around the corner and the last header. `expectRing()` reads it.
 */
test.describe('keyboard focus on the shared demo grid', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: SharedDemoGridPage;

  /**
   * Asserts the focused header draws its ring in the theme's selection border color.
   *
   * @param {string} overlay The overlay that paints the header on top.
   * @param {string} testId The header's test id.
   */
  async function expectRing(overlay: string, testId: string): Promise<void> {
    const ring = await grid.focusRing(overlay, testId);

    expect(ring.focused).toBe(true);
    expect(ring.boxShadow).toContain('inset');
    expect(ring.boxShadow).toContain('0px 0px 0px 1px');
    expect(ring.boxShadow).toContain(ring.ringColor);
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new SharedDemoGridPage(page, theme, bundle);
    await grid.goto();
  });

  test('Tab enters at the corner header, walks the column headers and leaves after the last one', async() => {
    await grid.press('Tab');

    // The first capture: the corner header focused, the grid holding the keyboard.
    expect(await grid.selected()).toEqual([[-1, -1, -1, -1]]);
    expect(await grid.focusState()).toMatchObject({ focusInGrid: true, listening: true });
    expect((await grid.drawnSelection()).current).toEqual(['corner']);
    await expectRing('ht_clone_top_inline_start_corner', 'corner');

    // Nine more presses walk the header row, one column a press, to its last header.
    for (let column = 0; column < 9; column++) {
      // eslint-disable-next-line no-await-in-loop
      await grid.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      expect(await grid.selected()).toEqual([[-1, column, -1, column]]);
    }

    // The second capture: "Country", the last column header, focused.
    expect((await grid.drawnSelection()).current).toEqual(['col-header-8']);
    await expectRing('ht_clone_top', 'col-header-8');

    // The third capture: the next press leaves the grid at the end of the header row (`autoWrapRow`
    // is off) and drops the selection, so nothing is drawn as selected any more.
    await grid.press('Tab');

    expect(await grid.selected()).toBeUndefined();
    expect(await grid.drawnSelection()).toEqual({ current: [], areas: 0, highlightedHeaders: 0 });
  });

  test('Shift+Tab enters at the last cell, walks back to its row header and leaves before it', async() => {
    await grid.press('Shift+Tab');

    // The first capture: the last cell of the last row focused.
    expect(await grid.selected()).toEqual([[99, 8, 99, 8]]);
    expect(await grid.focusState()).toMatchObject({ focusInGrid: true, listening: true });
    // The press scrolled the grid down to the last row, and the grid redraws on the scroll event a frame
    // later, so the drawn state is polled.
    await expect.poll(async() => (await grid.drawnSelection()).current).toEqual(['cell-99-8']);

    // Nine more presses walk the row back, one column a press, onto its row header.
    for (let column = 7; column >= -1; column--) {
      // eslint-disable-next-line no-await-in-loop
      await grid.press('Shift+Tab');
      // eslint-disable-next-line no-await-in-loop
      expect(await grid.selected()).toEqual([[99, column, 99, column]]);
    }

    // The second capture: the last row's header focused.
    await expect.poll(async() => (await grid.drawnSelection()).current).toEqual(['row-header-99']);
    await expectRing('ht_clone_inline_start', 'row-header-99');

    // The third capture: the next press leaves the grid and drops the selection.
    await grid.press('Shift+Tab');

    expect(await grid.selected()).toBeUndefined();
    expect(await grid.drawnSelection()).toEqual({ current: [], areas: 0, highlightedHeaders: 0 });
  });

  test('the arrow keys walk from the first cell onto its row header and on to the corner', async() => {
    await grid.cell(0, 0).click();

    expect(await grid.selected()).toEqual([[0, 0, 0, 0]]);

    await grid.press('ArrowLeft');

    expect(await grid.selected()).toEqual([[0, -1, 0, -1]]);
    expect((await grid.drawnSelection()).current).toEqual(['row-header-0']);

    // The capture: the corner focused, and nothing else drawn as selected.
    await grid.press('ArrowUp');

    expect(await grid.selected()).toEqual([[-1, -1, -1, -1]]);
    expect((await grid.drawnSelection()).current).toEqual(['corner']);
    await expectRing('ht_clone_top_inline_start_corner', 'corner');
  });
});

/**
 * Coming back with Tab into a grid that Tab left at the edge of the page. The exit above takes the focus
 * out of the document; the next Tab brings it back to the grid's first focus catcher, which should
 * select the header the walk left from: the grid's focus scope re-selects the last highlighted cell on
 * any re-entry, the first entry being the only one that starts at the corner. Untagged: headless Firefox
 * has no browser UI to move the focus to, so the focus never leaves its document and this case has no
 * Firefox counterpart.
 */
test.describe('keyboard focus returning to the shared demo grid', () => {
  // eslint-disable-next-line no-restricted-syntax -- DEV-3354: the grid's focus scope is never deactivated when the focus leaves the document, so re-entry selects nothing
  test.fixme('Tab brings the focus back into the grid it left at the edge of the page', async({
    page, theme, bundle,
  }) => {
    const grid = new SharedDemoGridPage(page, theme, bundle);

    await grid.goto();
    await grid.press('Tab', 11);

    expect(await grid.selected()).toBeUndefined();
    expect((await grid.focusState()).pageHasFocus).toBe(false);

    await grid.press('Tab');

    expect(await grid.selected()).toEqual([[-1, 8, -1, 8]]);
    await expect.poll(async() => (await grid.drawnSelection()).current).toEqual(['col-header-8']);
  });
});
