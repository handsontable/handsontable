function toggleCheckboxCell(instance, row, prop, cellOptions) {
  if (Handsontable.helper.stringify(instance.getDataAtCell(row, prop)) === Handsontable.helper.stringify(cellOptions.checked)) {
    instance.setDataAtCell(row, prop, cellOptions.unchecked);
  }
  else {
    instance.setDataAtCell(row, prop, cellOptions.checked);
  }
}

/**
 * Checkbox editor
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param {Object} keyboardProxy jQuery element of keyboard proxy that contains current editing value
 * @param {Object} cellOptions Cell options (shared by cell renderer and editor)
 */
Handsontable.CheckboxEditor = function (instance, td, row, col, prop, keyboardProxy, cellOptions) {
  if (typeof cellOptions === "undefined") {
    cellOptions = {};
  }
  if (typeof cellOptions.checked === "undefined") {
    cellOptions.checked = true;
  }
  if (typeof cellOptions.unchecked === "undefined") {
    cellOptions.unchecked = false;
  }

  keyboardProxy.on("keydown.editor", function (event) {
    if (Handsontable.helper.isPrintableChar(event.keyCode)) {
      toggleCheckboxCell(instance, row, prop, cellOptions);
      event.stopPropagation();
    }
  });

  function onDblClick() {
    toggleCheckboxCell(instance, row, prop, cellOptions);
  }

  var $td = $(td);
  $td.on('dblclick.editor', onDblClick);
  instance.container.find('.htBorder.current').on('dblclick.editor', onDblClick);

  return function () {
    keyboardProxy.off(".editor");
    $td.off(".editor");
    instance.container.find('.htBorder.current').off(".editor");
  }
};