import {
  RenderAllColumnsCalculator,
} from '../../../src/calculator';

describe('RenderAllColumnsCalculator', () => {
  it('should have assigned static values', () => {
    const calc = new RenderAllColumnsCalculator({
      totalColumns: 5,
    });

    expect(calc.startColumn).toBe(0);
    expect(calc.endColumn).toBe(4);
    expect(calc.startPosition).toBe(0);
    expect(calc.count).toBe(5);
  });
});
