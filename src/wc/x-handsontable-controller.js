function parseDatacolumn(DATACOLUMN) {
  return {
    title: DATACOLUMN.getAttribute('title'),
    data: DATACOLUMN.getAttribute('value'),
    type: DATACOLUMN.getAttribute('type'),
    checkedTemplate: DATACOLUMN.getAttribute('checkedTemplate'),
    uncheckedTemplate: DATACOLUMN.getAttribute('uncheckedTemplate'),
    readOnly: DATACOLUMN.getAttribute('readOnly'),
    source: DATACOLUMN.getAttribute('source') ? window[DATACOLUMN.getAttribute('source')] : void 0
  }
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