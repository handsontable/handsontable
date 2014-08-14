/**
 * HandsontableManualRowResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired height of the row
 * - guide - the helper guide that shows the desired height as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 * @constructor
 */
(function (Handsontable) {
  function HandsontableManualRowResize () {

    var currentTH
      , currentRow
      , currentHeight
      , instance
      , newSize
      , startY
      , startHeight
      , startOffset
      , handle = document.createElement('DIV')
      , guide = document.createElement('DIV')
      , $window = $(window);

    handle.className = 'manualRowResizer';
    guide.className = 'manualRowResizerGuide';

    var saveManualRowHeights = function () {
      var instance = this;
      Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowHeights', instance.manualRowHeights);
    };

    var loadManualRowHeights = function () {
      var instance = this
        , storedState = {};
      Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowHeights', storedState);
      return storedState.value;
    };

    function setupHandlePosition(TH) {
      instance = this;
      currentTH = TH;

      var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords
      if (row >= 0) { //if not col header
        currentRow = row;
        var box = currentTH.getBoundingClientRect();
        startOffset = box.top - 6;
        startHeight = parseInt(box.height, 10);
        handle.style.left = box.left + 'px';
        handle.style.top = startOffset + startHeight + 'px';
        instance.rootElement[0].appendChild(handle);
      }
    }

    function refreshHandlePosition() {
      handle.style.top = startOffset + currentHeight + 'px';
    }

    function setupGuidePosition() {
      var instance = this;
      Handsontable.Dom.addClass(handle, 'active');
      Handsontable.Dom.addClass(guide, 'active');
      guide.style.top = handle.style.top;
      guide.style.left = handle.style.left;
      guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
      instance.rootElement[0].appendChild(guide);
    }

    function refreshGuidePosition() {
      guide.style.top = handle.style.top;
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var bindEvents = function () {
      var instance = this;
      var pressed;
      var dblclick = 0;
      var autoresizeTimeout = null;

      instance.rootElement.on('mouseenter.manualRowResize.' + instance.guid, 'table tbody tr > th', function (e) {
        if (!pressed) {
          setupHandlePosition.call(instance, e.currentTarget);
        }
      });

      instance.rootElement.on('mousedown.manualRowResize.' + instance.guid, '.manualRowResizer', function (e) {
        setupGuidePosition.call(instance);
        pressed = instance;

        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function () {
            if (dblclick >= 2) {
              setManualSize(currentRow, null); //double click sets auto row size
              instance.forceFullRender = true;
              instance.view.render(); //updates all
              Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
            }
            dblclick = 0;
            autoresizeTimeout = null;
          }, 500);
          instance._registerTimeout(autoresizeTimeout);
        }
        dblclick++;

        startY = e.pageY;
        newSize = startHeight;
      });

      $window.on('mousemove.manualRowResize.' + instance.guid, function (e) {
        if (pressed) {
          currentHeight = startHeight + (e.pageY - startY);
          newSize = setManualSize(currentRow, currentHeight);
          refreshHandlePosition();
          refreshGuidePosition();
        }
      });

      $window.on('mouseup.manualRowResize.' + instance.guid, function () {
        if (pressed) {
          hideHandleAndGuide();
          pressed = false;

          if(newSize != startHeight){
            instance.forceFullRender = true;
            instance.view.render(); //updates all

            saveManualRowHeights.call(instance);

            Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize);
          }

          setupHandlePosition.call(instance, currentTH);
        }
      });

      instance.addHook('afterDestroy', unbindEvents);
    };

    var unbindEvents = function(){
      var instance = this;
      instance.rootElement.off('mouseenter.manualRowResize.' + instance.guid, 'table tbody tr > th');
      instance.rootElement.off('mousedown.manualRowResize.' + instance.guid, '.manualRowResizer');
      $window.off('mousemove.manualRowResize.' + instance.guid);
      $window.off('mouseup.manualRowResize.' + instance.guid);
    };

    this.beforeInit = function () {
      this.manualRowHeights = [];
    };

    this.init = function (source) {

      var instance = this;
      var manualColumnHeightEnabled = !!(this.getSettings().manualRowResize);

      if (manualColumnHeightEnabled) {

        var initialRowHeights = this.getSettings().manualRowResize;

        var loadedManualRowHeights = loadManualRowHeights.call(instance);

        if (typeof loadedManualRowHeights != 'undefined') {
          this.manualRowHeights = loadedManualRowHeights;
        } else if (initialRowHeights instanceof Array) {
          this.manualRowHeights = initialRowHeights;
        } else {
          this.manualRowHeights = [];
        }

        if (source === 'afterInit') {
          bindEvents.call(this);
          if (this.manualRowHeights.length > 0) {
            this.forceFullRender = true;
            this.render();
          }
        }
        else {
          this.forceFullRender = true;
          this.render();

        }
      }
      else {
        unbindEvents.call(this);
        this.manualRowHeights = [];
      }
    };

    var setManualSize = function (row, height) {
      row = Handsontable.hooks.execute(instance, 'modifyRow', row);

      instance.manualRowHeights[row] = height;
      return height;
    };

    this.modifyRowHeight = function (height, row) {
      if (this.getSettings().manualRowResize) {
        row = this.runHooksAndReturn('modifyRow', row);
        if (this.manualRowHeights[row] !== void 0) {
          return this.manualRowHeights[row];
        }
      }
      return height;
    };
  }

  var htManualRowResize = new HandsontableManualRowResize();

  Handsontable.hooks.add('beforeInit', htManualRowResize.beforeInit);
  Handsontable.hooks.add('afterInit', function () {
    htManualRowResize.init.call(this, 'afterInit');
  });

  Handsontable.hooks.add('afterUpdateSettings', function () {
    htManualRowResize.init.call(this, 'afterUpdateSettings')
  });

  Handsontable.hooks.add('modifyRowHeight', htManualRowResize.modifyRowHeight);

  Handsontable.hooks.register('afterRowResize');

})(Handsontable);
