/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} rendererOptions Render options
 */
Handsontable.CheckboxRenderer = function (instance, td, row, col, prop, value, rendererOptions) {
  if (typeof rendererOptions === "undefined") {
    rendererOptions = {};
  }
  if (typeof rendererOptions.checked === "undefined") {
    rendererOptions.checked = true;
  }
  if (typeof rendererOptions.unchecked === "undefined") {
    rendererOptions.unchecked = false;
  }

  if (value === rendererOptions.checked || value === Handsontable.helper.stringify(rendererOptions.checked)) {
    td.innerHTML = "<input type='checkbox' checked autocomplete='no'>";
  }
  else if (value === rendererOptions.unchecked || value === Handsontable.helper.stringify(rendererOptions.unchecked)) {
    td.innerHTML = "<input type='checkbox' autocomplete='no'>";
  }
  else if (value === null) { //default value
    td.innerHTML = "<input type='checkbox' autocomplete='no' style='opacity: 0.5'>";
  }
  else {
    td.innerHTML = "#bad value#";
  }

  $(td).find('input').change(function () {
    if ($(this).is(':checked')) {
      instance.setDataAtCell(row, prop, rendererOptions.checked);
    }
    else {
      instance.setDataAtCell(row, prop, rendererOptions.unchecked);
    }
  });

  return td;
};