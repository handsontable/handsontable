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
