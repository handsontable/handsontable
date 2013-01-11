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
    //background: 'black',
    borderRight: '1px dashed #777'
  });

  $(document).mousemove(function (e) {
    if (pressed) {
      currentWidth = startWidth + (e.pageX - startX);
      currentWidth = Math.max(currentWidth, 20);
      currentWidth = Math.min(currentWidth, 500);
      $line.css('left', startOffset + currentWidth - 1 + 'px');
    }
  });

  $(document).mouseup(function () {
    if (pressed) {
      instance.manualColumnWidths[currentCol] = currentWidth; //save col width
      $('.manualColumnResizer.active').removeClass('active');
      pressed = false;
      instance.forceFullRender = true;
      instance.view.render(); //updates all
      $line.remove();
    }
  });

  this.afterInit = function () {
    var that = this;
    this.manualColumnWidths = [];
    this.rootElement.on('mousedown.handsontable', '.manualColumnResizer', function (e) {
      instance = that;
      var $resizer = $(e.target);
      currentCol = $resizer.attr('rel');
      start = that.rootElement.find('col').eq($resizer.parent().parent().index());
      pressed = true;
      startX = e.pageX;
      startWidth = start.width();
      currentWidth = startWidth;
      $resizer.addClass('active');

      var $table = that.rootElement.find('.htCore');
      $line.appendTo($table.parent()).height($table.height());
      startOffset = parseInt($resizer.parent().parent().offset().left - $table.offset().left);
      $line.css('left', startOffset + startWidth - 1 + 'px');
    });
  }

  this.getColHeader = function (col, response) {
    var prepend = '<div class="relative">';
    var append = ' <div class="manualColumnResizer" rel="' + col + '" style="cursor: col-resize"></div></div>';
    response.html = prepend + response.html + append;
  };

  this.getColWidth = function (col, response) {
    if (this.manualColumnWidths[col]) {
      response.width = this.manualColumnWidths[col];
    }
  };
}
var htManualColumnResize = new HandsontableManualColumnResize();

Handsontable.PluginHooks.push('afterInit', htManualColumnResize.afterInit);
Handsontable.PluginHooks.push('afterGetColHeader', htManualColumnResize.getColHeader);
Handsontable.PluginHooks.push('afterGetColWidth', htManualColumnResize.getColWidth);
