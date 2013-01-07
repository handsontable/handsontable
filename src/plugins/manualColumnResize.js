function HandsontableManualColumnResize() {
  var pressed
    , currentCol
    , currentWidth
    , instance
    , start
    , startX
    , startWidth;

  $(document).mousemove(function (e) {
    if (pressed) {
      currentWidth = startWidth + (e.pageX - startX);
      $(start).width(currentWidth); //updates col width in DOM
      instance.view.render(); //updates borders only
    }
  });

  $(document).mouseup(function () {
    if (pressed) {
      instance.manualColumnWidths[currentCol] = currentWidth; //save col width
      $('.manualResizer.active').removeClass('active');
      pressed = false;
    }
  });

  this.afterInit = function () {
    var that = this;
    this.manualColumnWidths = [];
    this.rootElement.on('mousedown', '.manualResizer', function (e) {
      instance = that;
      currentCol = $(e.target).attr('rel');
      start = that.rootElement.find('col').eq($(e.target).parent().parent().index());
      pressed = true;
      startX = e.pageX;
      startWidth = start.width();
      currentWidth = startWidth;
      $(e.target).addClass('active');
    });
  }

  this.getColHeader = function (col, response) {
    var prepend = '<div class="relative">';
    var append = ' <div class="manualResizer" rel="' + col + '" style="cursor: col-resize"></div></div>';
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
