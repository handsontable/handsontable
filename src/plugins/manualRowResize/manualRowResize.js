
import * as helper from './../../helpers.js';
import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {registerPlugin} from './../../plugins.js';

export {ManualRowResize};

//registerPlugin('manualRowResize', ManualRowResize);

/**
 * HandsontableManualRowResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired height of the row
 * - guide - the helper guide that shows the desired height as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 *
 * @private
 * @class ManualRowResize
 * @plugin ManualRowResize
 */
function ManualRowResize() {

  var currentTH, currentRow, currentHeight, instance, newSize, startY, startHeight, startOffset, handle = document.createElement('DIV'),
    guide = document.createElement('DIV'),
    eventManager = eventManagerObject(this);

  handle.className = 'manualRowResizer';
  guide.className = 'manualRowResizerGuide';

  var saveManualRowHeights = function() {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowHeights', instance.manualRowHeights);
  };

  var loadManualRowHeights = function() {
    var instance = this,
      storedState = {};
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
    dom.addClass(handle, 'active');
    dom.addClass(guide, 'active');
    guide.style.top = handle.style.top;
    guide.style.left = handle.style.left;
    guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
    instance.rootElement.appendChild(guide);
  }

  function refreshGuidePosition() {
    guide.style.top = handle.style.top;
  }

  function hideHandleAndGuide() {
    dom.removeClass(handle, 'active');
    dom.removeClass(guide, 'active');
  }

  var checkRowHeader = function(element) {
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

  var getTHFromTargetElement = function(element) {
    if (element.tagName != 'TABLE') {
      if (element.tagName == 'TH') {
        return element;
      } else {
        return getTHFromTargetElement(element.parentNode);
      }
    }
    return null;
  };

  var bindEvents = function() {
    var instance = this;
    var pressed;
    var dblclick = 0;
    var autoresizeTimeout = null;

    eventManager.addEventListener(instance.rootElement, 'mouseover', function(e) {
      if (checkRowHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (!pressed) {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });

    eventManager.addEventListener(instance.rootElement, 'mousedown', function(e) {
      if (dom.hasClass(e.target, 'manualRowResizer')) {
        setupGuidePosition.call(instance);
        pressed = instance;

        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function() {
            if (dblclick >= 2) {
              var hookNewSize = Handsontable.hooks.run(instance, 'beforeRowResize', currentRow, newSize, true);

              if (hookNewSize !== void 0) {
                newSize = hookNewSize;
              }
              setManualSize(currentRow, newSize); //double click sets auto row size
              instance.forceFullRender = true;
              instance.view.render(); //updates all
              Handsontable.hooks.run(instance, 'afterRowResize', currentRow, newSize, true);
            }
            dblclick = 0;
            autoresizeTimeout = null;
          }, 500);
          instance._registerTimeout(autoresizeTimeout);
        }
        dblclick++;

        startY = helper.pageY(e);
        newSize = startHeight;
      }
    });

    eventManager.addEventListener(window, 'mousemove', function(e) {
      if (pressed) {
        currentHeight = startHeight + (helper.pageY(e) - startY);
        newSize = setManualSize(currentRow, currentHeight);
        refreshHandlePosition();
        refreshGuidePosition();
      }
    });

    eventManager.addEventListener(window, 'mouseup', function(e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;

        if (newSize != startHeight) {
          Handsontable.hooks.run(instance, 'beforeRowResize', currentRow, newSize);

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

  var unbindEvents = function() {
    eventManager.clear();
  };

  this.init = function(source) {
    this.manualRowHeights = [];
    var instance = this;
    var manualColumnHeightEnabled = !! (this.getSettings().manualRowResize);

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

      if (source === void 0) {
        bindEvents.call(this);
      }
    } else {
      var pluginUsagesIndex = instance.manualRowHeightsPluginUsages ? instance.manualRowHeightsPluginUsages.indexOf('manualRowResize') : -1;

      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        this.manualRowHeights = [];
        instance.manualRowHeightsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  };

  var setManualSize = function(row, height) {
    row = Handsontable.hooks.run(instance, 'modifyRow', row);
    instance.manualRowHeights[row] = height;

    return height;
  };

  this.modifyRowHeight = function(height, row) {
    if (this.getSettings().manualRowResize) {
      row = this.runHooks('modifyRow', row);

      if (this.manualRowHeights[row] !== void 0) {
        return this.manualRowHeights[row];
      }
    }

    return height;
  };
}

var htManualRowResize = new ManualRowResize();

Handsontable.hooks.add('init', htManualRowResize.init);
Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualRowResize.init.call(this, 'afterUpdateSettings');
});

Handsontable.hooks.add('modifyRowHeight', htManualRowResize.modifyRowHeight);

Handsontable.hooks.register('beforeRowResize');
Handsontable.hooks.register('afterRowResize');
