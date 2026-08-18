import { isPercentValue } from 'handsontable/helpers/number';

describe('isPercentValue', () => {
  it('should return `true` for percent-shaped strings', () => {
    expect(isPercentValue('50%')).toBe(true);
    expect(isPercentValue('33.5%')).toBe(true);
    expect(isPercentValue('-10%')).toBe(true);
    expect(isPercentValue('  50%  ')).toBe(true);
  });

  it('should return `false` for values without a numeric part, without the unit, or of the wrong type', () => {
    expect(isPercentValue('50')).toBe(false);
    expect(isPercentValue('%')).toBe(false);
    expect(isPercentValue('50 %')).toBe(false);
    expect(isPercentValue('50%%')).toBe(false);
    expect(isPercentValue('')).toBe(false);
    expect(isPercentValue(50)).toBe(false);
    expect(isPercentValue(null)).toBe(false);
    expect(isPercentValue(undefined)).toBe(false);
  });
});
