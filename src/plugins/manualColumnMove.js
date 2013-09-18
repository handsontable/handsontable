function HandsontableManualColumnMove() {
  var instance
    , pressed
    , startCol
    , endCol
    , startX
    , startOffset;

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

  var saveManualColumnPositions = function () {
    var instance = this;

    instance.PluginHooks.run('persistentStateSave', 'manualColumnPositions', instance.manualColumnPositions);
  };

  var loadManualColumnPositions = function () {
    var instance = this;
    var storedState = {};
    instance.PluginHooks.run('persistentStateLoad', 'manualColumnPositions', storedState);

    return storedState.value;
  };


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

        instance.PluginHooks.run('afterColumnMove', startCol, endCol);
      }
    });

    instance.rootElement.on('mousedown.manualColumnMove', '.manualColumnMover', function (e) {

      var mover = e.currentTarget;
      var TH = instance.view.wt.wtDom.closest(mover, 'TH');
      startCol = instance.view.wt.wtDom.index(TH) + instance.colOffset();
      endCol = startCol;
      pressed = true;
      startX = e.pageX;

      var TABLE = instance.$table[0];
      TABLE.parentNode.appendChild(ghost);
      ghostStyle.width = instance.view.wt.wtDom.outerWidth(TH) + 'px';
      ghostStyle.height = instance.view.wt.wtDom.outerHeight(TABLE) + 'px';
      startOffset = parseInt(instance.view.wt.wtDom.offset(TH).left - instance.view.wt.wtDom.offset(TABLE).left, 10);
      ghostStyle.left = startOffset + 6 + 'px';
    });

    instance.rootElement.on('mouseenter.manualColumnMove', 'td, th', function () {
      if (pressed) {
        var active = instance.view.THEAD.querySelector('.manualColumnMover.active');
        if (active) {
          instance.view.wt.wtDom.removeClass(active, 'active');
        }
        endCol = instance.view.wt.wtDom.index(this) + instance.colOffset();
        var THs = instance.view.THEAD.querySelectorAll('th');
        var mover = THs[endCol].querySelector('.manualColumnMover');
        instance.view.wt.wtDom.addClass(mover, 'active');
      }
    });

    instance.addHook('afterDestroy', unbindMoveColEvents);
  };

  var unbindMoveColEvents = function(){
    var instance = this;
    instance.rootElement.off('mouseup.manualColumnMove');
    instance.rootElement.off('mousemove.manualColumnMove');
    instance.rootElement.off('mousedown.manualColumnMove');
    instance.rootElement.off('mouseenter.manualColumnMove');
  }

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

      }

    } else {
      unbindMoveColEvents.call(this);
      this.manualColumnPositions = [];
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

Handsontable.PluginHooks.add('beforeInit', htManualColumnMove.beforeInit);
Handsontable.PluginHooks.add('afterInit', function () {
  htManualColumnMove.init.call(this, 'afterInit')
});

Handsontable.PluginHooks.add('afterUpdateSettings', function () {
  htManualColumnMove.init.call(this, 'afterUpdateSettings')
});
Handsontable.PluginHooks.add('afterGetColHeader', htManualColumnMove.getColHeader);
Handsontable.PluginHooks.add('modifyCol', htManualColumnMove.modifyCol);
