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
 * Decode spreadsheet string into array.
 *
 * @param {string} str The string to parse.
 * @returns {Array}
 */
export function parse(str) {
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
export function stringify(arr) {
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
          str += `"${val.replace(/"/g, '""')}"`;
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
