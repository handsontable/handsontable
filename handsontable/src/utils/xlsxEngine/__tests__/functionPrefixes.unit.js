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

  it('should strip a 400 000-character run of prefixes in work linear in its length', () => {
    // The strip once lower-cased and sliced the rest of the token once per prefix, which is
    // quadratic and returns the same result. Pinned by the characters the string methods are
    // handed rather than by a clock: the linear strip reads the token a constant number of times,
    // the quadratic one about n / 12 times.
    const prefixes = '_xlfn.'.repeat(66667);
    const formula = `${prefixes}SUM(A1)`;
    const methods = ['slice', 'substring', 'substr', 'toLowerCase', 'toUpperCase', 'startsWith', 'replace',
      'match', 'indexOf', 'search', 'split', 'trim', 'trimStart'];
    const originals = methods.map(name => String.prototype[name]);
    let charactersRead = 0;
    let result;

    methods.forEach((name, index) => {
      // eslint-disable-next-line no-extend-native
      String.prototype[name] = function(...args) {
        charactersRead += this.length;

        return originals[index].apply(this, args);
      };
    });

    try {
      result = stripFunctionPrefixes(formula);
    } finally {
      methods.forEach((name, index) => {
        // eslint-disable-next-line no-extend-native
        String.prototype[name] = originals[index];
      });
    }

    expect(formula.length).toBeGreaterThan(400000);
    expect(result).toBe('SUM(A1)');
    expect(charactersRead).toBeLessThan(formula.length * 8);
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

describe('functionPrefixes name boundaries (review round 12)', () => {
  it('should end a name at every ASCII character that is not a letter, digit, underscore, dot or backslash', () => {
    const separators = Array.from({ length: 128 }, (_, code) => String.fromCharCode(code))
      .filter(char => !/[A-Za-z0-9_.\\]/.test(char) && char !== '"' && char !== '\'' && char !== '(');

    separators.forEach((separator) => {
      expect(addFunctionPrefixes(`A1${separator}IFS(1,2)`)).toBe(`A1${separator}_xlfn.IFS(1,2)`);
    });
  });

  it('should keep a letter, digit, underscore, dot or backslash inside a name', () => {
    expect(addFunctionPrefixes('MY_IFS(1)')).toBe('MY_IFS(1)');
    expect(addFunctionPrefixes('X.IFS(1)')).toBe('X.IFS(1)');
    expect(addFunctionPrefixes('\\IFS(1)')).toBe('\\IFS(1)');
    expect(addFunctionPrefixes('9IFS(1)')).toBe('9IFS(1)');
  });

  it('should still read a non-ASCII letter or digit as part of a name', () => {
    expect(addFunctionPrefixes('éIFS(1)+IFS(2)')).toBe('éIFS(1)+_xlfn.IFS(2)');
    expect(addFunctionPrefixes('١IFS(1)')).toBe('١IFS(1)');
    expect(addFunctionPrefixes('×IFS(1)')).toBe('×_xlfn.IFS(1)');
  });
});

describe('functionPrefixes LET and LAMBDA parameters (review round 12)', () => {
  it('should prefix the parameter names of a LET call, in their declarations and their uses', () => {
    expect(addFunctionPrefixes('LET(x,1,x+1)')).toBe('_xlfn.LET(_xlpm.x,1,_xlpm.x+1)');
    expect(addFunctionPrefixes('LET(total,SUM(A1:A3),rate,0.2,total*rate)'))
      .toBe('_xlfn.LET(_xlpm.total,SUM(A1:A3),_xlpm.rate,0.2,_xlpm.total*_xlpm.rate)');
  });

  it('should prefix every parameter of a LAMBDA, and leave the arguments it is called with alone', () => {
    expect(addFunctionPrefixes('LAMBDA(x,y,x*y)(2,3)')).toBe('_xlfn.LAMBDA(_xlpm.x,_xlpm.y,_xlpm.x*_xlpm.y)(2,3)');
  });

  it('should round-trip the stored form Excel writes', () => {
    const stored = '_xlfn.LET(_xlpm.x,_xlfn.LAMBDA(_xlpm.n,_xlpm.n*2),_xlpm.x(5))';

    expect(stripFunctionPrefixes(stored)).toBe('LET(x,LAMBDA(n,n*2),x(5))');
    expect(addFunctionPrefixes(stripFunctionPrefixes(stored))).toBe(stored);
  });

  it('should not prefix a value position, a function name, a sheet-qualified name or text in quotes', () => {
    expect(addFunctionPrefixes('LET(x,y,x&"x"&Sheet1!x&y)'))
      .toBe('_xlfn.LET(_xlpm.x,y,_xlpm.x&"x"&Sheet1!x&y)');
    expect(addFunctionPrefixes('LET(s,1,SUM(s))')).toBe('_xlfn.LET(_xlpm.s,1,SUM(_xlpm.s))');
  });

  it('should keep each call\'s parameters inside that call', () => {
    expect(addFunctionPrefixes('LET(a,1,a)+a')).toBe('_xlfn.LET(_xlpm.a,1,_xlpm.a)+a');
    expect(addFunctionPrefixes('LET(a,LET(b,2,b),a+b)'))
      .toBe('_xlfn.LET(_xlpm.a,_xlfn.LET(_xlpm.b,2,_xlpm.b),_xlpm.a+b)');
  });

  it('should leave an unbalanced call as written', () => {
    expect(addFunctionPrefixes('LET(x,1,x+1')).toBe('_xlfn.LET(x,1,x+1');
  });

  it('should not touch a formula without LET or LAMBDA', () => {
    expect(addFunctionPrefixes('IFS(x,1)+x')).toBe('_xlfn.IFS(x,1)+x');
  });
});
