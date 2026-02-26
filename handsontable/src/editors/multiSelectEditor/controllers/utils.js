import { addClass, removeClass, setAttribute } from '../../../helpers/dom/element';
import { A11Y_HIDDEN, A11Y_LABEL } from '../../../helpers/a11y';
import { getCheckboxElement } from '../utils/utils';

const classPrefix = 'ht-multi-select-editor';
const SEARCH_INPUT_WRAPPER_CLASS = `${classPrefix}-search-input-wrapper`;
const SEARCH_ICON_CLASS = `${classPrefix}-search-icon`;
const SEARCH_INPUT_CLASS = `${classPrefix}-search-input`;
const SEPARATOR_CLASS = `${classPrefix}-separator`;
const SEARCH_INPUT_PLACEHOLDER = 'Search...';
const SEARCH_INPUT_ARIA_LABEL = 'Search options';
const CHECKBOX_ID_PREFIX = `${classPrefix}-item-`;

export const SELECTED_ITEM_CLASS = `${classPrefix}-item-selected`;

/**
 * Applies visual selection state and checks the checkbox.
 *
 * @param {HTMLLIElement} itemElement Dropdown row element.
 */
export function selectItem(itemElement) {
  const checkbox = getCheckboxElement(itemElement);

  addClass(itemElement, SELECTED_ITEM_CLASS);

  if (!checkbox.checked) {
    checkbox.checked = true;
  }
}

/**
 * Clears selection classes and unchecks the checkbox.
 *
 * @param {HTMLLIElement} itemElement Dropdown row element.
 */
export function deselectItem(itemElement) {
  const checkbox = getCheckboxElement(itemElement);

  removeClass(itemElement, SELECTED_ITEM_CLASS);

  if (checkbox.checked) {
    checkbox.checked = false;
  }
}

/**
 * Creates the wrapper div for the search input.
 *
 * @param {object} options Options object.
 * @param {Document} options.root Root document element.
 * @returns {HTMLDivElement}
 */
export function createSearchInputWrapper({ root }) {
  const wrapperElement = root.createElement('div');

  wrapperElement.className = SEARCH_INPUT_WRAPPER_CLASS;

  return wrapperElement;
}

/**
 * Creates the search icon element.
 *
 * @param {object} options Options object.
 * @param {Document} options.root Root document element.
 * @returns {HTMLElement}
 */
export function createSearchIcon({ root }) {
  const iconElement = root.createElement('div');

  addClass(iconElement, SEARCH_ICON_CLASS);
  setAttribute(iconElement, [
    A11Y_HIDDEN(),
  ]);

  return iconElement;
}

/**
 * Creates the search input element.
 *
 * @param {object} options Options object.
 * @param {Document} options.root Root document element.
 * @returns {HTMLInputElement}
 */
export function createSearchInputElement({ root }) {
  const inputElement = root.createElement('input');

  setAttribute(inputElement, [
    A11Y_LABEL(SEARCH_INPUT_ARIA_LABEL),
    ['type', 'text'],
    ['size', 3],
    ['placeholder', SEARCH_INPUT_PLACEHOLDER],
    ['id', SEARCH_INPUT_CLASS],
  ]);

  addClass(inputElement, SEARCH_INPUT_CLASS);

  return inputElement;
}

/**
 * Creates the separator line element.
 *
 * @param {object} options Options object.
 * @param {Document} options.root Root document element.
 * @returns {HTMLElement}
 */
export function createSeparatorElement({ root }) {
  const separatorElement = root.createElement('div');

  separatorElement.className = SEPARATOR_CLASS;

  return separatorElement;
}

/**
 * Creates the list element that holds dropdown items.
 *
 * @param {object} options Options object.
 * @param {Document} options.root Root document element.
 * @returns {HTMLUListElement}
 */
export function createListElement({ root }) {
  return root.createElement('ul');
}

