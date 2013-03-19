function HandsontableManualColumnResize() {
  var pressed
    , currentCol
    , currentWidth
    , instance
    , start
    , startX
    , startWidth
    , startOffset;

  var $line = $('<div class="manualColumnResizerLine"><div class="manualColumnResizer"></div></div>');
  $line.css({
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    borderRight: '1px dashed #777'
  });

  $(document).mousemove(function (e) {
    if (pressed) {
      currentWidth = startWidth + (e.pageX - startX);
      setManualSize(currentCol, currentWidth); //save col width
      $line[0].style.left = startOffset + currentWidth - 1 + 'px';
      if ($line[0].style.display === 'none') {
        $line[0].style.display = 'block';
      }
    }
  });

  $(document).mouseup(function () {
    if (pressed) {
      $('.manualColumnResizer.active').removeClass('active');
      pressed = false;
      instance.forceFullRender = true;
      instance.view.render(); //updates all
      $line[0].style.display = 'none';
    }
  });

  $(document).dblclick(function (e) {
    if ($(e.target).is('.manualColumnResizer')) {
      setManualSize(currentCol, htAutoColumnSize.determineColumnWidth.call(instance, currentCol));
    }
  });

  this.beforeInit = function () {
    this.manualColumnWidths = [];
  };

  this.afterInit = function () {
    if (this.getSettings().manualColumnResize) {
      var that = this;
      this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function (e) {
        instance = that;
        var $resizer = $(e.target);
        currentCol = $resizer.getAttribute('rel');
        start = that.rootElement.find('col').eq($resizer.parent().parent().index());
        pressed = true;
        startX = e.pageX;
        startWidth = start.width();
        currentWidth = startWidth;
        $resizer.addClass('active');

        var $table = that.rootElement.find('.htCore');
        $line.appendTo($table.parent()).height($table.height());
        startOffset = parseInt($resizer.parent().parent().offset().left - $table.offset().left, 10);
        $line[0].style.left = startOffset + currentWidth - 1 + 'px';
      });
    }
  };

  var setManualSize = function (col, width) {
    width = Math.max(width, 20);
    width = Math.min(width, 500);
    instance.manualColumnWidths[col] = width;
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

Handsontable.PluginHooks.push('beforeInit', htManualColumnResize.beforeInit);
Handsontable.PluginHooks.push('afterInit', htManualColumnResize.afterInit);
Handsontable.PluginHooks.push('afterGetColHeader', htManualColumnResize.getColHeader);
Handsontable.PluginHooks.push('afterGetColWidth', htManualColumnResize.getColWidth);
