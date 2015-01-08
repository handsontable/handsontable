/**
 * HandsontableManualColumnResize
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired width of the column
 * - guide - the helper guide that shows the desired width as a vertical guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowResize.js
 * @constructor
 */
(function (Handsontable) {
function HandsontableManualColumnResize() {
  var currentTH
    , currentCol
    , currentWidth
    , instance
    , newSize
    , startX
    , startWidth
    , startOffset
    , handle = document.createElement('DIV')
    , guide = document.createElement('DIV')
    , eventManager = Handsontable.eventManager(this);



  handle.className = 'manualColumnResizer';
  guide.className = 'manualColumnResizerGuide';

  var saveManualColumnWidths = function () {
    var instance = this;
    Handsontable.hooks.run(instance, 'persistentStateSave', 'manualColumnWidths', instance.manualColumnWidths);
  };

  var loadManualColumnWidths = function () {
    var instance = this;
    var storedState = {};
    Handsontable.hooks.run(instance, 'persistentStateLoad', 'manualColumnWidths', storedState);
    return storedState.value;
  };

  function setupHandlePosition(TH) {
    instance = this;
    currentTH = TH;

    var col = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
    if (col >= 0) { //if not row header
      currentCol = col;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.left - 6;
      startWidth = parseInt(box.width, 10);
      handle.style.top = box.top + 'px';
      handle.style.left = startOffset + startWidth + 'px';
      instance.rootElement.appendChild(handle);
    }
  }

  function refreshHandlePosition() {
    handle.style.left = startOffset + currentWidth + 'px';
  }

  function setupGuidePosition() {
    var instance = this;
    Handsontable.Dom.addClass(handle, 'active');
    Handsontable.Dom.addClass(guide, 'active');
    guide.style.top = handle.style.top;
    guide.style.left = handle.style.left;
    guide.style.height = instance.view.maximumVisibleElementHeight(0) + 'px';
    instance.rootElement.appendChild(guide);
  }

  function refreshGuidePosition() {
    guide.style.left = handle.style.left;
  }

  function hideHandleAndGuide() {
    Handsontable.Dom.removeClass(handle, 'active');
    Handsontable.Dom.removeClass(guide, 'active');
  }

  var checkColumnHeader = function (element) {
    if (element.tagName != 'BODY') {
      if (element.parentNode.tagName == 'THEAD') {
        return true;
      } else {
        element = element.parentNode;
        return checkColumnHeader(element);
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

    eventManager.addEventListener(instance.rootElement, 'mouseover',function (e) {
      if (checkColumnHeader(e.target)) {
        var th = getTHFromTargetElement(e.target);
        if (th) {
          if (!pressed) {
            setupHandlePosition.call(instance, th);
          }
        }
      }
    });

    eventManager.addEventListener(instance.rootElement,'mousedown', function (e) {
      if (Handsontable.Dom.hasClass(e.target, 'manualColumnResizer')) {
        setupGuidePosition.call(instance);
        pressed = instance;

        if (autoresizeTimeout == null) {
          autoresizeTimeout = setTimeout(function () {
            if (dblclick >= 2) {
              newSize = instance.determineColumnWidth.call(instance, currentCol);
              setManualSize(currentCol, newSize);
              instance.forceFullRender = true;
              instance.view.render(); //updates all
              Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
            }
            dblclick = 0;
            autoresizeTimeout = null;
          }, 500);
          instance._registerTimeout(autoresizeTimeout);
        }
        dblclick++;

        startX = Handsontable.helper.pageX(e);
        newSize = startWidth;
      }
    });

    eventManager.addEventListener(window,'mousemove', function (e) {
      if (pressed) {
        currentWidth = startWidth + (Handsontable.helper.pageX(e) - startX);
        newSize = setManualSize(currentCol, currentWidth); //save col width
        refreshHandlePosition();
        refreshGuidePosition();
      }
    });

    eventManager.addEventListener(window, 'mouseup', function (){
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;

        if(newSize != startWidth){
          instance.forceFullRender = true;
          instance.view.render(); //updates all

          saveManualColumnWidths.call(instance);

          Handsontable.hooks.run(instance, 'afterColumnResize', currentCol, newSize);
        }

        setupHandlePosition.call(instance, currentTH);
      }
    });

    instance.addHook('afterDestroy', unbindEvents);
  };

  var unbindEvents = function(){
    eventManager.clear();
  };

  this.beforeInit = function () {
    this.manualColumnWidths = [];
  };

  this.init = function (source) {
    var instance = this;
    var manualColumnWidthEnabled = !!(this.getSettings().manualColumnResize);

    if (manualColumnWidthEnabled) {
      var initialColumnWidths = this.getSettings().manualColumnResize;

      var loadedManualColumnWidths = loadManualColumnWidths.call(instance);

      if (typeof loadedManualColumnWidths != 'undefined') {
        this.manualColumnWidths = loadedManualColumnWidths;
      } else if (Array.isArray(initialColumnWidths)) {
        this.manualColumnWidths = initialColumnWidths;
      } else {
        this.manualColumnWidths = [];
      }

      if (source == 'afterInit') {
        bindEvents.call(this);
        if (this.manualColumnWidths.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
      }
    }
    else {
      unbindEvents.call(this);
      this.manualColumnWidths = [];
    }
  };


  var setManualSize = function (col, width) {
    width = Math.max(width, 20);

    /**
     *  We need to run col through modifyCol hook, in case the order of displayed columns is different than the order
     *  in data source. For instance, this order can be modified by manualColumnMove plugin.
     */
    col = Handsontable.hooks.execute(instance, 'modifyCol', col);

    instance.manualColumnWidths[col] = width;
    return width;
  };

  this.modifyColWidth = function (width, col) {
    col = this.runHooksAndReturn('modifyCol', col);
    if (this.getSettings().manualColumnResize && this.manualColumnWidths[col]) {
      return this.manualColumnWidths[col];
    }
    return width;
  };
}
var htManualColumnResize = new HandsontableManualColumnResize();

Handsontable.hooks.add('beforeInit', htManualColumnResize.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnResize.init.call(this, 'afterInit')
});
Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnResize.init.call(this, 'afterUpdateSettings')
});
Handsontable.hooks.add('modifyColWidth', htManualColumnResize.modifyColWidth);

Handsontable.hooks.register('afterColumnResize');

})(Handsontable);
