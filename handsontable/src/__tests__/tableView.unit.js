import Core from 'handsontable/core';
import TableView from '../tableView';
import { registerCellType } from '../cellTypes/registry';
import { TextCellType } from '../cellTypes/textType/textType';
import { baseRenderer } from '../renderers/baseRenderer/baseRenderer';
import { registerRenderer } from '../renderers/registry';
import { textRenderer } from '../renderers/textRenderer/textRenderer';

registerCellType(TextCellType);
registerRenderer(baseRenderer);
registerRenderer(textRenderer);

/**
 * @param {number} rows Row count.
 * @param {number} cols Column count.
 * @returns {string[][]}
 */
function spreadsheetData(rows, cols) {
  const data = [];

  for (let row = 0; row < rows; row += 1) {
    const rowData = [];

    for (let col = 0; col < cols; col += 1) {
      rowData.push(`${row},${col}`);
    }

    data.push(rowData);
  }

  return data;
}

describe('Overlays scroll hook deduplication', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (core) {
      core.destroy();
      core = null;
    }

    container.remove();
  });

  it('should emit `afterScrollVertically` once when Walkontable vertical scroll fires twice at the same position', () => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');

    core = new Core(container, {
      theme: 'ht-theme-main',
      data: spreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollVertically: onAfterScrollVertically,
    });
    core.init();

    const overlays = core.view._wt.wtOverlays;
    const topOverlay = overlays.topOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(200);

    overlays.verticalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

    onAfterScrollVertically.calls.reset();
    overlays.verticalScrolling = true;
    overlays.refreshAll();

    expect(onAfterScrollVertically).toHaveBeenCalledTimes(0);
  });

  it('should emit `afterScrollHorizontally` once when Walkontable horizontal scroll fires twice at the same position', () => {
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');

    core = new Core(container, {
      theme: 'ht-theme-main',
      data: spreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollHorizontally: onAfterScrollHorizontally,
    });
    core.init();

    const overlays = core.view._wt.wtOverlays;
    const inlineStartOverlay = overlays.inlineStartOverlay;

    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(200);

    overlays.horizontalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);

    onAfterScrollHorizontally.calls.reset();
    overlays.horizontalScrolling = true;
    overlays.refreshAll();

    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(0);
  });

  it('should keep vertical and horizontal deduplication independent', () => {
    const onAfterScrollVertically = jasmine.createSpy('onAfterScrollVertically');
    const onAfterScrollHorizontally = jasmine.createSpy('onAfterScrollHorizontally');

    core = new Core(container, {
      theme: 'ht-theme-main',
      data: spreadsheetData(100, 100),
      width: 300,
      height: 200,
      rowHeaders: true,
      colHeaders: true,
      afterScrollVertically: onAfterScrollVertically,
      afterScrollHorizontally: onAfterScrollHorizontally,
    });
    core.init();

    const overlays = core.view._wt.wtOverlays;
    const topOverlay = overlays.topOverlay;
    const inlineStartOverlay = overlays.inlineStartOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(150);
    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(250);

    overlays.verticalScrolling = true;
    overlays.refreshAll();
    overlays.verticalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

    overlays.horizontalScrolling = true;
    overlays.refreshAll();
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
  });
});

describe('Theme measurements cached against unresolved styles', () => {
  let container;
  let core;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (core) {
      core.destroy();
      core = null;
    }

    container.remove();
  });

  /**
   * Builds a grid whose styles handler reports, once, that the theme values it cached were read
   * against unresolved styles - the state a grid built outside the layout is in.
   *
   * @returns {object} The grid, the size-cache drop counter, and the order of the drop against the
   *                   calculators of the same draw.
   */
  const createGridWithStaleThemeMeasurements = () => {
    core = new Core(container, {
      theme: 'ht-theme-main',
      data: spreadsheetData(20, 5),
      width: 300,
      height: 200,
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });
    core.init();

    const viewport = core.view._wt.wtViewport;
    const createCalculators = viewport.createCalculators.bind(viewport);
    const order = [];
    let staleReports = 1;

    spyOn(core.stylesHandler, 'recacheValuesMeasuredWithoutStyles').and.callFake(() => {
      staleReports -= 1;

      return staleReports >= 0;
    });
    spyOn(viewport, 'resetAllOversizedRows').and.callFake(() => {
      order.push('drop');
    });
    spyOn(viewport, 'createCalculators').and.callFake((...args) => {
      order.push('calculators');

      return createCalculators(...args);
    });

    return { core, order };
  };

  it('should drop the size caches before the draw that renders against the resolved styles builds its calculators', () => {
    const { core: grid, order } = createGridWithStaleThemeMeasurements();

    grid.render();

    expect(order).toEqual(['drop', 'calculators']);
  });

  it('should keep the drop pending while a `beforeViewRender` listener cancels the render', () => {
    const { core: grid, order } = createGridWithStaleThemeMeasurements();
    let cancelRender = true;

    grid.addHook('beforeViewRender', (isForced, skipRender) => {
      if (cancelRender) {
        cancelRender = false;
        skipRender.skipRender = true;
      }
    });

    grid.render();

    expect(order).toEqual(['drop', 'calculators']);

    grid.render();

    expect(order.filter(step => step === 'drop').length).toBe(2);

    grid.render();

    expect(order.filter(step => step === 'drop').length).toBe(2);
  });
});

