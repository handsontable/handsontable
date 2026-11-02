import { parseRangeRef } from './cellRef';
import { REFERENCE_REGEX } from './formulaRefs';
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

/**
 * The characters an operator Excel applies element by element is made of: `+ - * / ^ & = < >`
 * (`<>`, `<=` and `>=` included, and a unary `-`).
 */
const OPERATOR_CHARS = '+-*/^&=<>';

/**
 * Whether the character next to a position, skipping spaces, in the given direction, is one of
 * {@link OPERATOR_CHARS}.
 *
 * @param {string} formula The formula.
 * @param {number} index The position to start from.
 * @param {number} step `-1` to look left, `1` to look right.
 * @returns {boolean}
 */
function isOperatorNext(formula: string, index: number, step: number): boolean {
  let position = index;

  while (formula[position] === ' ') {
    position += step;
  }

  const char = formula[position];

  return char !== undefined && OPERATOR_CHARS.includes(char);
}

/**
 * Whether a reference spans more than one cell: a range with two different corners (`A1:A3`), a
 * whole column (`A:A`) or a whole row (`1:1`), qualified or not. `A1:A1` is one cell.
 *
 * @param {string} reference The reference, without its sheet qualifier.
 * @returns {boolean}
 */
function isMultiCellRange(reference: string): boolean {
  const range = reference.includes(':') ? parseRangeRef(reference) : null;

  return range !== null && (range.startRow !== range.endRow || range.startCol !== range.endCol);
}

/**
 * Whether a formula applies an operator to a multi-cell range: a range (`A1:A3`, `A:A`, `1:1`,
 * sheet-qualified or not, with two different corners) with an operator of {@link OPERATOR_CHARS}
 * right before or right after it, at any parenthesis depth (`SUM(A1:A3*B1:B3)`, `-A1:A3`). Under
 * HyperFormula's `useArrayArithmetic` such a formula computes over every cell of the range, while
 * Excel 365 opens a plain formula with an implicit-intersection `@` in front of the range, so the
 * cell is written as a one-cell dynamic array, as Excel saves it.
 *
 * Only the operator next to a range counts. A function that takes a range where it expects one
 * value (`SUM(ABS(A1:A3))`) has the same problem, and is not found: that needs per-function
 * knowledge. A defined name is not a range here, because its size is unknown. String literals are
 * skipped.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {boolean}
 */
export function appliesOperatorToRange(formula: string): boolean {
  const regex = new RegExp(REFERENCE_REGEX.source, REFERENCE_REGEX.flags);
  let previous: { end: number; cell: string } | null = null;
  let match = regex.exec(formula);

  while (match !== null) {
    const groups = match.groups ?? {};
    const end = match.index + match[0].length;
    let start = match.index;
    let reference: string | null = null;

    if (groups.qualified !== undefined) {
      reference = groups.qualified;
    } else if (groups.colLetters !== undefined) {
      // An unqualified `A1:A3` matches as two cells joined by `:`.
      if (previous !== null && previous.end + 1 === start && formula[previous.end] === ':') {
        reference = `${previous.cell}:${match[0]}`;
        start = previous.end - previous.cell.length;
      }
    } else if (groups.literal === undefined) {
      reference = match[0];
    }

    if (reference !== null && isMultiCellRange(reference)
      && (isOperatorNext(formula, start - 1, -1) || isOperatorNext(formula, end, 1))) {
      return true;
    }

    previous = groups.colLetters !== undefined && reference === null ? { end, cell: match[0] } : null;
    match = regex.exec(formula);
  }

  return false;
}

const ARRAYFORMULA_OPENING = 'ARRAYFORMULA(';

/**
 * Unwraps a formula that is one `ARRAYFORMULA(…)` call as a whole: `ARRAYFORMULA(x)` gives `x`.
 * Returns `null` when the formula is anything else, including `ARRAYFORMULA(a)+ARRAYFORMULA(b)`
 * and an empty `ARRAYFORMULA()`, which has no formula to write as an array.
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
          const inner = formula.slice(ARRAYFORMULA_OPENING.length, index);

          return index === formula.length - 1 && inner.trim() !== '' ? inner : null;
        }
      }

      index += 1;
    }
  }

  return null;
}
