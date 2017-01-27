import {empty, addClass, hasClass} from './../helpers/dom/element';
import {isDefined} from './../helpers/mixed';
import {equalsIgnoreCase} from './../helpers/string';
import {EventManager} from './../eventManager';
import {getRenderer, registerRenderer} from './../renderers';
import {isKey} from './../helpers/unicode';
import {partial} from './../helpers/function';
import {stopImmediatePropagation, isImmediatePropagationStopped} from './../helpers/dom/event';

const isListeningKeyDownEvent = new WeakMap();
const isCheckboxListenerAdded = new WeakMap();
const BAD_VALUE_CLASS = 'htBadValue';

/**
 * Checkbox renderer
 *
 * @private
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */
function checkboxRenderer(instance, TD, row, col, prop, value, cellProperties) {
  getRenderer('base').apply(this, arguments);

  const eventManager = registerEvents(instance);
  let input = createInput();
  const labelOptions = cellProperties.label;
  let badValue = false;

  if (typeof cellProperties.checkedTemplate === 'undefined') {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === 'undefined') {
    cellProperties.uncheckedTemplate = false;
  }

  empty(TD); // TODO identify under what circumstances this line can be removed

  if (value === cellProperties.checkedTemplate || equalsIgnoreCase(value, cellProperties.checkedTemplate)) {
    input.checked = true;

  } else if (value === cellProperties.uncheckedTemplate || equalsIgnoreCase(value, cellProperties.uncheckedTemplate)) {
    input.checked = false;

  } else if (value === null) { // default value
    addClass(input, 'noValue');

  } else {
    input.style.display = 'none';
    addClass(input, BAD_VALUE_CLASS);
    badValue = true;
  }

  input.setAttribute('data-row', row);
  input.setAttribute('data-col', col);

  if (!badValue && labelOptions) {
    let labelText = '';

    if (labelOptions.value) {
      labelText = typeof labelOptions.value === 'function' ? labelOptions.value.call(this, row, col, prop, value) : labelOptions.value;

    } else if (labelOptions.property) {
      labelText = instance.getDataAtRowProp(row, labelOptions.property);
    }
    const label = createLabel(labelText);

    if (labelOptions.position === 'before') {
      label.appendChild(input);
    } else {
      label.insertBefore(input, label.firstChild);
    }
    input = label;
  }

  TD.appendChild(input);

  cellProperties.badValue = badValue;

  if (badValue) {
    TD.appendChild(document.createTextNode('#bad-value#'));
  }

  if (!isListeningKeyDownEvent.has(instance)) {
    isListeningKeyDownEvent.set(instance, true);
    instance.addHook('beforeKeyDown', onBeforeKeyDown);
  }

  /**
   * On before key down DOM listener.
   *
   * @private
   * @param {Event} event
   */
  function onBeforeKeyDown(event) {
    const toggleKeys = 'SPACE|ENTER';
    const switchOffKeys = 'DELETE|BACKSPACE';
    const isKeyCode = partial(isKey, event.keyCode);

    if (isKeyCode(`${toggleKeys}|${switchOffKeys}`) && !isImmediatePropagationStopped(event)) {
      eachSelectedCheckboxCell(function() {
        stopImmediatePropagation(event);
        event.preventDefault();
      });
    }
    if (isKeyCode(toggleKeys)) {
      mapValuesOfSelectedCheckboxes(getToggledCheckboxValue);
    }
    if (isKeyCode(switchOffKeys)) {
      mapValuesOfSelectedCheckboxes(getNotCheckedCheckboxValue);
    }
  }

  /**
   * Get reversed checkbox value
   *
   * @private
   * @param{Object} cellProperties Object containing the cell's properties.
   * @param {*} value cell's data
   * @returns {Boolean|*}
   */
  function getReversedCheckboxValue(cellProperties, value) {
    const checkedTemplate = isDefined(cellProperties.checkedTemplate) ? cellProperties.checkedTemplate : true;
    const uncheckedTemplate = isDefined(cellProperties.uncheckedTemplate) ? cellProperties.uncheckedTemplate : false;

    if (value === checkedTemplate) {
      return uncheckedTemplate;
    } else {
      return checkedTemplate;
    }
  }

  /**
   * Get toggled checkbox value. If checkbox is not writable get original value,
   * otherwise get reversed value.
   *
   * @private
   * @param {Object} cellProperties Object containing the cell's properties.
   * @param {*} value cell's data
   * @returns {Boolean|*}
   */
  function getToggledCheckboxValue(cellProperties, value) {
    if (cellProperties.readOnly === true || cellProperties.badValue === true) {
      return value;
    } else {
      return getReversedCheckboxValue(cellProperties, value);
    }
  }

  /**
   * Get not checked checkbox value.
   *
   * @private
   * @param {Object} cellProperties Object containing the cell's properties.
   * @returns {Boolean|*}
   */
  function getNotCheckedCheckboxValue(cellProperties) {
    return cellProperties.uncheckedTemplate;
  }

  /**
   * Get checkboxes values after applying map function
   *
   * @private
   * @param {WalkontableCellCoords} topLeftCorner coordinates of top left corner of selection
   * @param {WalkontableCellCoords} bottomRightCorner coordinates of bottom right corner of selection
   * @param {Array} selectionData selected cells data
   * @param {Function} mapValueFunction function mapping value of selected cells data
   * @returns {Object.<Boolean, Array>} object containing information if new data differ and set of new values
   */
  function getMappedCheckboxesValues(topLeftCorner, bottomRightCorner, selectionData, mapValueFunction) {
    const checkboxesValues = [];
    let shouldChange = false;

    for (let row = topLeftCorner.row; row <= bottomRightCorner.row; row += 1) {
      const rowCheckboxesValues = [];
      checkboxesValues.push(rowCheckboxesValues);

      for (let col = topLeftCorner.col; col <= bottomRightCorner.col; col += 1) {
        const cellProperties = instance.getCellMeta(row, col);

        // all selected cells must be checkboxes

        if (cellProperties.type !== 'checkbox') {
          return { shouldChange: false };
        }

        const relativeRowIndex = row - topLeftCorner.row;
        const relativeColIndex = col - topLeftCorner.col;
        const dataAtRowAndColFromSelection = selectionData[relativeRowIndex][relativeColIndex];

        const newValue = mapValueFunction(cellProperties, dataAtRowAndColFromSelection);
        rowCheckboxesValues.push(newValue);

        if (shouldChange === false) {
          if (newValue !== dataAtRowAndColFromSelection) {
            shouldChange = true;
          }
        }
      }
    }

    return { shouldChange, checkboxesValues };
  }

  /**
   * Get selection coordinates
   *
   * @private
   * @returns {[{WalkontableCellCoords},{WalkontableCellCoords}]}
   */
  function getSelectionCoordinates() {
    const selRange = instance.getSelectedRange();
    return [selRange.getTopLeftCorner(), selRange.getBottomRightCorner()];
  }

  /**
   * Apply function which change value of selected checkboxes
   *
   * @private
   * @param {Function} mapValueFunction
   */
  function mapValuesOfSelectedCheckboxes(mapValueFunction) {
    const [topLeftCorner, bottomRightCorner] = getSelectionCoordinates();
    const selectionData = instance.getData(
      topLeftCorner.row,
      topLeftCorner.col,
      bottomRightCorner.row,
      bottomRightCorner.col
    );
    const mappedCheckboxesValues = getMappedCheckboxesValues(
      topLeftCorner,
      bottomRightCorner,
      selectionData,
      mapValueFunction
    );
    const shouldChange = mappedCheckboxesValues.shouldChange;

    if (shouldChange !== false) {
      instance.populateFromArray(
        topLeftCorner.row,
        topLeftCorner.col,
        mappedCheckboxesValues.checkboxesValues
      );
    }
  }

  /**
   * Call callback for each found selected cell with checkbox type.
   *
   * @private
   * @param {Function} callback
   */
  function eachSelectedCheckboxCell(callback) {
    const selRange = instance.getSelectedRange();

    if (!selRange) {
      return;
    }
    const topLeft = selRange.getTopLeftCorner();
    const bottomRight = selRange.getBottomRightCorner();

    for (let row = topLeft.row; row <= bottomRight.row; row++) {
      for (let col = topLeft.col; col <= bottomRight.col; col++) {
        let cellProperties = instance.getCellMeta(row, col);

        if (cellProperties.type !== 'checkbox') {
          return;
        }

        let cell = instance.getCell(row, col);

        if (cell == null) {

          callback(row, col, cellProperties);

        } else {
          let checkboxes = cell.querySelectorAll('input[type=checkbox]');

          if (checkboxes.length > 0 && !cellProperties.readOnly) {
            callback(checkboxes);
          }
        }
      }
    }
  }
}

