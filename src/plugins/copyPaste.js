/**
 * This plugin provides copy and paste functionalities.
 *
 * @plugin
 * @class Handsontable.CopyPaste
 */
(function (Handsontable, CopyPaste, SheetClip) {

  function CopyPastePlugin(instance) {
    var _this = this;

    this.copyPasteInstance = CopyPaste.getInstance();
    this.copyPasteInstance.onCut(onCut);
    this.copyPasteInstance.onPaste(onPaste);

    instance.addHook('beforeKeyDown', onBeforeKeyDown);

    function onCut() {
      if (!instance.isListening()) {
        return;
      }
      instance.selection.empty();
    }

    function onPaste(str) {
      var
        input,
        inputArray,
        selected,
        coordsFrom,
        coordsTo,
        cellRange,
        topLeftCorner,
        bottomRightCorner,
        areaStart,
        areaEnd;

      if (!instance.isListening() || !instance.selection.isSelected()) {
        return;
      }
      input = str;
      inputArray = SheetClip.parse(input);
      selected = instance.getSelected();
      coordsFrom = new WalkontableCellCoords(selected[0], selected[1]);
      coordsTo = new WalkontableCellCoords(selected[2], selected[3]);
      cellRange = new WalkontableCellRange(coordsFrom, coordsFrom, coordsTo);
      topLeftCorner = cellRange.getTopLeftCorner();
      bottomRightCorner = cellRange.getBottomRightCorner();
      areaStart = topLeftCorner;
      areaEnd = new WalkontableCellCoords(
        Math.max(bottomRightCorner.row, inputArray.length - 1 + topLeftCorner.row),
        Math.max(bottomRightCorner.col, inputArray[0].length - 1 + topLeftCorner.col)
      );

      instance.addHookOnce('afterChange', function (changes, source) {
        if (changes && changes.length) {
          this.selectCell(areaStart.row, areaStart.col, areaEnd.row, areaEnd.col);
        }
      });

      instance.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'paste', instance.getSettings().pasteMode);
    }

    function onBeforeKeyDown (event) {
      var ctrlDown;

      if (instance.getSelected()) {
        if (Handsontable.helper.isCtrlKey(event.keyCode)) {
          // when CTRL is pressed, prepare selectable text in textarea
          // http://stackoverflow.com/questions/3902635/how-does-one-capture-a-macs-command-key-via-javascript
          _this.setCopyableText();
          event.stopImmediatePropagation();

          return;
        }
        // catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
        ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey;

        if (event.keyCode == Handsontable.helper.keyCode.A && ctrlDown) {
          instance._registerTimeout(setTimeout(Handsontable.helper.proxy(_this.setCopyableText, _this), 0));
        }
      }
    }

    /**
     * Destroy plugin instance.
     *
     * @function destroy
     * @memberof Handsontable.CopyPaste#
     */
    this.destroy = function () {
      this.copyPasteInstance.removeCallback(onCut);
      this.copyPasteInstance.removeCallback(onPaste);
      this.copyPasteInstance.destroy();
      instance.removeHook('beforeKeyDown', onBeforeKeyDown);
    };

    instance.addHook('afterDestroy', Handsontable.helper.proxy(this.destroy, this));

    /**
     * @function triggerPaste
     * @memberof Handsontable.CopyPaste#
     */
    this.triggerPaste = Handsontable.helper.proxy(this.copyPasteInstance.triggerPaste, this.copyPasteInstance);

    /**
     * @function triggerCut
     * @memberof Handsontable.CopyPaste#
     */
    this.triggerCut = Handsontable.helper.proxy(this.copyPasteInstance.triggerCut, this.copyPasteInstance);

    /**
     * Prepares copyable text in the invisible textarea.
     *
     * @function setCopyable
     * @memberof Handsontable.CopyPaste#
     */
    this.setCopyableText = function () {
      var settings = instance.getSettings();
      var copyRowsLimit = settings.copyRowsLimit;
      var copyColsLimit = settings.copyColsLimit;

      var selRange = instance.getSelectedRange();
      var topLeft = selRange.getTopLeftCorner();
      var bottomRight = selRange.getBottomRightCorner();
      var startRow = topLeft.row;
      var startCol = topLeft.col;
      var endRow = bottomRight.row;
      var endCol = bottomRight.col;
      var finalEndRow = Math.min(endRow, startRow + copyRowsLimit - 1);
      var finalEndCol = Math.min(endCol, startCol + copyColsLimit - 1);

      instance.copyPaste.copyPasteInstance.copyable(instance.getCopyableData(startRow, startCol, finalEndRow, finalEndCol));

      if (endRow !== finalEndRow || endCol !== finalEndCol) {
        Handsontable.hooks.run(instance, "afterCopyLimit", endRow - startRow + 1, endCol - startCol + 1, copyRowsLimit, copyColsLimit);
      }
    };
  }

  /**
   * Init plugin
   *
   * @function init
   * @memberof Handsontable.CopyPaste#
   */
  function init() {
    var instance  = this,
      pluginEnabled = instance.getSettings().copyPaste !== false;

    if (pluginEnabled && !instance.copyPaste) {
      /**
       * Instance of CopyPaste Plugin {@link Handsontable.CopyPaste}
       * @alias copyPaste
       * @memberof! Handsontable.Core#
       * @type {CopyPaste}
       */
      instance.copyPaste = new CopyPastePlugin(instance);

    } else if (!pluginEnabled && instance.copyPaste) {
      instance.copyPaste.destroy();
      delete instance.copyPaste;
    }
  }

  Handsontable.hooks.add('afterInit', init);
  Handsontable.hooks.add('afterUpdateSettings', init);

  Handsontable.hooks.register('afterCopyLimit');
})(Handsontable, CopyPaste, SheetClip);