import type { HotInstance } from '../../../core/types';
import { addClass, removeClass, setAttribute } from '../../../helpers/dom/element';
import { A11Y_LABEL } from '../../../helpers/a11y';
import { createIcon } from '../../../themes/engine/icons';
import { getCheckboxElement } from '../utils/utils';

const classPrefix = 'ht-multi-select-editor';
const SEARCH_INPUT_WRAPPER_CLASS = `${classPrefix}-search-input-wrapper`;
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
export function selectItem(itemElement: HTMLLIElement): void {
  const checkbox = getCheckboxElement(itemElement);

  addClass(itemElement, SELECTED_ITEM_CLASS);

  if (checkbox && !checkbox.checked) {
    checkbox.checked = true;
  }
}

/**
 * Clears selection classes and unchecks the checkbox.
 *
 * @param {HTMLLIElement} itemElement Dropdown row element.
 */
export function deselectItem(itemElement: HTMLLIElement): void {
  const checkbox = getCheckboxElement(itemElement);

  removeClass(itemElement, SELECTED_ITEM_CLASS);

  if (checkbox && checkbox.checked) {
    checkbox.checked = false;
  }
}

/**
 * Creates the wrapper div for the search input.
 */
export function createSearchInputWrapper({ root }: { root: Document }): HTMLDivElement {
  const wrapperElement = root.createElement('div');

  wrapperElement.className = SEARCH_INPUT_WRAPPER_CLASS;

  return wrapperElement;
}

/**
 * The class the search icon carried before DEV-3003, when it was a `<div>` painted by an `iconsMap`
 * rule. Kept on the new `<i class="ht-icon ht-icon-search">` as a legacy hook for custom
 * stylesheets (`.ai/BREAKING-CHANGES.md`: a class Handsontable produces stays in the DOM); nothing
 * in the shipped CSS targets it any more.
 */
export const LEGACY_SEARCH_ICON_CLASS = 'ht-multi-select-editor-search-icon';

/**
 * Creates the search icon element: a real `<i class="ht-icon ht-icon-search">` (`createIcon()`),
 * styled by the generic `.ht-icon-search` rule the theme engine generates for every icon slot, and
 * still carrying the legacy class name.
 */
export function createSearchIcon(
  { hotInstance }: { hotInstance: Pick<HotInstance, 'rootDocument' | 'themeManager'> }
): HTMLElement {
  return createIcon(hotInstance, 'search', { className: LEGACY_SEARCH_ICON_CLASS });
}

/**
 * Creates the search input element.
 */
export function createSearchInputElement({ root }: { root: Document }): HTMLInputElement {
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
 */
export function createSeparatorElement({ root }: { root: Document }): HTMLElement {
  const separatorElement = root.createElement('div');

  separatorElement.className = SEPARATOR_CLASS;

  return separatorElement;
}

/**
 * Creates the list element that holds dropdown items.
 */
export function createListElement({ root }: { root: Document }): HTMLUListElement {
  return root.createElement('ul');
}

/**
 * Gets the width of the dropdown.
 */
export function getDropdownWidth({ dropdownListElement }: { dropdownListElement: HTMLUListElement }): number {
  return dropdownListElement.offsetWidth;
}

/**
 * Deselects all items in the dropdown.
 */
export function deselectAllItems({ dropdownListElement }: { dropdownListElement: HTMLUListElement }): void {
  dropdownListElement.querySelectorAll<HTMLLIElement>(`.${SELECTED_ITEM_CLASS}`).forEach(
    itemElement => deselectItem(itemElement)
  );
}

/**
 * Defocuses the item at the given index.
 */
export function defocusItem({
  dropdownListElement,
  index,
}: { dropdownListElement: HTMLUListElement; index: number }): void {
  const itemElement = dropdownListElement.children[index] as HTMLLIElement | undefined;

  if (itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    if (checkbox) {
      checkbox.blur();
    }
  }
}

/**
 * Focuses the item at the given index.
 */
export function focusItemAt({
  dropdownListElement,
  index,
}: { dropdownListElement: HTMLUListElement; index: number }): void {
  const itemElement = dropdownListElement.children[index] as HTMLLIElement | undefined;

  if (itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    if (checkbox) {
      checkbox.focus();
    }
  }
}

/**
 * Disables the unchecked checkboxes in the dropdown.
 */
export function disableUncheckedCheckboxes({
  dropdownListElement,
}: { dropdownListElement: HTMLUListElement }): void {
  dropdownListElement.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:not(:checked)').forEach((checkbox) => {
    checkbox.dataset.disabled = 'true';
  });
}

/**
 * Enables all checkboxes in the dropdown.
 */
export function enableAllCheckboxes({
  dropdownListElement,
}: { dropdownListElement: HTMLUListElement }): void {
  dropdownListElement.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.dataset.disabled = 'false';
  });
}

export interface CreateListItemElementOptions {
  rootDocument: Document;
  instanceId: string;
  itemKey?: string;
  itemValue: string;
  indexWithinList: number;
  checked?: boolean;
  disabled?: boolean;
  hotInstance: Pick<HotInstance, 'rootDocument' | 'themeManager'>;
}

/**
 * Creates a single dropdown row with a checkbox and label.
 */
export function createListItemElement({
  rootDocument,
  instanceId,
  itemKey,
  itemValue,
  indexWithinList,
  checked = false,
  disabled = false,
  hotInstance,
}: CreateListItemElementOptions): HTMLLIElement {
  const itemElement = rootDocument.createElement('li');
  const innerContainer = rootDocument.createElement('div');
  const checkboxElement = rootDocument.createElement('input');
  const labelElement = rootDocument.createElement('label');

  checkboxElement.id = `${instanceId}-${CHECKBOX_ID_PREFIX}${indexWithinList}`;
  checkboxElement.type = 'checkbox';
  checkboxElement.dataset.value = itemValue;
  checkboxElement.dataset.index = String(indexWithinList);
  checkboxElement.dataset.disabled = (disabled && !checked) ? 'true' : 'false';

  if (itemKey) {
    checkboxElement.dataset.key = itemKey;
  }

  labelElement.htmlFor = checkboxElement.id;
  labelElement.textContent = itemValue;

  innerContainer.appendChild(checkboxElement);
  // Structurally the same as `checkboxRenderer`'s tick (task 16): an `<input>` can hold no
  // children, so the checked-state icon is a sibling instead, inserted right after it and before
  // the label. `_multi-select-editor.scss` drives its visibility with `input:checked + .ht-icon`
  // rather than the `.ht-multi-select-editor-item-selected` class `selectItem()`/`deselectItem()`
  // also toggle - that class is still applied, but only for the row's background highlight now.
  innerContainer.appendChild(createIcon(hotInstance, 'checkbox'));
  innerContainer.appendChild(labelElement);
  itemElement.appendChild(innerContainer);

  return itemElement;
}
