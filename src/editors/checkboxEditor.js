function toggleCheckboxCell(instance, row, prop, editorOptions) {
  if (Handsontable.helper.stringify(instance.getDataAtCell(row, prop)) === Handsontable.helper.stringify(editorOptions.checked)) {
    instance.setDataAtCell(row, prop, editorOptions.unchecked);
  }
  else {
    instance.setDataAtCell(row, prop, editorOptions.checked);
  }
}


Handsontable.CheckboxEditor = function (instance, td, row, col, prop, keyboardProxy, editorOptions) {
  if (typeof editorOptions === "undefined") {
    editorOptions = {};
  }
  if (typeof editorOptions.checked === "undefined") {
    editorOptions.checked = true;
  }
  if (typeof editorOptions.unchecked === "undefined") {
    editorOptions.unchecked = false;
  }

  keyboardProxy.on("keydown.editor", function (event) {
    if (Handsontable.helper.isPrintableChar(event.keyCode)) {
      toggleCheckboxCell(instance, row, prop, editorOptions);
      event.stopPropagation();
    }
  });

  function onDblClick() {
    toggleCheckboxCell(instance, row, prop, editorOptions);
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