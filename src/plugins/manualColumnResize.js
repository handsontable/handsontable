function HandsontableManualColumnResize() {
  var pressed
    , currentCol
    , currentWidth
    , instance
    , start
    , startX
    , startWidth
    , startOffset;

  var resizer, line;

  resizer = document.createElement('DIV');
  resizer.className = 'manualColumnResizer';

  line = document.createElement('DIV');
  line.className = 'manualColumnResizerLine';
  line.style.position ='absolute';
  line.style.top = 0;
  line.style.left = 0;
  line.style.width = 0;
  line.style.borderRight = '1px dashed #777'
  line.appendChild(resizer);

  var $line = $(line);

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

        $line.appendTo($table.parent()).height($table.height());
        startOffset = parseInt($grandpa.offset().left - $table.offset().left, 10);
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
