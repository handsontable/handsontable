/**
 * This plugin determines the optimal column size for the data that's inside it
 * @constructor
 */
function HandsontableAutoColumnSize() {
  var instance;
  var tmp;
  var that = this;

  var sampleCount = 5; //number of samples to take of each value length

  this.beforeInit = function () {
    this.autoColumnWidths = [];
  }

  this.determineColumnWidth = function (col) {
    if (!tmp) {
      tmp = document.createElement('TABLE');
      tmp.style.position = 'absolute';
      tmp.style.top = '0';
      tmp.style.left = '0';
      tmp.innerHTML = '<tbody><tr><td></td></tr></tbody>';
      document.body.appendChild(tmp);
    }

    var rows = instance.countRows();
    var samples = {};
    for (var r = 0; r < rows; r++) {
      var value = Handsontable.helper.stringify(instance.getDataAtCell(r, col));
      var len = value.length;
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

    var txt = '';
    var settings = instance.getSettings();
    if (settings.colHeaders) {
      txt += instance.getColHeader(col) + '<br>';
    }
    for (var i in samples) {
      if (samples.hasOwnProperty(i)) {
        for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
          txt += samples[i].strings[j] + '<br>';
        }
      }
    }
    tmp.firstChild.firstChild.firstChild.innerHTML = txt; //TD innerHTML

    tmp.style.display = 'block';
    var width = $(tmp).outerWidth();
    tmp.style.display = 'none';
    return width;
  }

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
