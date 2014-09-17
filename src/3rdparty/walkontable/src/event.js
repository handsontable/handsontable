function WalkontableEvent(instance) {
  var that = this;

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

  $(this.instance.wtTable.holder).on('mousedown', onMouseDown);
  $(this.instance.wtTable.TABLE).on('mouseover', onMouseOver);
  $(this.instance.wtTable.holder).on('mouseup', onMouseUp);

  $(window).on('resize.' + this.instance.guid, function () {
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
    cell.coords = this.instance.selections[1].cellRange.to; //selections[1] is area selected cells
    cell.TD = this.instance.wtTable.getCell(cell.coords);
  }

  return cell;
};

WalkontableEvent.prototype.destroy = function () {
  clearTimeout(this.dblClickTimeout[0]);
  clearTimeout(this.dblClickTimeout[1]);
};
