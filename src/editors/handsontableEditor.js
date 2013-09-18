/**
 * This is inception. Using Handsontable as Handsontable editor
 */
(function (Handsontable) {
  "use strict";

  var HandsontableEditor = Handsontable.editors.TextEditor.prototype.extend();

  HandsontableEditor.prototype.createElements = function () {
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    var DIV = document.createElement('DIV');
    DIV.className = 'handsontableEditor';
    this.TEXTAREA_PARENT.appendChild(DIV);

    this.$htContainer = $(DIV);
    this.$htContainer.handsontable();
  };

  HandsontableEditor.prototype.prepare = function (td, row, col, prop, value, cellProperties) {

    Handsontable.editors.TextEditor.prototype.prepare.apply(this, arguments);

    var parent = this;

    var options = {
      startRows: 0,
      startCols: 0,
      minRows: 0,
      minCols: 0,
      className: 'listbox',
      cells: function () {
        return {
          readOnly: true
        }
      },
      fillHandle: false,
      afterOnCellMouseDown: function () {
        parent.val(this.getValue());
        parent.instance.destroyEditor();
      },
      beforeOnKeyDown: function (event) {
        var instance = this;

        switch (event.keyCode) {
          case Handsontable.helper.keyCode.ESCAPE:
            parent.instance.destroyEditor(true);
            event.stopImmediatePropagation();
            event.preventDefault();
            break;

          case Handsontable.helper.keyCode.ENTER: //enter
            var sel = instance.getSelected();
            parent.val(this.getDataAtCell(sel[0], sel[1]));
            parent.instance.destroyEditor();
            break;

          case Handsontable.helper.keyCode.ARROW_UP:
            if (instance.getSelected() && instance.getSelected()[0] == 0 && !parent.cellProperties.strict){
              instance.deselectCell();
              parent.instance.listen();
              parent.focus();
              event.preventDefault();
              event.stopImmediatePropagation();
            }
            break;
        }
      }
    };

    if (this.cellProperties.handsontable) {
      options = $.extend(options, cellProperties.handsontable);
    }
    this.$htContainer.handsontable('destroy');
    this.$htContainer.handsontable(options);
  };

  var onBeforeKeyDown = function (event) {

    if (event.isImmediatePropagationStopped()) {
      return;
    }

    var editor = this.getActiveEditor();
    var innerHOT = editor.$htContainer.handsontable('getInstance');

    if (event.keyCode == Handsontable.helper.keyCode.ARROW_DOWN) {

      if (!innerHOT.getSelected()){
        innerHOT.selectCell(0, 0);
      } else {
        editor.$htContainer.trigger(event);
      }

      event.preventDefault();
      event.stopImmediatePropagation();
    }

  };

  HandsontableEditor.prototype.open = function () {

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);

    Handsontable.editors.TextEditor.prototype.open.apply(this, arguments);

    this.$htContainer.handsontable('render');

    if (this.cellProperties.strict) {
      this.$htContainer.handsontable('selectCell', 0, 0);
      this.$textarea[0].style.visibility = 'hidden';
    } else {
      this.$htContainer.handsontable('deselectCell');
      this.$textarea[0].style.visibility = 'visible';
    }

    this.wtDom.setCaretPosition(this.$textarea[0], 0, this.$textarea[0].value.length);

  };

  HandsontableEditor.prototype.close = function () {

    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);
    this.instance.listen();

    Handsontable.editors.TextEditor.prototype.close.apply(this, arguments);
  };

  HandsontableEditor.prototype.focus = function () {

    this.instance.listen();

    Handsontable.editors.TextEditor.prototype.focus.apply(this, arguments);
  };

  HandsontableEditor.prototype.beginEditing = function (initialValue) {
    var onBeginEditing = this.instance.getSettings().onBeginEditing;
    if (onBeginEditing && onBeginEditing() === false) {
      return;
    }

    Handsontable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);

  };

  HandsontableEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
    if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
      this.instance.listen(); //return the focus to the parent HOT instance
    }

    if (this.$htContainer.handsontable('getSelected')) {
      this.val(this.$htContainer.handsontable('getInstance').getValue());
    }

    return Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  Handsontable.editors.HandsontableEditor = HandsontableEditor;
  Handsontable.editors.registerEditor('handsontable', HandsontableEditor);

})(Handsontable);





