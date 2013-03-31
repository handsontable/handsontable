function HandsontableDateEditorClass(instance) {
  this.isCellEdited = false;
  this.instance = instance;
  this.createElements();
  this.bindEvents();
}

Handsontable.helper.inherit(HandsontableDateEditorClass, HandsontableTextEditorClass);

/**
 * @see HandsontableTextEditorClass.prototype.createElements
 */
HandsontableDateEditorClass.prototype.createElements = function () {
  HandsontableTextEditorClass.prototype.createElements.call(this);

  this.datePickerdiv = $("<div>");
  this.datePickerdiv[0].style.position = 'absolute';
  this.datePickerdiv[0].style.top = 0;
  this.datePickerdiv[0].style.left = 0;
  this.datePickerdiv[0].style.zIndex = 99;
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
}

/**
 * @see HandsontableTextEditorClass.prototype.beginEditing
 */
HandsontableDateEditorClass.prototype.beginEditing = function (row, col, prop, useOriginalValue, suffix) {
  HandsontableTextEditorClass.prototype.beginEditing.call(this, row, col, prop, useOriginalValue, suffix);
  this.showDatepicker();
}
/**
 * @see HandsontableTextEditorClass.prototype.finishEditing
 */
HandsontableDateEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  this.hideDatepicker();
  HandsontableTextEditorClass.prototype.finishEditing.call(this, isCancelled, ctrlDown);
}

HandsontableDateEditorClass.prototype.showDatepicker = function () {
  var $td = $(this.instance.dateEditor.TD);
  var position = $td.position();
  this.datePickerdiv[0].style.top = (position.top + $td.height()) + 'px';
  this.datePickerdiv[0].style.left = position.left + 'px';

  var dateOptions = {
    defaultDate: this.originalValue || void 0
  };
  $.extend(dateOptions, this.cellProperties);
  this.datePickerdiv.datepicker("option", dateOptions);
  if (this.originalValue) {
    this.datePickerdiv.datepicker("setDate", this.originalValue);
  }
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
  instance.dateEditor.bindTemporaryEvents(td, row, col, prop, value, cellProperties);
  return function (isCancelled) {
    instance.dateEditor.finishEditing(isCancelled);
  }
};