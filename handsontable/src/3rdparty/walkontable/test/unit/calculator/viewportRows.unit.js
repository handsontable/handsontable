import {
  ViewportRowsCalculator,
  RenderedRowsCalculationType,
  FullyVisibleRowsCalculationType,
  PartiallyVisibleRowsCalculationType,
} from '../../../src/calculator';

function allRows20() {
  return 20;
}

function createViewportRowsCalculator(options) {
  return new ViewportRowsCalculator({
    ...options,
    calculationTypes: [
      ['rendered', new RenderedRowsCalculationType()],
      ['fullyVisible', new FullyVisibleRowsCalculationType()],
      ['partiallyVisible', new PartiallyVisibleRowsCalculationType()],
    ],
  });
}

describe('ViewportRowsCalculator', () => {
  it('should render first 5 rows in unscrolled container', () => {
    const options = {
      viewportHeight: 100,
      scrollOffset: 0,
      totalRows: 1000,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 100,
      scrollOffset: 70,
      totalRows: 1000,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 100,
      scrollOffset: 70,
      totalRows: 1000,
      rowHeightFn: index => allRows20(index),
      overrideFn: calc => overrideFn(calc),
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      calc.startRow -= 30;
      calc.endRow += 30;
    };
    const options = {
      viewportHeight: 100,
      scrollOffset: 70,
      totalRows: 8,
      rowHeightFn: index => allRows20(index),
      overrideFn: calc => overrideFn(calc),
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 100,
      scrollOffset: 50,
      totalRows: 1000,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

    expect(renderedCalc.count).toBe(6);
    expect(fullyVisibleCalc.count).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should render all rows if their size is smaller than viewport', () => {
    const options = {
      viewportHeight: 200,
      scrollOffset: 0,
      totalRows: 8,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 200,
      scrollOffset: 0,
      totalRows: 10,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 199,
      scrollOffset: 0,
      totalRows: 10,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 200,
      scrollOffset: 0,
      totalRows: 0,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 200,
      scrollOffset: 0,
      totalRows: 0,
      rowHeightFn: index => allRows20(index),
      overrideFn: calc => overrideFn(calc),
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 190,
      scrollOffset: 350,
      totalRows: 20,
      rowHeightFn: index => allRows20(index),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportHeight: 100,
      scrollOffset: 0,
      totalRows: 1000,
      defaultRowHeight: 23,
      rowHeightFn: () => (undefined + 1),
      overrideFn: undefined,
      horizontalScrollbarHeight: undefined,
    };
    const calc = createViewportRowsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
