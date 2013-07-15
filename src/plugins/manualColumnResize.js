function HandsontableManualColumnResize() {
  var pressed
    , currentTH
    , currentCol
    , currentWidth
    , autoresizeTimeout
    , instance
    , newSize
    , startX
    , startWidth
    , startOffset
    , dblclick = 0
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
      instance.forceFullRender = true;
      instance.view.render(); //updates all
      instance.PluginHooks.run('afterColumnResize', currentCol, newSize);
      refreshResizerPosition.call(instance, currentTH);
    }
  });

  this.beforeInit = function () {
    this.manualColumnWidths = [];
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

      resizer.style.left = startOffset + getColumnWidth.call(instance, TH) + 'px';

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
    startWidth = getColumnWidth.call(this, currentTH);
    this.view.wt.wtDom.addClass(resizer, 'active');
    lineStyle.height = this.view.wt.wtDom.outerHeight(this.$table[0]) + 'px';
    pressed = true;
  }

  this.afterInit = function () {
    if (this.getSettings().manualColumnResize) {
      var instance = this;

      this.rootElement.on('mouseenter.handsontable', 'th', function (e) {
        if (!pressed) {
          refreshResizerPosition.call(instance, e.currentTarget);
        }
      });

      this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function () {
        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function () {
            if (dblclick >= 2) {
              setManualSize(currentCol, htAutoColumnSize.determineColumnWidth.call(instance, currentCol));
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
      });
    }
  };

  var setManualSize = function (col, width) {
    width = Math.max(width, 20);
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
Handsontable.PluginHooks.add('afterInit', htManualColumnResize.afterInit);
Handsontable.PluginHooks.add('afterGetColWidth', htManualColumnResize.getColWidth);
