/**
 * A sheet name a formula names in a cell or range reference (`Prices!A1`, `'Q1 Data'!A1:B2`).
 */
export interface SheetReference {
  /**
   * The sheet name, unquoted, with a doubled `'` read as one.
   */
  name: string;
  /**
   * Whether the formula writes the name in quotes.
   */
  quoted: boolean;
}

const NAME_CHARACTER = /[\p{L}\p{M}\p{N}_]/u;
const ERROR_LITERAL_CHARACTER = /[\p{L}\p{M}\p{N}_./]/u;

/**
 * Tells whether a character can be part of a sheet name written without quotes.
 */
function isNameCharacter(character: string | undefined): boolean {
  return character !== undefined && NAME_CHARACTER.test(character);
}

/**
 * Returns the index right after an error literal that starts at `start` (`#DIV/0!`, `#N/A`, `#NAME?`, or a
 * translated one): the `#`, the word, and its closing `!` or `?` when there is one. Read as a name, the word
 * in front of the `!` looked like a sheet reference, and quoting it turned `#DIV/0!` into `#DIV/'0'!`.
 */
function skipErrorLiteral(formula: string, start: number): number {
  let index = start + 1;

  while (index < formula.length && ERROR_LITERAL_CHARACTER.test(formula[index])) {
    index += 1;
  }

  return formula[index] === '!' || formula[index] === '?' ? index + 1 : index;
}

/**
 * Returns the index right after a string literal that starts at `start` (a `"` with `""` as an escaped
 * quote), or the formula's length when the literal is not closed.
 */
function skipStringLiteral(formula: string, start: number): number {
  let index = start + 1;

  while (index < formula.length) {
    if (formula[index] === '"') {
      if (formula[index + 1] === '"') {
        index += 2;
      } else {
        return index + 1;
      }
    } else {
      index += 1;
    }
  }

  return index;
}

/**
 * Reads a quoted name that starts at `start` (a `'` with `''` as an escaped quote). Returns the name and
 * the index right after the closing quote, or `null` when the quote is not closed.
 */
function readQuotedName(formula: string, start: number): { name: string, end: number } | null {
  let index = start + 1;
  let name = '';

  while (index < formula.length) {
    if (formula[index] === '\'') {
      if (formula[index + 1] === '\'') {
        name += '\'';
        index += 2;
      } else {
        return { name, end: index + 1 };
      }
    } else {
      name += formula[index];
      index += 1;
    }
  }

  return null;
}

/**
 * Rewrites the sheet names a formula references. `rewrite` gets each sheet name that stands in front of a
 * `!` outside a string literal and outside an error literal, and returns the text to put in its place (quotes included), or `null` to
 * keep it. Everything else is kept as written, so a formula with nothing to rewrite comes back as the same
 * string.
 *
 * @param {string} formula The formula text, starting with `=`.
 * @param {Function} rewrite Maps a sheet reference to its new text, or to `null`.
 * @returns {string}
 */
export function rewriteSheetReferences(formula: string, rewrite: (reference: SheetReference) => string | null): string {
  let result = '';
  let changed = false;
  let index = 0;

  while (index < formula.length) {
    const character = formula[index];
    let end = index + 1;
    let reference: SheetReference | null = null;

    if (character === '"') {
      end = skipStringLiteral(formula, index);

    } else if (character === '#') {
      end = skipErrorLiteral(formula, index);

    } else if (character === '\'') {
      const quoted = readQuotedName(formula, index);

      end = quoted?.end ?? formula.length;
      reference = quoted !== null && formula[end] === '!' ? { name: quoted.name, quoted: true } : null;

    } else if (isNameCharacter(character) && !isNameCharacter(formula[index - 1])) {
      while (isNameCharacter(formula[end])) {
        end += 1;
      }

      reference = formula[end] === '!' ? { name: formula.slice(index, end), quoted: false } : null;
    }

    const replacement = reference === null ? null : rewrite(reference);

    if (replacement === null) {
      result += formula.slice(index, end);
    } else {
      result += replacement;
      changed = true;
    }

    index = end;
  }

  return changed ? result : formula;
}

/**
 * Tells whether a sheet name is made only of the characters a name written without quotes can hold, so a
 * formula reads it as one name. A name such as `Sales-EU` is not: `=Sales-EU!A1` is the subtraction of
 * `Sales` and `EU!A1`, which an engine parses without complaint, so asking the engine alone whether it reads
 * the name unquoted answers yes for the wrong reason.
 *
 * @param {string} name The sheet name.
 * @returns {boolean}
 */
export function isUnquotedSheetName(name: string): boolean {
  return name.length > 0 && Array.from(name).every(character => isNameCharacter(character));
}

/**
 * Writes a sheet name as a formula references it: as it is, or in quotes with every `'` doubled.
 *
 * @param {string} name The sheet name.
 * @param {boolean} quoted Whether to quote it.
 * @returns {string}
 */
export function formatSheetName(name: string, quoted: boolean): string {
  return quoted ? `'${name.replace(/'/g, '\'\'')}'` : name;
}

/**
 * Quotes every sheet name a formula references without quotes that the formula engine cannot read
 * without them. HyperFormula writes such a name (one that starts with a digit, as `2026` or `1Q`) without
 * quotes when it hands out formula text, and then fails to parse that text, so the text is checked before
 * it reaches a cell, an editor, the host's data, or the engine again. A formula with no sheet reference
 * comes back as the same string without being scanned.
 *
 * @param {string} formula The formula text, starting with `=`.
 * @param {Function} canReadUnquoted Tells whether the engine reads a sheet name without quotes.
 * @returns {string}
 */
export function quoteUnreadableSheetNames(formula: string, canReadUnquoted: (name: string) => boolean): string {
  if (!formula.includes('!')) {
    return formula;
  }

  return rewriteSheetReferences(formula, reference => (
    !reference.quoted && !canReadUnquoted(reference.name) ? formatSheetName(reference.name, true) : null
  ));
}
