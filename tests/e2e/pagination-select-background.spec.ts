import { test, expect } from '../fixtures/test';
import { PaginationSelectPage } from '../fixtures/pages/PaginationSelectPage';

test.describe('pagination page-size select background', () => {
  // A native <select> clips its own background-color to a corner radius smaller than its
  // border-radius, leaving the rounded corners unfilled (DEV-42). The fix moves the fill onto
  // the wrapper <div> (which fills its corners) and makes the select's own background
  // transparent. These assertions pin that split; a screenshot could not, because the
  // ~4-corner delta falls under the reg-suit tolerance.
  test('the fill is on the wrapper, not the native select', async({ page, theme, bundle }) => {
    const paginationSelect = new PaginationSelectPage(page, theme, bundle);

    await paginationSelect.goto();

    // The select paints no background of its own.
    await expect(paginationSelect.select).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    // The wrapper carries the base input background token.
    const baseBackground = await paginationSelect.resolveToken('--ht-input-background-color');

    await expect(paginationSelect.selectWrapper).toHaveCSS('background-color', baseBackground);
  });

  test('hovering updates the wrapper fill to the hover token', async({ page, theme, bundle }) => {
    const paginationSelect = new PaginationSelectPage(page, theme, bundle);

    await paginationSelect.goto();
    await paginationSelect.selectWrapper.hover();

    const hoverBackground = await paginationSelect.resolveToken('--ht-input-hover-background-color');

    // Guard against a vacuous pass: if the token failed to resolve it would read as transparent,
    // and an unfixed wrapper (also transparent) would match it.
    expect(hoverBackground).not.toBe('rgba(0, 0, 0, 0)');
    await expect(paginationSelect.selectWrapper).toHaveCSS('background-color', hoverBackground);
  });
});
