import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { addClass, removeClass } from '../../../helpers/dom/element';
import { getCheckboxElement, includesValue } from '../utils/utils';
import EventManager from '../../../eventManager';
import { InputController } from './inputController';

const SELECTED_ITEM_CLASS = 'htItemSelected';
const SEARCH_INPUT_WRAPPER_CLASS = 'htMultiSelectEditorSearchInputWrapper';
const SEARCH_ICON_CLASS = 'htMultiSelectEditorSearchIcon';
const SEARCH_INPUT_CLASS = 'htMultiSelectEditorSearchInput';
const SEPARATOR_CLASS = 'htMultiSelectEditorSeparator';
const CHECKBOX_ID_PREFIX = 'htMultiSelectItem-';
const SEARCH_INPUT_PLACEHOLDER = 'Search...';

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
   * @private
   * @type {HTMLDivElement|null}
   */
  #containerElement = null;

  /**
   * `<ul>` element containing all checkbox rows.
   *
   * @private
   * @type {HTMLUListElement|null}
   */
  #dropdownListElement = null;

  /**
   * Search input element for filtering dropdown entries.
   *
   * @private
   * @type {HTMLInputElement|null}
   */
  #searchInputElement = null;

  /**
   * Input controller for managing the search input.
   *
   * @private
   * @type {InputController|null}
   */
  #inputController = null;

  /**
   * Cached document reference used for DOM operations.
   *
   * @private
   * @type {Document|null}
   */
  #rootDocument = null;

  /**
   * Event manager for handling checkbox change events.
   *
   * @private
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
    currentlySelectedItemIndex: 0,
    checkboxChangeListeners: new Map(),
    areCheckboxesDisabled: false,
    sourceSortFunction: null,
  };

  /**
   * Creates a dropdown renderer attached to the provided container.
   *
   * @param {HTMLDivElement} containerElement Host element created by the editor.
   */
  constructor(containerElement) {
    this.#containerElement = containerElement;

    this.#rootDocument = this.#containerElement.ownerDocument;

    this.init();
  }

  /**
   * Builds required DOM elements and inserts them into the container.
   */
  init() {
    this.#searchInputElement = this.#createSearchInputElement();
    const searchIcon = this.#createSearchIcon();
    const searchInputWrapper = this.#createSearchInputWrapper();
    const separatorElement = this.#createSeparatorElement();

    this.#dropdownListElement = this.#createListElement();

    searchInputWrapper.appendChild(searchIcon);
    searchInputWrapper.appendChild(this.#searchInputElement);
    this.#containerElement.appendChild(searchInputWrapper);
    this.#containerElement.appendChild(separatorElement);
    this.#containerElement.appendChild(this.#dropdownListElement);

    this.#inputController = new InputController({
      input: this.#searchInputElement,
      eventManager: this.#eventManager,
    });
  }

  /**
   * Sets the number of visible rows in the dropdown.
   *
   * @param {number} visibleRowsNumber Number of visible rows.
   */
  setVisibleRowsNumberSetting(visibleRowsNumber) {
    this.#cache.visibleRowsNumberSetting = visibleRowsNumber;
  }

  /**
   * Sets the source sort function.
   *
   * @param {Function} sourceSortFunction Source sort function.
   */
  setSourceSortFunction(sourceSortFunction) {
    this.#cache.sourceSortFunction = sourceSortFunction ?? null;
  }

  /**
   * Populates the dropdown with provided entries and marks selected ones.
   *
   * @param {string[]|object[]} entries Collection of primitive values or `[value, label]` tuples.
   * @param {Array<*>} [checkedValues=[]] Values that should be rendered as checked.
   */
  fillDropdown(entries, checkedValues = []) {
    this.removeAllDropdownItems();
    this.#cache.currentlySelectedItemIndex = 0;

    if (!Array.isArray(checkedValues)) {
      checkedValues = [];
    }

    if (this.#cache.sourceSortFunction) {
      entries = this.#cache.sourceSortFunction(entries);
    }

    entries.forEach((elem) => {
      this.#addDropdownItem(elem?.key, elem?.value ?? elem, includesValue(checkedValues, elem));
    });

    this.#cache.entriesCount = entries.length;

    this.runLocalHooks('afterDropdownFill');
  }

  /**
   * Controls dropdown height based on entry count and configured visible rows.
   *
   * @param {object} availableSpace Available space object.
   * @param {boolean} noFlip If true, the dropdown will not be flipped vertically.
   */
  updateDimensions(availableSpace, noFlip = false) {
    const entryHeight = this.#getEntryHeight();
    const requiresFlippingVertically = this.#requiresFlippingVertically(availableSpace);
    const availableHeight = requiresFlippingVertically ? availableSpace.spaceAbove : availableSpace.spaceBelow;

    if (!noFlip && requiresFlippingVertically) {
      this.#cache.flippedVertically = true;
    }

    if (this.#cache.entriesCount > 0 && availableHeight < this.getHeight(true)) {
      this.#cache.actualRenderedItemsCount =
        Math.max(Math.floor((availableHeight - this.#getSearchInputWrapperHeight()) / entryHeight) - 1, 1);
    } else {
      this.#cache.actualRenderedItemsCount = Math.min(this.#cache.entriesCount, this.#cache.visibleRowsNumberSetting);
    }

    if (this.#cache.actualRenderedItemsCount && this.#cache.entriesCount > this.#cache.actualRenderedItemsCount) {
      this.#containerElement.style.height = `${this.getHeight()}px`;

    } else {
      this.#containerElement.style.height = '';
    }

    this.#toggleVerticalFlip(availableSpace);

    this.#containerElement.scrollTop = 0;
  }

  /**
   * Gets the width of the dropdown.
   *
   * @returns {number} Width of the dropdown.
   */
  getDropdownWidth() {
    return this.#dropdownListElement.offsetWidth;
  }

  /**
   * Focuses the first item in the dropdown.
   */
  focusFirstItem() {
    if (this.#cache.entriesCount > 0) {
      this.#focusItem(0);
    }
  }

  /**
   * Selects the previous item in the dropdown.
   */
  focusPreviousItem() {
    if (this.#cache.currentlySelectedItemIndex === 0) {
      this.#focusSearchInput();

      return;
    }

    this.#defocusItem(this.#cache.currentlySelectedItemIndex);
    this.#focusItem(this.#cache.currentlySelectedItemIndex - 1);
  }

  /**
   * Selects the next item in the dropdown.
   */
  focusNextItem() {
    if (this.#cache.currentlySelectedItemIndex === this.#cache.entriesCount - 1) {
      return;
    }

    this.#defocusItem(this.#cache.currentlySelectedItemIndex);
    this.#focusItem(this.#cache.currentlySelectedItemIndex + 1);
  }

  /**
   * Resets the cache and the dropdown position and height.
   */
  reset() {
    this.removeAllDropdownItems();
    this.#resetCache();

    if (this.#searchInputElement) {
      this.#searchInputElement.value = '';
    }

    this.#containerElement.style.position = '';
    this.#containerElement.style.top = '';
    this.#containerElement.style.height = '';
    this.#containerElement.scrollTop = 0;
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
    this.#cache.currentlySelectedItemIndex = index;

    const itemElement = this.#dropdownListElement.children[index];

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
    const itemElement = this.#dropdownListElement.children[index];

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
    this.#cache.visibleRowsNumberSetting = null;
    this.#cache.entriesCount = 0;
    this.#cache.flippedVertically = false;
    this.#cache.currentlySelectedItemIndex = 0;
  }

  /**
   * Checks if the dropdown requires flipping vertically.
   *
   * @param {object} availableSpace Available space object.
   * @returns {boolean}
   */
  #requiresFlippingVertically(availableSpace) {
    const { spaceAbove, spaceBelow, cellHeight } = availableSpace;

    return (this.getHeight(true) > spaceBelow) && (spaceAbove > (spaceBelow + cellHeight));
  }

  /**
   * Toggles the vertical flip.
   *
   * @param {object} availableSpace Available space object.
   */
  #toggleVerticalFlip(availableSpace) {
    const { cellHeight } = availableSpace;
    const flipNeeded = this.#cache.flippedVertically;

    if (flipNeeded) {
      this.#containerElement.style.position = 'absolute';
      this.#containerElement.style.top = `${-this.getHeight() - cellHeight}px`;

    } else {
      this.#containerElement.style.position = '';
      this.#containerElement.style.top = '';
    }
  }

  /**
   * Gets the height of the dropdown.
   *
   * @param {boolean} maxRowsCalculation If true, the height will be calculated for the maximum number of rows.
   * @returns {number} Height of the dropdown.
   */
  getHeight(maxRowsCalculation = false) {
    return this.#getListHeight(maxRowsCalculation) + this.#getSearchInputWrapperHeight();
  }

  /**
   * Gets the height of an entry.
   *
   * @returns {number} Height of an entry.
   */
  #getEntryHeight() {
    const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.#containerElement);

    return (2 * parseInt(computedStyle.getPropertyValue('--ht-menu-item-vertical-padding'), 10)) +
      parseInt(computedStyle.getPropertyValue('--ht-line-height'), 10);
  }

  /**
   * Gets the height of the list.
   *
   * @param {boolean} maxRowsCalculation If true, the height will be calculated for the maximum number of rows.
   * @returns {number} Height of the list.
   */
  #getListHeight(maxRowsCalculation = false) {
    const maxRenderedItems =
    this.#cache.visibleRowsNumberSetting ?
      Math.min(this.#cache.visibleRowsNumberSetting, this.#cache.entriesCount) : this.#cache.entriesCount;
    const actualRenderedItems =
      maxRowsCalculation ? maxRenderedItems : this.#cache.actualRenderedItemsCount ?? maxRenderedItems;
    const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.#containerElement);
    const entryHeight = this.#getEntryHeight();
    const listHeight = (actualRenderedItems * entryHeight) +
      (2 * parseInt(computedStyle.getPropertyValue('--ht-gap-size'), 10));

    return listHeight;
  }

  /**
   * Gets the height of the search input wrapper.
   *
   * @returns {number} Height of the search input wrapper.
   */
  #getSearchInputWrapperHeight() {
    const searchInputWrapper = this.#containerElement.querySelector(`.${SEARCH_INPUT_WRAPPER_CLASS}`);
    const searchInputWrapperHeight = searchInputWrapper ? searchInputWrapper.offsetHeight : 0;
    const separatorHeight = 1;

    return searchInputWrapperHeight + separatorHeight;
  }

  /**
   * Creates the wrapper div for the search input.
   *
   * @returns {HTMLDivElement}
   */
  #createSearchInputWrapper() {
    const wrapperElement = this.#rootDocument.createElement('div');

    wrapperElement.className = SEARCH_INPUT_WRAPPER_CLASS;

    return wrapperElement;
  }

  /**
   * Creates the search icon element.
   *
   * @returns {HTMLElement}
   */
  #createSearchIcon() {
    const iconElement = this.#rootDocument.createElement('div');

    iconElement.className = SEARCH_ICON_CLASS;

    return iconElement;
  }

  /**
   * Creates the search input element.
   *
   * @returns {HTMLInputElement}
   */
  #createSearchInputElement() {
    const inputElement = this.#rootDocument.createElement('input');

    inputElement.type = 'text';
    inputElement.size = 5;
    inputElement.className = SEARCH_INPUT_CLASS;
    inputElement.placeholder = SEARCH_INPUT_PLACEHOLDER;

    return inputElement;
  }

  /**
   * Creates the separator line element.
   *
   * @returns {HTMLElement}
   */
  #createSeparatorElement() {
    const separatorElement = this.#rootDocument.createElement('div');

    separatorElement.className = SEPARATOR_CLASS;

    return separatorElement;
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
   * @param {boolean} [checked=false] Flag indicating whether the checkbox starts selected.
   * @returns {HTMLLIElement}
   */
  #createListItemElement(itemKey, itemValue, checked = false) {
    const itemElement = this.#rootDocument.createElement('li');
    const innerContainer = this.#rootDocument.createElement('div');
    const checkboxElement = this.#rootDocument.createElement('input');
    const labelElement = this.#rootDocument.createElement('label');

    checkboxElement.id = `${CHECKBOX_ID_PREFIX}${itemValue}`;
    checkboxElement.type = 'checkbox';
    checkboxElement.dataset.value = itemValue;
    checkboxElement.disabled = checked ? false : this.#cache.areCheckboxesDisabled;

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
    const itemElement = this.#createListItemElement(itemKey, itemValue, checked);

    if (checked) {
      this.selectItem(itemElement);
    }

    this.#registerEvents(itemElement);

    this.#dropdownListElement.appendChild(itemElement);
  }

  /**
   * Removes all dropdown rows.
   */
  removeAllDropdownItems() {
    Array.from(this.#dropdownListElement.children).forEach(itemElement => this.#unregisterEvents(itemElement));

    this.#cache.checkboxChangeListeners.clear();
    this.#dropdownListElement.innerHTML = '';
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
    this.#dropdownListElement.querySelectorAll(`.${SELECTED_ITEM_CLASS}`).forEach(
      itemElement => this.deselectItem(itemElement)
    );
  }

  /**
   * Disables the unchecked checkboxes.
   */
  disableCheckboxes() {
    this.#cache.areCheckboxesDisabled = true;

    this.#dropdownListElement.querySelectorAll('input[type="checkbox"]:not(:checked)').forEach((checkbox) => {
      checkbox.disabled = true;
    });
  }

  /**
   * Enables the checkboxes.
   */
  enableCheckboxes() {
    this.#cache.areCheckboxesDisabled = false;

    this.#dropdownListElement.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.disabled = false;
    });
  }

  /**
   * Wires checkbox change events to toggle selection and emit hooks.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  #registerEvents(itemElement) {
    const checkbox = getCheckboxElement(itemElement);

    const checkboxChangeListener = () => {
      if (checkbox.checked) {
        this.selectItem(itemElement);
        this.runLocalHooks('afterDropdownItemChecked', checkbox.dataset.key, checkbox.dataset.value);

      } else {
        this.deselectItem(itemElement);
        this.runLocalHooks('afterDropdownItemUnchecked', checkbox.dataset.key, checkbox.dataset.value);
      }
    };

    const itemClickListener = (event) => {
      if (
        event.target === checkbox ||
        checkbox.disabled ||
        event.target.tagName === 'LABEL'
      ) {
        return;
      }

      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    };

    this.#cache.checkboxChangeListeners.set(checkbox, { change: checkboxChangeListener, click: itemClickListener });

    this.#eventManager.addEventListener(checkbox, 'change', checkboxChangeListener);
    this.#eventManager.addEventListener(itemElement, 'click', itemClickListener);
  }

  /**
   * Unregisters events from the item element.
   *
   * @param {HTMLLIElement} itemElement Dropdown row element.
   */
  #unregisterEvents(itemElement) {
    const checkbox = getCheckboxElement(itemElement);
    const checkboxListeners = this.#cache.checkboxChangeListeners.get(checkbox);

    this.#eventManager.removeEventListener(checkbox, 'change', checkboxListeners.change);
    this.#eventManager.removeEventListener(itemElement, 'click', checkboxListeners.click);

    this.#cache.checkboxChangeListeners.delete(checkbox);
  }

  /**
   * Gets the input controller instance.
   *
   * @returns {InputController|null} The input controller instance.
   */
  getInputController() {
    return this.#inputController;
  }

  /**
   * Focuses the search input element.
   *
   * @private
   */
  #focusSearchInput() {
    if (this.#searchInputElement) {
      this.#searchInputElement.focus();
    }
  }
}

mixin(DropdownController, localHooks);

