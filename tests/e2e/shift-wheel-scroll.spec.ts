import { test, expect } from '../fixtures/test';
import { CloneHolderScrollPage } from '../fixtures/pages/CloneHolderScrollPage';

/**
 * DEV-3279: holding Shift while wheeling vertically pans the grid horizontally.
 *
 * The grid scrolls from the wheel event and then consumes it, so the browser's own Shift ->
 * horizontal conversion (which some browsers run only as the default action of the event) never
 * happens. The grid has to make the conversion itself. Driven with real wheel input over the
 * element-scrolled grid of the clone-holder fixture.
 */
test.describe('Shift + mouse wheel', () => {
  let grid: CloneHolderScrollPage;

  /**
   * Wheels over a body cell of the master, optionally with Shift held.
   */
  async function wheel(deltaX: number, deltaY: number, shift = false): Promise<void> {
    const { page } = grid;
    const box = await page.locator('.ht_master > .wtHolder').boundingBox();

    if (!box) {
      throw new Error('The master holder is not rendered');
    }

    await page.mouse.move(box.x + (box.width / 2), box.y + (box.height / 2));

    if (shift) {
      await page.keyboard.down('Shift');
    }

    try {
      await page.mouse.wheel(deltaX, deltaY);
    } finally {
      if (shift) {
        await page.keyboard.up('Shift');
      }
    }
  }

  test.beforeEach(async({ page, theme, bundle }) => {
    grid = new CloneHolderScrollPage(page, theme, bundle);
    await grid.goto('element');
  });

  test('scrolls the columns, not the rows, for a vertical wheel while Shift is held', async() => {
    await wheel(0, 200, true);

    // The exact distance: "moved more than zero" cannot see a doubled or halved scroll.
    await expect.poll(async() => (await grid.offsets()).master.left).toBe(200);
    expect((await grid.offsets()).master.top).toBe(0);
  });

  test('keeps scrolling the rows for a vertical wheel without Shift', async() => {
    await wheel(0, 200);

    await expect.poll(async() => (await grid.offsets()).master.top).toBeGreaterThan(0);
    expect((await grid.offsets()).master.left).toBe(0);
  });

  test('keeps scrolling the columns for a horizontal wheel', async() => {
    await wheel(200, 0);

    await expect.poll(async() => (await grid.offsets()).master.left).toBeGreaterThan(0);
    expect((await grid.offsets()).master.top).toBe(0);
  });
});
