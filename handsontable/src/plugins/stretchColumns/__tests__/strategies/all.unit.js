import { StretchAllStrategy } from '../../strategies/all';

describe('StretchAllStrategy', () => {
  function createStretchStrategy(calcArgs = {
    viewportWidth: 300,
    allColumnsWidth: 300,
    overwriteColumnWidthFn: width => width,
  }) {
    const strategy = new StretchAllStrategy();

    strategy.prepare(calcArgs);

    return strategy;
  }

  it('should return an empty array when there is no calculations triggered', () => {
    const strategy = createStretchStrategy();

    strategy.finish();

    expect(strategy.getWidths()).toEqual([]);
  });

  it('should calculate the width only for columns that are not narrower that default column width (50px)', () => {
    const strategy = createStretchStrategy();

    strategy.calculate(0, 49);
    strategy.calculate(2, 10);
    strategy.calculate(3, 0);
    strategy.finish();

    expect(strategy.getWidths()).toEqual([]);
  });

  it('should stretch all columns evenly based on the ratio calculated from viewport size and sum of the column widths', () => {
    const strategy = createStretchStrategy({
      viewportWidth: 1000,
      allColumnsWidth: 700,
      overwriteColumnWidthFn: width => width,
    });

    strategy.calculate(0, 50);
    strategy.calculate(1, 100);
    strategy.calculate(2, 49);
    strategy.calculate(3, 200);
    strategy.finish();

    expect(strategy.getWidths()).toEqual([[0, 71], [1, 143], [2, 70], [3, 716]]);
  });
});
