function HandsontableManualColumnMove() {
  var instance
    , pressed
    , startCol
    , endCol
    , startX
    , startOffset;

  var $ghost = $('<div class="ghost"></div>');
  $ghost.css({
    position: 'absolute',
    top: '25px',
    left: 0,
    width: '10px',
    height: '10px',
    backgroundColor: '#CCC',
    opacity: 0.7
  });

  $(document).mousemove(function (e) {
    if (pressed) {
      $ghost[0].style.left = startOffset + e.pageX - startX + 6 + 'px';
      if ($ghost[0].style.display === 'none') {
        $ghost[0].style.display = 'block';
      }
    }
  });

  $(document).mouseup(function () {
    if (pressed) {
      if (startCol < endCol) {
        endCol--;
      }
      if (instance.getSettings().rowHeaders) {
        startCol--;
        endCol--;
      }
      instance.manualColumnPositions.splice(endCol, 0, instance.manualColumnPositions.splice(startCol, 1)[0]);
      $('.manualColumnMover.active').removeClass('active');
      pressed = false;
      instance.forceFullRender = true;
      instance.view.render(); //updates all
      $ghost[0].style.display = 'none';
    }
  });

  this.beforeInit = function () {
    this.manualColumnPositions = [];
  };

  this.afterInit = function () {
    if (this.getSettings().manualColumnMove) {
      var that = this;
      this.rootElement.on('mousedown.handsontable', '.manualColumnMover', function (e) {
        instance = that;

        var $resizer = $(e.target);
        var th = $resizer.closest('th');
        startCol = th.index();
        pressed = true;
        startX = e.pageX;

        var $table = that.rootElement.find('.htCore');
        $ghost.appendTo($table.parent());
        $ghost.width($resizer.parent().width());
        $ghost.height($table.height());
        startOffset = parseInt(th.offset().left - $table.offset().left);
        $ghost[0].style.left = startOffset + 6 + 'px';
      });
      this.rootElement.on('mouseenter.handsontable', 'td, th', function (e) {
        if (pressed) {
          $('.manualColumnMover.active').removeClass('active');
          var $ths = that.rootElement.find('thead th');
          endCol = $(this).index();
          var $hover = $ths.eq(endCol).find('.manualColumnMover').addClass('active');
          $ths.not($hover).removeClass('active');
        }
      });
    }
  };

  this.modifyCol = function (col) {
    //TODO test performance: http://jsperf.com/object-wrapper-vs-primitive/2
    if (this.getSettings().manualColumnMove) {
      if (typeof this.manualColumnPositions[col] === 'undefined') {
        this.manualColumnPositions[col] = col;
      }
      return this.manualColumnPositions[col];
    }
    return col;
  };

  this.getColHeader = function (col, TH) {
    if (this.getSettings().manualColumnMove) {
      var DIV = document.createElement('DIV');
      DIV.className = 'manualColumnMover';
      TH.firstChild.appendChild(DIV);
    }
  };
}
var htManualColumnMove = new HandsontableManualColumnMove();

Handsontable.PluginHooks.push('beforeInit', htManualColumnMove.beforeInit);
Handsontable.PluginHooks.push('afterInit', htManualColumnMove.afterInit);
Handsontable.PluginHooks.push('afterGetColHeader', htManualColumnMove.getColHeader);
Handsontable.PluginModifiers.push('col', htManualColumnMove.modifyCol);
