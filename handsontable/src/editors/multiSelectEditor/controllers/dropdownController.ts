import { eventTargetEl } from '../../../helpers/dom/element';
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

export type DropdownEntry = { key?: string; value?: string } | string;

interface DropdownControllerCache {
  visibleRowsNumberSetting: number | null;
  entriesCount: number;
  flippedVertically: boolean;
  currentlySelectedItemIndex: number;
  checkboxChangeListeners: Map<HTMLInputElement, { change: () => void; click: (event: Event) => void }>;
  areCheckboxesDisabled: boolean;
  sourceSortFunction: ((entries: DropdownEntry[]) => DropdownEntry[]) | null;
  actualRenderedItemsCount?: number;
}

/**
 * Renders and manages the dropdown list used by the `MultiSelectEditor`.
 * Responsible for rendering checkbox rows and emitting hooks when values change.
 *
 * @private
 * @class DropdownController
 */
export class DropdownController {
  #instanceId: string | null = null;
  #containerElement: HTMLDivElement | null = null;
  #dropdownListElement: HTMLUListElement | null = null;
  #searchInputElement: HTMLInputElement | null = null;
  #separatorElement: HTMLElement | null = null;
  #searchInputWrapper: HTMLDivElement | null = null;
  #inputController: InputController | null = null;
  #rootDocument: Document | null = null;
  #eventManager = new EventManager(this);
  #cache: DropdownControllerCache = {
    visibleRowsNumberSetting: null,
    entriesCount: 0,
    flippedVertically: false,
    currentlySelectedItemIndex: 0,
    checkboxChangeListeners: new Map(),
    areCheckboxesDisabled: false,
    sourceSortFunction: null,
  };

  declare _localHooks: Record<string, Function[]>;
  declare addLocalHook: (key: string, callback: Function) => this;
  declare removeLocalHook: (key: string, callback: Function) => this;
  declare runLocalHooks: (key: string, ...args: unknown[]) => void;
  declare clearLocalHooks: () => this;

  /**
   * Creates a dropdown renderer attached to the provided container.
   *
   * @param {HTMLDivElement} containerElement Host element created by the editor.
   * @param {string} instanceId Handsontable instance id.
   */
  constructor(containerElement: HTMLDivElement, instanceId: string) {
    this.#containerElement = containerElement;
    this.#rootDocument = this.#containerElement.ownerDocument;
    this.#instanceId = instanceId;

    this.init();
  }

  /**
   * Builds required DOM elements and inserts them into the container.
   */
  init(): void {
    if (!this.#rootDocument || !this.#containerElement) {
      return;
    }
    this.#dropdownListElement = createListElement({ root: this.#rootDocument });
    this.#searchInputElement = createSearchInputElement({ root: this.#rootDocument });

    const searchIcon = createSearchIcon({ root: this.#rootDocument });

    this.#searchInputWrapper = createSearchInputWrapper({ root: this.#rootDocument });
    this.#separatorElement = createSeparatorElement({ root: this.#rootDocument });

    this.#searchInputWrapper!.appendChild(searchIcon);
    this.#searchInputWrapper!.appendChild(this.#searchInputElement);
    this.#containerElement.appendChild(this.#searchInputWrapper);
    this.#containerElement.appendChild(this.#separatorElement);
    this.#containerElement.appendChild(this.#dropdownListElement);

    this.#inputController = new InputController({
      input: this.#searchInputElement,
      eventManager: this.#eventManager,
    });
  }

  setVisibleRowsNumberSetting(visibleRowsNumber: number): void {
    this.#cache.visibleRowsNumberSetting = visibleRowsNumber;
  }

  setSourceSortFunction(sourceSortFunction: ((entries: DropdownEntry[]) => DropdownEntry[]) | null): void {
    this.#cache.sourceSortFunction = sourceSortFunction ?? null;
  }

  setSearchInputVisibility(searchInput = true): void {
    if (!this.#searchInputWrapper || !this.#separatorElement || !this.#inputController) {
      return;
    }
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
  fillDropdown(entries: DropdownEntry[], checkedValues: unknown[] = []): void {
    this.removeAllDropdownItems();
    this.#cache.currentlySelectedItemIndex = 0;

    if (!Array.isArray(checkedValues)) {
      checkedValues = [];
    }

    let sortedEntries: DropdownEntry[] = entries;

    if (this.#cache.sourceSortFunction) {
      sortedEntries = this.#cache.sourceSortFunction(entries.slice());
    }

    if (!this.#rootDocument || !this.#dropdownListElement || this.#instanceId === null) {
      return;
    }

    sortedEntries.forEach((elem, indexWithinList) => {
      const itemValue = typeof elem === 'object' && elem !== null && 'value' in elem
        ? (elem as { value?: string }).value
        : elem;

      this.#addDropdownItem({
        rootDocument: this.#rootDocument!,
        itemKey: typeof elem === 'object' && elem !== null && 'key' in elem ? elem.key : undefined,
        itemValue: String(itemValue ?? elem),
        indexWithinList,
        checked: includesValue(checkedValues as unknown[], elem),
        disabled: this.#cache.areCheckboxesDisabled,
      });
    });

    this.#cache.entriesCount = sortedEntries.length;

    this.runLocalHooks('afterDropdownFill');
  }

  /**
   * Controls dropdown height based on entry count and configured visible rows.
   *
   * @param {object} availableSpace Available space object.
   * @param {boolean} noFlip If true, the dropdown will not be flipped vertically.
   */
  updateDimensions(
    availableSpace: { spaceAbove: number; spaceBelow: number; cellHeight: number }, noFlip = false): void {
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

      this.#cache.actualRenderedItemsCount = this.#cache.visibleRowsNumberSetting
        ? Math.min(maxRenderableItems, this.#cache.visibleRowsNumberSetting)
        : maxRenderableItems;
    } else {
      this.#cache.actualRenderedItemsCount = Math.min(
        this.#cache.entriesCount,
        this.#cache.visibleRowsNumberSetting ?? this.#cache.entriesCount
      );
    }

    if (!this.#containerElement) {
      return;
    }

    if (this.#cache.actualRenderedItemsCount && this.#cache.entriesCount > this.#cache.actualRenderedItemsCount) {
      this.#containerElement.style.height = `${this.getHeight()}px`;
    } else {
      this.#containerElement.style.height = '';
    }

    this.#toggleVerticalFlip(availableSpace);

    this.#containerElement.scrollTop = 0;
  }

  getDropdownWidth(): number {
    return this.#dropdownListElement
      ? getDropdownWidth({ dropdownListElement: this.#dropdownListElement })
      : 0;
  }

  deselectAllItems(): void {
    if (this.#dropdownListElement) {
      deselectAllItems({ dropdownListElement: this.#dropdownListElement });
    }
  }

  focusFirstItem(): void {
    if (this.#cache.entriesCount > 0) {
      this.#focusItem(0);
    }
  }

  focusItem(index: number): void {
    this.#focusItem(index);
  }

  focusPreviousItem(): void {
    if (!this.#dropdownListElement) { return; }
    if (this.#cache.currentlySelectedItemIndex === 0) {
      this.focusSearchInput();

      return;
    }
    defocusItem({
      dropdownListElement: this.#dropdownListElement,
      index: this.#cache.currentlySelectedItemIndex,
    });
    this.#focusItem(this.#cache.currentlySelectedItemIndex - 1);
  }

  focusNextItem(): void {
    if (!this.#dropdownListElement) { return; }
    if (this.#cache.currentlySelectedItemIndex === this.#cache.entriesCount - 1) {
      return;
    }
    defocusItem({
      dropdownListElement: this.#dropdownListElement,
      index: this.#cache.currentlySelectedItemIndex,
    });
    this.#focusItem(this.#cache.currentlySelectedItemIndex + 1);
  }

  focusSearchInput(): void {
    if (this.#searchInputElement) {
      this.#searchInputElement.focus();
    }
  }

  reset(): void {
    this.removeAllDropdownItems();
    this.#resetCache();

    if (this.#searchInputElement) {
      this.#searchInputElement.value = '';
    }

    if (this.#containerElement) {
      this.#containerElement.style.position = '';
      this.#containerElement.style.top = '';
      this.#containerElement.style.height = '';
      this.#containerElement.scrollTop = 0;
    }
  }

  isFlippedVertically(): boolean {
    return this.#cache.flippedVertically;
  }

  getHeight(maxRowsCalculation = false, outerWidth = false): number {
    if (!this.#rootDocument || !this.#containerElement) { return 0; }
    const computedStyle = this.#rootDocument.defaultView!.getComputedStyle(this.#containerElement);

    return (
      this.#getListHeight(maxRowsCalculation) +
      this.#getSearchInputWrapperHeight() +
      (outerWidth === true ? 2 * parseInt(computedStyle.getPropertyValue('--ht-menu-vertical-padding'), 10) : 0)
    );
  }

  getInputController(): InputController | null {
    return this.#inputController;
  }

  removeAllDropdownItems(): void {
    if (!this.#dropdownListElement) { return; }
    Array.from(this.#dropdownListElement.children).forEach(itemElement =>
      this.#unregisterEvents(itemElement as HTMLLIElement)
    );
    this.#cache.checkboxChangeListeners.clear();
    this.#dropdownListElement.innerHTML = '';
  }

  disableCheckboxes(): void {
    this.#cache.areCheckboxesDisabled = true;

    if (this.#dropdownListElement) {
      disableUncheckedCheckboxes({ dropdownListElement: this.#dropdownListElement });
    }
  }

  enableCheckboxes(): void {
    this.#cache.areCheckboxesDisabled = false;

    if (this.#dropdownListElement) {
      enableAllCheckboxes({ dropdownListElement: this.#dropdownListElement });
    }
  }

  #focusItem(index: number): void {
    this.#cache.currentlySelectedItemIndex = index;

    if (this.#dropdownListElement) {
      focusItemAt({ dropdownListElement: this.#dropdownListElement, index });
    }
  }

  #requiresFlippingVertically(availableSpace: { spaceAbove: number; spaceBelow: number; cellHeight: number }): boolean {
    const { spaceAbove, spaceBelow, cellHeight } = availableSpace;

    return this.getHeight(true) > spaceBelow && spaceAbove > spaceBelow + cellHeight;
  }

  #toggleVerticalFlip(availableSpace: { cellHeight: number }): void {
    if (!this.#containerElement) { return; }
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

  #getEntryHeight(): number {
    if (!this.#rootDocument || !this.#containerElement) { return 0; }
    const computedStyle = this.#rootDocument.defaultView!.getComputedStyle(this.#containerElement);

    return (
      (2 * parseInt(computedStyle.getPropertyValue('--ht-menu-item-vertical-padding'), 10)) +
      parseInt(computedStyle.getPropertyValue('--ht-line-height'), 10)
    );
  }

  #getListHeight(maxRowsCalculation: boolean): number {
    const maxRenderedItems = this.#cache.entriesCount;
    const actualRenderedItems = maxRowsCalculation
      ? maxRenderedItems
      : this.#cache.actualRenderedItemsCount ?? maxRenderedItems;
    const entryHeight = this.#getEntryHeight();

    return actualRenderedItems * entryHeight;
  }

  #getSearchInputWrapperHeight(): number {
    if (!this.#inputController?.enabled || !this.#searchInputWrapper ||
        !this.#separatorElement || !this.#rootDocument || !this.#containerElement) {
      return 0;
    }
    const computedStyle = this.#rootDocument.defaultView!.getComputedStyle(this.#containerElement);
    const searchInputWrapperHeight = this.#searchInputWrapper.offsetHeight;
    const separatorHeight =
      this.#separatorElement.offsetHeight +
      (2 * parseInt(computedStyle.getPropertyValue('--ht-menu-vertical-padding'), 10));

    return searchInputWrapperHeight + separatorHeight;
  }

  #addDropdownItem({
    rootDocument,
    itemKey,
    itemValue,
    indexWithinList,
    checked = false,
    disabled = false,
  }: {
    rootDocument: Document;
    itemKey?: string;
    itemValue: string;
    indexWithinList: number;
    checked?: boolean;
    disabled?: boolean;
  }): void {
    if (!this.#dropdownListElement || this.#instanceId === null) { return; }
    const itemElement = createListItemElement({
      rootDocument,
      instanceId: this.#instanceId,
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

  #registerEvents(itemElement: HTMLLIElement): void {
    const checkbox = getCheckboxElement(itemElement);

    if (!checkbox || !this.#dropdownListElement) { return; }

    const checkboxChangeListener = () => {
      if (checkbox.dataset.disabled === 'true' && checkbox.checked) {
        checkbox.checked = false;

        return;
      }
      if (checkbox.checked) {
        selectItem(itemElement);
        this.runLocalHooks('afterDropdownItemChecked', checkbox.dataset.key, checkbox.dataset.value);
      } else {
        deselectItem(itemElement);
        this.runLocalHooks('afterDropdownItemUnchecked', checkbox.dataset.key, checkbox.dataset.value);
      }
    };

    const itemClickListener = (event: Event): void => {
      const target = eventTargetEl(event)!;

      if (
        target === checkbox ||
        checkbox.dataset.disabled === 'true' ||
        target.tagName === 'LABEL'
      ) {
        return;
      }
      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change'));
    };

    this.#cache.checkboxChangeListeners.set(checkbox, {
      change: checkboxChangeListener,
      click: itemClickListener,
    });
    this.#eventManager.addEventListener(checkbox, 'change', checkboxChangeListener);
    this.#eventManager.addEventListener(itemElement, 'click', itemClickListener);
  }

  #unregisterEvents(itemElement: HTMLLIElement): void {
    const checkbox = getCheckboxElement(itemElement);

    if (!checkbox) { return; }
    const checkboxListeners = this.#cache.checkboxChangeListeners.get(checkbox);

    if (checkboxListeners) {
      this.#eventManager.removeEventListener(checkbox, 'change', checkboxListeners.change);
      this.#eventManager.removeEventListener(itemElement, 'click', checkboxListeners.click);
      this.#cache.checkboxChangeListeners.delete(checkbox);
    }
  }

  #resetCache(): void {
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
