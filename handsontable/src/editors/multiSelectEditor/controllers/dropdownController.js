import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { addClass, removeClass } from '../../../helpers/dom/element';
import { getCheckboxElement, includesValue } from '../utils/utils';
import EventManager from '../../../eventManager';

const SELECTED_ITEM_CLASS = 'htItemSelected';

/**
 * Renders and manages the dropdown list used by the `MultiSelectEditor`.
 * Responsible for rendering checkbox rows and emitting hooks when values change.
 *
 * @private
 */
export class DropdownController {
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
   * Event manager for handling checkbox change events.
   *
   * @type {EventManager}
   */
  #eventManager = new EventManager(this);

  /**
   * Cache for the dropdown controller.
   *
   * @private
   * @type {object}
   */
  #cache = {
    visibleRowsNumber: null,
    entriesCount: 0,
    flippedVertically: false,
    currentlySelectedItemIndex: null,
  };

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
   * Sets the number of visible rows in the dropdown.
   *
   * @param {number} visibleRowsNumber Number of visible rows.
   */
  setVisibleRowsNumber(visibleRowsNumber) {
    this.#cache.visibleRowsNumber = visibleRowsNumber;
  }
  /**
   * Populates the dropdown with provided entries and marks selected ones.
   *
   * @param {string[]|object[]} entries Collection of primitive values or `[value, label]` tuples.
   * @param {Array<*>} [checkedValues=[]] Values that should be rendered as checked.
   */
  fillDropdown(entries, checkedValues = []) {
    this.removeAllDropdownItems();

    if (!Array.isArray(checkedValues)) {
      checkedValues = [];
    }

    entries.forEach((elem) => {
      this.#addDropdownItem(elem?.key, elem?.value ?? elem, includesValue(checkedValues, elem));
    });

    this.#cache.entriesCount = entries.length;
  }

  /**
   * Controls dropdown height based on entry count and configured visible rows.
   *
   * @param {object} availableSpace Available space object.
   * @param {boolean} noFlip If true, the dropdown will not be flipped vertically.
   */
  updateDimensions(availableSpace, noFlip = false) {
    const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.containerElement);
    const entryHeight =
      (2 * parseInt(computedStyle.getPropertyValue('--ht-menu-item-vertical-padding'), 10)) +
      parseInt(computedStyle.getPropertyValue('--ht-line-height'), 10);
    const requiresFlippingVertically = this.#requiresFlippingVertically(availableSpace);
    const availableHeight = requiresFlippingVertically ? availableSpace.spaceAbove : availableSpace.spaceBelow;

    if (!noFlip && requiresFlippingVertically) {
      this.#cache.flippedVertically = true;
    }

    if (
      this.#cache.entriesCount > 0 &&
      availableHeight < (
        this.#cache.visibleRowsNumber ? this.#cache.visibleRowsNumber : this.#cache.entriesCount
      ) * entryHeight
    ) {
      this.#cache.visibleRowsNumber = Math.max(Math.floor(availableHeight / entryHeight) - 1, 1);
    }

    if (this.#cache.visibleRowsNumber && this.#cache.entriesCount > this.#cache.visibleRowsNumber) {
      this.containerElement.style.height = `${(this.#cache.visibleRowsNumber * entryHeight) +
        (2 * parseInt(computedStyle.getPropertyValue('--ht-gap-size'), 10))}px`;

    } else {
      this.containerElement.style.height = '';
    }

    this.#toggleVerticalFlip();

    this.containerElement.scrollTop = 0;
  }

  /**
   * Selects the previous item in the dropdown.
   */
  focusPreviousItem() {
    if (this.#cache.currentlySelectedItemIndex === null) {
      // eslint-disable-next-line no-useless-return
      return;
    }

    this.#defocusItem(this.#cache.currentlySelectedItemIndex);

    if (this.#cache.currentlySelectedItemIndex === 0) {
      this.#focusItem(null);

    } else if (this.#cache.currentlySelectedItemIndex !== null) {
      this.#focusItem(this.#cache.currentlySelectedItemIndex - 1);
    }
  }

  /**
   * Selects the next item in the dropdown.
   */
  focusNextItem() {
    if (this.#cache.currentlySelectedItemIndex === this.#cache.entriesCount - 1) {
      // eslint-disable-next-line no-useless-return
      return;

    } else if (this.#cache.currentlySelectedItemIndex !== null) {
      this.#defocusItem(this.#cache.currentlySelectedItemIndex);

      this.#focusItem(this.#cache.currentlySelectedItemIndex + 1);

    } else if (this.#cache.currentlySelectedItemIndex === null) {
      this.#focusItem(0);
    }
  }

  /**
   * Resets the cache and the dropdown position and height.
   */
  reset() {
    this.#resetCache();
    this.containerElement.style.position = '';
    this.containerElement.style.top = '';
    this.containerElement.style.height = '';
    this.containerElement.scrollTop = 0;
  }

  /**
   * Checks if the dropdown is flipped vertically.
   *
   * @returns {boolean}
   */
  isFlippedVertically() {
    return this.#cache.flippedVertically;
  }

  /**
   * Selects the item at the given index.
   *
   * @param {number} index Index of the item to focus.
   */
  #focusItem(index) {
    if (this.#cache.currentlySelectedItemIndex === null && index === 0) {
      this.runLocalHooks('dropdownFocus');
    } else if (index === null) {
      this.runLocalHooks('dropdownDefocus');
    }

    this.#cache.currentlySelectedItemIndex = index;

    const itemElement = this.dropdownListElement.children[index];

    if (itemElement) {
      const checkbox = getCheckboxElement(itemElement);

      if (checkbox) {
        checkbox.focus();
      }
    }
  }

  /**
   * Defocuses the item at the given index.
   *
   * @param {number} index Index of the item to defocus.
   */
  #defocusItem(index) {
    const itemElement = this.dropdownListElement.children[index];

    if (itemElement) {
      const checkbox = getCheckboxElement(itemElement);

      if (checkbox) {
        checkbox.blur();
      }
    }
  }

  /**
   * Resets the cache.
   */
  #resetCache() {
    this.#cache.visibleRowsNumber = null;
    this.#cache.entriesCount = 0;
    this.#cache.flippedVertically = false;
    this.#cache.currentlySelectedItemIndex = null;
  }

  /**
   * Checks if the dropdown requires flipping vertically.
   *
   * @param {object} availableSpace Available space object.
   * @returns {boolean}
   */
  #requiresFlippingVertically(availableSpace) {
    const { spaceAbove, spaceBelow, cellHeight } = availableSpace;

    return this.getHeight() > spaceBelow && spaceAbove > spaceBelow + cellHeight;
  }

  /**
   * Toggles the vertical flip.
   */
  #toggleVerticalFlip() {
    const flipNeeded = this.#cache.flippedVertically;

    if (flipNeeded) {
      this.containerElement.style.position = 'absolute';
      this.containerElement.style.top = `${-this.getHeight()}px`;

    } else {
      this.containerElement.style.position = '';
      this.containerElement.style.top = '';
    }
  }

  /**
   * Gets the height of the dropdown.
   *
   * @returns {number} Height of the dropdown.
   */
  getHeight() {
    const visibleRowsNumber =
      this.#cache.visibleRowsNumber ?
        Math.min(this.#cache.visibleRowsNumber, this.#cache.entriesCount) : this.#cache.entriesCount;
    const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.containerElement);
    const entryHeight =
      (2 * parseInt(computedStyle.getPropertyValue('--ht-menu-item-vertical-padding'), 10)) +
      parseInt(computedStyle.getPropertyValue('--ht-line-height'), 10);

    return (visibleRowsNumber * entryHeight) +
      (2 * parseInt(computedStyle.getPropertyValue('--ht-gap-size'), 10));
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
   * @param {string} itemKey Key stored in the associated checkbox dataset.
   * @param {string} itemValue Text shown next to the checkbox.
   * @returns {HTMLLIElement}
   */
  #createListItemElement(itemKey, itemValue) {
    const itemElement = this.#rootDocument.createElement('li');
    const innerContainer = this.#rootDocument.createElement('div');
    const checkboxElement = this.#rootDocument.createElement('input');
    const labelElement = this.#rootDocument.createElement('label');

    checkboxElement.id = `htMultiSelectItem-${itemValue}`;
    checkboxElement.type = 'checkbox';
    checkboxElement.dataset.value = itemValue;

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

  /**
   * Adds a single row to the dropdown and optionally marks it as checked.
   *
   * @param {string} itemKey Key stored in the associated checkbox dataset.
   * @param {string} itemValue Text content rendered next to the checkbox.
   * @param {boolean} [checked=false] Flag indicating whether the checkbox starts selected.
   */
  #addDropdownItem(itemKey, itemValue, checked = false) {
    const itemElement = this.#createListItemElement(itemKey, itemValue);

    if (checked) {
      this.selectItem(itemElement);
    }

    this.#registerEvents(itemElement);

    this.dropdownListElement.appendChild(itemElement);
  }

  /**
   * Removes all dropdown rows.
   */
  removeAllDropdownItems() {
    this.dropdownListElement.innerHTML = '';
  }

  /**
   * Applies visual selection state and checks the checkbox.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  selectItem(itemElement) {
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
  deselectItem(itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    removeClass(itemElement, SELECTED_ITEM_CLASS);

    if (checkbox.checked) {
      checkbox.checked = false;
    }
  }

  /**
   * Deselects all items in the dropdown.
   */
  deselectAllItems() {
    this.dropdownListElement.querySelectorAll(SELECTED_ITEM_CLASS).forEach(
      itemElement => this.deselectItem(itemElement)
    );
  }

  /**
   * Wires checkbox change events to toggle selection and emit hooks.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  #registerEvents(itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    this.#eventManager.addEventListener(checkbox, 'change', () => {
      if (checkbox.checked) {
        this.selectItem(itemElement);

        this.runLocalHooks('dropdownItemChecked', checkbox.dataset.key, checkbox.dataset.value);

      } else {
        this.deselectItem(itemElement);

        this.runLocalHooks('dropdownItemUnchecked', checkbox.dataset.key, checkbox.dataset.value);
      }
    });
  }
}

mixin(DropdownController, localHooks);
