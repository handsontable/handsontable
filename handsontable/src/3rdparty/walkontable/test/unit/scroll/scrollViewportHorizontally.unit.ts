import Scroll, { type ScrollDeps } from 'walkontable/scroll/scroll';
import Settings from 'walkontable/settings';

/**
 * `Scroll#scrollViewportHorizontally` with a frozen end band: an automatic scroll leaves a column that sits
 * under the end overlay alone, and an explicit snap still goes to the inline-start overlay.
 */

/**
 * Builds the module over the REAL settings accessor and a recording inline-start overlay.
 *
 * @param {object} options The grid shape.
 * @param {number} [options.totalColumns=30] Renderable columns.
 * @param {number} [options.fixedColumnsStart=0] Frozen start columns.
 * @param {number} [options.fixedColumnsEnd=0] Requested frozen end columns.
 * @returns {object}
 */
function createScroll({ totalColumns = 30, fixedColumnsStart = 0, fixedColumnsEnd = 0 } = {}) {
  const scrollTo = jest.fn(() => true);
  const wtSettings = new Settings({
    facade: () => {},
    data: () => '',
    table: {},
    totalRows: () => 5,
    totalColumns: () => totalColumns,
    fixedColumnsStart: () => fixedColumnsStart,
    fixedColumnsEnd: () => fixedColumnsEnd,
  });
  // The master shows columns 10..14 fully; 9 and 15 partially.
  const wtTable = {
    getFirstVisibleColumn: () => 10,
    getLastVisibleColumn: () => 14,
    getLastPartiallyVisibleColumn: () => 15,
  };
  const deps = {
    wtSettings,
    rootWindow: window,
    isDrawn: () => true,
    getWtTable: () => wtTable,
    getWtViewport: () => ({}),
    getInlineStartOverlay: () => ({ scrollTo, mainTableScrollableElement: document.createElement('div') }),
  } as unknown as ScrollDeps;

  return { scroll: new Scroll(deps), scrollTo };
}

describe('Scroll#scrollViewportHorizontally with fixedColumnsEnd', () => {
  it('should not scroll automatically to a column in the end band, which never leaves the edge', () => {
    const { scroll, scrollTo } = createScroll({ fixedColumnsEnd: 3 });

    expect(scroll.scrollViewportHorizontally(27)).toBe(false);
    expect(scroll.scrollViewportHorizontally(29)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('should still scroll automatically to a column just before the end band when it is out of view', () => {
    const { scroll, scrollTo } = createScroll({ fixedColumnsEnd: 3 });

    expect(scroll.scrollViewportHorizontally(26)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith(26, true);
  });

  it('should scroll automatically to a column of the end band when none is frozen', () => {
    const { scroll, scrollTo } = createScroll({ fixedColumnsEnd: 0 });

    expect(scroll.scrollViewportHorizontally(29)).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith(29, true);
  });

  it('should use the end band cut down by the start band to decide which columns it covers', () => {
    // 28 start columns leave 2 end columns (28 and 29); column 27 is a start column and is left alone as well.
    const { scroll, scrollTo } = createScroll({ fixedColumnsStart: 28, fixedColumnsEnd: 5 });

    expect(scroll.scrollViewportHorizontally(29)).toBe(false);
    expect(scroll.scrollViewportHorizontally(27)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('should honor an explicit snap to a column of the end band', () => {
    const { scroll, scrollTo } = createScroll({ fixedColumnsEnd: 3 });

    expect(scroll.scrollViewportHorizontally(28, 'end')).toBe(true);
    expect(scrollTo).toHaveBeenCalledWith(28, true);
  });

  it('should leave a column in view alone', () => {
    const { scroll, scrollTo } = createScroll({ fixedColumnsEnd: 3 });

    expect(scroll.scrollViewportHorizontally(12)).toBe(false);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('Scroll#getLastVisibleColumn in window-scroll mode with fixedColumnsEnd', () => {
  /**
   * Builds the module for a page the window scrolls: 60px columns, a table 10px from the page edge, a
   * 500px wide window, and an end band of `bandWidth` pixels.
   *
   * @param {number} bandWidth The width of the end band.
   * @returns {Scroll}
   */
  function createWindowScroll(bandWidth: number) {
    const wtSettings = new Settings({
      facade: () => {},
      data: () => '',
      table: {},
      totalRows: () => 5,
      totalColumns: () => 30,
    });
    const deps = {
      wtSettings,
      rootWindow: window,
      geometryReader: {
        offset: () => ({ left: 10, top: 0 }),
        innerWidth: () => 500,
      },
      isDrawn: () => true,
      getWtTable: () => ({ wtRootElement: document.createElement('div'), getLastVisibleColumn: () => 29 }),
      getWtViewport: () => ({ getRowHeaderWidth: () => 0 }),
      getInlineStartOverlay: () => ({ mainTableScrollableElement: window, sumCellSizes: () => 60 }),
      getInlineEndOverlay: () => ({ getBandWidth: () => bandWidth }),
    } as unknown as ScrollDeps;

    return new Scroll(deps);
  }

  it('should reach as far as the window shows when there is no end band', () => {
    expect(createWindowScroll(0).getLastVisibleColumn()).toBe(7);
  });

  it('should stop short of the columns the end band covers', () => {
    // 120px of the 500px window belong to the end band: two columns fewer.
    expect(createWindowScroll(120).getLastVisibleColumn()).toBe(5);
  });
});
