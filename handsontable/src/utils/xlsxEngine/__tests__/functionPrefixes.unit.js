import { addFunctionPrefixes, stripFunctionPrefixes } from '../functionPrefixes';

describe('functionPrefixes', () => {
  it('should strip the prefixes Excel stores in front of post-2007 functions', () => {
    expect(stripFunctionPrefixes('_xlfn.STDEV.S(A1:A3)')).toBe('STDEV.S(A1:A3)');
    expect(stripFunctionPrefixes('_xlfn.IFS(A1>1,"a",TRUE,"b")')).toBe('IFS(A1>1,"a",TRUE,"b")');
    expect(stripFunctionPrefixes('_xlfn._xlws.SORT(A1:A9)')).toBe('SORT(A1:A9)');
    expect(stripFunctionPrefixes('_xlfn.LET(_xlpm.x,1,_xlpm.x+1)')).toBe('LET(x,1,x+1)');
    expect(stripFunctionPrefixes('SUM(_XLFN.CONCAT(A1,B1))')).toBe('SUM(CONCAT(A1,B1))');
  });

  it('should leave a prefix inside a string or a quoted sheet name alone', () => {
    expect(stripFunctionPrefixes('"_xlfn.IFS("&A1')).toBe('"_xlfn.IFS("&A1');
    expect(stripFunctionPrefixes('\'_xlfn.Data\'!A1+_xlfn.XOR(1,0)')).toBe('\'_xlfn.Data\'!A1+XOR(1,0)');
    expect(stripFunctionPrefixes('"a""_xlfn.b"')).toBe('"a""_xlfn.b"');
  });

  it('should return a formula with no prefix unchanged', () => {
    expect(stripFunctionPrefixes('SUM(A1:A3)')).toBe('SUM(A1:A3)');
  });

  it('should add the prefix Excel expects in front of post-2007 functions', () => {
    expect(addFunctionPrefixes('IFS(A1>1,"a",TRUE,"b")')).toBe('_xlfn.IFS(A1>1,"a",TRUE,"b")');
    expect(addFunctionPrefixes('stdev.s(A1:A3)')).toBe('_xlfn.stdev.s(A1:A3)');
    expect(addFunctionPrefixes('SORT(FILTER(A1:A9,A1:A9>0))'))
      .toBe('_xlfn._xlws.SORT(_xlfn._xlws.FILTER(A1:A9,A1:A9>0))');
    expect(addFunctionPrefixes('SUM(XLOOKUP(1,A:A,B:B))')).toBe('SUM(_xlfn.XLOOKUP(1,A:A,B:B))');
  });

  it('should write the Excel 2010 dotted functions Excel stores bare without a prefix', () => {
    // Excel saves these four without `_xlfn.`, and LibreOffice shows `#NAME?` for the prefixed
    // spelling once it recalculates.
    expect(addFunctionPrefixes('NETWORKDAYS.INTL(A1,B1,1)')).toBe('NETWORKDAYS.INTL(A1,B1,1)');
    expect(addFunctionPrefixes('WORKDAY.INTL(A1,5)')).toBe('WORKDAY.INTL(A1,5)');
    expect(addFunctionPrefixes('ISO.CEILING(A1,2)')).toBe('ISO.CEILING(A1,2)');
    expect(addFunctionPrefixes('ECMA.CEILING(A1,2)')).toBe('ECMA.CEILING(A1,2)');
  });

  it('should strip the prefix from the dotted functions other writers store prefixed', () => {
    // Google Sheets writes them with `_xlfn.`.
    expect(stripFunctionPrefixes('_xlfn.NETWORKDAYS.INTL(A1,B1)')).toBe('NETWORKDAYS.INTL(A1,B1)');
    expect(stripFunctionPrefixes('_xlfn.WORKDAY.INTL(A1,5)')).toBe('WORKDAY.INTL(A1,5)');
    expect(stripFunctionPrefixes('_xlfn.ISO.CEILING(A1,2)')).toBe('ISO.CEILING(A1,2)');
  });

  it('should strip a token made of thousands of repeated prefixes down to the name', () => {
    const prefixes = '_xlfn.'.repeat(5460);

    expect(prefixes.length).toBe(32760);
    expect(stripFunctionPrefixes(`${prefixes}SUM(A1)`)).toBe('SUM(A1)');
    expect(stripFunctionPrefixes(`${'_xlfn._XLWS._xlpm.'.repeat(1820)}SORT(A1:A9)`)).toBe('SORT(A1:A9)');
    expect(stripFunctionPrefixes('_xlfn._xlfn.')).toBe('');
    expect(stripFunctionPrefixes('_xlfn._xlfnX')).toBe('_xlfnX');
  });

  it('should not prefix a pre-2007 function, a name without a call, or text in a string', () => {
    expect(addFunctionPrefixes('SUM(A1)+CONCATENATE(A1,B1)')).toBe('SUM(A1)+CONCATENATE(A1,B1)');
    expect(addFunctionPrefixes('IFS+1')).toBe('IFS+1');
    expect(addFunctionPrefixes('"IFS("&A1')).toBe('"IFS("&A1');
    expect(addFunctionPrefixes('_xlfn.IFS(1,2)')).toBe('_xlfn.IFS(1,2)');
  });

  it('should round-trip a formula through add and strip', () => {
    const formula = 'IFS(A1>1,TEXTJOIN(",",TRUE,B1:B3),TRUE,SORT(C1:C3))';

    expect(stripFunctionPrefixes(addFunctionPrefixes(formula))).toBe(formula);
  });
});
