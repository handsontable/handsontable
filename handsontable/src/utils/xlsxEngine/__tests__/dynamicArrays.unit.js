import {
  EXCEL_DYNAMIC_ARRAY_FUNCTIONS,
  appliesOperatorToRange,
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

describe('appliesOperatorToRange', () => {
  it('should find a multi-cell range that is an operand of an operator', () => {
    expect(appliesOperatorToRange('SUM(A1:A3*B1:B3)')).toBe(true);
    expect(appliesOperatorToRange('SUM(2^$A$1:$A$3)')).toBe(true);
    expect(appliesOperatorToRange('SUM(A1:B2 + 1)')).toBe(true);
    expect(appliesOperatorToRange('AND(A1:A3<>1)')).toBe(true);
    expect(appliesOperatorToRange('AND(A1:A3>=1)')).toBe(true);
    expect(appliesOperatorToRange('CONCAT(A1:A3&"x")')).toBe(true);
    expect(appliesOperatorToRange('OR(1=A1:A3)')).toBe(true);
  });

  it('should find a range negated by a unary minus', () => {
    expect(appliesOperatorToRange('SUM(-A1:A3)')).toBe(true);
  });

  it('should find a whole-column, a whole-row and a sheet-qualified range', () => {
    expect(appliesOperatorToRange('SUM(A:A*2)')).toBe(true);
    expect(appliesOperatorToRange('SUM($1:$1/2)')).toBe(true);
    expect(appliesOperatorToRange('SUM(Rates!A1:A3*2)')).toBe(true);
    expect(appliesOperatorToRange('SUM(\'My Sheet\'!$A$1:$A$3*2)')).toBe(true);
  });

  it('should not find a range that is a function argument only', () => {
    expect(appliesOperatorToRange('SUM(A1:A3)')).toBe(false);
    expect(appliesOperatorToRange('SUM(A1:A3,B1:B3)')).toBe(false);
    expect(appliesOperatorToRange('INDEX(A1:A3,1)*2')).toBe(false);
  });

  it('should not find a single cell, or a range whose corners are the same cell', () => {
    expect(appliesOperatorToRange('A1+1')).toBe(false);
    expect(appliesOperatorToRange('A1:A1*2')).toBe(false);
    expect(appliesOperatorToRange('$A$1:A1*2')).toBe(false);
    expect(appliesOperatorToRange('Rates!B2:B2*2')).toBe(false);
  });

  it('should find a range wrapped in grouping parentheses that is an operand', () => {
    expect(appliesOperatorToRange('SUM((A1:A3)*(B1:B3))')).toBe(true);
    expect(appliesOperatorToRange('SUM((A1:A3)*2)')).toBe(true);
    expect(appliesOperatorToRange('((A1:A3))+1')).toBe(true);
    expect(appliesOperatorToRange('SUM(( A1:A3 ) * 2)')).toBe(true);
  });

  it('should not step out of the parentheses of a function call', () => {
    expect(appliesOperatorToRange('SUM(A1:A3)*2')).toBe(false);
    expect(appliesOperatorToRange('(SUM(A1:A3))*2')).toBe(false);
    expect(appliesOperatorToRange('SUM((A1:A3))')).toBe(false);
  });

  it('should count a postfix percent sign after a range as an operator', () => {
    expect(appliesOperatorToRange('SUM(A1:A3%)')).toBe(true);
    expect(appliesOperatorToRange('SUM((A1:A3)%)')).toBe(true);
  });

  it('should skip every whitespace character the engine reads between a range and an operator', () => {
    expect(appliesOperatorToRange('SUM(A1:A3\t*2)')).toBe(true);
    expect(appliesOperatorToRange('SUM(A1:A3\n*2)')).toBe(true);
    expect(appliesOperatorToRange('SUM(2*\r\nA1:A3)')).toBe(true);
  });

  it('should skip string literals and leave defined names alone', () => {
    expect(appliesOperatorToRange('"A1:A3*2"')).toBe(false);
    expect(appliesOperatorToRange('SUM(Sales*2)')).toBe(false);
  });
});
