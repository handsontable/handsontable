import { getParsedNumber } from 'handsontable/helpers/number';

describe('getParsedNumber', () => {
  it('should strip dot thousands grouping when the decimal separator is a comma', () => {
    const commaDecimal = { decimalSeparator: ',' };

    expect(getParsedNumber('7.000', commaDecimal)).toBe(7000);
    expect(getParsedNumber('1.234.567', commaDecimal)).toBe(1234567);
    expect(getParsedNumber('7.000,25', commaDecimal)).toBe(7000.25);
  });

  it('should keep treating the dot as a decimal separator when the cell does not use a comma', () => {
    expect(getParsedNumber('7.000', { decimalSeparator: '.' })).toBe(7);
    expect(getParsedNumber('7.000')).toBe(7);
  });
});
