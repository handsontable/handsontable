import { baseRenderer } from '../baseRenderer';
import EventManager from '../../eventManager';
import { empty, addClass } from '../../helpers/dom/element';
import {
  stopImmediatePropagation,
  isImmediatePropagationStopped,
} from '../../helpers/dom/event';
import { partial } from '../../helpers/function';
import { equalsIgnoreCase } from '../../helpers/string';
import { isEmpty } from '../../helpers/mixed';
import { isKey } from '../../helpers/unicode';

import './checkboxRenderer.css';
import Hooks from '../../pluginHooks';

const isListeningKeyDownEvent = new WeakMap();
const isCheckboxListenerAdded = new WeakMap();
const BAD_VALUE_CLASS = 'htBadValue';
const ATTR_ROW = 'data-row';
const ATTR_COLUMN = 'data-col';

export const RENDERER_TYPE = 'checkbox';

Hooks.getSingleton().add('modifyAutoColumnSizeSeed', function(bundleSeed, cellMeta, cellValue) {
  const { label, type, row, column, prop } = cellMeta;

  if (type !== RENDERER_TYPE) {
    return;
  }

  if (label) {
    const { value: labelValue, property: labelProperty } = label;
    let labelText = cellValue;

    if (labelValue) {
      labelText = typeof labelValue === 'function' ?
        labelValue(row, column, prop, cellValue) : labelValue;

    } else if (labelProperty) {
      const labelData = this.getDataAtRowProp(row, labelProperty);

      labelText = labelData !== null ? labelData : cellValue;
    }

    bundleSeed = labelText;
  }

  return bundleSeed;
});
/**
 * Checkbox renderer.
 *
 * @private
 * @param {Core} instance The Handsontable instance.
 * @param {HTMLTableCellElement} TD The rendered cell element.
 * @param {number} row The visual row index.
 * @param {number} col The visual column index.
 * @param {number|string} prop The column property (passed when datasource is an array of objects).
 * @param {*} value The rendered value.
 * @param {object} cellProperties The cell meta object ({@see Core#getCellMeta}).
 */
