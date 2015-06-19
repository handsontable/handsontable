
import * as helper from './../../helpers.js';
import * as dom from './../../dom.js';
import {eventManager as eventManagerObject} from './../../eventManager.js';
import {registerPlugin} from './../../plugins.js';

export {ManualRowMove};

//registerPlugin('manualRowMove', ManualRowMove);

/**
 * HandsontableManualRowMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the row
 * - guide - the helper guide that shows the desired position as a horizontal guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 *
 * @private
 * @class ManualRowMove
 * @plugin ManualRowMove
 */
function ManualRowMove() {

  var startRow,
    endRow,
    startY,
    startOffset,
    currentRow,
    currentTH,
    handle = document.createElement('DIV'),
    guide = document.createElement('DIV'),
    eventManager = eventManagerObject(this);

  handle.className = 'manualRowMover';
  guide.className = 'manualRowMoverGuide';

  var saveManualRowPositions = function() {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualRowPositions', instance.manualRowPositions);
  };

  var loadManualRowPositions = function() {
    var instance = this,
      storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualRowPositions', storedState);
    return storedState.value;
  };

  function setupHandlePosition(TH) {
    var instance = this;
    currentTH = TH;

    var row = this.view.wt.wtTable.getCoords(TH).row; //getCoords returns WalkontableCellCoords
    if (row >= 0) { //if not row header
      currentRow = row;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.top;
      handle.style.top = startOffset + 'px';
      handle.style.left = box.left + 'px';
      instance.rootElement.appendChild(handle);
    }
  }

  function refreshHandlePosition(TH, delta) {
    var box = TH.getBoundingClientRect();
    var handleHeight = 6;
    if (delta > 0) {
      handle.style.top = (box.top + box.height - handleHeight) + 'px';
    } else {
      handle.style.top = box.top + 'px';
    }
  }

  function setupGuidePosition() {
    var instance = this;
    dom.addClass(handle, 'active');
    dom.addClass(guide, 'active');
    var box = currentTH.getBoundingClientRect();
    guide.style.width = instance.view.maximumVisibleElementWidth(0) + 'px';
    guide.style.height = box.height + 'px';
    guide.style.top = startOffset + 'px';
    guide.style.left = handle.style.left;
    instance.rootElement.appendChild(guide);
  }

  function refreshGuidePosition(diff) {
    guide.style.top = startOffset + diff + 'px';
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


    eventManager.addEventListener(instance.rootElement, 'mouseover', function(e) {
      if (checkRowHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (pressed) {
            endRow = instance.view.wt.wtTable.getCoords(th).row;
            refreshHandlePosition(th, endRow - startRow);
          } else {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });

    eventManager.addEventListener(instance.rootElement, 'mousedown', function(e) {
      if (dom.hasClass(e.target, 'manualRowMover')) {
        startY = helper.pageY(e);
        setupGuidePosition.call(instance);
        pressed = instance;

        startRow = currentRow;
        endRow = currentRow;
      }
    });

    eventManager.addEventListener(window, 'mousemove', function(e) {
      if (pressed) {
        refreshGuidePosition(helper.pageY(e) - startY);
      }
    });

    eventManager.addEventListener(window, 'mouseup', function(e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;

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

  var unbindEvents = function() {
    eventManager.clear();
  };

  var createPositionData = function(positionArr, len) {
    if (positionArr.length < len) {
      for (var i = positionArr.length; i < len; i++) {
        positionArr[i] = i;
      }
    }
  };

  this.beforeInit = function() {
    this.manualRowPositions = [];
  };

  this.init = function(source) {
    var instance = this;
    var manualRowMoveEnabled = !! (instance.getSettings().manualRowMove);

    if (manualRowMoveEnabled) {
      var initialManualRowPositions = instance.getSettings().manualRowMove;
      var loadedManualRowPostions = loadManualRowPositions.call(instance);

      // update plugin usages count for manualColumnPositions
      if (typeof instance.manualRowPositionsPluginUsages != 'undefined') {
        instance.manualRowPositionsPluginUsages.push('manualColumnMove');
      } else {
        instance.manualRowPositionsPluginUsages = ['manualColumnMove'];
      }

      if (typeof loadedManualRowPostions != 'undefined') {
        this.manualRowPositions = loadedManualRowPostions;
      } else if (Array.isArray(initialManualRowPositions)) {
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
      var pluginUsagesIndex = instance.manualRowPositionsPluginUsages ? instance.manualRowPositionsPluginUsages.indexOf('manualColumnMove') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        instance.manualRowPositions = [];
        instance.manualRowPositionsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }

  };

  this.modifyRow = function(row) {
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

var htManualRowMove = new ManualRowMove();

Handsontable.hooks.add('beforeInit', htManualRowMove.beforeInit);
Handsontable.hooks.add('afterInit',  function () {
  htManualRowMove.init.call(this, 'afterInit');
});

Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualRowMove.init.call(this, 'afterUpdateSettings');
});

Handsontable.hooks.add('modifyRow', htManualRowMove.modifyRow);
Handsontable.hooks.register('afterRowMove');
