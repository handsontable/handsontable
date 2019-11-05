/**
 * SheetClip - Spreadsheet Clipboard Parser
 * version 0.2
 *
 * This tiny library transforms JavaScript arrays to strings that are pasteable by LibreOffice, OpenOffice,
 * Google Docs and Microsoft Excel.
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://github.com/warpech/sheetclip/
 */
/*jslint white: true*/
(function (global) {
  "use strict";

  function countQuotes(str) {
    return str.split('"').length - 1;
  }

  const regNextCell = /^[^\t\r\n]+(\t)?/;
  const regNextMultilineCell = /^\"+[\r\n\W\D\d]+\"+(\t)?/
  // https://regexr.com/4o4v2
  // while (str.length > 0) { ... }
  // /^\"+[\r\n\W\D\d]+\"+(\t|\r\n)/ next multiline cell
  // /^[^\t]+(\t|\r\n)/ next cell if `first character !== "`

  var SheetClip = {
    /**
     * Decode spreadsheet string into array
     *
     * @param {String} str
     * @returns {Array}
     */
    parse: function (str) {
      const arr = [['']];

      if (str.length === 0) {
        return arr;
      }

      const regUniversalNewLine = /^(\r\n|\n\r|\r|\n)/;

      const regNextCell = /^[^\t\r\n]+(?:\t)?/;
      const regNextMultilineCell = /^\"+[\r\n\W\D\d]+\"+(?:\t|[\r\n])/;
      const regNextEmptyCell = /^\t/;

      let column = 0;
      let row = 0;
      let lastLength;

      while (str.length > 0) {
        if (lastLength === str.length) {
          break;
        }

        lastLength = str.length;

        if (str.startsWith('\t')) {
          str = str.replace(regNextEmptyCell, '');

          if (!arr[row]) {
            arr[row] = [];
            arr[row][0] = '';
          }

          column += 1;
          arr[row][column] = '';

          continue;
        
        } else if (str.match(regUniversalNewLine)) {
          str = str.replace(regUniversalNewLine, '');
          column = 0;
          row += 1;

          arr[row] = [''];

          continue;
        }

        let fragment = str.startsWith('"') ? str.match(regNextMultilineCell) : str.match(regNextCell);

        if (!fragment) {
          if (lastLength) {
            fragment = [str];
          } else {
            break;
          }
        }

        if (!arr[row]) {
          arr[row] = [];
        }

        let nextCell = fragment[0];

        str = nextCell.match(/[\r\n\t]$/) ? str.slice(nextCell.length - 1) : str.slice(nextCell.length);

        nextCell = nextCell.replace(/\t$/, '').replace(/[\r\n]$/, '');

        if (nextCell.match(/^\"+[\r\n\W\D\d]+\"$/)) {
          nextCell = nextCell.replace(/^\"/, '').replace(/\"$/, '');
        }

        arr[row][column] = nextCell;
      }

      return arr;
    },

    /**
     * Encode array into valid spreadsheet string
     *
     * @param arr
     * @returns {String}
     */
    stringify: function (arr) {
      var r, rLen, c, cLen, str = '', val;

      for (r = 0, rLen = arr.length; r < rLen; r += 1) {
        cLen = arr[r].length;

        for (c = 0; c < cLen; c += 1) {
          if (c > 0) {
            str += '\t';
          }
          val = arr[r][c];

          if (typeof val === 'string') {
            if (val.indexOf('\n') > -1) {
              str += '"' + val.replace(/"/g, '""') + '"';
            }
            else {
              str += val;
            }
          }
          else if (val === null || val === void 0) { // void 0 resolves to undefined
            str += '';
          }
          else {
            str += val;
          }
        }

        if (r !== rLen - 1) {
          str += '\n';
        }
      }

      return str;
    }
  };

  if (typeof exports !== 'undefined') {
    exports.parse = SheetClip.parse;
    exports.stringify = SheetClip.stringify;
  } else {
    global.SheetClip = SheetClip;
  }
}(window));
