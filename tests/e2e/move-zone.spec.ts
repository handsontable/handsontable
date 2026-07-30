import { test, expect } from '../fixtures/test';
import { SelectionFeaturesPage } from '../fixtures/pages/SelectionFeaturesPage';

/**
 * moveCells edge move bands (migrated from the frozen Jasmine walkontable
 * suite). The bands are thin overlays along each selection edge that show a
 * grab cursor and start a move drag on mousedown.
 */
test.describe('moveCells edge move bands', () => {
  let grid: SelectionFeaturesPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SelectionFeaturesPage(page, theme);
    await grid.goto();
  });

  test('renders four grab-cursor bands around the selection, below the resize pills', async () => {
    await grid.selectCells(1, 1, 3, 3);

    const bands = grid.visibleMoveZones();

    await expect(bands).toHaveCount(4);

    for (let index = 0; index < 4; index++) {
      // The grab cursor is the move affordance; z-index 100 keeps the bands
      // below the resize pills (z-index 200) where they overlap in corners.
      await expect(bands.nth(index)).toHaveCSS('cursor', 'grab');
      await expect(bands.nth(index)).toHaveCSS('z-index', '100');
    }
  });

  test('starts a move drag from each edge band and cancels on Escape', async ({ page }) => {
    for (let index = 0; index < 4; index++) {
      await grid.initGrid();
      await grid.selectCells(1, 1, 3, 3);

      const bands = grid.visibleMoveZones();

      await expect(bands).toHaveCount(4);

      const band = bands.nth(index);
      const box = await band.boundingBox();

      expect(box).not.toBeNull();

      // Pressing an edge band enters the move-drag state (ht__moving on the
      // grid's root wrapper); Escape cancels it and leaves the grid idle again.
      await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
      await page.mouse.down();

      await expect(grid.movingRoot()).toHaveCount(1);

      await page.keyboard.press('Escape');
      await page.mouse.up();

      await expect(grid.movingRoot()).toHaveCount(0);
    }
  });

  test('hides source move affordances while a drag preview is active', async ({ page }) => {
    await grid.selectCells(1, 1, 3, 3);
    await grid.hoverCell(2, 2);

    await expect(grid.visibleHandles()).toHaveCount(4);
    await expect(grid.visibleMoveZones()).toHaveCount(4);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + 10, box!.y + (box!.height / 2));
    await page.mouse.down();

    await expect(grid.movingRoot()).toHaveCount(1);
    await expect(grid.visibleHandles()).toHaveCount(0);
    await expect(grid.visibleMoveZones()).toHaveCount(0);

    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect(grid.movingRoot()).toHaveCount(0);
    await grid.hoverCell(2, 2);
    await expect(grid.visibleHandles()).toHaveCount(4);
    await expect(grid.visibleMoveZones()).toHaveCount(4);
  });

  test('removes the move preview when the grid is destroyed during a drag', async ({ page }) => {
    await grid.selectCells(1, 1, 3, 3);

    const box = await grid.visibleMoveZones().first().boundingBox();

    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + (box!.width / 2), box!.y + (box!.height / 2));
    await page.mouse.down();

    await expect(grid.movingRoot()).toHaveCount(1);
    await expect(grid.moveGhost()).toHaveCount(1);

    await grid.destroyGrid();

    await expect(grid.moveGhost()).toHaveCount(0);
    await expect(page.locator('body')).toHaveCSS('cursor', 'auto');
    await page.mouse.up();
  });

  test('moves visual source values without persisting valueGetter output', async () => {
    await grid.initGridWithValueGetter();

    await expect(grid.cell(0, 0)).toHaveText('Display: R2C2');
    await expect(grid.moveRange([0, 0, 0, 0], [2, 2])).resolves.toBe(true);

    expect(await grid.sourceCellValue(1, 0)).toBe(null);
    expect(await grid.sourceCellValue(2, 2)).toBe('R2C2');
    await expect(grid.cell(2, 2)).toHaveText('Display: R2C2');

    await grid.undo();

    expect(await grid.sourceCellValue(1, 0)).toBe('R2C2');
    expect(await grid.sourceCellValue(2, 2)).toBe('R3C3');

    await grid.redo();

    expect(await grid.sourceCellValue(1, 0)).toBe(null);
    expect(await grid.sourceCellValue(2, 2)).toBe('R2C2');
    await expect(grid.cell(2, 2)).toHaveText('Display: R2C2');
  });

  test('shows no move bands when moveCells is disabled', async () => {
    await grid.initGrid({ moveCells: false });
    await grid.selectCells(1, 1, 3, 3);

    // The selection renders, but no move affordance may be offered.
    await expect(grid.cell(1, 1)).toBeVisible();
    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });

  test('hides the bands when the selection is deselected', async () => {
    await grid.selectCells(1, 1, 3, 3);

    await expect(grid.visibleMoveZones()).toHaveCount(4);

    await grid.deselect();

    await expect(grid.visibleMoveZones()).toHaveCount(0);
  });
});
