(function (Handsontable) {

  function HandsontableAutoColumnSize() {
    var plugin = this
      , sampleCount = 5; //number of samples to take of each value length

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
        }

        instance.addHook('beforeRender', htAutoColumnSize.determineIfChanged);
        instance.addHook('afterGetColWidth', htAutoColumnSize.getColWidth);
        instance.addHook('afterDestroy', htAutoColumnSize.afterDestroy);

        instance.determineColumnWidth = plugin.determineColumnWidth;
      } else {
        instance.removeHook('beforeRender', htAutoColumnSize.determineIfChanged);
        instance.removeHook('afterGetColWidth', htAutoColumnSize.getColWidth);
        instance.removeHook('afterDestroy', htAutoColumnSize.afterDestroy);

        delete instance.determineColumnWidth;

        plugin.afterDestroy.call(instance);

      }

    };

    this.determineIfChanged = function (force) {
      if (force) {
        htAutoColumnSize.determineColumnsWidth.apply(this, arguments);
      }
    };

    this.determineColumnWidth = function (col) {
      var instance = this
        , tmp = instance.autoColumnSizeTmp;

      if (!tmp.container) {
        createTmpContainer.call(tmp, instance);
      }

      tmp.container.className = instance.rootElement[0].className + ' htAutoColumnSize';
      tmp.table.className = instance.$table[0].className;

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

      instance.view.wt.wtDom.empty(tmp.tbody);

      var cellProperties = instance.getCellMeta(0, col);
      var renderer = Handsontable.helper.getCellMethod('renderer', cellProperties.renderer);

      for (var i in samples) {
        if (samples.hasOwnProperty(i)) {
          for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
            var tr = document.createElement('tr');
            var td = document.createElement('td');
            renderer(instance, td, samples[i].strings[j].row, col, instance.colToProp(col), samples[i].strings[j].value, cellProperties);
            r++;
            tr.appendChild(td);
            tmp.tbody.appendChild(tr);
          }
        }
      }

      var parent = instance.rootElement[0].parentNode;
      parent.appendChild(tmp.container);
      var width = instance.view.wt.wtDom.outerWidth(tmp.table);
      parent.removeChild(tmp.container);

      var maxWidth = instance.view.wt.wtViewport.getViewportWidth() - 2; //2 is some overhead for cell border
      if (width > maxWidth) {
        width = maxWidth;
      }

      return width;
    };

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

    this.getColWidth = function (col, response) {
      if (this.autoColumnWidths[col] && this.autoColumnWidths[col] > response.width) {
        response.width = this.autoColumnWidths[col];
      }
    };

    this.afterDestroy = function () {
      var instance = this;
      if (instance.autoColumnSizeTmp && instance.autoColumnSizeTmp.container && instance.autoColumnSizeTmp.container.parentNode) {
        instance.autoColumnSizeTmp.container.parentNode.removeChild(instance.autoColumnSizeTmp.container);
      }
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
      tmp.container.className = instance.rootElement[0].className + ' hidden';
      tmp.containerStyle = tmp.container.style;

      tmp.container.appendChild(tmp.table);
    }
  }

  var htAutoColumnSize = new HandsontableAutoColumnSize();

  Handsontable.PluginHooks.add('beforeInit', htAutoColumnSize.beforeInit);
  Handsontable.PluginHooks.add('afterUpdateSettings', htAutoColumnSize.beforeInit);

})(Handsontable);
