import {
  ViewportColumnsCalculator,
  RenderedAllColumnsCalculationType,
} from '../../../src/calculator';
import { PositionCache } from '../../../src/utils/positionCache';

function createViewportColumnsCalculator(options) {
  const {
    totalColumns = 0,
    columnWidthFn = () => NaN,
    ...rest
  } = options;

  const cache = new PositionCache();

  cache.build(totalColumns, columnWidthFn, 0);

  return new ViewportColumnsCalculator({
    ...rest,
    totalColumns,
    columnWidthCache: cache,
    calculationTypes: [
      ['rendered', new RenderedAllColumnsCalculationType()],
    ],
  });
}

describe('RenderAllColumnsCalculator', () => {
  it('should have assigned static values', () => {
    const calc = createViewportColumnsCalculator({
      viewportWidth: 100,
      scrollOffset: 0,
      totalColumns: 5,
      columnWidthFn: () => 50,
    });
    const renderedCalc = calc.getResultsFor('rendered');

    expect(renderedCalc.startColumn).toBe(0);
    expect(renderedCalc.endColumn).toBe(4);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.count).toBe(5);
  });
});
