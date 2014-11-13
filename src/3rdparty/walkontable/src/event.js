function WalkontableEvent(instance) {
  var that = this;

  var eventManager = Handsontable.eventManager(instance);

  //reference to instance
  this.instance = instance;

  var dblClickOrigin = [null, null];
  this.dblClickTimeout = [null, null];

  var onMouseDown = function (event) {
    var cell = that.parentCell(event.target);
    if (Handsontable.Dom.hasClass(event.target, 'corner')) {
      that.instance.getSetting('onCellCornerMouseDown', event, event.target);
    }
    else if (cell.TD) {
      if (that.instance.hasSetting('onCellMouseDown')) {
        that.instance.getSetting('onCellMouseDown', event, cell.coords, cell.TD, that.instance);
      }
    }

    if (event.button !== 2) { //if not right mouse button
      if (cell.TD) {
        dblClickOrigin[0] = cell.TD;
        clearTimeout(that.dblClickTimeout[0]);
        that.dblClickTimeout[0] = setTimeout(function () {
          dblClickOrigin[0] = null;
        }, 1000);
      }
    }
  };

  var onTouchMove = function (event) {
    that.instance.touchMoving = true;
  };

  var longTouchTimeout;

  var onTouchStart = function (event) {
    var container = this;
    this.addEventListener("touchmove", onTouchMove, false);

    // touch-and-hold event
    //longTouchTimeout = setTimeout(function () {
    //  if(!that.instance.touchMoving) {
    //    that.instance.longTouch = true;
    //
    //    var targetCoords = Handsontable.Dom.offset(event.target);
    //    var contextMenuEvent = new MouseEvent('contextmenu', {
    //      clientX: targetCoords.left + event.target.offsetWidth,
    //      clientY: targetCoords.top + event.target.offsetHeight,
    //      button: 2
    //    });
    //
    //    that.instance.wtTable.holder.parentNode.parentNode.dispatchEvent(contextMenuEvent);
    //  }
    //},200);

    // Prevent cell selection when scrolling with touch event - not the best solution performance-wise
    setTimeout(function () {
      if (that.instance.touchMoving == true) {
        that.instance.touchMoving = void 0;

        container.removeEventListener("touchmove", onTouchMove, false);

        return;
      } else {
        onMouseDown(event);
      }
    }, 30);

    //$(that.instance.wtTable.holder).off('mousedown');
    that.instance.wtTable.holder.removeEventListener("mousedown");
  };

  var lastMouseOver;
  var onMouseOver = function (event) {
    if (that.instance.hasSetting('onCellMouseOver')) {
      var TABLE = that.instance.wtTable.TABLE;
      var TD = Handsontable.Dom.closest(event.target, ['TD', 'TH'], TABLE);
      if (TD && TD !== lastMouseOver && Handsontable.Dom.isChildOf(TD, TABLE)) {
        lastMouseOver = TD;
        that.instance.getSetting('onCellMouseOver', event, that.instance.wtTable.getCoords(TD), TD, that.instance);
      }
    }
  };

  /*  var lastMouseOut;
   var onMouseOut = function (event) {
   if (that.instance.hasSetting('onCellMouseOut')) {
   var TABLE = that.instance.wtTable.TABLE;
   var TD = Handsontable.Dom.closest(event.target, ['TD', 'TH'], TABLE);
   if (TD && TD !== lastMouseOut && Handsontable.Dom.isChildOf(TD, TABLE)) {
   lastMouseOut = TD;
   if (TD.nodeName === 'TD') {
   that.instance.getSetting('onCellMouseOut', event, that.instance.wtTable.getCoords(TD), TD);
   }
   }
   }
   };*/

  var onMouseUp = function (event) {
    if (event.button !== 2) { //if not right mouse button
      var cell = that.parentCell(event.target);

      if (cell.TD === dblClickOrigin[0] && cell.TD === dblClickOrigin[1]) {
        if (Handsontable.Dom.hasClass(event.target, 'corner')) {
          that.instance.getSetting('onCellCornerDblClick', event, cell.coords, cell.TD, that.instance);
        }
        else {
          that.instance.getSetting('onCellDblClick', event, cell.coords, cell.TD, that.instance);
        }

        dblClickOrigin[0] = null;
        dblClickOrigin[1] = null;
      }
      else if (cell.TD === dblClickOrigin[0]) {
        dblClickOrigin[1] = cell.TD;
        clearTimeout(that.dblClickTimeout[1]);
        that.dblClickTimeout[1] = setTimeout(function () {
          dblClickOrigin[1] = null;
        }, 500);
      }
    }
  };


  var onTouchEnd = function (event) {
    clearTimeout(longTouchTimeout);
    that.instance.longTouch == void 0;

    event.preventDefault();
    onMouseUp(event);

    //$(that.instance.wtTable.holder).off('mouseup');
    that.instance.wtTable.holder.removeEventListener("mouseup");
  };


  eventManager.addEventListener(this.instance.wtTable.holder, 'mousedown', onMouseDown);

  eventManager.addEventListener(this.instance.wtTable.TABLE, 'mouseover', onMouseOver);

  eventManager.addEventListener(this.instance.wtTable.holder, 'mouseup', onMouseUp);


  if(this.instance.wtTable.holder.parentNode.parentNode && Handsontable.mobileBrowser) { // check if full HOT instance, or detached WOT
    var classSelector = "." + this.instance.wtTable.holder.parentNode.className.split(" ").join(".");
    var queryParents = function (elem) {
      var level = 0
        , queriedParent = document.querySelector(classSelector)
        , parent = elem.parentNode;

      while(level < 8 && parent != queriedParent) {
        parent = parent.parentNode;
        level++;
      }

      return parent == queriedParent;
    };

    eventManager.addEventListener(this.instance.wtTable.holder.parentNode.parentNode, 'touchstart', function (event) {
      that.instance.touchApplied = true;
      if (queryParents(event.target)) {
        onTouchStart.call(event.target, event);
      }
    });
    eventManager.addEventListener(this.instance.wtTable.holder.parentNode.parentNode, 'touchend', function (event) {
      that.instance.touchApplied = false;
      if (queryParents(event.target)) {
        onTouchEnd.call(event.target, event);
      }
    });

    if(!that.instance.momentumScrolling) {
      that.instance.momentumScrolling = {};
    }
    eventManager.addEventListener(this.instance.wtTable.holder.parentNode.parentNode, 'scroll', function (event) {
      clearTimeout(that.instance.momentumScrolling._timeout);

      if(!that.instance.momentumScrolling.ongoing) {
        that.instance.getSetting('onBeforeTouchScroll');
      }
      that.instance.momentumScrolling.ongoing = true;

      that.instance.momentumScrolling._timeout = setTimeout(function () {
        if(!that.instance.touchApplied) {
          that.instance.momentumScrolling.ongoing = false;

          that.instance.getSetting('onAfterMomentumScroll');
        }
      },200);
    });
  }


  //$(this.instance.wtTable.holder.parentNode.parentNode).on('touchstart', classSelector, onTouchStart);
  //$(this.instance.wtTable.holder.parentNode.parentNode).on('touchend', classSelector, onTouchEnd);


  eventManager.addEventListener(window, 'resize', function () {
    that.instance.draw();
  });
}

