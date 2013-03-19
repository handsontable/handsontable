/**
 * This plugin determines the optimal column size for the data that's inside it
 * @constructor
 */
function HandsontableAutoColumnSize() {
  var that = this
    , instance
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
    if (!$tmp) {

      tmpThead = $('<table><thead><tr><th></th></tr></thead></table>');
      tmpTheadTh = tmpThead.find('th')[0];

      tmpTbody = $('<table><tbody><tr><td></td></tr></tbody></table>');
      tmpTbodyTd = tmpTbody.find('td')[0];

      tmpNoRenderer = $('<table><tbody><tr><td></td></tr></tbody></table>');
      tmpNoRendererTd = tmpNoRenderer.find('td')[0];

      tmpRenderer = $('<table><tbody><tr><td></td></tr></tbody></table>');
      tmpRendererTd = tmpRenderer.find('td')[0];

      $tmp = $('<div class="handsontable hidden" />').appendTo(document.body);
      $tmp.append(tmpThead, tmpTbody, tmpNoRenderer, tmpRenderer).css({
        tableLayout: 'auto',
        width: 'auto'
      });

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

    Handsontable.helper.empty(tmpRendererTd);
    Handsontable.helper.empty(tmpNoRendererTd);

    var width = $tmp.show().outerWidth();

    var cellProperties = instance.getCellMeta(0, col);
    if (cellProperties.renderer) {
      var str = 9999999999;

      tmpNoRendererTd.innerHTML = str;

      cellProperties.renderer(instance, tmpRendererTd, 0, col, instance.colToProp(col), str, cellProperties);

      width += tmpRenderer.width() - tmpNoRenderer.width(); //add renderer overhead to the calculated width
    }

    $tmp[0].style.display = 'none';

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
