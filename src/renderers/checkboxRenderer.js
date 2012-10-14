/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellOptions Cell options (shared by cell renderer and editor)
 */
Handsontable.CheckboxRenderer = function (instance, td, row, col, prop, value, cellOptions) {
  if (typeof cellOptions.checked === "undefined") {
    cellOptions.checked = true;
  }
  if (typeof cellOptions.unchecked === "undefined") {
    cellOptions.unchecked = false;
  }
  if (value === cellOptions.checked || value === Handsontable.helper.stringify(cellOptions.checked)) {
    td.innerHTML = "<input type='checkbox' checked autocomplete='no'>";
  }
  else if (value === cellOptions.unchecked || value === Handsontable.helper.stringify(cellOptions.unchecked)) {
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
      instance.setDataAtCell(row, prop, cellOptions.checked);
    }
    else {
      instance.setDataAtCell(row, prop, cellOptions.unchecked);
    }
  });

  return td;
};