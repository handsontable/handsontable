/**
 * This plugin provides "drag-down" and "copy-down" functionalities, both operated
 * using the small square in the right bottom of the cell selection.
 *
 * "Drag-down" expands the value of the selected cells to the neighbouring
 * cells when you drag the small square in the corner.
 *
 * "Copy-down" copies the value of the selection to all empty cells
 * below when you double click the small square.
 */
(function (Handsontable) {
  'use strict';

  function Autofill(instance) {
    this.instance = instance;
    this.addingStarted = false;

    var $document = $(document),
      wtOnCellCornerMouseDown,
      wtOnCellMouseOver,
      mouseDownOnCellCorner = false,
      plugin = this;


    var mouseUpCallback = function (event) {
      if (!instance.autofill) {
        return true;
      }

      if (instance.autofill.handle && instance.autofill.handle.isDragged) {
        if (instance.autofill.handle.isDragged > 1) {
          instance.autofill.apply();
        }
        instance.autofill.handle.isDragged = 0;
        mouseDownOnCellCorner = false;
      }
    };

    $(document).off('mouseup.autofill.' + instance.guid, this.instance.rootElement).on('mouseup.autofill.' + instance.guid, this.instance.rootElement, function (event) {
      mouseUpCallback(event);
    });

    $(document).off('mousemove.moveOutside_' + instance.guid).on('mousemove.moveOutside_' + instance.guid, function (event) {
      if (!plugin.instance.autofill) {
        return 0;
      }

      var tableBottom = Handsontable.Dom.offset(plugin.instance.$table[0]).top - (window.pageYOffset || document.documentElement.scrollTop) + Handsontable.Dom.outerHeight(plugin.instance.$table[0])
        , tableRight = Handsontable.Dom.offset(plugin.instance.$table[0]).left - (window.pageXOffset || document.documentElement.scrollLeft) + Handsontable.Dom.outerWidth(plugin.instance.$table[0]);

      if (plugin.addingStarted === false && plugin.instance.autofill.handle.isDragged > 0 && event.clientY > tableBottom && event.clientX <= tableRight) { // dragged outside bottom
        this.mouseDragOutside = true;
        plugin.addingStarted = true;
      } else {
        this.mouseDragOutside = false;
      }

      if (this.mouseDragOutside) {
        setTimeout(function () {
          plugin.addingStarted = false;
          plugin.instance.alter('insert_row');
        }, 200);
      }
    });

    /*
     * Appeding autofill-specific methods to walkontable event settings
     */
    wtOnCellCornerMouseDown = this.instance.view.wt.wtSettings.settings.onCellCornerMouseDown;
    this.instance.view.wt.wtSettings.settings.onCellCornerMouseDown = function (event) {
      instance.autofill.handle.isDragged = 1;
      mouseDownOnCellCorner = true;

      wtOnCellCornerMouseDown(event);
    };

    wtOnCellMouseOver = this.instance.view.wt.wtSettings.settings.onCellMouseOver;
    this.instance.view.wt.wtSettings.settings.onCellMouseOver = function (event, coords, TD, wt) {

      if (instance.autofill && (mouseDownOnCellCorner && !instance.view.isMouseDown() && instance.autofill.handle && instance.autofill.handle.isDragged)) {
        instance.autofill.handle.isDragged++;
        instance.autofill.showBorder(coords);
        instance.autofill.checkIfNewRowNeeded();
      }

      wtOnCellMouseOver(event, coords, TD, wt);
    };

    this.instance.view.wt.wtSettings.settings.onCellCornerDblClick = function () {
      instance.autofill.selectAdjacent();
    };

  }

  /**
   * Create fill handle and fill border objects
   */
  Autofill.prototype.init = function () {
    this.handle = {};
  },

  /**
   * Hide fill handle and fill border permanently
   */
    Autofill.prototype.disable = function () {
      this.handle.disabled = true;
    },

  /**
   * Selects cells down to the last row in the left column, then fills down to that cell
   */
    Autofill.prototype.selectAdjacent = function () {
      var select, data, r, maxR, c;

      if (this.instance.selection.isMultiple()) {
        select = this.instance.view.wt.selections.area.getCorners();
      }
      else {
        select = this.instance.view.wt.selections.current.getCorners();
      }

      data = this.instance.getData();
      rows : for (r = select[2] + 1; r < this.instance.countRows(); r++) {
        for (c = select[1]; c <= select[3]; c++) {
          if (data[r][c]) {
            break rows;
          }
        }
        if (!!data[r][select[1] - 1] || !!data[r][select[3] + 1]) {
          maxR = r;
        }
      }
      if (maxR) {
        this.instance.view.wt.selections.fill.clear();
        this.instance.view.wt.selections.fill.add(new WalkontableCellCoords(select[0], select[1]));
        this.instance.view.wt.selections.fill.add(new WalkontableCellCoords(maxR, select[3]));
        this.apply();
      }
    },

  /**
   * Apply fill values to the area in fill border, omitting the selection border
   */
    Autofill.prototype.apply = function () {
      var drag, select, start, end, _data;

      this.handle.isDragged = 0;

      drag = this.instance.view.wt.selections.fill.getCorners();
      if (!drag) {
        return;
      }

      this.instance.view.wt.selections.fill.clear();

      if (this.instance.selection.isMultiple()) {
        select = this.instance.view.wt.selections.area.getCorners();
      }
      else {
        select = this.instance.view.wt.selections.current.getCorners();
      }

      if (drag[0] === select[0] && drag[1] < select[1]) {
        start = new WalkontableCellCoords(
          drag[0],
          drag[1]
        );
        end = new WalkontableCellCoords(
          drag[2],
            select[1] - 1
        );
      }
      else if (drag[0] === select[0] && drag[3] > select[3]) {
        start = new WalkontableCellCoords(
          drag[0],
            select[3] + 1
        );
        end = new WalkontableCellCoords(
          drag[2],
          drag[3]
        );
      }
      else if (drag[0] < select[0] && drag[1] === select[1]) {
        start = new WalkontableCellCoords(
          drag[0],
          drag[1]
        );
        end = new WalkontableCellCoords(
            select[0] - 1,
          drag[3]
        );
      }
      else if (drag[2] > select[2] && drag[1] === select[1]) {
        start = new WalkontableCellCoords(
            select[2] + 1,
          drag[1]
        );
        end = new WalkontableCellCoords(
          drag[2],
          drag[3]
        );
      }

      if (start && start.row > -1 && start.col > -1) {
        var selRange = {from: this.instance.getSelectedRange().from, to: this.instance.getSelectedRange().to};

        _data = this.instance.getData(selRange.from.row, selRange.from.col, selRange.to.row, selRange.to.col);

        Handsontable.hooks.run(this.instance, 'beforeAutofill', start, end, _data);

        this.instance.populateFromArray(start.row, start.col, _data, end.row, end.col, 'autofill');

        this.instance.selection.setRangeStart(new WalkontableCellCoords(drag[0], drag[1]));
        this.instance.selection.setRangeEnd(new WalkontableCellCoords(drag[2], drag[3]));
      } else {
       //reset to avoid some range bug
       this.instance.selection.refreshBorders();
     }
    },

  /**
   * Show fill border
   * @param {WalkontableCellCoords} coords
   */
    Autofill.prototype.showBorder = function (coords) {
      var topLeft = this.instance.getSelectedRange().getTopLeftCorner();
      var bottomRight = this.instance.getSelectedRange().getBottomRightCorner();
      if (this.instance.getSettings().fillHandle !== 'horizontal' && (bottomRight.row < coords.row || topLeft.row > coords.row)) {
        coords = new WalkontableCellCoords(coords.row, bottomRight.col);
      }
      else if (this.instance.getSettings().fillHandle !== 'vertical') {
        coords = new WalkontableCellCoords(bottomRight.row, coords.col);
      }
      else {
        return; //wrong direction
      }

      this.instance.view.wt.selections.fill.clear();
      this.instance.view.wt.selections.fill.add(this.instance.getSelectedRange().from);
      this.instance.view.wt.selections.fill.add(this.instance.getSelectedRange().to);
      this.instance.view.wt.selections.fill.add(coords);
      this.instance.view.render();
    };

  Autofill.prototype.checkIfNewRowNeeded = function () {
    var fillCorners,
      selection,
      tableRows = this.instance.countRows(),
      that = this;

    if (this.instance.view.wt.selections.fill.cellRange && this.addingStarted === false) {
      selection = this.instance.getSelected();
      fillCorners = this.instance.view.wt.selections.fill.getCorners();

      if (selection[2] < tableRows - 1 && fillCorners[2] === tableRows - 1) {
        this.addingStarted = true;

        this.instance._registerTimeout(setTimeout(function () {
          that.instance.alter('insert_row');
          that.addingStarted = false;
        }, 200));
      }
    }

  };


  Handsontable.hooks.add('afterInit', function () {
    var autofill = new Autofill(this);

    if (typeof this.getSettings().fillHandle !== "undefined") {
      if (autofill.handle && this.getSettings().fillHandle === false) {
        autofill.disable();
      }
      else if (!autofill.handle && this.getSettings().fillHandle !== false) {
        this.autofill = autofill;
        this.autofill.init();
      }
    }

  });

  Handsontable.Autofill = Autofill;

})(Handsontable);
