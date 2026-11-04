import { localeLowerCase } from '../../helpers/string';
import { parseCellRef } from './cellRef';
import { isNameChar, skipQuoted } from './functionPrefixes';
import type { DefinedNameSnapshot } from './model';

/**
 * A name Excel accepts: a letter, underscore or backslash first, then letters, digits, dots,
 * underscores or backslashes. A letter is any Unicode letter (a German umlaut, a CJK character), as
 * in Excel; an ASCII-only class refused those names and left the cells over them as `#NAME?` in
 * Excel. HyperFormula accepts a narrower, Latin-only range of letters, a subset of this class. This
 * file stays 7-bit ASCII, so the class is written with `\p{L}`.
 */
const DEFINED_NAME_PATTERN = /^[\p{L}_\\][\p{L}\p{N}_.\\]{0,254}$/u;

/**
 * The R1C1 spellings Excel reads as references (`R`, `C`, `RC`, `R2C`, `RC3`, `R1C1`), which it
 * refuses as names.
 */
const R1C1_NAME_PATTERN = /^(?:[RC]|R\d*C\d*)$/i;

/**
 * Names a reader does not keep as written: `TRUE` and `FALSE` (LibreOffice renames them to `_TRUE`
 * and `_FALSE` on load) and the `_xlnm.` built-ins (`_xlnm.Print_Area`), which LibreOffice renames
 * when they are workbook-scoped and both readers of this layer skip on import.
 */
const RESERVED_NAME_PATTERN = /^(?:TRUE|FALSE|_xlnm\..*)$/i;

/**
 * A defined name a writer will write, with the 0-based index of the sheet it is scoped to
 * (`undefined` for a workbook-scoped name).
 */
export interface WritableDefinedName {
  name: string;
  formula: string;
  sheetName: string | null;
  localSheetId: number | undefined;
}

/**
 * Picks the defined names both writers can write, so the two engines accept the same set. A name is
 * left out when a reader flagged it `unsupported`, is not a valid name, spells a cell reference or an R1C1 reference,
 * is `TRUE`, `FALSE` or an `_xlnm.` built-in, is scoped to a
 * sheet `sheetNames` does not hold, has an empty definition, or repeats an earlier name of the same
 * scope (names compare case-insensitively).
 *
 * @param {DefinedNameSnapshot[]} definedNames The names the snapshot holds.
 * @param {string[]} sheetNames The sheet names of the workbook being written.
 * @returns {{ entries: WritableDefinedName[], skipped: boolean }} The names to write, and whether any was left out.
 */
export function selectWritableDefinedNames(
  definedNames: DefinedNameSnapshot[],
  sheetNames: string[],
): { entries: WritableDefinedName[]; skipped: boolean } {
  const lowerSheetNames = sheetNames.map(sheetName => localeLowerCase(sheetName));
  const entries: WritableDefinedName[] = [];
  const seen = new Set<string>();
  let skipped = false;

  definedNames.forEach(({ name, formula, sheetName, unsupported }) => {
    if (unsupported) {
      skipped = true;

      return;
    }

    const localSheetId = sheetName === null ? undefined : lowerSheetNames.indexOf(localeLowerCase(sheetName));
    const key = `${localSheetId ?? ''}\u0000${localeLowerCase(name)}`;

    if (!DEFINED_NAME_PATTERN.test(name) || parseCellRef(name) !== null || R1C1_NAME_PATTERN.test(name)
      || RESERVED_NAME_PATTERN.test(name) || localSheetId === -1 || formula.trim() === '' || seen.has(key)) {
      skipped = true;
    } else {
      seen.add(key);
      entries.push({ name, formula, sheetName, localSheetId });
    }
  });

  return { entries, skipped };
}

/**
 * One to three column letters, the column part of a reference.
 */
const COLUMN_LETTERS_PATTERN = /^[A-Za-z]{1,3}$/;

/**
 * Whether the column letters read from `start`, one character at a time in `step` direction, form a
 * whole word: one to three letters with no name character past them. A `$` marking the column
 * absolute is skipped in both directions: the one at `start` reading forward (`A:$B`), and the one past
 * the letters reading backward (`$A:B`).
 *
 * @param {string} formula The formula.
 * @param {number} start The first character to read.
 * @param {number} step `1` to read forward, `-1` to read backward.
 * @returns {boolean}
 */
