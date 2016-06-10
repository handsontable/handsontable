import {empty, addClass, hasClass} from './../helpers/dom/element';
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
      toggleSelected();
    }
    if (isKeyCode(switchOffKeys)) {
      toggleSelected(false);
    }
  }

  /**
   * Toggle checkbox checked property
   *
   * @private
   * @param {Boolean} [checked=null]
   */
  function toggleSelected(checked = null) {
    eachSelectedCheckboxCell(function(checkboxes) {
      for (let i = 0, len = checkboxes.length; i < len; i++) {
        // Block changing checked property on toggle keys (SPACE and ENTER)
        if (hasClass(checkboxes[i], BAD_VALUE_CLASS) && checked === null) {
          return;
        }
        toggleCheckbox(checkboxes[i], checked);
      }
    });
  }

  /**
   * Toggle checkbox element.
   *
   * @private
   * @param {HTMLInputElement} checkbox
   * @param {Boolean} [checked=null]
   */
  function toggleCheckbox(checkbox, checked = null) {
    if (checked === null) {
      checkbox.checked = !checkbox.checked;
    } else {
      checkbox.checked = checked;
    }
    eventManager.fireEvent(checkbox, 'change');
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
        let cell = instance.getCell(row, col);
        let cellProperties = instance.getCellMeta(row, col);
        let checkboxes = cell.querySelectorAll('input[type=checkbox]');

        if (checkboxes.length > 0 && !cellProperties.readOnly) {
          callback(checkboxes);
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
    eventManager.addEventListener(instance.rootElement, 'change', (event) => onChange(event, instance));

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
 * `change` callback.
 *
 * @param {Event} event `change` event.
 * @param {Object} instance Handsontable instance.
 * @param {Object} cellProperties Reference to cell properties.
 * @returns {Boolean}
 */
function onChange(event, instance) {
  if (!isCheckboxInput(event.target)) {
    return false;
  }

  const row = parseInt(event.target.getAttribute('data-row'), 10);
  const col = parseInt(event.target.getAttribute('data-col'), 10);
  const cellProperties = instance.getCellMeta(row, col);

  if (!cellProperties.readOnly) {
    instance.setDataAtCell(row, col, event.target.checked ? (cellProperties.checkedTemplate || true) : (cellProperties.uncheckedTemplate || false));
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
