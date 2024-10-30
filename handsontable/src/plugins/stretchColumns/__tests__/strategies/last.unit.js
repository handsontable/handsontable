import { StretchLastStrategy } from '../../strategies/last';

describe('StretchLastStrategy', () => {
  function createStretchStrategy(overwriteColumnWidthFn = width => width) {
    return new StretchLastStrategy(overwriteColumnWidthFn);
  }

  it('should return an empty array when there is no calculations triggered', () => {
    const strategy = createStretchStrategy();

    strategy.prepare({
      viewportWidth: 300,
    });
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([]);
  });

  it('should return the width only for the last column', () => {
    const strategy = createStretchStrategy();

    strategy.prepare({
      viewportWidth: 1000,
    });
    strategy.setColumnBaseWidth(0, 100);
    strategy.setColumnBaseWidth(1, 200);
    strategy.setColumnBaseWidth(2, 300);
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([[2, 700]]);
  });

  it('should return 0 when the sum of the column widths is bigger than viewport size', () => {
    const strategy = createStretchStrategy();

    strategy.prepare({
      viewportWidth: 80,
    });
    strategy.setColumnBaseWidth(0, 100);
    strategy.setColumnBaseWidth(1, 200);
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([[1, 0]]);
  });
});
