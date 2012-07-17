/**
 * Handsontable is a simple jQuery plugin for editable tables with basic copy-paste compatibility with Excel and Google Docs
 *
 * Copyright 2012, Marcin Warpechowski
 * Licensed under the MIT license.
 * http://warpech.github.com/jquery-handsontable/
 */
/*jslint white: true, browser: true, plusplus: true, indent: 4, maxerr: 50 */
(function ($) {
  "use strict";

  function Handsontable(container, settings) {
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
      undoRedo: settings.undo ? new handsontable.UndoRedo(this) : null,
      extensions: {}
    };

    var lastChange = '';

    function isAutoComplete() {
      return (priv.editProxy.data("typeahead") && priv.editProxy.data("typeahead").$menu.is(":visible"));
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
        var data = datamap.getRange(start, end), text = '', r, rlen, c, clen;
        for (r = 0, rlen = data.length; r < rlen; r++) {
          for (c = 0, clen = data[r].length; c < clen; c++) {
            if (c > 0) {
              text += "\t";
            }
            if (data[r][c].indexOf('\n') > -1) {
              text += '"' + data[r][c].replace(/"/g, '""') + '"';
            }
            else {
              text += data[r][c];
            }
          }
          if (r !== rlen - 1) {
            text += "\n";
          }
        }
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
            if (priv.selStart.row >= coords.row) {
              priv.selStart.row = priv.selStart.row + 1;
              selection.transformEnd(1, 0);
            }
            else {
              selection.transformEnd(0, 0); //refresh some routines, otherwise arrow movement does not work
            }
            break;

          case "insert_col":
            datamap.createCol(coords);
            grid.createCol(coords);
            self.blockedRows.refresh();
            if (priv.selStart.col >= coords.col) {
              priv.selStart.col = priv.selStart.col + 1;
              selection.transformEnd(0, 1);
            }
            else {
              selection.transformEnd(0, 0); //refresh some routines, otherwise arrow movement does not work
            }
            break;

          case "remove_row":
            datamap.removeRow(coords, toCoords);
            grid.removeRow(coords, toCoords);
            result = grid.keepEmptyRows();
            if (!result) {
              self.blockedCols.refresh();
            }
            if (priv.selStart.row > coords.row) {
              priv.selStart.row = priv.selStart.row - (toCoords.row - coords.row + 1);
            }
            if (priv.selEnd.row > coords.row) {
              selection.transformEnd(-(toCoords.row - coords.row + 1), 0);
            }
            else {
              selection.transformEnd(0, 0);
            }
            break;

          case "remove_col":
            datamap.removeCol(coords, toCoords);
            grid.removeCol(coords, toCoords);
            result = grid.keepEmptyRows();
            if (!result) {
              self.blockedRows.refresh();
            }
            if (priv.selStart.col > coords.col) {
              priv.selStart.col = priv.selStart.col - (toCoords.col - coords.col + 1);
            }
            if (priv.selEnd.col > coords.col) {
              selection.transformEnd(0, -(toCoords.col - coords.col + 1));
            }
            else {
              selection.transformEnd(0, 0);
            }
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
        }
        if (priv.settings.legend) {
          for (var j = 0, jlen = priv.settings.legend.length; j < jlen; j++) {
            var legend = priv.settings.legend[j];
            if (legend.match(coords.row, coords.col, datamap.getAll)) {
              priv.hasLegend = true;
              typeof legend.style !== "undefined" && $td.css(legend.style);
              typeof legend.readOnly !== "undefined" && $td.data("readOnly", legend.readOnly);
              typeof legend.title !== "undefined" && $td.attr("title", legend.title);
              typeof legend.className !== "undefined" && $td.addClass(legend.className);
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
       * @return {Object} ending td in pasted area
       */
      populateFromArray: function (start, input, end, allowHtml, source) {
        var r, rlen, c, clen, td, endTd, changes = [], current = {};
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
              changes.push([current.row, current.col, datamap.get(current.row, current.col), input[r][c]]);
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
        if (priv.settings.onBeforeChange && changes.length) {
          var result = priv.settings.onBeforeChange(changes);
          if (result === false) {
            return grid.getCellAtCoords(start);
          }
        }
        var setData = [];
        for (var i = 0, ilen = changes.length; i < ilen; i++) {
          if (end && (changes[i][0] > end.row || changes[i][1] > end.col)) {
            continue;
          }
          if (changes[i][3] === false) {
            continue;
          }
          setData.push([changes[i][0], changes[i][1], changes[i][3]]);
        }
        endTd = self.setDataAtCell(0, 0, setData, allowHtml);
        if (changes.length) {
          self.container.triggerHandler("datachange.handsontable", [changes, source || 'populateFromArray']);
        }
        return endTd || grid.getCellAtCoords(start);
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
        if (force && priv.selStart.row + rowDelta > self.rowCount - 1) {
          self.alter("insert_row", self.rowCount);
        }
        if (force && priv.selStart.col + colDelta > self.colCount - 1) {
          self.alter("insert_col", self.colCount);
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
        var td = grid.getCellAtCoords({
          row: (priv.selEnd.row + rowDelta),
          col: priv.selEnd.col + colDelta
        });
        if (td) {
          selection.setRangeEnd(td);
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
        var scrollWidth = priv.scrollable.outerWidth() - 24; //24 = scrollbar
        var scrollHeight = priv.scrollable.outerHeight() - 24; //24 = scrollbar
        var scrollOffset = priv.scrollable.offset();

        var rowHeaderWidth = self.blockedCols.count() ? $(self.blockedCols.main[0].firstChild).outerWidth() : 2;
        var colHeaderHeight = self.blockedRows.count() ? $(self.blockedRows.main[0].firstChild).outerHeight() : 2;

        var offsetTop = tdOffset.top;
        var offsetLeft = tdOffset.left;
        if (scrollOffset) { //if is not the window
          offsetTop += scrollTop - scrollOffset.top;
          offsetLeft += scrollLeft - scrollOffset.left;
        }

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

        if (select.TL.col > 0) {
          data = datamap.getAll();
          rows : for (r = select.BR.row + 1; r < self.rowCount; r++) {
            for (c = select.TL.col; c <= select.BR.col; c++) {
              if (data[r][c]) {
                break rows;
              }
            }
            if (!!data[r][select.TL.col - 1]) {
              maxR = r;
            }
          }
          if (maxR) {
            autofill.showBorder(grid.getCellAtCoords({row: maxR, col: select.BR.col}));
            autofill.apply();
          }
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
          priv.lastKeyCode = event.keyCode;
          if (selection.isSelected()) {
            var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
            if ((event.keyCode == 32) || //space
                (event.keyCode >= 48 && event.keyCode <= 57) || //0-9
                (event.keyCode >= 96 && event.keyCode <= 111) || //numpad
                (event.keyCode >= 186 && event.keyCode <= 192) || //;=,-./`
                (event.keyCode >= 219 && event.keyCode <= 222) || //[]{}\|"'
                event.keyCode >= 226 || //special chars (229 for Asian chars)
                (event.keyCode >= 65 && event.keyCode <= 90)) { //a-z
              /* alphanumeric */
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
                  if (priv.undoRedo) {
                    priv.undoRedo.redo();
                  }
                }
                else if (event.keyCode === 90) { //CTRL + Z
                  if (priv.undoRedo) {
                    priv.undoRedo.undo();
                  }
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
                if (!isAutoComplete()) {
                  if (event.shiftKey) {
                    editproxy.finishEditing(false, 0, -1);
                  }
                  else {
                    editproxy.finishEditing(false, 0, 1);
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
                if (priv.isCellEdited) {
                  if ((event.ctrlKey && !selection.isMultiple()) || event.altKey) { //if ctrl+enter or alt+enter, add new line
                    priv.editProxy.val(priv.editProxy.val() + '\n');
                    priv.editProxy[0].focus();
                  }
                  else if (!isAutoComplete()) {
                    if (event.shiftKey) { //if shift+enter, finish and move up
                      editproxy.finishEditing(false, -1, 0, ctrlDown);
                    }
                    else { //if enter, finish and move down
                      editproxy.finishEditing(false, 1, 0, ctrlDown);
                    }
                  }
                }
                else {
                  if (event.shiftKey) {
                    selection.transformStart(-1, 0); //move selection up
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
                      selection.transformStart(1, 0, (!priv.settings.enterBeginsEditing && priv.settings.minSpareRows > 0)); //move selection down
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

        function onKeyUp(event) {
          if (priv.stopNextPropagation) {
            event.stopImmediatePropagation();
            priv.stopNextPropagation = false;
          }
        }

        function onChange() {
          if (isAutoComplete()) { //could this change be from autocomplete
            var val = priv.editProxy.val();
            if (val !== lastChange && val === priv.lastAutoComplete) { //is it change from source (don't trigger on partial)
              priv.isCellEdited = true;
              if (priv.lastKeyCode === 9) { //tab
                editproxy.finishEditing(false, 0, 1);
              }
              else { //return/enter
                editproxy.finishEditing(false, 1, 0);
              }
            }
            lastChange = val;
          }
        }

        priv.editProxy.on('click', onClick);
        priv.editProxy.on('cut', onCut);
        priv.editProxy.on('paste', onPaste);
        priv.editProxy.on('keydown', onKeyDown);
        priv.editProxy.on('keyup', onKeyUp);
        priv.editProxy.on('change', onChange);
        container.append(priv.editProxyHolder);
      },

      /**
       * Prepare text input to be displayed at given grid cell
       */
      prepare: function () {
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
              typeahead.source = priv.settings.autoComplete[i].source();
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
          //console.log("hwhw", height, width, priv.editProxy.autoResize('check'), '->', priv.editProxy.data('AutoResizer').check());
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

        priv.stopNextPropagation = true;
        if (priv.settings.autoComplete) {
          setTimeout(function () {
            priv.editProxy.data('typeahead').lookup();
          }, 10);
        }
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
          var val = $.trim(priv.editProxy.val());
          var changes = [], change;
          if (ctrlDown) { //if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
            var corners = grid.getCornerCoords([priv.selStart, priv.selEnd]);
            var r, c;
            for (r = corners.TL.row; r <= corners.BR.row; r++) {
              for (c = corners.TL.col; c <= corners.BR.col; c++) {
                change = editproxy.finishEditingCells(r, c, val);
                if (change) {
                  changes.push(change);
                }
              }
            }
          }
          else {
            change = editproxy.finishEditingCells(priv.selStart.row, priv.selStart.col, val);
            if (change) {
              changes.push(change);
            }
          }

          if (changes.length) {
            self.container.triggerHandler("datachange.handsontable", [changes, 'edit']);
          }

          priv.editProxy.css({
            width: 0,
            height: 0
          });
          priv.editProxyHolder.addClass('htHidden');
          priv.editProxyHolder.css({
            overflow: 'hidden'
          });
        }
        if (typeof moveRow !== "undefined" && typeof moveCol !== "undefined") {
          if (!isCancelled) {
            selection.transformStart(moveRow, moveCol, (!priv.settings.enterBeginsEditing && ((moveRow && priv.settings.minSpareRows > 0) || (moveCol && priv.settings.minSpareCols > 0))));
          }
        }
      },

      /**
       * Finishes text input in a cell
       * @param {Number} row
       * @param {Number} col
       * @param {String} val
       * @return {Array} change
       */
      finishEditingCells: function (row, col, val) {
        var td = grid.getCellAtCoords({row: row, col: col}),
            $td = $(td),
            oldVal = datamap.get(row, col);
        if (oldVal !== val && grid.isCellWritable($td)) {
          var result;
          var change = [row, col, oldVal, val];
          if (priv.settings.onBeforeChange) {
            result = priv.settings.onBeforeChange(change);
          }
          if (result !== false && change[3] !== false) { //edit is not cancelled
            self.setDataAtCell(change[0], change[1], change[3]);
          }
        }
        return change;
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
        priv.stopNextPropagation = false;
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

      var div = $('<div><table cellspacing="0" cellpadding="0"><thead></thead><tbody></tbody></table></div>');
      priv.tableContainer = div[0];
      self.table = $(priv.tableContainer.firstChild);
      priv.tableBody = self.table.find("tbody")[0];
      self.table.on('mousedown', 'td', interaction.onMouseDown);
      self.table.on('mouseover', 'td', interaction.onMouseOver);
      self.table.on('dblclick', 'td', interaction.onDblClick);
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
        setTimeout(function () {//do async so all mouseenter, mouseleave events will fire before
          if (!priv.isMouseOverTable || event.target === priv.tableContainer) { //if clicked outside the table or directly at container which also means outside
            selection.deselect();
          }
        }, 1);
      }

      $("html").on('mouseup', onMouseUp);
      $("html").on('click', onOutsideClick);

      if (container[0].tagName.toLowerCase() !== "html" && container[0].tagName.toLowerCase() !== "body" && container.css('overflow') === 'scroll') {
        priv.scrollable = container;
      }
      else {
        container.parents().each(function () {
          if (this.tagName.toLowerCase() !== "html" && this.tagName.toLowerCase() !== "body" && $(this).css('overflow') == 'scroll') {
            priv.scrollable = $(this);
            return false;
          }
        });
      }

      if (priv.scrollable) {
        priv.scrollable.scrollTop(0);
        priv.scrollable.scrollLeft(0);

        priv.scrollable.on('scroll.handsontable', function () {
          self.curScrollTop = priv.scrollable[0].scrollTop;
          self.curScrollLeft = priv.scrollable[0].scrollLeft;

          if (self.curScrollTop !== self.lastScrollTop) {
            self.blockedRows.refreshBorders();
            self.blockedRows.main[0].style.top = self.curScrollTop + 'px';
          }

          if (self.curScrollLeft !== self.lastScrollLeft) {
            self.blockedCols.refreshBorders();
            self.blockedCols.main[0].style.left = self.curScrollLeft + 'px';
          }

          if (priv.cornerHeader && (self.curScrollTop !== self.lastScrollTop || self.curScrollLeft !== self.lastScrollLeft)) {
            if (self.curScrollTop === 0 && self.curScrollLeft === 0) {
              priv.cornerHeader.find("th:last-child").css({borderRightWidth: 0});
              priv.cornerHeader.find("tr:last-child th").css({borderBottomWidth: 0});
            }
            else if (self.lastScrollTop === 0 && self.lastScrollLeft === 0) {
              priv.cornerHeader.find("th:last-child").css({borderRightWidth: '1px'});
              priv.cornerHeader.find("tr:last-child th").css({borderBottomWidth: '1px'});
            }
            priv.cornerHeader[0].style.top = self.curScrollTop + 'px';
            priv.cornerHeader[0].style.left = self.curScrollLeft + 'px';
          }

          self.lastScrollTop = self.curScrollTop;
          self.lastScrollLeft = self.curScrollLeft;
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

      self.container.on("datachange.handsontable", function (event, changes, source) {
        if (priv.settings.onChange) {
          priv.settings.onChange(changes, source);
        }
      });
    };

    /**
     * Set data at given cell
     * @public
     * @param {Number} row
     * @param {Number} col
     * @param {String|Array} values string or array of changes in format [[row, col, value], ...]
     * @param {Boolean} [allowHtml]
     */
    this.setDataAtCell = function (row, col, values, allowHtml) {
      var refreshRows = false, refreshCols = false, escaped, value;

      if (typeof values !== "object") { //is stringish
        values = [
          [row, col, values]
        ];
      }

      for (var i = 0, ilen = values.length; i < ilen; i++) {
        row = values[i][0];
        col = values[i][1];
        value = values[i][2];

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
          escaped = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape html special chars
        }
        td.innerHTML = (escaped || value).replace(/\n/g, '<br/>');
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
      return td;
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
    };

    /**
     * Return 2-dimensional array with the current grid data
     * @public
     * @param {Boolean} [asReference=false] If TRUE, function will return direct reference to the internal data array. That is faster but should be used only to READ data (otherwise you will mess up the DOM table). To write data, you should always use method `setDataAtCell`.
     * @return {Array}
     */
    this.getData = function (asReference) {
      if (asReference === true) {
        return datamap.getAll();
      }
      else {
        return $.extend(true, [], datamap.getAll());
      }
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
        else {
          autofill.init();
        }
      }

      if (!self.blockedCols) {
        self.blockedCols = new handsontable.BlockedCols(self);
        self.blockedRows = new handsontable.BlockedRows(self);
      }

      for (i in settings) {
        if (settings.hasOwnProperty(i)) {
          priv.settings[i] = settings[i];

          //launch extensions
          if (handsontable.extension[i]) {
            priv.extensions[i] = new handsontable.extension[i](self, settings[i]);
          }
        }
      }

      if (typeof settings.colHeaders !== "undefined") {
        if (settings.colHeaders === false && priv.extensions["ColHeader"]) {
          priv.extensions["ColHeader"].destroy();
        }
        else {
          priv.extensions["ColHeader"] = new handsontable.ColHeader(self, settings.colHeaders);
        }
      }

      if (typeof settings.rowHeaders !== "undefined") {
        if (settings.rowHeaders === false && priv.extensions["RowHeader"]) {
          priv.extensions["RowHeader"].destroy();
        }
        else {
          priv.extensions["RowHeader"] = new handsontable.RowHeader(self, settings.rowHeaders);
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

        if (top < 0) {
          top = 0;
        }
        if (left < 0) {
          left = 0;
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
  }

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
    'enterBeginsEditing': true
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
          instance = new Handsontable($this, currentSettings);
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
})(jQuery);

var handsontable = {}; //class namespace
handsontable.extension = {}; //extenstion namespace
/**
 * Handsontable UndoRedo class
 */
handsontable.UndoRedo = function (instance) {
  var that = this;

  this.data = [];
  this.rev = -1;
  this.instance = instance;

  instance.container.on("datachange.handsontable", function (event, changes, origin) {
    if (origin !== 'undo' && origin !== 'redo') {
      that.add(changes);
    }
  });
};

/**
 * Undo operation from current revision
 */
handsontable.UndoRedo.prototype.undo = function () {
  var i, ilen, tmp;
  if (this.isUndoAvailable()) {
    var changes = $.extend(true, [], this.data[this.rev]); //deep clone
    this.instance.setDataAtCell(0, 0, changes);
    for (i = 0, ilen = changes.length; i < ilen; i++) {
      tmp = changes[i][3];
      changes[i][3] = changes[i][2];
      changes[i][2] = tmp;
    }
    this.instance.container.triggerHandler("datachange.handsontable", [changes, 'undo']);
    this.rev--;
  }
};

/**
 * Redo operation from current revision
 */
handsontable.UndoRedo.prototype.redo = function () {
  var i, ilen;
  if (this.isRedoAvailable()) {
    this.rev++;
    var changes = $.extend(true, [], this.data[this.rev]); //deep clone
    for (i = 0, ilen = changes.length; i < ilen; i++) {
      changes[i][2] = changes[i][3]; //we need new data at index 2
    }
    this.instance.setDataAtCell(0, 0, changes);
    this.instance.container.triggerHandler("datachange.handsontable", [this.data[this.rev], 'redo']); //we need old data at index 2 and new data at index 3
  }
};

/**
 * Returns true if undo point is available
 * @return {Boolean}
 */
handsontable.UndoRedo.prototype.isUndoAvailable = function () {
  return (this.rev > 0);
};

/**
 * Returns true if redo point is available
 * @return {Boolean}
 */
handsontable.UndoRedo.prototype.isRedoAvailable = function () {
  return (this.rev < this.data.length - 1);
};

/**
 * Add new history poins
 * @param changes
 */
handsontable.UndoRedo.prototype.add = function (changes) {
  this.rev++;
  this.data.splice(this.rev); //if we are in point abcdef(g)hijk in history, remove everything after (g)
  this.data.push(changes);
};
/**
 * Handsontable BlockedRows class
 * @param {Object} instance
 */
handsontable.BlockedRows = function (instance) {
  var that = this;
  this.instance = instance;
  this.headers = [];
  var position = instance.table.position();
  instance.positionFix(position);
  this.main = $('<div style="position: absolute; top: ' + position.top + 'px; left: ' + position.left + 'px"><table cellspacing="0" cellpadding="0"><thead></thead></table></div>');
  this.instance.container.on('datachange.handsontable', function (event, changes) {
    setTimeout(function () {
      that.dimensions(changes);
    }, 10);
  });
  this.instance.container.append(this.main);
  this.hasCSS3 = !($.browser.msie && (parseInt($.browser.version, 10) <= 8)); //Used to get over IE8- not having :last-child selector
  this.update();
};

/**
 * Returns number of blocked cols
 */
handsontable.BlockedRows.prototype.count = function () {
  return this.headers.length;
};

/**
 * Create column header in the grid table
 */
handsontable.BlockedRows.prototype.createCol = function (className) {
  var $tr, th, h, hlen = this.count();
  for (h = 0; h < hlen; h++) {
    $tr = this.main.find('thead tr.' + this.headers[h].className);
    if (!$tr.length) {
      $tr = $('<tr class="' + this.headers[h].className + '"></tr>');
      this.main.find('thead').append($tr);
    }
    $tr = this.instance.table.find('thead tr.' + this.headers[h].className);
    if (!$tr.length) {
      $tr = $('<tr class="' + this.headers[h].className + '"></tr>');
      this.instance.table.find('thead').append($tr);
    }

    th = document.createElement('th');
    th.className = this.headers[h].className;
    if (className) {
      th.className += ' ' + className;
    }
    th.innerHTML = this.headerText('&nbsp;');
    this.instance.minWidthFix(th);
    this.instance.table.find('thead tr.' + this.headers[h].className)[0].appendChild(th);

    th = document.createElement('th');
    th.className = this.headers[h].className;
    if (className) {
      th.className += ' ' + className;
    }
    this.instance.minWidthFix(th);
    this.main.find('thead tr.' + this.headers[h].className)[0].appendChild(th);
  }
};

/**
 * Create column header in the grid table
 */
handsontable.BlockedRows.prototype.create = function () {
  if (this.count() > 0) {
    this.instance.table.find('thead').empty();
    this.main.find('thead').empty();
    var offset = this.instance.blockedCols.count();
    for (c = offset - 1; c >= 0; c--) {
      this.createCol(this.instance.blockedCols.headers[c].className);
    }
    for (c = 0; c < this.instance.colCount; c++) {
      this.createCol();
    }
  }
  if (!this.hasCSS3) {
    this.instance.container.find('thead tr.lastChild').not(':last-child').removeClass('lastChild');
    this.instance.container.find('thead tr:last-child').not('.lastChild').addClass('lastChild');
  }
};

/**
 * Copy table column header onto the floating layer above the grid
 */
handsontable.BlockedRows.prototype.refresh = function () {
  if (this.count() > 0) {
    var that = this;
    var hlen = this.count(), h;
    for (h = 0; h < hlen; h++) {
      var $tr = this.main.find('thead tr.' + this.headers[h].className);
      var tr = $tr[0];
      var ths = tr.childNodes;
      var thsLen = ths.length;
      var offset = this.instance.blockedCols.count();

      while (thsLen > this.instance.colCount + offset) {
        //remove excessive cols
        thsLen--;
        $(tr.childNodes[thsLen]).remove();
      }

      for (h = 0; h < hlen; h++) {
        var realThs = this.instance.table.find('thead th.' + this.headers[h].className);
        for (var i = 0; i < thsLen; i++) {
          realThs[i].innerHTML = ths[i].innerHTML = that.headers[h].columnLabel(i - offset);
          this.instance.minWidthFix(realThs[i]);
          this.instance.minWidthFix(ths[i]);
          ths[i].style.minWidth = realThs.eq(i).width() + 'px';
        }
      }
    }

    this.ths = this.main.find('tr:last-child th');
    this.refreshBorders();
  }
};

/**
 * Refresh border width
 */
handsontable.BlockedRows.prototype.refreshBorders = function () {
  if (this.count() > 0) {
    if (this.instance.curScrollTop === 0) {
      this.ths.css('borderBottomWidth', 0);
    }
    else if (this.instance.lastScrollTop === 0) {
      this.ths.css('borderBottomWidth', '1px');
    }
  }
};

/**
 * Recalculate column widths on the floating layer above the grid
 * @param {Object} changes
 */
handsontable.BlockedRows.prototype.dimensions = function (changes) {
  if (this.count() > 0) {
    var offset = this.instance.blockedCols.count();
    for (var i = 0, ilen = changes.length; i < ilen; i++) {
      this.ths[changes[i][1] + offset].style.minWidth = $(this.instance.getCell(changes[i][0], changes[i][1])).width() + 'px';
    }
  }
};


/**
 * Update settings of the column header
 */
handsontable.BlockedRows.prototype.update = function () {
  this.create();
  this.refresh();
};

/**
 * Add column header to DOM
 */
handsontable.BlockedRows.prototype.addHeader = function (header) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === header.className) {
      delete this.headers.splice(h, 1); //if exists, remove then add to recreate
    }
  }
  this.headers.push(header);
  this.headers.sort(function (a, b) {
    return a.priority || 0 - b.priority || 0
  });
  this.update();
};

/**
 * Remove column header from DOM
 */
handsontable.BlockedRows.prototype.destroyHeader = function (className) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === className) {
      this.main.find('thead tr.' + this.headers[h].className).remove();
      this.instance.table.find('thead tr.' + this.headers[h].className).remove();
      this.headers.splice(h, 1);
    }
  }
};

/**
 * Puts string to small text template
 */
handsontable.BlockedRows.prototype.headerText = function (str) {
  return '&nbsp;<span class="small">' + str + '</span>&nbsp;';
};
/**
 * Handsontable BlockedCols class
 * @param {Object} instance
 */
handsontable.BlockedCols = function (instance) {
  var that = this;
  this.heightMethod = ($.browser.mozilla || $.browser.opera) ? "outerHeight" : "height";
  this.instance = instance;
  this.headers = [];
  var position = instance.table.position();
  instance.positionFix(position);
  this.main = $('<div style="position: absolute; top: ' + position.top + 'px; left: ' + position.left + 'px"><table cellspacing="0" cellpadding="0"><thead><tr></tr></thead><tbody></tbody></table></div>');
  this.instance.container.on('datachange.handsontable', function (event, changes) {
    setTimeout(function () {
      that.dimensions(changes);
    }, 10);
  });
  this.instance.container.append(this.main);
};

/**
 * Returns number of blocked cols
 */
handsontable.BlockedCols.prototype.count = function () {
  return this.headers.length;
};

/**
 * Create row header in the grid table
 */
handsontable.BlockedCols.prototype.createRow = function (tr) {
  var th;
  var mainTr = document.createElement('tr');

  for (var h = 0, hlen = this.count(); h < hlen; h++) {
    th = document.createElement('th');
    th.className = this.headers[h].className;
    this.instance.minWidthFix(th);
    tr.insertBefore(th, tr.firstChild);

    th = document.createElement('th');
    th.className = this.headers[h].className;
    mainTr.insertBefore(th, mainTr.firstChild);
  }

  this.main.find('tbody')[0].appendChild(mainTr);
};

/**
 * Create row header in the grid table
 */
handsontable.BlockedCols.prototype.create = function () {
  var hlen = this.count(), h, th;
  this.main.find('tbody').empty();
  this.instance.table.find('tbody th').remove();
  var $theadTr = this.main.find('thead tr');
  $theadTr.empty();

  if (hlen > 0) {
    var offset = this.instance.blockedRows.count();
    if (offset) {
      for (h = 0; h < hlen; h++) {
        th = $theadTr[0].getElementsByClassName ? $theadTr[0].getElementsByClassName(this.headers[h].className)[0] : $theadTr.find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
        if (!th) {
          th = document.createElement('th');
          th.className = this.headers[h].className;
          th.innerHTML = this.headerText('&nbsp;');
          this.instance.minWidthFix(th);
          $theadTr[0].insertBefore(th, $theadTr[0].firstChild);
        }
      }
    }

    var trs = this.instance.table.find('tbody')[0].childNodes;
    for (var r = 0; r < this.instance.rowCount; r++) {
      this.createRow(trs[r]);
    }
  }
};

/**
 * Copy table row header onto the floating layer above the grid
 */
handsontable.BlockedCols.prototype.refresh = function () {
  var hlen = this.count(), h, th, i;
  if (hlen > 0) {
    var $tbody = this.main.find('tbody');
    var tbody = $tbody[0];
    var trs = tbody.childNodes;
    var trsLen = trs.length;
    while (trsLen > this.instance.rowCount) {
      //remove excessive rows
      trsLen--;
      $(tbody.childNodes[trsLen]).remove();
    }

    var realTrs = this.instance.table.find('tbody tr');
    for (i = 0; i < trsLen; i++) {
      for (h = 0; h < hlen; h++) {
        th = trs[i].getElementsByClassName ? trs[i].getElementsByClassName(this.headers[h].className)[0] : $(trs[i]).find('.' + this.headers[h].className.replace(/\s/i, '.'))[0];
        th.innerHTML = this.headers[h].columnLabel(i);
        this.instance.minWidthFix(th);
        th.style.height = realTrs.eq(i).children().first()[this.heightMethod]() + 'px';
      }
    }

    this.ths = this.main.find('th:last-child');
    this.refreshBorders();
  }
};

/**
 * Refresh border width
 */
handsontable.BlockedCols.prototype.refreshBorders = function () {
  if (this.count() > 0) {
    if (this.instance.curScrollLeft === 0) {
      this.ths.css('borderRightWidth', 0);
    }
    else if (this.instance.lastScrollLeft === 0) {
      this.ths.css('borderRightWidth', '1px');
    }
  }
};

/**
 * Recalculate row heights on the floating layer above the grid
 * @param {Object} changes
 */
handsontable.BlockedCols.prototype.dimensions = function (changes) {
  if (this.count() > 0) {
    var trs = this.main[0].firstChild.getElementsByTagName('tbody')[0].childNodes;
    for (var i = 0, ilen = changes.length; i < ilen; i++) {
      var $th = $(this.instance.getCell(changes[i][0], changes[i][1]));
      if ($th.length) {
        trs[changes[i][0]].firstChild.style.height = $th[this.heightMethod]() + 'px';
      }
    }
  }
};

/**
 * Update settings of the row header
 */
handsontable.BlockedCols.prototype.update = handsontable.BlockedRows.prototype.update;

/**
 * Add row header to DOM
 */
handsontable.BlockedCols.prototype.addHeader = function (header) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === header.className) {
      delete this.headers.splice(h, 1); //if exists, remove then add to recreate
    }
  }
  this.headers.push(header);
  this.headers.sort(function (a, b) {
    return a.priority || 0 - b.priority || 0
  });
};

/**
 * Remove row header from DOM
 */
handsontable.BlockedCols.prototype.destroyHeader = function (className) {
  for (var h = this.count() - 1; h >= 0; h--) {
    if (this.headers[h].className === className) {
      this.headers.splice(h, 1);
    }
  }
};

/**
 * Puts string to small text template
 */
handsontable.BlockedCols.prototype.headerText = handsontable.BlockedRows.prototype.headerText;
/**
 * Handsontable RowHeader extension
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
handsontable.RowHeader = function (instance, labels) {
  var that = this;
  this.className = 'htRowHeader';
  instance.blockedCols.main.on('mousedown', 'th.htRowHeader', function (event) {
    if (!$(event.target).hasClass('btn') && !$(event.target).hasClass('btnContainer')) {
      instance.deselectCell();
      $(this).addClass('active');
      that.lastActive = this;
      var offset = instance.blockedRows.count();
      instance.selectCell(this.parentNode.rowIndex - offset, 0, this.parentNode.rowIndex - offset, instance.colCount - 1, false);
    }
  });
  instance.container.on('deselect.handsontable', function () {
    that.deselect();
  });
  this.labels = labels;
  this.instance = instance;
  instance.blockedCols.addHeader(this);
};

/**
 * Return custom row label or automatically generate one
 * @param {Number} index Row index
 * @return {String}
 */
handsontable.RowHeader.prototype.columnLabel = function (index) {
  if (this.labels[index]) {
    return this.instance.blockedRows.headerText(this.labels[index]);
  }
  return this.instance.blockedRows.headerText(index + 1);
};

/**
 * Remove current highlight of a currently selected row header
 */
handsontable.RowHeader.prototype.deselect = function () {
  if (this.lastActive) {
    $(this.lastActive).removeClass('active');
    this.lastActive = null;
  }
};

/**
 *
 */
handsontable.RowHeader.prototype.destroy = function () {
  this.instance.blockedCols.destroyHeader(this.className);
};
/**
 * Handsontable ColHeader extension
 * @param {Object} instance
 * @param {Array|Boolean} [labels]
 */
handsontable.ColHeader = function (instance, labels) {
  var that = this;
  this.className = 'htColHeader';
  instance.blockedRows.main.on('mousedown', 'th.htColHeader', function () {
    instance.deselectCell();
    var $th = $(this);
    $th.addClass('active');
    that.lastActive = this;
    var index = $th.index();
    var offset = instance.blockedCols ? instance.blockedCols.count() : 0;
    instance.selectCell(0, index - offset, instance.rowCount - 1, index - offset, false);
  });
  instance.container.on('deselect.handsontable', function () {
    that.deselect();
  });
  this.instance = instance;
  this.labels = labels;
  instance.blockedRows.addHeader(this);
};

/**
 * Return custom column label or automatically generate one
 * @param {Number} index Row index
 * @return {String}
 */
handsontable.ColHeader.prototype.columnLabel = function (index) {
  if (this.labels[index]) {
    return this.instance.blockedRows.headerText(this.labels[index]);
  }
  var dividend = index + 1;
  var columnLabel = '';
  var modulo;
  while (dividend > 0) {
    modulo = (dividend - 1) % 26;
    columnLabel = String.fromCharCode(65 + modulo) + columnLabel;
    dividend = parseInt((dividend - modulo) / 26);
  }
  return this.instance.blockedRows.headerText(columnLabel);
};

/**
 * Remove current highlight of a currently selected column header
 */
handsontable.ColHeader.prototype.deselect = handsontable.RowHeader.prototype.deselect;

/**
 *
 */
handsontable.ColHeader.prototype.destroy = function () {
  this.instance.blockedRows.destroyHeader(this.className);
};