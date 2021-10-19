import {
  RENDER_TYPE,
  FULLY_VISIBLE_TYPE,
  PARTIALLY_VISIBLE_TYPE,
  ViewportColumnsCalculator,
} from 'walkontable/calculator';

describe('ViewportColumnsCalculator', () => {
  function allColumns20() {
    return 20;
  }

  it('should render first 5 columns in unscrolled container', () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 0,
      totalItems: 1000,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endColumn).toBe(4);
    expect(renderedCalc.count).toBe(5);

    expect(fullyVisibleCalc.startColumn).toBe(0);
    expect(fullyVisibleCalc.endColumn).toBe(4);
    expect(fullyVisibleCalc.count).toBe(5);

    expect(partiallyVisibleCalc.startColumn).toBe(0);
    expect(partiallyVisibleCalc.endColumn).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(5);
  });

  it('should render 6 columns, starting from 3 in container scrolled to half of fourth column', () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 70,
      totalItems: 1000,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(3);
    expect(renderedCalc.startPosition).toBe(60);
    expect(renderedCalc.endColumn).toBe(8);
    expect(renderedCalc.count).toBe(6);

    expect(fullyVisibleCalc.startColumn).toBe(4);
    expect(fullyVisibleCalc.endColumn).toBe(7);
    expect(fullyVisibleCalc.count).toBe(4);

    expect(partiallyVisibleCalc.startColumn).toBe(3);
    expect(partiallyVisibleCalc.endColumn).toBe(8);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should render 10 columns, starting from 1 in container scrolled to half of fourth column (with render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startColumn -= 2;
      calc.endColumn += 2;
    };
    const options = {
      viewportSize: 100,
      scrollOffset: 70,
      totalItems: 1000,
      itemSizeFn: index => allColumns20(index),
      overrideFn: calc => overrideFn(calc),
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(1);
    expect(renderedCalc.startPosition).toBe(20);
    expect(renderedCalc.endColumn).toBe(10);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startColumn).toBe(4);
    expect(fullyVisibleCalc.endColumn).toBe(7);
    expect(fullyVisibleCalc.count).toBe(4);

    expect(partiallyVisibleCalc.startColumn).toBe(3);
    expect(partiallyVisibleCalc.endColumn).toBe(8);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should not exceed endColumn index beyond total columns (using render overrides)', () => {
    const overrideFn = function(calc) {
      calc.startColumn -= 2;
      calc.endColumn += 30;
    };
    const options = {
      viewportSize: 100,
      scrollOffset: 70,
      totalItems: 8,
      itemSizeFn: index => allColumns20(index),
      overrideFn: calc => overrideFn(calc),
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endColumn).toBe(7);
    expect(renderedCalc.count).toBe(8);

    expect(fullyVisibleCalc.startColumn).toBe(3);
    expect(fullyVisibleCalc.endColumn).toBe(7);
    expect(fullyVisibleCalc.count).toBe(5);

    expect(partiallyVisibleCalc.startColumn).toBe(2);
    expect(partiallyVisibleCalc.endColumn).toBe(7);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should return number of rendered columns', () => {
    const options = {
      viewportSize: 100,
      scrollOffset: 50,
      totalItems: 1000,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.count).toBe(6);
    expect(fullyVisibleCalc.count).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should render all columns if their size is smaller than viewport', () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 8,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.endColumn).toBe(7);
    expect(renderedCalc.count).toBe(8);

    expect(fullyVisibleCalc.startColumn).toBe(0);
    expect(fullyVisibleCalc.endColumn).toBe(7);
    expect(fullyVisibleCalc.count).toBe(8);

    expect(partiallyVisibleCalc.startColumn).toBe(0);
    expect(partiallyVisibleCalc.endColumn).toBe(7);
    expect(partiallyVisibleCalc.count).toBe(8);
  });

  it('should render all columns if their size is exactly the viewport', () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 10,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.endColumn).toBe(9);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startColumn).toBe(0);
    expect(fullyVisibleCalc.endColumn).toBe(9);
    expect(fullyVisibleCalc.count).toBe(10);

    expect(partiallyVisibleCalc.startColumn).toBe(0);
    expect(partiallyVisibleCalc.endColumn).toBe(9);
    expect(partiallyVisibleCalc.count).toBe(10);
  });

  it('should render all columns if their size is slightly larger than viewport', () => {
    const options = {
      viewportSize: 199,
      scrollOffset: 0,
      totalItems: 10,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.endColumn).toBe(9);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startColumn).toBe(0);
    expect(fullyVisibleCalc.endColumn).toBe(8);
    expect(fullyVisibleCalc.count).toBe(9);

    expect(partiallyVisibleCalc.startColumn).toBe(0);
    expect(partiallyVisibleCalc.endColumn).toBe(9);
    expect(partiallyVisibleCalc.count).toBe(10);
  });

  it('should set null values if total columns is 0', () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 0,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(null);
    expect(renderedCalc.startPosition).toBe(null);
    expect(renderedCalc.endColumn).toBe(null);
    expect(renderedCalc.count).toBe(0);

    expect(fullyVisibleCalc.startColumn).toBe(null);
    expect(fullyVisibleCalc.endColumn).toBe(null);
    expect(fullyVisibleCalc.count).toBe(0);

    expect(partiallyVisibleCalc.startColumn).toBe(null);
    expect(partiallyVisibleCalc.endColumn).toBe(null);
    expect(partiallyVisibleCalc.count).toBe(0);
  });

  it('should set null values if total columns is 0 (with overrideFn provided)', () => {
    const overrideFn = function(myCalc) {
      myCalc.startColumn = 0;
      myCalc.endColumn = 0;
    };
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 0,
      itemSizeFn: index => allColumns20(index),
      overrideFn: calc => overrideFn(calc),
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(null);
    expect(renderedCalc.startPosition).toBe(null);
    expect(renderedCalc.endColumn).toBe(null);
    expect(renderedCalc.count).toBe(0);

    expect(fullyVisibleCalc.startColumn).toBe(null);
    expect(fullyVisibleCalc.endColumn).toBe(null);
    expect(fullyVisibleCalc.count).toBe(0);

    expect(partiallyVisibleCalc.startColumn).toBe(null);
    expect(partiallyVisibleCalc.endColumn).toBe(null);
    expect(partiallyVisibleCalc.count).toBe(0);
  });

  it('should scroll backwards if total columns is reached', () => {
    const options = {
      viewportSize: 190,
      scrollOffset: 350,
      totalItems: 20,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(10);
    expect(renderedCalc.startPosition).toBe(200);
    expect(renderedCalc.endColumn).toBe(19);
    expect(renderedCalc.count).toBe(10);

    expect(fullyVisibleCalc.startColumn).toBe(11);
    expect(fullyVisibleCalc.endColumn).toBe(19);
    expect(fullyVisibleCalc.count).toBe(9);

    expect(partiallyVisibleCalc.startColumn).toBe(10);
    expect(partiallyVisibleCalc.endColumn).toBe(19);
    expect(partiallyVisibleCalc.count).toBe(10);
  });

  it('should update stretchAllRatio after refreshStretching call (stretch: all)', () => {
    const calc = new ViewportColumnsCalculator({
      viewportSize: 250,
      scrollOffset: 0,
      totalItems: 20,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      stretchMode: 'all',
      stretchingItemWidthFn: void 0,
    });

    expect(calc.stretchAllRatio).toBe(0);
    expect(calc.stretchLastWidth).toBe(0);

    calc.refreshStretching(414);

    expect(calc.stretchAllRatio).toBe(1.035);
    expect(calc.stretchLastWidth).toBe(0);
  });

  it('should update stretchAllRatio after refreshStretching call (stretch: last)', () => {
    const calc = new ViewportColumnsCalculator({
      viewportSize: 250,
      scrollOffset: 0,
      totalItems: 5,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      stretchMode: 'last',
      stretchingItemWidthFn: void 0,
    });

    expect(calc.stretchAllRatio).toBe(0);
    expect(calc.stretchLastWidth).toBe(0);

    calc.refreshStretching(414);

    expect(calc.stretchAllRatio).toBe(0);
    expect(calc.stretchLastWidth).toBe(334);
  });

  it('should return valid stretched column width (stretch: all)', () => {
    const calc = new ViewportColumnsCalculator({
      viewportSize: 250,
      scrollOffset: 0,
      totalItems: 5,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      stretchMode: 'all',
      stretchingItemWidthFn: void 0,
    });

    expect(calc.getStretchedColumnWidth(0, 50)).toBe(null);
    expect(calc.needVerifyLastColumnWidth).toBe(true);

    calc.refreshStretching(417);

    expect(calc.getStretchedColumnWidth(0, allColumns20())).toBe(83);
    expect(calc.getStretchedColumnWidth(1, allColumns20())).toBe(83);
    expect(calc.getStretchedColumnWidth(2, allColumns20())).toBe(83);
    expect(calc.getStretchedColumnWidth(3, allColumns20())).toBe(83);
    expect(calc.needVerifyLastColumnWidth).toBe(true);
    expect(calc.getStretchedColumnWidth(4, allColumns20())).toBe(85);
    expect(calc.needVerifyLastColumnWidth).toBe(false);
  });

  it('should return valid stretched column width (stretch: last)', () => {
    const calc = new ViewportColumnsCalculator({
      viewportSize: 250,
      scrollOffset: 0,
      totalItems: 5,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      stretchMode: 'last',
      stretchingItemWidthFn: void 0,
    });

    expect(calc.getStretchedColumnWidth(0, 50)).toBe(null);

    calc.refreshStretching(417);

    expect(calc.getStretchedColumnWidth(0, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(1, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(2, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(3, allColumns20())).toBe(null);
    expect(calc.getStretchedColumnWidth(4, allColumns20())).toBe(337);
  });

  it('call refreshStretching should clear stretchAllColumnsWidth and needVerifyLastColumnWidth property', () => {
    const calc = new ViewportColumnsCalculator({
      viewportSize: 250,
      scrollOffset: 0,
      totalItems: 5,
      itemSizeFn: index => allColumns20(index),
      overrideFn: void 0,
      calculationType: RENDER_TYPE,
      stretchMode: 'all',
      stretchingItemWidthFn: void 0,
    });

    expect(calc.stretchAllColumnsWidth.length).toBe(0);
    expect(calc.needVerifyLastColumnWidth).toBe(true);

    calc.refreshStretching(417);
    calc.getStretchedColumnWidth(0, allColumns20());
    calc.getStretchedColumnWidth(1, allColumns20());
    calc.getStretchedColumnWidth(2, allColumns20());
    calc.getStretchedColumnWidth(3, allColumns20());
    calc.getStretchedColumnWidth(4, allColumns20());

    expect(calc.stretchAllColumnsWidth.length).toBe(5);
    expect(calc.needVerifyLastColumnWidth).toBe(false);

    calc.refreshStretching(201);

    expect(calc.stretchAllColumnsWidth.length).toBe(0);
    expect(calc.needVerifyLastColumnWidth).toBe(true);
  });

  it(`should calculate the number of columns based on a default width,
      when the width returned from the function is not a number`, () => {
    const options = {
      viewportSize: 200,
      scrollOffset: 0,
      totalItems: 1000,
      itemSizeFn: () => (void 0 + 1),
      overrideFn: void 0,
      stretchMode: void 0,
      stretchingItemWidthFn: void 0,
    };
    const renderedCalc = new ViewportColumnsCalculator({ ...options, calculationType: RENDER_TYPE });
    const fullyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: FULLY_VISIBLE_TYPE });
    const partiallyVisibleCalc = new ViewportColumnsCalculator({ ...options, calculationType: PARTIALLY_VISIBLE_TYPE });

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endColumn).toBe(3);

    expect(fullyVisibleCalc.startColumn).toBe(0);
    expect(fullyVisibleCalc.endColumn).toBe(3);

    expect(partiallyVisibleCalc.startColumn).toBe(0);
    expect(partiallyVisibleCalc.endColumn).toBe(3);
  });
});
