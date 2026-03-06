import { StretchAllStrategy } from '../../strategies/all';

describe('StretchAllStrategy', () => {
  function createStretchStrategy(overwriteColumnWidthFn = width => width) {
    return new StretchAllStrategy(overwriteColumnWidthFn);
  }

  it('should return an empty array when there is no calculations triggered', () => {
    const strategy = createStretchStrategy();

    strategy.prepare({
      viewportWidth: 300,
    });
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([]);
  });

  it('should calculate the width only for columns that are not narrower that default column width (50px)', () => {
    const strategy = createStretchStrategy();

    strategy.prepare({
      viewportWidth: 300,
    });
    strategy.setColumnBaseWidth(0, 49);
    strategy.setColumnBaseWidth(2, 10);
    strategy.setColumnBaseWidth(3, 0);
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([[0, 249], [2, 51]]);
  });

  it('should skip the calculations when the total sum of stretched columns exceeds the viewport size', () => {
    const strategy = createStretchStrategy((width, index) => {
      if (index === 1) {
        return 310;
      }

      return width;
    });

    strategy.prepare({
      viewportWidth: 300,
    });
    strategy.setColumnBaseWidth(0, 50);
    strategy.setColumnBaseWidth(1, 60);
    strategy.setColumnBaseWidth(2, 30);
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([]);
  });

  it('should stretch all columns evenly based on the ratio calculated from viewport size and sum of the column widths', () => {
    const strategy = createStretchStrategy();

    strategy.prepare({
      viewportWidth: 1000,
    });

    strategy.setColumnBaseWidth(0, 50);
    strategy.setColumnBaseWidth(1, 100);
    strategy.setColumnBaseWidth(2, 49);
    strategy.setColumnBaseWidth(3, 200);
    strategy.calculate();

    expect(strategy.getWidths()).toEqual([[0, 125], [1, 251], [2, 123], [3, 501]]);
  });
});
