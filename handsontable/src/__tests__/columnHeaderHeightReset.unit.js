import Handsontable from 'handsontable';

const DEFAULT_ROW_HEIGHT = 29;
const BORDER_WIDTH = 1;

/**
 * A full render drops the column-header heights the render-size probe stored only when a header is taller
 * than one line: the default row height plus the header's own bottom gridline, which the probe's border-box
 * measurement includes. jsdom has no layout, so the stored heights, the default row height and the border
 * width are given, and the probe's own measurement is held at what a real draw measures.
 */
describe('TableView: column-header heights dropped on a full render', () => {
  let container;
  let hot;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Builds a grid with column headers whose probe keeps the given header height, as a real draw measures it,
   * and returns a spy on the probe's `clear()` calls made outside its own measurement.
   *
   * @param {number} storedHeight The header height the probe measures and stores.
   * @returns {jest.SpyInstance}
   */
  function createGrid(storedHeight) {
    hot = new Handsontable(container, {
      data: Handsontable.helper.createSpreadsheetData(3, 3),
      colHeaders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    const probe = hot.view.renderSizeProbe;
    let measuring = false;

    jest.spyOn(hot.stylesHandler, 'getDefaultRowHeight').mockReturnValue(DEFAULT_ROW_HEIGHT);
    jest.spyOn(hot.stylesHandler, 'getStyleForTD').mockImplementation(
      property => (property === 'border-bottom-width' ? `${BORDER_WIDTH}px` : undefined)
    );
    jest.spyOn(probe, 'measure').mockImplementation(() => {
      measuring = true;
      probe.columnHeaderHeights.clear();
      probe.columnHeaderHeights.set(0, storedHeight);
      measuring = false;
    });

    probe.columnHeaderHeights.set(0, storedHeight);

    const clear = jest.fn();
    const originalClear = probe.columnHeaderHeights.clear.bind(probe.columnHeaderHeights);

    probe.columnHeaderHeights.clear = () => {
      if (!measuring) {
        clear();
      }

      originalClear();
    };

    return clear;
  }

  it('keeps a single-line header\'s height, gridline included, across full renders', () => {
    const clear = createGrid(DEFAULT_ROW_HEIGHT + BORDER_WIDTH);

    hot.forceFullRender = true;
    hot.render();
    hot.forceFullRender = true;
    hot.render();

    expect(clear).not.toHaveBeenCalled();
  });

  it('drops a multi-line header\'s height on each full render, so it is measured again', () => {
    const clear = createGrid(70);

    hot.forceFullRender = true;
    hot.render();

    expect(clear).toHaveBeenCalledTimes(1);
  });

  it('keeps the stored heights on a render that is not a full one', () => {
    const clear = createGrid(70);

    hot.forceFullRender = false;
    hot.view.render();

    expect(clear).not.toHaveBeenCalled();
  });

  it('re-syncs the overlay header heights after a full render only for a multi-line header', () => {
    createGrid(DEFAULT_ROW_HEIGHT + BORDER_WIDTH);

    const refresh = jest.spyOn(hot.view._wt.wtOverlays, 'refreshColumnHeaderHeights');

    hot.render();

    expect(refresh).not.toHaveBeenCalled();

    hot.view.renderSizeProbe.measure.mockImplementation(() => {
      hot.view.renderSizeProbe.columnHeaderHeights.set(0, 70);
    });
    hot.render();

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
