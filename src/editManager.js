(function(Handsontable){
  'use strict';

  var registeredEditors = {};

  Handsontable.EditManager = function(instance, priv, selection, datamap){
    var self = this;
    var $document = $(document);
    var keyCodes = Handsontable.helper.keyCode;

    var editorDestroyer;
    var activeEditor;

    var init = function () {
      priv.onCut = function onCut() {
        if (!instance.isListening()) {
          return;
        }

        selection.empty();
      };

      priv.onPaste = function onPaste(str) {
        if (!instance.isListening() || !selection.isSelected()) {
          return;
        }

        var input = str.replace(/^[\r\n]*/g, '').replace(/[\r\n]*$/g, '') //remove newline from the start and the end of the input
          , inputArray = SheetClip.parse(input)
          , coords = instance.getCornerCoords([priv.selStart.coords(), priv.selEnd.coords()])
          , areaStart = coords.TL
          , areaEnd = {
            row: Math.max(coords.BR.row, inputArray.length - 1 + coords.TL.row),
            col: Math.max(coords.BR.col, inputArray[0].length - 1 + coords.TL.col)
          };

        instance.PluginHooks.once('afterChange', function (changes, source) {
          if (changes && changes.length) {
            instance.selectCell(areaStart.row, areaStart.col, areaEnd.row, areaEnd.col);
          }
        });

        instance.populateFromArray(areaStart.row, areaStart.col, inputArray, areaEnd.row, areaEnd.col, 'paste', priv.settings.pasteMode);
      };

      function onKeyDown(event) {

        if (!instance.isListening()) {
          return;
        }

        if (priv.settings.beforeOnKeyDown) { // HOT in HOT Plugin
          priv.settings.beforeOnKeyDown.call(instance, event);
        }

        if (Array.prototype.filter.call(document.body.querySelectorAll('.context-menu-list'), instance.view.wt.wtDom.isVisible).length) { //faster than $body.children('.context-menu-list:visible').length
          //if right-click context menu is visible, do not execute this keydown handler (arrow keys will navigate the context menu)
          return;
        }

        if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
          //when CTRL is pressed, prepare selectable text in textarea
          //http://stackoverflow.com/questions/3902635/how-does-one-capture-a-macs-command-key-via-javascript
          self.setCopyableText();
          return;
        }



        instance.PluginHooks.run('beforeKeyDown', event);

        if (!event.isImmediatePropagationStopped()) {

          if(activeEditor.state === Handsontable.EditorState.WAITING) {
            if(!activeEditor.waitingEvent){
              activeEditor.waitingEvent = event;
            }

            event.stopImmediatePropagation();
            return;
          }

          activeEditor.waitingEvent = null;

          priv.lastKeyCode = event.keyCode;
          if (selection.isSelected()) {
            var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
            if (Handsontable.helper.isPrintableChar(event.keyCode) && ctrlDown) {
              if (event.keyCode === 65) { //CTRL + A
                selection.selectAll(); //select all cells
                self.setCopyableText();
                event.preventDefault();
                event.stopImmediatePropagation();
              }
            }

          var rangeModifier = event.shiftKey ? selection.setRangeEnd : selection.setRangeStart;

            switch (event.keyCode) {
              case keyCodes.ARROW_UP:
                if(self.isEditorOpened()){
                   self.closeEditorAndSaveChanges(ctrlDown)
                     .done(function(){
                       moveSelectionUp(event.shiftKey);
                     });
                } else {
                  moveSelectionUp(event.shiftKey);
                }
                event.preventDefault();
                event.stopPropagation(); //required by HandsontableEditor
                break;

              case keyCodes.ARROW_DOWN:
                if(self.isEditorOpened()){
                  self.closeEditorAndSaveChanges(ctrlDown)
                    .done(function(){
                      moveSelectionDown(event.shiftKey);
                    });
                } else {
                  moveSelectionDown(event.shiftKey);
                }

                event.preventDefault();
                event.stopPropagation(); //required by HandsontableEditor
                break;

              case keyCodes.ARROW_RIGHT:
                if(self.isEditorOpened()){
                  self.closeEditorAndSaveChanges(ctrlDown)
                    .done(function(){
                      moveSelectionRight(event.shiftKey);
                    });
                } else {
                  moveSelectionRight(event.shiftKey);
                }
                event.preventDefault();
                event.stopPropagation(); //required by HandsontableEditor
                break;

              case keyCodes.ARROW_LEFT:
                if(self.isEditorOpened()){
                  self.closeEditorAndSaveChanges(ctrlDown)
                    .done(function(){
                      moveSelectionLeft(event.shiftKey);
                    });
                } else {
                  moveSelectionLeft(event.shiftKey);
                }
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
                event.preventDefault();
                break;

              case keyCodes.F2: /* F2 */
                self.openEditor();
                event.preventDefault(); //prevent Opera from opening Go to Page dialog
                break;

              case keyCodes.ENTER: /* return/enter */
                if(self.isEditorOpened()){
                  self.closeEditorAndSaveChanges(ctrlDown).done(function(){
                    moveSelectionAfterEnter(event.shiftKey);
                  });
                } else {
                  if (instance.getSettings().enterBeginsEditing){
                    self.openEditor();
                  } else {
                    moveSelectionAfterEnter(event.shiftKey);
                  }
                }

                event.preventDefault(); //don't add newline to field
                event.stopImmediatePropagation(); //required by HandsontableEditor
                break;

              case keyCodes.ESCAPE:
                if(self.isEditorOpened()){
                  self.closeEditorAndRestoreOriginalValue(ctrlDown);
                }
                event.preventDefault();
                break;

              case keyCodes.HOME:
                if (event.ctrlKey || event.metaKey) {
                  rangeModifier({row: 0, col: priv.selStart.col()});
                }
                else {
                  rangeModifier({row: priv.selStart.row(), col: 0});
                }
                event.preventDefault(); //don't scroll the window
                event.stopPropagation(); //required by HandsontableEditor
                break;

              case keyCodes.END:
                if (event.ctrlKey || event.metaKey) {
                  rangeModifier({row: instance.countRows() - 1, col: priv.selStart.col()});
                }
                else {
                  rangeModifier({row: priv.selStart.row(), col: instance.countCols() - 1});
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

              default:
                break;
            }

          }
        }
      }
      $document.on('keydown.handsontable.' + instance.guid, onKeyDown);

      function onDblClick() {
//        that.instance.destroyEditor();
        self.openEditor();
      }

      instance.view.wt.update('onCellDblClick', onDblClick);

      instance.copyPaste = CopyPaste.getInstance();
      instance.copyPaste.onCut(priv.onCut);
      instance.copyPaste.onPaste(priv.onPaste);

      instance.addHook('afterDestroy', function(){
        $document.off('keydown.handsontable.' + instance.guid);
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
      if (typeof editorDestroyer === "function") {
        var destroyer = editorDestroyer; //this copy is needed, otherwise destroyer can enter an infinite loop
        editorDestroyer = null;
        destroyer(revertOriginal);
      }
    };

    this.getActiveEditor = function () {
      return activeEditor;
    };

    /**
     * Prepares copyable text in the invisible textarea
     */
    this.setCopyableText = function () {

      var selection = instance.getSelected();
      var settings = instance.getSettings();
      var copyRowsLimit = settings.copyRowsLimit;
      var copyColsLimit = settings.copyColsLimit;

      var startRow = Math.min(selection[0], selection[2]);
      var startCol = Math.min(selection[1], selection[3]);
      var endRow = Math.max(selection[0], selection[2]);
      var endCol = Math.max(selection[1], selection[3]);
      var finalEndRow = Math.min(endRow, startRow + copyRowsLimit - 1);
      var finalEndCol = Math.min(endCol, startCol + copyColsLimit - 1);

      instance.copyPaste.copyable(datamap.getText({row: startRow, col: startCol}, {row: finalEndRow, col: finalEndCol}));

      if (endRow !== finalEndRow || endCol !== finalEndCol) {
        instance.PluginHooks.run("afterCopyLimit", endRow - startRow + 1, endCol - startCol + 1, copyRowsLimit, copyColsLimit);
      }
    };

    /**
     * Prepare text input to be displayed at given grid cell
     */
    this.prepareEditor = function () {
      var row = priv.selStart.row();
      var col = priv.selStart.col();
      var prop = instance.colToProp(col);
      var td = instance.getCell(row, col);
      var originalValue = instance.getDataAtCell(row, col);
      var cellProperties = instance.getCellMeta(row, col);

      var editorClass = cellProperties.editor;
      activeEditor = Handsontable.editors.getEditor(editorClass, instance);

      activeEditor.prepare(row, col, prop, td, originalValue, cellProperties);

      editorDestroyer = function(isCancelled){
        activeEditor.finishEditing(isCancelled);
      };
    };

    this.isEditorOpened = function () {
      return activeEditor.isOpened();
    };

    this.openEditor = function (initialValue) {
      activeEditor.beginEditing(initialValue);
    };

    this.closeEditor = function (restoreOriginalValue, ctrlDown) {
      return activeEditor.finishEditing(restoreOriginalValue, ctrlDown);
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
