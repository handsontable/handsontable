import { getCheckboxLabelPropertySeed } from '../checkboxRenderer';

describe('getCheckboxLabelPropertySeed', () => {
  it('buckets a cell by the length of its label text', () => {
    expect(getCheckboxLabelPropertySeed('Value 0001', true)).toBe('10');
    expect(getCheckboxLabelPropertySeed('A much longer label than the others', false)).toBe('35');
  });

  it('falls back to the cell value when the label property holds null', () => {
    expect(getCheckboxLabelPropertySeed(null, true)).toBe('4');
    expect(getCheckboxLabelPropertySeed(null, false)).toBe('5');
  });

  it('reads a missing label property as empty text, not as the cell value', () => {
    expect(getCheckboxLabelPropertySeed(undefined, true)).toBe('0');
  });

  it('reads a non-string label through its text form', () => {
    expect(getCheckboxLabelPropertySeed(12345.5, true)).toBe('7');
  });
});
