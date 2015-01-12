(function(Handsontable){
  var TextEditor = Handsontable.editors.BaseEditor.prototype.extend();

  TextEditor.prototype.init = function(){
    var that = this;
    this.createElements();
    this.eventManager = new Handsontable.eventManager(this);
    this.bindEvents();
    this.autoResize = autoResize();

    this.instance.addHook('afterDestroy', function () {
      that.destroy();
    });
  };

  TextEditor.prototype.getValue = function(){
    return this.TEXTAREA.value
  };

  TextEditor.prototype.setValue = function(newValue){
    this.TEXTAREA.value = newValue;
  };

  var onBeforeKeyDown =  function onBeforeKeyDown(event){

    var instance = this;
    var that = instance.getActiveEditor();

    var keyCodes = Handsontable.helper.keyCode;
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)

    Handsontable.Dom.enableImmediatePropagation(event);

    //Process only events that have been fired in the editor
    if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()){
      return;
    }

    if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
      //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
      event.stopImmediatePropagation();
      return;
    }

    switch (event.keyCode) {
      case keyCodes.ARROW_RIGHT:
        if (Handsontable.Dom.getCaretPosition(that.TEXTAREA) !== that.TEXTAREA.value.length) {
          event.stopImmediatePropagation();
        }
        break;

      case keyCodes.ARROW_LEFT: /* arrow left */
        if (Handsontable.Dom.getCaretPosition(that.TEXTAREA) !== 0) {
          event.stopImmediatePropagation();
        }
        break;

      case keyCodes.ENTER:
        var selected = that.instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          if(that.isOpened()){
            that.setValue(that.getValue() + '\n');
            that.focus();
          } else {
            that.beginEditing(that.originalValue + '\n')
          }
          event.stopImmediatePropagation();
        }
        event.preventDefault(); //don't add newline to field
        break;

      case keyCodes.A:
      case keyCodes.X:
      case keyCodes.C:
      case keyCodes.V:
        if(ctrlDown){
          event.stopImmediatePropagation(); //CTRL+A, CTRL+C, CTRL+V, CTRL+X should only work locally when cell is edited (not in table context)
        }
        break;

      case keyCodes.BACKSPACE:
      case keyCodes.DELETE:
      case keyCodes.HOME:
      case keyCodes.END:
        event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
        break;
    }

    that.autoResize.resize(String.fromCharCode(event.keyCode));
  };



  TextEditor.prototype.open = function(){
    this.refreshDimensions(); //need it instantly, to prevent https://github.com/handsontable/handsontable/issues/348

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  TextEditor.prototype.close = function(){
    this.textareaParentStyle.display = 'none';

    this.autoResize.unObserve();

    if (document.activeElement === this.TEXTAREA) {
      this.instance.listen(); //don't refocus the table if user focused some cell outside of HT on purpose
    }

    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
  };

  TextEditor.prototype.focus = function(){
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  TextEditor.prototype.createElements = function () {
//    this.$body = $(document.body);

    this.TEXTAREA = document.createElement('TEXTAREA');

    Handsontable.Dom.addClass(this.TEXTAREA, 'handsontableInput');

    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    this.TEXTAREA_PARENT = document.createElement('DIV');
    Handsontable.Dom.addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

    this.textareaParentStyle = this.TEXTAREA_PARENT.style;
    this.textareaParentStyle.top = 0;
    this.textareaParentStyle.left = 0;
    this.textareaParentStyle.display = 'none';

    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

    this.instance.rootElement.appendChild(this.TEXTAREA_PARENT);

    var that = this;
    this.instance._registerTimeout(setTimeout(function () {
      that.refreshDimensions();
    }, 0));
  };

  TextEditor.prototype.checkEditorSection = function () {
    if(this.row < this.instance.getSettings().fixedRowsTop) {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'corner';
      } else {
        return 'top';
      }
    } else {
      if(this.col < this.instance.getSettings().fixedColumnsLeft) {
        return 'left';
      }
    }
  };

  TextEditor.prototype.getEditedCell = function () {
    var editorSection = this.checkEditorSection()
      , editedCell;

    switch (editorSection) {
      case 'top':
        editedCell = this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.getCell({row: this.row, col: this.col});
        this.textareaParentStyle.zIndex = 101;
        break;
      case 'corner':
        editedCell = this.instance.view.wt.wtScrollbars.corner.clone.wtTable.getCell({row: this.row, col: this.col});
        this.textareaParentStyle.zIndex = 103;
        break;
      case 'left':
        editedCell = this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.getCell({row: this.row, col: this.col});
        this.textareaParentStyle.zIndex = 102;
        break;
      default :
        editedCell = this.instance.getCell(this.row, this.col);
        this.textareaParentStyle.zIndex = "";
        break;
    }

    return editedCell != -1 && editedCell != -2 ? editedCell : void 0;
  };


  TextEditor.prototype.refreshDimensions = function () {
    if (this.state !== Handsontable.EditorState.EDITING) {
      return;
    }

    ///start prepare textarea position
//    this.TD = this.instance.getCell(this.row, this.col);
    this.TD = this.getEditedCell();

    if (!this.TD) {
      //TD is outside of the viewport. Otherwise throws exception when scrolling the table while a cell is edited
      return;
    }
    //var $td = $(this.TD); //because old td may have been scrolled out with scrollViewport

    var currentOffset = Handsontable.Dom.offset(this.TD);
    var containerOffset = Handsontable.Dom.offset(this.instance.rootElement);
    var editTop = currentOffset.top - containerOffset.top - 1;
    var editLeft = currentOffset.left - containerOffset.left - 1;

    var settings = this.instance.getSettings();
    var rowHeadersCount = settings.rowHeaders === false ? 0 : 1;
    var colHeadersCount = settings.colHeaders === false ? 0 : 1;
    var editorSection = this.checkEditorSection();
    var cssTransformOffset;

    // TODO: Refactor this to the new instance.getCell method (from #ply-59), after 0.12.1 is released
    switch(editorSection) {
      case 'top':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.vertical.clone.wtTable.holder.parentNode);
        break;
      case 'left':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.horizontal.clone.wtTable.holder.parentNode);
        break;
      case 'corner':
        cssTransformOffset = Handsontable.Dom.getCssTransform(this.instance.view.wt.wtScrollbars.corner.clone.wtTable.holder.parentNode);
        break;
    }

    if (editTop < 0) {
      editTop = 0;
    }
    if (editLeft < 0) {
      editLeft = 0;
    }
    if (rowHeadersCount > 0 && parseInt(this.TD.style.borderTopWidth, 10) > 0) {
      editTop += 1;
    }
    if (colHeadersCount > 0 && parseInt(this.TD.style.borderLeftWidth, 10) > 0) {
      editLeft += 1;
    }


    if(cssTransformOffset && cssTransformOffset != -1) {
      this.textareaParentStyle[cssTransformOffset[0]] = cssTransformOffset[1];
    } else {
      Handsontable.Dom.resetCssTransform(this.textareaParentStyle);
    }

    this.textareaParentStyle.top = editTop + 'px';
    this.textareaParentStyle.left = editLeft + 'px';

    ///end prepare textarea position


    var cellTopOffset = this.TD.offsetTop - this.instance.view.wt.wtScrollbars.vertical.getScrollPosition(),
        cellLeftOffset = this.TD.offsetLeft - this.instance.view.wt.wtScrollbars.horizontal.getScrollPosition();

    var width = Handsontable.Dom.innerWidth(this.TD) - 8  //$td.width()
      , maxWidth = this.instance.view.maximumVisibleElementWidth(cellLeftOffset) - 10 //10 is TEXTAREAs border and padding
      , height = Handsontable.Dom.outerHeight(this.TD) - 4  //$td.outerHeight() - 4
      , maxHeight = this.instance.view.maximumVisibleElementHeight(cellTopOffset) - 2; //10 is TEXTAREAs border and padding

    if (parseInt(this.TD.style.borderTopWidth, 10) > 0) {
      height -= 1;
    }
    if (parseInt(this.TD.style.borderLeftWidth, 10) > 0) {
      if (rowHeadersCount > 0) {
        width -= 1;
      }
    }

    this.TEXTAREA.style.fontSize = Handsontable.Dom.getComputedStyle(this.TD).fontSize;
    this.TEXTAREA.style.fontFamily = Handsontable.Dom.getComputedStyle(this.TD).fontFamily;

    this.autoResize.init(this.TEXTAREA, {
      minHeight: Math.min(height, maxHeight),
      maxHeight: maxHeight, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      minWidth: Math.min(width, maxWidth),
      maxWidth: maxWidth //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
    }, true);

    this.textareaParentStyle.display = 'block';
  };

  TextEditor.prototype.bindEvents = function () {
    var editor = this;

    this.eventManager.addEventListener(this.TEXTAREA, 'cut',function (event){
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    });

    this.eventManager.addEventListener(this.TEXTAREA, 'paste', function (event){
      Handsontable.helper.stopPropagation(event);
      //event.stopPropagation();
    });

    this.instance.addHook('afterScrollVertically', function () {
      editor.refreshDimensions();
    });

    this.instance.addHook('afterDestroy', function () {
      editor.eventManager.clear();
    });
  };

  TextEditor.prototype.destroy = function () {
    this.eventManager.clear();
  };


  Handsontable.editors.TextEditor = TextEditor;
  Handsontable.editors.registerEditor('text', Handsontable.editors.TextEditor);

})(Handsontable);
