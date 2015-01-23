/**
 * HandsontableManualColumnMove
 *
 * Has 2 UI components:
 * - handle - the draggable element that sets the desired position of the column
 * - guide - the helper guide that shows the desired position as a vertical guide
 *
 * Warning! Whenever you make a change in this file, make an analogous change in manualRowMove.js
 * @constructor
 */
(function (Handsontable) {
function HandsontableManualColumnMove() {
  var startCol
    , endCol
    , startX
    , startOffset
    , currentCol
    , instance
    , currentTH
    , handle = document.createElement('DIV')
    , guide = document.createElement('DIV')
    , eventManager = Handsontable.eventManager(this);

  handle.className = 'manualColumnMover';
  guide.className = 'manualColumnMoverGuide';

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

  function setupHandlePosition(TH) {
    instance = this;
    currentTH = TH;

    var col = this.view.wt.wtTable.getCoords(TH).col; //getCoords returns WalkontableCellCoords
    if (col >= 0) { //if not row header
      currentCol = col;
      var box = currentTH.getBoundingClientRect();
      startOffset = box.left;
      handle.style.top = box.top + 'px';
      handle.style.left = startOffset + 'px';
      instance.rootElement.appendChild(handle);
    }
  }

  function refreshHandlePosition(TH, delta) {
    var box = TH.getBoundingClientRect();
    var handleWidth = 6;
    if (delta > 0) {
      handle.style.left = (box.left + box.width - handleWidth) + 'px';
    }
    else {
      handle.style.left = box.left + 'px';
    }
  }

  function setupGuidePosition() {
    var instance = this;
    Handsontable.Dom.addClass(handle, 'active');
    Handsontable.Dom.addClass(guide, 'active');
    var box = currentTH.getBoundingClientRect();
    guide.style.width = box.width + 'px';
    guide.style.height = instance.view.maximumVisibleElementHeight(0) + 'px';
    guide.style.top = handle.style.top;
    guide.style.left = startOffset + 'px';
    instance.rootElement.appendChild(guide);
  }

  function refreshGuidePosition(diff) {
    guide.style.left = startOffset + diff + 'px';
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

    eventManager.addEventListener(instance.rootElement,'mouseover',function (e) {
        if (checkColumnHeader(e.target)){
          var th = getTHFromTargetElement(e.target);
          if (th) {
            if (pressed) {
              var col = instance.view.wt.wtTable.getCoords(th).col;
        		if(col >= 0) { //not TH above row header
          			endCol = col;
          			refreshHandlePosition(e.target, endCol - startCol);
        		}
            }
            else {
              setupHandlePosition.call(instance, th);
            }
          }
        }
    });

    eventManager.addEventListener(instance.rootElement,'mousedown', function (e) {
      if (Handsontable.Dom.hasClass(e.target, 'manualColumnMover')){
        startX = Handsontable.helper.pageX(e);
        setupGuidePosition.call(instance);
        pressed = instance;

        startCol = currentCol;
        endCol = currentCol;
      }
    });

    eventManager.addEventListener(window,'mousemove',function (e) {
      if (pressed) {
        refreshGuidePosition(Handsontable.helper.pageX(e) - startX);
      }
    });


    eventManager.addEventListener(window,'mouseup',function (e) {
      if (pressed) {
        hideHandleAndGuide();
        pressed = false;

        createPositionData(instance.manualColumnPositions, instance.countCols());
        instance.manualColumnPositions.splice(endCol, 0, instance.manualColumnPositions.splice(startCol, 1)[0]);

        instance.forceFullRender = true;
        instance.view.render(); //updates all

        saveManualColumnPositions.call(instance);

        Handsontable.hooks.run(instance, 'afterColumnMove', startCol, endCol);

        setupHandlePosition.call(instance, currentTH);
      }
    });

    instance.addHook('afterDestroy', unbindEvents);
  };

  var unbindEvents = function(){
    eventManager.clear();
  };

  var createPositionData = function (positionArr, len) {
    if (positionArr.length < len) {
      for (var i = positionArr.length; i < len; i++) {
        positionArr[i] = i;
      }
    }
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
      } else if (Array.isArray(initialManualColumnPositions)) {
        this.manualColumnPositions = initialManualColumnPositions;
      } else {
        this.manualColumnPositions = [];
      }

      if (source == 'afterInit') {

        // update plugin usages count for manualColumnPositions
        if (typeof instance.manualColumnPositionsPluginUsages != 'undefined') {
          instance.manualColumnPositionsPluginUsages.push('manualColumnMove');
        } else {
          instance.manualColumnPositionsPluginUsages = ['manualColumnMove'];
        }

        bindEvents.call(this);
        if (this.manualColumnPositions.length > 0) {
          this.forceFullRender = true;
          this.render();
        }
      }

    } else {
      var pluginUsagesIndex = instance.manualColumnPositionsPluginUsages ? instance.manualColumnPositionsPluginUsages.indexOf('manualColumnMove') : -1;
      if (pluginUsagesIndex > -1) {
        unbindEvents.call(this);
        this.manualColumnPositions = [];
        instance.manualColumnPositionsPluginUsages[pluginUsagesIndex] = void 0;
      }
    }
  };

  this.modifyCol = function (col) {
    //TODO test performance: http://jsperf.com/object-wrapper-vs-primitive/2
    if (this.getSettings().manualColumnMove) {
      if (typeof this.manualColumnPositions[col] === 'undefined') {
        createPositionData(this.manualColumnPositions, col + 1);
      }
      return this.manualColumnPositions[col];
    }
    return col;
  };

  // need to reconstruct manualcolpositions after removing columns
  this.afterRemoveCol = function (index, amount) {
    if (!this.getSettings().manualColumnMove) {
      return;
    }

    var rmindx,
        colpos = this.manualColumnPositions;

      // We have removed columns, we also need to remove the indicies from manual column array
      rmindx = colpos.splice(index, amount);

      // We need to remap manualColPositions so it remains constant linear from 0->ncols
      colpos = colpos.map(function (colpos) {
        var i, newpos = colpos;

       for (i = 0; i < rmindx.length; i++) {
         if (colpos > rmindx[i]) {
           newpos--;
         }
       }

       return newpos;
     });

      this.manualColumnPositions = colpos;
    };

    // need to reconstruct manualcolpositions after adding columns
    this.afterCreateCol = function (index, amount) {
      if (!this.getSettings().manualColumnMove) {
        return;
      }

      var colpos = this.manualColumnPositions;
      if (!colpos.length) {
        return;
      }

      var addindx = [];
      for (var i = 0; i < amount; i++) {
        addindx.push(index + i);
      }

      if (index >= colpos.length) {
        colpos.concat(addindx);
      }
      else {
        // We need to remap manualColPositions so it remains constant linear from 0->ncols
        colpos = colpos.map(function (colpos) {
          return (colpos >= index) ? (colpos + amount) : colpos;
        });

        // We have added columns, we also need to add new indicies to manualcolumn position array
        colpos.splice.apply(colpos, [index, 0].concat(addindx));
      }

      this.manualColumnPositions = colpos;
    };
}
var htManualColumnMove = new HandsontableManualColumnMove();

Handsontable.hooks.add('beforeInit', htManualColumnMove.beforeInit);
Handsontable.hooks.add('afterInit', function () {
  htManualColumnMove.init.call(this, 'afterInit');
});

Handsontable.hooks.add('afterUpdateSettings', function () {
  htManualColumnMove.init.call(this, 'afterUpdateSettings');
});
Handsontable.hooks.add('modifyCol', htManualColumnMove.modifyCol);

Handsontable.hooks.add('afterRemoveCol', htManualColumnMove.afterRemoveCol);
Handsontable.hooks.add('afterCreateCol', htManualColumnMove.afterCreateCol);
Handsontable.hooks.register('afterColumnMove');

})(Handsontable);


