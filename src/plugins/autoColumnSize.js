function HandsontableAutoColumnSize() {
  var that = this
    , instance
    , sampleCount = 5; //number of samples to take of each value length

  this.beforeInit = function () {
    this.autoColumnWidths = [];
    this.autoColumnSizeTmp = {
      thead: null,
      theadTh: null,
      theadStyle: null,
      tbody: null,
      tbodyTd: null,
      noRenderer: null,
      noRendererTd: null,
      renderer: null,
      rendererTd: null,
      container: null,
      containerStyle: null
    };
  };

  this.determineColumnWidth = function (col) {
    var tmp = instance.autoColumnSizeTmp
      , d;

    if (!tmp.container) {
      d = document;

      tmp.thead = d.createElement('table');
      tmp.thead.appendChild(d.createElement('thead')).appendChild(d.createElement('tr')).appendChild(d.createElement('th'));
      tmp.theadTh = tmp.thead.getElementsByTagName('th')[0];

      tmp.theadStyle = tmp.thead.style;
      tmp.theadStyle.tableLayout = 'auto';
      tmp.theadStyle.width = 'auto';

      tmp.tbody = tmp.thead.cloneNode(false);
      tmp.tbody.appendChild(d.createElement('tbody')).appendChild(d.createElement('tr')).appendChild(d.createElement('td'));
      tmp.tbodyTd = tmp.tbody.getElementsByTagName('td')[0];

      tmp.noRenderer = tmp.tbody.cloneNode(true);
      tmp.noRendererTd = tmp.noRenderer.getElementsByTagName('td')[0];

      tmp.renderer = tmp.tbody.cloneNode(true);
      tmp.rendererTd = tmp.renderer.getElementsByTagName('td')[0];

      tmp.container = d.createElement('div');
      tmp.container.className = instance.rootElement[0].className + ' hidden';
      tmp.containerStyle = tmp.container.style;

      tmp.container.appendChild(tmp.thead);
      tmp.container.appendChild(tmp.tbody);
      tmp.container.appendChild(tmp.noRenderer);
      tmp.container.appendChild(tmp.renderer);

      instance.rootElement[0].parentNode.appendChild(tmp.container);
    }

    tmp.container.className = instance.rootElement[0].className + ' hidden';
    var cls = instance.$table[0].className;
    tmp.thead.className = cls;
    tmp.tbody.className = cls;

    var rows = instance.countRows();
    var samples = {};
    var maxLen = 0;
    for (var r = 0; r < rows; r++) {
      var value = Handsontable.helper.stringify(instance.getDataAtCell(r, col));
      var len = value.length;
      if (len > maxLen) {
        maxLen = len;
      }
      if (!samples[len]) {
        samples[len] = {
          needed: sampleCount,
          strings: []
        };
      }
      if (samples[len].needed) {
        samples[len].strings.push(value);
        samples[len].needed--;
      }
    }

    var settings = instance.getSettings();
    if (settings.colHeaders) {
      instance.view.appendColHeader(col, tmp.theadTh); //TH innerHTML
    }

    var txt = '';
    for (var i in samples) {
      if (samples.hasOwnProperty(i)) {
        for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
          txt += samples[i].strings[j] + '<br>';
        }
      }
    }
    tmp.tbodyTd.innerHTML = txt; //TD innerHTML

    instance.view.wt.wtDom.empty(tmp.rendererTd);
    instance.view.wt.wtDom.empty(tmp.noRendererTd);

    tmp.containerStyle.display = 'block';

    var width = instance.view.wt.wtDom.outerWidth(tmp.container);

    var cellProperties = instance.getCellMeta(0, col);
    if (cellProperties.renderer) {
      var str = 9999999999;

      tmp.noRendererTd.appendChild(document.createTextNode(str));
      var renderer = Handsontable.helper.getCellMethod('renderer', cellProperties.renderer);
      renderer(instance, tmp.rendererTd, 0, col, instance.colToProp(col), str, cellProperties);

      width += instance.view.wt.wtDom.outerWidth(tmp.renderer) - instance.view.wt.wtDom.outerWidth(tmp.noRenderer); //add renderer overhead to the calculated width
    }

    var maxWidth = instance.view.wt.wtViewport.getViewportWidth() - 2; //2 is some overhead for cell border
    if (width > maxWidth) {
      width = maxWidth;
    }

    tmp.containerStyle.display = 'none';

    return width;
  };

  this.determineColumnsWidth = function () {
    instance = this;
    var settings = this.getSettings();
    if (settings.autoColumnSize || !settings.colWidths) {
      var cols = this.countCols();
      for (var c = 0; c < cols; c++) {
        if (!instance._getColWidthFromSettings(c)) {
          this.autoColumnWidths[c] = that.determineColumnWidth(c);
        }
      }
    }
  };

  this.getColWidth = function (col, response) {
    if (this.autoColumnWidths[col] && this.autoColumnWidths[col] > response.width) {
      response.width = this.autoColumnWidths[col];
    }
  };

  this.afterDestroy = function () {
    instance = this;
    if (instance.autoColumnSizeTmp.container) {
      instance.autoColumnSizeTmp.container.parentNode.removeChild(instance.autoColumnSizeTmp.container);
    }
  };
}
var htAutoColumnSize = new HandsontableAutoColumnSize();

Handsontable.PluginHooks.add('beforeInit', htAutoColumnSize.beforeInit);
Handsontable.PluginHooks.add('beforeRender', htAutoColumnSize.determineColumnsWidth);
Handsontable.PluginHooks.add('afterGetColWidth', htAutoColumnSize.getColWidth);
Handsontable.PluginHooks.add('afterDestroy', htAutoColumnSize.afterDestroy);
