import { type Page, type Locator } from '@playwright/test';

/**
 * Pointer gestures shared by page objects.
 *
 * Playwright has no drag primitive, so a drag has to be spelled out with `mouse` calls. Keeping the
 * spelling in one place means a later fix to the gesture cannot land in one page object and be
 * missed in another, where the stale copy would keep passing until the geometry shifts.
 */

/**
 * Drags a resize handle by a delta, the way a user drags it. The caller reveals the handle first
 * (both resize plugins attach theirs on `mouseover` over a header) and passes it in, because how a
 * grid is addressed differs per fixture while the gesture does not.
 *
 * @param {Page} page The page the handle lives on.
 * @param {Locator} handle The resize handle to drag.
 * @param {object} delta How far to drag, in CSS pixels. Omitted axes do not move.
 * @param {number} [delta.x] The horizontal distance, for a column resize.
 * @param {number} [delta.y] The vertical distance, for a row resize.
 */
export async function dragResizeHandle(
  page: Page, handle: Locator, delta: { x?: number, y?: number }
): Promise<void> {
  const box = await handle.boundingBox();

  if (!box) {
    throw new Error('The resize handle has no layout box.');
  }

  const startX = box.x + (box.width / 2);
  const startY = box.y + (box.height / 2);
  const deltaX = delta.x ?? 0;
  const deltaY = delta.y ?? 0;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Several moves, because the plugins track the drag through `mousemove` and a single jump can be
  // swallowed as a click.
  await page.mouse.move(startX + (deltaX / 2), startY + (deltaY / 2));
  await page.mouse.move(startX + deltaX, startY + deltaY);
  await page.mouse.up();
}

/**
 * Drags the autofill fill handle onto a target cell and releases, the way a user drag-fills. The
 * caller selects the range first (that is what draws the handle) and passes both elements in,
 * because how a grid is addressed differs per fixture while the gesture does not.
 *
 * @param {Page} page The page the handle lives on.
 * @param {Locator} handle The fill handle to drag.
 * @param {Locator} target The cell to drag onto.
 */
export async function dragFillHandle(page: Page, handle: Locator, target: Locator): Promise<void> {
  const handleBox = await handle.boundingBox();
  const targetBox = await target.boundingBox();

  if (!handleBox || !targetBox) {
    throw new Error('The fill handle or the target cell is not rendered.');
  }

  await page.mouse.move(handleBox.x + (handleBox.width / 2), handleBox.y + (handleBox.height / 2));
  await page.mouse.down();
  // Several moves, because the plugin counts drag steps through `mousemove` and `beforeOnCellMouseOver`.
  await page.mouse.move(targetBox.x + (targetBox.width / 2), targetBox.y + (targetBox.height / 2), { steps: 8 });
  await page.mouse.up();
}
