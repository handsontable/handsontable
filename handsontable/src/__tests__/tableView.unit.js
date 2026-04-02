import Core from 'handsontable/core';
import { hasScrollPositionChanged } from 'handsontable/tableView';
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

describe('hasScrollPositionChanged', () => {
  it('should return `true` when there is no previous position', () => {
    expect(hasScrollPositionChanged(null, 0)).toBe(true);
  });

  it('should return `true` when positions differ', () => {
    expect(hasScrollPositionChanged(10, 20)).toBe(true);
  });

  it('should return `false` when positions are equal', () => {
    expect(hasScrollPositionChanged(20, 20)).toBe(false);
  });

  it('should return `false` for `0` and `-0` (same numeric scroll position)', () => {
    expect(hasScrollPositionChanged(0, -0)).toBe(false);
  });

  it('should return `true` when previous position is `undefined`', () => {
    expect(hasScrollPositionChanged(undefined, 0)).toBe(true);
  });
});

describe('TableView scroll hooks', () => {
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

    const topOverlay = core.view._wt.wtOverlays.topOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(200);

    core.view._wt.wtSettings.getSetting('onScrollVertically');
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

    onAfterScrollVertically.calls.reset();
    core.view._wt.wtSettings.getSetting('onScrollVertically');

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

    const inlineStartOverlay = core.view._wt.wtOverlays.inlineStartOverlay;

    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(200);

    core.view._wt.wtSettings.getSetting('onScrollHorizontally');
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);

    onAfterScrollHorizontally.calls.reset();
    core.view._wt.wtSettings.getSetting('onScrollHorizontally');

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

    const topOverlay = core.view._wt.wtOverlays.topOverlay;
    const inlineStartOverlay = core.view._wt.wtOverlays.inlineStartOverlay;

    spyOn(topOverlay, 'getScrollPosition').and.returnValue(150);
    spyOn(inlineStartOverlay, 'getScrollPosition').and.returnValue(250);

    core.view._wt.wtSettings.getSetting('onScrollVertically');
    core.view._wt.wtSettings.getSetting('onScrollVertically');
    expect(onAfterScrollVertically).toHaveBeenCalledTimes(1);

    core.view._wt.wtSettings.getSetting('onScrollHorizontally');
    expect(onAfterScrollHorizontally).toHaveBeenCalledTimes(1);
  });
});
