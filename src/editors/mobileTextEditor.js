(function (Handsontable) {

  var MobileTextEditor = Handsontable.editors.BaseEditor.prototype.extend();

  MobileTextEditor.prototype.init = function () {
    this.createElements();
    this.bindEvents();
  };

  MobileTextEditor.prototype.getValue = function () {
    return this.TEXTAREA.value
  };

  MobileTextEditor.prototype.setValue = function (newValue) {
    this.TEXTAREA.value = newValue;
  };

  MobileTextEditor.prototype.createElements = function () {
    this.editorContainer = document.createElement('DIV');
    this.editorContainer.id = "mobile-editor-container";

    this.moveHandle = document.createElement('DIV');
    this.moveHandle.className = "move-handle";

    this.inputPane = document.createElement('DIV');
    this.inputPane.className = "inputs";

    this.TEXTAREA = document.createElement('TEXTAREA');
    this.inputPane.appendChild(this.TEXTAREA);

    this.editorContainer.appendChild(this.moveHandle);
    this.editorContainer.appendChild(this.inputPane);

//    this.instance.rootElement[0].parentNode.appendChild(this.editorContainer);
    document.body.appendChild(this.editorContainer);
  };

  MobileTextEditor.prototype.onBeforeKeyDown = function (event) {
    var instance = this;
    var that = instance.getActiveEditor();

    if (event.target !== that.TEXTAREA || event.isImmediatePropagationStopped()){
      return;
    }

    var keyCodes = Handsontable.helper.keyCode;

    switch(event.keyCode) {
      case keyCodes.ENTER:
        that.close();
        event.preventDefault(); //don't add newline to field
        break;
      case keyCodes.BACKSPACE:
        event.stopImmediatePropagation(); //backspace, delete, home, end should only work locally when cell is edited (not in table context)
        break;
    }
  };

  MobileTextEditor.prototype.open = function () {
    this.instance.addHook('beforeKeyDown', this.onBeforeKeyDown);

    Handsontable.Dom.addClass(this.editorContainer, 'active');
    this.updateEditorPosition();
  };

  MobileTextEditor.prototype.focus = function(){
    this.TEXTAREA.focus();
    Handsontable.Dom.setCaretPosition(this.TEXTAREA, this.TEXTAREA.value.length);
  };

  MobileTextEditor.prototype.close = function () {
    this.TEXTAREA.blur();
    this.instance.removeHook('beforeKeyDown', this.onBeforeKeyDown);

    Handsontable.Dom.removeClass(this.editorContainer, 'active');
  };

  MobileTextEditor.prototype.updateEditorPosition = function (x, y) {
    if(x && y) {
      x = parseInt(x, 10);
      y = parseInt(y, 10);

      this.editorContainer.style.top = y + "px";
      this.editorContainer.style.left = x + "px";
    } else {
      var selection = this.instance.getSelected()
        , selectedCell = this.instance.getCell(selection[0],selection[1]);

      if(selectedCell != undefined) {

        var selectedCellOffset = Handsontable.Dom.offset(selectedCell)
          , currentScrollPosition = {
            x: this.instance.view.wt.wtScrollbars.horizontal.scrollHandler.scrollTop,
            y: this.instance.view.wt.wtScrollbars.vertical.scrollHandler.scrollTop
          };

        this.editorContainer.style.top = parseInt(selectedCellOffset.top + Handsontable.Dom.outerHeight(selectedCell) - currentScrollPosition.y, 10) + "px";
        this.editorContainer.style.left = parseInt(selectedCellOffset.left - Handsontable.Dom.outerWidth(this.editorContainer) / 2 - currentScrollPosition.x, 10)  + "px";
      }
    }
  };

  MobileTextEditor.prototype.bindEvents = function () {
    var that = this;

    this.moveHandle.addEventListener("touchstart", function (event) {



      if (event.touches.length == 1) {
        var touch = event.touches[0]
          , onTouchPosition = {
          x: that.editorContainer.offsetLeft,
          y: that.editorContainer.offsetTop
        }
          , onTouchOffset = {
          x: touch.pageX - onTouchPosition.x,
          y: touch.pageY - onTouchPosition.y
        };


        this.addEventListener("touchmove", function (event) {
          console.log('touchmove');
//          console.log(touch.pageX - onTouchOffset.x, touch.pageY, onTouchOffset.y);

          that.updateEditorPosition(touch.pageX - onTouchOffset.x, touch.pageY - onTouchOffset.y);
          event.preventDefault();
        });

      }


    });


//    sticky.addEventListener("touchstart", function (e) {
//      if (e.touches.length == 1 && e.touches[0].target == sticky) {
//        var touch = e.touches[0];
//
//        var stickyPosition = {
//            x: sticky.offsetLeft,
//            y: sticky.offsetTop
//          }
//          , stickyOffset = {
//            x: (touch.pageX - stickyPosition.x),
//            y: (touch.pageY - stickyPosition.y)
//          };
//
//        sticky.addEventListener("touchmove", function (e) {
//          updateStickyPosition(touch.pageX - stickyOffset.x, touch.pageY - stickyOffset.y);
//
//          if(document.activeElement == input) {
//            document.addEventListener("scroll", function () {
//
//            });
//          }
//
//          e.preventDefault();
//        });
//        e.preventDefault();
//      }
//
//    });
//
//    sticky.addEventListener("touchend", function (e) {
//      if (e.touches.length == 1 && e.touches[0].target == sticky) {
//        sticky.removeEventListener("touchmove");
//        e.preventDefault();
//      }
//    });

  };





  Handsontable.editors.MobileTextEditor = MobileTextEditor;
  Handsontable.editors.registerEditor('mobile', Handsontable.editors.MobileTextEditor);


})(Handsontable);