function isColumnLettersAt(formula: string, start: number, step: 1 | -1): boolean {
  let index = formula[start] === '$' ? start + step : start;
  let count = 0;

  while (count < 4 && index >= 0 && index < formula.length && /[A-Za-z]/.test(formula[index])) {
    index += step;
    count += 1;
  }

  if (count === 0 || count > 3) {
    return false;
  }

  if (step === -1) {
    // Read backward, a `$` before the letters makes the column absolute (`$A:B`); the word ends past it.
    const past = formula[index] === '$' ? formula[index - 1] : formula[index];

    return past === undefined || !isNameChar(past);
  }

  const past = formula[index];

  return past === undefined || (!isNameChar(past) && past !== '(');
}

/**
 * Whether the word `formula.slice(start, end)` is part of a cell reference rather than a name: it
 * touches a `$` (`$A$1`, `A$1`, `$A1`; a name never does), or it is column letters on one side of a `:`
 * whose other side is column letters too (`A:A`, `$B:$C`), a whole-column span. A word scan that misses
 * this reads the `A` of `$A$1` as a name, so a one-letter name claims every formula with such a
 * reference.
 *
 * @param {string} formula The formula.
 * @param {number} start The index of the word's first character.
 * @param {number} end The index right past the word.
 * @returns {boolean}
 */
export function isReferenceWord(formula: string, start: number, end: number): boolean {
  if (formula[start - 1] === '$' || formula[end] === '$') {
    return true;
  }

  if (!COLUMN_LETTERS_PATTERN.test(formula.slice(start, end))) {
    return false;
  }

  return (formula[end] === ':' && isColumnLettersAt(formula, end + 1, 1))
    || (formula[start - 1] === ':' && isColumnLettersAt(formula, start - 2, -1));
}

/**
 * The words of a formula that can only be defined names, lower-cased: every run of name characters
 * outside quotes (string literals and quoted sheet names) and brackets (a structured reference's
 * column, an external workbook index) that is not followed by `(` (a function call) or `!` (a sheet
 * qualifier), nor part of a reference (`isReferenceWord`: the `A` of `$A$1` or of `A:A`). Relative cell
 * references and numbers come back too; the caller compares the words with the names it knows.
 *
 * The scan is lexical, so it errs one way only: a `LET` or `LAMBDA` parameter spelled like a defined
 * name is listed as that name. The cost is a formula exported as its value when the name does not
 * reach the file, never a formula left live over a missing name.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @returns {Set<string>}
 */
export function namesUsedIn(formula: string): Set<string> {
  const names = new Set<string>();

  forEachNameUse(formula, (word) => {
    names.add(localeLowerCase(word));
  });

  return names;
}

/**
 * Walks the words {@link namesUsedIn} lists, as they are spelled, with where each starts and ends
 * (exclusive). The walk stops at the first word `visit` answers `true` for.
 *
 * @param {string} formula The formula, without the leading `=`.
 * @param {Function} visit Called with the word, its start and its end; `true` stops the walk.
 * @returns {boolean} Whether `visit` stopped the walk.
 */
export function forEachNameUse(
  formula: string, visit: (word: string, start: number, end: number) => boolean | void
): boolean {
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (char === '"' || char === '\'') {
      index = skipQuoted(formula, index);

    } else if (char === '[') {
      let depth = 0;

      do {
        if (formula[index] === '[') {
          depth += 1;
        } else if (formula[index] === ']') {
          depth -= 1;
        }

        index += 1;
      } while (depth > 0 && index < formula.length);

    } else if (isNameChar(char)) {
      let end = index + 1;

      while (end < formula.length && isNameChar(formula[end])) {
        end += 1;
      }

      if (formula[end] !== '(' && formula[end] !== '!' && !isReferenceWord(formula, index, end)
          && visit(formula.slice(index, end), index, end) === true) {
        return true;
      }

      index = end;

    } else {
      index += 1;
    }
  }

  return false;
}
