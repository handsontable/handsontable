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
    , scrollTop = 0
    , scrollLeft = 0
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
      Handsontable.Dom.removeClass(resizer, 'active');
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

    var col = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
    if (col >= 0) { //if not row header
      currentCol = col;
      var rootOffset = Handsontable.Dom.offset(this.rootElement[0]).left;
      var thOffset = Handsontable.Dom.offset(TH).left;
      startOffset = (thOffset - rootOffset) - 6 + scrollLeft;
      resizer.style.left = startOffset + parseInt(Handsontable.Dom.outerWidth(TH), 10) + 'px';
      resizer.style.top = scrollTop + 'px';
      this.rootElement[0].appendChild(resizer);
    }
  }

  function refreshLinePosition() {
    var instance = this;
    startWidth = parseInt(Handsontable.Dom.outerWidth(currentTH), 10);
    Handsontable.Dom.addClass(resizer, 'active');
    lineStyle.height = Handsontable.Dom.outerHeight(instance.$table[0]) + 'px';
    pressed = instance;
  }

  var bindManualColumnWidthEvents = function () {
    var instance = this;
    var dblclick = 0;
    var autoresizeTimeout = null;

    this.rootElement.on('mouseenter.handsontable', 'table thead tr > th', function (e) {
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

        Handsontable.hooks.add('afterScrollVertically', afterScrollVertically);
        Handsontable.hooks.add('afterScrollHorizontally', afterScrollHorizontally);
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

  this.modifyColWidth = function (width, col) {
    col = this.runHooksAndReturn('modifyCol', col);
    if (this.getSettings().manualColumnResize && this.manualColumnWidths[col]) {
      return this.manualColumnWidths[col];
    }
    return width;
  };

  var afterScrollVertically = function () {
    scrollTop = Handsontable.Dom.getScrollTop(this.rootElement[0]);
  };

  var afterScrollHorizontally = function () {
    scrollLeft = Handsontable.Dom.getScrollLeft(this.rootElement[0]);
  }
}
var htManualColumnResize = new HandsontableManualColumnResize();

Handsontable.hooks.add('beforeInit', htManualColumnResize.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnResize.init.call(this, 'afterInit')
});
Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnResize.init.call(this, 'afterUpdateSettings')
});
Handsontable.hooks.add('modifyColWidth', htManualColumnResize.modifyColWidth);

Handsontable.hooks.register('afterColumnResize');