export function checkboxRenderer(instance, TD, row, col, prop, value, cellProperties) {
  const { rootDocument } = instance;

  baseRenderer.apply(this, [instance, TD, row, col, prop, value, cellProperties]);
  registerEvents(instance);

  let input = createInput(rootDocument);
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

  } else if (isEmpty(value)) { // default value
    addClass(input, 'noValue');

  } else {
    input.style.display = 'none';
    addClass(input, BAD_VALUE_CLASS);
    badValue = true;
  }

  input.setAttribute(ATTR_ROW, row);
  input.setAttribute(ATTR_COLUMN, col);

  if (!badValue && labelOptions) {
    let labelText = '';

    if (labelOptions.value) {
      labelText = typeof labelOptions.value === 'function' ?
        labelOptions.value.call(this, row, col, prop, value) : labelOptions.value;

    } else if (labelOptions.property) {
      const labelValue = instance.getDataAtRowProp(row, labelOptions.property);

      labelText = labelValue !== null ? labelValue : '';
    }

    const label = createLabel(rootDocument, labelText, labelOptions.separated !== true);

    if (labelOptions.position === 'before') {
      if (labelOptions.separated) {
        TD.appendChild(label);
        TD.appendChild(input);

      } else {
        label.appendChild(input);
        input = label;
      }
    } else if (!labelOptions.position || labelOptions.position === 'after') {
      if (labelOptions.separated) {
        TD.appendChild(input);
        TD.appendChild(label);

      } else {
        label.insertBefore(input, label.firstChild);
        input = label;
      }
    }
  }

  if (!labelOptions || (labelOptions && !labelOptions.separated)) {
    TD.appendChild(input);
  }

  if (badValue) {
    TD.appendChild(rootDocument.createTextNode('#bad-value#'));
  }

  if (!isListeningKeyDownEvent.has(instance)) {
    isListeningKeyDownEvent.set(instance, true);
    instance.addHook('beforeKeyDown', onBeforeKeyDown);
  }

  /**
   * On before key down DOM listener.
   *
   * @private
   * @param {Event} event The keyboard event object.
   */
  function onBeforeKeyDown(event) {
    const toggleKeys = 'SPACE|ENTER';
    const switchOffKeys = 'DELETE|BACKSPACE';
    const isKeyCode = partial(isKey, event.keyCode);

    if (!instance.getSettings().enterBeginsEditing && isKeyCode('ENTER')) {
      return;
    }
    if (isKeyCode(`${toggleKeys}|${switchOffKeys}`) && !isImmediatePropagationStopped(event)) {
      eachSelectedCheckboxCell(() => {
        stopImmediatePropagation(event);
        event.preventDefault();
      });
    }
    if (isKeyCode(toggleKeys)) {
      changeSelectedCheckboxesState();
    }
    if (isKeyCode(switchOffKeys)) {
      changeSelectedCheckboxesState(true);
    }
  }

  /**
   * Change checkbox checked property.
   *
   * @private
   * @param {boolean} [uncheckCheckbox=false] The new "checked" state for the checkbox elements.
   */
  function changeSelectedCheckboxesState(uncheckCheckbox = false) {
    const selRange = instance.getSelectedRange();

    if (!selRange) {
      return;
    }

    for (let key = 0; key < selRange.length; key++) {
      const { row: startRow, col: startColumn } = selRange[key].getTopLeftCorner();
      const { row: endRow, col: endColumn } = selRange[key].getBottomRightCorner();
      const changes = [];

      for (let visualRow = startRow; visualRow <= endRow; visualRow += 1) {
        for (let visualColumn = startColumn; visualColumn <= endColumn; visualColumn += 1) {
          const cachedCellProperties = instance.getCellMeta(visualRow, visualColumn);

          if (cachedCellProperties.type !== 'checkbox') {
            return;
          }

          /* eslint-disable no-continue */
          if (cachedCellProperties.readOnly === true) {
            continue;
          }

          if (typeof cachedCellProperties.checkedTemplate === 'undefined') {
            cachedCellProperties.checkedTemplate = true;
          }
          if (typeof cachedCellProperties.uncheckedTemplate === 'undefined') {
            cachedCellProperties.uncheckedTemplate = false;
          }

          const dataAtCell = instance.getDataAtCell(visualRow, visualColumn);

          if (uncheckCheckbox === false) {
            if ([cachedCellProperties.checkedTemplate, cachedCellProperties.checkedTemplate.toString()].includes(dataAtCell)) { // eslint-disable-line max-len
              changes.push([visualRow, visualColumn, cachedCellProperties.uncheckedTemplate]);

            } else if ([cachedCellProperties.uncheckedTemplate, cachedCellProperties.uncheckedTemplate.toString(), null, void 0].includes(dataAtCell)) { // eslint-disable-line max-len
              changes.push([visualRow, visualColumn, cachedCellProperties.checkedTemplate]);
            }

          } else {
            changes.push([visualRow, visualColumn, cachedCellProperties.uncheckedTemplate]);
          }
        }
      }

      if (changes.length > 0) {
        instance.setDataAtCell(changes);
      }
    }
  }

  /**
   * Call callback for each found selected cell with checkbox type.
   *
   * @private
   * @param {Function} callback The callback function.
   */
  function eachSelectedCheckboxCell(callback) {
    const selRange = instance.getSelectedRange();

    if (!selRange) {
      return;
    }

    for (let key = 0; key < selRange.length; key++) {
      const topLeft = selRange[key].getTopLeftCorner();
      const bottomRight = selRange[key].getBottomRightCorner();

      for (let visualRow = topLeft.row; visualRow <= bottomRight.row; visualRow++) {
        for (let visualColumn = topLeft.col; visualColumn <= bottomRight.col; visualColumn++) {
          const cachedCellProperties = instance.getCellMeta(visualRow, visualColumn);

          if (cachedCellProperties.type !== 'checkbox') {
            return;
          }

          const cell = instance.getCell(visualRow, visualColumn);

          if (cell === null || cell === void 0) {
            callback(visualRow, visualColumn, cachedCellProperties);

          } else {
            const checkboxes = cell.querySelectorAll('input[type=checkbox]');

            if (checkboxes.length > 0 && !cachedCellProperties.readOnly) {
              callback(checkboxes);
            }
          }
        }
      }
    }
  }
}

