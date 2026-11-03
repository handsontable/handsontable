import { parseRangeRef } from './cellRef';
import { forEachNameUse } from './definedNames';
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
 * The functions that can return an array, so Excel 365 saves a formula that is one whole call to
 * one of them as a one-cell dynamic array (`cm="1"`), whatever size the result has. Upper case,
 * without the `_xlfn.` and `_xlws.` prefixes. Taken from files Excel Online saved: `SEQUENCE(1)`,
 * `INDIRECT("A1")` and `LET(x,1,x)` are flagged, `INDEX(A1:A3,2)`, `OFFSET(A1,1,0)` and
 * `SUM(SEQUENCE(3))` are not.
 */
export const ARRAY_RETURNING_FUNCTIONS: ReadonlySet<string> = new Set([
  'SEQUENCE', 'FILTER', 'TRANSPOSE', 'MMULT', 'ARRAY_CONSTRAIN', 'SORT', 'SORTBY', 'UNIQUE', 'RANDARRAY',
  'INDIRECT', 'LET', 'LAMBDA',
]);

/**
 * The `_xlfn.` and `_xlws.` prefixes in front of a function name, any number of them.
 */
const FUNCTION_PREFIXES = /^(?:_xl(?:fn|ws)\.)+/i;

/**
 * Whether a formula is, apart from surrounding whitespace and grouping parentheses, one whole call
 * to a function of {@link ARRAY_RETURNING_FUNCTIONS}, with or without the `_xlfn.` and `_xlws.`
 * prefixes (`SEQUENCE(1)`, `((_xlfn.SEQUENCE(1)))`). A call nested in another function
 * (`SUM(SEQUENCE(3))`) or used as an operand (`SEQUENCE(1)+1`) does not count. Excel 365 saves a
 * formula this finds as a one-cell dynamic array; written plain, Excel opens it with the
 * implicit-intersection `@` (`=@SEQUENCE(1)`). Quoted runs are skipped.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {boolean}
 */
export function isWholeArrayFunctionCall(formula: string): boolean {
  // Every `(` is matched in one pass, and the grouping layers are peeled by index: rescanning and
  // slicing the text once per layer made `=((((…SEQUENCE(1)…))))` quadratic in its depth.
  const closing = matchParentheses(formula);
  let first = skipWhitespace(formula, 0, 1);
  let last = skipWhitespace(formula, formula.length - 1, -1);

  while (first < last && formula[first] === '(' && closing[first] === last) {
    first = skipWhitespace(formula, first + 1, 1);
    last = skipWhitespace(formula, last - 1, -1);
  }

  let end = first;

  while (end <= last && isNameChar(formula[end])) {
    end += 1;
  }

  if (end === first || formula[end] !== '(') {
    return false;
  }

  const name = formula.slice(first, end).replace(FUNCTION_PREFIXES, '').toUpperCase();

  return ARRAY_RETURNING_FUNCTIONS.has(name) && closing[end] === last;
}

/**
 * The position of the `)` that closes each `(` of a formula, by the position of the `(` (`-1` for
 * one the formula never closes, and for every other character), in one pass that skips quoted runs.
 *
 * @param {string} formula The formula.
 * @returns {Int32Array}
 */
function matchParentheses(formula: string): Int32Array {
  const closing = new Int32Array(formula.length).fill(-1);
  const open: number[] = [];
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === '"' || char === '\'') {
      index = skipQuoted(formula, index);

    } else {
      if (char === '(') {
        open.push(index);
      } else if (char === ')') {
        const opening = open.pop();

        if (opening !== undefined) {
          closing[opening] = index;
        }
      }

      index += 1;
    }
  }

  return closing;
}

/**
 * The characters an operator Excel applies element by element is made of: `+ - * / ^ & = < >`
 * (`<>`, `<=` and `>=` included, and a unary `-`).
 */
const OPERATOR_CHARS = '+-*/^&=<>';

/**
 * Whether a character is whitespace the engine's lexer skips between tokens. HyperFormula reads
 * space, tab, line feed and carriage return by default, and any `\s` character under
 * `ignoreWhiteSpace: 'any'`, so every `\s` character is skipped.
 *
 * @param {string|undefined} char The character.
 * @returns {boolean}
 */
function isWhitespace(char: string | undefined): boolean {
  return char !== undefined && /\s/.test(char);
}

