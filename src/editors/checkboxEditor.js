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

  keyboardProxy.on("keydown.editor", function(event) {
    if (instance.getDataAtCell(row, prop) === editorOptions.unchecked) {
      instance.setDataAtCell(row, prop, editorOptions.checked);
    }
    else {
      instance.setDataAtCell(row, prop, editorOptions.unchecked);
    }
  });


};