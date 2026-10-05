/**
 * The prefixes Excel writes in front of a name in a stored formula (`<f>`). `_xlfn.` marks a
 * function added after Excel 2007, `_xlws.` a worksheet-only function (written after `_xlfn.`),
 * and `_xlpm.` a `LET`/`LAMBDA` parameter name. The formula bar shows none of them.
 */
const STORED_PREFIXES = ['_xlfn.', '_xlws.', '_xlpm.'];

/**
 * The functions Excel stores with the `_xlfn._xlws.` prefix.
 */
const WORKSHEET_FUNCTIONS = new Set(['FILTER', 'SORT']);

/**
 * The functions Excel stores with the `_xlfn.` prefix - every function added after Excel 2007.
 * A file that holds one of these without the prefix shows `#NAME?` in Excel until the cell is
 * entered again.
 */
const FUTURE_FUNCTIONS = new Set([
  'ACOT', 'ACOTH', 'AGGREGATE', 'ANCHORARRAY', 'ARABIC', 'ARRAYTOTEXT', 'BASE', 'BETA.DIST',
  'BETA.INV', 'BINOM.DIST', 'BINOM.DIST.RANGE', 'BINOM.INV', 'BITAND', 'BITLSHIFT', 'BITOR',
  'BITRSHIFT', 'BITXOR', 'BYCOL', 'BYROW', 'CEILING.MATH', 'CEILING.PRECISE', 'CHISQ.DIST',
  'CHISQ.DIST.RT', 'CHISQ.INV', 'CHISQ.INV.RT', 'CHISQ.TEST', 'CHOOSECOLS', 'CHOOSEROWS', 'COMBINA',
  'CONCAT', 'CONFIDENCE.NORM', 'CONFIDENCE.T', 'COT', 'COTH', 'COVARIANCE.P', 'COVARIANCE.S', 'CSC',
  'CSCH', 'DAYS', 'DECIMAL', 'DROP', 'ECMA.CEILING', 'ENCODEURL', 'ERF.PRECISE', 'ERFC.PRECISE',
  'EXPAND', 'EXPON.DIST', 'F.DIST', 'F.DIST.RT', 'F.INV', 'F.INV.RT', 'F.TEST', 'FIELDVALUE',
  'FILTERXML', 'FLOOR.MATH', 'FLOOR.PRECISE', 'FORECAST.ETS', 'FORECAST.ETS.CONFINT',
  'FORECAST.ETS.SEASONALITY', 'FORECAST.ETS.STAT', 'FORECAST.LINEAR', 'FORMULATEXT', 'GAMMA',
  'GAMMA.DIST', 'GAMMA.INV', 'GAMMALN.PRECISE', 'GAUSS', 'GROUPBY', 'HSTACK', 'HYPGEOM.DIST',
  'IFNA', 'IFS', 'IMAGE', 'IMCOSH', 'IMCOT', 'IMCSC', 'IMCSCH', 'IMSEC', 'IMSECH', 'IMSINH',
  'IMTAN', 'ISFORMULA', 'ISO.CEILING', 'ISOMITTED', 'ISOWEEKNUM', 'LAMBDA', 'LET', 'LOGNORM.DIST',
  'LOGNORM.INV', 'MAKEARRAY', 'MAP', 'MAXIFS', 'MINIFS', 'MODE.MULT', 'MODE.SNGL', 'MUNIT',
  'NEGBINOM.DIST', 'NETWORKDAYS.INTL', 'NORM.DIST', 'NORM.INV', 'NORM.S.DIST', 'NORM.S.INV',
  'NUMBERVALUE', 'PDURATION', 'PERCENTILE.EXC', 'PERCENTILE.INC', 'PERCENTOF', 'PERCENTRANK.EXC',
  'PERCENTRANK.INC', 'PERMUTATIONA', 'PHI', 'PIVOTBY', 'POISSON.DIST', 'QUARTILE.EXC',
  'QUARTILE.INC', 'QUERYSTRING', 'RANDARRAY', 'RANK.AVG', 'RANK.EQ', 'REDUCE', 'REGEXEXTRACT',
  'REGEXREPLACE', 'REGEXTEST', 'RRI', 'SCAN', 'SEC', 'SECH', 'SEQUENCE', 'SHEET', 'SHEETS',
  'SINGLE', 'SKEW.P', 'SORTBY', 'STDEV.P', 'STDEV.S', 'STOCKHISTORY', 'SWITCH', 'T.DIST',
  'T.DIST.2T', 'T.DIST.RT', 'T.INV', 'T.INV.2T', 'T.TEST', 'TAKE', 'TEXTAFTER', 'TEXTBEFORE',
  'TEXTJOIN', 'TEXTSPLIT', 'TOCOL', 'TOROW', 'TRIMRANGE', 'UNICHAR', 'UNICODE', 'UNIQUE',
  'VALUETOTEXT', 'VAR.P', 'VAR.S', 'VSTACK', 'WEBSERVICE', 'WEIBULL.DIST', 'WORKDAY.INTL',
  'WRAPCOLS', 'WRAPROWS', 'XLOOKUP', 'XMATCH', 'XOR', 'Z.TEST',
]);