/**
 * Register checkbox listeners.
 *
 * @param {Handsontable} instance Handsontable instance.
 * @returns {EventManager}
 */
function registerEvents(instance) {
  let eventManager = isCheckboxListenerAdded.get(instance);

  if (!eventManager) {
    eventManager = new EventManager(instance);
    eventManager.addEventListener(instance.rootElement, 'click', (event) => onClick(event, instance));
    eventManager.addEventListener(instance.rootElement, 'mouseup', (event) => onMouseUp(event, instance));

    isCheckboxListenerAdded.set(instance, eventManager);
  }

  return eventManager;
}

/**
 * Create input element.
 *
 * @returns {Node}
 */
function createInput() {
  let input = document.createElement('input');

  input.className = 'htCheckboxRendererInput';
  input.type = 'checkbox';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('tabindex', '-1');

  return input.cloneNode(false);
}

/**
 * Create label element.
 *
 * @returns {Node}
 */
function createLabel(text) {
  let label = document.createElement('label');

  label.className = 'htCheckboxRendererLabel';
  label.appendChild(document.createTextNode(text));

  return label.cloneNode(true);
}

/**
 * `mouseup` callback.
 *
 * @private
 * @param {Event} event `mouseup` event.
 * @param {Object} instance Handsontable instance.
 */
function onMouseUp(event, instance) {
  if (!isCheckboxInput(event.target)) {
    return;
  }
  setTimeout(instance.listen, 10);
}

/**
 * `click` callback.
 *
 * @private
 * @param {Event} event `click` event.
 * @param {Object} instance Handsontable instance.
 */
function onClick(event, instance) {
  if (!isCheckboxInput(event.target)) {
    return false;
  }

  const row = parseInt(event.target.getAttribute('data-row'), 10);
  const col = parseInt(event.target.getAttribute('data-col'), 10);
  const cellProperties = instance.getCellMeta(row, col);

  if (cellProperties.readOnly) {
    event.preventDefault();
  }
}

/**
 * Check if the provided element is the checkbox input.
 *
 * @private
 * @param {HTMLElement} element The element in question.
 * @returns {Boolean}
 */
function isCheckboxInput(element) {
  return element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox';
}

export {checkboxRenderer};
registerRenderer('checkbox', checkboxRenderer);
