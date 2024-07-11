import {
  ViewportColumnsCalculator,
  RenderedColumnsCalculationType,
  FullyVisibleColumnsCalculationType,
  PartiallyVisibleColumnsCalculationType,
} from '../../../src/calculator';

function allColumns20() {
  return 20;
}

function createViewportColumnsCalculator(options) {
  return new ViewportColumnsCalculator({
    ...options,
    calculationTypes: [
      ['rendered', new RenderedColumnsCalculationType()],
      ['fullyVisible', new FullyVisibleColumnsCalculationType()],
      ['partiallyVisible', new PartiallyVisibleColumnsCalculationType()],
    ],
  });
}

describe('ViewportColumnsCalculator', () => {
  it('should render first 5 columns in unscrolled container', () => {
    const options = {
      viewportWidth: 100,
      scrollOffset: 0,
      totalColumns: 1000,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 100,
      scrollOffset: 70,
      totalColumns: 1000,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 100,
      scrollOffset: 70,
      totalColumns: 1000,
      columnWidthFn: index => allColumns20(index),
      overrideFn: calc => overrideFn(calc),
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      calc.startColumn -= 20;
      calc.endColumn += 30;
    };
    const options = {
      viewportWidth: 100,
      scrollOffset: 70,
      totalColumns: 8,
      columnWidthFn: index => allColumns20(index),
      overrideFn: calc => overrideFn(calc),
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 100,
      scrollOffset: 50,
      totalColumns: 1000,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

    expect(renderedCalc.count).toBe(6);
    expect(fullyVisibleCalc.count).toBe(4);
    expect(partiallyVisibleCalc.count).toBe(6);
  });

  it('should render all columns if their size is smaller than viewport', () => {
    const options = {
      viewportWidth: 200,
      scrollOffset: 0,
      totalColumns: 8,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 200,
      scrollOffset: 0,
      totalColumns: 10,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 199,
      scrollOffset: 0,
      totalColumns: 10,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 200,
      scrollOffset: 0,
      totalColumns: 0,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 200,
      scrollOffset: 0,
      totalColumns: 0,
      columnWidthFn: index => allColumns20(index),
      overrideFn: calc => overrideFn(calc),
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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
      viewportWidth: 190,
      scrollOffset: 350,
      totalColumns: 20,
      columnWidthFn: index => allColumns20(index),
      overrideFn: undefined,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

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

  it(`should calculate the number of columns based on a default width,
      when the width returned from the function is not a number`, () => {
    const options = {
      viewportWidth: 200,
      scrollOffset: 0,
      totalColumns: 1000,
      columnWidthFn: () => NaN,
    };
    const calc = createViewportColumnsCalculator(options);
    const renderedCalc = calc.getResultsFor('rendered');
    const fullyVisibleCalc = calc.getResultsFor('fullyVisible');
    const partiallyVisibleCalc = calc.getResultsFor('partiallyVisible');

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.endColumn).toBe(3);

    expect(fullyVisibleCalc.startColumn).toBe(0);
    expect(fullyVisibleCalc.endColumn).toBe(3);

    expect(partiallyVisibleCalc.startColumn).toBe(0);
    expect(partiallyVisibleCalc.endColumn).toBe(3);
  });
});
