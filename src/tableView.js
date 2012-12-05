/**
 * Handsontable TableView constructor
 * @param {Object} instance
 */
Handsontable.TableView = function (instance) {
  var that = this;

  this.instance = instance;
  instance.rootElement.addClass('handsontable');
  var $table = $('<table><thead></thead><tbody></tbody></table>');
  instance.rootElement.prepend($table);

  var settings = this.instance.getSettings();

  this.wt = new Walkontable({
    table: $table[0],
    data: instance.getDataAtCell,
    totalRows: instance.countRows,
    totalColumns: instance.countCols,
    offsetRow: 0,
    offsetColumn: 0,
    displayRows: null,
    displayColumns: null,
    width: settings.width,
    height: settings.height,
    rowHeaders: settings.rowHeaders ? instance.getRowHeader : null,
    columnHeaders: settings.colHeaders ? instance.getColHeader : null,
    cellRenderer: function (row, column, TD) {
      that.applyCellTypeMethod('renderer', TD, {row: row, col: column}, instance.getDataAtCell(row, column));
    },
    selections: {
      current: {
        className: 'current',
        border: {
          width: 2,
          color: '#5292F7',
          style: 'solid'
        }
      },
      area: {
        className: 'area',
        border: {
          width: 1,
          color: '#89AFF9',
          style: 'solid'
        }
      }
    },
    onCellMouseDown: function (event, coords, TD) {
      var coordsObj = {row: coords[0], col: coords[1]};
      if (event.button === 2 && instance.selection.inInSelection(coordsObj)) { //right mouse button
        //do nothing
      }
      else if (event.shiftKey) {
        instance.selection.setRangeEnd(coordsObj);
      }
      else {
        instance.selection.setRangeStart(coordsObj);
      }
    }
  });
  this.wt.draw();

  var interaction = {
    onMouseDown: function (event) {

    },

    onMouseOver: function () {

    }
  };
};

/**
 * Creates row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new row will be inserted
 */
Handsontable.TableView.prototype.createRow = function (coords) {

};

/**
 * Creates col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell before which the new column will be inserted
 */
Handsontable.TableView.prototype.createCol = function (coords) {

};

/**
 * Removes row at the bottom of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which row will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all rows will be removed
 */
Handsontable.TableView.prototype.removeRow = function (coords, toCoords) {

};

/**
 * Removes col at the right of the <table>
 * @param {Object} [coords] Optional. Coords of the cell which col will be removed
 * @param {Object} [toCoords] Required if coords is defined. Coords of the cell until which all cols will be removed
 */
Handsontable.TableView.prototype.removeCol = function (coords, toCoords) {

};

Handsontable.TableView.prototype.render = function (row, col, prop, value) {
  this.wt.draw();
};

Handsontable.TableView.prototype.renderRow = function (row) {

};

Handsontable.TableView.prototype.renderCol = function (col) {

};

Handsontable.TableView.prototype.applyCellTypeMethod = function (methodName, td, coords, extraParam) {
  var prop = this.instance.colToProp(coords.col)
    , method
    , cellProperties = this.instance.getCellMeta(coords.row, coords.col);

  if (cellProperties.type && typeof cellProperties.type[methodName] === "function") {
    method = cellProperties.type[methodName];
  }
  if (typeof method !== "function") {
    method = Handsontable.TextCell[methodName];
  }
  return method(this.instance, td, coords.row, coords.col, prop, extraParam, cellProperties);
};

/**
 * Returns coordinates given td object
 */
Handsontable.TableView.prototype.getCellCoords = function (td) {

};

/**
 * Returns td object given coordinates
 */
Handsontable.TableView.prototype.getCellAtCoords = function (coords) {
  return this.wt.wtTable.getCell([coords.row, coords.col]);
};

/**
 * Returns all td objects in grid
 */
Handsontable.TableView.prototype.getAllCells = function () {

};

/**
 * Scroll viewport to selection
 * @param coords
 */
Handsontable.TableView.prototype.scrollViewport = function (coords) {
  this.wt.scrollViewport([coords.row, coords.col]).draw();
};