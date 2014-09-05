/**
 * HandsontableManualRowMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the row
 * - guide - the helper guide that shows the desired position as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 * @constructor
 */
(function (Handsontable) {
  function HandsontableManualRowMove() {

    var startRow,
        endRow,
        startY,
        startOffset,
        currentRow,
        currentTH,
        handle = document.createElement('DIV'),
        guide = document.createElement('DIV'),
        $window = $(window);

    handle.className = 'manualRowMover';
    guide.className = 'manualRowMoverGuide';

    var saveManualRowPositions = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowPositions', instance.manualRowPositions);
    };

    var loadManualRowPositions = function () {
      var instance = this,
          storedState = {};
      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowPositions', storedState);
      return storedState.value;
    };

    function setupHandlePosition(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords
      if (row >= 0) { //if not row header
        currentRow = row;
        var box = currentTH.getBoundingClientRect();
        startOffset = box.top;
        handle.style.top = startOffset + 'px';
        handle.style.left = box.left + 'px';
        instance.rootElement[0].appendChild(handle);
      }
    }

    function refreshHandlePosition(TH) {
      var box = TH.getBoundingClientRect();
      handle.style.top = box.top + 'px';
    }

    function setupGuidePosition() {
      var instance = this;
      Handsontable.Dom.addClass(handle, 'active');
      Handsontable.Dom.addClass(guide, 'active');
      var box = currentTH.getBoundingClientRect();
      guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
      guide.style.height = box.height + 'px';
      guide.style.top = startOffset + 'px';
      guide.style.left = handle.style.left;
      instance.rootElement[0].appendChild(guide);
    }

    function refreshGuidePosition(diff) {
      guide.style.top = startOffset + diff + 'px';
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var bindEvents = function () {
      var instance = this;
      var pressed;

      instance.rootElement.on('mouseenter.manualRowMove.' + instance.guid, 'table tbody tr > th', function (e) {
        if (pressed) {
          endRow = instance.view.wt.wtTable.getCoords(e.currentTarget).row;
          refreshHandlePosition(e.currentTarget);
        }
        else {
          setupHandlePosition.call(instance, e.currentTarget);
        }
      });

      instance.rootElement.on('mousedown.manualRowMove.' + instance.guid, '.manualRowMover', function (e) {
        startY = e.pageY;
        setupGuidePosition.call(instance);
        pressed = instance;

        startRow = currentRow;
        endRow = currentRow;
      });

      $window.on('mousemove.manualRowMove.' + instance.guid, function (e) {
        if (pressed) {
          refreshGuidePosition(e.pageY - startY);
        }
      });

      $window.on('mouseup.manualRowMove.' + instance.guid, function () {
        if (pressed) {
          hideHandleAndGuide();
          pressed = false;

          if (startRow < endRow) {
            endRow--;
          }
          createPositionData(instance.manualRowPositions, instance.countRows());
          instance.manualRowPositions.splice(endRow, 0, instance.manualRowPositions.splice(startRow, 1)[0]);

          instance.forceFullRender = true;
          instance.view.render(); //updates all

          saveManualRowPositions.call(instance);

          Handsontable.hooks.run(instance, 'afterRowMove', startRow, endRow);

          setupHandlePosition.call(instance, currentTH);
        }
      });

      instance.addHook('afterDestroy', unbindEvents);
    };

    var unbindEvents = function () {
      var instance = this;
      instance.rootElement.off('mouseenter.manualRowMove.' + instance.guid, 'table tbody tr > th');
      instance.rootElement.off('mousedown.manualRowMove.' + instance.guid, '.manualRowMover');
      $window.off('mousemove.manualRowMove.' + instance.guid);
      $window.off('mouseup.manualRowMove.' + instance.guid);
    };

    var createPositionData = function (positionArr, len) {
      if (positionArr.length < len) {
        for (var i = positionArr.length; i < len; i++) {
          positionArr[i] = i;
        }
      }
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

        if (source === 'afterInit') {
          bindEvents.call(this);
          if (this.manualRowPositions.length > 0) {
            instance.forceFullRender = true;
            instance.render();
          }
        }
      } else {
        unbindEvents.call(this);
        instance.manualRowPositions = [];
      }

    };

    this.modifyRow = function (row) {
      var instance = this;
      if (instance.getSettings().manualRowMove) {
        if (typeof instance.manualRowPositions[row] === 'undefined') {
          createPositionData(this.manualRowPositions, row + 1);
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