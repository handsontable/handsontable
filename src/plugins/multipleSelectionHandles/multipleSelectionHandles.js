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
    }).on("touchstart", ".bottomRightSelectionHandle-HitArea", function (event) {
      that.dragged.push("bottomRight");
    }).on("touchend", ".topLeftSelectionHandle-HitArea", function (event) {
      removeFromDragged.call(that, "topLeft");
    }).on("touchend", ".bottomRightSelectionHandle-HitArea", function (event) {

      removeFromDragged.call(that, "bottomRight");
    }).on("touchmove", function (event) {
      var scrollTop = Handsontable.Dom.getWindowScrollTop()
        , scrollLeft = Handsontable.Dom.getWindowScrollLeft();

      if (that.dragged.length > 0) {
        var endTarget = document.elementFromPoint(
            event.originalEvent.touches[0].screenX - scrollLeft,
            event.originalEvent.touches[0].screenY - scrollTop
        );

        if (endTarget.nodeName == "TD" || endTarget.nodeName == "TH") {
          var coords = that.instance.getCoords(endTarget);

          if (that.dragged[0] == "topLeft") {
            var rangeTo = that.instance.getSelectedRange().to;

            if(coords.isSouthEastOf(rangeTo)) {
              that.instance.selection.setRangeStart(rangeTo);
              that.instance.selection.setRangeEnd(coords);
            } else {
              that.instance.selection.setRangeStart(coords);
              that.instance.selection.setRangeEnd(rangeTo);
            }

          } else {
            that.instance.selection.setRangeEnd(coords);
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
