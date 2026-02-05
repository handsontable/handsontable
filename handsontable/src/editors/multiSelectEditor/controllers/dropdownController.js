import { mixin } from '../../../helpers/object';
import localHooks from '../../../mixins/localHooks';
import { getCheckboxElement, includesValue } from '../utils/utils';
import EventManager from '../../../eventManager';
import { InputController } from './inputController';
import {
  selectItem,
  deselectItem,
  createSearchInputWrapper,
  createSearchIcon,
  createSearchInputElement,
  createSeparatorElement,
  createListElement,
  getDropdownWidth,
  deselectAllItems,
  defocusItem,
  focusItemAt,
  disableUncheckedCheckboxes,
  enableAllCheckboxes,
  createListItemElement,
} from './utils';

/**
 * Renders and manages the dropdown list used by the `MultiSelectEditor`.
 * Responsible for rendering checkbox rows and emitting hooks when values change.
 *
 * @private
 * @class DropdownController
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
   * Separator element between the search input and the dropdown list.
   *
   * @private
   * @type {HTMLDivElement|null}
   */
  #separatorElement = null;

  /**
   * Wrapper element for the search input.
   *
   * @private
   * @type {HTMLDivElement|null}
   */
  #searchInputWrapper = null;

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
    this.#dropdownListElement = createListElement({ root: this.#rootDocument });
    this.#searchInputElement = createSearchInputElement({ root: this.#rootDocument });

    const searchIcon = createSearchIcon({ root: this.#rootDocument });

    this.#searchInputWrapper = createSearchInputWrapper({ root: this.#rootDocument });
    this.#separatorElement = createSeparatorElement({ root: this.#rootDocument });

    this.#searchInputWrapper.appendChild(searchIcon);
    this.#searchInputWrapper.appendChild(this.#searchInputElement);
    this.#containerElement.appendChild(this.#searchInputWrapper);
    this.#containerElement.appendChild(this.#separatorElement);

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
   * Sets the visibility of the search input.
   *
   * @param {boolean} [searchInput=true] If true, the search input will be displayed.
   */
  setSearchInputVisibility(searchInput = true) {
    this.#searchInputWrapper.style.display = searchInput ? '' : 'none';
    this.#separatorElement.style.display = searchInput ? '' : 'none';

    this.#inputController.toggle(searchInput);
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

    entries.forEach((elem, indexWithinList) => {
      this.#addDropdownItem({
        rootElement: this.#rootDocument,
        itemKey: elem?.key,
        itemValue: elem?.value ?? elem,
        indexWithinList,
        checked: includesValue(checkedValues, elem),
        disabled: this.#cache.areCheckboxesDisabled,
      });
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
      const maxRenderableItems = Math.max(
        Math.floor((availableHeight - this.#getSearchInputWrapperHeight()) / entryHeight) - 1,
        1
      );

      this.#cache.actualRenderedItemsCount = this.#cache.visibleRowsNumberSetting ?
        Math.min(maxRenderableItems, this.#cache.visibleRowsNumberSetting) : maxRenderableItems;

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
    return getDropdownWidth({ dropdownListElement: this.#dropdownListElement });
  }

  /**
   * Deselects all items in the dropdown.
   */
  deselectAllItems() {
    deselectAllItems({ dropdownListElement: this.#dropdownListElement });
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
   * Focuses the item at the given index.
   *
   * @param {number} index Index of the item to focus.
   */
  focusItem(index) {
    this.#focusItem(index);
  }

  /**
   * Selects the previous item in the dropdown.
   */
  focusPreviousItem() {
    if (this.#cache.currentlySelectedItemIndex === 0) {
      this.focusSearchInput();

      return;
    }

    defocusItem({ dropdownListElement: this.#dropdownListElement, index: this.#cache.currentlySelectedItemIndex });
    this.#focusItem(this.#cache.currentlySelectedItemIndex - 1);
  }

  /**
   * Selects the next item in the dropdown.
   */
  focusNextItem() {
    if (this.#cache.currentlySelectedItemIndex === this.#cache.entriesCount - 1) {
      return;
    }

    defocusItem({ dropdownListElement: this.#dropdownListElement, index: this.#cache.currentlySelectedItemIndex });
    this.#focusItem(this.#cache.currentlySelectedItemIndex + 1);
  }

  /**
   * Focuses the search input element.
   */
  focusSearchInput() {
    if (this.#searchInputElement) {
      this.#searchInputElement.focus();
    }
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
   * Gets the height of the dropdown.
   *
   * @param {boolean} maxRowsCalculation If true, the height will be calculated for the maximum number of rows.
   * @param {boolean} outerWidth If true, the width will be calculated for the outer width.
   * @returns {number} Height of the dropdown.
   */
  getHeight(maxRowsCalculation = false, outerWidth = false) {
    const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.#containerElement);

    return this.#getListHeight(maxRowsCalculation) + this.#getSearchInputWrapperHeight() +
      (outerWidth === true ? 2 * parseInt(computedStyle.getPropertyValue('--ht-menu-vertical-padding'), 10) : 0);
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
   * Removes all dropdown rows.
   */
  removeAllDropdownItems() {
    Array.from(this.#dropdownListElement.children).forEach(itemElement => this.#unregisterEvents(itemElement));

    this.#cache.checkboxChangeListeners.clear();
    this.#dropdownListElement.innerHTML = '';
  }

  /**
   * Disables the unchecked checkboxes.
   */
  disableCheckboxes() {
    this.#cache.areCheckboxesDisabled = true;

    disableUncheckedCheckboxes({ dropdownListElement: this.#dropdownListElement });
  }

  /**
   * Enables the checkboxes.
   */
  enableCheckboxes() {
    this.#cache.areCheckboxesDisabled = false;

    enableAllCheckboxes({ dropdownListElement: this.#dropdownListElement });
  }

  /**
   * Selects the item at the given index.
   *
   * @param {number} index Index of the item to focus.
   */
  #focusItem(index) {
    this.#cache.currentlySelectedItemIndex = index;

    focusItemAt({ dropdownListElement: this.#dropdownListElement, index });
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
      this.#containerElement.style.top = `${-this.getHeight(false, true) - cellHeight - 2}px`;

    } else {
      this.#containerElement.style.position = '';
      this.#containerElement.style.top = '';
    }
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
    const maxRenderedItems = this.#cache.entriesCount;
    const actualRenderedItems =
      maxRowsCalculation ? maxRenderedItems : this.#cache.actualRenderedItemsCount ?? maxRenderedItems;
    const entryHeight = this.#getEntryHeight();
    const listHeight = (actualRenderedItems * entryHeight);

    return listHeight;
  }

  /**
   * Gets the height of the search input wrapper.
   *
   * @returns {number} Height of the search input wrapper.
   */
  #getSearchInputWrapperHeight() {
    if (!this.#inputController.enabled) {
      return 0;
    }

    const computedStyle = this.#rootDocument.defaultView.getComputedStyle(this.#containerElement);
    const searchInputWrapperHeight = this.#searchInputWrapper.offsetHeight;
    const separatorHeight =
    this.#separatorElement.offsetHeight + (
      2 * parseInt(computedStyle.getPropertyValue('--ht-menu-vertical-padding'), 10)
    );

    return searchInputWrapperHeight + separatorHeight;
  }

  /**
   * Adds a single row to the dropdown and optionally marks it as checked.
   *
   * @param {object} options Options object.
   * @param {Document} options.rootElement Root document element.
   * @param {string} options.itemKey Key stored in the associated checkbox dataset.
   * @param {string} options.itemValue Text content rendered next to the checkbox.
   * @param {number} options.indexWithinList Index of the item within the list.
   * @param {boolean} [options.checked=false] Flag indicating whether the checkbox starts selected.
   * @param {boolean} [options.disabled=false] Flag indicating whether the checkbox starts disabled.
   */
  #addDropdownItem({ rootElement, itemKey, itemValue, indexWithinList, checked = false, disabled = false }) {
    const itemElement = createListItemElement({
      rootElement,
      itemKey,
      itemValue,
      indexWithinList,
      checked,
      disabled,
    });

    if (checked) {
      selectItem(itemElement);
    }

    this.#registerEvents(itemElement);

    this.#dropdownListElement.appendChild(itemElement);
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
        selectItem(itemElement);
        this.runLocalHooks('afterDropdownItemChecked', checkbox.dataset.key, checkbox.dataset.value);

      } else {
        deselectItem(itemElement);
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
   * Resets the cache.
   */
  #resetCache() {
    this.#cache.visibleRowsNumberSetting = null;
    this.#cache.entriesCount = 0;
    this.#cache.flippedVertically = false;
    this.#cache.currentlySelectedItemIndex = 0;
    this.#cache.checkboxChangeListeners.clear();
    this.#cache.areCheckboxesDisabled = false;
    this.#cache.sourceSortFunction = null;
  }
}

mixin(DropdownController, localHooks);