describe('TableView#isMainTableNotFullyCoveredByOverlays', () => {
  // A view stub that answers the counters the method reads. `renderedCols` is how many columns the main
  // table renders, `lastRenderedColumn` the index of the last one.
  const createView = ({
    renderedCols,
    lastRenderedColumn = renderedCols - 1,
    renderableCols,
    fixedStart = 0,
    fixedEnd = 0,
    renderedRows = 10,
    fixedTop = 0,
    fixedBottom = 0,
  }) => {
    const view = Object.create(TableView.prototype);

    view.hot = {
      countRenderedRows: () => renderedRows,
      countRenderedCols: () => renderedCols,
    };
    view._wt = { wtTable: { getLastRenderedColumn: () => lastRenderedColumn } };
    view.countNotHiddenFixedRowsTop = () => fixedTop;
    view.countNotHiddenFixedRowsBottom = () => fixedBottom;
    view.countNotHiddenFixedColumnsStart = () => fixedStart;
    view.countNotHiddenFixedColumnsEnd = () => fixedEnd;
    view.countRenderableColumns = () => renderableCols;

    return view;
  };

  it('should report the main table as covered when the start and end bands take every column', () => {
    const view = createView({ renderedCols: 6, renderableCols: 6, fixedStart: 3, fixedEnd: 3 });

    expect(view.isMainTableNotFullyCoveredByOverlays()).toBe(false);
  });

  it('should report the main table as not covered when a column remains between the bands', () => {
    const view = createView({ renderedCols: 6, renderableCols: 6, fixedStart: 3, fixedEnd: 2 });

    expect(view.isMainTableNotFullyCoveredByOverlays()).toBe(true);
  });

  it('should cut the end band down by the start band, which has priority', () => {
    // The end band asks for 5 columns but only 3 remain after the 3 start columns.
    const view = createView({ renderedCols: 6, renderableCols: 6, fixedStart: 3, fixedEnd: 5 });

    expect(view.isMainTableNotFullyCoveredByOverlays()).toBe(false);
  });

  it('should count the end band alone when there are no start columns', () => {
    const covered = createView({ renderedCols: 4, renderableCols: 4, fixedEnd: 4 });
    const notCovered = createView({ renderedCols: 4, renderableCols: 4, fixedEnd: 3 });

    expect(covered.isMainTableNotFullyCoveredByOverlays()).toBe(false);
    expect(notCovered.isMainTableNotFullyCoveredByOverlays()).toBe(true);
  });

  it('should report a scrolling column as not covered when the main table renders none of the end columns', () => {
    // 30 columns, 2 at the start and 3 at the end. The grid is scrolled to its start and the viewport is
    // narrow: the main table renders columns 0-4 only, none of them an end column.
    const view = createView({ renderedCols: 5, renderableCols: 30, fixedStart: 2, fixedEnd: 3 });

    expect(view.isMainTableNotFullyCoveredByOverlays()).toBe(true);
  });

  it('should not count the end columns the main table renders under the end overlay', () => {
    // Scrolled to the end: the main table renders columns 23-29, the last three of them end columns.
    const view = createView({ renderedCols: 7, renderableCols: 30, fixedStart: 2, fixedEnd: 3 });

    expect(view.isMainTableNotFullyCoveredByOverlays()).toBe(true);
  });

  it('should report the main table as covered when only start and end columns are rendered', () => {
    // The viewport is filled by the start band, and the only other columns rendered are the end ones.
    const view = createView({
      renderedCols: 5, lastRenderedColumn: 29, renderableCols: 30, fixedStart: 2, fixedEnd: 3,
    });

    expect(view.isMainTableNotFullyCoveredByOverlays()).toBe(false);
  });

  it('should keep reporting a grid without end columns as before', () => {
    expect(createView({ renderedCols: 6, renderableCols: 6, fixedStart: 3 })
      .isMainTableNotFullyCoveredByOverlays()).toBe(true);
    expect(createView({ renderedCols: 3, renderableCols: 3, fixedStart: 3 })
      .isMainTableNotFullyCoveredByOverlays()).toBe(false);
  });
});

