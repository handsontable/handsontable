(function (Handsontable) {

  function HandsontableAutoRowSize() {
    var plugin = this,
      sampleCount = 2; //number of samples to take of each value length

    this.beforeInit = function () {
      var instance = this;
      instance.autoRowHeights = [];

      if (instance.getSettings().autoRowSize !== false) {
        if (!instance.autoRowSizeTmp) {
          instance.autoRowSizeTmp = {
            table: null,
            tableStyle: null,
            tbody: null,
            container: null,
            containerStyle: null,
            determineBeforeNextRender: true
          };

          instance.addHook('beforeRender', htAutoRowSize.determineIfChanged);
          instance.addHook('modifyRowHeight', htAutoRowSize.modifyRowHeight);
          instance.addHook('afterDestroy', htAutoRowSize.afterDestroy);

          instance.determineRowHeight = plugin.determineRowHeight;
        }
      } else {
        if (instance.autoRowSizeTmp) {
          instance.removeHook('beforeRender', htAutoRowSize.determineIfChanged);
          instance.removeHook('modifyRowHeight', htAutoRowSize.modifyRowHeight);
          instance.removeHook('afterDestroy', htAutoRowSize.afterDestroy);

          delete instance.determineRowHeight;

          plugin.afterDestroy.call(instance);
        }
      }
    };

    this.determineIfChanged = function (force) {
      if (force) {
        htAutoRowSize.determineRowsHeight.apply(this, arguments);
      }
    };

    this.determineRowHeight = function (row) {
      var instance = this,
        tmp = instance.autoRowSizeTmp;

      if (!tmp.container) {
        createTmpContainer.call(tmp, instance);
      }

      tmp.container.className = instance.rootElement[0].className + ' htAutoRowSize';
      tmp.table.className = instance.$table[0].className;

      var cols = instance.countCols(),
        samples = {},
        maxLen = 0;

      for (var c = 0; c < cols; c++) {
        var value = Handsontable.helper.stringify(instance.getDataAtCell(row, c)),
          len = value.length;

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
          samples[len].strings.push({value: value, col: c});
          samples[len].needed--;
        }
      }

      instance.view.wt.wtDom.empty(tmp.tbody);

      for (var i in samples) {
        if (samples.hasOwnProperty(i)) {

          var tr = document.createElement('tr');

          for (var j = 0, jlen = samples[i].strings.length; j < jlen; j++) {
            var col = samples[i].strings[j].col,
              cellProperties = instance.getCellMeta(row, col);

            cellProperties.col = col;
            cellProperties.row = row;

            var renderer = instance.getCellRenderer(cellProperties),
              td = document.createElement('td');

            renderer(instance, td, row, col, 0, samples[i].strings[j].value, cellProperties);
            tr.appendChild(td);
          }

          tmp.tbody.appendChild(tr);
        }
      }

      var parent = instance.rootElement[0].parentNode;
      parent.appendChild(tmp.container);

      var height = instance.view.wt.wtDom.outerHeight(tmp.table);
      parent.removeChild(tmp.container);

      if (height > 0) {
        height -= 1;
      }

      return height;
    };

    this.determineRowsHeight = function () {
      var instance = this,
        settings = this.getSettings();

      if (settings.autoRowSize || !settings.rowHeights) {
        var rows = this.countRows();
        for (var r = 0; r < rows; r++) {
          if (!instance._getRowHeightFromSettings(r)) {
            this.autoRowHeights[r] = plugin.determineRowHeight.call(instance, r);
          }
        }
      }
    };

    this.modifyRowHeight = function (height, row) {
      if (this.autoRowHeights[row] && this.autoRowHeights[row] > height) {
        return this.autoRowHeights[row];
      }
      return height;
    };

    this.afterDestroy = function () {
      var instance = this;
      if (instance.autoRowSizeTmp && instance.autoRowSizeTmp.container && instance.autoRowSizeTmp.container.parentNode) {
        instance.autoRowSizeTmp.container.parentNode.removeChild(instance.autoRowSizeTmp.container);
      }
      instance.autoRowSizeTmp = null;
    };

    var createTmpContainer = function (instance) {
      var d = document,
        tmp = this;

      tmp.table = d.createElement('table');
      tmp.tableStyle = tmp.table.style;
      tmp.tableStyle.tableLayout = 'auto';
      tmp.tableStyle.width = 'auto';

      tmp.tbody = d.createElement('tbody');
      tmp.table.appendChild(tmp.tbody);

      tmp.container = d.createElement('div');
      tmp.container.className = instance.rootElement[0].className + ' hidden';
      tmp.containerStyle = tmp.container.style;

      tmp.container.appendChild(tmp.table);
    };
  }

  var htAutoRowSize = new HandsontableAutoRowSize();

  Handsontable.hooks.add('beforeInit', htAutoRowSize.beforeInit);
  Handsontable.hooks.add('afterUpdateSettings', htAutoRowSize.beforeInit);

})(Handsontable);