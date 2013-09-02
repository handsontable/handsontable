(function(Handsontable){
  var TextEditor = Handsontable.editors.BaseEditor.prototype.extend();
  var wtDom = new WalkontableDom();

  TextEditor.prototype.init = function(){
    this.createElements();
    this.bindEvents();
  };

  TextEditor.prototype.val = function(newValue){
    if(typeof newValue == 'undefined'){
      return this.TEXTAREA.value
    } else {
      this.TEXTAREA.value = newValue;
    }
  };

  TextEditor.prototype.open = function(){
    this.refreshDimensions(); //need it instantly, to prevent https://github.com/warpech/jquery-handsontable/issues/348
    this.TEXTAREA.focus();
    wtDom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  TextEditor.prototype.close = function(){
    this.textareaParentStyle.display = 'none';
  };

  TextEditor.prototype.focus = function(){
    this.TEXTAREA.focus();
    wtDom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  TextEditor.prototype.createElements = function () {
    this.$body = $(document.body);

    this.TEXTAREA = document.createElement('TEXTAREA');
    this.$textarea = $(this.TEXTAREA);

    wtDom.addClass(this.TEXTAREA, 'handsontableInput');

    this.textareaStyle = this.TEXTAREA.style;
    this.textareaStyle.width = 0;
    this.textareaStyle.height = 0;

    this.TEXTAREA_PARENT = document.createElement('DIV');
    wtDom.addClass(this.TEXTAREA_PARENT, 'handsontableInputHolder');

    this.textareaParentStyle = this.TEXTAREA_PARENT.style;
    this.textareaParentStyle.top = 0;
    this.textareaParentStyle.left = 0;
    this.textareaParentStyle.display = 'none';

    this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);

    this.instance.rootElement[0].appendChild(this.TEXTAREA_PARENT);

    var that = this;
    Handsontable.PluginHooks.add('afterRender', function () {
      that.instance.registerTimeout('refresh_editor_dimensions', function () {
        that.refreshDimensions();
      }, 0);
    });
  };

  TextEditor.prototype.refreshDimensions = function () {
    if (this.state !== Handsontable.EditorState.EDITING) {
      return;
    }

    ///start prepare textarea position
    this.TD = this.instance.getCell(this.row, this.col);
    var $td = $(this.TD); //because old td may have been scrolled out with scrollViewport
    var currentOffset = wtDom.offset(this.TD);
    var containerOffset = wtDom.offset(this.instance.rootElement[0]);
    var scrollTop = this.instance.rootElement.scrollTop();
    var scrollLeft = this.instance.rootElement.scrollLeft();
    var editTop = currentOffset.top - containerOffset.top + scrollTop - 1;
    var editLeft = currentOffset.left - containerOffset.left + scrollLeft - 1;

    var settings = this.instance.getSettings();
    var rowHeadersCount = settings.rowHeaders === false ? 0 : 1;
    var colHeadersCount = settings.colHeaders === false ? 0 : 1;

    if (editTop < 0) {
      editTop = 0;
    }
    if (editLeft < 0) {
      editLeft = 0;
    }

    if (rowHeadersCount > 0 && parseInt($td.css('border-top-width'), 10) > 0) {
      editTop += 1;
    }
    if (colHeadersCount > 0 && parseInt($td.css('border-left-width'), 10) > 0) {
      editLeft += 1;
    }

    if ($.browser.msie && parseInt($.browser.version, 10) <= 7) {
      editTop -= 1;
    }

    this.textareaParentStyle.top = editTop + 'px';
    this.textareaParentStyle.left = editLeft + 'px';
    ///end prepare textarea position

    var width = $td.width()
      , maxWidth = this.instance.view.maximumVisibleElementWidth(editLeft) - 10 //10 is TEXTAREAs border and padding
      , height = $td.outerHeight() - 4
      , maxHeight = this.instance.view.maximumVisibleElementHeight(editTop) - 5; //10 is TEXTAREAs border and padding

    if (parseInt($td.css('border-top-width'), 10) > 0) {
      height -= 1;
    }
    if (parseInt($td.css('border-left-width'), 10) > 0) {
      if (rowHeadersCount > 0) {
        width -= 1;
      }
    }

    //in future may change to pure JS http://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
    this.$textarea.autoResize({
      minHeight: Math.min(height, maxHeight),
      maxHeight: maxHeight, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      minWidth: Math.min(width, maxWidth),
      maxWidth: maxWidth, //TEXTAREA should never be wider than visible part of the viewport (should not cover the scrollbar)
      animate: false,
      extraSpace: 0
    });

    this.textareaParentStyle.display = 'block';
  };

  TextEditor.prototype.bindEvents = function () {
    var that = this;

    function onBeforeKeyDown(event){

      var keyCodes = Handsontable.helper.keyCode;
      var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)


      if (that.state !== Handsontable.EditorState.EDITING) {
        if (Handsontable.helper.isPrintableChar(event.keyCode)) {
          if (!ctrlDown) { //disregard CTRL-key shortcuts
            that.beginEditing('');
            event.stopImmediatePropagation();
          }
        }
        return;
      }


      if (event.keyCode === 17 || event.keyCode === 224 || event.keyCode === 91 || event.keyCode === 93) {
        //when CTRL or its equivalent is pressed and cell is edited, don't prepare selectable text in textarea
        event.stopImmediatePropagation();
        return;
      }

      switch (event.keyCode) {
        case keyCodes.ARROW_RIGHT:
          if (wtDom.getCaretPosition(that.TEXTAREA) !== that.TEXTAREA.value.length) {
            event.stopImmediatePropagation();
          }
          break;

        case keyCodes.ARROW_LEFT: /* arrow left */
          if (wtDom.getCaretPosition(that.TEXTAREA) !== 0) {
            event.stopImmediatePropagation();
          }
          break;

        case keyCodes.ENTER:
          var selected = that.instance.getSelected();
          var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
          if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
            if(that.isOpened()){
              that.val(that.val() + '\n');
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
            break;
          }
        case keyCodes.BACKSPACE:
        case keyCodes.DELETE:
        case keyCodes.HOME:
        case keyCodes.END:
          event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
          break;
      }

    }

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);
  };

  Handsontable.editors.TextEditor = TextEditor;
  Handsontable.editors.registerEditor('text', Handsontable.editors.TextEditor);

})(Handsontable);
