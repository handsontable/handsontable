function toggleCheckboxCell(instance, row, prop, cellProperties) {
  if (Handsontable.helper.stringify(instance.getDataAtCell(row, prop)) === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
    instance.setDataAtCell(row, prop, cellProperties.uncheckedTemplate);
  }
  else {
    instance.setDataAtCell(row, prop, cellProperties.checkedTemplate);
  }
}

/**
 * Checkbox editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Original value (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.CheckboxEditor = function (instance, td, row, col, prop, value, cellProperties) {
  if (typeof cellProperties === "undefined") {
    cellProperties = {};
  }
  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }

  instance.$table.on("keydown.editor", function (event) {
    var ctrlDown = (event.ctrlKey || event.metaKey) && !event.altKey; //catch CTRL but not right ALT (which in some systems triggers ALT+CTRL)
    if (!ctrlDown && Handsontable.helper.isPrintableChar(event.keyCode)) {
      toggleCheckboxCell(instance, row, prop, cellProperties);
      event.stopPropagation();
      event.preventDefault(); //some keys have special behavior, eg. space bar scrolls screen down
    }
  });

  function onDblClick() {
    toggleCheckboxCell(instance, row, prop, cellProperties);
  }

  instance.view.wt.update('onCellDblClick', onDblClick);

  return function () {
    instance.$table.off(".editor");
    instance.view.wt.update('onCellDblClick', null);
  }
};