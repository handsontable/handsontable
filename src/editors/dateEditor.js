function HandsontableDateEditorClass(instance) {
  if (instance) {
    this.isCellEdited = false;
    this.instance = instance;
    this.createElements();
    this.bindEvents();
  }
}

HandsontableDateEditorClass.prototype = new HandsontableTextEditorClass();

HandsontableDateEditorClass.prototype._createElements = HandsontableTextEditorClass.prototype.createElements;

HandsontableDateEditorClass.prototype.createElements = function () {
  this._createElements();

  this.datePickerdiv = $("<div>");
  this.datePickerdivStyle = this.datePickerdiv[0].style;
  this.datePickerdivStyle.position = 'absolute';
  this.datePickerdivStyle.top = 0;
  this.datePickerdivStyle.left = 0;
  this.datePickerdivStyle.zIndex = 99;
  this.instance.rootElement[0].appendChild(this.datePickerdiv[0]);

  var that = this;
  var defaultOptions = {
    dateFormat: "yy-mm-dd",
    showButtonPanel: true,
    changeMonth: true,
    changeYear: true,
    altField: this.TEXTAREA,
    onSelect: function () {
      that.finishEditing(false);
    }
  };
  this.datePickerdiv.datepicker(defaultOptions);
  this.datePickerdiv.hide();
};

HandsontableDateEditorClass.prototype._bindEvents = HandsontableTextEditorClass.prototype.bindEvents;

HandsontableDateEditorClass.prototype.bindEvents = function () {
  this._bindEvents();
};

HandsontableDateEditorClass.prototype._beginEditing = HandsontableTextEditorClass.prototype.beginEditing;

HandsontableDateEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  this._beginEditing(row, col, prop, useOriginalValue, suffix);
  this.showDatepicker();
};

HandsontableDateEditorClass.prototype._finishEditing = HandsontableTextEditorClass.prototype.finishEditing;

HandsontableDateEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  this.hideDatepicker();
  this._finishEditing(isCancelled, ctrlDown);
};

HandsontableDateEditorClass.prototype.showDatepicker = function () {
  var $td = $(this.instance.dateEditor.TD);
  var position = $td.position();
  this.datePickerdivStyle.top = (position.top + $td.height()) + 'px';
  this.datePickerdivStyle.left = position.left + 'px';

  var dateOptions = {
    defaultDate: this.originalValue || void 0
  };
  $.extend(dateOptions, this.cellProperties);
  this.datePickerdiv.datepicker("option", dateOptions);
  if (this.originalValue) {
    this.datePickerdiv.datepicker("setDate", this.originalValue);
  }
  this.datePickerdiv.show();
};

HandsontableDateEditorClass.prototype.hideDatepicker = function () {
  this.datePickerdiv.hide();
};

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
  instance.dateEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
  return function (isCancelled) {
    instance.dateEditor.finishEditing(isCancelled);
  }
};