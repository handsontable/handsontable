import {
  EXCEL_DYNAMIC_ARRAY_FUNCTIONS,
  callsDynamicArrayFunction,
  unwrapArrayFormula,
} from '../dynamicArrays';

describe('EXCEL_DYNAMIC_ARRAY_FUNCTIONS', () => {
  it('should hold IFS and SWITCH', () => {
    expect(EXCEL_DYNAMIC_ARRAY_FUNCTIONS.has('IFS')).toBe(true);
    expect(EXCEL_DYNAMIC_ARRAY_FUNCTIONS.has('SWITCH')).toBe(true);
  });
});

describe('callsDynamicArrayFunction', () => {
  it('should find a listed function call', () => {
    expect(callsDynamicArrayFunction('IFS(A1>1,"a",TRUE,"b")')).toBe(true);
    expect(callsDynamicArrayFunction('1+ifs(A1>1,"a")')).toBe(true);
  });

  it('should find a listed function with the _xlfn. prefix', () => {
    expect(callsDynamicArrayFunction('_xlfn.SWITCH(A1,1,"x")')).toBe(true);
  });

  it('should not find an unlisted function', () => {
    expect(callsDynamicArrayFunction('XLOOKUP(1,A:A,B:B)')).toBe(false);
  });

  it('should skip string literals and quoted sheet names', () => {
    expect(callsDynamicArrayFunction('"IFS("&A1')).toBe(false);
    expect(callsDynamicArrayFunction('\'IFS(\'!A1')).toBe(false);
  });

  it('should not match a longer name that ends in a listed one, or a name with no call', () => {
    expect(callsDynamicArrayFunction('MYIFS(1)')).toBe(false);
    expect(callsDynamicArrayFunction('IFS+1')).toBe(false);
  });
});

describe('unwrapArrayFormula', () => {
  it('should unwrap a whole ARRAYFORMULA call, case-insensitively', () => {
    expect(unwrapArrayFormula('ARRAYFORMULA(A1:A3*2)')).toBe('A1:A3*2');
    expect(unwrapArrayFormula('arrayformula(SUM(A1:A3))')).toBe('SUM(A1:A3)');
  });

  it('should ignore parentheses inside string literals', () => {
    expect(unwrapArrayFormula('ARRAYFORMULA(A1&")")')).toBe('A1&")"');
  });

  it('should return null when the call is not the whole formula', () => {
    expect(unwrapArrayFormula('ARRAYFORMULA(A1)+ARRAYFORMULA(A2)')).toBe(null);
    expect(unwrapArrayFormula('ARRAYFORMULA(A1')).toBe(null);
  });

  it('should return null for an empty call, which has no formula to write as an array', () => {
    // An empty inner text was written as an array formula with no formula text.
    expect(unwrapArrayFormula('ARRAYFORMULA()')).toBe(null);
    expect(unwrapArrayFormula('ARRAYFORMULA(  )')).toBe(null);
  });

  it('should return null for any other formula', () => {
    expect(unwrapArrayFormula('SUM(A1:A3)')).toBe(null);
  });
});
