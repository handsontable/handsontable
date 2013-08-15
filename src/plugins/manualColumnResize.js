function HandsontableManualColumnResize() {
  var pressed
    , currentTH
    , currentCol
    , currentWidth
    , instance
    , newSize
    , startX
    , startWidth
    , startOffset
    , resizer = document.createElement('DIV')
    , handle = document.createElement('DIV')
    , line = document.createElement('DIV')
    , lineStyle = line.style;

  resizer.className = 'manualColumnResizer';

  handle.className = 'manualColumnResizerHandle';
  resizer.appendChild(handle);

  line.className = 'manualColumnResizerLine';
  resizer.appendChild(line);

  var $document = $(document);

  $document.mousemove(function (e) {
    if (pressed) {
      currentWidth = startWidth + (e.pageX - startX);
      newSize = setManualSize(currentCol, currentWidth); //save col width
      resizer.style.left = startOffset + currentWidth + 'px';
    }
  });

  $document.mouseup(function () {
    if (pressed) {
      instance.view.wt.wtDom.removeClass(resizer, 'active');
      pressed = false;

      if(newSize != startWidth){
        instance.forceFullRender = true;
        instance.view.render(); //updates all

        saveManualColumnWidths.call(instance);

        instance.PluginHooks.run('afterColumnResize', currentCol, newSize);
      }

      refreshResizerPosition.call(instance, currentTH);
    }
  });

  var saveManualColumnWidths = function () {
    var instance = this;

    instance.PluginHooks.run('persistentStateSave', 'manualColumnWidths', instance.manualColumnWidths);
  };

  var loadManualColumnWidths = function () {
    var instance = this;
    var storedState = {};
    instance.PluginHooks.run('persistentStateLoad', 'manualColumnWidths', storedState);

    return storedState.value;
  };

  function refreshResizerPosition(TH) {
    instance = this;
    currentTH = TH;

    var col = this.view.wt.wtTable.getCoords(TH)[1]; //getCoords returns array [row, col]
    if (col >= 0) { //if not row header
      currentCol = col;
      var rootOffset = this.view.wt.wtDom.offset(this.rootElement[0]).left;
      var thOffset = this.view.wt.wtDom.offset(TH).left;
      startOffset = (thOffset - rootOffset) - 6;
      var thStyle = this.view.wt.wtDom.getComputedStyle(TH);
      resizer.style.left = startOffset + parseInt(this.view.wt.wtDom.outerWidth(TH), 10) + 'px';

      this.rootElement[0].appendChild(resizer);
    }
  }

  function getColumnWidth(TH) {
    var instance = this;
    var thOffset = instance.view.wt.wtDom.offset(TH).left - instance.view.wt.wtDom.offset(TH).left;
    var rootOffset = instance.view.wt.wtDom.offset(instance.rootElement[0]).left;
    var col = instance.view.wt.wtTable.getCoords(TH)[1]; //getCoords returns array [row, col]
    var thWidth = instance.getColWidth(col);
    var maxWidth = instance.view.maximumVisibleElementWidth(thOffset - rootOffset);
    return Math.min(thWidth, maxWidth);
  }

  function refreshLinePosition() {
    var instance = this;
    var thBorderWidth = 2 * parseInt(this.view.wt.wtDom.getComputedStyle(currentTH).borderWidth, 10);
    startWidth = parseInt(this.view.wt.wtDom.outerWidth(currentTH), 10);
    instance.view.wt.wtDom.addClass(resizer, 'active');
    lineStyle.height = instance.view.wt.wtDom.outerHeight(instance.$table[0]) + 'px';
    pressed = instance;
  }

  var bindManualColumnWidthEvents = function () {
    var instance = this;
    var dblclick = 0;
    var autoresizeTimeout = null;

    this.rootElement.on('mouseenter.handsontable', 'th', function (e) {
      if (!pressed) {
        refreshResizerPosition.call(instance, e.currentTarget);
      }
    });

    this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function () {
      if (autoresizeTimeout == null) {
        autoresizeTimeout = setTimeout(function () {
          if (dblclick >= 2) {
            newSize = instance.determineColumnWidth.call(instance, currentCol);
            setManualSize(currentCol, newSize);
            instance.forceFullRender = true;
            instance.view.render(); //updates all
            instance.PluginHooks.run('afterColumnResize', currentCol, newSize);
          }
          dblclick = 0;
          autoresizeTimeout = null;
        }, 500);
      }
      dblclick++;
    });

    this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function (e) {
      startX = e.pageX;
      refreshLinePosition.call(instance);
      newSize = startWidth;
    });
  };

  this.beforeInit = function () {
    this.manualColumnWidths = [];
  };

  this.init = function (source) {
    var instance = this;
    var manualColumnWidthEnabled = !!(this.getSettings().manualColumnResize);

    if (manualColumnWidthEnabled) {
      var initialColumnWidths = this.getSettings().manualColumnResize;

      var loadedManualColumnWidths = loadManualColumnWidths.call(instance);

      if (typeof loadedManualColumnWidths != 'undefined') {
        this.manualColumnWidths = loadedManualColumnWidths;
      } else if (initialColumnWidths instanceof Array) {
        this.manualColumnWidths = initialColumnWidths;
      } else {
        this.manualColumnWidths = [];
      }

      if (source == 'afterInit') {
        bindManualColumnWidthEvents.call(this);
        instance.forceFullRender = true;
        instance.render();
      }
    }
  };


  var setManualSize = function (col, width) {
    width = Math.max(width, 20);

    /**
     *  We need to run col through modifyCol hook, in case the order of displayed columns is different than the order
     *  in data source. For instance, this order can be modified by manualColumnMove plugin.
     */
    col = instance.PluginHooks.execute('modifyCol', col);

    instance.manualColumnWidths[col] = width;
    return width;
  };

  this.getColWidth = function (col, response) {
    if (this.getSettings().manualColumnResize && this.manualColumnWidths[col]) {
      response.width = this.manualColumnWidths[col];
    }
  };
}
var htManualColumnResize = new HandsontableManualColumnResize();

Handsontable.PluginHooks.add('beforeInit', htManualColumnResize.beforeInit);
Handsontable.PluginHooks.add('afterInit', function () {
  htManualColumnResize.init.call(this, 'afterInit')
});
Handsontable.PluginHooks.add('afterUpdateSettings', function () {
  htManualColumnResize.init.call(this, 'afterUpdateSettings')
});
Handsontable.PluginHooks.add('afterGetColWidth', htManualColumnResize.getColWidth);
