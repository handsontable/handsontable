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
    , tmpThead
    , tmpNoRenderer
    , tmpRenderer
    , sampleCount = 5; //number of samples to take of each value length

  this.beforeInit = function () {
    this.autoColumnWidths = [];
  };

  this.determineColumnWidth = function (col) {
    if (!tmp) {
      tmp = document.createElement('DIV');
      tmp.className = 'handsontable';
      tmp.style.position = 'absolute';
      tmp.style.top = '0';
      tmp.style.left = '0';
      tmp.style.display = 'none';

      tmpThead = $('<table><thead><tr><td></td></tr></thead></table>')[0];
      tmp.appendChild(tmpThead);

      tmp.appendChild(document.createElement('BR'));

      tmpTbody = $('<table><tbody><tr><td></td></tr></tbody></table>')[0];
      tmp.appendChild(tmpTbody);

      tmp.appendChild(document.createElement('BR'));

      tmpNoRenderer = $('<table class="htTable"><tbody><tr><td></td></tr></tbody></table>')[0];
      tmp.appendChild(tmpNoRenderer);

      tmp.appendChild(document.createElement('BR'));

      tmpRenderer = $('<table class="htTable"><tbody><tr><td></td></tr></tbody></table>')[0];
      tmp.appendChild(tmpRenderer);

      document.body.appendChild(tmp);
      $tmp = $(tmp);

      $tmp.find('table').css({
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
      instance.getColHeader(col, tmpThead.firstChild.firstChild.firstChild); //TH innerHTML
    }

    var txt = '';
    for (var i in samples) {
      if (samples.hasOwnProperty(i)) {
        for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
          txt += samples[i].strings[j] + '<br>';
        }
      }
    }
    tmpTbody.firstChild.firstChild.firstChild.innerHTML = txt; //TD innerHTML

    $(tmpRenderer.firstChild.firstChild.firstChild).empty();
    $(tmpNoRenderer.firstChild.firstChild.firstChild).empty();

    tmp.style.display = 'block';
    var width = $tmp.outerWidth();

    var cellProperties = instance.getCellMeta(0, col);
    if (cellProperties.renderer) {
      var str = 9999999999;

      tmpNoRenderer.firstChild.firstChild.firstChild.innerHTML = str;

      cellProperties.renderer(instance, tmpRenderer.firstChild.firstChild.firstChild, 0, col, instance.colToProp(col), str, cellProperties);

      width += $(tmpRenderer).width() - $(tmpNoRenderer).width(); //add renderer overhead to the calculated width
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
