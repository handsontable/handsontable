/**
 * This is inception. Using Handsontable as Handsontable editor
 */

function HandsontableHandsontableEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.createElements();
  this.bindEvents();
}

Handsontable.helper.inherit(HandsontableHandsontableEditorClass, HandsontableTextEditorClass);

HandsontableHandsontableEditorClass.prototype.createElements = function () {
  HandsontableTextEditorClass.prototype.createElements.call(this);

  var DIV = document.createElement('DIV');
  DIV.className = 'handsontableEditor';
  this.TEXTAREA_PARENT.appendChild(DIV);

  this.$htContainer = $(DIV);
};

HandsontableHandsontableEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {
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

  if (cellProperties.handsontable) {
    options = $.extend(options, cellProperties.handsontable);
  }

  this.$htContainer.handsontable(options);

  HandsontableTextEditorClass.prototype.bindTemporaryEvents.call(this, td, row, col, prop, value, cellProperties);
};

HandsontableHandsontableEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  var onBeginEditing = this.instance.getSettings().onBeginEditing;
  if (onBeginEditing && onBeginEditing() === false) {
    return;
  }

  HandsontableTextEditorClass.prototype.beginEditing.call(this, row, col, prop, useOriginalValue, suffix);

  this.$htContainer.handsontable('selectCell', 0, 0);
};

HandsontableHandsontableEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  if (Handsontable.helper.isDescendant(this.instance.rootElement[0], document.activeElement)) {
    var that = this;
    setTimeout(function () {
      that.instance.listen(); //return the focus to the cell must be done after destroyer to work in IE7-9
    }, 0);
    that.instance.listen(); //return the focus to the cell
  }
  this.$htContainer.handsontable('destroy');
  HandsontableTextEditorClass.prototype.finishEditing.call(this, isCancelled, ctrlDown);
};

HandsontableHandsontableEditorClass.prototype.isMenuExpanded = function () {
  if (this.typeahead.$menu.is(":visible")) {
    return this.typeahead;
  }
  else {
    return false;
  }
};

/**
 * Handsontable editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.HandsontableEditor = function (instance, td, row, col, prop, value, cellProperties) {
  if (!instance.handsontableEditor) {
    instance.handsontableEditor = new HandsontableHandsontableEditorClass(instance);
  }
  instance.handsontableEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);

  instance.registerEditor = instance.handsontableEditor;

  return function (isCancelled) {
    instance.handsontableEditor.finishEditing(isCancelled);
  }
};