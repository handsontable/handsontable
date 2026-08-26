import Core from 'handsontable/core';
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
