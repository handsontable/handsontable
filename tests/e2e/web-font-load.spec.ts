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
    // a 1200px wide grid. The grid has 25000 rows, so one chunk of AutoColumnSize's sweep (100000 cells)
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

    // The idle sweep reaches every column and draws the grid again, so column F fits its text without any
    // further interaction, and the text off screen fits once the grid scrolls there.
    await expect.poll(() => grid.cellTextFits(3, lateOnScreen)).toBe(true);
    await expect.poll(() => grid.columnWidth(offScreen)).toBeGreaterThan(before[2]);
    await grid.scrollToColumn(offScreen);
    expect(await grid.cellTextFits(3, offScreen)).toBe(true);
  });

  test('measures a frozen column with the columns on screen after a sideways scroll', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // Column A is frozen, and its no-wrap late-font text sits in A4. Scrolled to column 20, the master table's
    // rendered range starts past it, so only the frozen band puts it on screen.
    const frozen = 0;
    const offScreen = 39;

    await grid.goto('&wide=1&height=1');
    await grid.scrollToColumn(20);

    const before = [await grid.columnWidth(frozen), await grid.columnWidth(offScreen)];

    await grid.recordColumnWidthsAfterFontsLoad([frozen, offScreen]);
    await grid.loadFont();

    // The first chunk takes the frozen column with the rendered ones, so the render that follows the font
    // load already has it re-measured, while the last column waits for an idle task.
    await expect.poll(async() => (await grid.recordedColumnWidths()).length).toBeGreaterThan(0);

    const [firstRender] = await grid.recordedColumnWidths();

    expect(firstRender[0]).toBeGreaterThan(before[0]);
    expect(firstRender[1]).toBe(before[1]);
    await expect.poll(() => grid.cellTextFits(3, frozen)).toBe(true);
  });

  test('samples a column edited while the font re-measure runs instead of reusing its cached samples', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // A column off screen, which the sweep reaches only in an idle task, long after the edit below.
    const edited = 30;
    const longValue = 'A value far longer than every other one in this column';

    await grid.goto('&wide=1&height=1');

    const before = await grid.columnWidth(edited);

    await grid.recordColumnWidthBeforeRenders(edited);
    await grid.editDuringFontsLoad(0, edited, longValue);
    await grid.loadFont();
    await grid.waitForFontSweepAfterEdit();

    // The sweep's own render at its end already asks for the width of the edited value: the column was
    // sampled again, not measured from the samples cached before the edit. The queued refresh that runs
    // inside that render would have corrected it only afterwards.
    const widths = await grid.recordedBeforeRenderWidths();

    expect(widths.length).toBeGreaterThan(0);
    expect(widths[widths.length - 1]).toBeGreaterThan(before);
    await grid.scrollToColumn(edited);
    expect(await grid.cellTextFits(0, edited)).toBe(true);
  });

  test('draws nothing inside the afterFontsLoad hook', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.goto('&height=1');
    await expectAligned(grid);

    const before = await grid.geometry();

    // A draw inside the hook runs before the other plugins and the user's own listeners have re-measured,
    // and the grid draws again right after the hook anyway. On a small grid the first chunk ends the sweep,
    // which used to draw once more from inside the hook.
    await grid.countRendersInsideFontsLoadHook();
    await grid.loadFont();

    await expect.poll(() => grid.rendersInsideFontsLoadHook()).not.toBeNull();
    expect(await grid.rendersInsideFontsLoadHook()).toBe(0);

    // The draw that follows the hook still carries the re-measure, which is the positive control.
    await expect.poll(async() => (await grid.geometry()).autoSizedCellWidth).toBeGreaterThan(before.autoSizedCellWidth);
    await expectAligned(grid);
  });

  test('re-measures a column whose cell meta changed while the font re-measure runs on the next draw', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // A column on screen whose cells hold plain numbers, so the font alone does not widen it. The class adds
    // padding to one of its cells, so the column has to grow on the draw that follows the change.
    const column = 3;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);

    const before = await grid.columnWidth(column);

    await grid.recordColumnWidthsAfterFontsLoad([column]);
    await grid.setCellMetaDuringFontsLoad(0, column, 'className', 'ht-wide-cell');
    await grid.loadFont();

    // Without a font re-measure in progress, the draw after a meta change re-measures the columns on screen.
    // The sweep used to hold that off until its own last draw, half a second or more on a large grid.
    await expect.poll(async() => (await grid.recordedColumnWidths()).length).toBeGreaterThan(0);

    const [firstRender] = await grid.recordedColumnWidths();

    expect(firstRender[0]).toBeGreaterThan(before);
  });

  test('re-measures a column whose source data changed while the font re-measure runs on the next draw', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // A column on screen whose cells hold plain numbers, so the font alone does not widen it.
    const column = 3;
    const longValue = 'A value far longer than every other one in this column';

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);

    const before = await grid.columnWidth(column);

    await grid.recordColumnWidthsAfterFontsLoad([column]);
    await grid.setSourceDataDuringFontsLoad(0, column, longValue);
    await grid.loadFont();

    // A source write drops every cached sample and relies on the next draw to re-walk the columns on
    // screen, which the sweep in progress used to hold off until its own last draw.
    await expect.poll(async() => (await grid.recordedColumnWidths()).length).toBeGreaterThan(0);

    const [firstRender] = await grid.recordedColumnWidths();

    expect(firstRender[0]).toBeGreaterThan(before);
  });

  test('draws after an idle chunk only when it changed a width on screen', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.goto('&wide=1&height=1');
    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);

    // The hook fires for every font the document loads, used by the grid or not. With the samples of the
    // first 21 columns gone, the columns on screen (at least six, at 25000 rows) take two chunks, so the
    // second one measures columns on screen from an idle task and finds every width unchanged, and it is not
    // the last chunk either. Only the draw at the end remains.
    expect(await grid.lastRenderedColumn()).toBeGreaterThanOrEqual(5);
    await grid.dropSamplesOfColumns(Array.from({ length: 21 }, (_, column) => column));

    expect(await grid.runFontsLoadHookCountingRenders()).toEqual({ sweepInProgress: true, gridVisible: true });
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);
    expect(await grid.renderCount()).toBe(1);
  });

  test('stops measuring while the grid is hidden and finishes once it is shown again', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const offScreen = 39;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);

    const before = await grid.columnWidth(offScreen);

    // The grid is hidden right after the sweep started, so every idle chunk would measure inside a hidden
    // root, read a width of zero, and write the minimum width for the column.
    await grid.hideGridDuringFontsLoad();
    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);

    await grid.setGridDisplayed(true);
    await grid.render();

    await expect.poll(() => grid.columnWidth(offScreen)).toBeGreaterThan(before);
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);
    await grid.scrollToColumn(offScreen);
    expect(await grid.cellTextFits(3, offScreen)).toBe(true);
  });

  test('re-measures once shown when a listener hides the grid after the sweep measured it', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // C4 does not wrap and its column is sized from its content. The grid has four columns, so the sweep
    // ends in the chunk run inside the hook, before the listener hides the grid.
    const column = 2;

    await grid.goto();
    await expectAligned(grid);

    const before = await grid.columnWidth(column);

    // The listener runs after the plugins' own. The render that follows the hook used to measure the
    // columns on screen inside the hidden root, wrote the minimum width for each, and nothing measured
    // them again once the grid was shown.
    await grid.hideGridDuringFontsLoad();
    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);

    await grid.setGridDisplayed(true);

    await expect.poll(() => grid.cellTextFits(3, column)).toBe(true);
    expect(await grid.columnWidth(column)).toBeGreaterThan(before);
  });

  test('keeps a re-measure owed by a hidden grid through a calculateAllColumnsWidth() call', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const offScreen = 39;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);

    const before = await grid.columnWidth(offScreen);

    await grid.hideGridDuringFontsLoad();
    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);

    // The call measures only the columns that have no width, so it cannot pay the re-measure the hidden
    // grid owes. It used to clear the debt, and the off-screen columns kept the fallback-font widths.
    await grid.setGridDisplayed(true);
    await grid.calculateAllColumnsWidth();
    await grid.render();

    await expect.poll(() => grid.columnWidth(offScreen)).toBeGreaterThan(before);
  });

  test('re-measures the columns a sweep already measured on a draw after a style change', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // A column on screen whose cells hold plain numbers, so the font alone does not widen it, and which the
    // sweep's first chunk measures (the columns on screen come first).
    const column = 3;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);

    const before = await grid.columnWidth(column);

    // The class widens every cell and lands after the first chunk measured the column, before the draw that
    // follows the hook. That draw used to leave every on-screen column to the sweep, and so did the sweep's
    // last one, so the column kept the width it had before the class until some later draw.
    await grid.addBodyClassDuringFontsLoad('ht-wide-cells');
    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);

    // The class adds 100px of padding, more than the column had before.
    expect(before).toBeLessThan(100);
    expect(await grid.columnWidth(column)).toBeGreaterThan(100);
  });

  test('finishes the sweep while source writes keep coming', async({ page, theme, bundle }) => {
    test.setTimeout(60000);

    const grid = new WebFontLoadPage(page, theme, bundle);
    // On screen, past the first chunk, with the no-wrap late-font text.
    const onScreen = 5;
    const maxWrites = 200;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);
    await grid.measureOneColumnPerChunk();

    // A write lands after every chunk. Each one used to end the sweep and start it over from the first
    // column on the next draw, so the sweep never got past its second column for as long as writes came.
    await grid.streamSourceWritesDuringFontsLoad(maxWrites);
    await grid.loadFont();
    await expect.poll(() => grid.writeStreamEnd(), { timeout: 45000 }).not.toBeNull();

    const end = await grid.writeStreamEnd();

    expect(end?.reason).toBe('sweepEnded');
    // The writes are the positive control: the sweep ran under the stream, not after it.
    expect(end?.writes).toBeGreaterThan(5);
    expect(await grid.cellTextFits(3, onScreen)).toBe(true);
  });

  test('measures every column on screen on an application render while the sweep runs', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // On screen, past the first chunk, with the no-wrap late-font text.
    const onScreen = 5;

    await grid.goto('&wide=1&height=1');
    await expectAligned(grid);
    await grid.measureOneColumnPerChunk();

    // Only the sweep's own draws leave the columns it has not reached to it. A render the application asks
    // for measures them as it would with no sweep, so the screen does not depend on idle tasks, which a busy
    // page (a stream of writes on a large grid) never gets to.
    await grid.renderAfterFontsLoadDraw(3, onScreen);
    await grid.loadFont();
    await expect.poll(() => grid.renderAfterFontsLoadDrawResult()).not.toBeNull();

    // The draw after the hook left the column to the sweep, which is the positive control.
    expect(await grid.renderAfterFontsLoadDrawResult()).toEqual({ fitsBefore: false, fitsAfter: true, sweepInProgress: true });
  });

  test('runs a listener added with the default order before the sizing plugins re-measure', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // The column whose late-font text the re-measure widens.
    const column = 2;

    await grid.goto('&height=1');
    await expectAligned(grid);

    const before = await grid.columnWidth(column);

    // A listener in the settings object, or one added later with the default order, is where an application
    // drops a custom renderer's cached sizes. It used to run after the plugins had measured.
    await grid.recordStateInDefaultOrderFontsListener(column);
    await grid.loadFont();
    await expect.poll(() => grid.defaultOrderListenerState()).not.toBeNull();

    expect(await grid.defaultOrderListenerState()).toEqual({ width: before, sweepInProgress: false });
    // The positive control: the plugins still re-measured after the listener.
    await expect.poll(() => grid.columnWidth(column)).toBeGreaterThan(before);
  });

  test('re-measures a merge whose text the font widened', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);

    await grid.goto('&merge=1&height=1');
    await expectAligned(grid);
    expect(await grid.cellTextFits(4, 2)).toBe(true);

    // On a large grid the first load after init samples every column afresh: the init sweep drops its
    // samples. A column measured from cached samples to another width reports a style change, so dropping
    // every column's samples sets up that case on a small grid.
    await grid.dropSamplesOfColumns([0, 1, 2, 3]);
    await grid.loadFont();
    await expectAligned(grid);

    // No column reported a style change, and the merge used to keep the width measured in the fallback font,
    // which clipped its text.
    await expect.poll(() => grid.cellTextFits(4, 2)).toBe(true);
  });

  test('measures the rows again once the column re-measure ends', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // Row 300 wraps the late-font text of column AN, which the column sweep widens in its last chunk.
    const row = 300;
    const oneLineRow = 3;

    await grid.goto('&wide=1&height=1&auto=1');
    await expectAligned(grid);

    const columnBefore = await grid.columnWidth(39);

    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);

    // AutoRowSize measured row 300 while column AN still had its fallback-font width, so the text wrapped
    // onto a second line, and the draws that followed measured only the rows on screen. AutoRowSize's own
    // idle sweep over the rows past 500 can take long (Firefox), and row 300 is not part of it.
    await expect.poll(async() => {
      const [rowHeight, oneLineHeight] = await Promise.all([grid.rowHeight(row), grid.rowHeight(oneLineRow)]);

      return rowHeight === oneLineHeight;
    }).toBe(true);
    // The positive control: the column the row wraps in did widen.
    expect(await grid.columnWidth(39)).toBeGreaterThan(columnBefore);
  });

  test('re-measures the headers of a grid that had no rows when the font loaded once rows come back', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const offScreen = 39;

    await grid.goto('&wide=1&height=1&longheader=1');
    await grid.removeAllRows();
    await grid.trackFontsLoadHook();
    await grid.loadFont();
    await expect.poll(() => grid.fontsLoadHookRan()).toBe(true);

    // With no rows the widths stay, since they can come from rows the grid had before. The re-measure is
    // owed to the first draw with rows, and the column off screen used to keep the fallback-font width.
    await grid.addRows(5);
    await expect.poll(() => grid.sweepInProgress('autoColumnSize')).toBe(false);
    await grid.scrollToColumn(offScreen);

    expect(await grid.columnHeaderFits(offScreen)).toBe(true);
  });

  test('holds the row re-measure while the grid has no columns', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    // A wrapped row far below the screen, which only a full sweep measures.
    const sweptRow = 2000;

    await grid.goto('&height=1&auto=1&many=1');
    await expect.poll(() => grid.sweepInProgress('autoRowSize')).toBe(false);

    const heightBefore = await grid.rowHeight(sweptRow) ?? 0;

    expect(heightBefore).toBeGreaterThan(0);

    // A font that loads while the grid has rows but no columns (a wrapper between two renders) used to
    // measure every row from no cells and keep the near-empty heights once the columns came back.
    await grid.setColumnsPresent(false);
    await grid.runFontsLoadHookCountingRenders();
    await grid.setColumnsPresent(true);

    await expect.poll(() => grid.sweepInProgress('autoRowSize')).toBe(false);
    expect(await grid.rowHeight(sweptRow) ?? 0).toBeGreaterThanOrEqual(heightBefore);
  });

  test('survives a listener that destroys the grid inside afterFontsLoad', async({ page, theme, bundle }) => {
    const grid = new WebFontLoadPage(page, theme, bundle);
    const errors: Error[] = [];

    page.on('pageerror', error => errors.push(error));

    await grid.goto();
    await grid.destroyGridDuringFontsLoad();
    await grid.loadFont();
    await grid.waitForFrames(5);

    // The re-measure runs from a promise, so a throw after the hook surfaced only as an unhandled rejection.
    expect(errors).toEqual([]);
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
