/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * SheetClip - Spreadsheet Clipboard Parser.
 * version 0.2
 *
 * This tiny library transforms JavaScript arrays to strings that are pasteable by LibreOffice, OpenOffice,
 * Google Docs and Microsoft Excel.
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://github.com/warpech/sheetclip/
 */

const regUniversalNewLine = /^(\r\n|\n\r|\r|\n)/;
const regNextCellNoQuotes = /^[^\t\r\n]+/;
const regNextEmptyCell = /^\t/;

/**
 * Locate the structural closing `"` for a quoted cell starting at `str[0]`. A structural close is a
 * `"` that is followed by a separator (`\t`, `\r`, `\n`) or end-of-string and is not part of an
 * escaped pair `""`.
 *
 * @param {string} str Remaining input where `str[0]` is the first char after the opening `"`.
 * @returns {number} Index of the structural closing `"` within `str`, or -1 when not found.
 */
function findQuoteCloseIndex(str: string) {
  let i = 0;

  while (i < str.length) {
    if (str[i] === '"') {
      if (str[i + 1] === '"') {
        i += 2;
        continue;
      }

      const next = str[i + 1];

      if (next === undefined || next === '\t' || next === '\r' || next === '\n') {
        return i;
      }
    }

    i += 1;
  }

  return -1;
}

/**
 * Decode spreadsheet string into array.
 *
 * @param {string} str The string to parse.
 * @returns {Array}
 */
export function parse(str: string) {
  const arr = [['']];

  if (str.length === 0) {
    return arr;
  }

  let column = 0;
  let row = 0;
  let lastLength;

  while (str.length > 0) {
    if (lastLength === str.length) {
      // In the case If in last cycle we didn't match anything, we have to leave the infinite loop
      break;
    }

    lastLength = str.length;

    if (str.match(regNextEmptyCell)) {
      str = str.replace(regNextEmptyCell, '');

      column += 1;
      arr[row][column] = '';

    } else if (str.match(regUniversalNewLine)) {
      str = str.replace(regUniversalNewLine, '');
      column = 0;
      row += 1;

      arr[row] = [''];

    } else {
      let nextCell = '';

      if (str.startsWith('"')) {
        const closeIndex = findQuoteCloseIndex(str.slice(1));

        if (closeIndex !== -1) {
          // Properly terminated quoted cell: read content up to the structural close, decoding
          // escaped `""` to literal `"` and preserving any bare `"` chars that appear mid-cell.
          let i = 0;
          const content = str.slice(1);

          while (i < closeIndex) {
            if (content[i] === '"' && content[i + 1] === '"') {
              nextCell += '"';
              i += 2;
            } else {
              nextCell += content[i];
              i += 1;
            }
          }

          str = str.slice(closeIndex + 2);

        } else {
          // Fallback for malformed input without a structural closing quote: keep the legacy
          // behavior of consuming quotes by parity and halving runs of `"` chars.
          let quoteNo = 0;
          let isStillCell = true;

          while (isStillCell) {
            const nextChar = str.slice(0, 1);

            if (nextChar === '"') {
              quoteNo += 1;
            }

            nextCell += nextChar;

            str = str.slice(1);

            if (str.length === 0 || (str.match(/^[\t\r\n]/) && quoteNo % 2 === 0)) {
              isStillCell = false;
            }
          }

          nextCell = nextCell.replace(/^"/, '').replace(/"$/, '')
            .replace(/["]*/g, match => (new Array(Math.floor(match.length / 2))).fill('"').join(''));
        }

      } else {
        const matchedText = str.match(regNextCellNoQuotes);

        nextCell = matchedText ? matchedText[0] : '';
        str = str.slice(nextCell.length);
      }

      arr[row][column] = nextCell;
    }

  }

  return arr;
}

/**
 * Encode array into valid spreadsheet string.
 *
 * @param {Array} arr An array of arrays to stringify.
 * @returns {string}
 */
export function stringify(arr: unknown[][]) {
  let r;
  let rLen;
  let c;
  let cLen;
  let str = '';
  let val;

  for (r = 0, rLen = arr.length; r < rLen; r += 1) {
    cLen = arr[r].length;

    for (c = 0; c < cLen; c += 1) {
      if (c > 0) {
        str += '\t';
      }
      val = arr[r][c];

      if (typeof val === 'string') {
        if (val.indexOf('\n') > -1) {
          str += `"${val.replaceAll('"', '""')}"`;
        } else {
          str += val;
        }

      } else if (val === null || val === undefined) { // undefined resolves to undefined
        str += '';

      } else {
        str += val;
      }
    }

    if (r !== rLen - 1) {
      str += '\n';
    }
  }

  return str;
}
