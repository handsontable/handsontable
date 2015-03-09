/**
 * @plugin
 * @class Handsontable.AutoColumnSize
 */
(function (Handsontable) {

  function HandsontableAutoColumnSize() {
    var plugin = this
      , sampleCount = 5; //number of samples to take of each value length

    /**
     * @private
     * @function beforeInit
     * @memberof Handsontable.AutoColumnSize#
     */
    this.beforeInit = function () {
      var instance = this;
      instance.autoColumnWidths = [];

      if (instance.getSettings().autoColumnSize !== false) {
        if (!instance.autoColumnSizeTmp) {
          instance.autoColumnSizeTmp = {
            table: null,
            tableStyle: null,
            theadTh: null,
            tbody: null,
            container: null,
            containerStyle: null,
            determineBeforeNextRender: true
          };

          instance.addHook('beforeRender', htAutoColumnSize.determineIfChanged);
          instance.addHook('modifyColWidth', htAutoColumnSize.modifyColWidth);
          instance.addHook('afterDestroy', htAutoColumnSize.afterDestroy);

          /**
           * {@link Handsontable.AutoColumnSize#determineColumnWidth}
           *
           * @function determineColumnWidth
           * @alias determineColumnWidth
           * @memberof! Handsontable.Core#
           */
          instance.determineColumnWidth = plugin.determineColumnWidth;
        }
      } else {
        if (instance.autoColumnSizeTmp) {
          instance.removeHook('beforeRender', htAutoColumnSize.determineIfChanged);
          instance.removeHook('modifyColWidth', htAutoColumnSize.modifyColWidth);
          instance.removeHook('afterDestroy', htAutoColumnSize.afterDestroy);

          delete instance.determineColumnWidth;

          plugin.afterDestroy.call(instance);
        }
      }
    };

    /**
     * @private
     * @function determineIfChanged
     * @memberof Handsontable.AutoColumnSize#
     * @param {Boolean} [force]
     */
    this.determineIfChanged = function (force) {
      if (force) {
        htAutoColumnSize.determineColumnsWidth.apply(this, arguments);
      }
    };

    /**
     * Get width column.
     *
     * @function determineColumnWidth
     * @memberof Handsontable.AutoColumnSize#
     * @param {Number} col
     * @returns {Number}
     */
    this.determineColumnWidth = function (col) {
      var instance = this
        , tmp = instance.autoColumnSizeTmp;

      if (!tmp.container) {
        createTmpContainer.call(tmp, instance);
      }

      tmp.container.className = instance.rootElement.className + ' htAutoColumnSize';
      tmp.table.className = instance.table.className;

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
          samples[len].strings.push({value: value, row: r});
          samples[len].needed--;
        }
      }

      var settings = instance.getSettings();
      if (settings.colHeaders) {
        instance.view.appendColHeader(col, tmp.theadTh); //TH innerHTML
      }

      Handsontable.Dom.empty(tmp.tbody);

      for (var i in samples) {
        if (samples.hasOwnProperty(i)) {
          for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
            var row = samples[i].strings[j].row;

            var cellProperties = instance.getCellMeta(row, col);
            cellProperties.col = col;
            cellProperties.row = row;

            var renderer = instance.getCellRenderer(cellProperties);

            var tr = document.createElement('tr');
            var td = document.createElement('td');

            renderer(instance, td, row, col, instance.colToProp(col), samples[i].strings[j].value, cellProperties);
            r++;
            tr.appendChild(td);
            tmp.tbody.appendChild(tr);
          }
        }
      }

      var parent = instance.rootElement.parentNode;
      parent.appendChild(tmp.container);
      var width = Handsontable.Dom.outerWidth(tmp.table);
      parent.removeChild(tmp.container);

      return width;
    };

    /**
     * @private
     * @function determineColumnsWidth
     * @memberof Handsontable.AutoColumnSize#
     */
    this.determineColumnsWidth = function () {
      var instance = this;
      var settings = this.getSettings();
      if (settings.autoColumnSize || !settings.colWidths) {
        var cols = this.countCols();
        for (var c = 0; c < cols; c++) {
          if (!instance._getColWidthFromSettings(c)) {
            this.autoColumnWidths[c] = plugin.determineColumnWidth.call(instance, c);
          }
        }
      }
    };

    /**
     * @private
     * @function modifyColWidth
     * @memberof Handsontable.AutoColumnSize#
     * @param {Number} width
     * @param {Number} col
     * @returns {Number}
     */
    this.modifyColWidth = function (width, col) {
      if (this.autoColumnWidths[col] && this.autoColumnWidths[col] > width) {
        return this.autoColumnWidths[col];
      }
      return width;
    };

    /**
     * @private
     * @function afterDestroy
     * @memberof Handsontable.AutoColumnSize#
     */
    this.afterDestroy = function () {
      var instance = this;
      if (instance.autoColumnSizeTmp && instance.autoColumnSizeTmp.container && instance.autoColumnSizeTmp.container.parentNode) {
        instance.autoColumnSizeTmp.container.parentNode.removeChild(instance.autoColumnSizeTmp.container);
      }
      instance.autoColumnSizeTmp = null;
    };

    function createTmpContainer(instance) {
      var d = document
        , tmp = this;

      tmp.table = d.createElement('table');
      tmp.theadTh = d.createElement('th');
      tmp.table.appendChild(d.createElement('thead')).appendChild(d.createElement('tr')).appendChild(tmp.theadTh);

      tmp.tableStyle = tmp.table.style;
      tmp.tableStyle.tableLayout = 'auto';
      tmp.tableStyle.width = 'auto';

      tmp.tbody = d.createElement('tbody');
      tmp.table.appendChild(tmp.tbody);

      tmp.container = d.createElement('div');
      tmp.container.className = instance.rootElement.className + ' hidden';
//      tmp.container.className = instance.rootElement[0].className + ' hidden';
      tmp.containerStyle = tmp.container.style;

      tmp.container.appendChild(tmp.table);
    }
  }

  var htAutoColumnSize = new HandsontableAutoColumnSize();

  Handsontable.hooks.add('beforeInit', htAutoColumnSize.beforeInit);
  Handsontable.hooks.add('afterUpdateSettings', htAutoColumnSize.beforeInit);

})(Handsontable);
