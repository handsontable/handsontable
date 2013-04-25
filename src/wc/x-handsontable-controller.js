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

  return obj;
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
  publish: {
    getData: function () {
      return this.instance.getData();
    }
  }
});