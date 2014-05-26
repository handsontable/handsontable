function Walkontable(settings) {
  var that = this,
    originalHeaders = [];

  this.guid = 'wt_' + walkontableRandomString(); //this is the namespace for global events

  //bootstrap from settings
  this.wtDom = new WalkontableDom();
  if (settings.cloneSource) {
    this.cloneSource = settings.cloneSource;
    this.cloneOverlay = settings.cloneOverlay;
    this.wtSettings = settings.cloneSource.wtSettings;
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = settings.cloneSource.wtViewport;
    this.wtEvent = new WalkontableEvent(this);
    this.selections = this.cloneSource.selections.makeClone(this);
  }
  else {
    this.wtSettings = new WalkontableSettings(this, settings);
    this.wtTable = new WalkontableTable(this, settings.table);
    this.wtScroll = new WalkontableScroll(this);
    this.wtViewport = new WalkontableViewport(this);
    this.wtEvent = new WalkontableEvent(this);
    this.selections = new WalkontableSelections(this, this.getSetting('selections'));

    this.wtScrollbars = new WalkontableScrollbars(this);
  }

  //find original headers
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.getSetting('columnHeaders').length) {
      this.update('columnHeaders', [function (column, TH) {
        that.wtDom.fastInnerText(TH, originalHeaders[column]);
      }]);
    }
  }



  this.drawn = false;
  this.drawInterrupted = false;

  //at this point the cached row heights may be invalid, but it is better not to reset the cache, which could cause scrollbar jumping when there are multiline cells outside of the rendered part of the table
  /*if (window.Handsontable) {
    Handsontable.hooks.add('beforeChange', function () {
      if (that.rowHeightCache) {
        that.rowHeightCache.length = 0;
      }
    });

  }*/
}

Walkontable.prototype.draw = function (selectionsOnly) {
  this.drawInterrupted = false;
  if (!selectionsOnly && !this.wtDom.isVisible(this.wtTable.TABLE)) {
    this.drawInterrupted = true; //draw interrupted because TABLE is not visible
    return;
  }

  this.getSetting('beforeDraw', !selectionsOnly);
  selectionsOnly = selectionsOnly && this.getSetting('offsetRow') === this.lastOffsetRow && this.getSetting('offsetColumn') === this.lastOffsetColumn;
  this.lastOffsetRow = this.getSetting('offsetRow');
  this.lastOffsetColumn = this.getSetting('offsetColumn');

  var totalRows = this.getSetting('totalRows');

  if (this.lastOffsetRow > totalRows && totalRows > 0) {
    this.scrollVertical(-Infinity); //TODO: probably very inefficient!
    this.scrollViewport(new WalkontableCellCoords(totalRows - 1, 0));
  }


  this.wtTable.draw(selectionsOnly);
  if (!this.cloneSource) {
    this.getSetting('onDraw',  !selectionsOnly);
  }
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

Walkontable.prototype.getSetting = function (key, param1, param2, param3) {
  var args = Array.prototype.slice.call(arguments);
  return WalkontableSettings.prototype.getSetting.apply(this.wtSettings, args);
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