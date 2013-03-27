/**
 * Checkbox renderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properites (shared by cell renderer and editor)
 */
Handsontable.CheckboxRenderer = function (instance, TD, row, col, prop, value, cellProperties) {
  if (typeof cellProperties.checkedTemplate === "undefined") {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === "undefined") {
    cellProperties.uncheckedTemplate = false;
  }

  Handsontable.helper.empty(TD); //TODO identify under what circumstances this line can be removed

  var INPUT = document.createElement('INPUT');
  INPUT.className = 'htCheckboxRendererInput';
  INPUT.type = 'checkbox';
  INPUT.setAttribute('autocomplete', 'off');

  if (value === cellProperties.checkedTemplate || value === Handsontable.helper.stringify(cellProperties.checkedTemplate)) {
    INPUT.checked = true;
    TD.appendChild(INPUT);
  }
  else if (value === cellProperties.uncheckedTemplate || value === Handsontable.helper.stringify(cellProperties.uncheckedTemplate)) {
    TD.appendChild(INPUT);
  }
  else if (value === null) { //default value
    INPUT.className += ' noValue';
    TD.appendChild(INPUT);
  }
  else {
    TD.appendChild(document.createTextNode('#bad value#'));
    //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
  }

  if (!instance.checkboxInputMousedownListener) {
    //not very elegant but easy and fast
    instance.checkboxInputMousedownListener = function (event) {
      if (!this.checked) {
        instance.setDataAtRowProp(row, prop, cellProperties.checkedTemplate);
      }
      else {
        instance.setDataAtRowProp(row, prop, cellProperties.uncheckedTemplate);
      }
      event.stopPropagation(); //otherwise can confuse mousedown handler
    };
    instance.rootElement.on('mousedown', '.htCheckboxRendererInput', instance.checkboxInputMousedownListener); //this way we don't bind event listener to each arrow. We rely on propagation instead

    instance.checkboxInputMouseupListener = function (event) {
      event.stopPropagation(); //otherwise can confuse dblclick handler
    };
    instance.rootElement.on('mouseup', '.htCheckboxRendererInput', instance.checkboxInputMouseupListener); //this way we don't bind event listener to each arrow. We rely on propagation instead
  }

  return TD;
};