import {
  ARRAY_RETURNING_FUNCTIONS,
  EXCEL_DYNAMIC_ARRAY_FUNCTIONS,
  appliesOperatorToRange,
  callsDynamicArrayFunction,
  callsArrayFormulaAsOperand,
  isMultiCellRangeDefinition,
  isWholeArrayFunctionCall,
  stripArrayFormulaCalls,
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

describe('isWholeArrayFunctionCall', () => {
  // Excel Online saves each of these as a one-cell dynamic array (`cm="1"`).
  it('should find a formula that is one call to a function that can return an array', () => {
    expect(isWholeArrayFunctionCall('SEQUENCE(1)')).toBe(true);
    expect(isWholeArrayFunctionCall('INDIRECT("A1")')).toBe(true);
    expect(isWholeArrayFunctionCall('LET(x,1,x)')).toBe(true);
    expect(isWholeArrayFunctionCall('TRANSPOSE(A1)')).toBe(true);
    expect(isWholeArrayFunctionCall('MMULT(A1,B1)')).toBe(true);
    expect(isWholeArrayFunctionCall('FILTER(A1:A3,A1:A3>1)')).toBe(true);
    expect(isWholeArrayFunctionCall('ARRAY_CONSTRAIN(A1:B2,1,1)')).toBe(true);
    expect(isWholeArrayFunctionCall('SORT(A1:A3)')).toBe(true);
    expect(isWholeArrayFunctionCall('SORTBY(A1:A3,B1:B3)')).toBe(true);
    expect(isWholeArrayFunctionCall('UNIQUE(A1:A3)')).toBe(true);
    expect(isWholeArrayFunctionCall('RANDARRAY(1)')).toBe(true);
  });

  it('should hold the functions of the rule', () => {
    expect([...ARRAY_RETURNING_FUNCTIONS].sort()).toEqual([
      'ARRAY_CONSTRAIN', 'FILTER', 'INDIRECT', 'LAMBDA', 'LET', 'MMULT', 'RANDARRAY', 'SEQUENCE', 'SORT',
      'SORTBY', 'TRANSPOSE', 'UNIQUE',
    ]);
  });

  it('should read the name case-insensitively and with the `_xlfn.` and `_xlfn._xlws.` prefixes', () => {
    expect(isWholeArrayFunctionCall('sequence(1)')).toBe(true);
    expect(isWholeArrayFunctionCall('_xlfn.SEQUENCE(1)')).toBe(true);
    expect(isWholeArrayFunctionCall('_xlfn._xlws.SORT(A1:A3)')).toBe(true);
    expect(isWholeArrayFunctionCall('_XLFN.LET(_xlpm.x,1,_xlpm.x)')).toBe(true);
  });

  it('should step over surrounding whitespace and grouping parentheses', () => {
    expect(isWholeArrayFunctionCall('  SEQUENCE(1) ')).toBe(true);
    expect(isWholeArrayFunctionCall('((SEQUENCE(1)))')).toBe(true);
    expect(isWholeArrayFunctionCall('( SEQUENCE(1) )')).toBe(true);
  });

  it('should stay linear in the depth of the grouping parentheses', () => {
    // A text cell needs no parse to reach the export: peeling one layer per pass rescanned and
    // copied the text each time, and 50,000 layers took about 10 s.
    const depth = 50000;
    const started = Date.now();

    expect(isWholeArrayFunctionCall(`${'('.repeat(depth)}SEQUENCE(1)${')'.repeat(depth)}`)).toBe(true);
    expect(isWholeArrayFunctionCall(`${'('.repeat(depth)}SUM(1)${')'.repeat(depth)}`)).toBe(false);
    expect(isWholeArrayFunctionCall(`${'('.repeat(depth)}SEQUENCE(1)${')'.repeat(depth - 1)}`)).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('should not find a formula Excel Online saves plain', () => {
    expect(isWholeArrayFunctionCall('SUM(A1:A3)')).toBe(false);
    expect(isWholeArrayFunctionCall('MAX(A1:A3)')).toBe(false);
    expect(isWholeArrayFunctionCall('VLOOKUP(2,A1:A3,1,FALSE)')).toBe(false);
    expect(isWholeArrayFunctionCall('INDEX(A1:A3,2)')).toBe(false);
    expect(isWholeArrayFunctionCall('CHOOSE(1,A1,A2)')).toBe(false);
    expect(isWholeArrayFunctionCall('OFFSET(A1,1,0)')).toBe(false);
    expect(isWholeArrayFunctionCall('IF(A1>0,"y","n")')).toBe(false);
    expect(isWholeArrayFunctionCall('SUM(SEQUENCE(3))')).toBe(false);
    expect(isWholeArrayFunctionCall('A1+A2')).toBe(false);
  });

  it('should not find a call that is only a part of the formula', () => {
    expect(isWholeArrayFunctionCall('SEQUENCE(1)+1')).toBe(false);
    expect(isWholeArrayFunctionCall('(SEQUENCE(1))*2')).toBe(false);
    expect(isWholeArrayFunctionCall('SEQUENCE(1)+SEQUENCE(1)')).toBe(false);
    expect(isWholeArrayFunctionCall('(SEQUENCE(1))+(SEQUENCE(1))')).toBe(false);
    expect(isWholeArrayFunctionCall('LAMBDA(x,x+1)(2)')).toBe(false);
  });

  it('should not match a longer name, a name with no call, a string, or an unclosed call', () => {
    expect(isWholeArrayFunctionCall('MYSEQUENCE(1)')).toBe(false);
    expect(isWholeArrayFunctionCall('SEQUENCE')).toBe(false);
    expect(isWholeArrayFunctionCall('"SEQUENCE(1)"')).toBe(false);
    expect(isWholeArrayFunctionCall('LEN("SEQUENCE(")')).toBe(false);
    expect(isWholeArrayFunctionCall('SEQUENCE(1')).toBe(false);
    expect(isWholeArrayFunctionCall('')).toBe(false);
  });

  it('should skip parentheses inside a string argument', () => {
    expect(isWholeArrayFunctionCall('INDIRECT(")"&"A1")')).toBe(true);
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

describe('callsArrayFormulaAsOperand', () => {
  it('should find a call that is an operand', () => {
    expect(callsArrayFormulaAsOperand('ARRAYFORMULA(A1:A3)*2')).toBe(true);
    expect(callsArrayFormulaAsOperand('-ARRAYFORMULA(A1:A3)')).toBe(true);
    expect(callsArrayFormulaAsOperand('SUM(ARRAYFORMULA(A1:A3) * 2)')).toBe(true);
    expect(callsArrayFormulaAsOperand('SUM(A1, 1+ARRAYFORMULA(A1:A3))')).toBe(true);
  });

  it('should not find a call that is the whole formula or a whole function argument', () => {
    expect(callsArrayFormulaAsOperand('ARRAYFORMULA(A1:A3*2)')).toBe(false);
    expect(callsArrayFormulaAsOperand('SUM(ARRAYFORMULA(A1:A3*2))')).toBe(false);
    expect(callsArrayFormulaAsOperand('FILTER(A1:A6, ARRAYFORMULA(A1:A6>3))')).toBe(false);
  });

  it('should not count a call inside another ARRAYFORMULA call, a quoted run, or a formula with no call', () => {
    expect(callsArrayFormulaAsOperand('ARRAYFORMULA(ARRAYFORMULA(A1:A3)*2)')).toBe(false);
    expect(callsArrayFormulaAsOperand('LEN("ARRAYFORMULA(x)*2")')).toBe(false);
    expect(callsArrayFormulaAsOperand('A1*2')).toBe(false);
  });
});

describe('stripArrayFormulaCalls', () => {
  it('should unwrap a whole ARRAYFORMULA call, case-insensitively', () => {
    expect(stripArrayFormulaCalls('ARRAYFORMULA(A1:A3*2)')).toBe('A1:A3*2');
    expect(stripArrayFormulaCalls('arrayformula(SUM(A1:A3))')).toBe('SUM(A1:A3)');
  });

  it('should strip a nested call', () => {
    expect(stripArrayFormulaCalls('ARRAYFORMULA(ARRAYFORMULA(A1:A3*2))')).toBe('A1:A3*2');
  });

  it('should drop the parentheses of a call that is a whole function argument', () => {
    expect(stripArrayFormulaCalls('SUM(ARRAYFORMULA(A1:A3*2))')).toBe('SUM(A1:A3*2)');
    expect(stripArrayFormulaCalls('IF(A1, ARRAYFORMULA(B1:B3+1) ,0)')).toBe('IF(A1, B1:B3+1 ,0)');
  });

  it('should keep the parentheses of a call that is an operand', () => {
    expect(stripArrayFormulaCalls('ARRAYFORMULA(A1:A3)*2')).toBe('(A1:A3)*2');
    expect(stripArrayFormulaCalls('-ARRAYFORMULA(A1+1)')).toBe('-(A1+1)');
    expect(stripArrayFormulaCalls('ARRAYFORMULA(A1)+ARRAYFORMULA(A2)')).toBe('(A1)+(A2)');
  });

  it('should ignore string literals and quoted sheet names', () => {
    expect(stripArrayFormulaCalls('ARRAYFORMULA(A1&")")')).toBe('A1&")"');
    expect(stripArrayFormulaCalls('LEN("ARRAYFORMULA(x)")')).toBe('LEN("ARRAYFORMULA(x)")');
    expect(stripArrayFormulaCalls('\'ARRAYFORMULA(\'!A1')).toBe('\'ARRAYFORMULA(\'!A1');
  });

  it('should not strip a longer name that ends in ARRAYFORMULA', () => {
    expect(stripArrayFormulaCalls('MYARRAYFORMULA(A1)')).toBe('MYARRAYFORMULA(A1)');
  });

  it('should leave an empty or unclosed call as it is', () => {
    // An empty inner text was written as an array formula with no formula text.
    expect(stripArrayFormulaCalls('ARRAYFORMULA()')).toBe('ARRAYFORMULA()');
    expect(stripArrayFormulaCalls('ARRAYFORMULA(  )')).toBe('ARRAYFORMULA(  )');
    expect(stripArrayFormulaCalls('ARRAYFORMULA(A1')).toBe('ARRAYFORMULA(A1');
  });

  it('should return any other formula unchanged', () => {
    expect(stripArrayFormulaCalls('SUM(A1:A3)')).toBe('SUM(A1:A3)');
  });
});

describe('appliesOperatorToRange', () => {
  it('should count a defined name as a range only when the caller says it is one', () => {
    const isRangeName = word => word.toLowerCase() === 'sales';

    expect(appliesOperatorToRange('SUM(Sales*2)', isRangeName)).toBe(true);
    expect(appliesOperatorToRange('SUM((Sales)*2)', isRangeName)).toBe(true);
    expect(appliesOperatorToRange('SUM(-SALES)', isRangeName)).toBe(true);
    expect(appliesOperatorToRange('SUM(Sales*2)')).toBe(false);
    expect(appliesOperatorToRange('SUM(Rate*2)', isRangeName)).toBe(false);
    expect(appliesOperatorToRange('SUM(Sales)', isRangeName)).toBe(false);
    expect(appliesOperatorToRange('Sales', isRangeName)).toBe(false);
    expect(appliesOperatorToRange('SUM("Sales"&1)', isRangeName)).toBe(false);
  });

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

describe('isMultiCellRangeDefinition', () => {
  it('should find a definition that is one multi-cell range', () => {
    expect(isMultiCellRangeDefinition('=Data!$A$1:$A$6')).toBe(true);
    expect(isMultiCellRangeDefinition('=\'My Data\'!$A$1:$B$2')).toBe(true);
    expect(isMultiCellRangeDefinition('=Data!$B:$B')).toBe(true);
    expect(isMultiCellRangeDefinition('Data!$1:$2')).toBe(true);
    // A comma or a `!` inside a quoted sheet name is part of the name.
    expect(isMultiCellRangeDefinition('=\'Q1, 2024\'!$A$1:$A$6')).toBe(true);
    expect(isMultiCellRangeDefinition('=\'Q1!x\'!$A$1:$A$6')).toBe(true);
    expect(isMultiCellRangeDefinition('=\'O\'\'Brien, Ltd\'!$A$1:$B$2')).toBe(true);
  });

  it('should not find a single cell, a constant, a union, or a formula', () => {
    expect(isMultiCellRangeDefinition('=Data!$A$1')).toBe(false);
    expect(isMultiCellRangeDefinition('=Data!$A$1:$A$1')).toBe(false);
    expect(isMultiCellRangeDefinition('=0.07')).toBe(false);
    expect(isMultiCellRangeDefinition('=Data!$A$1:$A$3,Data!$C$1:$C$3')).toBe(false);
    expect(isMultiCellRangeDefinition('=\'Q1, 2024\'!$A$1:$A$3,\'Q1, 2024\'!$C$1:$C$3')).toBe(false);
    expect(isMultiCellRangeDefinition('=\'Q1, 2024\'!$A$1')).toBe(false);
    expect(isMultiCellRangeDefinition('=\'Q1, 2024\'')).toBe(false);
    expect(isMultiCellRangeDefinition('=Data!$A$1:$A$3*2')).toBe(false);
    expect(isMultiCellRangeDefinition('=SUM(Data!$A$1:$A$3)')).toBe(false);
  });
});