describe('TableView#countFixedColumnsEnd', () => {
  // A view stub that answers what the helper reads: the option values and the column count the grid draws.
  const createView = ({ countCols, fixedColumnsEnd, fixedColumnsStart }) => {
    const view = Object.create(TableView.prototype);

    view.hot = { countCols: jest.fn(() => countCols) };
    view.settings = { fixedColumnsEnd, fixedColumnsStart };

    return view;
  };

  it('should return 0 without reading the column count when the option is not set', () => {
    const view = createView({ countCols: 10, fixedColumnsEnd: 0 });

    expect(view.countFixedColumnsEnd()).toBe(0);
    expect(createView({ countCols: 10 }).countFixedColumnsEnd()).toBe(0);
    expect(view.hot.countCols).not.toHaveBeenCalled();
  });

  it('should return the requested number of columns', () => {
    expect(createView({ countCols: 10, fixedColumnsEnd: 3 }).countFixedColumnsEnd()).toBe(3);
  });

  it('should cut the band down by the start band, which has priority', () => {
    expect(createView({ countCols: 10, fixedColumnsEnd: 5, fixedColumnsStart: 8 }).countFixedColumnsEnd()).toBe(2);
    expect(createView({ countCols: 4, fixedColumnsEnd: 3, fixedColumnsStart: 4 }).countFixedColumnsEnd()).toBe(0);
  });

  it('should cap the band at the columns the grid has', () => {
    expect(createView({ countCols: 2, fixedColumnsEnd: 5 }).countFixedColumnsEnd()).toBe(2);
  });
});

describe('TableView#countNotHiddenFixedColumnsEnd', () => {
  it('should return 0 without touching the column index mapper when the option is not set', () => {
    const view = Object.create(TableView.prototype);

    view.hot = { countCols: jest.fn(() => 10) };
    view.settings = { fixedColumnsEnd: 0 };
    view.countNotHiddenColumnIndexes = jest.fn(() => 99);

    expect(view.countNotHiddenFixedColumnsEnd()).toBe(0);
    expect(view.hot.countCols).not.toHaveBeenCalled();
    expect(view.countNotHiddenColumnIndexes).not.toHaveBeenCalled();
  });

  it('should still count the not hidden end columns when the option is set', () => {
    const view = Object.create(TableView.prototype);

    view.hot = { countCols: jest.fn(() => 10) };
    view.settings = { fixedColumnsEnd: 2 };
    view.countNotHiddenColumnIndexes = jest.fn(() => 2);

    expect(view.countNotHiddenFixedColumnsEnd()).toBe(2);
    expect(view.countNotHiddenColumnIndexes).toHaveBeenCalledWith(8, 1);
  });

  it('should floor a fractional option the way countFixedColumnsEnd does', () => {
    const view = Object.create(TableView.prototype);

    view.hot = { countCols: jest.fn(() => 10) };
    view.settings = { fixedColumnsEnd: 2.5 };
    view.countNotHiddenColumnIndexes = jest.fn(() => 2);

    expect(view.countNotHiddenFixedColumnsEnd()).toBe(2);
    // A whole visual index, not 7.5.
    expect(view.countNotHiddenColumnIndexes).toHaveBeenCalledWith(8, 1);
  });

  it.each([-1, Number.NaN, 'abc', 0.4, -0.5])('should return 0 for the unusable value %p', (fixedColumnsEnd) => {
    const view = Object.create(TableView.prototype);

    view.hot = { countCols: jest.fn(() => 10) };
    view.settings = { fixedColumnsEnd };
    view.countNotHiddenColumnIndexes = jest.fn(() => 99);

    expect(view.countNotHiddenFixedColumnsEnd()).toBe(0);
    expect(view.countNotHiddenColumnIndexes).not.toHaveBeenCalled();
  });
});
