(function(Handsontable){
  'use strict';

  Handsontable.EditorManager = function(instance, priv, selection){
    var that = this;
    var $document = $(document);
    var keyCodes = Handsontable.helper.keyCode;
    var destroyed = false;

    var activeEditor;

    var init = function () {

      function onKeyDown(event) {

        if (!instance.isListening()) {
          return;
        }

        Handsontable.hooks.run(instance, 'beforeKeyDown', event);

        if(destroyed) {
          return;
        }

        if (!event.isImmediatePropagationStopped()) {

          priv.lastKeyCode = event.keyCode;
          if (selection.isSelected()) {
            var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

            if (!activeEditor.isWaiting()) {
              if (!Handsontable.helper.isMetaKey(event.keyCode) && !ctrlDown && !that.isEditorOpened()) {
                that.openEditor("");
                return;
              }
            }

            var rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;

              switch (event.keyCode) {

                case keyCodes.A:
                  if (ctrlDown) {
                    selection.selectAll(); //select all cells

                    event.preventDefault();
                    event.stopPropagation();
                  }
                  break;

                case keyCodes.ARROW_UP:

                  if (that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionUp(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_DOWN:
                  if (that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionDown(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_RIGHT:
                  if(that.isEditorOpened()  && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionRight(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ARROW_LEFT:
                  if(that.isEditorOpened() && !activeEditor.isWaiting()){
                    that.closeEditorAndSaveChanges(ctrlDown);
                  }

                  moveSelectionLeft(event.shiftKey);

                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.TAB:
                  var tabMoves = typeof priv.settings.tabMoves === 'function' ? priv.settings.tabMoves(event) : priv.settings.tabMoves;
                  if (event.shiftKey) {
                    selection.transformStart(-tabMoves.row, -tabMoves.col); //move selection left
                  }
                  else {
                    selection.transformStart(tabMoves.row, tabMoves.col, true); //move selection right (add a new column if needed)
                  }
                  event.preventDefault();
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.BACKSPACE:
                case keyCodes.DELETE:
                  selection.empty(event);
                  that.prepareEditor();
                  event.preventDefault();
                  break;

                case keyCodes.F2: /* F2 */
                  that.openEditor();
                  event.preventDefault(); //prevent Opera from opening Go to Page dialog
                  break;

                case keyCodes.ENTER: /* return/enter */
                  if(that.isEditorOpened()){

                    if (activeEditor.state !== Handsontable.EditorState.WAITING){
                      that.closeEditorAndSaveChanges(ctrlDown);
                    }

                    moveSelectionAfterEnter(event.shiftKey);

                  } else {

                    if (instance.getSettings().enterBeginsEditing){
                      that.openEditor();
                    } else {
                      moveSelectionAfterEnter(event.shiftKey);
                    }

                  }

                  event.preventDefault(); //don't add newline to field
                  event.stopImmediatePropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.ESCAPE:
                  if(that.isEditorOpened()){
                    that.closeEditorAndRestoreOriginalValue(ctrlDown);
                  }
                  event.preventDefault();
                  break;

                case keyCodes.HOME:
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(new WalkontableCellCoords(0, priv.selRange.from.col));
                  }
                  else {
                    rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, 0));
                  }
                  event.preventDefault(); //don't scroll the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.END:
                  if (event.ctrlKey || event.metaKey) {
                    rangeModifier(new WalkontableCellCoords(instance.countRows() - 1, priv.selRange.from.col));
                  }
                  else {
                    rangeModifier(new WalkontableCellCoords(priv.selRange.from.row, instance.countCols() - 1));
                  }
                  event.preventDefault(); //don't scroll the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.PAGE_UP:
                  selection.transformStart(-instance.countVisibleRows(), 0);
                  instance.view.wt.scrollVertical(-instance.countVisibleRows());
                  instance.view.render();
                  event.preventDefault(); //don't page up the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;

                case keyCodes.PAGE_DOWN:
                  selection.transformStart(instance.countVisibleRows(), 0);
                  instance.view.wt.scrollVertical(instance.countVisibleRows());
                  instance.view.render();
                  event.preventDefault(); //don't page down the window
                  event.stopPropagation(); //required by HandsontableEditor
                  break;
              }

          }
        }
      }

      instance.addHook('afterDocumentKeyDown', function(originalEvent){
        onKeyDown(originalEvent);
      });

      $document.on('keydown.' + instance.guid, function(ev) {
        instance.runHooks('afterDocumentKeyDown', ev);
      });

      function onDblClick(event, coords, elem) {
        if(elem.nodeName == "TD") { //may be TD or TH
          //that.instance.destroyEditor();
          that.openEditor();
        }
      }

      instance.view.wt.update('onCellDblClick', onDblClick);

      instance.addHook('afterDestroy', function(){
        destroyed = true;
      });

      function moveSelectionAfterEnter(shiftKey){
        var enterMoves = typeof priv.settings.enterMoves === 'function' ? priv.settings.enterMoves(event) : priv.settings.enterMoves;

        if (shiftKey) {
          selection.transformStart(-enterMoves.row, -enterMoves.col); //move selection up
        }
        else {
          selection.transformStart(enterMoves.row, enterMoves.col, true); //move selection down (add a new row if needed)
        }
      }

      function moveSelectionUp(shiftKey){
        if (shiftKey) {
          selection.transformEnd(-1, 0);
        }
        else {
          selection.transformStart(-1, 0);
        }
      }

      function moveSelectionDown(shiftKey){
        if (shiftKey) {
          selection.transformEnd(1, 0); //expanding selection down with shift
        }
        else {
          selection.transformStart(1, 0); //move selection down
        }
      }

      function moveSelectionRight(shiftKey){
        if (shiftKey) {
          selection.transformEnd(0, 1);
        }
        else {
          selection.transformStart(0, 1);
        }
      }

      function moveSelectionLeft(shiftKey){
        if (shiftKey) {
          selection.transformEnd(0, -1);
        }
        else {
          selection.transformStart(0, -1);
        }
      }
    };

    /**
     * Destroy current editor, if exists
     * @param {Boolean} revertOriginal
     */
    this.destroyEditor = function (revertOriginal) {
      this.closeEditor(revertOriginal);
    };

    this.getActiveEditor = function () {
      return activeEditor;
    };

    /**
     * Prepare text input to be displayed at given grid cell
     */
    this.prepareEditor = function () {

      if (activeEditor && activeEditor.isWaiting()){

        this.closeEditor(false, false, function(dataSaved){
          if(dataSaved){
            that.prepareEditor();
          }
        });

        return;
      }

      var row = priv.selRange.highlight.row;
      var col = priv.selRange.highlight.col;
      var prop = instance.colToProp(col);
      var td = instance.getCell(row, col);
      var originalValue = instance.getDataAtCell(row, col);
      var cellProperties = instance.getCellMeta(row, col);

      var editorClass = instance.getCellEditor(cellProperties);
      activeEditor = Handsontable.editors.getEditor(editorClass, instance);

      activeEditor.prepare(row, col, prop, td, originalValue, cellProperties);

    };

    this.isEditorOpened = function () {
      return activeEditor.isOpened();
    };

    this.openEditor = function (initialValue) {
      if (!activeEditor.cellProperties.readOnly){
        activeEditor.beginEditing(initialValue);
      }
    };

    this.closeEditor = function (restoreOriginalValue, ctrlDown, callback) {

      if (!activeEditor){
        if(callback) {
          callback(false);
        }
      }
      else {
        activeEditor.finishEditing(restoreOriginalValue, ctrlDown, callback);
      }
    };

    this.closeEditorAndSaveChanges = function(ctrlDown){
      return this.closeEditor(false, ctrlDown);
    };

    this.closeEditorAndRestoreOriginalValue = function(ctrlDown){
      return this.closeEditor(true, ctrlDown);
    };

    init();
  };

})(Handsontable);
