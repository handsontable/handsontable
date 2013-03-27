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

  global.SheetClip = {
    parse: function (str) {
      var r, rlen, rows, arr = [], a = 0, c, clen, multiline, last;
      rows = str.split('\n');
      if (rows.length > 1 && rows[rows.length - 1] === '') {
        rows.pop();
      }
      for (r = 0, rlen = rows.length; r < rlen; r += 1) {
        rows[r] = rows[r].split('\t');
        for (c = 0, clen = rows[r].length; c < clen; c += 1) {
          if (!arr[a]) {
            arr[a] = [];
          }
          if (multiline && c === 0) {
            last = arr[a].length - 1;
            arr[a][last] = arr[a][last] + '\n' + rows[r][0];
            if (multiline && (countQuotes(rows[r][0]) & 1)) { //& 1 is a bitwise way of performing mod 2
              multiline = false;
              arr[a][last] = arr[a][last].substring(0, arr[a][last].length - 1).replace(/""/g, '"');
            }
          }
          else {
            if (c === clen - 1 && rows[r][c].indexOf('"') === 0) {
              arr[a].push(rows[r][c].substring(1).replace(/""/g, '"'));
              multiline = true;
            }
            else {
              arr[a].push(rows[r][c].replace(/""/g, '"'));
              multiline = false;
            }
          }
        }
        if (!multiline) {
          a += 1;
        }
      }
      return arr;
    },

    stringify: function (arr) {
      var r, rlen, c, clen, str = '', val;
      for (r = 0, rlen = arr.length; r < rlen; r += 1) {
        for (c = 0, clen = arr[r].length; c < clen; c += 1) {
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
          else if (val === null || val === void 0) { //void 0 resolves to undefined
            str += '';
          }
          else {
            str += val;
          }
        }
        str += '\n';
      }
      return str;
    }
  };
}(window));