WalkontableEvent.prototype.parentCell = function (elem) {
  var cell = {};
  var TABLE = this.instance.wtTable.TABLE;
  var TD = Handsontable.Dom.closest(elem, ['TD', 'TH'], TABLE);

  if (TD && Handsontable.Dom.isChildOf(TD, TABLE)) {
    cell.coords = this.instance.wtTable.getCoords(TD);
    cell.TD = TD;
  } else if (Handsontable.Dom.hasClass(elem, 'wtBorder') && Handsontable.Dom.hasClass(elem, 'current')) {
    cell.coords = this.instance.selections[0].cellRange.highlight; //selections[0] is current selected cell
    cell.TD = this.instance.wtTable.getCell(cell.coords);
  } else if (Handsontable.Dom.hasClass(elem, 'wtBorder') && Handsontable.Dom.hasClass(elem, 'area')) {
    if (this.instance.selections[1].cellRange) {
      cell.coords = this.instance.selections[1].cellRange.to; //selections[1] is area selected cells
      cell.TD = this.instance.wtTable.getCell(cell.coords);
    }
  }

  return cell;
};

WalkontableEvent.prototype.destroy = function () {
  clearTimeout(this.dblClickTimeout[0]);
  clearTimeout(this.dblClickTimeout[1]);

  var rootElement = this.instance.wtTable.holder.parentNode.parentNode;
  $(rootElement).off('touchstart');
  $(rootElement).off('touchend');
  $(rootElement).off('touchmove');
};
