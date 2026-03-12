import { hasScrollPositionChanged } from 'handsontable/tableView';

describe('hasScrollPositionChanged', () => {
  it('should return `true` when there is no previous position', () => {
    expect(hasScrollPositionChanged(null, 0)).toBe(true);
  });

  it('should return `true` when positions differ', () => {
    expect(hasScrollPositionChanged(10, 20)).toBe(true);
  });

  it('should return `false` when positions are equal', () => {
    expect(hasScrollPositionChanged(20, 20)).toBe(false);
  });
});
