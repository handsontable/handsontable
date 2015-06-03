/**
 * Checkbox renderer
 *
 * @private
 * @renderer
 * @component CheckboxRenderer
 * @param {Object} instance Handsontable instance
 * @param {Element} TD Table cell where to render
 * @param {Number} row
 * @param {Number} col
 * @param {String|Number} prop Row object property name
 * @param value Value to render (remember to escape unsafe HTML before inserting to DOM!)
 * @param {Object} cellProperties Cell properties (shared by cell renderer and editor)
 */

import * as dom from './../dom.js';
import * as helper from './../helpers.js';
import {EventManager} from './../eventManager.js';
import {getRenderer, registerRenderer} from './../renderers.js';


let clonableINPUT = document.createElement('INPUT');

clonableINPUT.className = 'htCheckboxRendererInput';
clonableINPUT.type = 'checkbox';
clonableINPUT.setAttribute('autocomplete', 'off');

const isListeningKeyDownEvent = new WeakMap();


function checkboxRenderer(instance, TD, row, col, prop, value, cellProperties) {
  const eventManager = new EventManager(instance);
  // this is faster than createElement
  const input = clonableINPUT.cloneNode(false);

  if (typeof cellProperties.checkedTemplate === 'undefined') {
    cellProperties.checkedTemplate = true;
  }
  if (typeof cellProperties.uncheckedTemplate === 'undefined') {
    cellProperties.uncheckedTemplate = false;
  }
  dom.empty(TD); // TODO identify under what circumstances this line can be removed

  if (value === cellProperties.checkedTemplate || value === helper.stringify(cellProperties.checkedTemplate)) {
    input.checked = true;
    TD.appendChild(input);
  }
  else if (value === cellProperties.uncheckedTemplate || value === helper.stringify(cellProperties.uncheckedTemplate)) {
    TD.appendChild(input);
  }
  else if (value === null) { // default value
    dom.addClass(input, 'noValue');
    TD.appendChild(input);
  }
  else {
    dom.fastInnerText(TD, '#bad value#');
  }

  if (cellProperties.readOnly) {
    eventManager.addEventListener(input, 'click', preventDefault);
  } else {
    eventManager.addEventListener(input, 'mousedown', stopPropagation);
    eventManager.addEventListener(input, 'mouseup', stopPropagation);
    eventManager.addEventListener(input, 'change', (event) => {
      instance.setDataAtRowProp(row, prop, event.target.checked ? cellProperties.checkedTemplate : cellProperties.uncheckedTemplate);
    });
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
    const allowedKeys = [
      helper.keyCode.SPACE,
      helper.keyCode.ENTER,
      helper.keyCode.DELETE,
      helper.keyCode.BACKSPACE
    ];
    dom.enableImmediatePropagation(event);

    if (allowedKeys.indexOf(event.keyCode) !== -1 && !event.isImmediatePropagationStopped()) {
      eachSelectedCheckboxCell(function() {
        event.stopImmediatePropagation();
        event.preventDefault();
      });
    }
    if (event.keyCode == helper.keyCode.SPACE || event.keyCode == helper.keyCode.ENTER) {
      toggleSelected();
    }
    if (event.keyCode == helper.keyCode.DELETE || event.keyCode == helper.keyCode.BACKSPACE) {
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
      for (var i = 0, len = checkboxes.length; i < len; i++) {
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

  function preventDefault(event) {
    event.preventDefault();
  }
  function stopPropagation(event) {
    helper.stopPropagation(event);
  }
}

export {checkboxRenderer};

registerRenderer('checkbox', checkboxRenderer);
