import { mixin } from '../../helpers/object';
import localHooks from '../../mixins/localHooks';
import { addClass, removeClass } from '../../helpers/dom/element';
import { getCheckboxElement } from './utils/utils';

/**
 * Renders and manages the dropdown list used by the `MultiSelectEditor`.
 * Responsible for rendering checkbox rows and emitting hooks when values change.
 *
 * @private
 */
export class DropdownElement {
  /**
   * Element that wraps the dropdown list inside the editor UI.
   *
   * @type {HTMLDivElement|null}
   */
  containerElement = null;

  /**
   * `<ul>` element containing all checkbox rows.
   *
   * @type {HTMLUListElement|null}
   */
  dropdownListElement = null;

  /**
   * Cached document reference used for DOM operations.
   *
   * @type {Document|null}
   */
  #rootDocument = null;

  /**
   * Creates a dropdown renderer attached to the provided container.
   *
   * @param {HTMLDivElement} containerElement Host element created by the editor.
   */
  constructor(containerElement) {
    this.containerElement = containerElement;

    this.#rootDocument = this.containerElement.ownerDocument;

    this.init();
  }

  /**
   * Builds required DOM elements and inserts them into the container.
   */
  init() {
    this.dropdownListElement = this.#createListElement();

    this.containerElement.appendChild(this.dropdownListElement);
  }

  /**
   * Populates the dropdown with provided entries and marks selected ones.
   *
   * @param {Array<*>|Array<Array<*>>} entries Collection of primitive values or `[value, label]` tuples.
   * @param {Array<*>} [checkedValues=[]] Values that should be rendered as checked.
   */
  fillDropdown(entries, checkedValues = []) {
    this.#removeAllDropdownItems();

    if (!Array.isArray(checkedValues)) {
      checkedValues = [];
    }

    entries.forEach((elem) => {
      let itemValue = null;
      let itemLabel = null;

      if (Array.isArray(elem)) {
        itemValue = elem[0];
        itemLabel = elem[1];

      } else {
        itemValue = elem;
        itemLabel = elem;
      }

      this.#addDropdownItem(itemValue, itemLabel, checkedValues.includes(itemValue));
    });
  }

  /**
   * Controls dropdown height based on entry count and configured visible rows.
   *
   * @param {number} entriesCount Total number of rendered entries.
   * @param {number} visibleRowsNumber Maximum rows that should stay visible before scrolling.
   */
  updateDimensions(entriesCount, visibleRowsNumber) {
    if (visibleRowsNumber && entriesCount > visibleRowsNumber) {
      const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.containerElement);
      const entryHeight =
        (2 * parseInt(computedStyle.getPropertyValue('--ht-menu-item-vertical-padding'))) +
        parseInt(computedStyle.getPropertyValue('--ht-line-height'));

      this.containerElement.style.height = `${
        visibleRowsNumber * entryHeight +
        2 * parseInt(computedStyle.getPropertyValue('--ht-gap-size'))
      }px`;

    } else {
      this.containerElement.style.height = '';
    }

    this.containerElement.scrollTop = 0;
  }

  /**
   * Creates the list element that holds dropdown items.
   *
   * @returns {HTMLUListElement}
   */
  #createListElement() {
    return this.#rootDocument.createElement('ul');
  }

  /**
   * Creates a single dropdown row with a checkbox and label.
   *
   * @param {*} itemValue Value passed back to the editor when toggled.
   * @param {*} itemLabel Text shown next to the checkbox.
   * @returns {HTMLLIElement}
   */
  #createListItemElement(itemValue, itemLabel) {
    const itemElement = this.#rootDocument.createElement('li');
    const innerContainer = this.#rootDocument.createElement('div');
    const checkboxElement = this.#rootDocument.createElement('input');
    const labelElement = this.#rootDocument.createElement('label');

    checkboxElement.id = `htMultiSelectItem-${itemValue}`;
    checkboxElement.type = 'checkbox';
    checkboxElement.dataset.value = itemValue;

    labelElement.htmlFor = checkboxElement.id;
    labelElement.textContent = itemLabel;

    innerContainer.appendChild(checkboxElement);
    innerContainer.appendChild(labelElement);
    itemElement.appendChild(innerContainer);

    return itemElement;
  }

  /**
   * Adds a single row to the dropdown and optionally marks it as checked.
   *
   * @param {*} itemValue Value stored in the associated checkbox dataset.
   * @param {*} itemLabel Text content rendered next to the checkbox.
   * @param {boolean} [checked=false] Flag indicating whether the checkbox starts selected.
   */
  #addDropdownItem(itemValue, itemLabel, checked = false) {
    const itemElement = this.#createListItemElement(itemValue, itemLabel);

    if (checked) {
      this.#selectItem(itemElement);
    }

    this.#registerEvents(itemElement);

    this.dropdownListElement.appendChild(itemElement);
  }

  /**
   * Removes all dropdown rows.
   */
  #removeAllDropdownItems() {
    this.dropdownListElement.innerHTML = '';
  }

  /**
   * Applies visual selection state and checks the checkbox.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  #selectItem(itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    addClass(itemElement, 'htItemSelected');

    if (!checkbox.checked) {
      checkbox.checked = true;
    }
  }

  /**
   * Clears selection classes and unchecks the checkbox.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  #deselectItem(itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    removeClass(itemElement, 'htItemSelected');

    if (checkbox.checked) {
      checkbox.checked = false;
    }
  }

  /**
   * Wires checkbox change events to toggle selection and emit hooks.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  #registerEvents(itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    checkbox.addEventListener('change', (event) => {
      if (checkbox.checked) {
        this.#selectItem(itemElement);

        this.runLocalHooks('dropdownItemChecked', checkbox.dataset.value);

      } else {
        this.#deselectItem(itemElement);

        this.runLocalHooks('dropdownItemUnchecked', checkbox.dataset.value);
      }
    });
  }
}

mixin(DropdownElement, localHooks);
