/**
 * This plugin determines the optimal column size for the data that's inside it
 * @constructor
 */
function HandsontableAutoColumnSize() {
  var that = this
    , instance
    , tmp
    , $tmp
    , tmpTbody
    , tmpTbodyTd
    , tmpThead
    , tmpTheadTh
    , tmpNoRenderer
    , tmpNoRendererTd
    , tmpRenderer
    , tmpRendererTd
    , sampleCount = 5; //number of samples to take of each value length

  this.beforeInit = function () {
    this.autoColumnWidths = [];
  };

  this.determineColumnWidth = function (col) {
    if (!tmp) {

      var d = document;

      tmpThead   = d.createElement('table');
      tmpThead.appendChild(d.createElement('thead')).appendChild(d.createElement('tr')).appendChild(d.createElement('th'));
      tmpTheadTh = tmpThead.getElementsByTagName('th')[0];

      tmpThead.className = 'htTable';
      tmpThead.style.tableLayout = 'auto',
      tmpThead.style.width = 'auto',

      tmpTbody   = tmpThead.cloneNode(false);
      tmpTbody.appendChild(d.createElement('tbody')).appendChild(d.createElement('tr')).appendChild(d.createElement('td'));
      tmpTbodyTd = tmpTbody.getElementsByTagName('td')[0];

      tmpNoRenderer   = tmpTbody.cloneNode(true);
      tmpNoRendererTd = tmpNoRenderer.getElementsByTagName('td')[0];

      tmpRenderer   = tmpTbody.cloneNode(true);
      tmpRendererTd = tmpRenderer.getElementsByTagName('td')[0];

      tmp = d.createElement('div');
      tmp.className = 'handsontable hidden';

      tmp.appendChild(tmpThead);
      tmp.appendChild(tmpTbody);
      tmp.appendChild(tmpNoRenderer);
      tmp.appendChild(tmpRenderer);

      $tmp = $(tmp);

      tmpNoRenderer = $tmp.children().eq(2);
      tmpRenderer   = $tmp.children().eq(3);

      d.body.appendChild(tmp);

    }

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
      instance.getColHeader(col, tmpTheadTh); //TH innerHTML
    }

    var txt = '';
    for (var i in samples) {
      if (samples.hasOwnProperty(i)) {
        for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
          txt += samples[i].strings[j] + '<br>';
        }
      }
    }
    tmpTbodyTd.innerHTML = txt; //TD innerHTML

    instance.view.wt.wtDom.empty(tmpRendererTd);
    instance.view.wt.wtDom.empty(tmpNoRendererTd);

    tmp.style.display = 'block';

    var width = $tmp.outerWidth();

    var cellProperties = instance.getCellMeta(0, col);
    if (cellProperties.renderer) {
      var str = 9999999999;

      tmpNoRendererTd.appendChild(document.createTextNode(str));

      cellProperties.renderer(instance, tmpRendererTd, 0, col, instance.colToProp(col), str, cellProperties);

      width += tmpRenderer.width() - tmpNoRenderer.width(); //add renderer overhead to the calculated width
    }

    tmp.style.display = 'none';

    return width;
  };

  this.determineColumnsWidth = function () {
    instance = this;
    var settings = this.getSettings();
    if (settings.autoColumnSize || !settings.colWidths) {
      var cols = this.countCols();
      for (var c = 0; c < cols; c++) {
        this.autoColumnWidths[c] = that.determineColumnWidth(c);
      }
    }
  };

  this.getColWidth = function (col, response) {
    if (this.autoColumnWidths[col] && this.autoColumnWidths[col] > response.width) {
      response.width = this.autoColumnWidths[col];
    }
  };
}
var htAutoColumnSize = new HandsontableAutoColumnSize();

Handsontable.PluginHooks.push('beforeInit', htAutoColumnSize.beforeInit);
Handsontable.PluginHooks.push('beforeRender', htAutoColumnSize.determineColumnsWidth);
Handsontable.PluginHooks.push('afterGetColWidth', htAutoColumnSize.getColWidth);
