import { test, expect, THEMES_TAG, CROSS_BROWSER_TAG } from '../fixtures/test';
import { WebFontLoadPage } from '../fixtures/pages/WebFontLoadPage';

/**
 * DEV-199: a web font that loads after the grid has drawn makes text wider without resizing the grid's
 * container, so nothing re-measured the grid. A wrapped cell grew out of line with its row header and its
 * frozen-column neighbor, the grid kept its old height, and a column sized from its content clipped the
 * text. The grid now re-measures itself when the document finishes loading a font.
 */
test.describe('Web font loaded after the first draw', { tag: [THEMES_TAG, CROSS_BROWSER_TAG] }, () => {
  const expectAligned = async(grid: WebFontLoadPage) => {
    await expect.poll(async() => {
      const geometry = await grid.geometry();

      return {
        rowHeader: geometry.wrappedRowHeaderHeight === geometry.wrappedCellHeight,
        frozenCell: geometry.wrappedFrozenCellHeight === geometry.wrappedCellHeight,
        textFits: geometry.autoSizedTextWidth <= geometry.autoSizedCellWidth,
      };
    }).toEqual({ rowHeader: true, frozenCell: true, textFits: true });
  };

  ([
    ['a grid that follows its content', ''],
    ['a grid with a fixed height', '&height=1'],
    ['a grid with autoRowSize', '&auto=1'],
  ] as const).forEach(([name, variant]) => {
    test(`re-measures rows and columns in ${name}`, async({ page, theme, bundle }) => {
      const grid = new WebFontLoadPage(page, theme, bundle);

      await grid.goto(variant);
      await expectAligned(grid);

      const before = await grid.geometry();

      await grid.loadFont();

      // The font has to change the layout, or the test would pass without exercising anything.
      await expect.poll(async() => (await grid.geometry()).wrappedCellHeight).toBeGreaterThan(before.wrappedCellHeight);
      await expectAligned(grid);
      expect((await grid.geometry()).autoSizedCellWidth).toBeGreaterThan(before.autoSizedCellWidth);
    });
  });

  test('grows a grid that follows its content to the new table height', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.goto();

    const before = await grid.geometry();

    await grid.loadFont();

    await expect.poll(async() => {
      const { tableHeight, rootHeight } = await grid.geometry();

      return tableHeight > before.tableHeight && rootHeight >= tableHeight;
    }).toBe(true);
  });

  test('does not throw when a font loads after the grid is destroyed', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const errors: Error[] = [];

    page.on('pageerror', error => errors.push(error));

    await grid.goto();
    await grid.destroyGrid();
    await grid.loadFont();
    await grid.waitForFrames(5);

    expect(errors).toEqual([]);
  });
});
