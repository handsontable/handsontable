function Walkontable(settings) {
  var originalHeaders = [];

  this.guid = 'wt_' + walkontableRandomString(); //this is the namespace for global events

  //bootstrap from settings
  if (settings.cloneSource) {
    this.cloneSource = settings.cloneSource;
    this.cloneOverlay = settings.cloneOverlay;
    this.wtSettings = settings.cloneSource.wtSettings;
    this.wtTable = new WalkontableTable(this, settings.table, settings.wtRootElement);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = settings.cloneSource.wtViewport;
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.cloneSource.selections;
  }
  else {
    this.wtSettings = new WalkontableSettings(this, settings);
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = new WalkontableViewport(this);
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.getSetting('selections');

    this.wtOverlays = new WalkontableOverlays(this);
  }

  //find original headers
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.getSetting('columnHeaders').length) {
      this.update('columnHeaders', [function (column, TH) {
        Handsontable.Dom.fastInnerText(TH, originalHeaders[column]);
      }]);
    }
  }



  this.drawn = false;
  this.drawInterrupted = false;
}

/**
 * Force rerender of Walkontable
 *
 * @param fastDraw {Boolean} When TRUE, try to refresh only the positions of borders without rerendering the data.
 *                           It will only work if WalkontableTable.draw() does not force rendering anyway
 * @returns {Walkontable}
 */
Walkontable.prototype.draw = function (fastDraw) {
  this.drawInterrupted = false;
  if (!fastDraw && !Handsontable.Dom.isVisible(this.wtTable.TABLE)) {
    this.drawInterrupted = true; //draw interrupted because TABLE is not visible
    return;
  }

  this.wtTable.draw(fastDraw);

  return this;
};

/**
 * Returns the TD at coords. If topmost is set to true, returns TD from the topmost overlay layer,
 * if not set or set to false, returns TD from the master table.
 *
 * @param {WalkontableCellCoords} coords
 * @param {Boolean} topmost
 * @returns {Object}
 */
Walkontable.prototype.getCell = function (coords, topmost) {
  if(!topmost) {
    return this.wtTable.getCell(coords);
  } else {
    var fixedRows = this.wtSettings.getSetting('fixedRowsTop')
      , fixedColumns = this.wtSettings.getSetting('fixedColumnsLeft');

    if(coords.row < fixedRows && coords.col < fixedColumns) {
      return this.wtOverlays.topLeftCornerOverlay.clone.wtTable.getCell(coords);
    } else if(coords.row < fixedRows) {
      return this.wtOverlays.topOverlay.clone.wtTable.getCell(coords);
    } else if (coords.col < fixedColumns) {
      return this.wtOverlays.leftOverlay.clone.wtTable.getCell(coords);
    } else {
      return this.wtTable.getCell(coords);
    }
  }
};

Walkontable.prototype.update = function (settings, value) {
  return this.wtSettings.update(settings, value);
};

/**
 * Scroll the viewport to a row at the given index in the data source
 *
 * @param row
 * @returns {Walkontable}
 */
Walkontable.prototype.scrollVertical = function (row) {
  this.wtOverlays.topOverlay.scrollTo(row);
  this.getSetting('onScrollVertically');
  return this;
};

/**
 * Scroll the viewport to a column at the given index in the data source
 *
 * @param column
 * @returns {Walkontable}
 */
Walkontable.prototype.scrollHorizontal = function (column) {
  this.wtOverlays.leftOverlay.scrollTo(column);
  this.getSetting('onScrollHorizontally');
  return this;
};

/**
 * Scrolls the viewport to a cell (rerenders if needed)
 *
 * @param {WalkontableCellCoords} coords
 * @returns {Walkontable}
 */

Walkontable.prototype.scrollViewport = function (coords) {
  this.wtScroll.scrollViewport(coords);
  return this;
};

Walkontable.prototype.getViewport = function () {
  return [
    this.wtTable.getFirstVisibleRow(),
    this.wtTable.getFirstVisibleColumn(),
    this.wtTable.getLastVisibleRow(),
    this.wtTable.getLastVisibleColumn()
  ];
};

Walkontable.prototype.getSetting = function (key, param1, param2, param3, param4) {
  return this.wtSettings.getSetting(key, param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/handsontable/wiki/JavaScript-&-DOM-performance-tips
};

Walkontable.prototype.hasSetting = function (key) {
  return this.wtSettings.has(key);
};

Walkontable.prototype.destroy = function () {
  this.wtOverlays.destroy();

  if ( this.wtEvent ) {
    this.wtEvent.destroy();
  }
};
