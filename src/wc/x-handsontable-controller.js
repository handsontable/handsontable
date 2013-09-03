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

  var HANDSONTABLE = DATACOLUMN.getElementsByTagName('x-handsontable');
  if (HANDSONTABLE.length) {
    obj.handsontable = parseHandsontable(HANDSONTABLE[0]);
  }

  return obj;
}

function getModel(HANDSONTABLE) {
  if(HANDSONTABLE.templateInstance) {
    return HANDSONTABLE.templateInstance.model;
  }
  else {
    return window;
  }
}

function getModelPath(HANDSONTABLE, path) {
  var obj = getModel(HANDSONTABLE);
  var keys = path.split('.');
  var len = keys.length;
  for (var i = 0; i < len; i++) {
    if (obj[keys[i]]) {
      obj = obj[keys[i]];
    }
  }
  return obj;
}

function parseHandsontable(HANDSONTABLE) {
  var columns = []
    , i
    , ilen;

  for (i = 0, ilen = HANDSONTABLE.childNodes.length; i < ilen; i++) {
    if (HANDSONTABLE.childNodes[i].nodeName === 'DATACOLUMN') {
      columns.push(parseDatacolumn(HANDSONTABLE.childNodes[i]));
    }
  }

  var observeChanges;
  if(HANDSONTABLE.observechanges === void 0 || HANDSONTABLE.observechanges === null) {
    observeChanges = true;
  }
  else {
    observeChanges = readBool(HANDSONTABLE.observechanges);
  }

  var options = {
    data: getModelPath(HANDSONTABLE, HANDSONTABLE.datarows),
    width: HANDSONTABLE.width,
    height: HANDSONTABLE.height,
    columns: columns,
    minSpareRows: HANDSONTABLE.minsparerows,
    colHeaders: readBool(HANDSONTABLE.colheaders),
    fillHandle: readBool(HANDSONTABLE.fillhandle),
    autoWrapRow: true,
    contextMenu: true,
    observeChanges: observeChanges,
    getValue: HANDSONTABLE.getvalue
  };

  function hasTitle(column) {
    return column.title !== void 0;
  }

  if (columns.filter(hasTitle).length && options.colHeaders !== false) {
    options.colHeaders = true;
  }

  if (HANDSONTABLE.settings) {
    var settings = getModelPath(HANDSONTABLE, HANDSONTABLE.settings);
    for (i in settings) {
      if (settings.hasOwnProperty(i)) {
        options[i] = settings[i];
      }
    }
  }

  return options;
}

var publicMethods = ['updateSettings', 'loadData', 'render', 'setDataAtCell', 'setDataAtRowProp', 'getDataAtCell', 'getDataAtRowProp', 'countRows', 'countCols', 'rowOffset', 'colOffset', 'countVisibleRows', 'countVisibleCols', 'clear', 'clearUndo', 'getData', 'alter', 'getCell', 'getCellMeta', 'selectCell', 'deselectCell', 'getSelected', 'destroyEditor', 'getRowHeader', 'getColHeader', 'destroy', 'isUndoAvailable', 'isRedoAvailable', 'undo', 'redo', 'countEmptyRows', 'countEmptyCols', 'isEmptyRow', 'isEmptyCol', 'parseSettingsFromDOM', 'addHook', 'addHookOnce', 'getValue'];

var publish = {};
for (var i = 0, ilen = publicMethods.length; i < ilen; i++) {
  publish[publicMethods[i]] = (function (methodName) {
    return function () {
      return this.instance[methodName].apply(this.instance, arguments);
    }
  })(publicMethods[i]);
}

function readBool(val) {
  if (val === void 0 || val === "false") {
    return false;
  }
  return val;
}

Polymer('x-handsontable', {
  instance: null,
  enteredDocument: function () {
    jQuery(this.$.htContainer).handsontable(parseHandsontable(this));

    this.instance = jQuery(this.$.htContainer).data('handsontable');
  },
  publish: publish
});