function HandsontableDateEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.originalValue = '';
  this.row;
  this.col;
  this.prop;

  this.createElements();

  var that = this;

  this.datePickerdiv = $("<div>");
  this.datePickerdiv[0].style.position = 'absolute';
  this.datePickerdiv[0].style.top = 0;
  this.datePickerdiv[0].style.left = 0;
  this.datePickerdiv[0].style.zIndex = 99;
  instance.rootElement[0].appendChild(this.datePickerdiv[0]);

  this.bindEvents();
}

for (var i in HandsontableTextEditorClass.prototype) {
  if (HandsontableTextEditorClass.prototype.hasOwnProperty(i)) {
    HandsontableDateEditorClass.prototype[i] = HandsontableTextEditorClass.prototype[i];
  }
}

HandsontableDateEditorClass.prototype._bindEvents = HandsontableTextEditorClass.prototype.bindEvents;

HandsontableDateEditorClass.prototype.bindEvents = function () {
  this._bindEvents();
}

HandsontableDateEditorClass.prototype._beginEditing = HandsontableTextEditorClass.prototype.beginEditing;

HandsontableDateEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  this._beginEditing(row, col, prop, useOriginalValue, suffix);
  this.showDatepicker();
}

HandsontableDateEditorClass.prototype._finishEditing = HandsontableTextEditorClass.prototype.finishEditing;

HandsontableDateEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  this.hideDatepicker();
  this._finishEditing(isCancelled, ctrlDown);
}

HandsontableDateEditorClass.prototype.showDatepicker = function () {
  var $td = $(this.instance.dateEditor.TD);
  var position = $td.position();
  this.datePickerdiv[0].style.top = (position.top + $td.height()) + 'px';
  this.datePickerdiv[0].style.left = position.left + 'px';

  var that = this;
  var dateoptions = {
    dateFormat: "yy-mm-dd",
    defaultDate: this.originalValue,
    showButtonPanel: true,
    changeMonth: true,
    changeYear: true,
    altField: this.instance.dateEditor.TEXTAREA,
    onSelect: function () {
      that.finishEditing(false);
    }
  };
  this.datePickerdiv.datepicker(dateoptions);
  this.datePickerdiv.show();
}

HandsontableDateEditorClass.prototype.hideDatepicker = function () {
  this.datePickerdiv.hide();
}

/**
 * Date editor (uses jQuery UI Datepicker)
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.DateEditor = function (instance, td, row, col, prop, value, cellProperties) {
  if (!instance.dateEditor) {
    instance.dateEditor = new HandsontableDateEditorClass(instance);
  }

  instance.dateEditor.TD = td;
  instance.dateEditor.isCellEdited = false;
  instance.dateEditor.originalValue = value;

  instance.$table.on('keydown.editor', function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!instance.dateEditor.isCellEdited) {
      if (Handsontable.helper.isPrintableChar(event.keyCode)) {
        if (!ctrlDown) { //disregard CTRL-key shortcuts
          instance.dateEditor.beginEditing(row, col, prop);
        }
      }
      else if (event.keyCode === 113) { //f2
        instance.dateEditor.beginEditing(row, col, prop, true); //show edit field
        event.stopPropagation();
        event.preventDefault(); //prevent Opera from opening Go to Page dialog
      }
      else if (event.keyCode === 13 && instance.getSettings().enterBeginsEditing) { //enter
        var selected = instance.getSelected();
        var isMultipleSelection = !(selected[0] === selected[2] && selected[1] === selected[3]);
        if ((ctrlDown && !isMultipleSelection) || event.altKey) { //if ctrl+enter or alt+enter, add new line
          instance.dateEditor.beginEditing(row, col, prop, true, '\n'); //show edit field
        }
        else {
          instance.dateEditor.beginEditing(row, col, prop, true); //show edit field
        }
        event.preventDefault(); //prevent new line at the end of textarea
        event.stopPropagation();
      }
    }
  });

  function onDblClick() {
    instance.dateEditor.beginEditing(row, col, prop, true);
  }

  instance.view.wt.update('onCellDblClick', onDblClick);

  return function (isCancelled) {
    setTimeout(function () {
      instance.dateEditor.finishEditing(isCancelled);
    });
  }
};