import {
  ViewportRowsCalculator,
  RenderedAllRowsCalculationType,
} from '../../../src/calculator';
import { PositionCache } from '../../../src/utils/positionCache';

function createViewportRowsCalculator(options) {
  const {
    totalRows = 0,
    rowHeightFn = () => NaN,
    ...rest
  } = options;

  const cache = new PositionCache({
    totalItemsFn: () => totalRows,
    sizeFn: rowHeightFn,
    defaultSizeFn: () => 0,
  });

  cache.build();

  return new ViewportRowsCalculator({
    ...rest,
    totalRows,
    rowHeightCache: cache,
    calculationTypes: [
      ['rendered', new RenderedAllRowsCalculationType()],
    ],
  });
}

describe('RenderAllRowsCalculator', () => {
  it('should have assigned static values', () => {
    const calc = createViewportRowsCalculator({
      viewportHeight: 100,
      scrollOffset: 0,
      totalRows: 5,
      rowHeightFn: () => 25,
    });
    const renderedCalc = calc.getResultsFor('rendered');

    expect(renderedCalc.startRow).toBe(0);
    expect(renderedCalc.endRow).toBe(4);
    expect(renderedCalc.startPosition).toBe(0);
    expect(renderedCalc.count).toBe(5);
  });
});
