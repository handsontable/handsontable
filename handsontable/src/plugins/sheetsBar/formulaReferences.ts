/**
 * Maps an index of one axis of a sheet to another index of the same axis.
 */
export type IndexMap = (index: number) => number;

/**
 * The error literals a formula can hold. Their text is skipped, so `#REF!` is not read as a sheet name.
 */
const ERROR_LITERAL = /^#(?:NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|ERROR!|CYCLE!|LIC!|SPILL!|CALC!)/i;

/**
 * A string literal, with each `""` inside it read as an escaped quote. An unclosed string runs to the end of the
 * formula.
 */
const STRING_LITERAL = /^"(?:[^"]|"")*"?/;

/**
 * A run of characters that can make up an unquoted sheet name, a function or a named expression, a cell, a
 * column or a row reference, or a number.
 */
const WORD = /^[\p{L}\p{N}_.$]+/u;

const CELL = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/;
const COLUMN = /^(\$?)([A-Za-z]{1,3})$/;
const ROW = /^(\$?)(\d+)$/;

/**
 * Converts column letters (`A`, `AB`) to a zero-based index.
 *
 * @param {string} letters The letters.
 * @returns {number}
 */
function columnIndexOf(letters: string): number {
  return letters.toUpperCase().split('').reduce((index, letter) => (index * 26) + letter.charCodeAt(0) - 64, 0) - 1;
}

/**
 * Converts a zero-based column index to its letters.
 *
 * @param {number} index The index.
 * @returns {string}
 */
function columnLettersOf(index: number): string {
  let letters = '';

  for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters;
  }

  return letters;
}

/**
 * Rewrites one reference word (`A1`, `$B$2`, `C`, `3`), or returns `null` when the word is no reference of the
 * kind the context allows.
 *
 * @param {string} word The word.
 * @param {'cell'|'column'|'row'} kind The kind of reference the word is read as.
 * @param {Function} mapRow Maps a row index.
 * @param {Function} mapColumn Maps a column index.
 * @returns {string|null}
 */
function rewriteWord(word: string, kind: 'cell' | 'column' | 'row', mapRow: IndexMap, mapColumn: IndexMap) {
  if (kind === 'cell') {
    const match = CELL.exec(word);

    if (!match) {
      return null;
    }

    const column = columnLettersOf(mapColumn(columnIndexOf(match[2])));

    return `${match[1]}${column}${match[3]}${mapRow(Number(match[4]) - 1) + 1}`;
  }

  if (kind === 'column') {
    const match = COLUMN.exec(word);

    return match ? `${match[1]}${columnLettersOf(mapColumn(columnIndexOf(match[2])))}` : null;
  }

  const match = ROW.exec(word);

  return match ? `${match[1]}${mapRow(Number(match[2]) - 1) + 1}` : null;
}

/**
 * Rewrites the references a formula makes to cells of one sheet, the cells of its own sheet when they name no
 * sheet: each row and column index goes through the maps, absolute or relative alike, as a row or column move
 * moves every reference to the cells it moves. References to other sheets, strings, error literals, and
 * function names are left as they are. A range has both ends rewritten; a column range (`A:C`) and a row range
 * (`1:3`) have their columns or rows rewritten.
 *
 * @param {string} formula The formula text, starting with `=`.
 * @param {Function} isOwnSheet Tells whether a sheet name a reference carries is the formula's own sheet.
 * @param {Function} mapRow Maps a row index of the formula's sheet.
 * @param {Function} mapColumn Maps a column index of the formula's sheet.
 * @returns {string}
 */
export function remapOwnSheetReferences(
  formula: string,
  isOwnSheet: (name: string) => boolean,
  mapRow: IndexMap,
  mapColumn: IndexMap,
): string {
  let result = '';
  let position = 0;
  let ownSheet = true;

  const copy = (length: number) => {
    result += formula.slice(position, position + length);
    position += length;
  };

  while (position < formula.length) {
    const rest = formula.slice(position);
    const char = rest[0];

    if (char === '"') {
      const string = STRING_LITERAL.exec(rest);

      copy(string ? string[0].length : 1);
      ownSheet = true;

      continue;
    }

    if (char === '#') {
      const error = ERROR_LITERAL.exec(rest);

      copy(error ? error[0].length : 1);
      ownSheet = true;

      continue;
    }

    if (char === '\'') {
      const quoted = /^'((?:[^']|'')*)'!/.exec(rest);

      if (quoted) {
        ownSheet = isOwnSheet(quoted[1].replace(/''/g, '\''));
        copy(quoted[0].length);

        continue;
      }
    }

    const word = WORD.exec(rest);

    if (!word) {
      copy(1);
      ownSheet = ownSheet || char !== ':';

      continue;
    }

    const text = word[0];
    const after = rest[text.length];

    if (after === '!') {
      ownSheet = isOwnSheet(text);
      copy(text.length + 1);

      continue;
    }

    if (after === '(' || !ownSheet) {
      copy(text.length);

      if (after !== ':') {
        ownSheet = true;
      }

      continue;
    }

    const rangeEnd = after === ':' ? WORD.exec(rest.slice(text.length + 1)) : null;

    if (rangeEnd) {
      const ends = (['cell', 'column', 'row'] as const)
        .map(kind => [rewriteWord(text, kind, mapRow, mapColumn), rewriteWord(rangeEnd[0], kind, mapRow, mapColumn)])
        .find(([start, end]) => start !== null && end !== null);

      if (ends) {
        result += `${ends[0]}:${ends[1]}`;
        position += text.length + 1 + rangeEnd[0].length;
        ownSheet = true;

        continue;
      }
    }

    result += rewriteWord(text, 'cell', mapRow, mapColumn) ?? text;
    position += text.length;
    ownSheet = true;
  }

  return result;
}
