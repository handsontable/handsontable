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

        Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
      }

      refreshResizerPosition.call(instance, currentTH);
    }
  });

  var saveManualColumnWidths = function () {
    var instance = this;

    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnWidths', instance.manualColumnWidths);
  };

  var loadManualColumnWidths = function () {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnWidths', storedState);

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
      resizer.style.left = startOffset + parseInt(this.view.wt.wtDom.outerWidth(TH), 10) + 'px';

      this.rootElement[0].appendChild(resizer);
    }
  }

  function refreshLinePosition() {
    var instance = this;
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
            Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
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
    col = Handsontable.hooks.execute(instance, 'modifyCol', col);

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

Handsontable.hooks.add('beforeInit', htManualColumnResize.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnResize.init.call(this, 'afterInit')
});
Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnResize.init.call(this, 'afterUpdateSettings')
});
Handsontable.hooks.add('afterGetColWidth', htManualColumnResize.getColWidth);

Handsontable.hooks.register('afterColumnResize');
