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
    expect(getDropdownValidation(null)).toBeNull();
    expect(getDropdownValidation(undefined)).toBeNull();
  });

  it('should return null when type is not dropdown or autocomplete', () => {
    expect(getDropdownValidation({ type: 'text', source: ['a', 'b'] })).toBeNull();
    expect(getDropdownValidation({ type: 'numeric', source: ['a'] })).toBeNull();
  });

  it('should return null when source is not an array', () => {
    expect(getDropdownValidation({ type: 'dropdown', source: null })).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown', source: 'fn' })).toBeNull();
    expect(getDropdownValidation({ type: 'dropdown' })).toBeNull();
  });

  it('should return a list validation for dropdown type', () => {
    const result = getDropdownValidation({ type: 'dropdown', source: ['A', 'B', 'C'] });

    expect(result).toEqual({
      type: 'list',
      allowBlank: true,
      formulae: ['"A,B,C"'],
    });
  });

  it('should return a list validation for autocomplete type', () => {
    const result = getDropdownValidation({ type: 'autocomplete', source: ['X', 'Y'] });

    expect(result).toEqual({
      type: 'list',
      allowBlank: true,
      formulae: ['"X,Y"'],
    });
  });

  it('should escape double quotes in source values as ""', () => {
    const result = getDropdownValidation({ type: 'dropdown', source: ['say "hello"', 'world'] });

    expect(result.formulae).toEqual(['"say ""hello"",world"']);
  });
});
