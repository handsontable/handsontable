import {
  ViewportRowsCalculator,
  RenderedAllRowsCalculationType,
} from '../../../src/calculator';

function createViewportRowsCalculator(options) {
  return new ViewportRowsCalculator({
    ...options,
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
