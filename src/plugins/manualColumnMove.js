function HandsontableManualColumnMove() {
  var pressed
    , startCol
    , endCol
    , startX
    , startOffset
    , moveHandle
    , scrollLeft
    , scrollTop
    , currentCol;

  var ghost = document.createElement('DIV')
    , ghostStyle = ghost.style;

  ghost.className = 'ghost';
  ghostStyle.position = 'absolute';
  ghostStyle.top = '25px';
  ghostStyle.left = 0;
  ghostStyle.width = '10px';
  ghostStyle.height = '10px';
  ghostStyle.backgroundColor = '#CCC';
  ghostStyle.opacity = 0.7;

  moveHandle = document.createElement('DIV');
  moveHandle.className = 'manualColumnMover';
  // moveHandle.style.border = "1px solid red";

  var saveManualColumnPositions = function () {
    var instance = this;

    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnPositions', instance.manualColumnPositions);
  };

  var loadManualColumnPositions = function () {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnPositions', storedState);

    return storedState.value;
  };

  function refreshHandlePosition(TH) {
    instance = this;

    var colId = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
    if (colId > 0) { //if not row header
      var rootOffset = Handsontable.Dom.offset(this.rootElement[0]).left,
      thOffset = Handsontable.Dom.offset(TH).left,
      startOffset = (thOffset - rootOffset) + scrollLeft;
      moveHandle.style.left = startOffset + 'px';
      moveHandle.style.top = scrollTop + 'px';
    }
  }

  var bindMoveColEvents = function () {
    var instance = this;

    instance.rootElement.on('mousemove.manualColumnMove', function (e) {
      if (pressed) {
        ghostStyle.left = startOffset + e.pageX - startX + 6 + 'px';
        if (ghostStyle.display === 'none') {
          ghostStyle.display = 'block';
        }
      }
    });

    instance.rootElement.on('mouseup.manualColumnMove', function () {
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
        ghostStyle.display = 'none';

        saveManualColumnPositions.call(instance);

        Handsontable.hooks.run(instance, 'afterColumnMove', startCol, endCol);
      }
    });

    instance.rootElement.on('mousedown.manualColumnMove', '.manualColumnMover', function (e) {

      var mover = e.currentTarget,
          TH = instance.view.THEAD.querySelectorAll('th')[currentCol];

      startCol = Handsontable.Dom.index(TH) + instance.colOffset();
      endCol = startCol;
      pressed = true;
      startX = e.pageX;

      var TABLE = instance.$table[0];
      TABLE.parentNode.appendChild(ghost);
      ghostStyle.width = Handsontable.Dom.outerWidth(TH) + 'px';
      ghostStyle.height = Handsontable.Dom.outerHeight(TABLE) + 'px';
      startOffset = parseInt(Handsontable.Dom.offset(TH).left - Handsontable.Dom.offset(TABLE).left, 10);
      ghostStyle.left = startOffset + 6 + 'px';
      ghostStyle.display = 'none';
    });

    instance.rootElement.on('mouseenter.manualColumnMove', 'td, th', function (e) {
      var currentColId = Handsontable.Dom.index(this) + instance.colOffset();
          currentCol = currentColId;

      if (pressed) {
        var active = instance.view.THEAD.querySelector('.manualColumnMover.active');
        if (active) {
          Handsontable.Dom.removeClass(active, 'active');
        }
        endCol = currentColId;
        var mover = instance.rootElement[0].querySelector('.manualColumnMover');
        Handsontable.Dom.addClass(mover, 'active');
      }
        refreshHandlePosition.apply(instance,[e.currentTarget]);

    });

    instance.addHook('afterDestroy', unbindMoveColEvents);
  };

  var unbindMoveColEvents = function(){
    var instance = this;
    instance.rootElement.off('mouseup.manualColumnMove');
    instance.rootElement.off('mousemove.manualColumnMove');
    instance.rootElement.off('mousedown.manualColumnMove');
    instance.rootElement.off('mouseenter.manualColumnMove');
  };

  this.beforeInit = function () {
    this.manualColumnPositions = [];
  };

  this.init = function (source) {
    var instance = this;

    var manualColMoveEnabled = !!(this.getSettings().manualColumnMove);

    if (manualColMoveEnabled) {
      var initialManualColumnPositions = this.getSettings().manualColumnMove;

      var loadedManualColumnPositions = loadManualColumnPositions.call(instance);

      if (typeof loadedManualColumnPositions != 'undefined') {
        this.manualColumnPositions = loadedManualColumnPositions;
      } else if (initialManualColumnPositions instanceof Array) {
        this.manualColumnPositions = initialManualColumnPositions;
      } else {
        this.manualColumnPositions = [];
      }


      instance.forceFullRender = true;

      if (source == 'afterInit') {
        bindMoveColEvents.call(this);
        if (this.manualColumnPositions.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
        this.rootElement[0].appendChild(moveHandle);
        Handsontable.hooks.add('afterRender', afterRender);
      }

    } else {
      unbindMoveColEvents.call(this);
      this.manualColumnPositions = [];
    }
  };

  var afterRender = function () {
    var instance = this;
    scrollTop = instance.rootElement.scrollTop();
    scrollLeft = instance.rootElement.scrollLeft();
    currentCol = 0;
  }

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

}
var htManualColumnMove = new HandsontableManualColumnMove();

Handsontable.hooks.add('beforeInit', htManualColumnMove.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnMove.init.call(this, 'afterInit')
});

Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnMove.init.call(this, 'afterUpdateSettings')
});
// Handsontable.hooks.add('afterGetColHeader', htManualColumnMove.getColHeader);
Handsontable.hooks.add('modifyCol', htManualColumnMove.modifyCol);

Handsontable.hooks.register('afterColumnMove');