checkboxRenderer.RENDERER_TYPE = RENDERER_TYPE;

/**
 * Register checkbox listeners.
 *
 * @param {Core} instance The Handsontable instance.
 * @returns {EventManager}
 */
function registerEvents(instance) {
  let eventManager = isCheckboxListenerAdded.get(instance);

  if (!eventManager) {
    const { rootElement } = instance;

    eventManager = new EventManager(instance);

    eventManager.addEventListener(rootElement, 'click', event => onClick(event, instance));
    eventManager.addEventListener(rootElement, 'mouseup', event => onMouseUp(event, instance));
    eventManager.addEventListener(rootElement, 'change', event => onChange(event, instance));

    isCheckboxListenerAdded.set(instance, eventManager);
  }

  return eventManager;
}

/**
 * Create input element.
 *
 * @param {Document} rootDocument The document owner.
 * @returns {Node}
 */
function createInput(rootDocument) {
  const input = rootDocument.createElement('input');

  input.className = 'htCheckboxRendererInput';
  input.type = 'checkbox';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('tabindex', '-1');

  return input.cloneNode(false);
}

/**
 * Create label element.
 *
 * @param {Document} rootDocument The document owner.
 * @param {string} text The label text.
 * @param {boolean} fullWidth Determines whether label should have full width.
 * @returns {Node}
 */
function createLabel(rootDocument, text, fullWidth) {
  const label = rootDocument.createElement('label');

  label.className = `htCheckboxRendererLabel ${fullWidth ? 'fullWidth' : ''}`;
  label.appendChild(rootDocument.createTextNode(text));

  return label.cloneNode(true);
}

/**
 * `mouseup` callback.
 *
 * @private
 * @param {Event} event `mouseup` event.
 * @param {Core} instance The Handsontable instance.
 */
function onMouseUp(event, instance) {
  const { target } = event;

  if (!isCheckboxInput(target)) {
    return;
  }

  if (!target.hasAttribute(ATTR_ROW) || !target.hasAttribute(ATTR_COLUMN)) {
    return;
  }

  setTimeout(instance.listen, 10);
}

/**
 * `click` callback.
 *
 * @private
 * @param {MouseEvent} event `click` event.
 * @param {Core} instance The Handsontable instance.
 */
function onClick(event, instance) {
  const { target } = event;

  if (!isCheckboxInput(target)) {
    return;
  }

  if (!target.hasAttribute(ATTR_ROW) || !target.hasAttribute(ATTR_COLUMN)) {
    return;
  }

  const row = parseInt(target.getAttribute(ATTR_ROW), 10);
  const col = parseInt(target.getAttribute(ATTR_COLUMN), 10);
  const cellProperties = instance.getCellMeta(row, col);

  if (cellProperties.readOnly) {
    event.preventDefault();
  }
}

/**
 * `change` callback.
 *
 * @param {Event} event `change` event.
 * @param {Core} instance The Handsontable instance.
 */
function onChange(event, instance) {
  const { target } = event;

  if (!isCheckboxInput(target)) {
    return;
  }

  if (!target.hasAttribute(ATTR_ROW) || !target.hasAttribute(ATTR_COLUMN)) {
    return;
  }

  const row = parseInt(target.getAttribute(ATTR_ROW), 10);
  const col = parseInt(target.getAttribute(ATTR_COLUMN), 10);
  const cellProperties = instance.getCellMeta(row, col);

  if (!cellProperties.readOnly) {
    let newCheckboxValue = null;

    if (event.target.checked) {
      newCheckboxValue = cellProperties.uncheckedTemplate === void 0 ? true : cellProperties.checkedTemplate;
    } else {
      newCheckboxValue = cellProperties.uncheckedTemplate === void 0 ? false : cellProperties.uncheckedTemplate;
    }

    instance.setDataAtCell(row, col, newCheckboxValue);
  }
}

/**
 * Check if the provided element is the checkbox input.
 *
 * @private
 * @param {HTMLElement} element The element in question.
 * @returns {boolean}
 */
function isCheckboxInput(element) {
  return element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox';
}
