import Handsontable from 'handsontable';

/**
 * How `TableView` decides when to measure and draw again with `limitFixedToViewport`. jsdom has no layout, so the
 * size of the viewport is given through `getFrozenViewportSize()`: the tests move it between two measurements to make
 * the resolved counts change.
 */
describe('limitFixedToViewport rendering', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with five frozen columns of 50 px and a holder that reports a width.
   *
   * @returns {Core}
   */
  function createGrid() {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 10),
      colWidths: 50,
      licenseKey: 'non-commercial-and-evaluation',
      fixedColumnsStart: 5,
      limitFixedToViewport: true,
    });

    Object.defineProperty(hot.view._wt.wtTable.holder, 'clientWidth', { configurable: true, get: () => 500 });

    return hot;
  }

  describe('a draw that a listener cancelled', () => {
    it('should not be drawn again to measure the counts', () => {
      createGrid();

      // 150 px fits two columns, 1000 px fits all five: the second measurement would move the counts
      jest.spyOn(hot.view, 'getFrozenViewportSize').mockReturnValueOnce(150).mockReturnValue(1000);
      // the engine reports a draw that rendered cells through `onDraw`, and a cancelled one never does
      const draw = jest.spyOn(hot.view._wt, 'draw').mockImplementation(() => {});

      hot.render();

      expect(draw).toHaveBeenCalledTimes(1);
    });

    it('should be drawn again when the draw rendered cells and the counts moved', () => {
      createGrid();

      jest.spyOn(hot.view, 'getFrozenViewportSize').mockReturnValueOnce(150).mockReturnValue(1000);

      const draw = jest.spyOn(hot.view._wt, 'draw').mockImplementation(() => {
        hot.view.afterRender(true);
      });

      hot.render();

      expect(draw).toHaveBeenCalledTimes(2);
    });
  });

  describe('a window resize', () => {
    it('should resolve the counts without reading the rendered height of a row', () => {
      createGrid();

      const viewport = hot.view._wt.wtViewport;

      jest.spyOn(viewport, 'isVerticallyScrollableByWindow').mockReturnValue(true);
      jest.spyOn(hot.view, 'getFrozenViewportSize').mockReturnValue(1000);

      const trackSize = jest.spyOn(hot.view, 'getFrozenTrackSize');
      const render = jest.spyOn(hot, 'render').mockImplementation(() => {});

      // the memo holds the counts of a narrower grid, so the resize moves them
      hot.view._effectiveFixed = { start: 2, end: 0, top: 0, bottom: 0 };
      hot.view.renderWhenWindowResizeMovedFixed();

      expect(render).toHaveBeenCalledTimes(1);
      expect(trackSize).toHaveBeenCalled();
      // outside a render the row filter can be stale (`hideRow()` with no render), and a DOM read of a row throws
      trackSize.mock.calls.forEach(([, , measureDom]) => expect(measureDom).not.toBe(true));
    });
  });

  describe('a column width that changed without a render', () => {
    it('should check the counts once, and render when they moved', () => {
      jest.useFakeTimers();
      createGrid();

      jest.spyOn(hot.view, 'getFrozenViewportSize').mockReturnValue(1000);

      const render = jest.spyOn(hot, 'render').mockImplementation(() => {});

      // the memo is from a render that measured a narrow grid
      hot.view._effectiveFixed = { start: 2, end: 0, top: 0, bottom: 0 };

      // AutoColumnSize writes its idle measurements to the width map, which drops the width cache and renders nothing
      hot.view.invalidateColumnWidthCache();
      hot.view.invalidateColumnWidthCache();

      expect(render).not.toHaveBeenCalled();

      jest.runOnlyPendingTimers();

      expect(render).toHaveBeenCalledTimes(1);
    });

    it('should not render when the counts did not move', () => {
      jest.useFakeTimers();
      createGrid();

      jest.spyOn(hot.view, 'getFrozenViewportSize').mockReturnValue(1000);

      const render = jest.spyOn(hot, 'render').mockImplementation(() => {});

      hot.view._effectiveFixed = { start: 5, end: 0, top: 0, bottom: 0 };
      hot.view.invalidateColumnWidthCache();
      jest.runOnlyPendingTimers();

      expect(render).not.toHaveBeenCalled();
    });
  });
});
