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
