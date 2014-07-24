(function (Handsontable) {
  function HandsontableManualRowMove() {

    var pressed,
        startRow,
        endRow,
        startY,
        startOffest,
        moveHandle,
        startOffset,
        scrollTop = 0,
        scrollLeft = 0,
        currentRow;

    var ghost = document.createElement('DIV'),
        ghostStyle = ghost.style;

    ghost.className = 'ghost';
    ghostStyle.position = 'absolute';
    ghostStyle.top = '25px';
    ghostStyle.left = '50px';
    ghostStyle.width = '10px';
    ghostStyle.height = '10px';
    ghostStyle.backgroundColor = '#CCC';
    ghostStyle.opacity = 0.7;

    moveHandle = document.createElement('DIV');
    moveHandle.className = 'manualRowMover';

    var saveManualRowPostions = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowPositions', instance.manualRowPositions);
    };

    var loadManualRowPositions = function () {
      var instance = this,
          storedState = {};

      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowPositions', storedState);

      return storedState.value;
    };

    var refreshMoverPosition = function(TH) {
      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords

      if (row >= 0) { //if not row header
        currentRow = row;

        var rootOffset = Handsontable.Dom.offset(this.rootElement[0]).top;
        var thOffset = Handsontable.Dom.offset(TH).top;
        startOffset = (thOffset - rootOffset) + scrollTop;
        //moveHandle.style.top = startOffset + parseInt(Handsontable.Dom.outerHeight(TH), 10) + 'px';
        moveHandle.style.top = startOffset + 'px';
        moveHandle.style.left = scrollLeft + 'px';
      }
    }

    var bindMoveRowEvents = function () {
      var instance = this;

      instance.rootElement.on('mousemove.manualRowMove', function (e) {
        if (pressed) {
          var top = startOffest + e.pageY - startY + 'px';
          ghostStyle.top = top;
          if (ghostStyle.display === 'none') {
            ghostStyle.display = 'block';
          }
        }
      });

      instance.rootElement.on('mouseup.manualRowMove', function () {
        if (pressed) {
          if (startRow < endRow) {
            endRow--;
          }

          if (instance.getSettings().colHeaders) {
            startRow--;
            endRow--;
          }

          instance.manualRowPositions.splice(endRow, 0, instance.manualRowPositions.splice(startRow, 1)[0]);

          var mover = instance.rootElement[0].querySelector('.manualRowMover.active');
          if (mover) {
            Handsontable.Dom.removeClass(mover, 'active');
          }

          pressed = false;
          instance.forceFullRender = true;
          instance.view.render();
          ghostStyle.display = 'none';

          saveManualRowPostions.call(instance);

          Handsontable.hooks.run(instance, 'afterRowMove', startRow, endRow);
        }
      });

      instance.rootElement.on('mousedown.manualRowMove', '.manualRowMover', function (e) {
        var rowOffset = instance.rowOffset(),
            TH = instance.view.TBODY.querySelectorAll('TH')[currentRow - rowOffset],
            TR = TH.parentNode;

        startRow = parseInt(Handsontable.Dom.index(TR), 10) + 1 + rowOffset;
        endRow = startRow;
        pressed = true;
        startY = e.pageY;

        var TABLE = instance.$table[0];
        TABLE.parentNode.appendChild(ghost);
        ghostStyle.width = Handsontable.Dom.outerWidth(TABLE) + 'px';
        ghostStyle.height = Handsontable.Dom.outerHeight(TH) + 'px';
        startOffest = parseInt(Handsontable.Dom.offset(TH).top - Handsontable.Dom.offset(TABLE).top, 10);

        ghostStyle.top = startOffest + 'px';
        ghostStyle.display = 'none';

      });

      instance.rootElement.on('mouseenter.manualRowMove', 'table tbody th, table tbody td', function (e) {

        if (pressed) {
          var currentTarget = e.currentTarget,
              TR = currentTarget.parentNode,
              rowOffset = instance.rowOffset();

          currentRow = parseInt(Handsontable.Dom.index(TR), 10) + 1 + rowOffset;
          endRow = currentRow;

          var mover = instance.rootElement[0].querySelector('.manualRowMover');
          Handsontable.Dom.addClass(mover, 'active');
        }

        refreshMoverPosition.apply(instance, [e.currentTarget]);
      });

      instance.addHook('afterDestroy', unbindMoveRowEvents);
    };

    var unbindMoveRowEvents = function () {
      var instance = this;
      instance.rootElement.off('mouseup.manualRowMove');
      instance.rootElement.off('mousemove.manualRowMove');
      instance.rootElement.off('mousedown.manualRowMove');
      instance.rootElement.off('mouseenter.manualRowMove');
    };

    this.beforeInit = function () {
      this.manualRowPositions = [];
    };

    this.init = function (source) {
      var instance = this;

      var manualRowMoveEnabled = !!(instance.getSettings().manualRowMove);

      if (manualRowMoveEnabled) {
        var initialManualRowPositions = instance.getSettings().manualRowMove;

        var loadedManualRowPostions = loadManualRowPositions.call(instance);

        if (typeof loadedManualRowPostions != 'undefined') {
          this.manualRowPositions = loadedManualRowPostions;
        } else if(initialManualRowPositions instanceof Array) {
          this.manualRowPositions = initialManualRowPositions;
        } else {
          this.manualRowPositions = [];
        }

        instance.forceFullRender = true;

        if (source === 'afterInit') {
          bindMoveRowEvents.call(this);

          if (this.manualRowPositions.length > 0) {
            instance.forceFullRender = true;
            instance.render();
          }

          Handsontable.hooks.add('afterScrollVertically', afterScrollVertically);
          Handsontable.hooks.add('afterScrollHorizontally', afterScrollHorizontally);

          this.rootElement[0].appendChild(moveHandle);
        }
      } else {
        unbindMoveRowEvents.call(this);
        instance.manualRowPositions = [];
      }

    };

    var afterScrollVertically = function () {
      scrollTop = Handsontable.Dom.getScrollTop(this.rootElement[0]);
    };

    var afterScrollHorizontally = function () {
      scrollLeft = Handsontable.Dom.getScrollLeft(this.rootElement[0]);
    }

    this.modifyRow = function (row) {
      var instance = this;
      if (instance.getSettings().manualRowMove) {
        if (typeof instance.manualRowPositions[row] === 'undefined') {
          instance.manualRowPositions[row] = row;
        }
        return instance.manualRowPositions[row];
      }

      return row;
    };
  }

  var htManualRowMove = new HandsontableManualRowMove();

  Handsontable.hooks.add('beforeInit', htManualRowMove.beforeInit);
  Handsontable.hooks.add('afterInit',  function () {
    htManualRowMove.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowMove.init.call(this, 'afterUpdateSettings');
  });

  Handsontable.hooks.add('modifyRow', htManualRowMove.modifyRow);
  Handsontable.hooks.register('afterRowMove');

})(Handsontable);