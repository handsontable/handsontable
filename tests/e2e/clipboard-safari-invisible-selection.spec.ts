import { test, expect, CROSS_BROWSER_TAG } from '../fixtures/test';
import { OrdersGridPage } from '../fixtures/pages/OrdersGridPage';

/**
 * In Safari, CopyPaste makes the highlighted cell `contenteditable` and selects its content when the
 * pointer leaves the page body, so that the browser's own Copy command has a selection to copy. That
 * selection must never show, and the stylesheet paints it transparent through the `invisibleSelection`
 * class and the `data-ht-invisible-selection` attribute the helper adds. It showed in two places: on text
 * in a nested element, which WebKit does not apply an ancestor's `::selection` to (every header label, and
 * a cell whose renderer writes markup), and after a render, which rewrites the class list and drops the
 * class while the selection stays. A selection the user makes in a cell an application made editable is
 * not this one, and must keep showing.
 *
 * The header case follows the visual suite's `cross-browser/columns-filter` capture, whose WebKit render
 * showed the Country label selected on a nightly: filter Country by value and click OK, which leaves the
 * header highlighted. There the pointer then rests below a body as short as the grid, and WebKit reports
 * the `mouseleave` on a frame of its own choosing, before or after any given read. So the body fills the
 * window here (`fillWindowWithBody()`), the tests send the one `mouseleave` themselves
 * (`pointerLeavesBody()`, as `undo-gestures.spec.ts` does), and the cell is checked to be untouched
 * before the reference screenshot: a reference taken after the workaround ran would compare equal with
 * the bug in place. Only WebKit runs the workaround: on the other engines the first two tests pin that it
 * does not run, and their screenshots match there by construction.
 */
test.describe('the Safari copy selection', { tag: CROSS_BROWSER_TAG }, () => {
  let grid: OrdersGridPage;

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new OrdersGridPage(page, theme, bundle, 'off');
    await grid.goto();
    await grid.fillWindowWithBody();
  });

  test('is not painted on a highlighted column header, nor after the next render', async({ browserName }) => {
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
      await expect(header).toHaveAttribute('data-ht-invisible-selection');
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

  test('is not painted on a highlighted cell whose text sits in nested markup', async({ browserName }) => {
    const cell = grid.cell(0, 1);

    await grid.renderCellAsHtml(0, 1, 'Product <b>01</b>');
    await expect(cell.locator('b')).toHaveText('01');
    await cell.click();

    expect(await grid.selected()).toEqual([[0, 1, 0, 1]]);
    await expect(cell).not.toHaveAttribute('contenteditable');
    expect(await grid.nativeSelectionText()).toBe('');

    const before = await cell.screenshot();

    await grid.pointerLeavesBody();

    if (browserName === 'webkit') {
      await expect(cell).toHaveAttribute('data-ht-invisible-selection');
      expect(await grid.nativeSelectionText()).toContain('Product 01');
    } else {
      await expect(cell).not.toHaveAttribute('contenteditable');
    }

    expect((await cell.screenshot()).equals(before), 'the cell looks as it did before the pointer left')
      .toBe(true);
  });

  test('keeps the cell hidden from assistive technology across a render, until the pointer is back', async({ browserName }) => {
    const cell = grid.cell(0, 1);

    await cell.click();
    expect(await grid.selected()).toEqual([[0, 1, 0, 1]]);
    await expect(cell).not.toHaveAttribute('aria-hidden');

    await grid.pointerLeavesBody();

    if (browserName !== 'webkit') {
      // Only WebKit runs the workaround: nothing made the cell editable, so nothing has to hide it.
      await expect(cell).not.toHaveAttribute('contenteditable');
      await expect(cell).not.toHaveAttribute('aria-hidden');

      return;
    }

    await expect(cell).toHaveAttribute('contenteditable', 'true');
    await expect(cell).toHaveAttribute('aria-hidden', 'true');

    await grid.render();

    // The render keeps the cell editable. Without `aria-hidden` a screen reader reads it as an editable
    // region for as long as the pointer stays outside the body.
    await expect(cell).toHaveAttribute('contenteditable', 'true');
    await expect(cell).toHaveAttribute('aria-hidden', 'true');

    await grid.pointerEntersBody();

    await expect(cell).not.toHaveAttribute('contenteditable');
    await expect(cell).not.toHaveAttribute('aria-hidden');

    await grid.render();

    await expect(cell).not.toHaveAttribute('aria-hidden');
  });

  test('keeps a highlighted column header hidden from assistive technology across a render', async({ browserName }) => {
    const header = grid.header(6);

    await grid.keepSearchedValues('Country', 'India', ['India']);
    expect(await grid.selected()).toEqual([[-1, 6, -1, 6]]);

    await grid.pointerLeavesBody();

    if (browserName !== 'webkit') {
      await expect(header).not.toHaveAttribute('aria-hidden');

      return;
    }

    await expect(header).toHaveAttribute('contenteditable', 'true');
    await expect(header).toHaveAttribute('aria-hidden', 'true');

    await grid.render();

    await expect(header).toHaveAttribute('contenteditable', 'true');
    await expect(header).toHaveAttribute('aria-hidden', 'true');
  });

  test('leaves a selection painted in a cell a renderer made editable', async() => {
    const cell = grid.cell(1, 1);

    await grid.makeCellEditableInPlace(1, 1);
    await expect(cell).toHaveAttribute('contenteditable', 'true');

    const before = await cell.screenshot();

    await grid.selectCellText(1, 1);

    // The positive control: the text is selected, and nothing marked the selection as the workaround's.
    expect(await grid.nativeSelectionText()).toBe('Product 02');
    await expect(cell).not.toHaveAttribute('data-ht-invisible-selection');
    expect((await cell.screenshot()).equals(before), 'the selection shows on the cell').toBe(false);
  });
});