/**
 * Whether a character can continue a name token (a function name, a defined name, a reference).
 *
 * @param {string} char The character.
 * @returns {boolean}
 */
function isNameChar(char: string): boolean {
  return /[\p{L}\p{N}_.\\]/u.test(char);
}

/**
 * Returns the index just past a quoted run that starts at `start` - a double-quoted string or a
 * single-quoted sheet name, where a doubled quote escapes one inside. An unterminated run ends the
 * formula.
 *
 * @param {string} formula The formula.
 * @param {number} start The index of the opening quote.
 * @returns {number}
 */
function skipQuoted(formula: string, start: number): number {
  const quote = formula[start];
  let index = start + 1;

  while (index < formula.length) {
    if (formula[index] === quote) {
      if (formula[index + 1] !== quote) {
        return index + 1;
      }

      index += 2;
    } else {
      index += 1;
    }
  }

  return formula.length;
}

/**
 * Walks a formula and hands every name token outside a quoted run to `mapName`, which returns the
 * text to write in its place. Quoted runs and every other character are copied through.
 *
 * @param {string} formula The formula.
 * @param {Function} mapName Receives the name and the index just past it.
 * @returns {string}
 */
function mapNames(formula: string, mapName: (name: string, end: number) => string): string {
  let result = '';
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === '"' || char === '\'') {
      const end = skipQuoted(formula, index);

      result += formula.slice(index, end);
      index = end;

    } else if (isNameChar(char)) {
      let end = index + 1;

      while (end < formula.length && isNameChar(formula[end])) {
        end += 1;
      }

      result += mapName(formula.slice(index, end), end);
      index = end;

    } else {
      result += char;
      index += 1;
    }
  }

  return result;
}

/**
 * Removes the `_xlfn.`, `_xlws.` and `_xlpm.` prefixes Excel stores in a formula, so the formula
 * reads the way the formula bar shows it (`_xlfn.STDEV.S(A1:A3)` becomes `STDEV.S(A1:A3)`). Text
 * inside a string literal or a quoted sheet name is left alone.
 *
 * @param {string} formula The stored formula, without the leading `=`.
 * @returns {string}
 */
export function stripFunctionPrefixes(formula: string): string {
  if (!/_xl/i.test(formula)) {
    return formula;
  }

  return mapNames(formula, (name) => {
    let stripped = name;
    let stripping = true;

    while (stripping) {
      const lowerName = stripped.toLowerCase();
      const prefix = STORED_PREFIXES.find(candidate => lowerName.startsWith(candidate));

      if (prefix === undefined) {
        stripping = false;
      } else {
        stripped = stripped.slice(prefix.length);
      }
    }

    return stripped;
  });
}

/**
 * Adds the prefix Excel expects in a stored formula in front of every function added after
 * Excel 2007 (`IFS(` becomes `_xlfn.IFS(`, `SORT(` becomes `_xlfn._xlws.SORT(`). A name is
 * prefixed only when a `(` follows it, so a defined name that happens to match is left alone, and
 * a name that already carries a prefix is kept as it is.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {string}
 */
export function addFunctionPrefixes(formula: string): string {
  return mapNames(formula, (name, end) => {
    if (formula[end] !== '(') {
      return name;
    }

    const upperName = name.toUpperCase();

    if (WORKSHEET_FUNCTIONS.has(upperName)) {
      return `_xlfn._xlws.${name}`;
    }

    if (FUTURE_FUNCTIONS.has(upperName)) {
      return `_xlfn.${name}`;
    }

    return name;
  });
}
