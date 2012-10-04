/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} td Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} renderOptions Render options
 */
Handsontable.CheckboxRenderer = function (instance, td, row, col, prop, value, renderOptions) {
  if (typeof renderOptions === "undefined") {
    renderOptions = {};
  }
  if (typeof renderOptions.checked === "undefined") {
    renderOptions.checked = true;
  }
  if (typeof renderOptions.unchecked === "undefined") {
    renderOptions.unchecked = false;
  }

  if (value === renderOptions.checked || value === renderOptions.checked.toString()) {
    td.innerHTML = "<input type='checkbox' checked autocomplete='no'>";
  }
  else if (value === renderOptions.unchecked || value === renderOptions.unchecked.toString()) {
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
      instance.setDataAtCell(row, prop, renderOptions.checked);
    }
    else {
      instance.setDataAtCell(row, prop, renderOptions.unchecked);
    }
  });

  return td;
};