import { normalizeColor } from '../dataCollector';

describe('normalizeColor', () => {
  it('should normalize a 6-digit hex color with #', () => {
    expect(normalizeColor('#FF0000')).toBe('FF0000');
  });

  it('should normalize a 3-digit hex color', () => {
    expect(normalizeColor('#F00')).toBe('FF0000');
  });

  it('should normalize a lowercase hex color', () => {
    expect(normalizeColor('#ff0000')).toBe('FF0000');
  });

  it('should normalize an rgb() color', () => {
    expect(normalizeColor('rgb(255, 0, 0)')).toBe('FF0000');
  });

  it('should normalize an rgba() color', () => {
    expect(normalizeColor('rgba(0, 128, 255, 0.5)')).toBe('0080FF');
  });

  it('should return 000000 for null', () => {
    expect(normalizeColor(null)).toBe('000000');
  });

  it('should return 000000 for undefined', () => {
    expect(normalizeColor(undefined)).toBe('000000');
  });

  it('should return 000000 for empty string', () => {
    expect(normalizeColor('')).toBe('000000');
  });

  it('should return 000000 for unrecognized color names', () => {
    expect(normalizeColor('red')).toBe('000000');
  });

  it('should handle rgb with no spaces', () => {
    expect(normalizeColor('rgb(10,20,30)')).toBe('0A141E');
  });

  it('should handle hex without #', () => {
    expect(normalizeColor('#ABCDEF')).toBe('ABCDEF');
  });

  it('should pad short hex values', () => {
    expect(normalizeColor('#AB')).toBe('AB0000');
  });
});
