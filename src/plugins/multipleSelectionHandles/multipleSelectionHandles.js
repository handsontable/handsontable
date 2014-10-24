(function (Handsontable) {
  'use strict';

  function MultipleSelectionHandles(instance) {
    this.instance = instance;
    this.dragged = [];

    this.bindTouchEvents();
  }

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
      } else if (entryPosition == 0) {
        this.dragged = this.dragged.slice(0, 1);
      } else if (entryPosition == 1) {
        this.dragged = this.dragged.slice(-1);
      }
    };

    this.instance.rootElement.on("touchstart", ".topLeftSelectionHandle-HitArea", function (event) {
      that.dragged.push("topLeft");
      var selectedRange = that.instance.getSelectedRange();
      that.touchStartRange = {
        width: selectedRange.getWidth(),
        height: selectedRange.getHeight(),
        direction: selectedRange.getDirection()
      };
      event.preventDefault();
      return false;
    }).on("touchstart", ".bottomRightSelectionHandle-HitArea", function (event) {
      that.dragged.push("bottomRight");
      var selectedRange = that.instance.getSelectedRange();
      that.touchStartRange = {
        width: selectedRange.getWidth(),
        height: selectedRange.getHeight(),
        direction: selectedRange.getDirection()
      };
      event.preventDefault();
      return false;
    }).on("touchend", ".topLeftSelectionHandle-HitArea", function (event) {
      removeFromDragged.call(that, "topLeft");
      that.touchStartRange = void 0;
      event.preventDefault();
      return false;
    }).on("touchend", ".bottomRightSelectionHandle-HitArea", function (event) {
      removeFromDragged.call(that, "bottomRight");
      that.touchStartRange = void 0;
      event.preventDefault();
      return false;
    }).on("touchmove", function (event) {
      var scrollTop = Handsontable.Dom.getWindowScrollTop()
        , scrollLeft = Handsontable.Dom.getWindowScrollLeft();

      if (that.dragged.length > 0) {
        var endTarget = document.elementFromPoint(
          event.originalEvent.touches[0].screenX - scrollLeft,
          event.originalEvent.touches[0].screenY - scrollTop
        );

        if (endTarget.nodeName == "TD" || endTarget.nodeName == "TH") {
          var targetCoords = that.instance.getCoords(endTarget);
          var selectedRange = that.instance.getSelectedRange()
            , topLeftCorner = selectedRange.getTopLeftCorner()
            , bottomRightCorner = selectedRange.getBottomRightCorner()
            , bottomLeftCorner = selectedRange.getBottomLeftCorner()
            , topRightCorner = selectedRange.getTopRightCorner()
            , rangeWidth = selectedRange.getWidth()
            , rangeHeight = selectedRange.getHeight()
            , rangeDirection = selectedRange.getDirection();

          if (rangeWidth == 1 && rangeHeight == 1) {
            //that.instance.selection.setRangeStart(targetCoords);
            that.instance.selection.setRangeEnd(targetCoords);
          }
          //console.log("start direction: ", that.touchStartRange.direction, ", current direction: ", rangeDirection);

          switch (that.touchStartRange.direction) {
            case "NE-SW":
              switch (rangeDirection) {
                case "NE-SW":
                case "NW-SE":
                  if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(targetCoords.row, selectedRange.highlight.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(bottomLeftCorner.row, targetCoords.col));
                  } else {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(selectedRange.highlight.row, targetCoords.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(targetCoords.row, topLeftCorner.col));
                  }
                  break;
                case "SE-NW":
                  if (that.dragged[0] == "bottomRight") {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(bottomRightCorner.row, targetCoords.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(targetCoords.row, topLeftCorner.col));
                  }
                  break;
                //case "SW-NE":
                //  break;
              }
              break;
            case "NW-SE":
              switch (rangeDirection) {
                case "NW-SE":
                case "NE-SW":
                case "SE-NW":
                  if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeStart(targetCoords);
                    that.instance.selection.setRangeEnd(bottomRightCorner);
                  } else {
                    that.instance.selection.setRangeEnd(targetCoords);
                  }
                  break;
                case "SW-NE":
                  if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeStart(targetCoords);
                    that.instance.selection.setRangeEnd(topRightCorner);
                  } else {
                    that.instance.selection.setRangeEnd(targetCoords);
                  }
                  break;
              }
              break;
            case "SW-NE":
              switch (rangeDirection) {
                case "NW-SE":
                  if (that.dragged[0] == "bottomRight") {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(targetCoords.row, topLeftCorner.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(bottomLeftCorner.row, targetCoords.col));
                  } else {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(topLeftCorner.row, targetCoords.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(targetCoords.row, bottomRightCorner.col));
                  }
                  break;
                //case "NE-SW":
                //
                //  break;
                case "SW-NE":
                  if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(selectedRange.highlight.row, targetCoords.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(targetCoords.row, bottomRightCorner.col));
                  } else {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(targetCoords.row, topLeftCorner.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(topLeftCorner.row, targetCoords.col));
                  }
                  break;
                case "SE-NW":
                  if (that.dragged[0] == "bottomRight") {
                    that.instance.selection.setRangeStart(new WalkontableCellCoords(targetCoords.row, topRightCorner.col));
                    that.instance.selection.setRangeEnd(new WalkontableCellCoords(topLeftCorner.row, targetCoords.col));
                  } else if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeStart(bottomLeftCorner);
                    that.instance.selection.setRangeEnd(targetCoords);
                  }
                  break;
              }
              break;
            case "SE-NW":
              switch (rangeDirection) {
                case "NW-SE":
                case "NE-SW":
                case "SW-NE":
                  if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeEnd(targetCoords);
                  }
                  break;
                case "SE-NW":
                  if (that.dragged[0] == "topLeft") {
                    that.instance.selection.setRangeEnd(targetCoords);
                  } else {
                    that.instance.selection.setRangeStart(targetCoords);
                    that.instance.selection.setRangeEnd(topLeftCorner);
                  }
                  break;
              }
              break;
          }

        }

        event.preventDefault();
      }
    });
  };

  MultipleSelectionHandles.prototype.isDragged = function () {
    if (this.dragged.length == 0) {
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
