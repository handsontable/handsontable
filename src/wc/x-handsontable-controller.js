window.numeral = this.numeral; //needed by numeral.de-de.js

function parseDatacolumn(DATACOLUMN) {
  var obj = {};

  for (var i = 0, ilen = DATACOLUMN.attributes.length; i < ilen; i++) {
    obj[DATACOLUMN.attributes[i].name] = DATACOLUMN.attributes[i].value || true;
  }

  obj.data = obj.value;
  delete obj.value;

  obj.readOnly = obj.readonly;
  delete obj.readonly;

  obj.checkedTemplate = obj.checkedtemplate;
  delete obj.checkedtemplate;

  obj.uncheckedTemplate = obj.uncheckedtemplate;
  delete obj.uncheckedtemplate;

  if (obj.type === 'autocomplete' && typeof obj.source === 'string') {
    obj.source = window[obj.source];
  }

  return obj;
}

var publicMethods = ['updateSettings', 'loadData', 'render', 'setDataAtCell', 'setDataAtRowProp', 'getDataAtCell', 'getDataAtRowProp', 'countRows', 'countCols', 'rowOffset', 'colOffset', 'countVisibleRows', 'countVisibleCols', 'clear', 'clearUndo', 'getData', 'alter', 'getCell', 'getCellMeta', 'selectCell', 'deselectCell', 'getSelected', 'destroyEditor', 'getRowHeader', 'getColHeader', 'destroy', 'isUndoAvailable', 'isRedoAvailable', 'undo', 'redo', 'countEmptyRows', 'countEmptyCols', 'isEmptyRow', 'isEmptyCol', 'parseSettingsFromDOM'];

var publish = {};
for (var i = 0, ilen = publicMethods.length; i < ilen; i++) {
  publish[publicMethods[i]] = (function (methodName) {
    return function () {
      return this.instance[methodName].apply(this.instance, arguments);
    }
  })(publicMethods[i]);
}

Toolkit.register(this, {
  instance: null,
  ready: function () {
    var DATACOLUMNs = this.querySelectorAll('datacolumn');
    var columns = [];
    for (var i = 0, ilen = DATACOLUMNs.length; i < ilen; i++) {
      columns.push(parseDatacolumn(DATACOLUMNs[i]));
    }

    var options = {
      data: window[this.datarows],
      columns: columns,
      minRows: 5,
      minCols: 6,
      minSpareRows: 1,
      autoWrapRow: true,
      colHeaders: true,
      contextMenu: true
    };

    jQuery(this.$.htContainer).handsontable(options);

    this.instance = jQuery(this.$.htContainer).data('handsontable');
  },
  publish: publish
});