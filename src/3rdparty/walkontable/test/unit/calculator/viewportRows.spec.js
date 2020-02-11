import {
  RENDER_TYPE,
  FULLY_VISIBLE_TYPE,
  PARTIALLY_VISIBLE_TYPE,
  ViewportRowsCalculator,
} from 'walkontable/calculator';

describe('ViewportRowsCalculator', () => {
  function allRows20() {
    return 20;
  }

  it('should render first 5 rows in unscrolled container', () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 0,
      totalItems: 1000,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endRow).toBe(4);
    expect(renderedCalc.count).toBe(5);

    expect(fullyVisibleCalc.startRow).toBe(0);
    expect(fullyVisibleCalc.endRow).toBe(4);
    expect(fullyVisibleCalc.count).toBe(5);

    expect(partiallyVisibleCalc.startRow).toBe(0);
    expect(partiallyVisibleCalc.endRow).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(5);
  });

  it('should render 6 rows, starting from 3 in container scrolled to half of fourth row', () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 70,
      totalItems: 1000,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(3);
    expect(renderedCalc.startPosition).toBe(60);
    expect(renderedCalc.endRow).toBe(8);
    expect(renderedCalc.count).toBe(6);

    expect(fullyVisibleCalc.startRow).toBe(4);
    expect(fullyVisibleCalc.endRow).toBe(7);
    expect(fullyVisibleCalc.count).toBe(4);

    expect(partiallyVisibleCalc.startRow).toBe(3);
    expect(partiallyVisibleCalc.endRow).toBe(8);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should render 10 rows, starting from 1 in container scrolled to half of fourth row (with render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startRow -= 2;
      calc.endRow += 2;
    };
    const options = {
      viewportSize: 100,
      scrollOffset: 70,
      totalItems: 1000,
      itemSizeFn: index => allRows20(index),
      overrideFn: calc => overrideFn(calc),
      calculationType: RENDER_TYPE,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(1);
    expect(renderedCalc.startPosition).toBe(20);
    expect(renderedCalc.endRow).toBe(10);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startRow).toBe(4);
    expect(fullyVisibleCalc.endRow).toBe(7);
    expect(fullyVisibleCalc.count).toBe(4);

    expect(partiallyVisibleCalc.startRow).toBe(3);
    expect(partiallyVisibleCalc.endRow).toBe(8);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should not exceed endRow index beyond total rows (using render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startRow -= 3;
      calc.endRow += 30;
    };
    const options = {
      viewportSize: 100,
      scrollOffset: 70,
      totalItems: 8,
      itemSizeFn: index => allRows20(index),
      overrideFn: calc => overrideFn(calc),
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endRow).toBe(7);
    expect(renderedCalc.count).toBe(8);

    expect(fullyVisibleCalc.startRow).toBe(3);
    expect(fullyVisibleCalc.endRow).toBe(7);
    expect(fullyVisibleCalc.count).toBe(5);

    expect(partiallyVisibleCalc.startRow).toBe(3);
    expect(partiallyVisibleCalc.endRow).toBe(7);
    expect(partiallyVisibleCalc.count).toBe(5);
  });

  it('should return number of rendered rows', () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 50,
      totalItems: 1000,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.count).toBe(6);
    expect(fullyVisibleCalc.count).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should render all rows if their size is smaller than viewport', () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 8,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.endRow).toBe(7);
    expect(renderedCalc.count).toBe(8);

    expect(fullyVisibleCalc.startRow).toBe(0);
    expect(fullyVisibleCalc.endRow).toBe(7);
    expect(fullyVisibleCalc.count).toBe(8);

    expect(partiallyVisibleCalc.startRow).toBe(0);
    expect(partiallyVisibleCalc.endRow).toBe(7);
    expect(partiallyVisibleCalc.count).toBe(8);
  });

  it('should render all rows if their size is exactly the viewport', () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 10,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.endRow).toBe(9);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startRow).toBe(0);
    expect(fullyVisibleCalc.endRow).toBe(9);
    expect(fullyVisibleCalc.count).toBe(10);

    expect(partiallyVisibleCalc.startRow).toBe(0);
    expect(partiallyVisibleCalc.endRow).toBe(9);
    expect(partiallyVisibleCalc.count).toBe(10);
  });

  it('should render all rows if their size is slightly larger than viewport', () => {
    const options = {
      viewportSize: 199,
      scrollOffset: 0,
      totalItems: 10,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.endRow).toBe(9);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startRow).toBe(0);
    expect(fullyVisibleCalc.endRow).toBe(8);
    expect(fullyVisibleCalc.count).toBe(9);

    expect(partiallyVisibleCalc.startRow).toBe(0);
    expect(partiallyVisibleCalc.endRow).toBe(9);
    expect(partiallyVisibleCalc.count).toBe(10);
  });

  it('should set null values if total rows is 0', () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 0,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(null);
    expect(renderedCalc.startPosition).toBe(null);
    expect(renderedCalc.endRow).toBe(null);
    expect(renderedCalc.count).toBe(0);

    expect(fullyVisibleCalc.startRow).toBe(null);
    expect(fullyVisibleCalc.endRow).toBe(null);
    expect(fullyVisibleCalc.count).toBe(0);

    expect(partiallyVisibleCalc.startRow).toBe(null);
    expect(partiallyVisibleCalc.endRow).toBe(null);
    expect(partiallyVisibleCalc.count).toBe(0);
  });

  it('should set null values if total rows is 0 (with overrideFn provided)', () => {
    const overrideFn = function(myCalc) {
      myCalc.startRow = 0;
      myCalc.endRow = 0;
    };
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 0,
      itemSizeFn: index => allRows20(index),
      overrideFn: calc => overrideFn(calc),
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(null);
    expect(renderedCalc.startPosition).toBe(null);
    expect(renderedCalc.endRow).toBe(null);
    expect(renderedCalc.count).toBe(0);

    expect(fullyVisibleCalc.startRow).toBe(null);
    expect(fullyVisibleCalc.endRow).toBe(null);
    expect(fullyVisibleCalc.count).toBe(0);

    expect(partiallyVisibleCalc.startRow).toBe(null);
    expect(partiallyVisibleCalc.endRow).toBe(null);
    expect(partiallyVisibleCalc.count).toBe(0);
  });

  it('should scroll backwards if total rows is reached', () => {
    const options = {
      viewportSize: 190,
      scrollOffset: 350,
      totalItems: 20,
      itemSizeFn: index => allRows20(index),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(10);
    expect(renderedCalc.startPosition).toBe(200);
    expect(renderedCalc.endRow).toBe(19);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startRow).toBe(11);
    expect(fullyVisibleCalc.endRow).toBe(19);
    expect(fullyVisibleCalc.count).toBe(9);

    expect(partiallyVisibleCalc.startRow).toBe(10);
    expect(partiallyVisibleCalc.endRow).toBe(19);
    expect(partiallyVisibleCalc.count).toBe(10);
  });

  it(`should calculate the number of rows based on a default height,
      when the height returned from the function is not a number`, () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 0,
      totalItems: 1000,
      itemSizeFn: () => (void 0 + 1),
      overrideFn: void 0,
      scrollbarHeight: void 0,
    };
    const renderedCalc = new ViewportRowsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportRowsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endRow).toBe(4);
    expect(renderedCalc.count).toBe(5);

    expect(fullyVisibleCalc.startRow).toBe(0);
    expect(fullyVisibleCalc.endRow).toBe(3);
    expect(fullyVisibleCalc.count).toBe(4);

    expect(partiallyVisibleCalc.startRow).toBe(0);
    expect(partiallyVisibleCalc.endRow).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(5);
  });
});
