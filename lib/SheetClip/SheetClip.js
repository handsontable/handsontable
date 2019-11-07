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
(function (global) {
  "use strict";

  function countQuotes(str) {
    return str.split('"').length - 1;
  }

  const regUniversalNewLine = /^(\r\n|\n\r|\r|\n)/;
  const regNextCellNoQuotes = /^[^\t\r\n]+(\t)?/;
  const regNextCellQuotes = /^(\")[^\t\r\n]+(\")?(\t|[\r\n])?/;
  const regNextMultilineCell = /^(\")?[\r\n\W\D\d]+(\"\t|\"[\r\n])(?!\"[\t\n\r])/;
  const regNextEmptyCell = /^\t/;

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
            arr[row] = [''];
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

        let fragment;

        if (str.startsWith('"')) {
          fragment = str.match(regNextMultilineCell) || str.match(/^\"[\d\D]*\"$/);
          
          if (!fragment) {
            fragment = str.match(regNextCellQuotes);
          }

        } else {
          fragment = str.match(regNextCellNoQuotes);
        }

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

        nextCell = nextCell.replace(/\t$/, '').replace(/[\r\n]$/, ''); //.replace(/\"$/, '');

        if (nextCell.startsWith('"')) {
          const endingQuotes = nextCell.match(/[\"]*$/);
          nextCell = nextCell.replace(/^\"/, '');

  
          if (endingQuotes) {
            let charsToDelete = endingQuotes[0].length;
  
            if (charsToDelete > 1) {
              charsToDelete = charsToDelete % 2;
            }
  
            nextCell = nextCell.replace(new RegExp(`.{${charsToDelete}}$`), '').replace(/\"\"/g, '"');
          }
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
