/**
 * Matches the run of prefixes Excel writes in front of a name in a stored formula (`<f>`).
 * `_xlfn.` marks a function added after Excel 2007, `_xlws.` a worksheet-only function (written
 * after `_xlfn.`), and `_xlpm.` a `LET`/`LAMBDA` parameter name. The formula bar shows none of
 * them. One anchored match strips any number of them in linear time.
 */
const STORED_PREFIXES = /^(?:_xl(?:fn|ws|pm)\.)+/i;

/**
 * The functions Excel stores with the `_xlfn._xlws.` prefix.
 */
const WORKSHEET_FUNCTIONS = new Set(['FILTER', 'SORT']);

/**
 * The functions Excel stores with the `_xlfn.` prefix - every function added after Excel 2007.
 * A file that holds one of these without the prefix shows `#NAME?` in Excel until the cell is
 * entered again. `NETWORKDAYS.INTL`, `WORKDAY.INTL`, `ISO.CEILING` and `ECMA.CEILING` are not
 * here: Excel saves them bare, and LibreOffice shows `#NAME?` for the prefixed spelling.
 */
const FUTURE_FUNCTIONS = new Set([
  'ACOT', 'ACOTH', 'AGGREGATE', 'ANCHORARRAY', 'ARABIC', 'ARRAYTOTEXT', 'BASE', 'BETA.DIST',
  'BETA.INV', 'BINOM.DIST', 'BINOM.DIST.RANGE', 'BINOM.INV', 'BITAND', 'BITLSHIFT', 'BITOR',
  'BITRSHIFT', 'BITXOR', 'BYCOL', 'BYROW', 'CEILING.MATH', 'CEILING.PRECISE', 'CHISQ.DIST',
  'CHISQ.DIST.RT', 'CHISQ.INV', 'CHISQ.INV.RT', 'CHISQ.TEST', 'CHOOSECOLS', 'CHOOSEROWS', 'COMBINA',
  'CONCAT', 'CONFIDENCE.NORM', 'CONFIDENCE.T', 'COT', 'COTH', 'COVARIANCE.P', 'COVARIANCE.S', 'CSC',
  'CSCH', 'DAYS', 'DECIMAL', 'DROP', 'ENCODEURL', 'ERF.PRECISE', 'ERFC.PRECISE',
  'EXPAND', 'EXPON.DIST', 'F.DIST', 'F.DIST.RT', 'F.INV', 'F.INV.RT', 'F.TEST', 'FIELDVALUE',
  'FILTERXML', 'FLOOR.MATH', 'FLOOR.PRECISE', 'FORECAST.ETS', 'FORECAST.ETS.CONFINT',
  'FORECAST.ETS.SEASONALITY', 'FORECAST.ETS.STAT', 'FORECAST.LINEAR', 'FORMULATEXT', 'GAMMA',
  'GAMMA.DIST', 'GAMMA.INV', 'GAMMALN.PRECISE', 'GAUSS', 'GROUPBY', 'HSTACK', 'HYPGEOM.DIST',
  'IFNA', 'IFS', 'IMAGE', 'IMCOSH', 'IMCOT', 'IMCSC', 'IMCSCH', 'IMSEC', 'IMSECH', 'IMSINH',
  'IMTAN', 'ISFORMULA', 'ISOMITTED', 'ISOWEEKNUM', 'LAMBDA', 'LET', 'LOGNORM.DIST',
  'LOGNORM.INV', 'MAKEARRAY', 'MAP', 'MAXIFS', 'MINIFS', 'MODE.MULT', 'MODE.SNGL', 'MUNIT',
  'NEGBINOM.DIST', 'NORM.DIST', 'NORM.INV', 'NORM.S.DIST', 'NORM.S.INV',
  'NUMBERVALUE', 'PDURATION', 'PERCENTILE.EXC', 'PERCENTILE.INC', 'PERCENTOF', 'PERCENTRANK.EXC',
  'PERCENTRANK.INC', 'PERMUTATIONA', 'PHI', 'PIVOTBY', 'POISSON.DIST', 'QUARTILE.EXC',
  'QUARTILE.INC', 'QUERYSTRING', 'RANDARRAY', 'RANK.AVG', 'RANK.EQ', 'REDUCE', 'REGEXEXTRACT',
  'REGEXREPLACE', 'REGEXTEST', 'RRI', 'SCAN', 'SEC', 'SECH', 'SEQUENCE', 'SHEET', 'SHEETS',
  'SINGLE', 'SKEW.P', 'SORTBY', 'STDEV.P', 'STDEV.S', 'STOCKHISTORY', 'SWITCH', 'T.DIST',
  'T.DIST.2T', 'T.DIST.RT', 'T.INV', 'T.INV.2T', 'T.TEST', 'TAKE', 'TEXTAFTER', 'TEXTBEFORE',
  'TEXTJOIN', 'TEXTSPLIT', 'TOCOL', 'TOROW', 'TRIMRANGE', 'UNICHAR', 'UNICODE', 'UNIQUE',
  'VALUETOTEXT', 'VAR.P', 'VAR.S', 'VSTACK', 'WEBSERVICE', 'WEIBULL.DIST',
  'WRAPCOLS', 'WRAPROWS', 'XLOOKUP', 'XMATCH', 'XOR', 'Z.TEST',
]);

/**
 * Whether a character can continue a name token (a function name, a defined name, a reference).
 *
 * @param {string} char The character.
 * @returns {boolean}
 */
