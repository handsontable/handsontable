import { isNameChar, skipQuoted } from './functionPrefixes';

/**
 * The functions Excel 365 evaluates as dynamic arrays, so a cell that calls one is written with
 * the dynamic-array flag. Upper case, without the `_xlfn.` prefix.
 */
export const EXCEL_DYNAMIC_ARRAY_FUNCTIONS: ReadonlySet<string> = new Set(['IFS', 'SWITCH']);

const XLFN_PREFIX = '_xlfn.';

/**
 * Whether a formula calls a function of {@link EXCEL_DYNAMIC_ARRAY_FUNCTIONS}: a name token in the
 * set, with or without the `_xlfn.` prefix, directly followed by `(`. Quoted runs (string literals
 * and sheet names) are skipped.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {boolean}
 */
export function callsDynamicArrayFunction(formula: string): boolean {
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === '"' || char === '\'') {
      index = skipQuoted(formula, index);

    } else if (isNameChar(char)) {
      let end = index + 1;

      while (end < formula.length && isNameChar(formula[end])) {
        end += 1;
      }

      let name = formula.slice(index, end).toUpperCase();

      if (name.startsWith(XLFN_PREFIX.toUpperCase())) {
        name = name.slice(XLFN_PREFIX.length);
      }

      if (formula[end] === '(' && EXCEL_DYNAMIC_ARRAY_FUNCTIONS.has(name)) {
        return true;
      }

      index = end;

    } else {
      index += 1;
    }
  }

  return false;
}

const ARRAYFORMULA_OPENING = 'ARRAYFORMULA(';

/**
 * Unwraps a formula that is one `ARRAYFORMULA(…)` call as a whole: `ARRAYFORMULA(x)` gives `x`.
 * Returns `null` when the formula is anything else, including `ARRAYFORMULA(a)+ARRAYFORMULA(b)`.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {string|null}
 */
export function unwrapArrayFormula(formula: string): string | null {
  if (formula.slice(0, ARRAYFORMULA_OPENING.length).toUpperCase() !== ARRAYFORMULA_OPENING) {
    return null;
  }

  let depth = 1;
  let index = ARRAYFORMULA_OPENING.length;

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
          return index === formula.length - 1 ? formula.slice(ARRAYFORMULA_OPENING.length, index) : null;
        }
      }

      index += 1;
    }
  }

  return null;
}
