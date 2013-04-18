function Walkontable(settings) {
  var self = this,
    originalHeaders = [];

  //bootstrap from settings
  this.wtSettings = new WalkontableSettings(this, settings);
  this.wtDom = new WalkontableDom(this);
  this.wtTable = new WalkontableTable(this);
  this.wtScroll = new WalkontableScroll(this);
  this.wtWheel = new WalkontableWheel(this);
  this.wtEvent = new WalkontableEvent(this);

  //find original headers
  if (this.wtTable.THEAD.childNodes.length && this.wtTable.THEAD.childNodes[0].childNodes.length) {
    for (var c = 0, clen = this.wtTable.THEAD.childNodes[0].childNodes.length; c < clen; c++) {
      originalHeaders.push(this.wtTable.THEAD.childNodes[0].childNodes[c].innerHTML);
    }
    if (!this.hasSetting('columnHeaders')) {
      this.update('columnHeaders', function (column, TH) {
        self.wtDom.avoidInnerHTML(TH, originalHeaders[column]);
      });
    }
  }

  //initialize selections
  this.selections = {};
  var selectionsSettings = this.getSetting('selections');
  if (selectionsSettings) {
    for (var i in selectionsSettings) {
      if (selectionsSettings.hasOwnProperty(i)) {
        this.selections[i] = new WalkontableSelection(this, selectionsSettings[i]);
      }
    }
  }

  this.drawn = false;
}

Walkontable.prototype.draw = function (selectionsOnly) {
  selectionsOnly = selectionsOnly && this.getSetting('offsetRow') === this.lastOffsetRow && this.getSetting('offsetColumn') === this.lastOffsetColumn;
  if (this.drawn) {
    this.scrollVertical(0);
    this.scrollHorizontal(0);
  }
  this.lastOffsetRow = this.getSetting('offsetRow');
  this.lastOffsetColumn = this.getSetting('offsetColumn');
  this.wtTable.draw(selectionsOnly);
  this.getSetting('onDraw');
  return this;
};

Walkontable.prototype.update = function (settings, value) {
  return this.wtSettings.update(settings, value);
};

Walkontable.prototype.scrollVertical = function (delta) {
  return this.wtScroll.scrollVertical(delta);
};

Walkontable.prototype.scrollHorizontal = function (delta) {
  return this.wtScroll.scrollHorizontal(delta);
};

Walkontable.prototype.scrollViewport = function (coords) {
  this.wtScroll.scrollViewport(coords);
  return this;
};

Walkontable.prototype.getViewport = function () {
  return [
    this.getSetting('offsetRow'),
    this.getSetting('offsetColumn'),
    this.wtTable.getLastVisibleRow(),
    this.wtTable.getLastVisibleColumn()
  ];
};

Walkontable.prototype.getSetting = function (key, param1, param2, param3) {
  return this.wtSettings.getSetting(key, param1, param2, param3);
};

Walkontable.prototype.hasSetting = function (key) {
  return this.wtSettings.has(key);
};

Walkontable.prototype.destroy = function () {
  clearTimeout(this.wheelTimeout);
  clearTimeout(this.dblClickTimeout);
};