/**
 * The position of the first non-whitespace character from a position, in the given direction.
 *
 * @param {string} formula The formula.
 * @param {number} index The position to start from.
 * @param {number} step `-1` to look left, `1` to look right.
 * @returns {number}
 */
function skipWhitespace(formula: string, index: number, step: number): number {
  let position = index;

  while (isWhitespace(formula[position])) {
    position += step;
  }

  return position;
}

/**
 * Whether an operator applies to the operand that spans `start` to `end` (exclusive). The next
 * non-whitespace character on the left must be one of {@link OPERATOR_CHARS}, or the one on the
 * right must be one of them or a postfix `%`. While the operand is wrapped in grouping
 * parentheses, `(A1:A3)`, the test steps out over each pair: a `(` counts as grouping when no name
 * character comes before it, as a `(` after a name opens a function call (`SUM(A1:A3)`), and a `)`
 * is skipped only together with a grouping `(` on the left.
 *
 * @param {string} formula The formula.
 * @param {number} start The position of the operand's first character.
 * @param {number} end The position after the operand's last character.
 * @returns {boolean}
 */
function isOperandOfOperator(formula: string, start: number, end: number): boolean {
  let left = skipWhitespace(formula, start - 1, -1);
  let right = skipWhitespace(formula, end, 1);

  while (left >= -1) {
    const leftChar = formula[left];
    const rightChar = formula[right];

    if ((leftChar !== undefined && OPERATOR_CHARS.includes(leftChar))
      || (rightChar !== undefined && (OPERATOR_CHARS.includes(rightChar) || rightChar === '%'))) {
      return true;
    }

    const beforeLeft = formula[skipWhitespace(formula, left - 1, -1)];

    if (leftChar !== '(' || rightChar !== ')' || (beforeLeft !== undefined && isNameChar(beforeLeft))) {
      return false;
    }

    left = skipWhitespace(formula, left - 1, -1);
    right = skipWhitespace(formula, right + 1, 1);
  }

  return false;
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
 * {@link REFERENCE_REGEX}'s own copy for `appliesOperatorToRange`, which resets its `lastIndex`
 * before each walk: the export calls it once per formula cell, and compiling a new copy each time
 * cost more than the walk itself.
 */
const OPERAND_REFERENCE_REGEX = new RegExp(REFERENCE_REGEX.source, REFERENCE_REGEX.flags);

/**
 * Whether a formula applies an operator to a multi-cell range: a range (`A1:A3`, `A:A`, `1:1`,
 * sheet-qualified or not, with two different corners) with an operator of {@link OPERATOR_CHARS}
 * right before or right after it, or a postfix `%` after it, at any parenthesis depth
 * (`SUM(A1:A3*B1:B3)`, `-A1:A3`, `SUM(A1:A3%)`). Grouping parentheses around the range are
 * stepped over (`SUM((A1:A3)*2)`); the parentheses of a function call are not. Under
 * HyperFormula's `useArrayArithmetic` such a formula computes over every cell of the range, while
 * Excel 365 opens a plain formula with an implicit-intersection `@` in front of the range, so the
 * cell is written as a one-cell dynamic array, as Excel saves it.
 *
 * Only the operator next to a range counts. A function that takes a range where it expects one
 * value (`SUM(ABS(A1:A3))`) has the same problem, and is not found: that needs per-function
 * knowledge. A defined name counts as a range only when `isRangeName` says it is one
 * (`SUM(Sales*2)` with `Sales` over `Data!$A$1:$A$6`): the formula alone does not tell its size.
 * String literals are skipped.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @param {Function} [isRangeName] Whether a word of the formula is a defined name over a multi-cell
 *   range.
 * @returns {boolean}
 */
export function appliesOperatorToRange(formula: string, isRangeName?: (word: string) => boolean): boolean {
  const regex = OPERAND_REFERENCE_REGEX;

  regex.lastIndex = 0;

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

    if (reference !== null && isMultiCellRange(reference) && isOperandOfOperator(formula, start, end)) {
      return true;
    }

    previous = groups.colLetters !== undefined && reference === null ? { end, cell: match[0] } : null;
    match = regex.exec(formula);
  }

  return isRangeName !== undefined
    && forEachNameUse(formula, (word, start, end) => isRangeName(word) && isOperandOfOperator(formula, start, end));
}

