Handsontable.activeGuid = null;

/**
 * Handsontable constructor
 * @param rootElement The jQuery element in which Handsontable DOM will be inserted
 * @param userSettings
 * @constructor
 */
Handsontable.Core = function (rootElement, userSettings) {
  var priv
    , datamap
    , grid
    , selection
    , editorManager
    , instance = this
    , GridSettings = function () {}
    , $document = $(document.documentElement)
    , $body = $(document.body);

  Handsontable.helper.extend(GridSettings.prototype, DefaultSettings.prototype); //create grid settings as a copy of default settings
  Handsontable.helper.extend(GridSettings.prototype, userSettings); //overwrite defaults with user settings
  Handsontable.helper.extend(GridSettings.prototype, expandType(userSettings));

  this.rootElement = rootElement;

  this.container = document.createElement('DIV');
  this.container.className = 'htContainer';
  rootElement.prepend(this.container);
  this.container = $(this.container);

  this.guid = 'ht_' + Handsontable.helper.randomString(); //this is the namespace for global events

  if (!this.rootElement[0].id || this.rootElement[0].id.substring(0, 3) === "ht_") {
    this.rootElement[0].id = this.guid; //if root element does not have an id, assign a random id
  }

  priv = {
    cellSettings: [],
    columnSettings: [],
    columnsSettingConflicts: ['data', 'width'],
    settings: new GridSettings(), // current settings instance
    selRange: null, //exposed by public method `getSelectedRange`
    isPopulated: null,
    scrollable: null,
    firstRun: true
  };

  grid = {
    /**
     * Inserts or removes rows and columns
     * @param {String} action Possible values: "insert_row", "insert_col", "remove_row", "remove_col"
     * @param {Number} index
     * @param {Number} amount
     * @param {String} [source] Optional. Source of hook runner.
     * @param {Boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
     */
    alter: function (action, index, amount, source, keepEmptyRows) {
      var delta;

      amount = amount || 1;

      switch (action) {
        case "insert_row":
          delta = datamap.createRow(index, amount);

          if (delta) {
            if (selection.isSelected() && priv.selRange.from.row >= index) {
              priv.selRange.from.row = priv.selRange.from.row + delta;
              selection.transformEnd(delta, 0); //will call render() internally
            }
            else {
              selection.refreshBorders(); //it will call render and prepare methods
            }
          }
          break;

        case "insert_col":
          delta = datamap.createCol(index, amount);

          if (delta) {

            if(Handsontable.helper.isArray(instance.getSettings().colHeaders)){
              var spliceArray = [index, 0];
              spliceArray.length += delta; //inserts empty (undefined) elements at the end of an array
              Array.prototype.splice.apply(instance.getSettings().colHeaders, spliceArray); //inserts empty (undefined) elements into the colHeader array
            }

            if (selection.isSelected() && priv.selRange.from.col >= index) {
              priv.selRange.from.col = priv.selRange.from.col + delta;
              selection.transformEnd(0, delta); //will call render() internally
            }
            else {
              selection.refreshBorders(); //it will call render and prepare methods
            }
          }
          break;

        case "remove_row":
          datamap.removeRow(index, amount);
          priv.cellSettings.splice(index, amount);
          grid.adjustRowsAndCols();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        case "remove_col":
          datamap.removeCol(index, amount);

          for(var row = 0, len = datamap.getAll().length; row < len; row++){
            if(row in priv.cellSettings){  //if row hasn't been rendered it wouldn't have cellSettings
              priv.cellSettings[row].splice(index, amount);
            }
          }

          if(Handsontable.helper.isArray(instance.getSettings().colHeaders)){
            if(typeof index == 'undefined'){
              index = -1;
            }
            instance.getSettings().colHeaders.splice(index, amount);
          }

          priv.columnSettings.splice(index, amount);

          grid.adjustRowsAndCols();
          selection.refreshBorders(); //it will call render and prepare methods
          break;

        default:
          throw new Error('There is no such action "' + action + '"');
          break;
      }

      if (!keepEmptyRows) {
        grid.adjustRowsAndCols(); //makes sure that we did not add rows that will be removed in next refresh
      }
    },

    /**
     * Makes sure there are empty rows at the bottom of the table
     */
    adjustRowsAndCols: function () {
      var r, rlen, emptyRows, emptyCols;

      //should I add empty rows to data source to meet minRows?
      rlen = instance.countRows();
      if (rlen < priv.settings.minRows) {
        for (r = 0; r < priv.settings.minRows - rlen; r++) {
          datamap.createRow(instance.countRows(), 1, true);
        }
      }

      emptyRows = instance.countEmptyRows(true);

      //should I add empty rows to meet minSpareRows?
      if (emptyRows < priv.settings.minSpareRows) {
        for (; emptyRows < priv.settings.minSpareRows && instance.countRows() < priv.settings.maxRows; emptyRows++) {
          datamap.createRow(instance.countRows(), 1, true);
        }
      }

      //count currently empty cols
      emptyCols = instance.countEmptyCols(true);

      //should I add empty cols to meet minCols?
      if (!priv.settings.columns && instance.countCols() < priv.settings.minCols) {
        for (; instance.countCols() < priv.settings.minCols; emptyCols++) {
          datamap.createCol(instance.countCols(), 1, true);
        }
      }

      //should I add empty cols to meet minSpareCols?
      if (!priv.settings.columns && instance.dataType === 'array' && emptyCols < priv.settings.minSpareCols) {
        for (; emptyCols < priv.settings.minSpareCols && instance.countCols() < priv.settings.maxCols; emptyCols++) {
          datamap.createCol(instance.countCols(), 1, true);
        }
      }

      // if (priv.settings.enterBeginsEditing) {
      //   for (; (((priv.settings.minRows || priv.settings.minSpareRows) && instance.countRows() > priv.settings.minRows) && (priv.settings.minSpareRows && emptyRows > priv.settings.minSpareRows)); emptyRows--) {
      //     datamap.removeRow();
      //   }
      // }

      // if (priv.settings.enterBeginsEditing && !priv.settings.columns) {
      //   for (; (((priv.settings.minCols || priv.settings.minSpareCols) && instance.countCols() > priv.settings.minCols) && (priv.settings.minSpareCols && emptyCols > priv.settings.minSpareCols)); emptyCols--) {
      //     datamap.removeCol();
      //   }
      // }

      var rowCount = instance.countRows();
      var colCount = instance.countCols();

      if (rowCount === 0 || colCount === 0) {
        selection.deselect();
      }

      if (selection.isSelected()) {
        var selectionChanged;
        var fromRow = priv.selRange.from.row;
        var fromCol = priv.selRange.from.col;
        var toRow = priv.selRange.to.row;
        var toCol = priv.selRange.to.col;

        //if selection is outside, move selection to last row
        if (fromRow > rowCount - 1) {
          fromRow = rowCount - 1;
          selectionChanged = true;
          if (toRow > fromRow) {
            toRow = fromRow;
          }
        } else if (toRow > rowCount - 1) {
          toRow = rowCount - 1;
          selectionChanged = true;
          if (fromRow > toRow) {
            fromRow = toRow;
          }
        }

        //if selection is outside, move selection to last row
        if (fromCol > colCount - 1) {
          fromCol = colCount - 1;
          selectionChanged = true;
          if (toCol > fromCol) {
            toCol = fromCol;
          }
        } else if (toCol > colCount - 1) {
          toCol = colCount - 1;
          selectionChanged = true;
          if (fromCol > toCol) {
            fromCol = toCol;
          }
        }

        if (selectionChanged) {
          instance.selectCell(fromRow, fromCol, toRow, toCol);
        }
      }
    },

    /**
     * Populate cells at position with 2d array
     * @param {Object} start Start selection position
     * @param {Array} input 2d array
     * @param {Object} [end] End selection position (only for drag-down mode)
     * @param {String} [source="populateFromArray"]
     * @param {String} [method="overwrite"]
     * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
     */
    populateFromArray: function (start, input, end, source, method) {
      var r, rlen, c, clen, setData = [], current = {};
      rlen = input.length;
      if (rlen === 0) {
        return false;
      }

      var repeatCol
        , repeatRow
        , cmax
        , rmax;

      // insert data with specified pasteMode method
      switch (method) {
        case 'shift_down' :
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          input = Handsontable.helper.translateRowsToColumns(input);
          for (c = 0, clen = input.length, cmax = Math.max(clen, repeatCol); c < cmax; c++) {
            if (c < clen) {
              for (r = 0, rlen = input[c].length; r < repeatRow - rlen; r++) {
                input[c].push(input[c][r % rlen]);
              }
              input[c].unshift(start.col + c, start.row, 0);
              instance.spliceCol.apply(instance, input[c]);
            }
            else {
              input[c % clen][0] = start.col + c;
              instance.spliceCol.apply(instance, input[c % clen]);
            }
          }
          break;

        case 'shift_right' :
          repeatCol = end ? end.col - start.col + 1 : 0;
          repeatRow = end ? end.row - start.row + 1 : 0;
          for (r = 0, rlen = input.length, rmax = Math.max(rlen, repeatRow); r < rmax; r++) {
            if (r < rlen) {
              for (c = 0, clen = input[r].length; c < repeatCol - clen; c++) {
                input[r].push(input[r][c % clen]);
              }
              input[r].unshift(start.row + r, start.col, 0);
              instance.spliceRow.apply(instance, input[r]);
            }
            else {
              input[r % rlen][0] = start.row + r;
              instance.spliceRow.apply(instance, input[r % rlen]);
            }
          }
          break;

        case 'overwrite' :
        default:
          // overwrite and other not specified options
          current.row = start.row;
          current.col = start.col;
          for (r = 0; r < rlen; r++) {
            if ((end && current.row > end.row) || (!priv.settings.minSpareRows && current.row > instance.countRows() - 1) || (current.row >= priv.settings.maxRows)) {
              break;
            }
            current.col = start.col;
            clen = input[r] ? input[r].length : 0;
            for (c = 0; c < clen; c++) {
              if ((end && current.col > end.col) || (!priv.settings.minSpareCols && current.col > instance.countCols() - 1) || (current.col >= priv.settings.maxCols)) {
                break;
              }
              if (!instance.getCellMeta(current.row, current.col).readOnly) {
                setData.push([current.row, current.col, input[r][c]]);
              }
              current.col++;
              if (end && c === clen - 1) {
                c = -1;
              }
            }
            current.row++;
            if (end && r === rlen - 1) {
              r = -1;
            }
          }
          instance.setDataAtCell(setData, null, null, source || 'populateFromArray');
          break;
      }
    }
  };

  this.selection = selection = { //this public assignment is only temporary
    inProgress: false,

    selectedHeader: {
      cols: false,
      rows: false
    },

    setSelectedHeaders: function (rows, cols) {
      instance.selection.selectedHeader.rows = rows;
      instance.selection.selectedHeader.cols = cols;
    },

    /**
     * Sets inProgress to true. This enables onSelectionEnd and onSelectionEndByProp to function as desired
     */
    begin: function () {
      instance.selection.inProgress = true;
    },

    /**
     * Sets inProgress to false. Triggers onSelectionEnd and onSelectionEndByProp
     */
    finish: function () {
      var sel = instance.getSelected();
      Handsontable.hooks.run(instance, "afterSelectionEnd", sel[0], sel[1], sel[2], sel[3]);
      Handsontable.hooks.run(instance, "afterSelectionEndByProp", sel[0], instance.colToProp(sel[1]), sel[2], instance.colToProp(sel[3]));
      instance.selection.inProgress = false;
    },

    isInProgress: function () {
      return instance.selection.inProgress;
    },

    /**
     * Starts selection range on given td object
     * @param {WalkontableCellCoords} coords
     */
    setRangeStart: function (coords) {
      Handsontable.hooks.run(instance, "beforeSetRangeStart", coords);
      priv.selRange = new WalkontableCellRange(coords, coords, coords);
      selection.setRangeEnd(coords);
    },

    /**
     * Ends selection range on given td object
     * @param {WalkontableCellCoords} coords
     * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to range end
     */
    setRangeEnd: function (coords, scrollToCell) {
      //trigger handlers
      Handsontable.hooks.run(instance, "beforeSetRangeEnd", coords);

      instance.selection.begin();

      priv.selRange.to = new WalkontableCellCoords(coords.row, coords.col);
      if (!priv.settings.multiSelect) {
        priv.selRange.from = coords;
      }

      //set up current selection
      instance.view.wt.selections.current.clear();
      instance.view.wt.selections.current.add(priv.selRange.highlight);

      //set up area selection
      instance.view.wt.selections.area.clear();
      if (selection.isMultiple()) {
        instance.view.wt.selections.area.add(priv.selRange.from);
        instance.view.wt.selections.area.add(priv.selRange.to);
      }

      //set up highlight
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
        instance.view.wt.selections.highlight.add(priv.selRange.from);
        instance.view.wt.selections.highlight.add(priv.selRange.to);
      }

      //trigger handlers
      Handsontable.hooks.run(instance, "afterSelection", priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col);
      Handsontable.hooks.run(instance, "afterSelectionByProp", priv.selRange.from.row, datamap.colToProp(priv.selRange.from.col), priv.selRange.to.row, datamap.colToProp(priv.selRange.to.col));

      if (scrollToCell !== false && instance.view.mainViewIsActive()) {
        instance.view.scrollViewport(coords);
      }
      selection.refreshBorders();
    },

    /**
     * Destroys editor, redraws borders around cells, prepares editor
     * @param {Boolean} revertOriginal
     * @param {Boolean} keepEditor
     */
    refreshBorders: function (revertOriginal, keepEditor) {
      if (!keepEditor) {
        editorManager.destroyEditor(revertOriginal);
      }
      instance.view.render();
      if (selection.isSelected() && !keepEditor) {
        editorManager.prepareEditor();
      }
    },

    /**
     * Returns information if we have a multiselection
     * @return {Boolean}
     */
    isMultiple: function () {
      var isMultiple = !(priv.selRange.to.col === priv.selRange.from.col && priv.selRange.to.row === priv.selRange.from.row)
        , modifier = Handsontable.hooks.execute(instance, 'afterIsMultipleSelection', isMultiple);

      if(isMultiple) {
        return modifier;
      }
    },

    /**
     * Selects cell relative to current cell (if possible)
     */
    transformStart: function (rowDelta, colDelta, force) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta);
      instance.runHooks('modifyTransformStart', delta);

      if (priv.selRange.highlight.row + rowDelta > instance.countRows() - 1) {
        if (force && priv.settings.minSpareRows > 0) {
          instance.alter("insert_row", instance.countRows());
        }
        else if (priv.settings.autoWrapCol) {
          delta.row = 1 - instance.countRows();
          delta.col = priv.selRange.highlight.col + delta.col == instance.countCols() - 1 ? 1 - instance.countCols() : 1;
        }
      }
      else if (priv.settings.autoWrapCol && priv.selRange.highlight.row + delta.row < 0 && priv.selRange.highlight.col + delta.col >= 0) {
        delta.row = instance.countRows() - 1;
        delta.col = priv.selRange.highlight.col + delta.col == 0 ? instance.countCols() - 1 : -1;
      }

      if (priv.selRange.highlight.col + delta.col > instance.countCols() - 1) {
        if (force && priv.settings.minSpareCols > 0) {
          instance.alter("insert_col", instance.countCols());
        }
        else if (priv.settings.autoWrapRow) {
          delta.row = priv.selRange.highlight.row + delta.row == instance.countRows() - 1 ? 1 - instance.countRows() : 1;
          delta.col = 1 - instance.countCols();
        }
      }
      else if (priv.settings.autoWrapRow && priv.selRange.highlight.col + delta.col < 0 && priv.selRange.highlight.row + delta.row >= 0) {
        delta.row = priv.selRange.highlight.row + delta.row == 0 ? instance.countRows() - 1 : -1;
        delta.col = instance.countCols() - 1;
      }

      var totalRows = instance.countRows();
      var totalCols = instance.countCols();
      var coords = new WalkontableCellCoords(priv.selRange.highlight.row + delta.row, priv.selRange.highlight.col + delta.col);

      if (coords.row < 0) {
        coords.row = 0;
      }
      else if (coords.row > 0 && coords.row >= totalRows) {
        coords.row = totalRows - 1;
      }

      if (coords.col < 0) {
        coords.col = 0;
      }
      else if (coords.col > 0 && coords.col >= totalCols) {
        coords.col = totalCols - 1;
      }

      selection.setRangeStart(coords);
    },

    /**
     * Sets selection end cell relative to current selection end cell (if possible)
     */
    transformEnd: function (rowDelta, colDelta) {
      var delta = new WalkontableCellCoords(rowDelta, colDelta);
      instance.runHooks('modifyTransformEnd', delta);

        var totalRows = instance.countRows();
        var totalCols = instance.countCols();
        var coords = new WalkontableCellCoords(priv.selRange.to.row + delta.row, priv.selRange.to.col + delta.col);

        if (coords.row < 0) {
          coords.row = 0;
        }
        else if (coords.row > 0 && coords.row >= totalRows) {
          coords.row = totalRows - 1;
        }

        if (coords.col < 0) {
          coords.col = 0;
        }
        else if (coords.col > 0 && coords.col >= totalCols) {
          coords.col = totalCols - 1;
        }

        selection.setRangeEnd(coords);
    },

    /**
     * Returns true if currently there is a selection on screen, false otherwise
     * @return {Boolean}
     */
    isSelected: function () {
      return (priv.selRange !== null);
    },

    /**
     * Returns true if coords is within current selection coords
     * @param {WalkontableCellCoords} coords
     * @return {Boolean}
     */
    inInSelection: function (coords) {
      if (!selection.isSelected()) {
        return false;
      }
      return priv.selRange.includes(coords);
    },

    /**
     * Deselects all selected cells
     */
    deselect: function () {
      if (!selection.isSelected()) {
        return;
      }
      instance.selection.inProgress = false; //needed by HT inception
      priv.selRange = null;
      instance.view.wt.selections.current.clear();
      instance.view.wt.selections.area.clear();
      if (priv.settings.currentRowClassName || priv.settings.currentColClassName) {
        instance.view.wt.selections.highlight.clear();
      }
      editorManager.destroyEditor();
      selection.refreshBorders();
      Handsontable.hooks.run(instance, 'afterDeselect');
    },

    /**
     * Select all cells
     */
    selectAll: function () {
      if (!priv.settings.multiSelect) {
        return;
      }
      selection.setRangeStart(new WalkontableCellCoords(0, 0));
      selection.setRangeEnd(new WalkontableCellCoords(instance.countRows() - 1, instance.countCols() - 1), false);
    },

    /**
     * Deletes data from selected cells
     */
    empty: function () {
      if (!selection.isSelected()) {
        return;
      }
      var topLeft = priv.selRange.getTopLeftCorner();
      var bottomRight = priv.selRange.getBottomRightCorner();
      var r, c, changes = [];
      for (r = topLeft.row; r <= bottomRight.row; r++) {
        for (c = topLeft.col; c <= bottomRight.col; c++) {
          if (!instance.getCellMeta(r, c).readOnly) {
            changes.push([r, c, '']);
          }
        }
      }
      instance.setDataAtCell(changes);
    }
  };

  this.init = function () {
    Handsontable.hooks.run(instance, 'beforeInit');

    this.updateSettings(priv.settings, true);

    this.view = new Handsontable.TableView(this);
    editorManager = new Handsontable.EditorManager(instance, priv, selection, datamap);

    this.forceFullRender = true; //used when data was changed
    this.view.render();

    if (typeof priv.firstRun === 'object') {
      Handsontable.hooks.run(instance, 'afterChange', priv.firstRun[0], priv.firstRun[1]);
      priv.firstRun = false;
    }
    Handsontable.hooks.run(instance, 'afterInit');
  };

  function ValidatorsQueue() { //moved this one level up so it can be used in any function here. Probably this should be moved to a separate file
    var resolved = false;

    return {
      validatorsInQueue: 0,
      addValidatorToQueue: function () {
        this.validatorsInQueue++;
        resolved = false;
      },
      removeValidatorFormQueue: function () {
        this.validatorsInQueue = this.validatorsInQueue - 1 < 0 ? 0 : this.validatorsInQueue - 1;
        this.checkIfQueueIsEmpty();
      },
      onQueueEmpty: function () {
      },
      checkIfQueueIsEmpty: function () {
        if (this.validatorsInQueue == 0 && resolved == false) {
          resolved = true;
          this.onQueueEmpty();
        }
      }
    };
  }

  function validateChanges(changes, source, callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = resolve;

    for (var i = changes.length - 1; i >= 0; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
      }
      else {
        var row = changes[i][0];
        var col = datamap.propToCol(changes[i][1]);
        var logicalCol = instance.runHooksAndReturn('modifyCol', col); //column order may have changes, so we need to translate physical col index (stored in datasource) to logical (displayed to user)
        var cellProperties = instance.getCellMeta(row, logicalCol);

        if (cellProperties.type === 'numeric' && typeof changes[i][3] === 'string') {
          if (changes[i][3].length > 0 && /^-?[\d\s]*(\.|\,)?\d*$/.test(changes[i][3])) {
            var len = changes[i][3].length
            if (typeof cellProperties.language == 'undefined') {
              numeral.language('en');
            }
            else if (changes[i][3].indexOf(".") === len - 3 && changes[i][3].indexOf(",") === -1) { //this input in format XXXX.XX is likely to come from paste. Let's parse it using international rules
              numeral.language('en');
            }
            else {
              numeral.language(cellProperties.language);
            }

            changes[i][3] = numeral().unformat(changes[i][3] || '0'); //numeral cannot unformat empty string
          }
        }

        if (instance.getCellValidator(cellProperties)) {
          waitingForValidator.addValidatorToQueue();
          instance.validateCell(changes[i][3], cellProperties, (function (i, cellProperties) {
            return function (result) {
              if (typeof result !== 'boolean') {
                throw new Error("Validation error: result is not boolean");
              }
              if (result === false && cellProperties.allowInvalid === false) {
                changes.splice(i, 1);         // cancel the change
                cellProperties.valid = true;  // we cancelled the change, so cell value is still valid
                --i;
              }
              waitingForValidator.removeValidatorFormQueue();
            }
          })(i, cellProperties)
            , source);
        }
      }
    }
    waitingForValidator.checkIfQueueIsEmpty();

    function resolve() {
      var beforeChangeResult;

      if (changes.length) {
        beforeChangeResult = Handsontable.hooks.execute(instance, "beforeChange", changes, source);
        if (typeof beforeChangeResult === 'function') {
          $.when(result).then(function () {
            callback(); //called when async validators and async beforeChange are resolved
          });
        }
        else if (beforeChangeResult === false) {
          changes.splice(0, changes.length); //invalidate all changes (remove everything from array)
        }
      }
      if (typeof beforeChangeResult !== 'function') {
        callback(); //called when async validators are resolved and beforeChange was not async
      }
    }
  }

  /**
   * Internal function to apply changes. Called after validateChanges
   * @param {Array} changes Array in form of [row, prop, oldValue, newValue]
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  function applyChanges(changes, source) {
    var i = changes.length - 1;

    if (i < 0) {
      return;
    }

    for (; 0 <= i; i--) {
      if (changes[i] === null) {
        changes.splice(i, 1);
        continue;
      }

      if(changes[i][2] == null && changes[i][3] == null) {
        continue;
      }

      if (priv.settings.minSpareRows) {
        while (changes[i][0] > instance.countRows() - 1) {
          datamap.createRow();
        }
      }

      if (instance.dataType === 'array' && priv.settings.minSpareCols) {
        while (datamap.propToCol(changes[i][1]) > instance.countCols() - 1) {
          datamap.createCol();
        }
      }

      datamap.set(changes[i][0], changes[i][1], changes[i][3]);
    }

    instance.forceFullRender = true; //used when data was changed
    grid.adjustRowsAndCols();
    Handsontable.hooks.run(instance, 'beforeChangeRender', changes, source);
    selection.refreshBorders(null, true);
    Handsontable.hooks.run(instance, 'afterChange', changes, source || 'edit');
  }

  this.validateCell = function (value, cellProperties, callback, source) {
    var validator = instance.getCellValidator(cellProperties);

    if (Object.prototype.toString.call(validator) === '[object RegExp]') {
      validator = (function (validator) {
        return function (value, callback) {
          callback(validator.test(value));
        }
      })(validator);
    }

    if (typeof validator == 'function') {

      value = Handsontable.hooks.execute(instance, "beforeValidate", value, cellProperties.row, cellProperties.prop, source);

      // To provide consistent behaviour, validation should be always asynchronous
      instance._registerTimeout(setTimeout(function () {
        validator.call(cellProperties, value, function (valid) {
          cellProperties.valid = valid;

          valid = Handsontable.hooks.execute(instance, "afterValidate", valid, value, cellProperties.row, cellProperties.prop, source);

          callback(valid);
        });

        return value;
      }, 0));
    } else { //resolve callback even if validator function was not found
      cellProperties.valid = true;
      callback(true);
    }



  };

  function setDataInputToArray(row, prop_or_col, value) {
    if (typeof row === "object") { //is it an array of changes
      return row;
    }
    else if ($.isPlainObject(value)) { //backwards compatibility
      return value;
    }
    else {
      return [
        [row, prop_or_col, value]
      ];
    }
  }

  /**
   * Set data at given cell
   * @public
   * @param {Number|Array} row or array of changes in format [[row, col, value], ...]
   * @param {Number|String} col or source String
   * @param {String} value
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtCell = function (row, col, value, source) {
    var input = setDataInputToArray(row, col, value)
      , i
      , ilen
      , changes = []
      , prop;

    for (i = 0, ilen = input.length; i < ilen; i++) {
      if (typeof input[i] !== 'object') {
        throw new Error('Method `setDataAtCell` accepts row number or changes array of arrays as its first parameter');
      }
      if (typeof input[i][1] !== 'number') {
        throw new Error('Method `setDataAtCell` accepts row and column number as its parameters. If you want to use object property name, use method `setDataAtRowProp`');
      }
      prop = datamap.colToProp(input[i][1]);
      changes.push([
        input[i][0],
        prop,
        datamap.get(input[i][0], prop),
        input[i][2]
      ]);
    }

    if (!source && typeof row === "object") {
      source = col;
    }

    validateChanges(changes, source, function () {
      applyChanges(changes, source);
    });
  };


  /**
   * Set data at given row property
   * @public
   * @param {Number|Array} row or array of changes in format [[row, prop, value], ...]
   * @param {String} prop or source String
   * @param {String} value
   * @param {String} source String that identifies how this change will be described in changes array (useful in onChange callback)
   */
  this.setDataAtRowProp = function (row, prop, value, source) {
    var input = setDataInputToArray(row, prop, value)
      , i
      , ilen
      , changes = [];

    for (i = 0, ilen = input.length; i < ilen; i++) {
      changes.push([
        input[i][0],
        input[i][1],
        datamap.get(input[i][0], input[i][1]),
        input[i][2]
      ]);
    }

    if (!source && typeof row === "object") {
      source = prop;
    }

    validateChanges(changes, source, function () {
      applyChanges(changes, source);
    });
  };

  /**
   * Listen to document body keyboard input
   */
  this.listen = function () {
    Handsontable.activeGuid = instance.guid;

    if (document.activeElement && document.activeElement !== document.body) {
      document.activeElement.blur();
    }
    else if (!document.activeElement) { //IE
      document.body.focus();
    }
  };

  /**
   * Stop listening to document body keyboard input
   */
  this.unlisten = function () {
    Handsontable.activeGuid = null;
  };

  /**
   * Returns true if current Handsontable instance is listening on document body keyboard input
   */
  this.isListening = function () {
    return Handsontable.activeGuid === instance.guid;
  };

  /**
   * Destroys current editor, renders and selects current cell. If revertOriginal != true, edited data is saved
   * @param {Boolean} revertOriginal
   */
  this.destroyEditor = function (revertOriginal) {
    selection.refreshBorders(revertOriginal);
  };

  /**
   * Populate cells at position with 2d array
   * @param {Number} row Start row
   * @param {Number} col Start column
   * @param {Array} input 2d array
   * @param {Number=} endRow End row (use when you want to cut input when certain row is reached)
   * @param {Number=} endCol End column (use when you want to cut input when certain column is reached)
   * @param {String=} [source="populateFromArray"]
   * @param {String=} [method="overwrite"]
   * @return {Object|undefined} ending td in pasted area (only if any cell was changed)
   */
  this.populateFromArray = function (row, col, input, endRow, endCol, source, method) {
    if (!(typeof input === 'object' && typeof input[0] === 'object')) {
      throw new Error("populateFromArray parameter `input` must be an array of arrays"); //API changed in 0.9-beta2, let's check if you use it correctly
    }
    return grid.populateFromArray(new WalkontableCellCoords(row, col), input, typeof endRow === 'number' ? new WalkontableCellCoords(endRow, endCol) : null, source, method);
  };

  /**
   * Adds/removes data from the column
   * @param {Number} col Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  this.spliceCol = function (col, index, amount/*, elements... */) {
    return datamap.spliceCol.apply(datamap, arguments);
  };

  /**
   * Adds/removes data from the row
   * @param {Number} row Index of column in which do you want to do splice.
   * @param {Number} index Index at which to start changing the array. If negative, will begin that many elements from the end
   * @param {Number} amount An integer indicating the number of old array elements to remove. If amount is 0, no elements are removed
   * param {...*} elements Optional. The elements to add to the array. If you don't specify any elements, spliceCol simply removes elements from the array
   */
  this.spliceRow = function (row, index, amount/*, elements... */) {
    return datamap.spliceRow.apply(datamap, arguments);
  };

  /**
   * Returns current selection. Returns undefined if there is no selection.
   * @public
   * @return {Array} [`startRow`, `startCol`, `endRow`, `endCol`]
   */
  this.getSelected = function () { //https://github.com/handsontable/jquery-handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return [priv.selRange.from.row, priv.selRange.from.col, priv.selRange.to.row, priv.selRange.to.col];
    }
  };

  /**
   * Returns current selection as a WalkontableCellRange object. Returns undefined if there is no selection.
   * @public
   * @return {WalkontableCellRange}
   */
  this.getSelectedRange = function () { //https://github.com/handsontable/jquery-handsontable/issues/44  //cjl
    if (selection.isSelected()) {
      return priv.selRange;
    }
  };


  /**
   * Render visible data
   * @public
   */
  this.render = function () {
    if (instance.view) {
      instance.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  /**
   * Load data from array
   * @public
   * @param {Array} data
   */
  this.loadData = function (data) {
    if (typeof data === 'object' && data !== null) {
      if (!(data.push && data.splice)) { //check if data is array. Must use duck-type check so Backbone Collections also pass it
        //when data is not an array, attempt to make a single-row array of it
        data = [data];
      }
    }
    else if(data === null) {
      data = [];
      var row;
      for (var r = 0, rlen = priv.settings.startRows; r < rlen; r++) {
        row = [];
        for (var c = 0, clen = priv.settings.startCols; c < clen; c++) {
          row.push(null);
        }
        data.push(row);
      }
    }
    else {
      throw new Error("loadData only accepts array of objects or array of arrays (" + typeof data + " given)");
    }

    priv.isPopulated = false;
    GridSettings.prototype.data = data;

    if (priv.settings.dataSchema instanceof Array || data[0]  instanceof Array) {
      instance.dataType = 'array';
    }
    else if (typeof priv.settings.dataSchema === 'function') {
      instance.dataType = 'function';
    }
    else {
      instance.dataType = 'object';
    }

    datamap = new Handsontable.DataMap(instance, priv, GridSettings);

    clearCellSettingCache();

    grid.adjustRowsAndCols();
    Handsontable.hooks.run(instance, 'afterLoadData');

    if (priv.firstRun) {
      priv.firstRun = [null, 'loadData'];
    }
    else {
      Handsontable.hooks.run(instance, 'afterChange', null, 'loadData');
      instance.render();
    }

    priv.isPopulated = true;



    function clearCellSettingCache() {
      priv.cellSettings.length = 0;
    }
  };

  /**
   * Return the current data object (the same that was passed by `data` configuration option or `loadData` method). Optionally you can provide cell range `r`, `c`, `r2`, `c2` to get only a fragment of grid data
   * @public
   * @param {Number} r (Optional) From row
   * @param {Number} c (Optional) From col
   * @param {Number} r2 (Optional) To row
   * @param {Number} c2 (Optional) To col
   * @return {Array|Object}
   */
  this.getData = function (r, c, r2, c2) {
    if (typeof r === 'undefined') {
      return datamap.getAll();
    } else {
      return datamap.getRange(new WalkontableCellCoords(r, c), new WalkontableCellCoords(r2, c2), datamap.DESTINATION_RENDERER);
    }
  };

  this.getCopyableData = function (startRow, startCol, endRow, endCol) {
    return datamap.getCopyableText(new WalkontableCellCoords(startRow, startCol), new WalkontableCellCoords(endRow, endCol));
  };

  /**
   * Update settings
   * @public
   */
  this.updateSettings = function (settings, init) {
    var i, clen;

    if (typeof settings.rows !== "undefined") {
      throw new Error("'rows' setting is no longer supported. do you mean startRows, minRows or maxRows?");
    }
    if (typeof settings.cols !== "undefined") {
      throw new Error("'cols' setting is no longer supported. do you mean startCols, minCols or maxCols?");
    }

    for (i in settings) {
      if (i === 'data') {
        continue; //loadData will be triggered later
      }
      else {
        if (Handsontable.hooks.hooks[i] !== void 0 || Handsontable.hooks.legacy[i] !== void 0) {
          if (typeof settings[i] === 'function' || Handsontable.helper.isArray(settings[i])) {
            instance.addHook(i, settings[i]);
          }
        }
        else {
          // Update settings
          if (!init && settings.hasOwnProperty(i)) {
            GridSettings.prototype[i] = settings[i];
          }
        }
      }
    }

    // Load data or create data map
    if (settings.data === void 0 && priv.settings.data === void 0) {
      instance.loadData(null); //data source created just now
    }
    else if (settings.data !== void 0) {
      instance.loadData(settings.data); //data source given as option
    }
    else if (settings.columns !== void 0) {
      datamap.createMap();
    }

    // Init columns constructors configuration
    clen = instance.countCols();

    //Clear cellSettings cache
    priv.cellSettings.length = 0;

    if (clen > 0) {
      var proto, column;

      for (i = 0; i < clen; i++) {
        priv.columnSettings[i] = Handsontable.helper.columnFactory(GridSettings, priv.columnsSettingConflicts);

        // shortcut for prototype
        proto = priv.columnSettings[i].prototype;

        // Use settings provided by user
        if (GridSettings.prototype.columns) {
          column = GridSettings.prototype.columns[i];
          Handsontable.helper.extend(proto, column);
          Handsontable.helper.extend(proto, expandType(column));
        }
      }
    }

    if (typeof settings.cell !== 'undefined') {
      for(i in settings.cell) {
        var cell = settings.cell[i];
        instance.setCellMetaObject(cell.row, cell.col, cell);
      }
    }

    Handsontable.hooks.run(instance, 'afterCellMetaReset');

    if (typeof settings.className !== "undefined") {
      if (GridSettings.prototype.className) {
        instance.rootElement.removeClass(GridSettings.prototype.className);
      }
      if (settings.className) {
        instance.rootElement.addClass(settings.className);
      }
    }

    if (typeof settings.height != 'undefined'){
      var height = settings.height;

      if (typeof height == 'function'){
        height = height();
      }

      instance.rootElement[0].style.height = height + 'px';
    }

    if (typeof settings.width != 'undefined'){
      var width = settings.width;

      if (typeof width == 'function'){
        width = width();
      }

      instance.rootElement[0].style.width = width + 'px';
    }

    if (height){
      instance.rootElement[0].style.overflow = 'auto';
    }

    if (!init) {
      Handsontable.hooks.run(instance, 'afterUpdateSettings');
    }

    grid.adjustRowsAndCols();
    if (instance.view && !priv.firstRun) {
      instance.forceFullRender = true; //used when data was changed
      selection.refreshBorders(null, true);
    }
  };

  this.getValue = function () {
    var sel = instance.getSelected();
    if (GridSettings.prototype.getValue) {
      if (typeof GridSettings.prototype.getValue === 'function') {
        return GridSettings.prototype.getValue.call(instance);
      }
      else if (sel) {
        return instance.getData()[sel[0]][GridSettings.prototype.getValue];
      }
    }
    else if (sel) {
      return instance.getDataAtCell(sel[0], sel[1]);
    }
  };

  function expandType(obj) {
    if (!obj.hasOwnProperty('type')) return; //ignore obj.prototype.type


    var type, expandedType = {};

    if (typeof obj.type === 'object') {
      type = obj.type;
    }
    else if (typeof obj.type === 'string') {
      type = Handsontable.cellTypes[obj.type];
      if (type === void 0) {
        throw new Error('You declared cell type "' + obj.type + '" as a string that is not mapped to a known object. Cell type must be an object or a string mapped to an object in Handsontable.cellTypes');
      }
    }


    for (var i in type) {
      if (type.hasOwnProperty(i) && !obj.hasOwnProperty(i)) {
        expandedType[i] = type[i];
      }
    }

    return expandedType;

  };

  /**
   * Returns current settings object
   * @return {Object}
   */
  this.getSettings = function () {
    return priv.settings;
  };

  /**
   * Clears grid
   * @public
   */
  this.clear = function () {
    selection.selectAll();
    selection.empty();
  };

  /**
   * Inserts or removes rows and columns
   * @param {String} action See grid.alter for possible values
   * @param {Number} index
   * @param {Number} amount
   * @param {String} [source] Optional. Source of hook runner.
   * @param {Boolean} [keepEmptyRows] Optional. Flag for preventing deletion of empty rows.
   * @public
   */
  this.alter = function (action, index, amount, source, keepEmptyRows) {
    grid.alter(action, index, amount, source, keepEmptyRows);
  };

  /**
   * Returns <td> element corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Element}
   */
  this.getCell = function (row, col) {
    return instance.view.getCellAtCoords(new WalkontableCellCoords(row, col));
  };

  /**
   * Returns property name associated with column number
   * @param {Number} col
   * @public
   * @return {String}
   */
  this.colToProp = function (col) {
    return datamap.colToProp(col);
  };

  /**
   * Returns column number associated with property name
   * @param {String} prop
   * @public
   * @return {Number}
   */
  this.propToCol = function (prop) {
    return datamap.propToCol(prop);
  };

  /**
   * Return value at `row`, `col`
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtCell = function (row, col) {
    return datamap.get(row, datamap.colToProp(col));
  };

  /**
   * Return value at `row`, `prop`
   * @param {Number} row
   * @param {String} prop
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtRowProp = function (row, prop) {
    return datamap.get(row, prop);
  };

  /**
   * Return value at `col`, where `col` is the visible index of the column
   * @param {Number} col
   * @public
   * @return {Array} value (mixed data type)
   */
  this.getDataAtCol = function (col) {
    var out = [];
    return out.concat.apply(out, datamap.getRange(new WalkontableCellCoords(0, col), new WalkontableCellCoords(priv.settings.data.length - 1, col), datamap.DESTINATION_RENDERER));
  };

  /**
   * Return value at `prop`
   * @param {String} prop
   * @public
   * @return {Array} value (mixed data type)
   */
  this.getDataAtProp = function (prop) {
    var out = [];
    return out.concat.apply(out, datamap.getRange(new WalkontableCellCoords(0, datamap.propToCol(prop)), new WalkontableCellCoords(priv.settings.data.length - 1, datamap.propToCol(prop)), datamap.DESTINATION_RENDERER));
  };

  /**
   * Return original source values at 'col'
   * @param {Number} col
   * @public
   * @returns value (mixed data type)
   */
  this.getSourceDataAtCol = function (col) {
    var out = [],
        data = priv.settings.data;

    for (var i = 0; i < data.length; i++) {
      out.push(data[i][col]);
    }

    return out;
  };

  /**
   * Return original source values at 'row'
   * @param {Number} row
   * @public
   * @returns value {mixed data type}
   */
  this.getSourceDataAtRow = function (row) {
    return priv.settings.data[row];
  };

  /**
   * Return value at `row`
   * @param {Number} row
   * @public
   * @return value (mixed data type)
   */
  this.getDataAtRow = function (row) {
    var data = datamap.getRange(new WalkontableCellCoords(row, 0), new WalkontableCellCoords(row, this.countCols() - 1), datamap.DESTINATION_RENDERER);
    return data[0];
  };

  /***
   *  Remove "key" property object from cell meta data corresponding to params row,col
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   */
  this.removeCellMeta = function(row, col, key) {
    var cellMeta = instance.getCellMeta(row, col);
    if(cellMeta[key] != undefined){
      delete priv.cellSettings[row][col][key];
    }
  };

  /**
   * Set cell meta data object to corresponding params row, col
   * @param {Number} row
   * @param {Number} col
   * @param {Object} prop
   */
  this.setCellMetaObject = function (row, col, prop) {
    if (typeof prop === 'object') {
      for (var i in prop) {
        var key = i,
            value = prop[i];

        this.setCellMeta(row, col, key, value);
      }
    }
  };

  /**
   * Sets cell meta data object "key" corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @param {String} key
   * @param {String} val
   *
   */
  this.setCellMeta = function (row, col, key, val) {
    if (!priv.cellSettings[row]) {
      priv.cellSettings[row] = [];
    }
    if (!priv.cellSettings[row][col]) {
      priv.cellSettings[row][col] = new priv.columnSettings[col]();
    }
    priv.cellSettings[row][col][key] = val;
    Handsontable.hooks.run(instance, 'afterSetCellMeta', row, col, key, val);
  };

  /**
   * Returns cell meta data object corresponding to params row, col
   * @param {Number} row
   * @param {Number} col
   * @public
   * @return {Object}
   */
  this.getCellMeta = function (row, col) {
    var prop = datamap.colToProp(col)
      , cellProperties;

    row = translateRowIndex(row);
    col = translateColIndex(col);

    if (!priv.columnSettings[col]) {
      priv.columnSettings[col] = Handsontable.helper.columnFactory(GridSettings, priv.columnsSettingConflicts);
    }

    if (!priv.cellSettings[row]) {
      priv.cellSettings[row] = [];
    }
    if (!priv.cellSettings[row][col]) {
      priv.cellSettings[row][col] = new priv.columnSettings[col]();
    }

    cellProperties = priv.cellSettings[row][col]; //retrieve cellProperties from cache

    cellProperties.row = row;
    cellProperties.col = col;
    cellProperties.prop = prop;
    cellProperties.instance = instance;

    Handsontable.hooks.run(instance, 'beforeGetCellMeta', row, col, cellProperties);
    Handsontable.helper.extend(cellProperties, expandType(cellProperties)); //for `type` added in beforeGetCellMeta

    if (cellProperties.cells) {
      var settings = cellProperties.cells.call(cellProperties, row, col, prop);

      if (settings) {
        Handsontable.helper.extend(cellProperties, settings);
        Handsontable.helper.extend(cellProperties, expandType(settings)); //for `type` added in cells
      }
    }

    Handsontable.hooks.run(instance, 'afterGetCellMeta', row, col, cellProperties);

    return cellProperties;
  };

  /**
   * If displayed rows order is different than the order of rows stored in memory (i.e. sorting is applied)
   * we need to translate logical (stored) row index to physical (displayed) index.
   * @param row - original row index
   * @returns {int} translated row index
   */
  function translateRowIndex(row){
    return Handsontable.hooks.execute(instance, 'modifyRow', row);
  }

  /**
   * If displayed columns order is different than the order of columns stored in memory (i.e. column were moved using manualColumnMove plugin)
   * we need to translate logical (stored) column index to physical (displayed) index.
   * @param col - original column index
   * @returns {int} - translated column index
   */
  function translateColIndex(col){
    return Handsontable.hooks.execute(instance, 'modifyCol', col); // warning: this must be done after datamap.colToProp
  }

  var rendererLookup = Handsontable.helper.cellMethodLookupFactory('renderer');
  this.getCellRenderer = function (row, col) {
    var renderer = rendererLookup.call(this, row, col);
    return Handsontable.renderers.getRenderer(renderer);

  };

  this.getCellEditor = Handsontable.helper.cellMethodLookupFactory('editor');

  this.getCellValidator = Handsontable.helper.cellMethodLookupFactory('validator');


  /**
   * Validates all cells using their validator functions and calls callback when finished. Does not render the view
   * @param callback
   */
  this.validateCells = function (callback) {
    var waitingForValidator = new ValidatorsQueue();
    waitingForValidator.onQueueEmpty = callback;

    var i = instance.countRows() - 1;
    while (i >= 0) {
      var j = instance.countCols() - 1;
      while (j >= 0) {
        waitingForValidator.addValidatorToQueue();
        instance.validateCell(instance.getDataAtCell(i, j), instance.getCellMeta(i, j), function () {
          waitingForValidator.removeValidatorFormQueue();
        }, 'validateCells');
        j--;
      }
      i--;
    }
    waitingForValidator.checkIfQueueIsEmpty();
  };

  /**
   * Return array of row headers (if they are enabled). If param `row` given, return header at given row as string
   * @param {Number} row (Optional)
   * @return {Array|String}
   */
  this.getRowHeader = function (row) {
    if (row === void 0) {
      var out = [];
      for (var i = 0, ilen = instance.countRows(); i < ilen; i++) {
        out.push(instance.getRowHeader(i));
      }
      return out;
    }
    else if (Object.prototype.toString.call(priv.settings.rowHeaders) === '[object Array]' && priv.settings.rowHeaders[row] !== void 0) {
      return priv.settings.rowHeaders[row];
    }
    else if (typeof priv.settings.rowHeaders === 'function') {
      return priv.settings.rowHeaders(row);
    }
    else if (priv.settings.rowHeaders && typeof priv.settings.rowHeaders !== 'string' && typeof priv.settings.rowHeaders !== 'number') {
      return row + 1;
    }
    else {
      return priv.settings.rowHeaders;
    }
  };

  /**
   * Returns information of this table is configured to display row headers
   * @returns {boolean}
   */
  this.hasRowHeaders = function () {
    return !!priv.settings.rowHeaders;
  };

  /**
   * Returns information of this table is configured to display column headers
   * @returns {boolean}
   */
  this.hasColHeaders = function () {
    if (priv.settings.colHeaders !== void 0 && priv.settings.colHeaders !== null) { //Polymer has empty value = null
      return !!priv.settings.colHeaders;
    }
    for (var i = 0, ilen = instance.countCols(); i < ilen; i++) {
      if (instance.getColHeader(i)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Return array of column headers (if they are enabled). If param `col` given, return header at given column as string
   * @param {Number} col (Optional)
   * @return {Array|String}
   */
  this.getColHeader = function (col) {
    if (col === void 0) {
      var out = [];
      for (var i = 0, ilen = instance.countCols(); i < ilen; i++) {
        out.push(instance.getColHeader(i));
      }
      return out;
    }
    else {
      var baseCol = col;
      col = Handsontable.hooks.execute(instance, 'modifyCol', col);

      if (priv.settings.columns && priv.settings.columns[col] && priv.settings.columns[col].title) {
        return priv.settings.columns[col].title;
      }
      else if (Object.prototype.toString.call(priv.settings.colHeaders) === '[object Array]' && priv.settings.colHeaders[col] !== void 0) {
        return priv.settings.colHeaders[col];
      }
      else if (typeof priv.settings.colHeaders === 'function') {
        return priv.settings.colHeaders(col);
      }
      else if (priv.settings.colHeaders && typeof priv.settings.colHeaders !== 'string' && typeof priv.settings.colHeaders !== 'number') {
        return Handsontable.helper.spreadsheetColumnLabel(baseCol); //see #1458
      }
      else {
        return priv.settings.colHeaders;
      }
    }
  };

  /**
   * Return column width from settings (no guessing). Private use intended
   * @param {Number} col
   * @return {Number}
   */
  this._getColWidthFromSettings = function (col) {
    var cellProperties = instance.getCellMeta(0, col);
    var width = cellProperties.width;
    if (width === void 0 || width === priv.settings.width) {
      width = cellProperties.colWidths;
    }
    if (width !== void 0 && width !== null) {
      switch (typeof width) {
        case 'object': //array
          width = width[col];
          break;

        case 'function':
          width = width(col);
          break;
      }
      if (typeof width === 'string') {
        width = parseInt(width, 10);
      }
    }
    return width;
  };

  /**
   * Return column width
   * @param {Number} col
   * @return {Number}
   */
  this.getColWidth = function (col) {
    var width = instance._getColWidthFromSettings(col);
    if (!width) {
      width = 50;
    }
    width = Handsontable.hooks.execute(instance, 'modifyColWidth', width, col);
    return width;
  };

  /**
   * Return row height from settings (no guessing). Private use intended
   * @param {Number} row
   * @return {Number}
   */
  this._getRowHeightFromSettings= function (row) {
    /* inefficient
    var cellProperties = instance.getCellMeta(0, row);
    var height = cellProperties.height;
    if (height === void 0 || height === priv.settings.height) {
      height = cellProperties.rowHeights;
    }
    */
    var height = priv.settings.rowHeights; //only uses grid settings
    if (height !== void 0 && height !== null) {
      switch (typeof height) {
        case 'object': //array
          height = height[row];
          break;

        case 'function':
          height = height(row);
          break;
      }
      if (typeof height === 'string') {
        height = parseInt(height, 10);
      }
    }
    return height;
  };

  /**
   * Return row height
   * @param {Number} row
   * @return {Number}
   */
  this.getRowHeight = function (row) {
    var height = instance._getRowHeightFromSettings(row),
        oversizedHeight = instance.checkIfRowIsOversized(row);

    height = Handsontable.hooks.execute(instance, 'modifyRowHeight', height, row);

    if(oversizedHeight) {
      height = height ? Math.max(height,oversizedHeight) : oversizedHeight;
    }

    return height;
  };



  /**
   * Checks if any of the row's cells content exceeds its initial height, and if so, returns the oversized height
   * @param {Number} row
   * @return {Number}
   */
   this.checkIfRowIsOversized = function(row) {
      if(instance.view.wt.wtTable.oversizedRows) {
        return instance.view.wt.wtTable.oversizedRows[row];
      }
   };


  /**
   * Return total number of rows in grid
   * @return {Number}
   */
  this.countRows = function () {
    return priv.settings.data.length;
  };

  /**
   * Return total number of columns in grid
   * @return {Number}
   */
  this.countCols = function () {
    if (instance.dataType === 'object' || instance.dataType === 'function') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      }
      else {
        return datamap.colToPropCache.length;
      }
    }
    else if (instance.dataType === 'array') {
      if (priv.settings.columns && priv.settings.columns.length) {
        return priv.settings.columns.length;
      }
      else if (priv.settings.data && priv.settings.data[0] && priv.settings.data[0].length) {
        return priv.settings.data[0].length;
      }
      else {
        return 0;
      }
    }
  };

  /**
   * Return index of first visible row
   * @return {Number}
   */
  this.rowOffset = function () {
    return instance.view.wt.getSetting('offsetRow'); //actually offsetRow is the first rendered row, not neccessarily first visible
  };

  /**
   * Return index of first visible column
   * @return {Number}
   */
  this.colOffset = function () {
    return 0; //all columns are always rendered
  };

  /**
   * Return number of visible rows. Returns -1 if table is not visible
   * @return {Number}
   */
  this.countVisibleRows = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.rowStrategy.countVisible() : -1;
  };

  /**
   * Return number of visible columns. Returns -1 if table is not visible
   * @return {Number}
   */
  this.countVisibleCols = function () {
    return instance.view.wt.drawn ? instance.view.wt.wtTable.columnStrategy.countVisible() : -1;
  };

  /**
   * Return number of empty rows
   * @return {Boolean} ending If true, will only count empty rows at the end of the data source
   */
  this.countEmptyRows = function (ending) {
    var i = instance.countRows() - 1
      , empty = 0
      , row;
    while (i >= 0) {
      row = Handsontable.hooks.execute(this, 'modifyRow', i);
      if (instance.isEmptyRow(row)) {
        empty++;
      }
      else if (ending) {
        break;
      }
      i--;
    }
    return empty;
  };

  /**
   * Return number of empty columns
   * @return {Boolean} ending If true, will only count empty columns at the end of the data source row
   */
  this.countEmptyCols = function (ending) {
    if (instance.countRows() < 1) {
      return 0;
    }

    var i = instance.countCols() - 1
      , empty = 0;
    while (i >= 0) {
      if (instance.isEmptyCol(i)) {
        empty++;
      }
      else if (ending) {
        break;
      }
      i--;
    }
    return empty;
  };

  /**
   * Return true if the row at the given index is empty, false otherwise
   * @param {Number} r Row index
   * @return {Boolean}
   */
  this.isEmptyRow = function (r) {
    return priv.settings.isEmptyRow.call(instance, r);
  };

  /**
   * Return true if the column at the given index is empty, false otherwise
   * @param {Number} c Column index
   * @return {Boolean}
   */
  this.isEmptyCol = function (c) {
    return priv.settings.isEmptyCol.call(instance, c);
  };

  /**
   * Selects cell on grid. Optionally selects range to another cell
   * @param {Number} row
   * @param {Number} col
   * @param {Number} [endRow]
   * @param {Number} [endCol]
   * @param {Boolean} [scrollToCell=true] If true, viewport will be scrolled to the selection
   * @public
   * @return {Boolean}
   */
  this.selectCell = function (row, col, endRow, endCol, scrollToCell) {
    if (typeof row !== 'number' || row < 0 || row >= instance.countRows()) {
      return false;
    }
    if (typeof col !== 'number' || col < 0 || col >= instance.countCols()) {
      return false;
    }
    if (typeof endRow !== "undefined") {
      if (typeof endRow !== 'number' || endRow < 0 || endRow >= instance.countRows()) {
        return false;
      }
      if (typeof endCol !== 'number' || endCol < 0 || endCol >= instance.countCols()) {
        return false;
      }
    }
    var coords = new WalkontableCellCoords(row, col);
    priv.selRange = new WalkontableCellRange(coords, coords, coords);
    if (document.activeElement && document.activeElement !== document.documentElement && document.activeElement !== document.body) {
      document.activeElement.blur(); //needed or otherwise prepare won't focus the cell. selectionSpec tests this (should move focus to selected cell)
    }
    instance.listen();
    if (typeof endRow === "undefined") {
      selection.setRangeEnd(priv.selRange.from, scrollToCell);
    }
    else {
      selection.setRangeEnd(new WalkontableCellCoords(endRow, endCol), scrollToCell);
    }

    instance.selection.finish();
    return true;
  };

  this.selectCellByProp = function (row, prop, endRow, endProp, scrollToCell) {
    arguments[1] = datamap.propToCol(arguments[1]);
    if (typeof arguments[3] !== "undefined") {
      arguments[3] = datamap.propToCol(arguments[3]);
    }
    return instance.selectCell.apply(instance, arguments);
  };

  /**
   * Deselects current sell selection on grid
   * @public
   */
  this.deselectCell = function () {
    selection.deselect();
  };

  /**
   * Remove grid from DOM
   * @public
   */
  this.destroy = function () {
    instance._clearTimeouts();
    if (instance.view) { //in case HT is destroyed before initialization has finished
      instance.view.wt.destroy();
    }
    instance.rootElement.empty();
    instance.rootElement.removeData('handsontable');
    instance.rootElement.off('.handsontable');
    $(window).off('.' + instance.guid);
    $document.off('.' + instance.guid);
    $body.off('.' + instance.guid);
    Handsontable.hooks.run(instance, 'afterDestroy');
    Handsontable.hooks.destroy(instance);

    for (var i in instance) {
      if (instance.hasOwnProperty(i)) {
        //replace instance methods with post mortem
        if (typeof instance[i] === "function") {
          if (i !== "runHooks" && i !== "runHooksAndReturn") {
            instance[i] = postMortem;
          }
        }
        //replace instance properties with null (restores memory)
        //it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
        else if (i !== "guid") {
          instance[i] = null;
        }
      }
    }

    //replace private properties with null (restores memory)
    //it should not be necessary but this prevents a memory leak side effects that show itself in Jasmine tests
    priv = null;
    datamap = null;
    grid = null;
    selection = null;
    editorManager = null;
    instance = null;
    GridSettings = null;
    $document = null;
    $body = null;
  };

  /**
   * Replacement for all methods after Handsotnable was destroyed
   */
  function postMortem() {
    throw new Error("This method cannot be called because this Handsontable instance has been destroyed");
  };

  /**
   * Returns active editor object
   * @returns {Object}
   */
  this.getActiveEditor = function(){
    return editorManager.getActiveEditor();
  };

  /**
   * Return Handsontable instance
   * @public
   * @return {Object}
   */
  this.getInstance = function () {
    return instance;
  };

  this.addHook = function (key, fn) {
    Handsontable.hooks.add(key, fn, instance);
  };

  this.addHookOnce = function (key, fn) {
    Handsontable.hooks.once(key, fn, instance);
  };

  this.removeHook = function (key, fn) {
    Handsontable.hooks.remove(key, fn, instance);
  };

  this.runHooks = function (key, p1, p2, p3, p4, p5, p6) {
    Handsontable.hooks.run(instance, key, p1, p2, p3, p4, p5, p6);
  };

  this.runHooksAndReturn = function (key, p1, p2, p3, p4, p5, p6) {
    return Handsontable.hooks.execute(instance, key, p1, p2, p3, p4, p5, p6);
  };

  this.timeouts = [];

  /**
   * Sets timeout. Purpose of this method is to clear all known timeouts when `destroy` method is called
   * @public
   */
  this._registerTimeout = function (handle) {
    this.timeouts.push(handle);
  };

  /**
   * Clears all known timeouts
   * @public
   */
  this._clearTimeouts = function () {
    for(var i = 0, ilen = this.timeouts.length; i<ilen; i++) {
      clearTimeout(this.timeouts[i]);
    }
  };

  /**
   * Handsontable version
   */
  this.version = '@@version'; //inserted by grunt from package.json
};

var DefaultSettings = function () {};

DefaultSettings.prototype = {
  data: void 0,
  dataSchema: void 0,
  width: void 0,
  height: void 0,
  startRows: 5,
  startCols: 5,
  rowHeaders: null,
  colHeaders: null,
  colWidths: void 0,
  columns: void 0,
  cells: void 0,
  cell: [],
  minRows: 0,
  minCols: 0,
  maxRows: Infinity,
  maxCols: Infinity,
  minSpareRows: 0,
  minSpareCols: 0,
  multiSelect: true,
  fillHandle: true,
  fixedRowsTop: 0,
  fixedColumnsLeft: 0,
  outsideClickDeselects: true,
  enterBeginsEditing: true,
  enterMoves: {row: 1, col: 0},
  tabMoves: {row: 0, col: 1},
  autoWrapRow: false,
  autoWrapCol: false,
  copyRowsLimit: 1000,
  copyColsLimit: 1000,
  pasteMode: 'overwrite',
  currentRowClassName: void 0,
  currentColClassName: void 0,
  stretchH: 'none',
  isEmptyRow: function (r) {
    var val;
    for (var c = 0, clen = this.countCols(); c < clen; c++) {
      val = this.getDataAtCell(r, c);
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        return false;
      }
    }
    return true;
  },
  isEmptyCol: function (c) {
    var val;
    for (var r = 0, rlen = this.countRows(); r < rlen; r++) {
      val = this.getDataAtCell(r, c);
      if (val !== '' && val !== null && typeof val !== 'undefined') {
        return false;
      }
    }
    return true;
  },
  observeDOMVisibility: true,
  allowInvalid: true,
  invalidCellClassName: 'htInvalid',
  placeholder: false,
  placeholderCellClassName: 'htPlaceholder',
  readOnlyCellClassName: 'htDimmed',
  commentedCellClassName: 'htCommentCell',
  fragmentSelection: false,
  readOnly: false,
  type: 'text',
  copyable: true,
  debug: false, //shows debug overlays in Walkontable
  wordWrap: true,
  noWordWrapClassName: 'htNoWrap',
  contextMenu: void 0,
  undo: void 0,
  columnSorting: void 0,
  manualColumnMove: void 0,
  manualColumnResize: void 0,
  manualRowMove: void 0,
  manualRowResize: void 0,
  groups: void 0
};
Handsontable.DefaultSettings = DefaultSettings;

$.fn.handsontable = function (action) {
  var i
    , ilen
    , args
    , output
    , userSettings
    , $this = this.first() // Use only first element from list
    , instance = $this.data('handsontable');

  // Init case
  if (typeof action !== 'string') {
    userSettings = action || {};
    if (instance) {
      instance.updateSettings(userSettings);
    }
    else {
      instance = new Handsontable.Core($this, userSettings);
      $this.data('handsontable', instance);
      instance.init();
    }

    return $this;
  }
  // Action case
  else {
    args = [];
    if (arguments.length > 1) {
      for (i = 1, ilen = arguments.length; i < ilen; i++) {
        args.push(arguments[i]);
      }
    }

    if (instance) {
      if (typeof instance[action] !== 'undefined') {
        output = instance[action].apply(instance, args);
      }
      else {
        throw new Error('Handsontable do not provide action: ' + action);
      }
    }

    return output;
  }
};
