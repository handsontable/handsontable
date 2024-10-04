import { StretchLastStrategy } from '../../strategies/last';

describe('StretchLastStrategy', () => {
  function createStretchStrategy(calcArgs = {
    viewportWidth: 300,
    allColumnsWidth: 300,
    overwriteColumnWidthFn: width => width,
  }) {
    const strategy = new StretchLastStrategy();

    strategy.prepare(calcArgs);

    return strategy;
  }

  it('should return an empty array when there is no calculations triggered', () => {
    const strategy = createStretchStrategy();

    strategy.finish();

    expect(strategy.getWidths()).toEqual([]);
  });

  it('should return the width only for the last column', () => {
    const strategy = createStretchStrategy();

    strategy.calculate(0, 100);
    strategy.calculate(1, 200);
    strategy.calculate(2, 300);
    strategy.finish();

    expect(strategy.getWidths()).toEqual([[2, 300]]);
  });

  it('should return the width calculated from the remaining size in the viewport', () => {
    const strategy = createStretchStrategy({
      viewportWidth: 1000,
      allColumnsWidth: 700,
      overwriteColumnWidthFn: width => width,
    });

    strategy.calculate(0, 100);
    strategy.calculate(1, 200);
    strategy.finish();

    expect(strategy.getWidths()).toEqual([[1, 500]]);
  });

  it('should return 0 when the sum of the column widths is bigger than viewport size', () => {
    const strategy = createStretchStrategy({
      viewportWidth: 1000,
      allColumnsWidth: 1700,
      overwriteColumnWidthFn: width => width,
    });

    strategy.calculate(0, 100);
    strategy.calculate(1, 200);
    strategy.finish();

    expect(strategy.getWidths()).toEqual([[1, 0]]);
  });
});