/**
 * Whether a defined name's definition is one multi-cell range (`=Data!$A$1:$A$6`, `=Data!$B:$B`,
 * sheet-qualified or not): the shape {@link appliesOperatorToRange} counts as a range when the name is
 * an operand. Anything else (a constant, a single cell, a union, a formula) is not.
 *
 * @param {string} definition The definition, with or without the leading `=`.
 * @returns {boolean}
 */
export function isMultiCellRangeDefinition(definition: string): boolean {
  const text = definition.trim().replace(/^=/, '').trim();
  let reference = text;

  if (text[0] === '\'') {
    // A quoted sheet name may hold a comma or a `!` of its own (`'Q1, 2024'!$A$1:$A$6`).
    const end = skipQuoted(text, 0);

    if (text[end] !== '!') {
      return false;
    }

    reference = text.slice(end + 1);
  } else if (text.includes('!')) {
    reference = text.slice(text.indexOf('!') + 1);
  }

  // A comma after the qualifier joins the areas of a union, whose size the last area alone does not
  // tell.
  return !reference.includes(',') && isMultiCellRange(reference);
}

const ARRAYFORMULA_NAME = 'ARRAYFORMULA';

/**
 * The position of the `)` that closes the `(` at `open`, skipping quoted runs, or `-1` when the
 * formula ends first.
 *
 * @param {string} formula The formula.
 * @param {number} open The position of the `(`.
 * @returns {number}
 */
function findClosingParenthesis(formula: string, open: number): number {
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
 * Strips every `ARRAYFORMULA(…)` call from a formula, nested ones and ones inside other calls
 * included, since Excel has no such function and opens a call left in the text as `#NAME?`. The
 * call's parentheses go too where the call is a whole expression (the whole formula or a whole
 * function argument, `SUM(ARRAYFORMULA(x))` gives `SUM(x)`), and stay where it is an operand
 * (`ARRAYFORMULA(x)*2` gives `(x)*2`), so the precedence holds. Quoted runs (string literals and
 * sheet names) are skipped. An empty or unclosed call is left as it is. A formula with no call is
 * returned unchanged, so a changed result means the formula held one.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {string}
 */
export function stripArrayFormulaCalls(formula: string): string {
  return stripCalls(formula).text;
}

/**
 * Whether a formula holds an `ARRAYFORMULA(…)` call that is an operand (`ARRAYFORMULA(x)*2`,
 * `-ARRAYFORMULA(x)`), not a whole expression: the whole formula or a whole function argument, as
 * `stripArrayFormulaCalls` tells them apart. A call inside another `ARRAYFORMULA` call does not
 * count: the outer call evaluates it as an array.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {boolean}
 */
export function callsArrayFormulaAsOperand(formula: string): boolean {
  return stripCalls(formula).operand;
}

/**
 * The walk behind `stripArrayFormulaCalls` and `callsArrayFormulaAsOperand`.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {{ text: string, operand: boolean }}
 */
function stripCalls(formula: string): { text: string; operand: boolean } {
  let output = '';
  let operand = false;
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === '"' || char === '\'') {
      const end = skipQuoted(formula, index);

      output += formula.slice(index, end);
      index = end;

    } else if (isNameChar(char)) {
      let end = index + 1;

      while (end < formula.length && isNameChar(formula[end])) {
        end += 1;
      }

      const isCall = formula[end] === '(' && formula.slice(index, end).toUpperCase() === ARRAYFORMULA_NAME;
      const close = isCall ? findClosingParenthesis(formula, end) : -1;
      const inner = close === -1 ? '' : formula.slice(end + 1, close);

      if (inner.trim() === '') {
        output += formula.slice(index, end);
        index = end;

      } else {
        const trimmedOutput = output.trimEnd();
        const before = trimmedOutput[trimmedOutput.length - 1];
        const after = formula.slice(close + 1).trimStart()[0];
        const isWholeExpression = (before === undefined || before === '(' || before === ',')
          && (after === undefined || after === ')' || after === ',');
        const stripped = stripCalls(inner);

        // A call inside another call is evaluated as an array anyway, operand or not.
        operand = operand || !isWholeExpression;
        output += isWholeExpression ? stripped.text : `(${stripped.text})`;
        index = close + 1;
      }

    } else {
      output += char;
      index += 1;
    }
  }

  return { text: output, operand };
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
