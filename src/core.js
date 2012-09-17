/**
 * Handsontable 0.6.0-beta
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://warpech.github.com/jquery-handsontable/
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */

var Handsontable = { //class namespace
  extension: {}, //extenstion namespace
  helper: {} //helper namespace
};

(function ($, window, Handsontable) {
  "use strict";
  Handsontable.Core = function (container, settings) {
    this.container = container;

    var priv, datamap, grid, selection, editproxy, highlight, autofill, interaction, self = this;

    priv = {
      settings: {},
      isMouseOverTable: false,
      isMouseDown: false,
      isCellEdited: false,
      selStart: null,
      selEnd: null,
      editProxy: false,
      isPopulated: null,
      scrollable: null,
      hasLegend: null,
      lastAutoComplete: null,
      undoRedo: null,
      extensions: {},
      legendDirty: null
    };

    var lastChange = '';

    function isAutoComplete() {
      var typeahead = priv.editProxy.data("typeahead");
      if (typeahead && typeahead.$menu.is(":visible")) {
        return typeahead;
      }
      else {
        return false;
      }
    }

    /**
     * Measure the width and height of browser scrollbar
     * @return {Object}
     */
    function measureScrollbar() {
      var div = $('<div style="width:150px;height:150px;overflow:hidden;position:absolute;top:200px;left:200px"><div style="width:100%;height:100%;position:absolute">x</div>');
      $('body').append(div);
      var subDiv = $(div[0].firstChild);
      var w1 = subDiv.innerWidth();
      var h1 = subDiv.innerHeight();
      div[0].style.overflow = 'scroll';
      w1 -= subDiv.innerWidth();
      h1 -= subDiv.innerHeight();
      if (w1 === 0) {
        w1 = 17;
      }
      if (h1 === 0) {
        h1 = 17;
      }
      div.remove();
      return {width: w1, height: h1};
    }

    /**
     * Copied from bootstrap-typeahead.js for reference
     */
    function defaultAutoCompleteHighlighter(item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>';
      })
    }

    var hasMinWidthProblem = ($.browser.msie && (parseInt($.browser.version, 10) <= 7));
    /**
     * Used to get over IE7 not respecting CSS min-width (and also not showing border around empty cells)
     * @param {Element} td
     */
    this.minWidthFix = function (td) {
      if (hasMinWidthProblem) {
        if (td.className) {
          td.innerHTML = '<div class="minWidthFix ' + td.className + '">' + td.innerHTML + '</div>';
        }
        else {
          td.innerHTML = '<div class="minWidthFix">' + td.innerHTML + '</div>';
        }
      }
    };

    var hasPositionProblem = ($.browser.msie && (parseInt($.browser.version, 10) <= 7));
    /**
     * Used to get over IE7 returning negative position in demo/buttons.html
     * @param {Object} position
     */
    this.positionFix = function (position) {
      if (hasPositionProblem) {
        if (position.top < 0) {
          position.top = 0;
        }
        if (position.left < 0) {
          position.left = 0;
        }
      }
    };

    /**
     * This will parse a delimited string into an array of arrays. The default delimiter is the comma, but this can be overriden in the second argument.
     * @see http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
     * @param strData
     * @param strDelimiter
     */
    var strDelimiter = '\t';
    var objPattern = new RegExp("(\\" + strDelimiter + "|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\" + strDelimiter + "\\r\\n]*))", "gi");
    var dblQuotePattern = /""/g;

    function CSVToArray(strData) {
      var rows;
      if (strData.indexOf('"') === -1) { //if there is no " symbol, we don't have to use regexp to parse the input
        var r, rlen;
        rows = strData.split("\n");
        if (rows.length > 1 && rows[rows.length - 1] === '') {
          rows.pop();
        }
        for (r = 0, rlen = rows.length; r < rlen; r++) {
          rows[r] = rows[r].split("\t");
        }
      }
      else {
        rows = [
          []
        ];
        var arrMatches, strMatchedValue;
        while (arrMatches = objPattern.exec(strData)) {
          var strMatchedDelimiter = arrMatches[ 1 ];
          if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
            rows.push([]);
          }
          if (arrMatches[2]) {
            strMatchedValue = arrMatches[2].replace(dblQuotePattern, '"');
          }
          else {
            strMatchedValue = arrMatches[3];

          }
          rows[rows.length - 1].push(strMatchedValue);
        }
      }
      return rows;
    }

    datamap = {
      data: [],

      /**
       * Creates row at the bottom of the data array
       * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
       */
      createRow: function (coords) {
        var row = [];
        for (var c = 0; c < self.colCount; c++) {
          row.push('');
        }
        if (!coords || coords.row >= self.rowCount) {
          datamap.data.push(row);
        }
        else {
          datamap.data.splice(coords.row, 0, row);
        }
      },

      /**
       * Creates col at the right of the data array
       * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
       */
      createCol: function (coords) {
        var r = 0;
        if (!coords || coords.col >= self.colCount) {
          for (; r < self.rowCount; r++) {
            datamap.data[r].push('');
          }
        }
        else {
          for (; r < self.rowCount; r++) {
            datamap.data[r].splice(coords.col, 0, '');
          }
        }
      },

      /**
       * Removes row at the bottom of the data array
       * @param {Object} [coords] Optional. Coords of the cell which row will be removed
       * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
       */
      removeRow: function (coords, toCoords) {
        if (!coords || coords.row === self.rowCount - 1) {
          datamap.data.pop();
        }
        else {
          datamap.data.splice(coords.row, toCoords.row - coords.row + 1);
        }
      },

      /**
       * Removes col at the right of the data array
       * @param {Object} [coords] Optional. Coords of the cell which col will be removed
       * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
       */
      removeCol: function (coords, toCoords) {
        var r = 0;
        if (!coords || coords.col === self.colCount - 1) {
          for (; r < self.rowCount; r++) {
            datamap.data[r].pop();
          }
        }
        else {
          var howMany = toCoords.col - coords.col + 1;
          for (; r < self.rowCount; r++) {
            datamap.data[r].splice(coords.col, howMany);
          }
        }
      },

      /**
       * Returns single value from the data array
       * @param {Number} row
       * @param {Number} col
       */
      get: function (row, col) {
        return datamap.data[row] ? datamap.data[row][col] : null;
      },

      /**
       * Saves single value to the data array
       * @param {Number} row
       * @param {Number} col
       * @param {String} value
       */
      set: function (row, col, value) {
        datamap.data[row][col] = value;
      },

      /**
       * Clears the data array
       */
      clear: function () {
        for (var r = 0; r < self.rowCount; r++) {
          for (var c = 0; c < self.colCount; c++) {
            datamap.data[r][c] = '';
          }
        }
      },

      /**
       * Returns the data array
       * @return {Array}
       */
      getAll: function () {
        return datamap.data;
      },

      /**
       * Returns data range as array
       * @param {Object} start Start selection position
       * @param {Object} end End selection position
       * @return {Array}
       */
      getRange: function (start, end) {
        var r, rlen, c, clen, output = [], row;
        rlen = Math.max(start.row, end.row);
        clen = Math.max(start.col, end.col);
        for (r = Math.min(start.row, end.row); r <= rlen; r++) {
          row = [];
          for (c = Math.min(start.col, end.col); c <= clen; c++) {
            row.push(datamap.data[r][c]);
          }
          output.push(row);
        }
        return output;
      },

      /**
       * Return data as text (tab separated columns)
       * @param {Object} start (Optional) Start selection position
       * @param {Object} end (Optional) End selection position
       * @return {String}
       */
      getText: function (start, end) {
        var data = datamap.getRange(start, end), text = '', r, rlen, c, clen, stripHtml = /<(?:.|\n)*?>/gm;
        for (r = 0, rlen = data.length; r < rlen; r++) {
          for (c = 0, clen = data[r].length; c < clen; c++) {
            if (c > 0) {
              text += "\t";
            }
            if (data[r][c].indexOf('\n') > -1) {
              text += '"' + data[r][c].replace(stripHtml, '').replace(/"/g, '""') + '"';
            }
            else {
              text += data[r][c].replace(stripHtml, '');
            }
          }
          if (r !== rlen - 1) {
            text += "\n";
          }
        }
        text = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&"); //unescape html special chars
        return text;
      }
    };

    grid = {
      /**
       * Alter grid
       * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col"
       * @param {Object} coords
       * @param {Object} [toCoords] Required only for actions "remove_row" and "remove_col"
       */
      alter: function (action, coords, toCoords) {
        var oldData, newData, changes, r, rlen, c, clen, result;
        oldData = $.extend(true, [], datamap.getAll());

        switch (action) {
          case "insert_row":
            datamap.createRow(coords);
            grid.createRow(coords);
            self.blockedCols.refresh();
            if (priv.selStart && priv.selStart.row >= coords.row) {
              priv.selStart.row = priv.selStart.row + 1;
              selection.transformEnd(1, 0);
            }
            else {
              selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
            }
            break;

          case "insert_col":
            datamap.createCol(coords);
            grid.createCol(coords);
            self.blockedRows.refresh();
            if (priv.selStart && priv.selStart.col >= coords.col) {
              priv.selStart.col = priv.selStart.col + 1;
              selection.transformEnd(0, 1);
            }
            else {
              selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
            }
            break;

          case "remove_row":
            datamap.removeRow(coords, toCoords);
            grid.removeRow(coords, toCoords);
            result = grid.keepEmptyRows();
            if (!result) {
              self.blockedCols.refresh();
            }
            selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
            break;

          case "remove_col":
            datamap.removeCol(coords, toCoords);
            grid.removeCol(coords, toCoords);
            result = grid.keepEmptyRows();
            if (!result) {
              self.blockedRows.refresh();
            }
            selection.transformEnd(0, 0); //refresh selection, otherwise arrow movement does not work
            break;
        }

        changes = [];
        newData = datamap.getAll();
        for (r = 0, rlen = newData.length; r < rlen; r++) {
          for (c = 0, clen = newData[r].length; c < clen; c++) {
            changes.push([r, c, oldData[r] ? oldData[r][c] : null, newData[r][c]]);
          }
        }
        self.container.triggerHandler("datachange.handsontable", [changes, 'alter']);
      },

      /**
       * Creates row at the bottom of the <table>
       * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
       */
      createRow: function (coords) {
        var tr, c, r, td;
        tr = document.createElement('tr');
        self.blockedCols.createRow(tr);
        for (c = 0; c < self.colCount; c++) {
          tr.appendChild(td = document.createElement('td'));
          self.minWidthFix(td);
        }
        if (!coords || coords.row >= self.rowCount) {
          priv.tableBody.appendChild(tr);
          r = self.rowCount;
        }
        else {
          var oldTr = grid.getCellAtCoords(coords).parentNode;
          priv.tableBody.insertBefore(tr, oldTr);
          r = coords.row;
        }
        self.rowCount++;
        for (c = 0; c < self.colCount; c++) {
          grid.updateLegend({row: r, col: c});
        }
      },

      /**
       * Creates col at the right of the <table>
       * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
       */
      createCol: function (coords) {
        var trs = priv.tableBody.childNodes, r, c, td;
        self.blockedRows.createCol();
        if (!coords || coords.col >= self.colCount) {
          for (r = 0; r < self.rowCount; r++) {
            trs[r].appendChild(td = document.createElement('td'));
            self.minWidthFix(td);
          }
          c = self.colCount;
        }
        else {
          for (r = 0; r < self.rowCount; r++) {
            trs[r].insertBefore(td = document.createElement('td'), grid.getCellAtCoords({row: r, col: coords.col}));
            self.minWidthFix(td);
          }
          c = coords.col;
        }
        self.colCount++;
        for (r = 0; r < self.rowCount; r++) {
          grid.updateLegend({row: r, col: c});
        }
      },

      /**
       * Removes row at the bottom of the <table>
       * @param {Object} [coords] Optional. Coords of the cell which row will be removed
       * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
       */
      removeRow: function (coords, toCoords) {
        if (!coords || coords.row === self.rowCount - 1) {
          $(priv.tableBody.childNodes[self.rowCount - 1]).remove();
          self.rowCount--;
        }
        else {
          for (var i = toCoords.row; i >= coords.row; i--) {
            $(priv.tableBody.childNodes[i]).remove();
            self.rowCount--;
          }
        }
      },

      /**
       * Removes col at the right of the <table>
       * @param {Object} [coords] Optional. Coords of the cell which col will be removed
       * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
       */
      removeCol: function (coords, toCoords) {
        var trs = priv.tableBody.childNodes, colThs, i;
        if (self.blockedRows) {
          colThs = self.table.find('thead th');
        }
        var r = 0;
        if (!coords || coords.col === self.colCount - 1) {
          for (; r < self.rowCount; r++) {
            $(trs[r].childNodes[self.colCount + self.blockedCols.count() - 1]).remove();
            if (colThs) {
              colThs.eq(self.colCount + self.blockedCols.count() - 1).remove();
            }
          }
          self.colCount--;
        }
        else {
          for (; r < self.rowCount; r++) {
            for (i = toCoords.col; i >= coords.col; i--) {
              $(trs[r].childNodes[i + self.blockedCols.count()]).remove();

            }
          }
          if (colThs) {
            for (i = toCoords.col; i >= coords.col; i--) {
              colThs.eq(i + self.blockedCols.count()).remove();
            }
          }
          self.colCount -= toCoords.col - coords.col + 1;
        }
      },

      /**
       * Makes sure there are empty rows at the bottom of the table
       * @return recreate {Boolean} TRUE if row or col was added or removed
       */
      keepEmptyRows: function () {
        var rows, r, c, clen, emptyRows = 0, emptyCols = 0, rlen, recreateRows = false, recreateCols = false;

        var $tbody = $(priv.tableBody);

        //count currently empty rows
        rows = datamap.getAll();
        rlen = rows.length;
        rows : for (r = rlen - 1; r >= 0; r--) {
          for (c = 0, clen = rows[r].length; c < clen; c++) {
            if (rows[r][c] !== '') {
              break rows;
            }
          }
          emptyRows++;
        }

        //should I add empty rows to meet minSpareRows?
        if (self.rowCount < priv.settings.rows || emptyRows < priv.settings.minSpareRows) {
          for (; self.rowCount < priv.settings.rows || emptyRows < priv.settings.minSpareRows; emptyRows++) {
            datamap.createRow();
            grid.createRow();
            recreateRows = true;
          }
        }

        //should I add empty rows to meet minHeight
        //WARNING! jQuery returns 0 as height() for container which is not :visible. this will lead to a infinite loop
        if (priv.settings.minHeight) {
          if ($tbody.height() > 0 && $tbody.height() <= priv.settings.minHeight) {
            while ($tbody.height() <= priv.settings.minHeight) {
              datamap.createRow();
              grid.createRow();
              recreateRows = true;
            }
          }
        }

        //count currently empty cols
        rows = datamap.getAll();
        rlen = rows.length;
        if (rlen > 0) {
          clen = rows[0].length;
          cols : for (c = clen - 1; c >= 0; c--) {
            for (r = 0; r < rlen; r++) {
              if (rows[r][c] !== '') {
                break cols;
              }
            }
            emptyCols++;
          }
        }

        //should I add empty cols to meet minSpareCols?
        if (self.colCount < priv.settings.cols || emptyCols < priv.settings.minSpareCols) {
          for (; self.colCount < priv.settings.cols || emptyCols < priv.settings.minSpareCols; emptyCols++) {
            datamap.createCol();
            grid.createCol();
            recreateCols = true;
          }
        }

        //should I add empty rows to meet minWidth
        //WARNING! jQuery returns 0 as width() for container which is not :visible. this will lead to a infinite loop
        if (priv.settings.minWidth) {
          if ($tbody.width() > 0 && $tbody.width() <= priv.settings.minWidth) {
            while ($tbody.width() <= priv.settings.minWidth) {
              datamap.createCol();
              grid.createCol();
              recreateCols = true;
            }
          }
        }

        if (!recreateRows && priv.settings.enterBeginsEditing) {
          for (; ((priv.settings.rows && self.rowCount > priv.settings.rows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows) && (!priv.settings.minHeight || $tbody.height() - $tbody.find('tr:last').height() - 4 > priv.settings.minHeight)); emptyRows--) {
            grid.removeRow();
            datamap.removeRow();
            recreateRows = true;
          }
        }

        if (recreateRows && priv.selStart) {
          //if selection is outside, move selection to last row
          if (priv.selStart.row > self.rowCount - 1) {
            priv.selStart.row = self.rowCount - 1;
            if (priv.selEnd.row > priv.selStart.row) {
              priv.selEnd.row = priv.selStart.row;
            }
          } else if (priv.selEnd.row > self.rowCount - 1) {
            priv.selEnd.row = self.rowCount - 1;
            if (priv.selStart.row > priv.selEnd.row) {
              priv.selStart.row = priv.selEnd.row;
            }
          }
        }

        if (!recreateCols && priv.settings.enterBeginsEditing) {
          for (; ((priv.settings.cols && self.colCount > priv.settings.cols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols) && (!priv.settings.minWidth || $tbody.width() - $tbody.find('tr:last').find('td:last').width() - 4 > priv.settings.minWidth)); emptyCols--) {
            datamap.removeCol();
            grid.removeCol();
            recreateCols = true;
          }
        }

        if (recreateCols && priv.selStart) {
          //if selection is outside, move selection to last row
          if (priv.selStart.col > self.colCount - 1) {
            priv.selStart.col = self.colCount - 1;
            if (priv.selEnd.col > priv.selStart.col) {
              priv.selEnd.col = priv.selStart.col;
            }
          } else if (priv.selEnd.col > self.colCount - 1) {
            priv.selEnd.col = self.colCount - 1;
            if (priv.selStart.col > priv.selEnd.col) {
              priv.selStart.col = priv.selEnd.col;
            }
          }
        }

        if (recreateRows || recreateCols) {
          selection.refreshBorders();
          self.blockedCols.refresh();
          self.blockedRows.refresh();
        }

        return (recreateRows || recreateCols);
      },

      /**
       * Update legend
       */
      updateLegend: function (coords) {
        if (priv.settings.legend || priv.hasLegend) {
          var $td = $(grid.getCellAtCoords(coords));
          $td.removeAttr("style").removeAttr("title").removeData("readOnly");
          $td[0].className = '';
          $td.find("img").remove();
        }
        if (priv.settings.legend) {
          for (var j = 0, jlen = priv.settings.legend.length; j < jlen; j++) {
            var legend = priv.settings.legend[j],
                $img;
            if (legend.match(coords.row, coords.col, datamap.getAll)) {
              priv.hasLegend = true;
              typeof legend.style !== "undefined" && $td.css(legend.style);
              typeof legend.readOnly !== "undefined" && $td.data("readOnly", legend.readOnly);
              typeof legend.title !== "undefined" && $td.attr("title", legend.title);
              typeof legend.className !== "undefined" && $td.addClass(legend.className);
              if (typeof legend.icon !== "undefined" &&
                  typeof legend.icon.src !== "undefined" &&
                  typeof legend.icon.click !== "undefined") {
                $img = $('<img />').attr('src', legend.icon.src).addClass('icon');
                $img.on("click", (function (legend) {
                  return function (e) {
                    var func = legend.icon.click;
                    func.call(self, priv.selStart.row, priv.selStart.col, datamap.getAll, e.target);
                  }
                })(legend));
                $img.on("load", function () {
                  setTimeout(function () {
                    var changes = [
                      [coords.row, coords.col]
                    ];
                    self.blockedRows.dimensions(changes);
                    self.blockedCols.dimensions(changes);
                  }, 10);
                });
                $td.append($img);
              }
            }
          }
        }
      },

      /**
       * Is cell writable
       */
      isCellWritable: function ($td) {
        if (priv.isPopulated && $td.data("readOnly")) {
          return false;
        }
        return true;
      },

      /**
       * Populate cells at position with 2d array
       * @param {Object} start Start selection position
       * @param {Array} input 2d array
       * @param {Object} [end] End selection position (only for drag-down mode)
       * @param {Boolean} [allowHtml]
       * @param {String} [source="populateFromArray"]
       * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
       */
      populateFromArray: function (start, input, end, allowHtml, source) {
        var r, rlen, c, clen, td, endTd, setData = [], current = {};
        rlen = input.length;
        if (rlen === 0) {
          return false;
        }
        current.row = start.row;
        current.col = start.col;
        for (r = 0; r < rlen; r++) {
          if ((end && current.row > end.row) || (!priv.settings.minSpareRows && current.row > self.rowCount - 1)) {
            break;
          }
          current.col = start.col;
          clen = input[r] ? input[r].length : 0;
          for (c = 0; c < clen; c++) {
            if ((end && current.col > end.col) || (!priv.settings.minSpareCols && current.col > self.colCount - 1)) {
              break;
            }
            td = grid.getCellAtCoords(current);
            if (grid.isCellWritable($(td))) {
              setData.push([current.row, current.col, input[r][c], allowHtml]);
            }
            current.col++;
            if (end && c === clen - 1) {
              c = -1;
            }
          }
          current.row++;
          if (end && r === rlen - 1) {
            r = -1;
          }
        }
        endTd = self.setDataAtCell(setData, null, null, null, source || 'populateFromArray');
        return endTd;
      },

      /**
       * Clears all cells in the grid
       */
      clear: function () {
        var tds = grid.getAllCells();
        for (var i = 0, ilen = tds.length; i < ilen; i++) {
          $(tds[i]).empty();
          self.minWidthFix(tds[i]);
          grid.updateLegend(grid.getCellCoords(tds[i]));
        }
      },

      /**
       * Returns coordinates given td object
       */
      getCellCoords: function (td) {
        return {
          row: td.parentNode.rowIndex - self.blockedRows.count(),
          col: td.cellIndex - self.blockedCols.count()
        };
      },

      /**
       * Returns td object given coordinates
       */
      getCellAtCoords: function (coords) {
        if (coords.row < 0 || coords.col < 0) {
          return null;
        }
        var tr = priv.tableBody.childNodes[coords.row];
        if (tr) {
          return tr.childNodes[coords.col + self.blockedCols.count()];
        }
        else {
          return null;
        }
      },

      /**
       * Returns the top left (TL) and bottom right (BR) selection coordinates
       * @param {Object[]} coordsArr
       * @returns {Object}
       */
      getCornerCoords: function (coordsArr) {
        function mapProp(func, array, prop) {
          function getProp(el) {
            return el[prop];
          }

          if (Array.prototype.map) {
            return func.apply(Math, array.map(getProp));
          }
          return func.apply(Math, $.map(array, getProp));
        }

        return {
          TL: {
            row: mapProp(Math.min, coordsArr, "row"),
            col: mapProp(Math.min, coordsArr, "col")
          },
          BR: {
            row: mapProp(Math.max, coordsArr, "row"),
            col: mapProp(Math.max, coordsArr, "col")
          }
        };
      },

      /**
       * Returns array of td objects given start and end coordinates
       */
      getCellsAtCoords: function (start, end) {
        var corners = grid.getCornerCoords([start, end]);
        var r, c, output = [];
        for (r = corners.TL.row; r <= corners.BR.row; r++) {
          for (c = corners.TL.col; c <= corners.BR.col; c++) {
            output.push(grid.getCellAtCoords({
              row: r,
              col: c
            }));
          }
        }
        return output;
      },

      /**
       * Returns all td objects in grid
       */
      getAllCells: function () {
        var tds = [], trs, r, rlen, c, clen;
        trs = priv.tableBody.childNodes;
        rlen = self.rowCount;
        if (rlen > 0) {
          clen = self.colCount;
          for (r = 0; r < rlen; r++) {
            for (c = 0; c < clen; c++) {
              tds.push(trs[r].childNodes[c + self.blockedCols.count()]);
            }
          }
        }
        return tds;
      }
    };

    selection = {
      /**
       * Starts selection range on given td object
       * @param td element
       */
      setRangeStart: function (td) {
        selection.deselect();
        priv.selStart = grid.getCellCoords(td);
        selection.setRangeEnd(td);
      },

      /**
       * Ends selection range on given td object
       * @param {Element} td
       * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
       */
      setRangeEnd: function (td, scrollToCell) {
        var coords = grid.getCellCoords(td);
        selection.end(coords);
        if (!priv.settings.multiSelect) {
          priv.selStart = coords;
        }
        if (priv.settings.onSelection) {
          priv.settings.onSelection(priv.selStart.row, priv.selStart.col, priv.selEnd.row, priv.selEnd.col);
        }
        selection.refreshBorders();
        if (scrollToCell !== false) {
          highlight.scrollViewport(td);
        }
      },

      /**
       * Redraws borders around cells
       */
      refreshBorders: function () {
        if (!selection.isSelected()) {
          return;
        }
        if (priv.fillHandle) {
          autofill.showHandle();
        }
        priv.currentBorder.appear([priv.selStart]);
        highlight.on();
        editproxy.prepare();
      },

      /**
       * Setter/getter for selection start
       */
      start: function (coords) {
        if (coords) {
          priv.selStart = coords;
        }
        return priv.selStart;
      },

      /**
       * Setter/getter for selection end
       */
      end: function (coords) {
        if (coords) {
          priv.selEnd = coords;
        }
        return priv.selEnd;
      },

      /**
       * Returns information if we have a multiselection
       * @return {Boolean}
       */
      isMultiple: function () {
        return !(priv.selEnd.col === priv.selStart.col && priv.selEnd.row === priv.selStart.row);
      },

      /**
       * Selects cell relative to current cell (if possible)
       */
      transformStart: function (rowDelta, colDelta, force) {
        if (priv.selStart.row + rowDelta > self.rowCount - 1) {
          if (force && priv.settings.minSpareRows > 0) {
            self.alter("insert_row", self.rowCount);
          }
          else if (priv.settings.autoWrapCol && priv.selStart.col + colDelta < self.colCount - 1) {
            rowDelta = 1 - self.rowCount;
            colDelta = 1;
          }
        }
        else if (priv.settings.autoWrapCol && priv.selStart.row + rowDelta < 0 && priv.selStart.col + colDelta >= 0) {
          rowDelta = self.rowCount - 1;
          colDelta = -1;
        }
        if (priv.selStart.col + colDelta > self.colCount - 1) {
          if (force && priv.settings.minSpareCols > 0) {
            self.alter("insert_col", self.colCount);
          }
          else if (priv.settings.autoWrapRow && priv.selStart.row + rowDelta < self.rowCount - 1) {
            rowDelta = 1;
            colDelta = 1 - self.colCount;
          }
        }
        else if (priv.settings.autoWrapRow && priv.selStart.col + colDelta < 0 && priv.selStart.row + rowDelta >= 0) {
          rowDelta = -1;
          colDelta = self.colCount - 1;
        }
        var td = grid.getCellAtCoords({
          row: (priv.selStart.row + rowDelta),
          col: priv.selStart.col + colDelta
        });
        if (td) {
          selection.setRangeStart(td);
        }
        else {
          selection.setRangeStart(grid.getCellAtCoords(priv.selStart)); //rerun some routines
        }
      },

      /**
       * Sets selection end cell relative to current selection end cell (if possible)
       */
      transformEnd: function (rowDelta, colDelta) {
        if (priv.selEnd) {
          var td = grid.getCellAtCoords({
            row: (priv.selEnd.row + rowDelta),
            col: priv.selEnd.col + colDelta
          });
          if (td) {
            selection.setRangeEnd(td);
          }
        }
      },

      /**
       * Returns true if currently there is a selection on screen, false otherwise
       * @return {Boolean}
       */
      isSelected: function () {
        var selEnd = selection.end();
        if (!selEnd || typeof selEnd.row === "undefined") {
          return false;
        }
        return true;
      },

      /**
       * Returns true if coords is within current selection coords
       * @return {Boolean}
       */
      inInSelection: function (coords) {
        if (!selection.isSelected()) {
          return false;
        }
        var sel = grid.getCornerCoords([priv.selStart, priv.selEnd]);
        return (sel.TL.row <= coords.row && sel.BR.row >= coords.row && sel.TL.col <= coords.col && sel.BR.col >= coords.col);
      },

      /**
       * Deselects all selected cells
       */
      deselect: function () {
        if (!selection.isSelected()) {
          return;
        }
        if (priv.isCellEdited) {
          editproxy.finishEditing();
        }
        highlight.off();
        priv.currentBorder.disappear();
        if (priv.fillHandle) {
          autofill.hideHandle();
        }
        selection.end(false);
        self.container.trigger('deselect.handsontable');
      },

      /**
       * Select all cells
       */
      selectAll: function () {
        if (!priv.settings.multiSelect) {
          return;
        }
        var tds = grid.getAllCells();
        if (tds.length) {
          selection.setRangeStart(tds[0]);
          selection.setRangeEnd(tds[tds.length - 1], false);
        }
      },

      /**
       * Deletes data from selected cells
       */
      empty: function () {
        if (!selection.isSelected()) {
          return;
        }
        var tds, i, ilen, changes = [], coords, old, $td;
        tds = grid.getCellsAtCoords(priv.selStart, selection.end());
        for (i = 0, ilen = tds.length; i < ilen; i++) {
          coords = grid.getCellCoords(tds[i]);
          old = datamap.get(coords.row, coords.col);
          $td = $(tds[i]);
          if (old !== '' && grid.isCellWritable($td)) {
            $td.empty();
            self.minWidthFix(tds[i]);
            datamap.set(coords.row, coords.col, '');
            changes.push([coords.row, coords.col, old, '']);
            grid.updateLegend(coords);
          }
        }
        if (changes.length) {
          self.container.triggerHandler("datachange.handsontable", [changes, 'empty']);
          setTimeout(function () {
            self.blockedRows.dimensions(changes);
            self.blockedCols.dimensions(changes);
          }, 10);
        }
        grid.keepEmptyRows();
        selection.refreshBorders();
      }
    };

    highlight = {
      /**
       * Create highlight border
       */
      init: function () {
        priv.selectionBorder = new Border(container, {
          className: 'selection',
          bg: true
        });
      },

      /**
       * Show border around selected cells
       */
      on: function () {
        if (!selection.isSelected()) {
          return false;
        }
        if (selection.isMultiple()) {
          priv.selectionBorder.appear([priv.selStart, selection.end()]);
        }
        else {
          priv.selectionBorder.disappear();
        }
      },

      /**
       * Hide border around selected cells
       */
      off: function () {
        if (!selection.isSelected()) {
          return false;
        }
        priv.selectionBorder.disappear();
      },

      /**
       * Scroll viewport to selection
       * @param td
       */
      scrollViewport: function (td) {
        if (!selection.isSelected()) {
          return false;
        }

        var $td = $(td);
        var tdOffset = $td.offset();
        var scrollLeft = priv.scrollable.scrollLeft(); //scrollbar position
        var scrollTop = priv.scrollable.scrollTop(); //scrollbar position
        var scrollOffset = priv.scrollable.offset();
        var rowHeaderWidth = self.blockedCols.count() ? $(self.blockedCols.main[0].firstChild).outerWidth() : 2;
        var colHeaderHeight = self.blockedRows.count() ? $(self.blockedRows.main[0].firstChild).outerHeight() : 2;

        var offsetTop = tdOffset.top;
        var offsetLeft = tdOffset.left;
        var scrollWidth, scrollHeight;
        if (scrollOffset) { //if is not the window
          scrollWidth = priv.scrollable.outerWidth();
          scrollHeight = priv.scrollable.outerHeight();
          offsetTop += scrollTop - scrollOffset.top;
          offsetLeft += scrollLeft - scrollOffset.left;
        }
        else {
          scrollWidth = priv.scrollable.width(); //don't use outerWidth with window (http://api.jquery.com/outerWidth/)
          scrollHeight = priv.scrollable.height();
        }
        scrollWidth -= priv.scrollbarSize.width;
        scrollHeight -= priv.scrollbarSize.height;

        var height = $td.outerHeight();
        var width = $td.outerWidth();

        if (scrollLeft + scrollWidth <= offsetLeft + width) {
          setTimeout(function () {
            priv.scrollable.scrollLeft(offsetLeft + width - scrollWidth);
          }, 1);
        }
        else if (scrollLeft > offsetLeft - rowHeaderWidth) {
          setTimeout(function () {
            priv.scrollable.scrollLeft(offsetLeft - rowHeaderWidth);
          }, 1);
        }

        if (scrollTop + scrollHeight <= offsetTop + height) {
          setTimeout(function () {
            priv.scrollable.scrollTop(offsetTop + height - scrollHeight);
          }, 1);
        }
        else if (scrollTop > offsetTop - colHeaderHeight) {
          setTimeout(function () {
            priv.scrollable.scrollTop(offsetTop - colHeaderHeight);
          }, 1);
        }
      }
    };

    autofill = {
      /**
       * Create fill handle and fill border objects
       */
      init: function () {
        if (!priv.fillHandle) {
          priv.fillHandle = new FillHandle(container);
          priv.fillBorder = new Border(container, {
            className: 'htFillBorder'
          });

          $(priv.fillHandle.handle).on('dblclick', autofill.selectAdjacent);
        }
        else {
          priv.fillHandle.disabled = false;
          priv.fillBorder.disabled = false;
        }
      },

      /**
       * Hide fill handle and fill border permanently
       */
      disable: function () {
        priv.fillHandle.disabled = true;
        priv.fillBorder.disabled = true;
      },

      /**
       * Selects cells down to the last row in the left column, then fills down to that cell
       */
      selectAdjacent: function () {
        var select, data, r, maxR, c;

        if (selection.isMultiple()) {
          select = priv.selectionBorder.corners;
        }
        else {
          select = priv.currentBorder.corners;
        }

        priv.fillBorder.disappear();

        data = datamap.getAll();
        rows : for (r = select.BR.row + 1; r < self.rowCount; r++) {
          for (c = select.TL.col; c <= select.BR.col; c++) {
            if (data[r][c]) {
              break rows;
            }
          }
          if (!!data[r][select.TL.col - 1] || !!data[r][select.BR.col + 1]) {
            maxR = r;
          }
        }
        if (maxR) {
          autofill.showBorder(grid.getCellAtCoords({row: maxR, col: select.BR.col}));
          autofill.apply();
        }
      },

      /**
       * Apply fill values to the area in fill border, omitting the selection border
       */
      apply: function () {
        var drag, select, start, end;

        priv.fillHandle.isDragged = 0;

        drag = priv.fillBorder.corners;
        if (!drag) {
          return;
        }

        priv.fillBorder.disappear();

        if (selection.isMultiple()) {
          select = priv.selectionBorder.corners;
        }
        else {
          select = priv.currentBorder.corners;
        }

        if (drag.TL.row === select.TL.row && drag.TL.col < select.TL.col) {
          start = drag.TL;
          end = {
            row: drag.BR.row,
            col: select.TL.col - 1
          };
        }
        else if (drag.TL.row === select.TL.row && drag.BR.col > select.BR.col) {
          start = {
            row: drag.TL.row,
            col: select.BR.col + 1
          };
          end = drag.BR;
        }
        else if (drag.TL.row < select.TL.row && drag.TL.col === select.TL.col) {
          start = drag.TL;
          end = {
            row: select.TL.row - 1,
            col: drag.BR.col
          };
        }
        else if (drag.BR.row > select.BR.row && drag.TL.col === select.TL.col) {
          start = {
            row: select.BR.row + 1,
            col: drag.TL.col
          };
          end = drag.BR;
        }

        if (start) {
          var inputArray = CSVToArray(priv.editProxy.val(), '\t');
          grid.populateFromArray(start, inputArray, end, null, 'autofill');

          selection.setRangeStart(grid.getCellAtCoords(drag.TL));
          selection.setRangeEnd(grid.getCellAtCoords(drag.BR));
        }
        else {
          //reset to avoid some range bug
          selection.refreshBorders();
        }
      },

      /**
       * Show fill handle
       */
      showHandle: function () {
        priv.fillHandle.appear([priv.selStart, priv.selEnd]);
      },

      /**
       * Hide fill handle
       */
      hideHandle: function () {
        priv.fillHandle.disappear();
      },

      /**
       * Show fill border
       */
      showBorder: function (td) {
        var coords = grid.getCellCoords(td);
        var corners = grid.getCornerCoords([priv.selStart, priv.selEnd]);
        if (priv.settings.fillHandle !== 'horizontal' && (corners.BR.row < coords.row || corners.TL.row > coords.row)) {
          coords = {row: coords.row, col: corners.BR.col};
        }
        else if (priv.settings.fillHandle !== 'vertical') {
          coords = {row: corners.BR.row, col: coords.col};
        }
        else {
          return; //wrong direction
        }
        priv.fillBorder.appear([priv.selStart, priv.selEnd, coords]);
      }
    };

    editproxy = {
      /**
       * Create input field
       */
      init: function () {
        priv.editProxy = $('<textarea class="handsontableInput">');
        priv.editProxyHolder = $('<div class="handsontableInputHolder">');
        priv.editProxyHolder.append(priv.editProxy);

        function onClick(event) {
          event.stopPropagation();
        }

        function onCut() {
          if (!priv.isCellEdited) {
            setTimeout(function () {
              selection.empty();
            }, 100);
          }
        }

        function onPaste() {
          if (!priv.isCellEdited) {
            setTimeout(function () {
              var input = priv.editProxy.val().replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, ''), //remove newline from the start and the end of the input
                  inputArray = CSVToArray(input, '\t'),
                  coords = grid.getCornerCoords([priv.selStart, priv.selEnd]),
                  endTd = grid.populateFromArray(coords.TL, inputArray, {
                    row: Math.max(coords.BR.row, inputArray.length - 1 + coords.TL.row),
                    col: Math.max(coords.BR.col, inputArray[0].length - 1 + coords.TL.col)
                  }, null, 'paste');
              selection.setRangeEnd(endTd);
            }, 100);
          }
        }

        function onKeyDown(event) {
          var r, c;
          priv.lastKeyCode = event.keyCode;
          if (selection.isSelected()) {
            var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
            if (Handsontable.helper.isPrintableChar(event.keyCode)) {
              if (!priv.isCellEdited && !ctrlDown) { //disregard CTRL-key shortcuts
                editproxy.beginEditing();
              }
              else if (ctrlDown) {
                if (!priv.isCellEdited && event.keyCode === 65) { //CTRL + A
                  selection.selectAll(); //select all cells
                }
                else if (!priv.isCellEdited && event.keyCode === 88 && $.browser.opera) { //CTRL + X
                  priv.editProxy.triggerHandler('cut'); //simulate oncut for Opera
                }
                else if (!priv.isCellEdited && event.keyCode === 86 && $.browser.opera) { //CTRL + V
                  priv.editProxy.triggerHandler('paste'); //simulate onpaste for Opera
                }
                else if (event.keyCode === 89 || (event.shiftKey && event.keyCode === 90)) { //CTRL + Y or CTRL + SHIFT + Z
                  priv.undoRedo && priv.undoRedo.redo();
                }
                else if (event.keyCode === 90) { //CTRL + Z
                  priv.undoRedo && priv.undoRedo.undo();
                }
              }
              return;
            }

            var rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;

            switch (event.keyCode) {
              case 38: /* arrow up */
                if (isAutoComplete()) {
                  return true;
                }
                if (!priv.isCellEdited) {
                  if (event.shiftKey) {
                    selection.transformEnd(-1, 0);
                  }
                  else {
                    selection.transformStart(-1, 0);
                  }
                  event.preventDefault();
                }
                else {
                  editproxy.finishEditing(false, -1, 0);
                }
                break;

              case 9: /* tab */
                r = priv.settings.tabMoves.row;
                c = priv.settings.tabMoves.col;
                if (!isAutoComplete()) {
                  if (event.shiftKey) {
                    editproxy.finishEditing(false, -r, -c);
                  }
                  else {
                    editproxy.finishEditing(false, r, c);
                  }
                }
                event.preventDefault();
                break;

              case 39: /* arrow right */
                if (!priv.isCellEdited) {
                  if (event.shiftKey) {
                    selection.transformEnd(0, 1);
                  }
                  else {
                    selection.transformStart(0, 1);
                  }
                  event.preventDefault();
                }
                else if (editproxy.getCaretPosition() === priv.editProxy.val().length) {
                  editproxy.finishEditing(false, 0, 1);
                }
                break;

              case 37: /* arrow left */
                if (!priv.isCellEdited) {
                  if (event.shiftKey) {
                    selection.transformEnd(0, -1);
                  }
                  else {
                    selection.transformStart(0, -1);
                  }
                  event.preventDefault();
                }
                else if (editproxy.getCaretPosition() === 0) {
                  editproxy.finishEditing(false, 0, -1);
                }
                break;

              case 8: /* backspace */
              case 46: /* delete */
                if (!priv.isCellEdited) {
                  selection.empty(event);
                  event.preventDefault();
                }
                break;

              case 40: /* arrow down */
                if (!priv.isCellEdited) {
                  if (event.shiftKey) {
                    selection.transformEnd(1, 0); //expanding selection down with shift
                  }
                  else {
                    selection.transformStart(1, 0); //move selection down
                  }
                }
                else {
                  if (isAutoComplete()) { //if browsing through autocomplete
                    return true;
                  }
                  else {
                    editproxy.finishEditing(false, 1, 0);
                  }
                }
                break;

              case 27: /* ESC */
                if (priv.isCellEdited) {
                  editproxy.finishEditing(true, 0, 0); //hide edit field, restore old value, don't move selection, but refresh routines
                }
                break;

              case 113: /* F2 */
                if (!priv.isCellEdited) {
                  editproxy.beginEditing(true); //show edit field
                  event.preventDefault(); //prevent Opera from opening Go to Page dialog
                }
                break;

              case 13: /* return/enter */
                r = priv.settings.enterMoves.row;
                c = priv.settings.enterMoves.col;
                if (priv.isCellEdited) {
                  if ((event.ctrlKey && !selection.isMultiple()) || event.altKey) { //if ctrl+enter or alt+enter, add new line
                    priv.editProxy.val(priv.editProxy.val() + '\n');
                    priv.editProxy[0].focus();
                  }
                  else if (!isAutoComplete()) {
                    if (event.shiftKey) { //if shift+enter, finish and move up
                      editproxy.finishEditing(false, -r, -c, ctrlDown);
                    }
                    else { //if enter, finish and move down
                      editproxy.finishEditing(false, r, c, ctrlDown);
                    }
                  }
                }
                else {
                  if (event.shiftKey) {
                    selection.transformStart(-r, -c); //move selection up
                  }
                  else {
                    if (priv.settings.enterBeginsEditing) {
                      if ((ctrlDown && !selection.isMultiple()) || event.altKey) { //if ctrl+enter or alt+enter, add new line
                        editproxy.beginEditing(true, '\n'); //show edit field
                      }
                      else {
                        editproxy.beginEditing(true); //show edit field
                      }
                    }
                    else {
                      selection.transformStart(r, c, true); //move selection down or create new row
                    }
                  }
                }
                event.preventDefault(); //don't add newline to field
                break;

              case 36: /* home */
                if (!priv.isCellEdited) {
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(grid.getCellAtCoords({row: 0, col: priv.selStart.col}));
                  }
                  else {
                    rangeModifier(grid.getCellAtCoords({row: priv.selStart.row, col: 0}));
                  }
                }
                break;

              case 35: /* end */
                if (!priv.isCellEdited) {
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(grid.getCellAtCoords({row: self.rowCount - 1, col: priv.selStart.col}));
                  }
                  else {
                    rangeModifier(grid.getCellAtCoords({row: priv.selStart.row, col: self.colCount - 1}));
                  }
                }
                break;

              case 33: /* pg up */
                rangeModifier(grid.getCellAtCoords({row: 0, col: priv.selStart.col}));
                break;

              case 34: /* pg dn */
                rangeModifier(grid.getCellAtCoords({row: self.rowCount - 1, col: priv.selStart.col}));
                break;

              default:
                break;
            }
          }
        }

        function onChange() {
          var move;
          if (isAutoComplete()) { //could this change be from autocomplete
            var val = priv.editProxy.val();
            if (val !== lastChange && val === priv.lastAutoComplete) { //is it change from source (don't trigger on partial)
              priv.isCellEdited = true;
              if (priv.lastKeyCode === 9) { //tab
                move = priv.settings.tabMoves;
              }
              else { //return/enter
                move = priv.settings.enterMoves;
              }
              editproxy.finishEditing(false, move.row, move.col);
            }
            lastChange = val;
          }
        }

        priv.editProxy.on('click', onClick);
        priv.editProxy.on('cut', onCut);
        priv.editProxy.on('paste', onPaste);
        priv.editProxy.on('keydown', onKeyDown);
        priv.editProxy.on('change', onChange);
        container.append(priv.editProxyHolder);
      },

      /**
       * Prepare text input to be displayed at given grid cell
       */
      prepare: function () {
        if (priv.isCellEdited) {
          return;
        }

        priv.editProxy.height(priv.editProxy.parent().innerHeight() - 4);
        priv.editProxy.val(datamap.getText(priv.selStart, priv.selEnd));
        setTimeout(editproxy.focus, 1);

        if (priv.settings.autoComplete) {
          var typeahead = priv.editProxy.data('typeahead');
          if (!typeahead) {
            priv.editProxy.typeahead({
              updater: function (item) {
                priv.lastAutoComplete = item;
                return item
              }
            });
            typeahead = priv.editProxy.data('typeahead');
          }
          typeahead.source = [];
          for (var i = 0, ilen = priv.settings.autoComplete.length; i < ilen; i++) {
            if (priv.settings.autoComplete[i].match(priv.selStart.row, priv.selStart.col, datamap.getAll)) {
              typeahead.source = priv.settings.autoComplete[i].source(priv.selStart.row, priv.selStart.col);
              typeahead.highlighter = priv.settings.autoComplete[i].highlighter || defaultAutoCompleteHighlighter;
              break;
            }
          }
        }

        var current = grid.getCellAtCoords(priv.selStart);
        var $current = $(current);
        var currentOffset = $current.offset();
        var containerOffset = container.offset();
        var scrollTop = container.scrollTop();
        var scrollLeft = container.scrollLeft();
        var editTop = currentOffset.top - containerOffset.top + scrollTop - 1;
        var editLeft = currentOffset.left - containerOffset.left + scrollLeft - 1;

        if (editTop < 0) {
          editTop = 0;
        }
        if (editLeft < 0) {
          editLeft = 0;
        }

        if (self.blockedRows.count() > 0 && parseInt($current.css('border-top-width')) > 0) {
          editTop += 1;
        }
        if (self.blockedCols.count() > 0 && parseInt($current.css('border-left-width')) > 0) {
          editLeft += 1;
        }

        if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
          editTop -= 1;
        }

        priv.editProxyHolder.addClass('htHidden');
        priv.editProxyHolder.css({
          top: editTop,
          left: editLeft,
          overflow: 'hidden'
        });
        priv.editProxy.css({
          width: 0,
          height: 0
        });
      },

      /**
       * Sets focus to textarea
       */
      focus: function () {
        priv.editProxy[0].select();
      },

      /**
       * Returns caret position in edit proxy
       * @author http://stackoverflow.com/questions/263743/how-to-get-caret-position-in-textarea
       * @return {Number}
       */
      getCaretPosition: function () {
        var el = priv.editProxy[0];
        if (el.selectionStart) {
          return el.selectionStart;
        }
        else if (document.selection) {
          el.focus();
          var r = document.selection.createRange();
          if (r == null) {
            return 0;
          }
          var re = el.createTextRange(),
              rc = re.duplicate();
          re.moveToBookmark(r.getBookmark());
          rc.setEndPoint('EndToStart', re);
          return rc.text.length;
        }
        return 0;
      },

      /**
       * Sets caret position in edit proxy
       * @author http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
       * @param {Number}
          */
      setCaretPosition: function (pos) {
        var el = priv.editProxy[0];
        if (el.setSelectionRange) {
          el.focus();
          el.setSelectionRange(pos, pos);
        }
        else if (el.createTextRange) {
          var range = el.createTextRange();
          range.collapse(true);
          range.moveEnd('character', pos);
          range.moveStart('character', pos);
          range.select();
        }
      },

      /**
       * Shows text input in grid cell
       * @param {Boolean} useOriginalValue
       * @param {String} suffix
       */
      beginEditing: function (useOriginalValue, suffix) {
        if (priv.isCellEdited) {
          return;
        }

        var td = grid.getCellAtCoords(priv.selStart),
            $td = $(td);

        if (!grid.isCellWritable($td)) {
          return;
        }

        if (priv.fillHandle) {
          autofill.hideHandle();
        }

        priv.isCellEdited = true;
        lastChange = '';

        if (useOriginalValue) {
          var original = datamap.get(priv.selStart.row, priv.selStart.col) + (suffix || '');
          priv.editProxy.val(original);
          editproxy.setCaretPosition(original.length);
        }
        else {
          priv.editProxy.val('');
        }

        var width, height;
        if (priv.editProxy.autoResize) {
          width = $td.width();
          height = $td.outerHeight() - 4;
        }
        else {
          width = $td.width() * 1.5;
          height = $td.height();
        }

        if (parseInt($td.css('border-top-width')) > 0) {
          height -= 1;
        }
        if (parseInt($td.css('border-left-width')) > 0) {
          if (self.blockedCols.count() > 0) {
            width -= 1;
          }
        }

        if (priv.editProxy.autoResize) {
          priv.editProxy.autoResize({
            maxHeight: 200,
            minHeight: height,
            minWidth: width,
            maxWidth: Math.max(168, width),
            animate: false,
            extraSpace: 0
          });
        }
        else {
          priv.editProxy.css({
            width: width,
            height: height
          });
        }
        priv.editProxyHolder.removeClass('htHidden');
        priv.editProxyHolder.css({
          overflow: 'visible'
        });
      },

      /**
       * Finishes text input in selected cells
       * @param {Boolean} [isCancelled] If TRUE, restore old value instead of using current from editproxy
       * @param {Number} [moveRow] Move selection row if edit is not cancelled
       * @param {Number} [moveCol] Move selection column if edit is not cancelled
       * @param {Boolean} [ctrlDown] If true, apply to all selected cells
       */
      finishEditing: function (isCancelled, moveRow, moveCol, ctrlDown) {
        if (priv.isCellEdited) {
          priv.isCellEdited = false;
          var val = [
            [$.trim(priv.editProxy.val())]
          ];
          if (!isCancelled) {
            var endTd;
            if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
              var corners = grid.getCornerCoords([priv.selStart, priv.selEnd]);
              endTd = grid.populateFromArray(corners.TL, val, corners.BR, false, 'edit');
            }
            else {
              endTd = grid.populateFromArray(priv.selStart, val, null, false, 'edit');
            }
          }

          priv.editProxy.css({
            width: 0,
            height: 0
          });
          priv.editProxyHolder.addClass('htHidden');
          priv.editProxyHolder.css({
            overflow: 'hidden'
          });

          if (isAutoComplete() && isAutoComplete().shown) {
            isAutoComplete().hide();
          }
        }
        if (endTd && typeof moveRow !== "undefined" && typeof moveCol !== "undefined") {
          selection.transformStart(moveRow, moveCol, !priv.settings.enterBeginsEditing);
        }
      }
    };

    interaction = {
      onMouseDown: function (event) {
        priv.isMouseDown = true;
        if (event.button === 2 && selection.inInSelection(grid.getCellCoords(this))) { //right mouse button
          //do nothing
        }
        else if (event.shiftKey) {
          selection.setRangeEnd(this);
        }
        else {
          selection.setRangeStart(this);
        }
      },

      onMouseOver: function () {
        if (priv.isMouseDown) {
          selection.setRangeEnd(this);
        }
        else if (priv.fillHandle && priv.fillHandle.isDragged) {
          priv.fillHandle.isDragged++;
          autofill.showBorder(this);
        }
      },

      onDblClick: function () {
        priv.editProxy[0].focus();
        editproxy.beginEditing(true);
        if (priv.settings.autoComplete) {
          priv.editProxy.data('typeahead').lookup();
        }
      },

      onMouseWheel: function (event, delta, deltaX, deltaY) {
        if (priv.virtualScroll) {
          if (deltaY) {
            priv.virtualScroll.scrollTop(priv.virtualScroll.scrollTop() + 44 * -deltaY);
          }
          else if (deltaX) {
            priv.virtualScroll.scrollLeft(priv.virtualScroll.scrollLeft() + 100 * deltaX);
          }
          event.preventDefault();
        }
      }
    };

    this.init = function () {
      function onMouseEnterTable() {
        priv.isMouseOverTable = true;
      }

      function onMouseLeaveTable() {
        priv.isMouseOverTable = false;
      }

      self.curScrollTop = self.curScrollLeft = 0;
      self.lastScrollTop = self.lastScrollLeft = null;
      priv.scrollbarSize = measureScrollbar();

      var div = $('<div><table cellspacing="0" cellpadding="0"><thead></thead><tbody></tbody></table></div>');
      priv.tableContainer = div[0];
      self.table = $(priv.tableContainer.firstChild);
      priv.tableBody = self.table.find("tbody")[0];
      self.table.on('mousedown', 'td', interaction.onMouseDown);
      self.table.on('mouseover', 'td', interaction.onMouseOver);
      self.table.on('dblclick', 'td', interaction.onDblClick);
      self.table.on('mousewheel', 'td', interaction.onMouseWheel);
      container.append(div);

      self.colCount = settings.cols;
      self.rowCount = 0;

      highlight.init();
      priv.currentBorder = new Border(container, {
        className: 'current',
        bg: true
      });
      editproxy.init();

      this.updateSettings(settings);

      container.on('mouseenter', onMouseEnterTable).on('mouseleave', onMouseLeaveTable);
      $(priv.currentBorder.main).on('dblclick', interaction.onDblClick);

      function onMouseUp() {
        if (priv.isMouseDown) {
          setTimeout(editproxy.focus, 1);
        }
        priv.isMouseDown = false;
        if (priv.fillHandle && priv.fillHandle.isDragged) {
          if (priv.fillHandle.isDragged > 1) {
            autofill.apply();
          }
          priv.fillHandle.isDragged = 0;
        }
      }

      function onOutsideClick(event) {
        if (priv.settings.outsideClickDeselects) {
          setTimeout(function () {//do async so all mouseenter, mouseleave events will fire before
            if (!priv.isMouseOverTable && event.target !== priv.tableContainer && $(event.target).attr('id') !== 'context-menu-layer') { //if clicked outside the table or directly at container which also means outside
              selection.deselect();
            }
          }, 1);
        }
      }

      $("html").on('mouseup', onMouseUp);
      $("html").on('click', onOutsideClick);

      if (container[0].tagName.toLowerCase() !== "html" && container[0].tagName.toLowerCase() !== "body" && (container.css('overflow') === 'scroll' || container.css('overflow') === 'auto')) {
        priv.scrollable = container;
      }

      if (priv.scrollable) {
        //create fake scrolling div
        priv.virtualScroll = $('<div class="virtualScroll"><div class="spacer"></div></div>');
        priv.scrollable = priv.virtualScroll;
        this.container.before(priv.virtualScroll);
        container[0].style.overflow = 'hidden';
        self.table[0].style.position = 'absolute';
        priv.virtualScroll.css({
          width: this.container.width() + 'px',
          height: this.container.height() + 'px',
          overflow: 'scroll'
        });
        this.container.css({
          position: 'absolute',
          top: priv.virtualScroll.position().top + 'px',
          left: priv.virtualScroll.position().left + 'px'
        });
        this.container.width(priv.virtualScroll.innerWidth() - priv.scrollbarSize.width);
        this.container.height(priv.virtualScroll.innerHeight() - priv.scrollbarSize.height);
        setInterval(function () {
          priv.virtualScroll.find('.spacer').height(self.table.height());
          priv.virtualScroll.find('.spacer').width(self.table.width());
        }, 100);

        priv.scrollable.scrollTop(0);
        priv.scrollable.scrollLeft(0);

        priv.scrollable.on('scroll.handsontable', function () {
          self.curScrollTop = priv.scrollable[0].scrollTop;
          self.curScrollLeft = priv.scrollable[0].scrollLeft;

          if (self.curScrollTop !== self.lastScrollTop) {
            self.blockedRows.refreshBorders();
            self.blockedCols.main[0].style.top = -self.curScrollTop + 'px';
            self.table[0].style.top = -self.curScrollTop + 'px';
          }

          if (self.curScrollLeft !== self.lastScrollLeft) {
            self.blockedCols.refreshBorders();
            self.blockedRows.main[0].style.left = -self.curScrollLeft + 'px';
            self.table[0].style.left = -self.curScrollLeft + 'px';
          }

          if (self.curScrollTop !== self.lastScrollTop || self.curScrollLeft !== self.lastScrollLeft) {
            selection.refreshBorders();

            if (priv.cornerHeader) {
              if (self.curScrollTop === 0 && self.curScrollLeft === 0) {
                priv.cornerHeader.find("th:last-child").css({borderRightWidth: 0});
                priv.cornerHeader.find("tr:last-child th").css({borderBottomWidth: 0});
              }
              else if (self.lastScrollTop === 0 && self.lastScrollLeft === 0) {
                priv.cornerHeader.find("th:last-child").css({borderRightWidth: '1px'});
                priv.cornerHeader.find("tr:last-child th").css({borderBottomWidth: '1px'});
              }
            }
          }

          self.lastScrollTop = self.curScrollTop;
          self.lastScrollLeft = self.curScrollLeft;

          editproxy.finishEditing();
        });
        priv.scrollable.trigger('scroll.handsontable');
      }
      else {
        priv.scrollable = $(window);
        if (priv.cornerHeader) {
          priv.cornerHeader.find("th:last-child").css({borderRightWidth: 0});
          priv.cornerHeader.find("tr:last-child th").css({borderBottomWidth: 0});
        }
      }

      priv.scrollable.on('scroll', function (e) {
        e.stopPropagation();
      });

      if (priv.settings.contextMenu) {
        var onContextClick = function (key) {
          var coords = grid.getCornerCoords([priv.selStart, priv.selEnd]);

          switch (key) {
            case "row_above":
              grid.alter("insert_row", coords.TL);
              break;

            case "row_below":
              grid.alter("insert_row", {row: coords.BR.row + 1, col: 0});
              break;

            case "col_left":
              grid.alter("insert_col", coords.TL);
              break;

            case "col_right":
              grid.alter("insert_col", {row: 0, col: coords.BR.col + 1});
              break;

            case "remove_row":
            case "remove_col":
              grid.alter(key, coords.TL, coords.BR);
              break;

            case "undo":
            case "redo":
              priv.undoRedo[key]();
              break;
          }
        };

        var isDisabled = function (key) {
          if (self.blockedCols.main.find('th.htRowHeader.active').length && (key === "remove_col" || key === "col_left" || key === "col_right")) {
            return true;
          }

          if (self.blockedRows.main.find('th.htColHeader.active').length && (key === "remove_row" || key === "row_above" || key === "row_below")) {
            return true;
          }

          if (priv.selStart) {
            var coords = grid.getCornerCoords([priv.selStart, priv.selEnd]);
            if (((key === "row_above" || key === "remove_row") && coords.TL.row === 0) || ((key === "col_left" || key === "remove_col") && coords.TL.col === 0)) {
              if ($(grid.getCellAtCoords(coords.TL)).data("readOnly")) {
                return true;
              }
            }
            return false;
          }

          return true;
        };

        var allItems = {
          "undo": {name: "Undo", disabled: function () {
            return priv.undoRedo ? !priv.undoRedo.isUndoAvailable() : true
          }},
          "redo": {name: "Redo", disabled: function () {
            return priv.undoRedo ? !priv.undoRedo.isRedoAvailable() : true
          }},
          "sep1": "---------",
          "row_above": {name: "Insert row above", disabled: isDisabled},
          "row_below": {name: "Insert row below", disabled: isDisabled},
          "sep2": "---------",
          "col_left": {name: "Insert column on the left", disabled: isDisabled},
          "col_right": {name: "Insert column on the right", disabled: isDisabled},
          "sep3": "---------",
          "remove_row": {name: "Remove row", disabled: isDisabled},
          "remove_col": {name: "Remove column", disabled: isDisabled}
        };

        if (priv.settings.contextMenu === true) { //contextMenu is true, not an array
          priv.settings.contextMenu = ["row_above", "row_below", "sep2", "col_left", "col_right", "sep3", "remove_row", "remove_col"]; //use default fields array
        }

        var items = {};
        for (var i = 0, ilen = priv.settings.contextMenu.length; i < ilen; i++) {
          items[priv.settings.contextMenu[i]] = allItems[priv.settings.contextMenu[i]];
        }

        $.contextMenu({
          selector: container.attr('id') ? ("#" + container.attr('id')) : "." + container[0].className.replace(/[\s]+/g, '.'),
          trigger: 'right',
          callback: onContextClick,
          items: items
        });

        $('.context-menu-root').on('mouseenter', onMouseEnterTable).on('mouseleave', onMouseLeaveTable);
      }

      self.container.on("beforedatachange.handsontable", function (event, changes) {
        if (priv.settings.autoComplete) { //validate strict autocompletes
          var typeahead = priv.editProxy.data('typeahead');
          loop : for (var c = 0, clen = changes.length; c < clen; c++) {
            for (var a = 0, alen = priv.settings.autoComplete.length; a < alen; a++) {
              var autoComplete = priv.settings.autoComplete[a];
              var source = autoComplete.source();
              if (autoComplete.match(changes[c][0], changes[c][1], datamap.getAll)) {
                var lowercaseVal = changes[c][3].toLowerCase();
                for (var s = 0, slen = source.length; s < slen; s++) {
                  if (changes[c][3] === source[s]) {
                    continue loop; //perfect match
                  }
                  else if (lowercaseVal === source[s].toLowerCase()) {
                    changes[c][3] = source[s]; //good match, fix the case
                    continue loop;
                  }
                }
                if (autoComplete.strict) {
                  changes[c][3] = false; //no match, invalidate this change
                }
              }
            }
          }
        }

        if (priv.settings.onBeforeChange) {
          var result = priv.settings.onBeforeChange(changes);
          if (result === false) {
            changes.splice(0, changes.length); //invalidate all changes (remove everything from array)
          }
        }
      });
      self.container.on("datachange.handsontable", function (event, changes, source) {
        if (priv.settings.onChange) {
          priv.settings.onChange(changes, source);
        }
      });
    };

    /**
     * Set data at given cell
     * @public
     * @param {Number|Array} row or array of changes in format [[row, col, value, allowHtml], ...]
     * @param {Number} col
     * @param {String} value
     * @param {Boolean} allowHtml
     * @param {String} [source='edit'] String that identifies how this change will be described in changes array (useful in onChange callback)
     */
    this.setDataAtCell = function (row, col, value, allowHtml, source) {
      var refreshRows = false, refreshCols = false, changes, i, ilen;

      if (typeof row === "object") { //is stringish
        changes = row;
      }
      else if (typeof value === "object") { //backwards compatibility
        changes = value;
      }
      else {
        changes = [
          [row, col, value, allowHtml]
        ];
      }

      for (i = 0, ilen = changes.length; i < ilen; i++) {
        changes[i].splice(2, 0, datamap.get(changes[i][0], changes[i][1])); //add old value at index 2
      }

      self.container.triggerHandler("beforedatachange.handsontable", [changes]);

      for (i = 0, ilen = changes.length; i < ilen; i++) {
        if (changes[i][3] === false) {
          continue;
        }

        row = changes[i][0];
        col = changes[i][1];
        value = changes[i][3];
        allowHtml = changes[i][4] || allowHtml;

        if (priv.settings.minSpareRows) {
          while (row > self.rowCount - 1) {
            datamap.createRow();
            grid.createRow();
            refreshRows = true;
          }
        }
        if (priv.settings.minSpareCols) {
          while (col > self.colCount - 1) {
            datamap.createCol();
            grid.createCol();
            refreshCols = true;
          }
        }

        var td = grid.getCellAtCoords({row: row, col: col});
        switch (typeof value) {
          case 'string':
            break;

          case 'number':
            value += '';
            break;

          default:
            value = '';
        }
        if (!allowHtml) {
          value = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape html special chars
        }
        td.innerHTML = value.replace(/\n/g, '<br/>');
        self.minWidthFix(td);
        datamap.set(row, col, value);
        grid.updateLegend({row: row, col: col});
      }
      if (refreshRows) {
        self.blockedCols.refresh();
      }
      if (refreshCols) {
        self.blockedRows.refresh();
      }
      var recreated = grid.keepEmptyRows();
      if (!recreated) {
        selection.refreshBorders();
      }
      setTimeout(function () {
        if (!refreshRows) {
          self.blockedRows.dimensions(changes);
        }
        if (!refreshCols) {
          self.blockedCols.dimensions(changes);
        }
      }, 10);
      if (changes.length) {
        self.container.triggerHandler("datachange.handsontable", [changes, source || 'edit']);
      }
      return td;
    };

    /**
     * Returns current selection. Returns undefined if there is no selection.
     * @public
     * @return {Array} [topLeftRow, topLeftCol, bottomRightRow, bottomRightCol]
     */
    this.getSelected = function () { //https://github.com/warpech/jquery-handsontable/issues/44  //cjl
      if (selection.isSelected()) {
        var coords = grid.getCornerCoords([priv.selStart, priv.selEnd]);
        return [coords.TL.row, coords.TL.col, coords.BR.row, coords.BR.col];
      }
    };

    /**
     * Load data from array
     * @public
     * @param {Array} data
     * @param {Boolean} [allowHtml]
     */
    this.loadData = function (data, allowHtml) {
      priv.isPopulated = false;
      datamap.clear();
      grid.clear();
      grid.populateFromArray({
        row: 0,
        col: 0
      }, data, null, allowHtml, 'loadData');
      priv.isPopulated = true;
      self.clearUndo();
    };

    /**
     * Return 2-dimensional array with all grid data as copy (preferred but slower than `getDataReference`). Optionally you can provide cell range `r`, `c`, `r2`, `c2` to get only a fragment of grid data
     * @public
     * @param {Number} r (Optional) From row
     * @param {Number} c (Optional) From col
     * @param {Number} r2 (Optional) To row
     * @param {Number} c2 (Optional) To col
     * @return {Array}
     */
    this.getData = function (r, c, r2, c2) {
      return $.extend(true, [], self.getDataReference.apply(self, arguments));
    };

    /**
     * Return 2-dimensional array with all grid data as reference (faster than `getData` but can mess up - use it only for reading data). Optionally you can provide cell range `r`, `c`, `r2`, `c2` to extract only a fragment of grid
     * @public
     * @param {Number} r (Optional) From row
     * @param {Number} c (Optional) From col
     * @param {Number} r2 (Optional) To row
     * @param {Number} c2 (Optional) To col
     * @return {Array}
     */
    this.getDataReference = function (r, c, r2, c2) {
      if (typeof r === 'undefined') {
        return datamap.getAll();
      }
      else {
        return datamap.getRange({row: r, col: c}, {row: r2, col: c2});
      }
    };

    /**
     * Refreshes the legend for a cell, row, col, or entire table
     * @public
     * @param {Number} [row] - Optional to update a single row
     * @param {Number} [col] - Optional to update a single col
     */
    this.refreshLegend = function (row, col) {
      var rowLen, colLen, x, xLen, y, yLen;
      if (typeof row !== "undefined" && row !== null) {
        rowLen = row + 1;
      } else {
        row = 0;
        rowLen = self.rowCount;
      }
      if (typeof col !== "undefined" && col !== null) {
        colLen = col + 1;
      } else {
        col = 0;
        colLen = self.colCount;
      }
      for (x = row, xLen = rowLen; x < xLen; x += 1) {
        for (y = col, yLen = colLen; y < yLen; y += 1) {
          grid.updateLegend({row: x, col: y});
        }
      }
      priv.legendDirty = false;
    };

    /**
     * Update settings
     * @public
     */
    this.updateSettings = function (settings) {
      var i, j;

      if (typeof settings.fillHandle !== "undefined") {
        if (priv.fillHandle && settings.fillHandle === false) {
          autofill.disable();
        }
        else if (!priv.fillHandle && settings.fillHandle !== false) {
          autofill.init();
        }
      }

      if (typeof settings.undo !== "undefined") {
        if (priv.undoRedo && settings.undo === false) {
          priv.undoRedo = null;
        }
        else if (!priv.undoRedo && settings.undo === true) {
          priv.undoRedo = new Handsontable.UndoRedo(self);
        }
      }

      if (!self.blockedCols) {
        self.blockedCols = new Handsontable.BlockedCols(self);
        self.blockedRows = new Handsontable.BlockedRows(self);
      }

      if (typeof settings.legend !== "undefined") {
        priv.legendDirty = true;
      }

      for (i in settings) {
        if (settings.hasOwnProperty(i)) {
          priv.settings[i] = settings[i];

          //launch extensions
          if (Handsontable.extension[i]) {
            priv.extensions[i] = new Handsontable.extension[i](self, settings[i]);
          }
        }
      }

      if (typeof settings.colHeaders !== "undefined") {
        if (settings.colHeaders === false && priv.extensions["ColHeader"]) {
          priv.extensions["ColHeader"].destroy();
        }
        else if(settings.colHeaders !== false) {
          priv.extensions["ColHeader"] = new Handsontable.ColHeader(self, settings.colHeaders);
        }
      }

      if (typeof settings.rowHeaders !== "undefined") {
        if (settings.rowHeaders === false && priv.extensions["RowHeader"]) {
          priv.extensions["RowHeader"].destroy();
        }
        else if(settings.rowHeaders !== false) {
          priv.extensions["RowHeader"] = new Handsontable.RowHeader(self, settings.rowHeaders);
        }
      }

      var blockedRowsCount = self.blockedRows.count();
      var blockedColsCount = self.blockedCols.count();
      if (blockedRowsCount && blockedColsCount && (typeof settings.rowHeaders !== "undefined" || typeof settings.colHeaders !== "undefined")) {
        if (priv.cornerHeader) {
          priv.cornerHeader.remove();
          priv.cornerHeader = null;
        }

        var position = self.table.position();
        self.positionFix(position);

        var div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.top = position.top + 'px';
        div.style.left = position.left + 'px';

        var table = document.createElement('table');
        table.cellPadding = 0;
        table.cellSpacing = 0;
        div.appendChild(table);

        var thead = document.createElement('thead');
        table.appendChild(thead);

        var tr, th;
        for (i = 0; i < blockedRowsCount; i++) {
          tr = document.createElement('tr');
          for (j = blockedColsCount - 1; j >= 0; j--) {
            th = document.createElement('th');
            th.className = self.blockedCols.headers[j].className;
            th.innerHTML = self.blockedCols.headerText('&nbsp;');
            self.minWidthFix(th);
            tr.appendChild(th);
          }
          thead.appendChild(tr);
        }
        priv.cornerHeader = $(div);
        priv.cornerHeader.on('click', function () {
          selection.selectAll();
        });
        container.append(priv.cornerHeader);
      }
      else {
        if (priv.cornerHeader) {
          priv.cornerHeader.remove();
          priv.cornerHeader = null;
        }
      }

      self.blockedCols.update();
      self.blockedRows.update();

      var recreated = grid.keepEmptyRows();
      if (!recreated) {
        selection.refreshBorders();
      }

      if (priv.isPopulated && priv.legendDirty) {
        self.refreshLegend();
      }
    };

    /**
     * Clears grid
     * @public
     */
    this.clear = function () {
      selection.selectAll();
      selection.empty();
    };

    /**
     * Clears undo history
     * @public
     */
    this.clearUndo = function () {
      priv.undoRedo && priv.undoRedo.clear();
    };

    /**
     * Alters the grid
     * @param {String} action See grid.alter for possible values
     * @param {Number} from
     * @param {Number} [to] Optional. Used only for actions "remove_row" and "remove_col"
     * @public
     */
    this.alter = function (action, from, to) {
      if (typeof to === "undefined") {
        to = from;
      }
      switch (action) {
        case "insert_row":
        case "remove_row":
          grid.alter(action, {row: from, col: 0}, {row: to, col: 0});
          break;

        case "insert_col":
        case "remove_col":
          grid.alter(action, {row: 0, col: from}, {row: 0, col: to});
          break;

        default:
          throw Error('There is no such action "' + action + '"');
          break;
      }
    };

    /**
     * Returns <td> element corresponding to params row, col
     * @param {Number} row
     * @param {Number} col
     * @public
     * @return {Element}
     */
    this.getCell = function (row, col) {
      return grid.getCellAtCoords({row: row, col: col});
    };

    /**
     * Return copy of cell value at `row`, `col`
     * @param {Number} row
     * @param {Number} col
     * @public
     * @return {string}
     */
    this.getDataAtCell = function (row, col) {
      return datamap.get(row, col) + '';
    };

    /**
     * Returns cell meta data object corresponding to params row, col
     * @param {Number} row
     * @param {Number} col
     * @public
     * @return {Object}
     */
    this.getCellMeta = function (row, col) {
      return {
        isWritable: grid.isCellWritable($(grid.getCellAtCoords({row: row, col: col})))
      }
    };

    /**
     * Sets cell to be readonly
     * @param {Number} row
     * @param {Number} col
     * @public
     */
    this.setCellReadOnly = function (row, col) {
      $(grid.getCellAtCoords({row: row, col: col})).data("readOnly", true);
    };

    /**
     * Sets cell to be editable (removes readonly)
     * @param {Number} row
     * @param {Number} col
     * @public
     */
    this.setCellEditable = function (row, col) {
      $(grid.getCellAtCoords({row: row, col: col})).data("readOnly", false);
    };

    /**
     * Returns headers (if they are enabled)
     * @param {Object} obj Instance of rowHeader or colHeader
     * @param {Number} count Number of rows or cols
     * @param {Number} index (Optional) Will return only header at given index
     * @return {Array|String}
     */
    var getHeaderText = function (obj, count, index) {
      if (obj) {
        if (typeof index !== 'undefined') {
          return obj.columnLabel(index);
        }
        else {
          var headers = [];
          for (var i = 0; i < count; i++) {
            headers.push(obj.columnLabel(i));
          }
          return headers;
        }
      }
    };

    /**
     * Return array of row headers (if they are enabled). If param `row` given, return header at given row as string
     * @param {Number} row (Optional)
     * @return {Array|String}
     */
    this.getRowHeader = function (row) {
      return getHeaderText(self.rowHeader, self.rowCount, row);
    };

    /**
     * Return array of col headers (if they are enabled). If param `col` given, return header at given col as string
     * @param {Number} col (Optional)
     * @return {Array|String}
     */
    this.getColHeader = function (col) {
      return getHeaderText(self.colHeader, self.colCount, col);
    };

    /**
     * Selects cell on grid. Optionally selects range to another cell
     * @param {Number} row
     * @param {Number} col
     * @param {Number} [endRow]
     * @param {Number} [endCol]
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to the selection
     * @public
     */
    this.selectCell = function (row, col, endRow, endCol, scrollToCell) {
      selection.start({row: row, col: col});
      if (typeof endRow === "undefined") {
        selection.setRangeEnd(self.getCell(row, col), scrollToCell);
      }
      else {
        selection.setRangeEnd(self.getCell(endRow, endCol), scrollToCell);
      }
    };

    /**
     * Deselects current sell selection on grid
     * @public
     */
    this.deselectCell = function () {
      selection.deselect();
    };

    /**
     * Create DOM elements for selection border lines (top, right, bottom, left) and optionally background
     * @constructor
     * @param {jQuery} $container jQuery DOM element of handsontable container
     * @param {Object} options Configurable options
     * @param {Boolean} [options.bg] Should include a background
     * @param {String} [options.className] CSS class for border elements
     */
    function Border($container, options) {
      this.$container = $container;
      var container = this.$container[0];

      if (options.bg) {
        this.bg = document.createElement("div");
        this.bg.className = 'htBorderBg ' + options.className;
        container.insertBefore(this.bg, container.firstChild);
      }

      this.main = document.createElement("div");
      this.main.style.position = 'absolute';
      this.main.style.top = 0;
      this.main.style.left = 0;
      this.main.innerHTML = (new Array(5)).join('<div class="htBorder ' + options.className + '"></div>');
      this.disappear();
      container.appendChild(this.main);

      var nodes = this.main.childNodes;
      this.top = nodes[0];
      this.left = nodes[1];
      this.bottom = nodes[2];
      this.right = nodes[3];

      this.borderWidth = $(this.left).width();
    }

    Border.prototype = {
      /**
       * Show border around one or many cells
       * @param {Object[]} coordsArr
       */
      appear: function (coordsArr) {
        var $from, $to, fromOffset, toOffset, containerOffset, top, minTop, left, minLeft, height, width;
        if (this.disabled) {
          return;
        }

        this.corners = grid.getCornerCoords(coordsArr);

        $from = $(grid.getCellAtCoords(this.corners.TL));
        $to = (coordsArr.length > 1) ? $(grid.getCellAtCoords(this.corners.BR)) : $from;
        fromOffset = $from.offset();
        toOffset = (coordsArr.length > 1) ? $to.offset() : fromOffset;
        containerOffset = this.$container.offset();

        minTop = fromOffset.top;
        height = toOffset.top + $to.outerHeight() - minTop;
        minLeft = fromOffset.left;
        width = toOffset.left + $to.outerWidth() - minLeft;

        top = minTop - containerOffset.top + this.$container.scrollTop() - 1;
        left = minLeft - containerOffset.left + this.$container.scrollLeft() - 1;

        if (parseInt($from.css('border-top-width')) > 0) {
          top += 1;
          height -= 1;
        }
        if (parseInt($from.css('border-left-width')) > 0) {
          left += 1;
          width -= 1;
        }

        if (this.bg) {
          this.bg.style.top = top + 'px';
          this.bg.style.left = left + 'px';
          this.bg.style.width = width + 'px';
          this.bg.style.height = height + 'px';
          this.bg.style.display = 'block';
        }

        this.top.style.top = top + 'px';
        this.top.style.left = left + 'px';
        this.top.style.width = width + 'px';

        this.left.style.top = top + 'px';
        this.left.style.left = left + 'px';
        this.left.style.height = height + 'px';

        var delta = Math.floor(this.borderWidth / 2);

        this.bottom.style.top = top + height - delta + 'px';
        this.bottom.style.left = left + 'px';
        this.bottom.style.width = width + 'px';

        this.right.style.top = top + 'px';
        this.right.style.left = left + width - delta + 'px';
        this.right.style.height = height + 1 + 'px';

        this.main.style.display = 'block';
      },

      /**
       * Hide border
       */
      disappear: function () {
        this.main.style.display = 'none';
        if (this.bg) {
          this.bg.style.display = 'none';
        }
        this.corners = null;
      }
    };

    /**
     * Create DOM element for drag-down handle
     * @constructor
     * @param {jQuery} $container jQuery DOM element of handsontable container
     */
    function FillHandle($container) {
      this.$container = $container;
      var container = this.$container[0];

      this.handle = document.createElement("div");
      this.handle.className = "htFillHandle";
      this.disappear();
      container.appendChild(this.handle);

      var that = this;
      $(this.handle).mousedown(function () {
        that.isDragged = 1;
      });
    }

    FillHandle.prototype = {
      /**
       * Show handle in cell corner
       * @param {Object[]} coordsArr
       */
      appear: function (coordsArr) {
        if (this.disabled) {
          return;
        }

        var $td, tdOffset, containerOffset, top, left, height, width;

        var corners = grid.getCornerCoords(coordsArr);

        $td = $(grid.getCellAtCoords(corners.BR));
        tdOffset = $td.offset();
        containerOffset = this.$container.offset();

        top = tdOffset.top - containerOffset.top + this.$container.scrollTop() - 1;
        left = tdOffset.left - containerOffset.left + this.$container.scrollLeft() - 1;
        height = $td.outerHeight();
        width = $td.outerWidth();

        this.handle.style.top = top + height - 3 + 'px';
        this.handle.style.left = left + width - 3 + 'px';
        this.handle.style.display = 'block';
      },

      /**
       * Hide handle
       */
      disappear: function () {
        this.handle.style.display = 'none';
      }
    };
  };

  var settings = {
    'rows': 5,
    'cols': 5,
    'minSpareRows': 0,
    'minSpareCols': 0,
    'minHeight': 0,
    'minWidth': 0,
    'multiSelect': true,
    'fillHandle': true,
    'undo': true,
    'outsideClickDeselects': true,
    'enterBeginsEditing': true,
    'enterMoves': {row: 1, col: 0},
    'tabMoves': {row: 0, col: 1},
    'autoWrapRow': false,
    'autoWrapCol': false
  };

  $.fn.handsontable = function (action, options) {
    var i, ilen, args, output = [];
    if (typeof action !== 'string') { //init
      options = action;
      return this.each(function () {
        var $this = $(this);
        if ($this.data("handsontable")) {
          instance = $this.data("handsontable");
          instance.updateSettings(options);
        }
        else {
          var currentSettings = $.extend({}, settings), instance;
          if (options) {
            $.extend(currentSettings, options);
          }
          instance = new Handsontable.Core($this, currentSettings);
          $this.data("handsontable", instance);
          instance.init();
        }
      });
    }
    else {
      args = [];
      if (arguments.length > 1) {
        for (i = 1, ilen = arguments.length; i < ilen; i++) {
          args.push(arguments[i]);
        }
      }
      this.each(function () {
        output = $(this).data("handsontable")[action].apply(this, args);
      });
      return output;
    }
  };
})(jQuery, window, Handsontable);

/**
 * Returns true if keyCode represents a printable character
 * @param {Number} keyCode
 * @return {Boolean}
 */
Handsontable.helper.isPrintableChar = function (keyCode) {
  return ((keyCode == 32) || //space
      (keyCode >= 48 && keyCode <= 57) || //0-9
      (keyCode >= 96 && keyCode <= 111) || //numpad
      (keyCode >= 186 && keyCode <= 192) || //;=,-./`
      (keyCode >= 219 && keyCode <= 222) || //[]{}\|"'
      keyCode >= 226 || //special chars (229 for Asian chars)
      (keyCode >= 65 && keyCode <= 90)); //a-z
};