/**
 * Gets the width of the dropdown.
 *
 * @param {object} options Options object.
 * @param {HTMLUListElement} options.dropdownListElement The dropdown list element.
 * @returns {number} Width of the dropdown.
 */
export function getDropdownWidth({ dropdownListElement }) {
  return dropdownListElement.offsetWidth;
}

/**
 * Deselects all items in the dropdown.
 *
 * @param {object} options Options object.
 * @param {HTMLUListElement} options.dropdownListElement The dropdown list element.
 */
export function deselectAllItems({ dropdownListElement }) {
  dropdownListElement.querySelectorAll(`.${SELECTED_ITEM_CLASS}`).forEach(
    itemElement => deselectItem(itemElement)
  );
}

/**
 * Defocuses the item at the given index.
 *
 * @param {object} options Options object.
 * @param {HTMLUListElement} options.dropdownListElement The dropdown list element.
 * @param {number} options.index Index of the item to defocus.
 */
export function defocusItem({ dropdownListElement, index }) {
  const itemElement = dropdownListElement.children[index];

  if (itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    if (checkbox) {
      checkbox.blur();
    }
  }
}

/**
 * Focuses the item at the given index.
 *
 * @param {object} options Options object.
 * @param {HTMLUListElement} options.dropdownListElement The dropdown list element.
 * @param {number} options.index Index of the item to focus.
 */
export function focusItemAt({ dropdownListElement, index }) {
  const itemElement = dropdownListElement.children[index];

  if (itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    if (checkbox) {
      checkbox.focus();
    }
  }
}

/**
 * Disables the unchecked checkboxes in the dropdown.
 *
 * @param {object} options Options object.
 * @param {HTMLUListElement} options.dropdownListElement The dropdown list element.
 */
export function disableUncheckedCheckboxes({ dropdownListElement }) {
  dropdownListElement.querySelectorAll('input[type="checkbox"]:not(:checked)').forEach((checkbox) => {
    checkbox.dataset.disabled = true;
  });
}

/**
 * Enables all checkboxes in the dropdown.
 *
 * @param {object} options Options object.
 * @param {HTMLUListElement} options.dropdownListElement The dropdown list element.
 */
export function enableAllCheckboxes({ dropdownListElement }) {
  dropdownListElement.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.dataset.disabled = false;
  });
}

/**
 * Creates a single dropdown row with a checkbox and label.
 *
 * @param {object} options Options object.
 * @param {Document} options.rootDocument Root document element.
 * @param {string} options.instanceId Handsontable instance id.
 * @param {string} options.itemKey Key stored in the associated checkbox dataset.
 * @param {string} options.itemValue Text shown next to the checkbox.
 * @param {number} options.indexWithinList Index of the item within the list.
 * @param {boolean} [options.checked=false] Flag indicating whether the checkbox starts selected.
 * @param {boolean} [options.disabled=false] Flag indicating whether the checkbox starts disabled.
 * @returns {HTMLLIElement}
 */
export function createListItemElement({
  rootDocument,
  instanceId,
  itemKey,
  itemValue,
  indexWithinList,
  checked = false,
  disabled = false,
}) {
  const itemElement = rootDocument.createElement('li');
  const innerContainer = rootDocument.createElement('div');
  const checkboxElement = rootDocument.createElement('input');
  const labelElement = rootDocument.createElement('label');

  checkboxElement.id = `${instanceId}-${CHECKBOX_ID_PREFIX}${indexWithinList}`;
  checkboxElement.type = 'checkbox';
  checkboxElement.dataset.value = itemValue;
  checkboxElement.dataset.index = indexWithinList;
  checkboxElement.dataset.disabled = checked ? false : disabled;

  if (itemKey) {
    checkboxElement.dataset.key = itemKey;
  }

  labelElement.htmlFor = checkboxElement.id;
  labelElement.textContent = itemValue;

  innerContainer.appendChild(checkboxElement);
  innerContainer.appendChild(labelElement);
  itemElement.appendChild(innerContainer);

  return itemElement;
}
