import { getAlignmentFromMeta, getDropdownValidation } from '../types/xlsx/cell-style';

describe('getAlignmentFromMeta', () => {
  it('should return null when meta is falsy or has no className', () => {
    expect(getAlignmentFromMeta(null)).toBeNull();
    expect(getAlignmentFromMeta({})).toBeNull();
    expect(getAlignmentFromMeta({ className: '' })).toBeNull();
  });

  it('should parse alignment from a space-separated className string', () => {
    expect(getAlignmentFromMeta({ className: 'htCenter htTop' })).toEqual({
      horizontal: 'center',
      vertical: 'top',
    });
  });

  it('should parse alignment from a className array', () => {
    expect(getAlignmentFromMeta({ className: ['htRight', 'htBottom'] })).toEqual({
      horizontal: 'right',
      vertical: 'bottom',
    });
  });

  it('should return null when className array contains no recognised alignment classes', () => {
    expect(getAlignmentFromMeta({ className: ['foo', 'bar'] })).toBeNull();
  });

  it('should not throw when className array contains null or undefined elements', () => {
    expect(() => getAlignmentFromMeta({ className: [null, undefined, 'htCenter'] })).not.toThrow();
    expect(getAlignmentFromMeta({ className: [null, undefined, 'htCenter'] })).toEqual({
      horizontal: 'center',
    });
  });
});

describe('getDropdownValidation', () => {
  it('should return null when meta is falsy', () => {
    expect(getDropdownValidation(null, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
    expect(getDropdownValidation(undefined, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
  });

  it('should return null when rangeRef is not provided', () => {
    expect(getDropdownValidation({ type: 'dropdown', source: ['a', 'b'] }, null)).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown', source: ['a', 'b'] }, undefined)).toBeNull();
  });

  it('should return null when type is not dropdown or autocomplete', () => {
    expect(getDropdownValidation({ type: 'text', source: ['a', 'b'] }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
  });

  it('should return null when source is not an array', () => {
    expect(getDropdownValidation({ type: 'dropdown', source: null }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown', source: 'fn' }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown' }, '\'_HotValidation\'!$A$1:$A$2')).toBeNull();
  });

  it('should return a list validation using the provided rangeRef for dropdown type', () => {
    const result = getDropdownValidation(
      { type: 'dropdown', source: ['A', 'B', 'C'] },
      '\'_HotValidation\'!$A$1:$A$3'
    );

    expect(result).toEqual({
      type: 'list',
      allowBlank: true,
      formulae: ['\'_HotValidation\'!$A$1:$A$3'],
    });
  });

  it('should return a list validation using the provided rangeRef for autocomplete type', () => {
    const result = getDropdownValidation(
      { type: 'autocomplete', source: ['X', 'Y'] },
      '\'_HotValidation\'!$B$1:$B$2'
    );

    expect(result).toEqual({
      type: 'list',
      allowBlank: true,
      formulae: ['\'_HotValidation\'!$B$1:$B$2'],
    });
  });
});
