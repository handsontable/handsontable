/**
 * This is inception. Using Handsontable as Handsontable editor
 */

function HandsontableHandsontableEditorClass(instance) {
  if (instance) {
    this.isCellEdited = false;
    this.instance = instance;
    this.createElements();
    this.bindEvents();
  }
}

HandsontableHandsontableEditorClass.prototype = new HandsontableTextEditorClass();

HandsontableHandsontableEditorClass.prototype._createElements = HandsontableTextEditorClass.prototype.createElements;

HandsontableHandsontableEditorClass.prototype.createElements = function () {
  this._createElements();

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  function guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  this.$htContainer = $('<div class="inception">');
  this.$htContainer[0].id = "ht" + guid();
  this.TEXTAREA_PARENT[0].appendChild(this.$htContainer[0]);
};

HandsontableHandsontableEditorClass.prototype._bindEvents = HandsontableTextEditorClass.prototype.bindEvents;

HandsontableHandsontableEditorClass.prototype.bindEvents = function () {
  var data = [
    ["", "Maserati", "Mazda", "Mercedes", "Mini", "Mitsubishi"],
    ["2009", 0, 2941, 4303, 354, 5814],
    ["2010", 5, 2905, 2867, 412, 5284],
    ["2011", 4, 2517, 4822, 552, 6127],
    ["2012", 2, 2422, 5399, 776, 4151]
  ];

  var that = this;
 this.$htContainer.handsontable({
    data: data,
    minRows: 5,
    minCols: 6,
    minSpareRows: 1,
    autoWrapRow: true,
    colHeaders: true,
    contextMenu: true,
    onSelection: function (subrow) {
      console.log("ustawiam", row, prop, data[subrow][0]);
      that.isCellEdited = false;
      that.instance.setDataAtRowProp(row, prop, data[subrow][0]);
    }
  });

  this.$htContainer.on('mouseup.handsontable', function(event){
    console.log("catched");
    event.stopPropagation();
  });

  console.log("thre is");

  this._bindEvents();
};

HandsontableHandsontableEditorClass.prototype._bindTemporaryEvents = HandsontableTextEditorClass.prototype.bindTemporaryEvents;

HandsontableHandsontableEditorClass.prototype.bindTemporaryEvents = function (td, row, col, prop, value, cellProperties) {


  this._bindTemporaryEvents(td, row, col, prop, value, cellProperties);
}
;

HandsontableHandsontableEditorClass.prototype._finishEditing = HandsontableTextEditorClass.prototype.finishEditing;

HandsontableHandsontableEditorClass.prototype.finishEditing = function (isCancelled, ctrlDown) {
  this.$htContainer.handsontable('destroy');
  this._finishEditing(isCancelled, ctrlDown);
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
  return function (isCancelled) {
    instance.handsontableEditor.finishEditing(isCancelled);
  }
};