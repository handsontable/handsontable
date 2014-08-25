function Walkontable(settings) {
  var originalHeaders = [];

  this.guid = 'wt_' + walkontableRandomString(); //this is the namespace for global events

  //bootstrap from settings
  if (settings.cloneSource) {
    this.cloneSource = settings.cloneSource;
    this.cloneOverlay = settings.cloneOverlay;
    this.wtSettings = settings.cloneSource.wtSettings;
    this.wtTable = new WalkontableTable(this, settings.table);
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

    this.wtScrollbars = new WalkontableScrollbars(this);
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

Walkontable.prototype.draw = function (selectionsOnly) {
  this.drawInterrupted = false;
  if (!selectionsOnly && !Handsontable.Dom.isVisible(this.wtTable.TABLE)) {
    this.drawInterrupted = true; //draw interrupted because TABLE is not visible
    return;
  }

  selectionsOnly = selectionsOnly && this.getSetting('offsetRow') === this.lastOffsetRow;
  this.lastOffsetRow = this.getSetting('offsetRow');

  var totalRows = this.getSetting('totalRows');

  if (this.lastOffsetRow > totalRows && totalRows > 0) {
    this.scrollVertical(-Infinity); //TODO: probably very inefficient!
    this.scrollViewport(new WalkontableCellCoords(totalRows - 1, 0));
  }


  this.wtTable.draw(selectionsOnly);
  return this;
};

Walkontable.prototype.update = function (settings, value) {
  return this.wtSettings.update(settings, value);
};

Walkontable.prototype.scrollVertical = function (delta) {
  var result = this.wtScroll.scrollVertical(delta);

  this.getSetting('onScrollVertically');

  return result;
};

Walkontable.prototype.scrollHorizontal = function (delta) {
  var result = this.wtScroll.scrollHorizontal(delta);

  this.getSetting('onScrollHorizontally');

  return result;
};

/**
 * Scrolls the viewport to a cell (rerenders if needed)
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
  return this.wtSettings.getSetting(key, param1, param2, param3, param4); //this is faster than .apply - https://github.com/handsontable/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
};

Walkontable.prototype.hasSetting = function (key) {
  return this.wtSettings.has(key);
};

Walkontable.prototype.destroy = function () {
  $(window).off('.' + this.guid);
  $(document.body).off('.' + this.guid);
  this.wtScrollbars.destroy();
  this.wtEvent && this.wtEvent.destroy();
};
