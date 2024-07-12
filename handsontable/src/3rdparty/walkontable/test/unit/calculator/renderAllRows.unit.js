import {
  RenderAllRowsCalculator,
} from '../../../src/calculator';

describe('RenderAllRowsCalculator', () => {
  it('should have assigned static values', () => {
    const calc = new RenderAllRowsCalculator({
      totalRows: 5,
    });

    expect(calc.startRow).toBe(0);
    expect(calc.endRow).toBe(4);
    expect(calc.startPosition).toBe(0);
    expect(calc.count).toBe(5);
  });
});
