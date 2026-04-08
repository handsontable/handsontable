// Scroll helpers for performance scenarios -- scrollViewportTo + deterministic
// wait for the viewport to settle (no arbitrary timeouts).

/**
 * Scroll the grid to the given row and wait until it is renderable.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} row -- visual row index to scroll to
 */
export async function scrollToRow(page, row) {
  await page.evaluate((r) => {
    /** @type {any} */ (window).__hot.scrollViewportTo({ row: r, col: 0 });
  }, row);

  await page.waitForFunction((r) => {
    const hot = /** @type {any} */ (window).__hot;

    return hot.rowIndexMapper.getRenderableFromVisualIndex(r) !== null;
  }, row);
}

/**
 * Scroll the grid to the given column and wait until it is renderable.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} col -- visual column index to scroll to
 */
export async function scrollToColumn(page, col) {
  await page.evaluate((c) => {
    /** @type {any} */ (window).__hot.scrollViewportTo({ row: 0, col: c });
  }, col);

  await page.waitForFunction((c) => {
    const hot = /** @type {any} */ (window).__hot;

    return hot.columnIndexMapper.getRenderableFromVisualIndex(c) !== null;
  }, col);
}
