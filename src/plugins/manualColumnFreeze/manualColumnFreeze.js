(function (Handsontable) {
  function ManualColumnFreeze(instance) {
    var fixedColumnsCount = instance.getSettings().fixedColumnsLeft;

    var init = function () {
      // update plugin usages count for manualColumnPositions
      if (typeof instance.manualColumnPositionsPluginUsages != 'undefined') {
        instance.manualColumnPositionsPluginUsages.push('manualColumnFreeze');
      } else {
        instance.manualColumnPositionsPluginUsages = ['manualColumnFreeze'];
      }

      bindHooks();
    };

    /**
     * Modifies the default Context Menu entry list to consist 'freeze/unfreeze this column' entries
     * @param {Object} defaultOptions
     */
    function addContextMenuEntry(defaultOptions) {
      defaultOptions.items.push(
        Handsontable.ContextMenu.SEPARATOR,
        {
          key: 'freeze_column',
          name: function () {
            var selectedColumn = instance.getSelected()[1];
            if (selectedColumn > fixedColumnsCount - 1) {
              return 'Freeze this column';
            } else {
              return 'Unfreeze this column';
            }
          },
          disabled: function () {
            var selection = instance.getSelected();
            return selection[1] !== selection[3];
          },
          callback: function () {
            var selectedColumn = instance.getSelected()[1];
            if (selectedColumn > fixedColumnsCount - 1) {
              freezeColumn(selectedColumn);
            } else {
              unfreezeColumn(selectedColumn);
            }
          }
        }
      );
    }

    /**
     * Increments the fixed columns count by one
     */
    function addFixedColumn() {
      instance.updateSettings({
        fixedColumnsLeft: fixedColumnsCount + 1
      });
      fixedColumnsCount++;
    }

    /**
     * Decrements the fixed columns count by one
     */
    function removeFixedColumn() {
      instance.updateSettings({
        fixedColumnsLeft: fixedColumnsCount - 1
      });
      fixedColumnsCount--;
    }

    /**
     * Checks whether 'manualColumnPositions' array needs creating and/or initializing
     * @param {Number} [col]
     */
    function checkPositionData(col) {
      if (!instance.manualColumnPositions || instance.manualColumnPositions.length === 0) {
        if (!instance.manualColumnPositions) {
          instance.manualColumnPositions = [];
        }
      }
      if (col) {
        if (!instance.manualColumnPositions[col]) {
          createPositionData(col + 1);
        }
      } else {
        createPositionData(instance.countCols());
      }
    }

    /**
     * Fills the 'manualColumnPositions' array with consecutive column indexes
     * @param {Number} len
     */
    function createPositionData(len) {
      if (instance.manualColumnPositions.length < len) {
        for (var i = instance.manualColumnPositions.length; i < len; i++) {
          instance.manualColumnPositions[i] = i;
        }
      }
    }

    /**
     * Updates the column order array used by modifyCol callback
     * @param {Number} col
     * @param {Number} actualCol column index of the currently selected cell
     * @param {Number|null} returnCol suggested return slot for the unfreezed column (can be null)
     * @param {String} action 'freeze' or 'unfreeze'
     */
    function modifyColumnOrder(col, actualCol, returnCol, action) {
      if (returnCol == null) {
        returnCol = col;
      }

      if (action === 'freeze') {
        instance.manualColumnPositions.splice(fixedColumnsCount, 0, instance.manualColumnPositions.splice(actualCol, 1)[0]);
      } else if (action === 'unfreeze') {
        instance.manualColumnPositions.splice(returnCol, 0, instance.manualColumnPositions.splice(actualCol, 1)[0]);
      }
    }

    /**
     * Estimates the most fitting return position for unfreezed column
     * @param {Number} col
     */
    function getBestColumnReturnPosition(col) {
      var i = fixedColumnsCount,
        j = getModifiedColumnIndex(i),
        initialCol = getModifiedColumnIndex(col);
      while (j < initialCol) {
        i++;
        j = getModifiedColumnIndex(i);
      }
      return i - 1;
    }

    /**
     * Freeze the given column (add it to fixed columns)
     * @param {Number} col
     */
    function freezeColumn(col) {
      if (col <= fixedColumnsCount - 1) {
        return; // already fixed
      }

      var modifiedColumn = getModifiedColumnIndex(col) || col;
      checkPositionData(modifiedColumn);
      modifyColumnOrder(modifiedColumn, col, null, 'freeze');

      addFixedColumn();

      instance.view.wt.wtOverlays.leftOverlay.refresh();
    }

    /**
     * Unfreeze the given column (remove it from fixed columns and bring to it's previous position)
     * @param {Number} col
     */
    function unfreezeColumn(col) {
      if (col > fixedColumnsCount - 1) {
        return; // not fixed
      }

      var returnCol = getBestColumnReturnPosition(col);

      var modifiedColumn = getModifiedColumnIndex(col) || col;
      checkPositionData(modifiedColumn);
      modifyColumnOrder(modifiedColumn, col, returnCol, 'unfreeze');
      removeFixedColumn();

      instance.view.wt.wtOverlays.leftOverlay.refresh();
    }

    function getModifiedColumnIndex(col) {
      return instance.manualColumnPositions[col];
    }

    /**
     * 'modiftyCol' callback
     * @param {Number} col
     */
    function onModifyCol(col) {
      if (this.manualColumnPositionsPluginUsages.length > 1) { // if another plugin is using manualColumnPositions to modify column order, do not double the translation
        return col;
      }
      return getModifiedColumnIndex(col);
    }

    function bindHooks() {
      //instance.addHook('afterGetColHeader', onAfterGetColHeader);
      instance.addHook('modifyCol', onModifyCol);
      instance.addHook('afterContextMenuDefaultOptions', addContextMenuEntry);
    }

    return {
      init: init,
      freezeColumn: freezeColumn,
      unfreezeColumn: unfreezeColumn,
      helpers: {
        addFixedColumn: addFixedColumn,
        removeFixedColumn: removeFixedColumn,
        checkPositionData: checkPositionData,
        modifyColumnOrder: modifyColumnOrder,
        getBestColumnReturnPosition: getBestColumnReturnPosition
      }
    };
  }

  var init = function init() {
    if (!this.getSettings().manualColumnFreeze) {
      return;
    }

    var mcfPlugin;

    Handsontable.plugins.manualColumnFreeze = ManualColumnFreeze;
    this.manualColumnFreeze = new ManualColumnFreeze(this);

    mcfPlugin = this.manualColumnFreeze;
    mcfPlugin.init.call(this);
  };

  Handsontable.hooks.add('beforeInit', init);

})(Handsontable);


