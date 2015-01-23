(function (Handsontable) {
  'use strict';

  function MultipleSelectionHandles(instance) {
    this.instance = instance;
    this.dragged = [];

    this.eventManager = Handsontable.eventManager(instance);

    this.bindTouchEvents();
  }

  MultipleSelectionHandles.prototype.getCurrentRangeCoords = function (selectedRange, currentTouch, touchStartDirection, currentDirection, draggedHandle) {
    var topLeftCorner = selectedRange.getTopLeftCorner()
      , bottomRightCorner = selectedRange.getBottomRightCorner()
      , bottomLeftCorner = selectedRange.getBottomLeftCorner()
      , topRightCorner = selectedRange.getTopRightCorner();

    var newCoords = {
      start: null,
      end: null
    };

    switch (touchStartDirection) {
      case "NE-SW":
        switch (currentDirection) {
          case "NE-SW":
          case "NW-SE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, selectedRange.highlight.col),
                end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
              };
            }
            break;
          case "SE-NW":
            if (draggedHandle == "bottomRight") {
              newCoords = {
                start: new WalkontableCellCoords(bottomRightCorner.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col)
              };
            }
            break;
          //case "SW-NE":
          //  break;
        }
        break;
      case "NW-SE":
        switch (currentDirection) {
          case "NE-SW":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: bottomLeftCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
          case "NW-SE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: bottomRightCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
          case "SE-NW":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: topLeftCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
          case "SW-NE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: currentTouch,
                end: topRightCorner
              };
            } else {
              newCoords.end  = currentTouch;
            }
            break;
        }
        break;
      case "SW-NE":
        switch (currentDirection) {
          case "NW-SE":
            if (draggedHandle == "bottomRight") {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
                end: new WalkontableCellCoords(bottomLeftCorner.row, currentTouch.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
              };
            }
            break;
          //case "NE-SW":
          //
          //  break;
          case "SW-NE":
            if (draggedHandle == "topLeft") {
              newCoords = {
                start: new WalkontableCellCoords(selectedRange.highlight.row, currentTouch.col),
                end: new WalkontableCellCoords(currentTouch.row, bottomRightCorner.col)
              };
            } else {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topLeftCorner.col),
                end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
              };
            }
            break;
          case "SE-NW":
            if (draggedHandle == "bottomRight") {
              newCoords = {
                start: new WalkontableCellCoords(currentTouch.row, topRightCorner.col),
                end: new WalkontableCellCoords(topLeftCorner.row, currentTouch.col)
              };
            } else if (draggedHandle == "topLeft") {
              newCoords = {
                start: bottomLeftCorner,
                end: currentTouch
              };
            }
            break;
        }
        break;
      case "SE-NW":
        switch (currentDirection) {
          case "NW-SE":
          case "NE-SW":
          case "SW-NE":
            if (draggedHandle == "topLeft") {
              newCoords.end = currentTouch;
            }
            break;
          case "SE-NW":
            if (draggedHandle == "topLeft") {
              newCoords.end = currentTouch;
            } else {
              newCoords = {
                start: currentTouch,
                end: topLeftCorner
              };
            }
            break;
        }
        break;
    }

    return newCoords;
  };

  MultipleSelectionHandles.prototype.bindTouchEvents = function () {
    var that = this;
    var removeFromDragged = function (query) {

      if (this.dragged.length == 1) {
        this.dragged = [];
        return true;
      }

      var entryPosition = this.dragged.indexOf(query);

      if (entryPosition == -1) {
        return false;
      } else if (entryPosition === 0) {
        this.dragged = this.dragged.slice(0, 1);
      } else if (entryPosition == 1) {
        this.dragged = this.dragged.slice(-1);
      }
    };

    this.eventManager.addEventListener(this.instance.rootElement,'touchstart', function (event) {
      if(Handsontable.Dom.hasClass(event.target, "topLeftSelectionHandle-HitArea")) {
        that.dragged.push("topLeft");
        var selectedRange = that.instance.getSelectedRange();
        that.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };
        event.preventDefault();

        return false;
      } else if (Handsontable.Dom.hasClass(event.target, "bottomRightSelectionHandle-HitArea")) {
        that.dragged.push("bottomRight");
        var selectedRange = that.instance.getSelectedRange();
        that.touchStartRange = {
          width: selectedRange.getWidth(),
          height: selectedRange.getHeight(),
          direction: selectedRange.getDirection()
        };
        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(this.instance.rootElement,'touchend', function (event) {
      if(Handsontable.Dom.hasClass(event.target, "topLeftSelectionHandle-HitArea")) {
        removeFromDragged.call(that, "topLeft");
        that.touchStartRange = void 0;
        event.preventDefault();

        return false;
      } else if (Handsontable.Dom.hasClass(event.target, "bottomRightSelectionHandle-HitArea")) {
        removeFromDragged.call(that, "bottomRight");
        that.touchStartRange = void 0;
        event.preventDefault();

        return false;
      }
    });

    this.eventManager.addEventListener(this.instance.rootElement,'touchmove', function (event) {
      var scrollTop = Handsontable.Dom.getWindowScrollTop()
        , scrollLeft = Handsontable.Dom.getWindowScrollLeft();

      if (that.dragged.length > 0) {
        var endTarget = document.elementFromPoint(
          event.touches[0].screenX - scrollLeft,
          event.touches[0].screenY - scrollTop
        );

        if(!endTarget) {
          return;
        }

        if (endTarget.nodeName == "TD" || endTarget.nodeName == "TH") {
          var targetCoords = that.instance.getCoords(endTarget);

          if(targetCoords.col == -1) {
            targetCoords.col = 0;
          }

          var selectedRange = that.instance.getSelectedRange()
            , rangeWidth = selectedRange.getWidth()
            , rangeHeight = selectedRange.getHeight()
            , rangeDirection = selectedRange.getDirection();

          if (rangeWidth == 1 && rangeHeight == 1) {
            that.instance.selection.setRangeEnd(targetCoords);
          }

          var newRangeCoords = that.getCurrentRangeCoords(selectedRange, targetCoords, that.touchStartRange.direction, rangeDirection, that.dragged[0]);

          if(newRangeCoords.start != null) {
            that.instance.selection.setRangeStart(newRangeCoords.start);
          }
          that.instance.selection.setRangeEnd(newRangeCoords.end);

        }

        event.preventDefault();
      }
    });

  };

  MultipleSelectionHandles.prototype.isDragged = function () {
    if (this.dragged.length === 0) {
      return false;
    } else {
      return true;
    }
  };

  var init = function () {
    var instance = this;

    Handsontable.plugins.multipleSelectionHandles = new MultipleSelectionHandles(instance);
  };

  Handsontable.hooks.add('afterInit', init);

})(Handsontable);
