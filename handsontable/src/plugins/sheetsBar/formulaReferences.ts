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

const NAME_CHARACTER = /[\p{L}\p{N}_]/u;

/**
 * Tells whether a character can be part of a sheet name written without quotes.
 */
function isNameCharacter(character: string | undefined): boolean {
  return character !== undefined && NAME_CHARACTER.test(character);
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
 * `!` outside a string literal, and returns the text to put in its place (quotes included), or `null` to
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
 * Writes a sheet name as a formula references it: as it is, or in quotes with every `'` doubled.
 *
 * @param {string} name The sheet name.
 * @param {boolean} quoted Whether to quote it.
 * @returns {string}
 */
export function formatSheetName(name: string, quoted: boolean): string {
  return quoted ? `'${name.replace(/'/g, '\'\'')}'` : name;
}
