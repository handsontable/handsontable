import { test, expect } from '../fixtures/test';
import { RootSizeOptionsPage } from '../fixtures/pages/RootSizeOptionsPage';

/**
 * The grid `width` / `height` options: the value set they accept, what each value writes on the
 * root element, and which element then scrolls each axis. `height: 'auto'` is the breaking piece:
 * it writes inline `height: auto` and nothing else, so the grid behaves like a plain block element
 * (the page scrolls it, the rows stay virtualized) instead of clipping itself and rendering every
 * row.
 */
test.describe('root size options', () => {
  let grid: RootSizeOptionsPage;

  test.beforeEach(async ({ page, theme, bundle }) => {
    grid = new RootSizeOptionsPage(page, theme, bundle);
    await grid.goto();
  });

  test.describe('`height: "auto"`', () => {
    test('writes `height: auto` only and leaves both axes to the window', async () => {
      const root = await grid.rootState();
      const owners = await grid.axisOwners();

      expect(root.height).toBe('auto');
      expect(root.overflow).toBe('');
      expect(root.overflowX).toBe('');
      expect(root.overflowY).toBe('');
      expect(root.computedOverflowX).toBe('visible');
      expect(root.computedOverflowY).toBe('visible');
      expect(owners.verticalByWindow).toBe(true);
      expect(owners.horizontalByWindow).toBe(true);
    });

    test('virtualizes the rows the same way an unset height does', async () => {
      const autoRows = await grid.renderedRows();

      await grid.rebuild({ height: undefined });

      const unsetRows = await grid.renderedRows();

      expect(autoRows).toBeGreaterThan(0);
      expect(autoRows).toBeLessThan(200);
      expect(autoRows).toBe(unsetRows);
    });

    test('beats a stylesheet height on the root', async () => {
      await grid.rebuild({ height: 'auto' }, 'css-host');

      const rootBox = await grid.rootBox();

      // `.ht-wrapper { height: 100% }` would fill the 400px host; the inline `auto` lets the grid
      // grow to its rows instead.
      expect(rootBox.height).toBeGreaterThan(400);
      expect((await grid.axisOwners()).verticalByWindow).toBe(true);
    });

    test('clips the horizontal axis only with a definite width, and keeps every column reachable', async () => {
      await grid.rebuild({ height: 'auto', width: 500 });

      const root = await grid.rootState();
      const owners = await grid.axisOwners();
      const extents = await grid.scrollExtents();

      expect(root.overflowX).toBe('clip');
      expect(root.overflowY).toBe('');
      expect(root.overflow).toBe('');
      expect(owners.horizontalByWindow).toBe(false);
      expect(owners.verticalByWindow).toBe(true);
      expect(extents.holderScrollWidth).toBeGreaterThan(extents.holderClientWidth);
      expect(await grid.renderedRows()).toBeLessThan(200);

      await grid.scrollHolderBy(2000);

      await expect(grid.cell(3, 11)).toBeVisible();
    });

    test('clips nothing with a relative or a `var()` width', async () => {
      await grid.rebuild({ height: 'auto', width: '100%' });

      let root = await grid.rootState();

      expect(root.width).toBe('100%');
      expect(root.overflowX).toBe('');
      expect((await grid.axisOwners()).horizontalByWindow).toBe(true);

      await grid.rebuild({ height: 'auto', width: 'var(--grid-width)' }, 'half-var');

      root = await grid.rootState();

      expect(root.width).toBe('var(--grid-width)');
      expect(root.overflowX).toBe('');
      expect(root.computedOverflowX).toBe('visible');
      expect((await grid.axisOwners()).horizontalByWindow).toBe(true);
    });

    test('fills a bounded parent and scrolls inside it', async () => {
      await grid.rebuild({ height: 'auto' }, 'bounded');

      const owners = await grid.axisOwners();
      const extents = await grid.scrollExtents();

      // The accepted deviation from a plain block: inside a fixed-height `overflow: auto` parent
      // the engine sizes the holder to the parent and scrolls internally rather than growing past it.
      expect(owners.verticalByWindow).toBe(false);
      expect(extents.holderScrollHeight).toBeGreaterThan(extents.holderClientHeight);
      expect(extents.parentScrollHeight).toBeLessThanOrEqual(extents.parentClientHeight + 1);
      expect(await grid.renderedRows()).toBeLessThan(200);
    });

    test('flips the clip and the scroll owner both ways through `updateSettings()`', async () => {
      await grid.rebuild({ height: 300 });

      expect((await grid.rootState()).overflow).toBe('clip');
      expect((await grid.axisOwners()).verticalByWindow).toBe(false);

      await grid.updateSettings({ height: 'auto' });

      let root = await grid.rootState();

      expect(root.height).toBe('auto');
      expect(root.overflow).toBe('');
      expect((await grid.axisOwners()).verticalByWindow).toBe(true);
      expect(await grid.renderedRows()).toBeLessThan(200);

      await grid.updateSettings({ height: 300 });

      root = await grid.rootState();

      expect(root.height).toBe('300px');
      expect(root.overflow).toBe('clip');
      expect((await grid.axisOwners()).verticalByWindow).toBe(false);
      expect((await grid.rootBox()).height).toBe(300);
    });

    test('shows every option of a dropdown editor on the last row (#8688)', async ({ page }) => {
      const options = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
      const rows = Array.from({ length: 30 }, (_, r) => [`R${r + 1}`, options[r % options.length]]);

      await grid.rebuild({
        height: 'auto',
        data: rows,
        colWidths: 120,
        columns: [{}, { type: 'dropdown', source: options }],
      });

      // Open through the keyboard: a centred click on a dropdown cell can land on its arrow and
      // open the list by itself, so the Enter would then close it.
      await page.evaluate(() => window.hot.selectCell(29, 1));
      await page.keyboard.press('Enter');

      const list = page.locator('.handsontableEditor .ht_master');
      const optionCells = list.locator('tbody td');

      await expect(list).toBeVisible();
      await expect(optionCells).toHaveCount(options.length);

      for (let i = 0; i < options.length; i++) {
        await expect(optionCells.nth(i)).toBeInViewport();
      }

      const listBox = await grid.box(list);
      const viewportHeight = await page.evaluate(() => window.innerHeight);

      expect(listBox.y + listBox.height).toBeLessThanOrEqual(viewportHeight);
    });
  });

  test.describe('sized values', () => {
    test('writes a number and the pixel strings as pixels and clips both axes', async () => {
      for (const height of [300, '300', '300px']) {
        await grid.rebuild({ height });

        const root = await grid.rootState();

        expect(root.height).toBe('300px');
        expect(root.overflow).toBe('clip');
        expect(root.computedOverflowY).toBe('clip');
        expect((await grid.axisOwners()).verticalByWindow).toBe(false);
        expect((await grid.rootBox()).height).toBe(300);
        expect(await grid.renderedRows()).toBeLessThan(30);
      }
    });

    test('passes a percentage and a `calc()` through as written', async () => {
      await grid.rebuild({ height: '50%' }, 'css-host');

      let root = await grid.rootState();

      expect(root.height).toBe('50%');
      expect(root.overflow).toBe('clip');
      expect((await grid.rootBox()).height).toBe(200);

      await grid.rebuild({ height: 'calc(100% - 100px)' }, 'css-host');

      root = await grid.rootState();

      expect(root.height).toMatch(/^calc\(/);
      expect(root.overflow).toBe('clip');
      expect((await grid.rootBox()).height).toBe(300);
    });
  });

  test.describe('unreadable values', () => {
    for (const value of ['abc', '', -100, 'min-content', true]) {
      test(`ignores \`${JSON.stringify(value)}\` with one warning and keeps the height`, async () => {
        await grid.rebuild({ height: 300 });
        grid.collectWarnings();

        await grid.updateSettings({ height: value });
        await grid.updateSettings({ height: value });

        const root = await grid.rootState();

        expect(root.height).toBe('300px');
        expect(root.overflow).toBe('clip');
        expect((await grid.rootBox()).height).toBe(300);

        await expect.poll(() => grid.sizeWarnings()).toHaveLength(1);
        expect(grid.sizeWarnings()[0]).toContain('`height` option');
        expect(grid.sizeWarnings()[0]).toContain(typeof value === 'string' ? `"${value}"` : String(value));
      });
    }

    test('ignores a collapsing keyword for `width` with one warning', async () => {
      await grid.rebuild({ height: 300, width: 500 });
      grid.collectWarnings();

      await grid.updateSettings({ width: 'inherit' });

      const root = await grid.rootState();

      expect(root.width).toBe('500px');
      expect((await grid.rootBox()).width).toBe(500);

      await expect.poll(() => grid.sizeWarnings()).toHaveLength(1);
      expect(grid.sizeWarnings()[0]).toContain('`width` option');
      expect(grid.sizeWarnings()[0]).toContain('"inherit"');
    });

    test('leaves no clip behind an unreadable value on a grid without a height', async () => {
      grid.collectWarnings();
      await grid.rebuild({ height: 'abc' });

      const root = await grid.rootState();

      expect(root.height).toBe('');
      expect(root.overflow).toBe('');
      expect((await grid.axisOwners()).verticalByWindow).toBe(true);
      await expect.poll(() => grid.sizeWarnings()).toHaveLength(1);
    });
  });

  test.describe('`null`', () => {
    test('resets one axis and keeps the other', async () => {
      await grid.rebuild({ height: 300, width: 500 });

      await grid.updateSettings({ height: null });

      let root = await grid.rootState();

      expect(root.height).toBe('');
      expect(root.width).toBe('500px');
      expect(root.overflowX).toBe('clip');
      expect(root.overflowY).toBe('');
      expect((await grid.axisOwners()).verticalByWindow).toBe(true);
      expect((await grid.axisOwners()).horizontalByWindow).toBe(false);

      await grid.updateSettings({ width: null });

      root = await grid.rootState();

      expect(root.width).toBe('');
      expect(root.overflowX).toBe('');
      expect((await grid.axisOwners()).horizontalByWindow).toBe(true);
    });
  });
});
