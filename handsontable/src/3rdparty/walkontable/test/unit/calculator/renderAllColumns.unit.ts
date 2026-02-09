import {
  ViewportColumnsCalculator,
  RenderedAllColumnsCalculationType,
} from '../../../src/calculator';

function createViewportColumnsCalculator(options) {
  return new ViewportColumnsCalculator({
    ...options,
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
