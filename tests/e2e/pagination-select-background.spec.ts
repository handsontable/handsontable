import { test, expect } from '../fixtures/test';
import { PaginationSelectPage } from '../fixtures/pages/PaginationSelectPage';

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

test.describe('pagination page-size select background', () => {
  // A native <select> clips its own background-color to a corner radius smaller than its
  // border-radius, leaving the rounded corners unfilled (DEV-42). The fix moves the fill onto
  // the wrapper <div> (which fills its corners) and makes the select's own background
  // transparent. These assertions pin that split; a screenshot could not, because the
  // ~4-corner delta falls under the reg-suit tolerance.
  //
  // Note on the theme legs: no shipped theme differentiates the hover and focus background
  // tokens, so no leg separates those two states from each other - the value is that the wrapper
  // carries the correct token in each state. Only main differs the base token from hover/focus,
  // so it is the leg that separates the resting state from them. Horizon is the theme where the
  // artifact is visible even at rest, because its select base background differs from the
  // pagination bar background.
  test('the fill is on the wrapper, not the native select', async({ page, theme, bundle }) => {
    const paginationSelect = new PaginationSelectPage(page, theme, bundle);

    await paginationSelect.goto();

    // The select paints no background of its own.
    await expect(paginationSelect.select).toHaveCSS('background-color', TRANSPARENT);

    // The wrapper carries the base input background token. Guard against a vacuous pass: an
    // unresolved token would read as transparent, and an unfixed wrapper is transparent too.
    const baseBackground = await paginationSelect.resolveToken('--ht-input-background-color');

    expect(baseBackground).not.toBe(TRANSPARENT);
    await expect(paginationSelect.selectWrapper).toHaveCSS('background-color', baseBackground);

    // The whole approach rests on the wrapper and the select occupying the same box, so that a
    // hover anywhere on the wrapper is also a hover on the select.
    const { wrapper, select } = await paginationSelect.boxDimensions();

    expect(wrapper).toEqual(select);
  });

  test('hovering updates the wrapper fill to the hover token', async({ page, theme, bundle }) => {
    const paginationSelect = new PaginationSelectPage(page, theme, bundle);

    await paginationSelect.goto();
    await paginationSelect.selectWrapper.hover();

    const hoverBackground = await paginationSelect.resolveToken('--ht-input-hover-background-color');

    expect(hoverBackground).not.toBe(TRANSPARENT);
    await expect(paginationSelect.selectWrapper).toHaveCSS('background-color', hoverBackground);
  });

  test('focusing the select updates the wrapper fill to the focus token', async({ page, theme, bundle }) => {
    const paginationSelect = new PaginationSelectPage(page, theme, bundle);

    await paginationSelect.goto();
    // Focus the inner select; the wrapper fill is driven by :focus-within.
    await paginationSelect.select.focus();

    const focusBackground = await paginationSelect.resolveToken('--ht-input-focus-background-color');

    expect(focusBackground).not.toBe(TRANSPARENT);
    await expect(paginationSelect.selectWrapper).toHaveCSS('background-color', focusBackground);
  });
});
