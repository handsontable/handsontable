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

    // The root holds the whole table before the font loads, so the poll below can stay false only because
    // the grid did not grow.
    expect(before.rootHeight).toBeGreaterThanOrEqual(before.tableHeight);

    await grid.loadFont();

    await expect.poll(async() => {
      const { tableHeight, rootHeight } = await grid.geometry();

      return tableHeight > before.tableHeight && rootHeight >= tableHeight;
    }).toBe(true);
  });

  test('re-measures after a font load that was already in progress when the grid was created', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const releaseFontRequest = await grid.holdFontRequest();

    await grid.goto('&preload=1');

    // The grid was created while a load was in progress, so the `loading` event fired before it watched.
    expect(await grid.fontsStatus()).toBe('loading');
    await expectAligned(grid);

    const before = await grid.geometry();

    // The face joins the load in progress, so the document fires no new `loading` event for it.
    await grid.loadFont();
    releaseFontRequest();

    await expect.poll(async() => (await grid.geometry()).wrappedCellHeight).toBeGreaterThan(before.wrappedCellHeight);
    await expectAligned(grid);
    expect((await grid.geometry()).autoSizedCellWidth).toBeGreaterThan(before.autoSizedCellWidth);
  });

  test('re-measures a grid that was hidden when the font loaded once it is shown', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.goto();
    await expectAligned(grid);

    const before = await grid.geometry();

    // The columns were measured with the fallback font while the grid was shown, so they hold widths
    // that a later draw does not re-measure.
    await grid.setGridDisplayed(false);
    await grid.loadFont();
    await grid.setGridDisplayed(true);

    await expect.poll(async() => (await grid.geometry()).autoSizedCellWidth).toBeGreaterThan(before.autoSizedCellWidth);
    await expectAligned(grid);
  });

  test('waits once, not once a frame, for a grid whose root element skips its contents', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.trackIntersectionObservers();
    await grid.goto();
    await expectAligned(grid);

    const before = await grid.geometry();

    // `content-visibility: hidden` keeps the root element's box in the layout and skips the table inside
    // it, so an observer on the root element fires at once while the grid still reads as hidden. Re-arming
    // it from its own callback made the grid arm a new observer on every frame while it stayed hidden.
    await grid.setGridContentHidden(true);
    await grid.loadFont();
    await grid.waitForFrames(5);

    expect(await grid.intersectionObserveCalls()).toBe(1);

    // The one observer still fires once the grid is shown, which is the positive control for the count.
    await grid.setGridContentHidden(false);

    await expect.poll(async() => (await grid.geometry()).autoSizedCellWidth).toBeGreaterThan(before.autoSizedCellWidth);
    await expectAligned(grid);
    expect(await grid.intersectionObserveCalls()).toBe(1);
  });

  test('measures the first columns on screen at once and the rest in idle chunks', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // The no-wrap late-font text sits in columns C and F, on screen, and in the last of 40 columns, outside
    // a 600px wide grid. The grid has 25000 rows, so one chunk of AutoColumnSize's sweep (100000 cells)
    // measures the first four columns on screen, and column F waits with the columns off screen. The fixed
    // height keeps the grid from re-drawing after its first draw, which would cache the on-screen columns'
    // samples and let the chunk take them for free.
    const firstOnScreen = 2;
    const lateOnScreen = 5;
    const offScreen = 39;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);

    expect(await grid.lastRenderedColumn()).toBeGreaterThanOrEqual(lateOnScreen);

    const columns = [firstOnScreen, lateOnScreen, offScreen];
    const before = await Promise.all(columns.map(column => grid.columnWidth(column)));

    await grid.recordColumnWidthsAfterFontsLoad(columns);
    await grid.loadFont();

    // Measuring every column at once held the page for close to a second on a large grid, so the sweep takes
    // the columns on screen first and measures one chunk before the render that follows the font load. The
    // other columns wait for idle tasks, the ones on screen included: the forced render after the load used
    // to sample them over the whole row range, which cost as much as measuring everything at once.
    await expect.poll(async() => (await grid.recordedColumnWidths()).length).toBeGreaterThan(0);

    const [firstRender] = await grid.recordedColumnWidths();

    expect(firstRender[0]).toBeGreaterThan(before[0]);
    expect(firstRender.slice(1)).toEqual(before.slice(1));

    // The idle sweep reaches every column, and the text off screen fits once the grid scrolls there.
    await expect.poll(() => grid.columnWidth(lateOnScreen)).toBeGreaterThan(before[1]);
    await expect.poll(() => grid.columnWidth(offScreen)).toBeGreaterThan(before[2]);
    await grid.scrollToColumn(offScreen);
    expect(await grid.cellTextFits(3, offScreen)).toBe(true);
  });

  test('never drops a measured row height while autoRowSize re-measures', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // Past the 500 rows AutoRowSize measures at once, and above the rows on screen, so only the idle sweep
    // reaches it and its height decides where the rows on screen are drawn.
    const sweptRow = 1000;

    await grid.goto('&height=1&auto=1&many=1');
    await grid.scrollBelowRow(sweptRow);

    const heightBefore = await grid.rowHeight(sweptRow) ?? 0;

    expect(heightBefore).toBeGreaterThan(0);

    await grid.recordRowHeight(sweptRow);
    await grid.loadFont();

    // The wider font makes every wrapped row taller, so the sweep is done once this row is taller.
    await expect.poll(async() => await grid.rowHeight(sweptRow) ?? 0).toBeGreaterThan(heightBefore);

    // A dropped height cache drew the row at the default height until the sweep reached it, so every
    // row above the viewport shrank and the grid scrolled to other rows.
    const recorded = await grid.recordedRowHeights();

    expect(recorded.length).toBeGreaterThan(0);
    expect(recorded.filter(height => height === undefined || height < heightBefore)).toEqual([]);
  });

  test('stops watching font loads when the grid is destroyed', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const errors: Error[] = [];

    page.on('pageerror', error => errors.push(error));

    await grid.trackFontListeners();
    await grid.goto();

    // The grid watches the font set while it lives, so the count below can only drop because it stopped.
    expect(await grid.fontLoadingListeners()).toBe(1);

    await grid.destroyGrid();

    expect(await grid.fontLoadingListeners()).toBe(0);

    await grid.loadFont();
    await grid.waitForFrames(5);

    expect(errors).toEqual([]);
  });

  test('re-measures row header and nested header labels', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.goto('&headers=1');

    const before = await grid.headerGeometry();

    expect(before.rowLabel).toBeLessThanOrEqual(before.rowCell);
    expect(before.nestedLabel).toBeLessThanOrEqual(before.nestedCell);

    await grid.loadFont();

    // The labels get wider, and each header cell grows to hold its label again.
    await expect.poll(async() => {
      const after = await grid.headerGeometry();

      return {
        rowLabelGrew: after.rowLabel > before.rowLabel,
        rowLabelFits: after.rowLabel <= after.rowCell,
        nestedLabelGrew: after.nestedLabel > before.nestedLabel,
        nestedLabelFits: after.nestedLabel <= after.nestedCell,
      };
    }).toEqual({ rowLabelGrew: true, rowLabelFits: true, nestedLabelGrew: true, nestedLabelFits: true });
  });
});
