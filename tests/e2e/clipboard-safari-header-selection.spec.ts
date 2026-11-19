import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { OrdersGridPage } from '../fixtures/pages/OrdersGridPage';

/**
 * In Safari, CopyPaste makes the highlighted cell `contenteditable` and selects its content when the
 * pointer leaves the page body, so that the browser's own Copy command has a selection to copy. That
 * selection must never show. On a column header it did: the rule that paints it transparent styled the
 * cell's own text, and a header label sits in a nested element, which WebKit does not apply an
 * ancestor's `::selection` to. A render also drops the `invisibleSelection` class the rule keyed on,
 * while the attribute and the selection stay, so the second comparison runs after one.
 *
 * The flow is the visual suite's `cross-browser/columns-filter` capture, whose WebKit render showed the
 * Country label selected on a nightly: filter Country by value and click OK, which leaves the header
 * highlighted. There the pointer then rests below a body as short as the grid, and WebKit reports the
 * `mouseleave` on a frame of its own choosing, before or after any given read. So the body fills the
 * window here (`fillWindowWithBody()`), the test sends the one `mouseleave` itself
 * (`pointerLeavesBody()`, as `undo-gestures.spec.ts` does), and the header is checked to be untouched
 * before the reference screenshot: a reference taken after the workaround ran would compare equal with
 * the bug in place. Only WebKit runs the workaround: on the other engines the test pins that it does not
 * run, and the screenshots match there by construction.
 */
test.describe('the Safari copy selection on a highlighted column header', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: OrdersGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new OrdersGridPage(page, theme, bundle, 'off');
    await grid.goto();
    await grid.fillWindowWithBody();
  });

  test('is not painted when the pointer leaves the page, nor after the next render', async({ browserName }) => {
    // Column 6 is Country.
    const header = grid.header(6);

    await grid.keepSearchedValues('Country', 'India', ['India']);

    await expect(header).toHaveClass(/\bhtFiltersActive\b/);
    // The menu leaves the header itself selected, so it is the highlighted cell the workaround selects.
    expect(await grid.selected()).toEqual([[-1, 6, -1, 6]]);
    // Nothing has selected the label yet, so the reference below shows the header without it.
    await expect(header).not.toHaveAttribute('contenteditable');
    expect(await grid.nativeSelectionText()).toBe('');

    const before = await header.screenshot();

    await grid.pointerLeavesBody();

    if (browserName === 'webkit') {
      // The positive control: the workaround ran on this header, so the Copy command has its selection.
      await expect(header).toHaveAttribute('contenteditable', 'true');
      expect(await grid.nativeSelectionText()).toContain('Country');
    } else {
      await expect(header).not.toHaveAttribute('contenteditable');
    }

    expect((await header.screenshot()).equals(before), 'the header looks as it did before the pointer left')
      .toBe(true);

    await grid.render();

    expect((await header.screenshot()).equals(before), 'the header looks as it did after a render too')
      .toBe(true);
  });
});
