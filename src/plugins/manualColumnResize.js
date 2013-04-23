function HandsontableManualColumnResize() {
  var pressed
    , currentCol
    , currentWidth
    , instance
    , newSize
    , start
    , startX
    , startWidth
    , startOffset
    , resizer = document.createElement('DIV')
    , line = document.createElement('DIV')
    , lineStyle = line.style;

  resizer.className = 'manualColumnResizer';

  line.className = 'manualColumnResizerLine';
  lineStyle.position ='absolute';
  lineStyle.top = 0;
  lineStyle.left = 0;
  lineStyle.width = 0;
  lineStyle.borderRight = '1px dashed #777';
  line.appendChild(resizer);

  $(document).mousemove(function (e) {
    if (pressed) {
      currentWidth = startWidth + (e.pageX - startX);
      newSize = setManualSize(currentCol, currentWidth); //save col width
      lineStyle.left = startOffset + currentWidth - 1 + 'px';
      if (lineStyle.display === 'none') {
        lineStyle.display = 'block';
      }
    }
  });

  $(document).mouseup(function () {
    if (pressed) {
      $('.manualColumnResizer.active').removeClass('active');
      pressed = false;
      instance.forceFullRender = true;
      instance.view.render(); //updates all
      lineStyle.display = 'none';
      instance.runHooks('afterColumnResize', currentCol, newSize);
    }
  });

  $(document).dblclick(function (e) {
    if ($(e.target).is('.manualColumnResizer')) {
      setManualSize(currentCol, htAutoColumnSize.determineColumnWidth.call(instance, currentCol));
      instance.runHooks('afterColumnResize', currentCol, newSize);
    }
  });

  this.beforeInit = function () {
    this.manualColumnWidths = [];
  };

  this.afterInit = function () {
    if (this.getSettings().manualColumnResize) {
      var that = this;
      this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function (e) {
        var _resizer = e.target,
            $table   = that.rootElement.find('.htCore'),
            $grandpa = $(_resizer.parentNode.parentNode);

        instance = that;
        currentCol = _resizer.getAttribute('rel');
        start = $(that.rootElement[0].getElementsByTagName('col')[$grandpa.index()]);
        pressed = true;
        startX = e.pageX;
        startWidth = start.width();
        currentWidth = startWidth;

        _resizer.className += ' active';

        lineStyle.height = $table.height() + 'px';
        $table.parent()[0].appendChild(line);
        startOffset = parseInt($grandpa.offset().left - $table.offset().left, 10);
        lineStyle.left = startOffset + currentWidth - 1 + 'px';
      });
    }
  };

  var setManualSize = function (col, width) {
    width = Math.max(width, 20);
    width = Math.min(width, 500);
    instance.manualColumnWidths[col] = width;
    return width;
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().manualColumnResize) {
      var DIV = document.createElement('DIV');
      DIV.className = 'manualColumnResizer';
      DIV.setAttribute('rel', col);
      TH.firstChild.appendChild(DIV);
    }
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
Handsontable.PluginHooks.add('afterGetColHeader', htManualColumnResize.getColHeader);
Handsontable.PluginHooks.add('afterGetColWidth', htManualColumnResize.getColWidth);
