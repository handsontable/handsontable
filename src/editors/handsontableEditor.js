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
  };


  HandsontableEditor.prototype.prepare = function (td, row, col, prop, value, cellProperties) {

    Handsontable.editors.TextEditor.prototype.prepare.apply(this, arguments);

    var parent = this;

    var options = {
      colHeaders: true,
      cells: function () {
        return {
          readOnly: true
        }
      },
      fillHandle: false,
      width: 2000,
      //width: 'auto',
      afterOnCellMouseDown: function () {
        var sel = this.getSelected();
        parent.TEXTAREA.value = this.getDataAtCell(sel[0], sel[1]);
        parent.instance.destroyEditor();
      },
      beforeOnKeyDown: function (event) {
        switch (event.keyCode) {
          case 27: //esc
            parent.instance.destroyEditor(true);
            break;

          case 13: //enter
            var sel = this.getSelected();
            parent.TEXTAREA.value = this.getDataAtCell(sel[0], sel[1]);
            parent.instance.destroyEditor();
            break;
        }
      }
    };

    if (this.cellProperties.handsontable) {
      options = $.extend(options, cellProperties.handsontable);
    }

    this.$htContainer.handsontable(options);
  };


  HandsontableEditor.prototype.beginEditing = function (initialValue) {
    var onBeginEditing = this.instance.getSettings().onBeginEditing;
    if (onBeginEditing && onBeginEditing() === false) {
      return;
    }

    Handsontable.editors.TextEditor.prototype.beginEditing.apply(this, arguments);

    this.$htContainer.handsontable('render');
    this.$htContainer.handsontable('selectCell', 0, 0);
  };

  HandsontableEditor.prototype.finishEditing = function (isCancelled, ctrlDown) {
    if (this.$htContainer.handsontable('isListening')) { //if focus is still in the HOT editor
      this.instance.listen(); //return the focus to the parent HOT instance
    }
    this.$htContainer.handsontable('destroy');
    return Handsontable.editors.TextEditor.prototype.finishEditing.apply(this, arguments);
  };

  Handsontable.editors.HandsontableEditor = HandsontableEditor;
  Handsontable.editors.registerEditor('handsontable', HandsontableEditor);

})(Handsontable);





