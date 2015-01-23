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
  function HandsontableManualRowResize() {

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
      , eventManager = Handsontable.eventManager(this);

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
        instance.rootElement.appendChild(handle);
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
      instance.rootElement.appendChild(guide);
    }

    function refreshGuidePosition() {
      guide.style.top = handle.style.top;
    }

    function hideHandleAndGuide() {
      Handsontable.Dom.removeClass(handle, 'active');
      Handsontable.Dom.removeClass(guide, 'active');
    }

    var checkRowHeader = function (element) {
      if (element.tagName != 'BODY') {
        if (element.parentNode.tagName == 'TBODY') {
          return true;
        } else {
          element = element.parentNode;
          return checkRowHeader(element);
        }
      }
      return false;
    };

    var getTHFromTargetElement = function (element) {
      if (element.tagName != 'TABLE') {
        if (element.tagName == 'TH') {
          return element;
        } else {
          return getTHFromTargetElement(element.parentNode);
        }
      }
      return null;
    };

    var bindEvents = function () {
      var instance = this;
      var pressed;
      var dblclick = 0;
      var autoresizeTimeout = null;

      eventManager.addEventListener(instance.rootElement, 'mouseover', function (e) {
        if (checkRowHeader(e.target)) {
          var th = getTHFromTargetElement(e.target);
          if (th) {
            if (!pressed) {
              setupHandlePosition.call(instance, th);
            }
          }
        }
      });

      eventManager.addEventListener(instance.rootElement, 'mousedown', function (e) {
        if (Handsontable.Dom.hasClass(e.target, 'manualRowResizer')) {
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

          startY = Handsontable.helper.pageY(e);
          newSize = startHeight;
        }
      });

      eventManager.addEventListener(window, 'mousemove', function (e) {
        if (pressed) {
          currentHeight = startHeight + (Handsontable.helper.pageY(e) - startY);
          newSize = setManualSize(currentRow, currentHeight);
          refreshHandlePosition();
          refreshGuidePosition();
        }
      });

      eventManager.addEventListener(window, 'mouseup', function (e) {
        if (pressed) {
          hideHandleAndGuide();
          pressed = false;

          if (newSize != startHeight) {
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

    var unbindEvents = function () {
      eventManager.clear();
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

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualRowHeightsPluginUsages != 'undefined') {
          instance.manualRowHeightsPluginUsages.push('manualRowResize');
        } else {
          instance.manualRowHeightsPluginUsages = ['manualRowResize'];
        }

        if (typeof loadedManualRowHeights != 'undefined') {
          this.manualRowHeights = loadedManualRowHeights;
        } else if (Array.isArray(initialRowHeights)) {
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
        var pluginUsagesIndex = instance.manualRowHeightsPluginUsages ? instance.manualRowHeightsPluginUsages.indexOf('manualRowResize') : -1;
        if (pluginUsagesIndex > -1) {
          unbindEvents.call(this);
          this.manualRowHeights = [];
          instance.manualRowHeightsPluginUsages[pluginUsagesIndex] = void 0;
        }
      }
    };

    var setManualSize = function (row, height) {
      row = Handsontable.hooks.run(instance, 'modifyRow', row);
      instance.manualRowHeights[row] = height;

      return height;
    };

    this.modifyRowHeight = function (height, row) {
      if (this.getSettings().manualRowResize) {
        row = this.runHooks('modifyRow', row);

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
    htManualRowResize.init.call(this, 'afterUpdateSettings');
  });

  Handsontable.hooks.add('modifyRowHeight', htManualRowResize.modifyRowHeight);

  Handsontable.hooks.register('afterRowResize');

})(Handsontable);