function isNameChar(char: string): boolean {
  const code = char.charCodeAt(0);

  // Almost every character of a formula is ASCII, and this runs once per character on both write
  // paths, so the Unicode test is kept for the rest only (review round 12).
  if (code < 128) {
    return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
      || code === 95 || code === 46 || code === 92;
  }

  return /[\p{L}\p{N}]/u.test(char);
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

  return mapNames(formula, name => name.replace(STORED_PREFIXES, ''));
}

/**
 * Adds the prefix Excel expects in a stored formula in front of every function added after
 * Excel 2007 (`IFS(` becomes `_xlfn.IFS(`, `SORT(` becomes `_xlfn._xlws.SORT(`), and in front of
 * every parameter name of a `LET` or `LAMBDA` call (`_xlpm.x`). A name is prefixed as a function
 * only when a `(` follows it, so a defined name that happens to match is left alone, and a name that
 * already carries a prefix is kept as it is.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {string}
 */
export function addFunctionPrefixes(formula: string): string {
  const prefixed = mapNames(formula, (name, end) => {
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

  return PARAMETER_CALL_HINT.test(prefixed) ? addParameterPrefixes(prefixed) : prefixed;
}

/**
 * Matches a stored `LET` or `LAMBDA` call, the cheap test that decides whether the parameter pass
 * has to walk the formula at all.
 */
const PARAMETER_CALL_HINT = /_xlfn\.(?:LET|LAMBDA)\(/i;

/**
 * A name a `LET` or `LAMBDA` call may declare as a parameter. Anything else in a parameter
 * position (an expression, a name that already carries `_xlpm.`) is left as written.
 */
const PARAMETER_NAME = /^[\p{L}_\\][\p{L}\p{N}_.]*$/u;

/**
 * Returns the index of the `)` that closes the call whose `(` is at `open`, or `-1` when the formula
 * ends first. Quoted runs are skipped.
 *
 * @param {string} formula The formula.
 * @param {number} open The index of the opening parenthesis.
 * @returns {number}
 */
function findClosingParen(formula: string, open: number): number {
  let depth = 0;
  let index = open;

  while (index < formula.length) {
    const char = formula[index];

    if (char === '"' || char === '\'') {
      index = skipQuoted(formula, index);
    } else {
      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;

        if (depth === 0) {
          return index;
        }
      }

      index += 1;
    }
  }

  return -1;
}

/**
 * Splits a call's argument text at its top-level commas. Quoted runs, parentheses and array
 * constants (`{1,2}`) keep their commas.
 *
 * @param {string} args The text between the call's parentheses.
 * @returns {string[]}
 */
function splitArguments(args: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let index = 0;

  while (index < args.length) {
    const char = args[index];

    if (char === '"' || char === '\'') {
      index = skipQuoted(args, index);
    } else {
      if (char === '(' || char === '{') {
        depth += 1;
      } else if (char === ')' || char === '}') {
        depth -= 1;
      } else if (char === ',' && depth === 0) {
        parts.push(args.slice(start, index));
        start = index + 1;
      }

      index += 1;
    }
  }

  parts.push(args.slice(start));

  return parts;
}

/**
 * The parameter names a stored `LET` or `LAMBDA` call declares, upper-cased: every argument but
 * the last of a `LAMBDA`, and every other argument but the last of a `LET` (the rest are values).
 *
 * @param {string} upperFunction `_XLFN.LET` or `_XLFN.LAMBDA`.
 * @param {string[]} args The call's arguments.
 * @returns {Set<string>}
 */
function declaredParameters(upperFunction: string, args: string[]): Set<string> {
  const names = new Set<string>();

  args.slice(0, -1).forEach((arg, position) => {
    const name = arg.trim();

    if ((upperFunction === '_XLFN.LAMBDA' || position % 2 === 0) && PARAMETER_NAME.test(name)) {
      names.add(name.toUpperCase());
    }
  });

  return names;
}

/**
 * Adds `_xlpm.` in front of every parameter name of every stored `LET` and `LAMBDA` call, in the
 * declarations and in their uses inside the call. Excel stores them that way and, as the import
 * strips the prefix, writing the bare name back made Excel read it as an unknown name and show
 * `#NAME?` (review round 12). A parameter called as a function (`x(5)`, a `LAMBDA` bound by `LET`)
 * is a use too, and inside its call the parameter wins over a function of the same name; a
 * sheet-qualified name (`Sheet1!x`) is not. A nested call is handled first, so its own parameters are prefixed before the outer call's
 * names are matched.
 *
 * @param {string} formula The formula, already carrying its `_xlfn.` prefixes.
 * @returns {string}
 */
function addParameterPrefixes(formula: string): string {
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

      const name = formula.slice(index, end);
      const upperName = name.toUpperCase();
      const close = formula[end] === '(' && (upperName === '_XLFN.LET' || upperName === '_XLFN.LAMBDA')
        ? findClosingParen(formula, end) : -1;

      if (close === -1) {
        result += name;
        index = end;
      } else {
        const inner = addParameterPrefixes(formula.slice(end + 1, close));
        const parameters = declaredParameters(upperName, splitArguments(inner));

        result += `${name}(${prefixParameterUses(inner, parameters)})`;
        index = close + 1;
      }

    } else {
      result += char;
      index += 1;
    }
  }

  return result;
}

/**
 * Prefixes every use of the given parameter names in a call's argument text.
 *
 * @param {string} args The text between the call's parentheses.
 * @param {Set<string>} parameters The upper-cased parameter names.
 * @returns {string}
 */
function prefixParameterUses(args: string, parameters: Set<string>): string {
  if (parameters.size === 0) {
    return args;
  }

  return mapNames(args, (name, end) => {
    const start = end - name.length;
    const isUse = parameters.has(name.toUpperCase()) && args[start - 1] !== '!';

    return isUse ? `_xlpm.${name}` : name;
  });
}
